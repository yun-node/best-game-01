// Emberfall — tuning constants, palette and wave table.
// One place for every number that shapes how the game feels.

export const ARENA_W = 960;
export const ARENA_H = 600;

export const PALETTE = {
  bgTop: '#0b0620',
  bgBottom: '#160a33',
  nebulaA: 'rgba(255, 94, 20, 0.10)',
  nebulaB: 'rgba(64, 224, 255, 0.08)',
  nebulaC: 'rgba(255, 45, 149, 0.07)',
  ember: '#ff7a1a',
  emberHot: '#ffc23d',
  cyan: '#40e0ff',
  magenta: '#ff2d95',
  violet: '#9b5cff',
  green: '#5cffa1',
  white: '#f4f6ff',
  dim: '#8a8fb0',
  danger: '#ff3b30',
};

export const PLAYER = {
  radius: 14,
  speed: 265,
  hull: 3,
  maxHull: 5,
  fireInterval: 0.16,
  bulletSpeed: 540,
  bulletDamage: 1,
  bulletRadius: 4,
  bombs: 2,
  maxBombs: 4,
  invulnTime: 1.6,
  magnetRadius: 90,
  shardHealEvery: 30,
};

export const ENEMIES = {
  drifter: { hp: 2, speed: 62, radius: 15, score: 50, shards: 1, color: '#ff2d95', damage: 1 },
  stinger: { hp: 1, speed: 150, radius: 11, score: 80, shards: 1, color: '#ffc23d', damage: 1 },
  weaver: { hp: 3, speed: 78, radius: 14, score: 120, shards: 2, color: '#9b5cff', damage: 1, shootEvery: 1.7 },
  bulwark: { hp: 9, speed: 38, radius: 24, score: 200, shards: 3, color: '#40e0ff', damage: 1 },
};

export const ELITE = { hpMul: 2.6, radiusMul: 1.35, scoreMul: 3, shardMul: 3 };

export const WAVES_TOTAL = 10;

// Wave n: how many spawn points it costs and what may appear.
// Composition weights shift as waves go on: weavers from 3, bulwarks from 4,
// elites from 5. Budget grows so later waves stay tense but fair.
export function wavePlan(n) {
  const budget = 6 + n * 4;
  const table = { drifter: 10, stinger: n >= 2 ? 6 : 0, weaver: n >= 3 ? 5 : 0, bulwark: n >= 4 ? 3 : 0 };
  const eliteChance = n >= 5 ? Math.min(0.08 + (n - 5) * 0.02, 0.18) : 0;
  const spawnGap = Math.max(0.55, 1.15 - n * 0.06);
  return { budget, table, eliteChance, spawnGap };
}

// One of three upgrade cards offered after each cleared wave.
export const UPGRADES = [
  { id: 'damage', name: 'Heavy Ember', desc: '+25% bullet damage', icon: '▲', color: '#ff7a1a' },
  { id: 'rapid', name: 'Rapid Coil', desc: '+30% fire rate', icon: '»', color: '#40e0ff' },
  { id: 'hull', name: 'Hull Plating', desc: '+1 max hull, repair 1', icon: '♥', color: '#5cffa1' },
  { id: 'bomb', name: 'Bomb Rack', desc: '+1 bomb (max 4)', icon: '✸', color: '#ffc23d' },
  { id: 'magnet', name: 'Shard Magnet', desc: '+60% shard pickup range', icon: '◎', color: '#ff2d95' },
  { id: 'speed', name: 'Ion Thrusters', desc: '+15% move speed', icon: '➤', color: '#9b5cff' },
  { id: 'pierce', name: 'Piercing Rounds', desc: 'Bullets pass through 1 extra enemy', icon: '↣', color: '#f4f6ff' },
  { id: 'aegis', name: 'Aegis Field', desc: 'Start each wave with a shield', icon: '⬡', color: '#40e0ff' },
];

export const SHOT_PARAM = 'shot';
