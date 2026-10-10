import { useEffect, useState } from "react";
import { Info, Lock } from "lucide-react";
import { BADGES } from "../../content/badges";
import { progress, useProgress } from "../../state/progress";
import { AvatarPicker } from "./AvatarPicker";
import { BadgeBoard } from "./BadgeBoard";
import { BadgeCloseup } from "./BadgeCloseup";
import { ExplorerCard } from "./ExplorerCard";
import "./profile.css";

export function ProfilePage() {
  const p = useProgress();
  const [picker, setPicker] = useState(false);
  const [closeup, setCloseup] = useState<string | null>(null);

  useEffect(() => {
    document.title = "My Profile · Heirloom";
  }, []);

  const earnedCount = BADGES.filter((b) => p.badges[b.id]).length;
  const locked = BADGES.filter((b) => !p.badges[b.id]);

  return (
    <div className="page profile">
      <header className="profile__head">
        <p className="kicker">Singapore, reimagined</p>
        <h1>My Profile</h1>
        <p className="profile__lede">Your place in the story.</p>
      </header>

      <ExplorerCard onChangeAvatar={() => setPicker(true)} />

      <section className="section" aria-labelledby="board-h">
        <div className="section-head">
          <h2 id="board-h">My Achievement Board</h2>
          <span className="muted">
            {earnedCount} / {BADGES.length} unlocked
          </span>
        </div>
        <p className="muted profile__hint">Tap a badge to see it up close. Drag the pins to arrange your board.</p>
        <BadgeBoard onOpen={setCloseup} />
      </section>

      {locked.length > 0 && (
        <section className="section" aria-labelledby="locked-h">
          <div className="section-head">
            <h2 id="locked-h">Still to earn</h2>
            <span className="muted">{locked.length} to go</span>
          </div>
          <ul className="locked">
            {locked.map((b) => (
              <li key={b.id}>
                <button type="button" className="locked__item" onClick={() => setCloseup(b.id)}>
                  <span className="locked__art">
                    <img src={b.art} alt="" draggable={false} />
                    <Lock size={14} aria-hidden="true" />
                  </span>
                  <span className="locked__text">
                    <strong>{b.name}</strong>
                    <span>{b.howToEarn}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className={`notice storage-note${progress.persistent ? "" : " notice--warn"}`}>
        <Info size={16} aria-hidden="true" />
        <span>Your name, map icon and board are saved in this browser only. They're never sent anywhere, and nobody else can see them.</span>
      </p>

      <AvatarPicker open={picker} onClose={() => setPicker(false)} />
      <BadgeCloseup id={closeup} onClose={() => setCloseup(null)} />
    </div>
  );
}
