// `npm run dev`: starts the API (port 8787) and the Vite dev server (port 5173) together.
import { spawn } from "node:child_process";

const isWin = process.platform === "win32";
const procs = [
  // The API always uses 8787 in development (vite.config.ts proxies /api there), even if PORT is set for the web server.
  spawn(process.execPath, ["--watch", "--disable-warning=ExperimentalWarning", "server/index.mjs"], { stdio: "inherit", env: { ...process.env, PORT: "8787" } }),
  spawn(isWin ? "npx.cmd" : "npx", ["vite", ...process.argv.slice(2)], { stdio: "inherit", shell: isWin }),
];
const stop = () => procs.forEach((p) => p.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
procs.forEach((p) => p.on("exit", (code) => {
  stop();
  process.exit(code ?? 0);
}));
