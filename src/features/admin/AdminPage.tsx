import { useCallback, useEffect, useId, useState } from "react";
import { Link } from "react-router";
import { Check, EyeOff, LogOut, RotateCw, X } from "lucide-react";
import { findSite } from "../../content/sites";
import { Button } from "../../components/Button";
import { Tag } from "../../components/Media";
import { MemoryApiError, adminDrawingUrl, adminPhotoUrl, adminListMemories, adminModerate, type ModerationItem, type ModerationStatus } from "../../services/memories";
import "../memories/memories.css";

// Session-only: the token is gone when this tab closes. It is never shown, logged or put in a URL.
const TOKEN_KEY = "heirloom:admin-token";
const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
};
const writeToken = (t: string) => {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: the token lives in memory for this page only */
  }
};

const FILTERS: { status: ModerationStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "hidden", label: "Hidden" },
  { status: "rejected", label: "Rejected" },
];

type Action = "approve" | "reject" | "hide";
const ACTIONS: Record<ModerationStatus, Action[]> = {
  pending: ["approve", "reject"],
  approved: ["hide"],
  hidden: ["approve", "reject"],
  rejected: ["approve"],
};

function explain(e: unknown): string {
  if (!(e instanceof MemoryApiError)) return "Something went wrong.";
  if (e.status === 401) return "That moderator token wasn't accepted. Check it and try again.";
  if (e.status === 503) return "Moderation isn't configured on this server. Set HEIRLOOM_ADMIN_TOKEN in .env and restart the API.";
  if (e.status === 0) return "You appear to be offline.";
  return e.message;
}

/** Protected moderation queue. Every rule is enforced by the server; this is only a front end for it. */
export function AdminPage() {
  const [token, setToken] = useState(readToken);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ModerationStatus>("pending");
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [load, setLoad] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const inputId = useId();

  useEffect(() => {
    document.title = "Moderation · Heirloom";
  }, []);

  const forget = useCallback((message: string | null = null) => {
    writeToken("");
    setToken("");
    setItems([]);
    setLoad("idle");
    setError(message);
  }, []);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoad("loading");
    setError(null);
    try {
      setItems(await adminListMemories(token, status));
      setLoad("ok");
    } catch (e) {
      if (e instanceof MemoryApiError && e.status === 401) return forget(explain(e));
      setError(explain(e));
      setLoad("error");
    }
  }, [token, status, forget]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  // Drawings that aren't public need the token, so they're fetched as blobs.
  useEffect(() => {
    if (!token) return;
    const urls: Record<string, string> = {};
    let live = true;
    for (const m of items) {
      const loadPreview = m.photoUrl ? adminPhotoUrl(token, m.id) : m.drawingUrl ? adminDrawingUrl(token, m.id) : null;
      if (!loadPreview) continue;
      loadPreview
        .then((url) => {
          if (!live) return URL.revokeObjectURL(url);
          urls[m.id] = url;
          setPreviews((p) => ({ ...p, [m.id]: url }));
        })
        .catch(() => {});
    }
    return () => {
      live = false;
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
      setPreviews({});
    };
  }, [items, token]);

  const act = async (m: ModerationItem, action: Action) => {
    setBusy(m.id);
    setError(null);
    try {
      await adminModerate(token, m.id, action);
      setItems((list) => list.filter((x) => x.id !== m.id));
    } catch (e) {
      if (e instanceof MemoryApiError && e.status === 401) forget(explain(e));
      else setError(explain(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page admin">
      <p className="kicker">Moderators only</p>
      <h1>Memory moderation</h1>
      <p className="muted">
        New memories stay private until approved here. Approving publishes a memory on its own site's wall; rejecting or hiding keeps it off every public wall. Visitors never see
        moderation reasons.
      </p>

      {error && (
        <p className="notice notice--warn" role="alert">
          {error}
        </p>
      )}

      {!token ? (
        <form
          className="admin__token card"
          onSubmit={(e) => {
            e.preventDefault();
            const t = input.trim();
            if (!t) return;
            writeToken(t);
            setToken(t);
            setInput("");
          }}
        >
          <label htmlFor={inputId}>
            <strong>Moderator token</strong>
          </label>
          <input
            id={inputId}
            className="composer__input"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <p className="muted" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
            The value of HEIRLOOM_ADMIN_TOKEN. Kept only in this tab's session storage.
          </p>
          <Button type="submit" disabled={!input.trim()}>
            Unlock moderation
          </Button>
        </form>
      ) : (
        <>
          <div className="admin__bar">
            <div className="chips" role="radiogroup" aria-label="Show memories that are">
              {FILTERS.map((f) => (
                <button key={f.status} type="button" role="radio" className="chip" aria-checked={status === f.status} onClick={() => setStatus(f.status)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="admin__actions">
              <Button variant="secondary" size="sm" icon={<RotateCw size={16} />} onClick={() => void fetchList()} disabled={load === "loading"}>
                Refresh
              </Button>
              <Button variant="ghost" size="sm" icon={<LogOut size={16} />} onClick={() => forget()}>
                Forget token
              </Button>
            </div>
          </div>

          {load === "loading" && <p aria-busy="true">Loading…</p>}
          {load === "ok" && items.length === 0 && <p className="empty card card--flat">Nothing {status} right now.</p>}

          <ul className="admin__list" aria-live="polite">
            {items.map((m) => {
              const site = findSite(m.siteId);
              return (
                <li key={m.id} className="admin__item card">
                  <header>
                    <strong>{site ? <Link to={`/tour/${site.slug}`}>{site.name}</Link> : m.siteId}</strong>
                    <Tag>{m.photoUrl ? "Photo memory" : m.type === "note" ? "Note" : "Drawing"}</Tag>
                    {m.isSample && <Tag tone="demo">Sample</Tag>}
                    {m.reportCount > 0 && <Tag tone="terracotta">{m.reportCount} report{m.reportCount === 1 ? "" : "s"}</Tag>}
                    <span className="muted">{new Date(m.createdAt).toLocaleString("en-SG")}</span>
                  </header>
                  <p style={{ margin: 0 }}>
                    By <strong>{m.displayName ?? "an unnamed visitor"}</strong>
                  </p>
                  {m.drawingUrl &&
                    (previews[m.id] ? (
                      <img className="admin__drawing" src={previews[m.id]} alt={`Drawing submitted for ${site?.name ?? m.siteId}`} />
                    ) : (
                      <p className="muted">Loading drawing…</p>
                    ))}
                  {m.photoUrl &&
                    (previews[m.id] ? (
                      <img className="admin__drawing" src={previews[m.id]} alt={`Memory photo for ${site?.name ?? m.siteId}`} />
                    ) : (
                      <p className="muted">Loading photo…</p>
                    ))}
                  {/* Plain text only, never HTML. */}
                  {m.title && <h3 className="memory-card__title">{m.title}</h3>}
                  {m.text && <p className="admin__note">{m.text}</p>}
                  <div className="admin__actions">
                    {ACTIONS[m.status].map((a) => (
                      <Button
                        key={a}
                        size="sm"
                        variant={a === "approve" ? "olive" : a === "reject" ? "ink" : "secondary"}
                        icon={a === "approve" ? <Check size={16} /> : a === "reject" ? <X size={16} /> : <EyeOff size={16} />}
                        disabled={busy === m.id}
                        onClick={() => act(m, a)}
                      >
                        {a === "approve" ? (m.status === "pending" ? "Approve" : "Publish") : a === "reject" ? "Reject" : "Hide"}
                      </Button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
