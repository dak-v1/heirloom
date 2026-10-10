import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../server/app.mjs";
import { LIMITS, SITE_IDS } from "../server/validation.mjs";
import { DRAWING_MAX_BYTES, DRAWING_MAX_SIDE, NAME_MAX, NOTE_MAX } from "../src/features/memories/validation.ts";
import { SITES } from "../src/content/sites/index.ts";
import { deflateSync } from "node:zlib";

const ADMIN = "test-admin-token-123";
let server;
let base;

function tinyPng(w = 4, h = 4) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b) => {
    let c = 0xffffffff;
    for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, "ascii");
    data.copy(out, 8);
    out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

async function guest() {
  const r = await fetch(`${base}/api/guest`, { method: "POST" });
  return (await r.json()).token;
}
const post = (url, body, headers = {}) => fetch(`${base}${url}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

beforeAll(async () => {
  const { app } = createApp({ dbFile: ":memory:", adminToken: ADMIN, guestSecret: "secret", submitLimit: { limit: 50, windowMs: 60_000 } });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server?.close());

describe("memories API", () => {
  it("keeps the server site list in sync with curated content", () => {
    expect([...SITE_IDS].sort()).toEqual(SITES.map((s) => s.id).sort());
  });

  it("keeps the composer's limits in sync with the server's", () => {
    expect({ NOTE_MAX, NAME_MAX, DRAWING_MAX_BYTES, DRAWING_MAX_SIDE }).toEqual({
      NOTE_MAX: LIMITS.noteChars,
      NAME_MAX: LIMITS.nameChars,
      DRAWING_MAX_BYTES: LIMITS.drawingBytes,
      DRAWING_MAX_SIDE: LIMITS.drawingMaxSide,
    });
  });

  it("requires a valid guest token to submit", async () => {
    const r = await post("/api/memories", { siteId: "sultan-mosque", type: "note", text: "Hello" }, { "x-heirloom-guest": "g_00000000-0000-0000-0000-000000000000.forged" });
    expect(r.status).toBe(401);
  });

  it("stores new notes as pending and keeps them off the public wall until approved", async () => {
    const token = await guest();
    const r = await post("/api/memories", { siteId: "sultan-mosque", type: "note", text: "  My grandmother bought batik near here.  ", displayName: "Aisyah" }, { "x-heirloom-guest": token });
    expect(r.status).toBe(201);
    const { id, status } = await r.json();
    expect(status).toBe("pending");

    let wall = await (await fetch(`${base}/api/sites/sultan-mosque/memories`)).json();
    expect(wall.memories.find((m) => m.id === id)).toBeUndefined();

    const mine = await (await fetch(`${base}/api/me/memories`, { headers: { "x-heirloom-guest": token } })).json();
    expect(mine.memories[0]).toMatchObject({ id, status: "pending" });
    expect(mine.memories[0].moderationReason).toBeUndefined();

    expect((await post(`/api/admin/memories/${id}/approve`, {})).status).toBe(401);
    expect((await post(`/api/admin/memories/${id}/approve`, {}, { authorization: `Bearer ${ADMIN}` })).status).toBe(200);

    wall = await (await fetch(`${base}/api/sites/sultan-mosque/memories`)).json();
    expect(wall.memories.find((m) => m.id === id)).toMatchObject({ text: "My grandmother bought batik near here.", displayName: "Aisyah" });
    const other = await (await fetch(`${base}/api/sites/thian-hock-keng/memories`)).json();
    expect(other.memories.find((m) => m.id === id)).toBeUndefined();
  });

  it("validates input", async () => {
    const token = await guest();
    const h = { "x-heirloom-guest": token };
    expect((await post("/api/memories", { siteId: "nowhere", type: "note", text: "x" }, h)).status).toBe(400);
    expect((await post("/api/memories", { siteId: "sultan-mosque", type: "note", text: "   " }, h)).status).toBe(400);
    expect((await post("/api/memories", { siteId: "sultan-mosque", type: "note", text: "x".repeat(501) }, h)).status).toBe(400);
    expect((await post("/api/memories", { siteId: "sultan-mosque", type: "drawing", drawing: "data:image/svg+xml;base64,PHN2Zy8+" }, h)).status).toBe(400);
    expect((await post("/api/memories", { siteId: "sultan-mosque", type: "drawing", drawing: "data:image/png;base64," + Buffer.from("not a png at all, really not").toString("base64") }, h)).status).toBe(400);
  });

  it("serves drawings only once approved", async () => {
    const token = await guest();
    const r = await post("/api/memories", { siteId: "thian-hock-keng", type: "drawing", drawing: "data:image/png;base64," + tinyPng().toString("base64") }, { "x-heirloom-guest": token });
    expect(r.status).toBe(201);
    const { id } = await r.json();
    expect((await fetch(`${base}/api/memories/${id}/drawing.png`)).status).toBe(404);
    await post(`/api/admin/memories/${id}/approve`, {}, { authorization: `Bearer ${ADMIN}` });
    const img = await fetch(`${base}/api/memories/${id}/drawing.png`);
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/png");
  });

  it("seeds labelled sample memories, each only on its own site's wall", async () => {
    for (const siteId of SITE_IDS) {
      const wall = await (await fetch(`${base}/api/sites/${siteId}/memories`)).json();
      const samples = wall.memories.filter((m) => m.isSample);
      expect(samples.length).toBeGreaterThanOrEqual(2);
      expect(samples.every((m) => m.siteId === siteId && m.displayName === "Sample visitor" && m.text.startsWith("Sample note:"))).toBe(true);
    }
  });

  it("lists the moderation queue only for moderators", async () => {
    expect((await fetch(`${base}/api/admin/memories`)).status).toBe(401);
    const q = await fetch(`${base}/api/admin/memories?status=pending`, { headers: { authorization: `Bearer ${ADMIN}` } });
    expect(q.status).toBe(200);
  });
});

describe("memory rate limits", () => {
  let srv;
  let url;
  beforeAll(async () => {
    // Small limits so the test is quick: 2 per guest, 5 per IP backstop.
    const { app } = createApp({ dbFile: ":memory:", adminToken: ADMIN, guestSecret: "secret", submitLimit: { limit: 2, windowMs: 60_000 }, ipSubmitLimit: { limit: 5, windowMs: 60_000 } });
    await new Promise((resolve) => {
      srv = app.listen(0, resolve);
    });
    url = `http://127.0.0.1:${srv.address().port}`;
  });
  afterAll(() => srv?.close());

  const submit = (token) =>
    fetch(`${url}/api/memories`, { method: "POST", headers: { "content-type": "application/json", "x-heirloom-guest": token }, body: JSON.stringify({ siteId: "sultan-mosque", type: "note", text: "Hello" }) });
  const newGuest = async () => (await (await fetch(`${url}/api/guest`, { method: "POST" })).json()).token;

  it("limits each guest separately, so visitors sharing one Wi-Fi can all submit", async () => {
    const a = await newGuest();
    const b = await newGuest();
    expect((await submit(a)).status).toBe(201);
    expect((await submit(a)).status).toBe(201);
    expect((await submit(a)).status).toBe(429);
    expect((await submit(b)).status).toBe(201);
    expect((await submit(b)).status).toBe(201);
  });

  it("still applies a per-IP backstop", async () => {
    // 4 accepted so far from this IP; one more fits, then the backstop applies.
    expect((await submit(await newGuest())).status).toBe(201);
    expect((await submit(await newGuest())).status).toBe(429);
  });

  it("counts one report per guest per memory", async () => {
    const { app } = createApp({ dbFile: ":memory:", adminToken: ADMIN, guestSecret: "secret" });
    const s2 = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const u = `http://127.0.0.1:${s2.address().port}`;
    const g = async () => (await (await fetch(`${u}/api/guest`, { method: "POST" })).json()).token;
    const tok = await g();
    const { id } = await (await fetch(`${u}/api/memories`, { method: "POST", headers: { "content-type": "application/json", "x-heirloom-guest": tok }, body: JSON.stringify({ siteId: "sultan-mosque", type: "note", text: "Hi" }) })).json();
    await fetch(`${u}/api/admin/memories/${id}/approve`, { method: "POST", headers: { authorization: `Bearer ${ADMIN}` } });
    const reporter = await g();
    for (let i = 0; i < 3; i++) await fetch(`${u}/api/memories/${id}/report`, { method: "POST", headers: { "x-heirloom-guest": reporter } });
    const wall = await (await fetch(`${u}/api/sites/sultan-mosque/memories`)).json();
    expect(wall.memories.find((m) => m.id === id)).toBeDefined();
    s2.close();
  });
});
