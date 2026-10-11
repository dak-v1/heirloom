export const ORB_COLORS = ["#ff815b", "#ffd05f", "#a5d66b", "#58d8ce", "#ee8699", "#c09bff", "#80b5ff", "#ffe9a8"];
export const AMBIENT_ORB_COUNT = 30;

/** Positions for memory orbs: close enough to read as a gathered archive, with small size variation. */
export function memoryOrbLayout(index: number, count: number) {
  const angle = index * 2.399963229728653;
  const radius = count === 1 ? 0 : Math.min(29, 7 + Math.sqrt(index + 1) * 6);
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 51 + Math.sin(angle) * radius * 0.68,
    size: 66 + ((index * 13 + count * 7) % 20),
  };
}

/** Decorative lights add depth to the archive without representing extra submissions. */
export function ambientOrbLayout(index: number) {
  const angle = index * 2.399963229728653;
  const ring = [17, 23, 29, 35][index % 4];
  return {
    x: 50 + Math.cos(angle) * ring * 0.83,
    y: 51 + Math.sin(angle) * ring * 0.58,
    size: 15 + ((index * 11 + 3) % 18),
  };
}
