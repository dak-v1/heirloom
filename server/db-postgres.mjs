// Persistent memory storage for serverless deployments. Vercel's filesystem is
// ephemeral, so production memories live in a hosted Postgres database.
import { neon } from "@neondatabase/serverless";

export function createPostgresMemoryRepo({ connectionString, now = () => new Date(), newId, seedSamples = true }) {
  const sql = neon(connectionString);
  let ready;

  const ensureReady = () => {
    if (!ready) {
      ready = (async () => {
        await sql`CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          site_id TEXT NOT NULL,
          guest_id TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('note', 'drawing')),
          text TEXT,
          title TEXT,
          drawing TEXT,
          photo TEXT,
          photo_mime TEXT,
          display_name TEXT,
          is_sample BOOLEAN NOT NULL DEFAULT FALSE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
          moderation_reason TEXT,
          report_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          moderated_at TEXT
        )`;
        await sql`CREATE INDEX IF NOT EXISTS memories_site_status ON memories (site_id, status, created_at)`;
        await sql`CREATE INDEX IF NOT EXISTS memories_guest ON memories (guest_id, created_at)`;
        await sql`ALTER TABLE memories ADD COLUMN IF NOT EXISTS title TEXT`;
        await sql`ALTER TABLE memories ADD COLUMN IF NOT EXISTS drawing TEXT`;
        await sql`ALTER TABLE memories ADD COLUMN IF NOT EXISTS photo TEXT`;
        await sql`ALTER TABLE memories ADD COLUMN IF NOT EXISTS photo_mime TEXT`;
        if (seedSamples) {
          const at = now().toISOString();
          for (const [siteId, notes] of Object.entries(SAMPLE_MEMORIES)) {
            for (const [i, text] of notes.entries()) {
              await sql`INSERT INTO memories (id, site_id, guest_id, type, text, display_name, is_sample, status, created_at, updated_at)
                VALUES (${`sample_${siteId}_${i + 1}`}, ${siteId}, 'sample', 'note', ${text}, 'Sample visitor', TRUE, 'approved', ${at}, ${at})
                ON CONFLICT (id) DO NOTHING`;
            }
          }
        }
      })().catch((error) => {
        ready = undefined;
        throw error;
      });
    }
    return ready;
  };

  const withReady = (fn) => async (...args) => {
    await ensureReady();
    return fn(...args);
  };
  const publicColumns = `id, site_id, type, text, title, display_name, is_sample, created_at,
    (drawing IS NOT NULL) AS has_drawing, (photo IS NOT NULL) AS has_photo`;
  const toPublic = (row) => ({
    id: row.id,
    siteId: row.site_id,
    type: row.type,
    text: row.text ?? null,
    title: row.title ?? null,
    displayName: row.display_name ?? null,
    isSample: Boolean(row.is_sample),
    drawingUrl: row.has_drawing ? `/api/memories/${row.id}/drawing.png` : null,
    photoUrl: row.has_photo ? `/api/memories/${row.id}/photo` : null,
    createdAt: row.created_at,
  });

  return {
    create: withReady(async ({ siteId, guestId, type, text, title, drawingPng, photoBytes, photoMime, displayName, isSample = false, status = "pending" }) => {
      const id = newId();
      const at = now().toISOString();
      await sql`INSERT INTO memories (id, site_id, guest_id, type, text, title, drawing, photo, photo_mime, display_name, is_sample, status, created_at, updated_at)
        VALUES (${id}, ${siteId}, ${guestId}, ${type}, ${text ?? null}, ${title ?? null}, ${drawingPng?.toString("base64") ?? null}, ${photoBytes?.toString("base64") ?? null}, ${photoMime ?? null}, ${displayName ?? null}, ${isSample}, ${status}, ${at}, ${at})`;
      return { id, status, createdAt: at };
    }),
    listApproved: withReady(async (siteId, limit = 60) => (await sql`SELECT ${sql.unsafe(publicColumns)} FROM memories WHERE site_id = ${siteId} AND status = 'approved' ORDER BY created_at DESC LIMIT ${limit}`).map(toPublic)),
    listForGuest: withReady(async (guestId) => (await sql`SELECT ${sql.unsafe(publicColumns)}, status FROM memories WHERE guest_id = ${guestId} ORDER BY created_at DESC LIMIT 50`).map((r) => ({ ...toPublic(r), status: r.status }))),
    listByStatus: withReady(async (status) => (await sql`SELECT ${sql.unsafe(publicColumns)}, status, report_count FROM memories WHERE status = ${status} ORDER BY created_at ASC LIMIT 200`).map((r) => ({ ...toPublic(r), status: r.status, reportCount: r.report_count }))),
    getDrawing: withReady(async (id) => {
      const row = (await sql`SELECT drawing, status, guest_id FROM memories WHERE id = ${id}`)[0];
      return row ? { ...row, drawing: row.drawing ? Buffer.from(row.drawing, "base64") : null } : null;
    }),
    getPhoto: withReady(async (id) => {
      const row = (await sql`SELECT photo, photo_mime, status, guest_id FROM memories WHERE id = ${id}`)[0];
      return row ? { ...row, photo: row.photo ? Buffer.from(row.photo, "base64") : null } : null;
    }),
    moderate: withReady(async (id, status, reason = null) => {
      const at = now().toISOString();
      const rows = await sql`UPDATE memories SET status = ${status}, moderation_reason = ${reason}, moderated_at = ${at}, updated_at = ${at} WHERE id = ${id} RETURNING id`;
      return rows.length > 0;
    }),
    report: withReady(async (id, hideAfter = 3) => {
      const at = now().toISOString();
      const rows = await sql`UPDATE memories SET report_count = report_count + 1,
        status = CASE WHEN status = 'approved' AND report_count + 1 >= ${hideAfter} THEN 'hidden' ELSE status END,
        updated_at = ${at} WHERE id = ${id} AND status = 'approved' RETURNING id`;
      return rows.length > 0;
    }),
    close: async () => {},
  };
}

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
