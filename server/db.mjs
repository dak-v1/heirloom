// SQLite storage for shared memories (node:sqlite, built into Node ≥ 22.13).
// Public reads only ever see `approved` rows; everything else stays private.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export const MEMORY_STATUSES = ["pending", "approved", "rejected", "hidden"];

export function openDatabase(file) {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      guest_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('note', 'drawing')),
      text TEXT,
      title TEXT,
      drawing BLOB,
      photo BLOB,
      photo_mime TEXT,
      display_name TEXT,
      is_sample INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
      moderation_reason TEXT,
      report_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      moderated_at TEXT
    );
    CREATE INDEX IF NOT EXISTS memories_site_status ON memories (site_id, status, created_at);
    CREATE INDEX IF NOT EXISTS memories_guest ON memories (guest_id, created_at);
  `);
  // Additive migration for existing local/server databases created before photo memories.
  for (const [column, type] of [["title", "TEXT"], ["photo", "BLOB"], ["photo_mime", "TEXT"]]) {
    try { db.exec(`ALTER TABLE memories ADD COLUMN ${column} ${type}`); } catch (error) {
      if (!String(error?.message ?? error).includes("duplicate column name")) throw error;
    }
  }
  return db;
}

// Demo contributions, clearly labelled as samples in the app (is_sample = 1). The wording is
// deliberately personal and generic: no dates, names or historical claims.
const SAMPLE_MEMORIES = {
  "thian-hock-keng": [
    "Sample note: the lane outside was full of office lunch crowds, but the courtyard felt like a pause button.",
    "Sample note: I stood under the roof for a long time just looking at the colours and the carved details.",
  ],
  "sri-mariamman-temple": [
    "Sample note: I took my shoes off at the entrance and the stone floor was cool after the hot walk.",
    "Sample note: there was so much to look at on the tower that I kept finding new figures each time I looked up.",
  ],
  "sultan-mosque": [
    "Sample note: the golden dome caught the late afternoon light while we walked down from the street.",
    "Sample note: we shared a drink at a nearby shop afterwards and talked about the places our families come from.",
  ],
};

/** Insert the sample memories once (fixed IDs, so restarts never duplicate them). */
export function seedSampleMemories(db, now = () => new Date()) {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO memories (id, site_id, guest_id, type, text, display_name, is_sample, status, created_at, updated_at)
     VALUES (?, ?, 'sample', 'note', ?, 'Sample visitor', 1, 'approved', ?, ?)`,
  );
  const at = now().toISOString();
  for (const [siteId, notes] of Object.entries(SAMPLE_MEMORIES)) {
    notes.forEach((text, i) => insert.run(`sample_${siteId}_${i + 1}`, siteId, text, at, at));
  }
}

const PUBLIC_COLUMNS = "id, site_id, type, text, title, display_name, is_sample, created_at, CASE WHEN drawing IS NULL THEN 0 ELSE 1 END AS has_drawing, CASE WHEN photo IS NULL THEN 0 ELSE 1 END AS has_photo";

function toPublic(row) {
  return {
    id: row.id,
    siteId: row.site_id,
    type: row.type,
    text: row.text ?? null,
    title: row.title ?? null,
    displayName: row.display_name ?? null,
    isSample: !!row.is_sample,
    drawingUrl: row.has_drawing ? `/api/memories/${row.id}/drawing.png` : null,
    photoUrl: row.has_photo ? `/api/memories/${row.id}/photo` : null,
    createdAt: row.created_at,
  };
}

export function createMemoryRepo(db, { now = () => new Date(), newId }) {
  const insert = db.prepare(
    `INSERT INTO memories (id, site_id, guest_id, type, text, title, drawing, photo, photo_mime, display_name, is_sample, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const approvedForSite = db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM memories WHERE site_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT ?`);
  const byGuest = db.prepare(`SELECT ${PUBLIC_COLUMNS}, status FROM memories WHERE guest_id = ? ORDER BY created_at DESC LIMIT 50`);
  const byStatus = db.prepare(`SELECT ${PUBLIC_COLUMNS}, status, report_count, guest_id FROM memories WHERE status = ? ORDER BY created_at ASC LIMIT 200`);
  const drawing = db.prepare(`SELECT drawing, status, guest_id FROM memories WHERE id = ?`);
  const photo = db.prepare(`SELECT photo, photo_mime, status, guest_id FROM memories WHERE id = ?`);
  const setStatus = db.prepare(`UPDATE memories SET status = ?, moderation_reason = ?, moderated_at = ?, updated_at = ? WHERE id = ?`);
  const report = db.prepare(
    `UPDATE memories SET report_count = report_count + 1,
       status = CASE WHEN status = 'approved' AND report_count + 1 >= ? THEN 'hidden' ELSE status END,
       updated_at = ?
     WHERE id = ? AND status = 'approved'`,
  );

  return {
    create({ siteId, guestId, type, text, title, drawingPng, photoBytes, photoMime, displayName, isSample = false, status = "pending" }) {
      const id = newId();
      const at = now().toISOString();
      insert.run(id, siteId, guestId, type, text ?? null, title ?? null, drawingPng ?? null, photoBytes ?? null, photoMime ?? null, displayName ?? null, isSample ? 1 : 0, status, at, at);
      return { id, status, createdAt: at };
    },
    listApproved(siteId, limit = 60) {
      return approvedForSite.all(siteId, limit).map(toPublic);
    },
    listForGuest(guestId) {
      // Visitors see their own submissions' status, never the moderation reason.
      return byGuest.all(guestId).map((r) => ({ ...toPublic(r), status: r.status }));
    },
    listByStatus(status) {
      return byStatus.all(status).map((r) => ({ ...toPublic(r), status: r.status, reportCount: r.report_count }));
    },
    getDrawing(id) {
      return drawing.get(id) ?? null;
    },
    getPhoto(id) {
      return photo.get(id) ?? null;
    },
    moderate(id, status, reason = null) {
      const at = now().toISOString();
      const res = setStatus.run(status, reason, at, at, id);
      return res.changes > 0;
    },
    report(id, hideAfter = 3) {
      const res = report.run(hideAfter, now().toISOString(), id);
      return res.changes > 0;
    },
  };
}
