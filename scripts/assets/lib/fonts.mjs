// Text-to-path helpers for the asset pipeline.
// Shapes text with HarfBuzz (correct Tamil, Jawi/Arabic and CJK rendering) and
// emits plain SVG path data, so generated SVGs never depend on installed fonts.
import { readFileSync, readdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { createRequire } from "node:module";
import path from "node:path";
import * as hb from "harfbuzzjs";

const require = createRequire(import.meta.url);
const fontsourceDir = (pkg) => path.dirname(require.resolve(`${pkg}/package.json`));

/** Convert a WOFF 1.0 file into a plain sfnt (TTF/OTF) buffer that HarfBuzz can read. */
export function woffToSfnt(woff) {
  const dv = new DataView(woff.buffer, woff.byteOffset, woff.byteLength);
  if (dv.getUint32(0) !== 0x774f4646) return woff; // not WOFF: assume already sfnt
  const flavor = dv.getUint32(4);
  const numTables = dv.getUint16(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = dv.getUint32(o);
    const offset = dv.getUint32(o + 4);
    const compLength = dv.getUint32(o + 8);
    const origLength = dv.getUint32(o + 12);
    const checksum = dv.getUint32(o + 16);
    const raw = woff.subarray(offset, offset + compLength);
    const data = compLength < origLength ? inflateSync(raw) : raw;
    tables.push({ tag, checksum, data });
  }
  const headerSize = 12 + numTables * 16;
  let size = headerSize;
  for (const t of tables) size += (t.data.length + 3) & ~3;
  const out = new Uint8Array(size);
  const ov = new DataView(out.buffer);
  let entrySelector = 0;
  while (1 << (entrySelector + 1) <= numTables) entrySelector++;
  const searchRange = (1 << entrySelector) * 16;
  ov.setUint32(0, flavor);
  ov.setUint16(4, numTables);
  ov.setUint16(6, searchRange);
  ov.setUint16(8, entrySelector);
  ov.setUint16(10, numTables * 16 - searchRange);
  let offset = headerSize;
  tables.forEach((t, i) => {
    const r = 12 + i * 16;
    ov.setUint32(r, t.tag);
    ov.setUint32(r + 4, t.checksum);
    ov.setUint32(r + 8, offset);
    ov.setUint32(r + 12, t.data.length);
    out.set(t.data, offset);
    offset += (t.data.length + 3) & ~3;
  });
  return out;
}

const cache = new Map();
function loadFontFile(file) {
  if (cache.has(file)) return cache.get(file);
  const sfnt = woffToSfnt(new Uint8Array(readFileSync(file)));
  const blob = new hb.Blob(sfnt);
  const face = new hb.Face(blob, 0);
  const font = new hb.Font(face);
  const upem = face.upem ?? 1000;
  font.setScale(upem, upem);
  const entry = { font, face, upem, file };
  cache.set(file, entry);
  return entry;
}

/** Parse fontsource CSS to find which unicode-range chunk file contains every code point of `text`. */
function chunkFor(pkg, family, weight, text) {
  const dir = fontsourceDir(pkg);
  const css = readFileSync(path.join(dir, `${weight}.css`), "utf8");
  const blocks = css.split("@font-face").slice(1);
  const cps = [...text].map((c) => c.codePointAt(0)).filter((c) => c > 0x20);
  const files = new Set();
  for (const cp of cps) {
    let found = null;
    for (const b of blocks) {
      const range = /unicode-range:\s*([^;]+);/.exec(b)?.[1];
      const url = /url\(\.\/files\/([^)]+\.woff)\)/.exec(b)?.[1];
      if (!range || !url) continue;
      const hit = range.split(",").some((part) => {
        const p = part.trim().replace(/^U\+/i, "");
        if (p.includes("-")) {
          const [a, z] = p.split("-").map((h) => parseInt(h, 16));
          return cp >= a && cp <= z;
        }
        if (p.includes("?")) {
          const a = parseInt(p.replace(/\?/g, "0"), 16);
          const z = parseInt(p.replace(/\?/g, "F"), 16);
          return cp >= a && cp <= z;
        }
        return parseInt(p, 16) === cp;
      });
      if (hit) { found = url; break; }
    }
    if (!found) throw new Error(`${family}: no chunk covers U+${cp.toString(16)}`);
    files.add(found);
  }
  if (files.size > 1) throw new Error(`${family}: "${text}" spans several chunks (${[...files].join(", ")}); split the string`);
  return path.join(dir, "files", [...files][0] ?? readdirSync(path.join(dir, "files")).find((f) => f.endsWith(`-${weight}-normal.woff`)));
}

export const FONTS = {
  display: (weight = 700) => path.join(fontsourceDir("@fontsource/fraunces"), "files", `fraunces-latin-${weight}-normal.woff`),
  displayItalic: (weight = 400) => path.join(fontsourceDir("@fontsource/fraunces"), "files", `fraunces-latin-${weight}-italic.woff`),
  cjk: (text, weight = 700) => chunkFor("@fontsource/noto-serif-sc", "Noto Serif SC", weight, text),
  jawi: (weight = 700) => path.join(fontsourceDir("@fontsource/noto-naskh-arabic"), "files", `noto-naskh-arabic-arabic-${weight}-normal.woff`),
  tamil: (weight = 700) => path.join(fontsourceDir("@fontsource/noto-serif-tamil"), "files", `noto-serif-tamil-tamil-${weight}-normal.woff`),
  script: (weight = 700) => path.join(fontsourceDir("@fontsource/caveat"), "files", `caveat-latin-${weight}-normal.woff`),
};

/**
 * Shape `text` and return SVG path data positioned at (x, y) baseline.
 * size: font size in SVG units. anchor: start | middle | end. tracking: extra space per glyph in em.
 */
export function textPath(text, { file, size, x = 0, y = 0, anchor = "start", tracking = 0, features = [] }) {
  const { font, upem } = loadFontFile(file);
  const buf = new hb.Buffer();
  buf.addText(text);
  buf.guessSegmentProperties();
  hb.shape(font, buf, features);
  const glyphs = buf.getGlyphInfosAndPositions();
  const s = size / upem;
  const track = tracking * upem;
  let advance = 0;
  for (const g of glyphs) advance += g.xAdvance + track;
  advance -= track;
  const width = advance * s;
  let pen = anchor === "middle" ? -advance / 2 : anchor === "end" ? -advance : 0;
  const parts = [];
  for (const g of glyphs) {
    const cmds = font.glyphToJson(g.codepoint);
    const ox = pen + g.xOffset;
    const oy = g.yOffset;
    const tx = (vx) => +(x + (vx + ox) * s).toFixed(2);
    const ty = (vy) => +(y - (vy + oy) * s).toFixed(2);
    for (const c of cmds) {
      const v = c.values;
      if (c.type === "Z") { parts.push("Z"); continue; }
      const pts = [];
      for (let i = 0; i < v.length; i += 2) pts.push(tx(v[i]), ty(v[i + 1]));
      parts.push(c.type + pts.join(" "));
    }
    pen += g.xAdvance + track;
  }
  buf.destroy?.();
  return { d: parts.join(""), width };
}

/**
 * CJK text: fontsource splits Noto Serif SC into unicode-range chunks, so shape
 * each ideograph with the chunk that contains it (no cross-glyph shaping needed).
 */
export function cjkPath(text, { size, x = 0, y = 0, anchor = "start", tracking = 0, weight = 700 }) {
  const chars = [...text];
  const pieces = chars.map((ch) => (ch === " " ? { space: true } : { ch, file: FONTS.cjk(ch, weight) }));
  const widths = pieces.map((p) => (p.space ? size * 0.5 : textPath(p.ch, { file: p.file, size }).width));
  const total = widths.reduce((a, b) => a + b, 0) + tracking * size * (chars.length - 1);
  let pen = anchor === "middle" ? x - total / 2 : anchor === "end" ? x - total : x;
  const parts = [];
  pieces.forEach((p, i) => {
    if (!p.space) parts.push(textPath(p.ch, { file: p.file, size, x: pen, y }).d);
    pen += widths[i] + tracking * size;
  });
  return { d: parts.join(""), width: total };
}
