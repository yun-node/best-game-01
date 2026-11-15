// The things that move and fight: the player ship, the four enemy kinds,
// bullets, ember shards and power-ups. Logic lives here; drawing is in
// render.js except for each entity's own shape, which it draws itself.

import { ARENA_W, ARENA_H, ENEMIES, ELITE, PLAYER } from './config.js';
import { clamp, dist2, angleTo } from './random.js';

let nextId = 1;

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = ARENA_W / 2;
    this.y = ARENA_H / 2 + 120;
    this.vx = 0;
    this.vy = 0;
    this.radius = PLAYER.radius;
    this.angle = -Math.PI / 2;
    this.hull = PLAYER.hull;
    this.maxHull = PLAYER.maxHull;
    this.bombs = PLAYER.bombs;
    this.fireTimer = 0;
    this.invuln = 0;
    this.shield = 0;
    this.rapid = 0;
    this.alive = true;
    this.thrust = 0;
    // Upgrade state, reset each run.
    this.damageMul = 1;
    this.fireMul = 1;
    this.speedMul = 1;
    this.magnetMul = 1;
    this.pierce = 0;
    this.aegis = false;
    this.shards = 0;
    this.shardBank = 0;
  }

  applyUpgrade(id) {
    if (id === 'damage') this.damageMul *= 1.25;
    if (id === 'rapid') this.fireMul *= 1.3;
    if (id === 'hull') { this.maxHull = Math.min(7, this.maxHull + 1); this.hull = Math.min(this.maxHull, this.hull + 1); }
    if (id === 'bomb') this.bombs = Math.min(PLAYER.maxBombs, this.bombs + 1);
    if (id === 'magnet') this.magnetMul *= 1.6;
    if (id === 'speed') this.speedMul *= 1.15;
    if (id === 'pierce') this.pierce += 1;
    if (id === 'aegis') this.aegis = true;
  }

  update(dt, move, aimX, aimY, firing) {
    const speed = PLAYER.speed * this.speedMul;
    this.vx = move.x * speed;
    this.vy = move.y * speed;
    this.x = clamp(this.x + this.vx * dt, this.radius, ARENA_W - this.radius);
    this.y = clamp(this.y + this.vy * dt, this.radius, ARENA_H - this.radius);
    this.thrust = Math.abs(move.x) + Math.abs(move.y) > 0 ? 1 : 0;
    this.angle = angleTo(this.x, this.y, aimX, aimY);
    this.fireTimer -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.shield > 0) this.shield -= dt;
    if (this.rapid > 0) this.rapid -= dt;
    if (firing && this.fireTimer <= 0) {
      this.fireTimer = (PLAYER.fireInterval / this.fireMul) * (this.rapid > 0 ? 0.55 : 1);
      return true;
    }
    return false;
  }

  takeHit() {
    if (this.invuln > 0 || !this.alive) return false;
    if (this.shield > 0) {
      this.shield = 0;
      this.invuln = 0.8;
      return 'shield';
    }
    this.hull -= 1;
    this.invuln = PLAYER.invulnTime;
    if (this.hull <= 0) this.alive = false;
    return 'hit';
  }
}

export class Enemy {
  constructor(kind, x, y, wave, elite) {
    const base = ENEMIES[kind];
    this.id = nextId++;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.elite = elite;
    this.radius = base.radius * (elite ? ELITE.radiusMul : 1);
    this.hp = Math.round(base.hp * (1 + 0.12 * (wave - 1)) * (elite ? ELITE.hpMul : 1));
    this.maxHp = this.hp;
    this.speed = base.speed * (0.9 + Math.random() * 0.2) * (elite ? 0.9 : 1);
    this.score = base.score * (elite ? ELITE.scoreMul : 1);
    this.shards = base.shards * (elite ? ELITE.shardMul : 1);
    this.color = base.color;
    this.shootEvery = base.shootEvery || 0;
    this.shootTimer = 1 + Math.random();
    this.wobble = Math.random() * Math.PI * 2;
    this.flash = 0;
    this.spin = 0;
  }

  update(dt, player, time) {
    this.flash = Math.max(0, this.flash - dt * 6);
    this.wobble += dt * 2;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    let mx = 0;
    let my = 0;
    if (this.kind === 'drifter') {
      mx = dx / d; my = dy / d;
    } else if (this.kind === 'stinger') {
      const weave = Math.sin(this.wobble * 2.2) * 0.7;
      mx = dx / d + -dy / d * weave * 0.4;
      my = dy / d + dx / d * weave * 0.4;
    } else if (this.kind === 'weaver') {
      // Keep a ring around the player and strafe.
      const want = 260;
      const radial = d > want + 30 ? 1 : d < want - 30 ? -1 : 0;
      const strafe = Math.sin(this.wobble) > 0 ? 1 : -1;
      mx = (dx / d) * radial * 0.8 + (-dy / d) * strafe * 0.7;
      my = (dy / d) * radial * 0.8 + (dx / d) * strafe * 0.7;
    } else if (this.kind === 'bulwark') {
      mx = dx / d; my = dy / d;
    }
    const len = Math.hypot(mx, my) || 1;
    this.x += (mx / len) * this.speed * dt;
    this.y += (my / len) * this.speed * dt;
    this.x = clamp(this.x, this.radius, ARENA_W - this.radius);
    this.y = clamp(this.y, this.radius, ARENA_H - this.radius);
    this.spin += dt;
    if (this.shootEvery > 0) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && d < 520) {
        this.shootTimer = this.shootEvery * (0.85 + Math.random() * 0.3);
        return { shoot: true, angle: angleTo(this.x, this.y, player.x, player.y) };
      }
    }
    return null;
  }

  damage(amount) {
    this.hp -= amount;
    this.flash = 1;
    return this.hp <= 0;
  }
}

export class Bullet {
  constructor(x, y, angle, speed, damage, friendly, pierce) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = friendly ? PLAYER.bulletRadius : 6;
    this.damage = damage;
    this.friendly = friendly;
    this.pierce = pierce || 0;
    this.dead = false;
    this.hitIds = new Set();
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -20 || this.x > ARENA_W + 20 || this.y < -20 || this.y > ARENA_H + 20) this.dead = true;
  }
}

export class Shard {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.vx = (Math.random() - 0.5) * 120;
    this.vy = (Math.random() - 0.5) * 120;
    this.radius = 6;
    this.dead = false;
    this.spin = Math.random() * Math.PI * 2;
  }

  update(dt, player) {
    this.spin += dt * 5;
    const d2 = dist2(this.x, this.y, player.x, player.y);
    const magnet = PLAYER.magnetRadius * player.magnetMul;
    if (d2 < magnet * magnet) {
      const d = Math.sqrt(d2) || 1;
      const pull = 520 * dt;
      this.x += ((player.x - this.x) / d) * pull;
      this.y += ((player.y - this.y) / d) * pull;
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.96;
      this.vy *= 0.96;
    }
    if (d2 < (player.radius + this.radius + 6) * (player.radius + this.radius + 6)) this.dead = true;
  }
}

export class PowerUp {
  constructor(x, y, kind) {
    this.x = x;
    this.y = y;
    this.kind = kind; // 'shield' | 'rapid' | 'bomb'
    this.radius = 12;
    this.dead = false;
    this.bob = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.bob += dt * 3;
    this.y += Math.sin(this.bob) * 12 * dt;
  }
}
