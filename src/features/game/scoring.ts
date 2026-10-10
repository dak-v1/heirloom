// Guess the Year scoring. A guess inside the documented interval is always full
// marks: we never pretend to know a more exact year than the archive does.

export interface RoundScore {
  points: number;
  /** Years outside the accepted interval (0 = inside). */
  yearsOff: number;
  verdict: "spot-on" | "very-close" | "right-era" | "warmer" | "try-again";
  headline: string;
}

export const MAX_ROUND_POINTS = 100;

export function scoreGuess(guess: number, [from, to]: [number, number]): RoundScore {
  const yearsOff = guess < from ? from - guess : guess > to ? guess - to : 0;
  if (yearsOff === 0) return { points: 100, yearsOff, verdict: "spot-on", headline: "Spot on!" };
  if (yearsOff <= 5) return { points: 75, yearsOff, verdict: "very-close", headline: "So close!" };
  if (yearsOff <= 15) return { points: 40, yearsOff, verdict: "right-era", headline: "Right era" };
  if (yearsOff <= 30) return { points: 15, yearsOff, verdict: "warmer", headline: "Getting warmer" };
  return { points: 5, yearsOff, verdict: "try-again", headline: "A different era" };
}

export function describeOffset(yearsOff: number, guess: number, [from]: [number, number]): string {
  if (yearsOff === 0) return "Your guess falls inside the documented date.";
  const dir = guess < from ? "too early" : "too late";
  return `${yearsOff} year${yearsOff === 1 ? "" : "s"} ${dir}.`;
}
