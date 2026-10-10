// Small key-value persistence layer. Prefers localStorage, falls back to memory
// (private browsing, blocked storage, quota errors) and reports which one is live
// so the UI can explain whether progress will survive a reload.

export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  readonly persistent: boolean;
}

export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    persistent: false,
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    remove: (k) => void map.delete(k),
  };
}

export function createBrowserStore(storage: Storage | undefined = globalThis.localStorage): KeyValueStore {
  try {
    if (!storage) throw new Error("no storage");
    const probe = "__heirloom_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
  } catch {
    return createMemoryStore();
  }
  const fallback = createMemoryStore();
  let healthy = true;
  return {
    get persistent() {
      return healthy;
    },
    get(k) {
      try {
        return healthy ? storage.getItem(k) : fallback.get(k);
      } catch {
        return fallback.get(k);
      }
    },
    set(k, v) {
      try {
        if (healthy) storage.setItem(k, v);
        else fallback.set(k, v);
      } catch {
        // Quota or security error: keep working in memory for this session.
        healthy = false;
        fallback.set(k, v);
      }
    },
    remove(k) {
      try {
        storage.removeItem(k);
      } catch {
        /* ignore */
      }
      fallback.remove(k);
    },
  };
}

export function readJson<T>(store: KeyValueStore, key: string): T | null {
  const raw = store.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(store: KeyValueStore, key: string, value: unknown): void {
  store.set(key, JSON.stringify(value));
}

/** Opaque random identifier (not derived from anything about the visitor). */
export function randomId(prefix = ""): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return prefix + c.randomUUID();
  const bytes = new Uint8Array(16);
  c?.getRandomValues?.(bytes);
  return prefix + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
