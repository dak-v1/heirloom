import { useSyncExternalStore } from "react";
import { SITES } from "../content/sites";
import { createProgressService, PROGRESS_KEY } from "../services/progress";

/** The app's single progress service (browser-local guest passport). */
export const progress = createProgressService({ siteIds: SITES.map((s) => s.id) });

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === PROGRESS_KEY) progress.reload();
  });
}

export function useProgress() {
  return useSyncExternalStore(progress.subscribe, progress.getVisitorProgress, progress.getVisitorProgress);
}
