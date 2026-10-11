import { useEffect, useState, type CSSProperties } from "react";
import { MessageSquareHeart, RotateCw } from "lucide-react";
import { SITES } from "../../content/sites";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { Tag } from "../../components/Media";
import { getMyMemories, getOwnMemoryMedia, hasGuestToken, type OwnMemory } from "../../services/memories";
import { AMBIENT_ORB_COUNT, ambientOrbLayout, memoryOrbLayout, ORB_COLORS } from "../memories/orb-layout";

const STATUS: Record<OwnMemory["status"], { label: string; tone: "mustard" | "olive" | "plain" }> = {
  pending: { label: "Waiting for review", tone: "mustard" },
  approved: { label: "Published", tone: "olive" },
  rejected: { label: "Not published", tone: "plain" },
  hidden: { label: "Not published", tone: "plain" },
};

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

export function MyMemories() {
  const [state, setState] = useState<{ status: "loading" | "ok" | "error"; items: OwnMemory[]; error?: string }>({ status: "loading", items: [] });
  const [media, setMedia] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<OwnMemory | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let live = true;
    const createdUrls: string[] = [];
    setMedia({});
    setState({ status: "loading", items: [] });

    if (!hasGuestToken()) {
      setState({ status: "ok", items: [] });
      return () => { live = false; };
    }

    getMyMemories()
      .then(async (items) => {
        const withMedia = await Promise.all(items.map(async (memory) => {
          const kind = memory.photoUrl ? "photo" : memory.drawingUrl ? "drawing" : null;
          if (!kind) return [memory.id, ""] as const;
          try {
            const url = await getOwnMemoryMedia(memory.id, kind);
            createdUrls.push(url);
            return [memory.id, url] as const;
          } catch {
            return [memory.id, ""] as const;
          }
        }));
        if (!live) {
          createdUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        setMedia(Object.fromEntries(withMedia));
        setState({ status: "ok", items });
      })
      .catch((error: unknown) => {
        if (live) setState({ status: "error", items: [], error: error instanceof Error ? error.message : "Couldn't load your memories." });
      });

    return () => {
      live = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [retry]);

  const groups = SITES.map((site) => ({ site, items: state.items.filter((memory) => memory.siteId === site.id) })).filter((group) => group.items.length > 0);
  const selectedImage = selected ? media[selected.id] : undefined;

  return (
    <section className="section profile-memories" aria-labelledby="profile-memories-h">
      <div className="section-head">
        <h2 id="profile-memories-h">Your memory orbs</h2>
        {state.status === "ok" && state.items.length > 0 && <span className="muted">{state.items.length} saved</span>}
      </div>
      <p className="muted profile-memories__intro">Your memories gather here by place. This list shows your own submissions; memories awaiting review stay private.</p>

      {state.status === "loading" && <div className="notice" aria-busy="true">Gathering your memory orbs…</div>}
      {state.status === "error" && <div className="notice notice--warn">
        <span>{state.error}</span>
        <Button variant="secondary" size="sm" icon={<RotateCw size={16} />} onClick={() => setRetry((value) => value + 1)}>Try again</Button>
      </div>}

      {state.status === "ok" && state.items.length === 0 && <div className="empty card card--flat profile-memories__empty">
        <p><strong>No memory orbs yet.</strong><br />Leave a memory at a heritage site and it will appear here.</p>
      </div>}

      {state.status === "ok" && groups.length > 0 && <div className="profile-memories__groups">
        {groups.map(({ site, items }) => <section className="profile-memories__site" key={site.id} aria-label={`Memories from ${site.name}`}>
          <div className="profile-memories__site-head">
            <h3>{site.name}</h3>
            <span>{items.length} {items.length === 1 ? "orb" : "orbs"}</span>
          </div>
          <ul className="profile-memories__field" aria-label={`Your memory orbs from ${site.name}`}>
            {Array.from({ length: AMBIENT_ORB_COUNT }, (_, index) => {
              const position = ambientOrbLayout(index);
              const style = {
                "--orb-x": `${position.x}%`,
                "--orb-y": `${position.y}%`,
                "--orb-size": `${position.size}px`,
                "--orb-index": index,
                "--orb-color": ORB_COLORS[(index * 3 + 1) % ORB_COLORS.length],
              } as CSSProperties;
              return <li key={`archive-glow-${index}`} className="profile-memories__ambient" style={style} aria-hidden="true"><span /></li>;
            })}
            {items.map((memory, index) => {
              const position = memoryOrbLayout(index, items.length);
              const image = media[memory.id];
              const label = memory.title || memory.text || (memory.drawingUrl ? "Your drawing" : "Your memory");
              const style = {
                "--orb-x": `${position.x}%`,
                "--orb-y": `${position.y}%`,
                "--orb-size": `${position.size}px`,
                "--orb-depth": index + 1,
                "--orb-color": ORB_COLORS[index % ORB_COLORS.length],
              } as CSSProperties;
              return <li key={memory.id} className="profile-memories__orb-wrap" style={style}>
                <button
                  type="button"
                  className={`profile-memory-orb${image ? " profile-memory-orb--image" : ""}`}
                  onClick={() => setSelected(memory)}
                  aria-label={`Open your memory: ${label.slice(0, 100)}. ${STATUS[memory.status].label}`}
                  title={label}
                >
                  {image ? <img src={image} alt="" loading="lazy" /> : memory.title || memory.text ? <span className="profile-memory-orb__excerpt" aria-hidden="true">{memory.title || memory.text}</span> : <span className="profile-memory-orb__glyph" aria-hidden="true"><MessageSquareHeart size={22} /></span>}
                  <span className="profile-memory-orb__glint" aria-hidden="true" />
                </button>
              </li>;
            })}
          </ul>
        </section>)}
      </div>}

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.title || "Your memory"} size="tall" className="profile-memory-sheet">
        {selected && <article className="profile-memory-detail">
          {selectedImage && <img className="profile-memory-detail__image" src={selectedImage} alt={selected.title ? `Photo for “${selected.title}”` : "Your memory at this heritage site"} />}
          {selected.title && <h3>{selected.title}</h3>}
          {selected.text && <p className="profile-memory-detail__text">{selected.text}</p>}
          <div className="profile-memory-detail__meta">
            <span>{SITES.find((site) => site.id === selected.siteId)?.name ?? "Heritage site"}</span>
            <time dateTime={selected.createdAt}>{shortDate(selected.createdAt)}</time>
            <Tag tone={STATUS[selected.status].tone}>{STATUS[selected.status].label}</Tag>
          </div>
          <p className="profile-memory-detail__privacy">
            {selected.status === "pending" ? "This memory stays private until a moderator reviews it." : selected.status === "approved" ? "This memory is part of the shared story at this site." : "This memory is visible only in your profile."}
          </p>
        </article>}
      </Sheet>
    </section>
  );
}
