// Minimal, privacy-first analytics: an in-browser ring buffer only. No network calls,
// no memory text and no coordinates are ever recorded. Swap `send` for a real
// endpoint later if the team adopts one.

export type AnalyticsEvent =
  | "site_opened"
  | "arrival_suggested"
  | "audio_started"
  | "hotspot_opened"
  | "game_completed"
  | "game_skipped"
  | "stamp_earned"
  | "stamp_placed"
  | "memory_submitted";

const KEY = "heirloom:events:v1";
const MAX = 100;

export function track(event: AnalyticsEvent, props: Record<string, string | number | boolean> = {}) {
  const entry = { event, props, at: new Date().toISOString() };
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown[];
    list.push(entry);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  } catch {
    /* storage unavailable: drop silently */
  }
  if (import.meta.env.DEV) console.debug("[analytics]", event, props);
}
