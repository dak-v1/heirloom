// Input validation for public endpoints. Text is stored as plain text and must be
// rendered as text (never HTML); drawings must be small, genuine PNGs.

export const LIMITS = {
  noteChars: 500,
  nameChars: 40,
  titleChars: 80,
  photoBytes: 400 * 1024,
  photoMaxSide: 1280,
  drawingBytes: 350 * 1024,
  drawingMaxSide: 1200,
};

// Keep in sync with src/content/sites (tests/server.test.mjs checks this).
export const SITE_IDS = ["thian-hock-keng", "sri-mariamman-temple", "sultan-mosque"];

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

export function cleanText(value, max) {
  if (typeof value !== "string") return null;
  const t = value.replace(CONTROL, "").replace(/\r\n?/g, "\n").trim();
  if (!t) return null;
  if ([...t].length > max) throw new ValidationError(`Too long: keep it under ${max} characters.`);
  return t;
}

export class ValidationError extends Error {
  status = 400;
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function decodeDrawing(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) {
    throw new ValidationError("Drawings must be PNG images.");
  }
  const b64 = dataUrl.slice("data:image/png;base64,".length);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw new ValidationError("Drawing data is not valid base64.");
  const buf = Buffer.from(b64, "base64");
  if (buf.length > LIMITS.drawingBytes) throw new ValidationError("That drawing is too large.");
  if (buf.length < 33 || !PNG_SIG.every((b, i) => buf[i] === b) || buf.toString("ascii", 12, 16) !== "IHDR") {
    throw new ValidationError("Drawing is not a valid PNG file.");
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!width || !height || width > LIMITS.drawingMaxSide || height > LIMITS.drawingMaxSide) {
    throw new ValidationError(`Drawings must be at most ${LIMITS.drawingMaxSide}px on each side.`);
  }
  return buf;
}

export function decodePhoto(dataUrl) {
  const prefix = "data:image/jpeg;base64,";
  if (typeof dataUrl !== "string" || !dataUrl.startsWith(prefix)) throw new ValidationError("Photos must be compressed JPEG images.");
  const b64 = dataUrl.slice(prefix.length);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw new ValidationError("Photo data is not valid base64.");
  const buf = Buffer.from(b64, "base64");
  if (buf.length > LIMITS.photoBytes) throw new ValidationError("Keep the compressed photo under 400 KB.");
  if (buf.length < 16 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf.at(-2) !== 0xff || buf.at(-1) !== 0xd9) {
    throw new ValidationError("That photo isn't a valid JPEG image.");
  }
  let width = 0, height = 0, offset = 2;
  const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) { offset++; continue; }
    const marker = buf[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const size = buf.readUInt16BE(offset + 2);
    if (size < 2 || offset + size + 2 > buf.length) break;
    if (sof.has(marker)) {
      height = buf.readUInt16BE(offset + 5);
      width = buf.readUInt16BE(offset + 7);
      break;
    }
    offset += size + 2;
  }
  if (!width || !height || width > LIMITS.photoMaxSide || height > LIMITS.photoMaxSide) {
    throw new ValidationError(`Photos must be no larger than ${LIMITS.photoMaxSide}px on either side.`);
  }
  return buf;
}

export function validateSubmission(body) {
  if (!body || typeof body !== "object") throw new ValidationError("Missing submission.");
  const { siteId, type } = body;
  if (!SITE_IDS.includes(siteId)) throw new ValidationError("Unknown site.");
  if (type !== "note" && type !== "drawing") throw new ValidationError("Type must be 'note' or 'drawing'.");
  const displayName = cleanText(body.displayName, LIMITS.nameChars);
  const title = cleanText(body.title, LIMITS.titleChars);
  const text = cleanText(body.text, LIMITS.noteChars);
  if (type === "note") {
    if (!text) throw new ValidationError("Write something before sharing your note.");
    return { siteId, type, text, title, displayName, drawingPng: null, photoBytes: body.photo ? decodePhoto(body.photo) : null, photoMime: body.photo ? "image/jpeg" : null };
  }
  if (body.photo) throw new ValidationError("Add a photo to a written memory, not a drawing.");
  const drawingPng = decodeDrawing(body.drawing);
  return { siteId, type, text, title, displayName, drawingPng, photoBytes: null, photoMime: null };
}
