// Minimal PNG encoder plus deterministic noise helpers for procedural textures.
import { deflateSync } from "node:zlib";

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/** Encode RGBA (channels = 4) or RGB (channels = 3) pixels into a PNG buffer. */
export function encodePng(width, height, pixels, channels = 4) {
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Seeded PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value noise on a `period`-cell lattice, sampled at (x, y) in cells. */
export function makeValueNoise(period, seed) {
  const r = rng(seed);
  const grid = new Float32Array(period * period).map(() => r());
  const at = (i, j) => grid[((j % period) + period) % period * period + (((i % period) + period) % period)];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y);
    const fx = smooth(x - i), fy = smooth(y - j);
    const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

/** Tileable leather-grain normal map (RGB PNG). */
export function leatherNormalMap(size = 256, seed = 5) {
  const n1 = makeValueNoise(32, seed);
  const n2 = makeValueNoise(64, seed + 1);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size), v = (y / size);
      // pebbled grain: sharpened cellular-ish bumps from two octaves
      const a = n1(u * 32, v * 32);
      const b = n2(u * 64, v * 64);
      h[y * size + x] = Math.pow(1 - Math.abs(a - 0.5) * 2, 2.2) * 0.7 + b * 0.3;
    }
  }
  const px = new Uint8Array(size * size * 3);
  const strength = 2.2;
  const H = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 3;
      px[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      px[i + 1] = Math.round(((dy / len) * 0.5 + 0.5) * 255);
      px[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
    }
  }
  return encodePng(size, size, px, 3);
}

/** Wood grain base-colour texture (RGB PNG), long grain along v. */
export function woodTexture(w = 256, h = 512, seed = 21) {
  const n = makeValueNoise(16, seed);
  const fine = makeValueNoise(64, seed + 3);
  const px = new Uint8Array(w * h * 3);
  const light = [196, 146, 98], dark = [128, 82, 46];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const warp = n(u * 4, v * 16) * 6;
      const rings = 0.5 + 0.5 * Math.sin((u * 22 + warp) * Math.PI);
      const t = Math.min(1, Math.max(0, rings * 0.75 + fine(u * 64, v * 8) * 0.25));
      const i = (y * w + x) * 3;
      for (let k = 0; k < 3; k++) px[i + k] = Math.round(dark[k] + (light[k] - dark[k]) * t);
    }
  }
  return encodePng(w, h, px, 3);
}
