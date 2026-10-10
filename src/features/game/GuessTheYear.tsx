import { useEffect, useRef } from "react";
import { ArrowRight, Minus, Plus, RotateCcw } from "lucide-react";
import type { GuessTheYearGame } from "../../content/types";
import { Sheet } from "../../components/Sheet";
import { Button } from "../../components/Button";
import { FramedImage, Tag } from "../../components/Media";
import { describeOffset, MAX_ROUND_POINTS, scoreGuess } from "./scoring";

export interface GameState {
  phase: "intro" | "round" | "reveal" | "results";
  round: number;
  guesses: number[];
  current: number;
  /** Results already recorded for this playthrough. */
  recorded: boolean;
}

export const initialGameState = (game: GuessTheYearGame): GameState => ({
  phase: "intro",
  round: 0,
  guesses: [],
  current: Math.round((game.range[0] + game.range[1]) / 2 / 10) * 10,
  recorded: false,
});

interface Props {
  open: boolean;
  game: GuessTheYearGame;
  siteName: string;
  state: GameState;
  setState: (s: GameState) => void;
  onClose: () => void;
  onSkip: () => void;
  onComplete: (result: { score: number; maxScore: number; perfect: boolean }) => void;
}

export function GuessTheYear({ open, game, siteName, state, setState, onClose, onSkip, onComplete }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [min, max] = game.range;
  const round = game.rounds[state.round];
  const clamp = (y: number) => Math.min(max, Math.max(min, y));
  const set = (patch: Partial<GameState>) => setState({ ...state, ...patch });

  const scores = state.guesses.map((g, i) => scoreGuess(g, game.rounds[i].accept));
  const total = scores.reduce((a, s) => a + s.points, 0);
  const maxScore = game.rounds.length * MAX_ROUND_POINTS;

  useEffect(() => {
    if (state.phase === "results" && !state.recorded) {
      onComplete({ score: total, maxScore, perfect: scores.every((s) => s.verdict === "spot-on") });
      setState({ ...state, recorded: true });
    }
  }, [state, total, maxScore, scores, onComplete, setState]);

  // Move focus to the new screen's heading so screen readers follow the flow.
  useEffect(() => {
    headingRef.current?.focus();
  }, [state.phase, state.round]);

  const ticks: number[] = [];
  for (let y = Math.ceil(min / 20) * 20; y <= max; y += 20) ticks.push(y);

  let body: React.ReactNode = null;
  if (state.phase === "intro") {
    body = (
      <div className="game-intro">
        <img src="/assets/badges/time-traveller.svg" alt="" width={120} height={120} />
        <h3 ref={headingRef} tabIndex={-1}>
          Can you date the past?
        </h3>
        <p>{game.intro}</p>
        <p className="muted">
          {game.rounds.length} photographs · about 1–2 minutes · optional. Skipping never affects your stamp.
        </p>
        <div className="game-actions">
          <Button size="lg" ticket iconRight={<ArrowRight size={18} />} onClick={() => set({ phase: "round", round: 0, guesses: [] })}>
            Play
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </div>
    );
  } else if (state.phase === "round" && round) {
    body = (
      <div className="game-round">
        <p className="label">
          Photo {state.round + 1} of {game.rounds.length}
        </p>
        <FramedImage image={round.image} className="game-photo" eager />
        <h3 ref={headingRef} tabIndex={-1} className="game-prompt">
          {round.prompt}
        </h3>
        <output className="game-year" aria-live="polite" htmlFor="year-slider">
          {state.current}
        </output>
        <div className="game-slider">
          <input
            id="year-slider"
            type="range"
            min={min}
            max={max}
            step={1}
            value={state.current}
            onChange={(e) => set({ current: Number(e.target.value) })}
            aria-label="Your guess, year"
            aria-valuetext={`${state.current}`}
          />
          <div className="game-ticks" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} style={{ left: `${((t - min) / (max - min)) * 100}%` }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="game-steppers">
          <Button variant="secondary" size="sm" onClick={() => set({ current: clamp(state.current - 10) })} aria-label="Ten years earlier">
            <Minus size={14} aria-hidden="true" />
            10
          </Button>
          <Button variant="secondary" size="sm" onClick={() => set({ current: clamp(state.current - 1) })} aria-label="One year earlier">
            <Minus size={14} aria-hidden="true" />1
          </Button>
          <Button variant="secondary" size="sm" onClick={() => set({ current: clamp(state.current + 1) })} aria-label="One year later">
            <Plus size={14} aria-hidden="true" />1
          </Button>
          <Button variant="secondary" size="sm" onClick={() => set({ current: clamp(state.current + 10) })} aria-label="Ten years later">
            <Plus size={14} aria-hidden="true" />
            10
          </Button>
        </div>
        <Button size="lg" block onClick={() => set({ phase: "reveal", guesses: [...state.guesses.slice(0, state.round), state.current] })}>
          Submit {state.current}
        </Button>
      </div>
    );
  } else if (state.phase === "reveal" && round) {
    const guess = state.guesses[state.round];
    const s = scoreGuess(guess, round.accept);
    const last = state.round === game.rounds.length - 1;
    body = (
      <div className="game-reveal">
        <FramedImage image={round.image} className="game-photo game-photo--small" />
        <div className={`game-verdict game-verdict--${s.verdict}`}>
          <h3 ref={headingRef} tabIndex={-1}>
            {s.headline}
          </h3>
          <span className="game-points">+{s.points}</span>
        </div>
        <p className="game-answer">
          <span>
            Your guess: <strong>{guess}</strong>
          </span>
          <span>
            Answer: <strong>{round.answerLabel}</strong>
            {round.accept[0] !== round.accept[1] && <span className="muted"> (we accept {round.accept[0]}–{round.accept[1]})</span>}
          </span>
        </p>
        <p className="muted">{describeOffset(s.yearsOff, guess, round.accept)}</p>
        {round.clues.length > 0 && (
          <div className="game-clues">
            <h4 className="label">Clues in the picture</h4>
            <ul>
              {round.clues.map((c) => (
                <li key={c.label}>
                  <strong>{c.label}.</strong> {c.detail}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="game-explain">{round.explanation}</p>
        <p className="game-credit muted">
          {round.image.credit.creator} · {round.image.credit.collection} ·{" "}
          <a href={round.image.credit.sourceUrl} target="_blank" rel="noopener noreferrer">
            {round.image.credit.license}
          </a>
        </p>
        <Button size="lg" block iconRight={<ArrowRight size={18} />} onClick={() => (last ? set({ phase: "results" }) : set({ phase: "round", round: state.round + 1 }))}>
          {last ? "See your score" : "Next photo"}
        </Button>
      </div>
    );
  } else if (state.phase === "results") {
    const perfect = scores.every((s) => s.verdict === "spot-on");
    body = (
      <div className="game-results">
        <h3 ref={headingRef} tabIndex={-1}>
          {total} / {maxScore} points
        </h3>
        <p className="muted">{perfect ? "Every guess inside the documented dates. Remarkable." : "Archives often only know a range of years. Now you know how to read the clues."}</p>
        <ol className="game-summary">
          {game.rounds.map((r, i) => (
            <li key={r.id}>
              <span>Photo {i + 1}</span>
              <span>
                {state.guesses[i]} → {r.answerLabel}
              </span>
              <Tag tone={scores[i]?.verdict === "spot-on" ? "olive" : "plain"}>+{scores[i]?.points ?? 0}</Tag>
            </li>
          ))}
        </ol>
        <div className="game-actions">
          <Button size="lg" ticket onClick={onClose}>
            Back to {siteName}
          </Button>
          <Button variant="ghost" icon={<RotateCcw size={16} />} onClick={() => setState({ ...initialGameState(game), phase: "round" })}>
            Play again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title={`${game.title} · ${siteName}`} size="full" className="game-sheet" closeLabel={`Close game and return to ${siteName}`}>
      {body}
    </Sheet>
  );
}
