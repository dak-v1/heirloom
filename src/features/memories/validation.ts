// Client-side checks for memories. They mirror server/validation.mjs so visitors get
// instant feedback; the server still enforces every rule itself.

export const NOTE_MAX = 500;
export const NAME_MAX = 40;
export const DRAWING_MAX_SIDE = 1200;
export const DRAWING_MAX_BYTES = 350 * 1024;

/** Characters as the server counts them (code points, so an emoji counts once). */
export const charCount = (s: string) => [...s].length;

export function validateName(name: string): string | null {
  return charCount(name.trim()) > NAME_MAX ? `Keep your name under ${NAME_MAX} characters.` : null;
}

export function validateNote(text: string, name = ""): string | null {
  const t = text.trim();
  if (!t) return "Write something before sharing your note.";
  if (charCount(t) > NOTE_MAX) return `Keep your note under ${NOTE_MAX} characters.`;
  return validateName(name);
}

/** True when no pixel has been drawn (every alpha value is 0). */
export function isBlankPixels(rgba: Uint8ClampedArray): boolean {
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] !== 0) return false;
  return true;
}

/** Scale (w, h) down to fit within `max` on each side, keeping the ratio. */
export function fitWithin(w: number, h: number, max = DRAWING_MAX_SIDE) {
  const s = Math.min(1, max / w, max / h);
  return { width: Math.round(w * s), height: Math.round(h * s) };
}

/** Decoded byte size of a base64 data URL. */
export function dataUrlBytes(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}
