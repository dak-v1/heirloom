import { useCallback, useEffect, useState } from "react";
import { Flag, MessageSquareHeart, RotateCw } from "lucide-react";
import type { Site } from "../../content/types";
import { Button } from "../../components/Button";
import { Tag } from "../../components/Media";
import { MemoryApiError, getApprovedMemories, getMyMemories, hasGuestToken, reportMemory, type OwnMemory, type PublicMemory } from "../../services/memories";
import "./memories.css";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

const STATUS: Record<OwnMemory["status"], { label: string; tone: "mustard" | "olive" | "plain" }> = {
  pending: { label: "Waiting for review", tone: "mustard" },
  approved: { label: "Published", tone: "olive" },
  rejected: { label: "Not published", tone: "plain" },
  hidden: { label: "Not published", tone: "plain" },
};

/**
 * Scrapbook wall of approved memories for one site (the server never returns anything
 * else), plus this browser's own submissions with their review status.
 */
export function MemoryWall({ site, refreshKey, onLeave }: { site: Site; refreshKey: number; onLeave: () => void }) {
  const [state, setState] = useState<{ status: "loading" | "ok" | "error"; items: PublicMemory[]; error?: string }>({ status: "loading", items: [] });
  const [mine, setMine] = useState<OwnMemory[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");

  const load = useCallback(() => {
    let live = true;
    setState((s) => ({ ...s, status: "loading" }));
    getApprovedMemories(site.id)
      .then((items) => live && setState({ status: "ok", items }))
      .catch((e) => live && setState({ status: "error", items: [], error: e instanceof MemoryApiError ? e.message : "Couldn't load memories." }));
    if (hasGuestToken()) {
      getMyMemories()
        .then((list) => live && setMine(list.filter((m) => m.siteId === site.id)))
        .catch(() => live && setMine([]));
    }
    return () => {
      live = false;
    };
  }, [site.id]);

  useEffect(load, [load, refreshKey]);

  const report = async (id: string) => {
    setConfirming(null);
    try {
      await reportMemory(id);
      setReported((r) => new Set(r).add(id));
      setNotice("Thanks. A moderator will take a look at that memory.");
    } catch (e) {
      setNotice(e instanceof MemoryApiError ? e.message : "That report couldn't be sent.");
    }
  };

  const visible = state.items.filter((m) => !reported.has(m.id));

  return (
    <section className="section memory-wall" aria-labelledby="wall-h">
      <div className="section-head">
        <h2 id="wall-h">Memories from visitors</h2>
        <Button variant="ghost" size="sm" icon={<MessageSquareHeart size={16} />} onClick={onLeave}>
          Leave a memory
        </Button>
      </div>
      <p className="muted memory-wall__intro">Notes and drawings left at {site.name}. Each one is published only after a moderator reviews it.</p>
      <p className="visually-hidden" role="status">
        {notice}
      </p>
      {notice && <p className="notice memory-wall__notice">{notice}</p>}

      {state.status === "loading" && (
        <ul className="memory-grid" aria-busy="true" aria-label="Loading memories">
          {[0, 1].map((i) => (
            <li key={i} className="memory-card memory-card--skeleton">
              <div className="skeleton-line" style={{ width: "80%" }} />
              <div className="skeleton-line" style={{ width: "60%", marginTop: 8 }} />
            </li>
          ))}
        </ul>
      )}

      {state.status === "error" && (
        <div className="notice notice--warn memory-wall__error">
          <span>{state.error} The wall needs a connection; your own visit and stamp aren't affected.</span>
          <Button variant="secondary" size="sm" icon={<RotateCw size={16} />} onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {state.status === "ok" && visible.length === 0 && (
        <div className="empty card card--flat memory-wall__empty">
          <p>
            <strong>No shared memories here yet.</strong>
            <br />
            Be the first to leave a note or drawing.
          </p>
        </div>
      )}

      {state.status === "ok" && visible.length > 0 && (
        <ul className="memory-grid">
          {visible.map((m) => (
            <li key={m.id} className="memory-card card card--tape">
              {m.drawingUrl && <img className="memory-card__drawing" src={m.drawingUrl} alt={`Drawing shared by ${m.displayName ?? "a visitor"}`} loading="lazy" />}
              {/* Plain text only: React escapes it, never rendered as HTML. */}
              {m.text && <p className="memory-card__note">{m.text}</p>}
              <div className="memory-card__meta">
                <span>— {m.displayName ?? "A visitor"}</span>
                <span className="muted">{shortDate(m.createdAt)}</span>
                {m.isSample && (
                  <Tag tone="demo" title="Illustrative sample written by the Heirloom team for the demo">
                    Sample
                  </Tag>
                )}
              </div>
              {confirming === m.id ? (
                <div className="memory-card__confirm">
                  <span>Report this to the moderators?</span>
                  <Button variant="ink" size="sm" onClick={() => report(m.id)}>
                    Report
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button type="button" className="memory-card__report" onClick={() => setConfirming(m.id)} aria-label={`Report memory by ${m.displayName ?? "a visitor"}`}>
                  <Flag size={14} aria-hidden="true" /> Report
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {mine.length > 0 && (
        <div className="my-memories">
          <h3>Your submissions</h3>
          <p className="muted">Only you can see this list, in this browser.</p>
          <ul>
            {mine.map((m) => (
              <li key={m.id}>
                <span className="my-memories__what">{m.type === "note" ? `“${(m.text ?? "").slice(0, 80)}${(m.text ?? "").length > 80 ? "…" : ""}”` : "Your drawing"}</span>
                <span className="muted">{shortDate(m.createdAt)}</span>
                <Tag tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Tag>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
