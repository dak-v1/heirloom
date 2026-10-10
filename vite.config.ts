/// <reference types="vitest/config" />
import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// `npm run dev:https` serves over HTTPS on the LAN so phones can use geolocation and the camera.
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "https" ? (basicSsl() as PluginOption) : null],
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://localhost:8787", changeOrigin: false } },
  },
  preview: {
    proxy: { "/api": { target: "http://localhost:8787", changeOrigin: false } },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,mjs}"],
  },
}));
