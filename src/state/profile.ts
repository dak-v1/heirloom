import { useSyncExternalStore } from "react";
import { createProfileService, PROFILE_KEY } from "../services/profile";
import { createBrowserStore } from "../services/storage";

/** The app's single profile service (name, map icon, badge board), browser-local. */
export const profile = createProfileService(createBrowserStore());

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === PROFILE_KEY) profile.reload();
  });
}

export function useProfile() {
  return useSyncExternalStore(profile.subscribe, profile.get, profile.get);
}
