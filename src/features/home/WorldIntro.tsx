import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import "./world-intro.css";

const WorldGlobe = lazy(() => import("./WorldGlobe").then((module) => ({ default: module.WorldGlobe })));

interface WorldIntroProps {
  reducedMotion: boolean;
  onComplete: () => void;
}

export function WorldIntro({ reducedMotion, onComplete }: WorldIntroProps) {
  const [leaving, setLeaving] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  const fadeTimerRef = useRef<number | undefined>(undefined);
  const completeTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const fadeDelay = reducedMotion ? 700 : 4700;
    const completeDelay = reducedMotion ? 1100 : 5200;
    fadeTimerRef.current = window.setTimeout(() => setLeaving(true), fadeDelay);
    completeTimerRef.current = window.setTimeout(complete, completeDelay);
    return () => {
      window.clearTimeout(fadeTimerRef.current);
      window.clearTimeout(completeTimerRef.current);
    };
    // Timers are restarted only when the motion preference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  function complete() {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }

  return (
    <div
      className={`world-intro${leaving ? " is-leaving" : ""}${reducedMotion ? " is-reduced" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Singapore, Reimagined"
      aria-live="polite"
    >
      <div className="world-intro__content">
        <p className="world-intro__eyebrow">A heritage journey begins</p>
        <div className="world-intro__globe-wrap" aria-hidden="true">
          <Suspense fallback={<div className="world-globe is-fallback"><div className="world-globe__fallback" /></div>}>
            <WorldGlobe reducedMotion={reducedMotion} />
          </Suspense>
          <div className="world-intro__location"><ArrowDown size={15} strokeWidth={2.2} /> Singapore</div>
        </div>
        <div className="world-intro__wordmark">
          <span>Singapore, Reimagined</span>
          <h1>Every street has a story.</h1>
        </div>
      </div>
    </div>
  );
}
