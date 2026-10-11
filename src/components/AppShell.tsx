import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { BookOpen, Home, Map as MapIcon, Menu, MapPinned, RotateCcw, Stamp, UserRound } from "lucide-react";
import { SITES } from "../content/sites";
import { STORY_LANGUAGES } from "../content/languages";
import type { LangCode } from "../content/types";
import { progress, useProgress } from "../state/progress";
import { isDemoStamp } from "../content/demo-stamps";
import { addDemoStamps, removeDemoStamps } from "../features/passport/demoStamps";
import { profile } from "../state/profile";
import { forgetGuestIdentity } from "../services/memories";
import { clearAllMemoryDrafts } from "../features/memories/draft";
import { setPreferences, usePreferences, type MotionPref } from "../state/preferences";
import { STATUS_LABEL, useGeo } from "../features/location/geo-context";
import { Button, IconButton } from "./Button";
import { Sheet } from "./Sheet";
import { Tag } from "./Media";
import { useToast } from "./Toast";
import "./shell.css";

export function AppShell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  return (
    <>
      <div id="app-shell" className="shell">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="topbar">
          <Link to="/" className="topbar__brand" aria-label="Heirloom home">
            <img src="/assets/brand/mark.svg" alt="" width={30} height={30} />
            <span>Heirloom</span>
          </Link>
          <IconButton label="More: about, privacy, preferences and demo tools" onClick={() => setMenu(true)}>
            <Menu size={24} />
          </IconButton>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <nav className="bottomnav" aria-label="Primary">
          <NavLink to="/" end className="bottomnav__item">
            <Home size={22} aria-hidden="true" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/map" className="bottomnav__item">
            <MapIcon size={22} aria-hidden="true" />
            <span>Map</span>
          </NavLink>
          <NavLink to="/passport" className="bottomnav__item">
            <BookOpen size={22} aria-hidden="true" />
            <span>Passport</span>
          </NavLink>
          <NavLink to="/profile" className="bottomnav__item">
            <UserRound size={22} aria-hidden="true" />
            <span>Profile</span>
          </NavLink>
        </nav>
      </div>
      <MoreMenu open={menu} onClose={() => setMenu(false)} />
    </>
  );
}

function MoreMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePreferences();
  const geo = useGeo();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const hasDemoStamps = useProgress().earnedStamps.some((s) => isDemoStamp(s.siteId));
  const go = (to: string) => {
    onClose();
    navigate(to);
  };
  return (
    <Sheet open={open} onClose={onClose} title="More" size="tall">
      <nav aria-label="Secondary" className="menu-links">
        <button type="button" onClick={() => go("/about")}>
          About Heirloom &amp; sources
        </button>
        <button type="button" onClick={() => go("/privacy")}>
          Privacy &amp; permissions
        </button>
        <button type="button" onClick={() => go("/terms")}>
          Community rules &amp; terms
        </button>
      </nav>

      <h3 className="label menu-h">Preferences</h3>
      <fieldset className="pref">
        <legend>Motion</legend>
        <div className="chips" role="radiogroup" aria-label="Motion">
          {(["system", "reduce", "full"] as MotionPref[]).map((m) => (
            <button key={m} type="button" role="radio" className="chip" aria-checked={prefs.motion === m} onClick={() => setPreferences({ motion: m })}>
              {m === "system" ? "Match device" : m === "reduce" ? "Reduce motion" : "Full motion"}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="pref">
        <legend>Sound effects</legend>
        <div className="chips" role="radiogroup" aria-label="Sound effects">
          <button type="button" role="radio" className="chip" aria-checked={prefs.soundEffects} onClick={() => setPreferences({ soundEffects: true })}>
            On
          </button>
          <button type="button" role="radio" className="chip" aria-checked={!prefs.soundEffects} onClick={() => setPreferences({ soundEffects: false })}>
            Off
          </button>
        </div>
      </fieldset>
      <fieldset className="pref">
        <legend>Story language</legend>
        <div className="chips" role="radiogroup" aria-label="Default story language">
          {STORY_LANGUAGES.filter((l) => l.code !== "ta").map((l) => (
            <button key={l.code} type="button" role="radio" lang={l.bcp47} className="chip" aria-checked={prefs.storyLang === l.code} onClick={() => setPreferences({ storyLang: l.code as LangCode })}>
              {l.label}
            </button>
          ))}
        </div>
        <p className="muted pref__note">中文 and Melayu are draft translations awaiting community review. தமிழ் is not available yet.</p>
      </fieldset>

      <h3 className="label menu-h">Location</h3>
      <p className="muted pref__note">
        {STATUS_LABEL[geo.status]}. Used only while Heirloom is open, to suggest nearby places. Never stored.
      </p>
      <div className="menu-row">
        {geo.status === "active" || geo.status === "approximate" || geo.status === "requesting" ? (
          <Button variant="secondary" size="sm" onClick={geo.stop}>
            Turn location off
          </Button>
        ) : (
          <Button variant="secondary" size="sm" icon={<MapPinned size={16} />} onClick={geo.start}>
            Find places near me
          </Button>
        )}
      </div>

      <h3 className="label menu-h">
        Demo tools <Tag tone="demo">Demo</Tag>
      </h3>
      <p className="muted pref__note">For judging and testing away from the sites. A simulated arrival is labelled as such and never uses your real location.</p>
      <div className="menu-row">
        {SITES.map((s) => (
          <Button
            key={s.id}
            variant="blue"
            size="sm"
            onClick={() => {
              onClose();
              geo.simulateArrival(s.id);
            }}
          >
            Simulate arrival: {s.name}
          </Button>
        ))}
      </div>
      <div className="menu-row" style={{ marginTop: 12 }}>
        {hasDemoStamps ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<Stamp size={16} />}
            onClick={() => {
              removeDemoStamps();
              toast({ title: "Demo stamps removed", body: "Only stamps from real visits are left." });
            }}
          >
            Remove the 10 demo stamps
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            icon={<Stamp size={16} />}
            onClick={() => {
              const n = addDemoStamps();
              onClose();
              toast({ title: `${n} demo stamps added`, body: "7 are already pressed into your passport; 3 wait in the stamp tray to place.", tone: "success" });
            }}
          >
            Add 10 demo stamps
          </Button>
        )}
      </div>
      <div className="menu-row" style={{ marginTop: 12 }}>
        {!confirmReset ? (
          <Button variant="ghost" size="sm" icon={<RotateCcw size={16} />} onClick={() => setConfirmReset(true)}>
            Reset this browser's progress…
          </Button>
        ) : (
          <div className="notice notice--warn" role="alert">
            <span>
              This erases every stamp, placement, badge and visit saved in this browser, plus unsent memory drafts, and starts a new anonymous identity. Memories already
              shared stay on the server for moderators. It can't be undone.
              <span className="menu-row" style={{ marginTop: 8 }}>
                <Button
                  variant="ink"
                  size="sm"
                  onClick={() => {
                    progress.resetProgress();
                    profile.reset();
                    forgetGuestIdentity();
                    clearAllMemoryDrafts();
                    setConfirmReset(false);
                    onClose();
                    toast({ title: "Progress reset", body: "This browser now has a fresh, empty passport." });
                  }}
                >
                  Erase progress
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Keep it
                </Button>
              </span>
            </span>
          </div>
        )}
      </div>
    </Sheet>
  );
}
