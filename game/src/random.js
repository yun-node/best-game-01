// Seeded RNG (mulberry32) plus small helpers.
// Live play uses Math.random; screenshot scenes use a fixed seed so a
// capture is reproducible.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted(rng, table) {
  let total = 0;
  for (const k of Object.keys(table)) total += table[k];
  if (total <= 0) return 'drifter';
  let roll = rng() * total;
  for (const k of Object.keys(table)) {
    roll -= table[k];
    if (roll <= 0) return k;
  }
  return 'drifter';
}

export function pickN(rng, arr, n) {
  const copy = arr.slice();
  const out = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}
