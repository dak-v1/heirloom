import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Flag, MessageSquareHeart, RotateCw } from "lucide-react";
import type { Site } from "../../content/types";
import { Button } from "../../components/Button";
import { Tag } from "../../components/Media";
import { Sheet } from "../../components/Sheet";
import { MemoryApiError, getApprovedMemories, getMyMemories, hasGuestToken, reportMemory, type OwnMemory, type PublicMemory } from "../../services/memories";
import { MemoryJar } from "./MemoryJar";
import "./memories.css";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

const STATUS: Record<OwnMemory["status"], { label: string; tone: "mustard" | "olive" | "plain" }> = {
  pending: { label: "Waiting for review", tone: "mustard" },
  approved: { label: "Published", tone: "olive" },
  rejected: { label: "Not published", tone: "plain" },
  hidden: { label: "Not published", tone: "plain" },
};

const SAMPLE_ORB_PHOTOS: Record<string, string> = {
  "sample_thian-hock-keng_1": "/assets/memories/sample-thk-orb-1.jpg",
  "sample_thian-hock-keng_2": "/assets/memories/sample-thk-orb-2.jpg",
};

function orbPhoto(memory: PublicMemory) {
  return memory.photoUrl ?? memory.drawingUrl ?? SAMPLE_ORB_PHOTOS[memory.id] ?? null;
}

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
  const [selected, setSelected] = useState<PublicMemory | null>(null);

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
      setSelected(null);
      setNotice("Thanks. A moderator will take a look at that memory.");
    } catch (e) {
      setNotice(e instanceof MemoryApiError ? e.message : "That report couldn't be sent.");
    }
  };

  const visible = state.items.filter((m) => !reported.has(m.id));
  const selectedSamplePhoto = selected ? SAMPLE_ORB_PHOTOS[selected.id] : undefined;

  return (
    <section className="section memory-wall" aria-labelledby="wall-h">
      <div className="section-head">
        <h2 id="wall-h" tabIndex={-1}>Memories from visitors</h2>
        <Button variant="ghost" size="sm" icon={<MessageSquareHeart size={16} />} onClick={onLeave}>
          Leave a memory
        </Button>
      </div>
      <p className="visually-hidden" role="status">
        {notice}
      </p>
      {notice && <p className="notice memory-wall__notice">{notice}</p>}

      {state.status === "loading" && (
        <div className="memory-orb-field memory-orb-field--loading" aria-busy="true" aria-label="Loading shared memories">
          {Array.from({ length: 9 }, (_, index) => <span key={index} style={{ "--orb-index": index } as CSSProperties} />)}
        </div>
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
            Be the first to leave a photo or memory.
          </p>
        </div>
      )}

      {state.status === "ok" && visible.length > 0 && (
        <MemoryJar memories={visible} photoFor={orbPhoto} onSelect={(memory) => { setSelected(memory); setConfirming(null); }} />
      )}

      <Sheet open={!!selected} onClose={() => { setSelected(null); setConfirming(null); }} title={selected?.title || "A memory from this place"} size="tall" className="memory-detail-sheet">
        {selected && <article className="memory-detail">
          {selected.photoUrl && <img className="memory-detail__image" src={selected.photoUrl} alt={selected.title ? `Photo for “${selected.title}”` : `Photo shared by ${selected.displayName ?? "a visitor"}`} />}
          {!selected.photoUrl && selectedSamplePhoto && <img className="memory-detail__image" src={selectedSamplePhoto} alt="Photo shown with this sample memory" />}
          {selected.drawingUrl && <img className="memory-detail__drawing" src={selected.drawingUrl} alt={`Drawing shared by ${selected.displayName ?? "a visitor"}`} />}
          {selected.title && <h3>{selected.title}</h3>}
          {selected.text && <p className="memory-detail__text">{selected.text}</p>}
          <div className="memory-detail__meta"><span>— {selected.displayName ?? "A visitor"}</span><time dateTime={selected.createdAt}>{shortDate(selected.createdAt)}</time>
            {selected.isSample && <Tag tone="demo" title="Illustrative sample written by the Heirloom team for the demo">Sample</Tag>}
          </div>
          {confirming === selected.id ? <div className="memory-detail__report-confirm">
            <span>Report this memory to the moderators?</span>
            <Button variant="ink" size="sm" onClick={() => void report(selected.id)}>Report memory</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>Cancel</Button>
          </div> : <button type="button" className="memory-card__report" onClick={() => setConfirming(selected.id)}><Flag size={14} aria-hidden="true" /> Report this memory</button>}
        </article>}
      </Sheet>

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
