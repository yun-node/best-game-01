// Wave plans and upgrade offers: what spawns, when, and what the player
// chooses between waves. Pure data + spawning; the game loop owns timing.

import { ARENA_W, ARENA_H, WAVES_TOTAL, UPGRADES, wavePlan } from './config.js';
import { pickWeighted, pickN } from './random.js';
import { Enemy } from './entities.js';

export class WaveDirector {
  constructor(rng) {
    this.rng = rng;
    this.wave = 0;
    this.toSpawn = 0;
    this.spawnTimer = 0;
    this.plan = null;
    this.active = false;
    this.cleared = false;
  }

  startWave(n) {
    this.wave = n;
    this.plan = wavePlan(n);
    this.toSpawn = this.plan.budget;
    this.spawnTimer = 0.6;
    this.active = true;
    this.cleared = false;
  }

  // Returns freshly spawned enemies (possibly empty). Call every frame.
  update(dt, enemies) {
    if (!this.active) return [];
    const out = [];
    if (this.toSpawn > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.plan.spawnGap * (0.7 + this.rng() * 0.6);
        const kind = pickWeighted(this.rng, this.plan.table);
        const edge = Math.floor(this.rng() * 4);
        let x;
        let y;
        if (edge === 0) { x = this.rng() * ARENA_W; y = -24; }
        else if (edge === 1) { x = ARENA_W + 24; y = this.rng() * ARENA_H; }
        else if (edge === 2) { x = this.rng() * ARENA_W; y = ARENA_H + 24; }
        else { x = -24; y = this.rng() * ARENA_H; }
        const elite = this.rng() < this.plan.eliteChance;
        out.push(new Enemy(kind, x, y, this.wave, elite));
        this.toSpawn -= 1;
      }
    } else if (enemies.length === 0) {
      this.active = false;
      this.cleared = true;
    }
    return out;
  }

  get totalWaves() {
    return WAVES_TOTAL;
  }

  // Three distinct upgrade cards for the wave-clear screen.
  offerUpgrades() {
    return pickN(this.rng, UPGRADES, 3);
  }
}
