// Entry point: `npm start` (production, serves dist/) or `npm run dev:api`.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(path.join(root, ".env"))) process.loadEnvFile(path.join(root, ".env"));

const port = Number(process.env.PORT || 8787);
const dbFile = process.env.HEIRLOOM_DB_FILE || path.join(root, "server", "data", "heirloom.sqlite");

if (!process.env.HEIRLOOM_GUEST_SECRET) {
  console.warn("[heirloom] HEIRLOOM_GUEST_SECRET is not set: guest tokens will reset when the server restarts.");
}
if (!process.env.HEIRLOOM_ADMIN_TOKEN) {
  console.warn("[heirloom] HEIRLOOM_ADMIN_TOKEN is not set: memories can be submitted (as pending) but not moderated.");
}

const { app } = createApp({ dbFile, staticDir: path.join(root, "dist") });
app.listen(port, () => console.log(`[heirloom] API listening on http://localhost:${port}`));
