// Heirloom API. Guest identity, shared-memory storage with enforced moderation,
// and (in production) static hosting of the built app.
import express from "express";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { createMemoryRepo, MEMORY_STATUSES, openDatabase, seedSampleMemories } from "./db.mjs";
import { createPostgresMemoryRepo } from "./db-postgres.mjs";
import { ValidationError, validateSubmission, LIMITS, SITE_IDS } from "./validation.mjs";

function rateLimiter({ limit, windowMs }) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (list.length >= limit) {
      hits.set(key, list);
      return false;
    }
    list.push(now);
    hits.set(key, list);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    return true;
  };
}

export function createApp({
  dbFile = ":memory:",
  databaseUrl = process.env.HEIRLOOM_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || "",
  adminToken = process.env.HEIRLOOM_ADMIN_TOKEN || "",
  guestSecret = process.env.HEIRLOOM_GUEST_SECRET || "",
  staticDir = null,
  now = () => new Date(),
  // Limits are keyed per guest. The per-IP limits are only a generous backstop, because a
  // whole room on one venue Wi-Fi shares a single IP.
  submitLimit = { limit: 5, windowMs: 10 * 60 * 1000 },
  ipSubmitLimit = { limit: 120, windowMs: 10 * 60 * 1000 },
  registerLimit = { limit: 300, windowMs: 60 * 60 * 1000 },
  seedSamples = true,
} = {}) {
  const secret = guestSecret || databaseUrl || randomUUID() + randomUUID();
  const db = databaseUrl ? null : openDatabase(dbFile);
  if (db && seedSamples) seedSampleMemories(db, now);
  const memories = databaseUrl
    ? createPostgresMemoryRepo({ connectionString: databaseUrl, now, newId: () => "mem_" + randomUUID(), seedSamples })
    : createMemoryRepo(db, { now, newId: () => "mem_" + randomUUID() });
  const canSubmit = rateLimiter(submitLimit);
  const canSubmitFromIp = rateLimiter(ipSubmitLimit);
  const canReport = rateLimiter({ limit: 20, windowMs: 60 * 60 * 1000 });
  const canRegister = rateLimiter(registerLimit);
  // One report per guest per memory, so a single visitor can't hide a memory alone.
  const reported = new Set();

  const sign = (guestId) => createHmac("sha256", secret).update(guestId).digest("base64url");
  const verifyGuest = (req) => {
    const header = req.get("x-heirloom-guest") || "";
    const [guestId, sig] = header.split(".");
    if (!guestId || !sig || !/^g_[0-9a-f-]{36}$/.test(guestId)) return null;
    const expected = Buffer.from(sign(guestId));
    const given = Buffer.from(sig);
    return expected.length === given.length && timingSafeEqual(expected, given) ? guestId : null;
  };
  const isAdmin = (req) => {
    if (!adminToken) return false;
    const given = Buffer.from((req.get("authorization") || "").replace(/^Bearer\s+/i, ""));
    const expected = Buffer.from(adminToken);
    return given.length === expected.length && timingSafeEqual(given, expected);
  };

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "geolocation=(self), camera=(self), microphone=()",
    });
    next();
  });
  app.use("/api", express.json({ limit: "800kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      memories: { storage: databaseUrl ? "postgres" : "sqlite", moderation: adminToken ? "configured" : "not-configured", limits: LIMITS },
      narration: { pregenerationConfigured: Boolean(process.env.ELEVENLABS_API_KEY) },
    });
  });

  /** Issue an anonymous guest identity. The signature stops one visitor posing as another. */
  app.post("/api/guest", (req, res) => {
    if (!canRegister(req.ip)) return res.status(429).json({ error: "Too many requests. Try again later." });
    const guestId = "g_" + randomUUID();
    res.status(201).json({ guestId, token: `${guestId}.${sign(guestId)}` });
  });

  app.post("/api/memories", async (req, res) => {
    const guestId = verifyGuest(req);
    if (!guestId) return res.status(401).json({ error: "Missing or invalid guest token." });
    if (!canSubmit(guestId) || !canSubmitFromIp(req.ip)) {
      return res.status(429).json({ error: "You have shared several memories recently. Please try again in a few minutes." });
    }
    try {
      const input = validateSubmission(req.body);
      const created = await memories.create({ ...input, guestId, status: "pending" });
      res.status(201).json({ id: created.id, status: created.status, createdAt: created.createdAt });
    } catch (e) {
      if (e instanceof ValidationError) return res.status(400).json({ error: e.message });
      throw e;
    }
  });

  app.get("/api/sites/:siteId/memories", async (req, res) => {
    if (!SITE_IDS.includes(req.params.siteId)) return res.status(404).json({ error: "Unknown site." });
    res.json({ memories: await memories.listApproved(req.params.siteId) });
  });

  app.get("/api/me/memories", async (req, res) => {
    const guestId = verifyGuest(req);
    if (!guestId) return res.status(401).json({ error: "Missing or invalid guest token." });
    res.json({ memories: await memories.listForGuest(guestId) });
  });

  app.get("/api/memories/:id/drawing.png", async (req, res) => {
    const row = await memories.getDrawing(req.params.id);
    const guestId = verifyGuest(req);
    if (!row || !row.drawing || (row.status !== "approved" && !isAdmin(req) && guestId !== row.guest_id)) return res.status(404).end();
    res.set({ "Content-Type": "image/png", "Content-Security-Policy": "default-src 'none'", "Cache-Control": row.status === "approved" ? "public, max-age=300" : "private, no-store" });
    res.send(Buffer.from(row.drawing));
  });

  app.get("/api/memories/:id/photo", async (req, res) => {
    const row = await memories.getPhoto(req.params.id);
    const guestId = verifyGuest(req);
    if (!row || !row.photo || (row.status !== "approved" && !isAdmin(req) && guestId !== row.guest_id)) return res.status(404).end();
    res.set({ "Content-Type": row.photo_mime || "image/jpeg", "Content-Security-Policy": "default-src 'none'", "Cache-Control": row.status === "approved" ? "public, max-age=300" : "private, no-store" });
    res.send(Buffer.from(row.photo));
  });

  app.post("/api/memories/:id/report", async (req, res) => {
    const key = verifyGuest(req) ?? `ip:${req.ip}`;
    const once = `${key}:${req.params.id}`;
    if (reported.has(once)) return res.status(202).json({ ok: true });
    if (!canReport(key)) return res.status(429).json({ error: "Too many reports." });
    reported.add(once);
    if (reported.size > 20000) reported.clear();
    await memories.report(req.params.id);
    res.status(202).json({ ok: true });
  });

  /* ---------- moderation (requires HEIRLOOM_ADMIN_TOKEN) ---------- */
  const requireAdmin = (req, res, next) => {
    if (!adminToken) return res.status(503).json({ error: "Moderation is not configured on this server." });
    if (!isAdmin(req)) return res.status(401).json({ error: "Moderator token required." });
    next();
  };

  app.get("/api/admin/memories", requireAdmin, async (req, res) => {
    const status = MEMORY_STATUSES.includes(req.query.status) ? req.query.status : "pending";
    res.json({ memories: await memories.listByStatus(status) });
  });

  for (const [action, status] of [["approve", "approved"], ["reject", "rejected"], ["hide", "hidden"]]) {
    app.post(`/api/admin/memories/:id/${action}`, requireAdmin, async (req, res) => {
      const reason = typeof req.body?.reason === "string" ? req.body.reason.slice(0, 300) : null;
      if (!await memories.moderate(req.params.id, status, reason)) return res.status(404).json({ error: "Memory not found." });
      res.json({ id: req.params.id, status });
    });
  }

  app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir, { index: false, maxAge: "1h" }));
    app.get("/{*splat}", (req, res) => res.sendFile(path.join(staticDir, "index.html")));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err?.type === "entity.too.large") return res.status(413).json({ error: "That submission is too large." });
    if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Malformed JSON." });
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  });

  return { app, db };
}
