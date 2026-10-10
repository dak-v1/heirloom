// Client for the shared-memories API (server/app.mjs). The storage, guest identity
// and moderation rules are implemented and tested; the composer, wall and
// moderation UI are Stage 2 work.
//
// Rules the server enforces (not the browser): new submissions are always
// `pending`; only `approved` memories are returned publicly; approving requires
// the moderator token; notes are plain text (render as text, never HTML).

export type MemoryType = "note" | "drawing";

export interface MemoryDraft {
  type: MemoryType;
  text?: string;
  /** PNG data URL from the drawing canvas. */
  drawing?: string;
  displayName?: string;
}

export interface PublicMemory {
  id: string;
  siteId: string;
  type: MemoryType;
  text: string | null;
  displayName: string | null;
  isSample: boolean;
  drawingUrl: string | null;
  createdAt: string;
}

export interface OwnMemory extends PublicMemory {
  status: "pending" | "approved" | "rejected" | "hidden";
}

export class MemoryApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const TOKEN_KEY = "heirloom:guest-token:v1";

async function guestToken(forceNew = false): Promise<string> {
  if (!forceNew) {
    try {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (saved) return saved;
    } catch {
      /* storage blocked: fall through and register for this session */
    }
  }
  const r = await fetch("/api/guest", { method: "POST" });
  if (!r.ok) throw new MemoryApiError("Could not reach the memories service.", r.status);
  const { token } = (await r.json()) as { token: string };
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
  return token;
}

async function call<T>(url: string, init: RequestInit = {}, auth = false, retried = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (auth) headers.set("x-heirloom-guest", await guestToken());
  if (init.body) headers.set("content-type", "application/json");
  let r: Response;
  try {
    r = await fetch(url, { ...init, headers });
  } catch {
    throw new MemoryApiError("You appear to be offline. Your draft is kept on this device.", 0);
  }
  if (r.status === 401 && auth && !retried) {
    await guestToken(true); // server restarted with a new secret: re-register once
    return call<T>(url, init, auth, true);
  }
  const body = (await r.json().catch(() => ({}))) as { error?: string } & T;
  if (!r.ok) throw new MemoryApiError(body.error ?? "Something went wrong.", r.status);
  return body;
}

/** Submit a validated note or drawing. It is stored as `pending` until a moderator approves it. */
export function submitMemory(siteId: string, draft: MemoryDraft) {
  return call<{ id: string; status: "pending"; createdAt: string }>("/api/memories", { method: "POST", body: JSON.stringify({ siteId, ...draft }) }, true);
}

/** Only approved, public memories for one site. */
export async function getApprovedMemories(siteId: string): Promise<PublicMemory[]> {
  return (await call<{ memories: PublicMemory[] }>(`/api/sites/${encodeURIComponent(siteId)}/memories`)).memories;
}

/** True once this browser has a guest identity (i.e. it may have submissions of its own). */
export function hasGuestToken() {
  try {
    return !!localStorage.getItem(TOKEN_KEY);
  } catch {
    return false;
  }
}

/** This guest's own submissions with their moderation status. */
export async function getMyMemories(): Promise<OwnMemory[]> {
  return (await call<{ memories: OwnMemory[] }>("/api/me/memories", {}, true)).memories;
}

export function reportMemory(memoryId: string) {
  return call<{ ok: true }>(`/api/memories/${encodeURIComponent(memoryId)}/report`, { method: "POST" }, true);
}

/* ---------- moderation (/admin). The token is passed per call and never logged or stored here. ---------- */

export type ModerationStatus = OwnMemory["status"];

export interface ModerationItem extends OwnMemory {
  reportCount: number;
}

const adminHeaders = (token: string) => ({ authorization: `Bearer ${token}` });

export async function adminListMemories(token: string, status: ModerationStatus = "pending"): Promise<ModerationItem[]> {
  return (await call<{ memories: ModerationItem[] }>(`/api/admin/memories?status=${status}`, { headers: adminHeaders(token) })).memories;
}

export function adminModerate(token: string, memoryId: string, action: "approve" | "reject" | "hide") {
  return call<{ id: string; status: ModerationStatus }>(`/api/admin/memories/${encodeURIComponent(memoryId)}/${action}`, {
    method: "POST",
    headers: adminHeaders(token),
    body: "{}",
  });
}

/** Drawings that aren't approved yet need the moderator token, which an <img> can't send: fetch and return an object URL. */
export async function adminDrawingUrl(token: string, memoryId: string): Promise<string> {
  let r: Response;
  try {
    r = await fetch(`/api/memories/${encodeURIComponent(memoryId)}/drawing.png`, { headers: adminHeaders(token) });
  } catch {
    throw new MemoryApiError("You appear to be offline.", 0);
  }
  if (!r.ok) throw new MemoryApiError("Drawing unavailable.", r.status);
  return URL.createObjectURL(await r.blob());
}
