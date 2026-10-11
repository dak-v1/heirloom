// Vercel's catch-all function exposes the same API routes as the local Express server.
import { createApp } from "../server/app.mjs";

const databaseUrl = process.env.HEIRLOOM_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const app = databaseUrl ? createApp({ databaseUrl }).app : null;

export default function handler(req, res) {
  if (!app) {
    return res.status(503).json({
      error: "Memory saving is not configured yet. Connect a Postgres database to this Vercel project, then redeploy.",
    });
  }
  return app(req, res);
}
