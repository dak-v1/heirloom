import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check, Pencil, RefreshCw, X } from "lucide-react";
import { SITES } from "../../content/sites";
import { findAvatar } from "../../content/avatars";
import { IconButton } from "../../components/Button";
import { displayName, NAME_MAX } from "../../services/profile";
import { useProgress } from "../../state/progress";
import { profile, useProfile } from "../../state/profile";

const RANKS = ["New Explorer", "Curious Wanderer", "Local Explorer", "Heritage Keeper"];

function joined(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `Joined ${d.toLocaleDateString("en-SG", { month: "short", year: "numeric" })}`;
}

/** The "Heritage Explorer Card": icon, name, rank and counts. */
export function ExplorerCard({ onChangeAvatar }: { onChangeAvatar: () => void }) {
  const p = useProgress();
  const me = useProfile();
  const avatar = findAvatar(me.avatar);
  const explored = SITES.filter((s) => p.visits[s.id]?.completedAt).length;
  const rank = RANKS[Math.min(explored, RANKS.length - 1)];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const editBtn = useRef<HTMLButtonElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  const finish = (save: boolean) => {
    if (save) profile.setName(draft);
    setEditing(false);
    window.requestAnimationFrame(() => editBtn.current?.focus());
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    finish(true);
  };

  return (
    <section className="explorer-card" aria-labelledby="explorer-name">
      <p className="explorer-card__band">
        <span aria-hidden="true">✥</span>
        Heritage Explorer Card
        <span aria-hidden="true">✥</span>
      </p>
      <div className="explorer-card__body">
        <img className="explorer-card__facade" src="/assets/decor/shophouse-facade.svg" alt="" aria-hidden="true" />
        <img className="explorer-card__seal" src="/assets/decor/explorer-seal.svg" alt="" aria-hidden="true" />
        <button type="button" className="explorer-card__photo" onClick={onChangeAvatar} aria-label={`Change your map icon. Now: ${avatar.name}`}>
          <span className="explorer-card__stamp perforated">
            <img src={avatar.art} alt="" draggable={false} />
          </span>
          <span className="explorer-card__swap" aria-hidden="true">
            <RefreshCw size={15} />
          </span>
        </button>
        <div className="explorer-card__who">
          {editing ? (
            <form className="explorer-card__edit" onSubmit={onSubmit}>
              <label className="visually-hidden" htmlFor={inputId}>
                Your name
              </label>
              <input
                ref={input}
                id={inputId}
                value={draft}
                maxLength={NAME_MAX}
                autoComplete="nickname"
                placeholder="Your name"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    finish(false);
                  }
                }}
              />
              <IconButton type="submit" label="Save name" variant="paper">
                <Check size={18} />
              </IconButton>
              <IconButton label="Cancel" onClick={() => finish(false)}>
                <X size={18} />
              </IconButton>
            </form>
          ) : (
            <h2 className="explorer-card__name" id="explorer-name">
              <span>{displayName(me)}</span>
              <IconButton
                ref={editBtn}
                label="Edit your name"
                className="explorer-card__pencil"
                onClick={() => {
                  setDraft(me.name);
                  setEditing(true);
                }}
              >
                <Pencil size={17} />
              </IconButton>
            </h2>
          )}
          <p className="explorer-card__meta">
            <span>{rank}</span>
            <span>Exploring Singapore</span>
            <span>{joined(p.createdAt)}</span>
          </p>
        </div>
      </div>
      <dl className="explorer-card__stats">
        <div>
          <dt>Places explored</dt>
          <dd>{explored}</dd>
        </div>
        <div>
          <dt>Stamps earned</dt>
          <dd>{p.earnedStamps.length}</dd>
        </div>
        <div>
          <dt>Badges earned</dt>
          <dd>{Object.keys(p.badges).length}</dd>
        </div>
      </dl>
    </section>
  );
}
