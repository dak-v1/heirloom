// Pure geometry for turning a passport leaf. No three.js here, so it is easy to test.
//
// A leaf is a strip hinged at the spine (local x = 0). Its pose is a base `angle`
// (rotation about the spine: 0 = lying flat on the right, about −π = lying on the left)
// plus a `curl`: extra bend that grows toward the outer edge, so a turning page sags
// like paper instead of swinging like a board.

export interface LeafPose {
  /** Radians about the spine (+y). 0 = flat on the right; negative turns toward the left. */
  angle: number;
  /** Extra radians reached at the outer edge (positive lags behind a forward turn). */
  curl: number;
}

/**
 * Bend a leaf's columns. `xs` are the rest distances of each column from the spine
 * (ascending, all ≥ 0). Writes the bent [x, z] of each column into `out` (length 2·xs.length).
 * The sheet keeps its length: positions are integrated along the bent centre line.
 */
export function bendColumns(xs: ArrayLike<number>, pose: LeafPose, out: Float32Array | number[]) {
  const L = xs[xs.length - 1] || 1;
  const SUB = 6;
  let s = 0;
  let x = 0;
  let z = 0;
  for (let c = 0; c < xs.length; c++) {
    const target = xs[c];
    const step = (target - s) / SUB;
    for (let k = 0; k < SUB && step > 0; k++) {
      const mid = s + step * (k + 0.5);
      const a = pose.angle + pose.curl * (mid / L) ** 2;
      // Rotating +x by `a` about +y gives (cos a, −sin a) in (x, z).
      x += step * Math.cos(a);
      z -= step * Math.sin(a);
    }
    s = target;
    out[c * 2] = x;
    out[c * 2 + 1] = z;
  }
  return out;
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Pose of a leaf part-way through a turn. `turn` 0 = resting on the right, 1 = resting on
 * the left at `restAngle`. `direction` +1 for a forward turn, −1 for turning back.
 */
export function leafPose(turn: number, restAngle: number, direction: 1 | -1, curlAmount = 0.95): LeafPose {
  const t = Math.min(1, Math.max(0, turn));
  const e = easeInOut(t);
  return { angle: restAngle * e, curl: curlAmount * Math.sin(Math.PI * t) * direction };
}
