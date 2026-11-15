// Emberfall — the game itself: state machine, loop, collisions, waves,
// bombs, upgrades and the ?shot= scenes used for screenshots.

import { ARENA_W, ARENA_H, PLAYER, WAVES_TOTAL } from './config.js';
import { mulberry32, clamp } from './random.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { Player, Enemy, Bullet, Shard, PowerUp } from './entities.js';
import { Particles } from './particles.js';
import { WaveDirector } from './waves.js';
import * as Render from './render.js';

const BEST_KEY = 'emberfall-best';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sound = new SoundBank();
    this.particles = new Particles();
    this.player = new Player();
    this.director = new WaveDirector(Math.random);
    this.state = 'title';
    this.score = 0;
    this.wave = 0;
    this.killedThisWave = 0;
    this.best = 0;
    try { this.best = Number(localStorage.getItem(BEST_KEY) || 0) || 0; } catch { this.best = 0; }
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.shards = [];
    this.powerups = [];
    this.offers = [];
    this.time = 0;
    this.shake = 0;
    this.autopilot = false;
    this.shotMode = null;
    this.last = 0;
    this.saveBest();
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      try { localStorage.setItem(BEST_KEY, String(this.best)); } catch { /* no storage */ }
    }
  }

  waveProgress() {
    if (!this.director.plan) return 0;
    return clamp(this.killedThisWave / this.director.plan.budget, 0, 1);
  }

  startRun() {
    this.player.reset();
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.shards = [];
    this.powerups = [];
    this.score = 0;
    this.wave = 0;
    this.killedThisWave = 0;
    this.input.clearPressed();
    this.director = new WaveDirector(Math.random);
    this.nextWave();
  }

  nextWave() {
    this.wave += 1;
    this.killedThisWave = 0;
    this.input.clearPressed();
    this.director.startWave(this.wave);
    if (this.player.aegis) this.player.shield = 999;
    this.state = 'playing';
  }

  onWaveCleared() {
    const bonus = 250 * this.wave;
    this.score += bonus;
    this.particles.text(ARENA_W / 2, ARENA_H / 2 - 40, `WAVE BONUS +${bonus}`, '#5cffa1');
    this.sound.waveClear();
    this.saveBest();
    if (this.wave >= WAVES_TOTAL) {
      this.state = 'victory';
      this.sound.victory();
      this.input.clearPressed();
      return;
    }
    this.offers = this.director.offerUpgrades();
    this.state = 'upgrade';
    this.input.clearPressed();
  }

  gameOver() {
    this.state = 'gameover';
    this.sound.gameOver();
    this.input.clearPressed();
    this.saveBest();
  }

  useBomb() {
    const p = this.player;
    if (this.state !== 'playing' || p.bombs <= 0) return;
    p.bombs -= 1;
    this.sound.bomb();
    this.shake = 14;
    this.particles.ring(p.x, p.y, '#ffc23d', 420);
    this.enemyBullets = [];
    for (const e of this.enemies) {
      if (e.damage(3)) this.killEnemy(e);
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }

  killEnemy(e) {
    this.score += e.score;
    this.killedThisWave += 1;
    this.particles.burst(e.x, e.y, e.color, e.elite ? 26 : 14, 240, 0.6);
    this.particles.ring(e.x, e.y, e.color, 60);
    this.particles.text(e.x, e.y - 10, `+${e.score}`, '#f4f6ff');
    this.sound.explode();
    for (let i = 0; i < e.shards; i++) this.shards.push(new Shard(e.x, e.y, 1));
    if (Math.random() < 0.08) {
      const kind = ['shield', 'rapid', 'bomb'][Math.floor(Math.random() * 3)];
      this.powerups.push(new PowerUp(e.x, e.y, kind));
    }
    if (e.kind === 'bulwark') {
      for (const off of [-14, 14]) {
        const d = new Enemy('drifter', e.x + off, e.y, this.wave, false);
        this.enemies.push(d);
      }
    }
  }

  firePlayerBullet() {
    const p = this.player;
    const a = p.angle;
    const nx = p.x + Math.cos(a) * (p.radius + 6);
    const ny = p.y + Math.sin(a) * (p.radius + 6);
    this.bullets.push(new Bullet(nx, ny, a, PLAYER.bulletSpeed, Math.max(1, Math.round(PLAYER.bulletDamage * p.damageMul)), true, p.pierce));
    this.sound.shoot();
  }

  update(dt) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 30);
    this.particles.update(dt);
    const input = this.input;
    // Clicks are tested against the buttons the previous frame's draw()
    // registered, so consume them BEFORE beginFrame() clears the list.
    const clicks = input.consumeClicks();
    input.beginFrame();

    if (this.state === 'title') {
      if (input.takePressed('Enter') || clicks.includes('start')) {
        this.sound.unlock();
        this.sound.click();
        this.startRun();
      }
      return;
    }
    if (this.state === 'upgrade') {
      let pick = -1;
      if (input.takePressed('1')) pick = 0;
      if (input.takePressed('2')) pick = 1;
      if (input.takePressed('3')) pick = 2;
      for (const c of clicks) if (c.startsWith('upgrade:')) pick = Number(c.split(':')[1]);
      if (pick >= 0 && pick < this.offers.length) {
        this.player.applyUpgrade(this.offers[pick].id);
        this.sound.powerup();
        this.nextWave();
      }
      return;
    }
    if (this.state === 'victory' || this.state === 'gameover') {
      if (input.takePressed('r') || input.takePressed('Enter') || clicks.includes('restart')) {
        this.sound.click();
        this.startRun();
      }
      return;
    }
    if (this.state !== 'playing') return;

    // Pause / mute.
    if (input.takePressed('p') || input.takePressed('Escape')) {
      this.state = 'paused';
      return;
    }
    if (input.takePressed('m')) this.sound.setMuted(!this.sound.muted);
    if (input.takePressed(' ') || input.takePressed('Spacebar')) this.useBomb();

    const p = this.player;
    if (!p.alive) { this.gameOver(); return; }

    // Autopilot (screenshot mode): orbit slowly, aim at the nearest enemy.
    let move = input.moveVector();
    let aimX = input.mouseX;
    let aimY = input.mouseY;
    let firing = input.mouseDown;
    if (this.autopilot) {
      const t = this.time * 0.55;
      move = { x: Math.cos(t) * 0.7, y: Math.sin(t) * 0.7 };
      const near = this.nearestEnemy();
      if (near) { aimX = near.x; aimY = near.y; }
      firing = true;
    }
    if (p.update(dt, move, aimX, aimY, firing)) this.firePlayerBullet();

    // Spawn.
    for (const e of this.director.update(dt, this.enemies)) this.enemies.push(e);
    if (this.director.cleared) { this.onWaveCleared(); return; }

    // Enemies.
    for (const e of this.enemies) {
      const shot = e.update(dt, p, this.time);
      if (shot && shot.shoot) {
        this.enemyBullets.push(new Bullet(e.x, e.y, shot.angle, 190, 1, false, 0));
      }
    }
    // Bullets.
    for (const b of this.bullets) b.update(dt);
    for (const b of this.enemyBullets) b.update(dt);
    // Player bullets vs enemies.
    for (const b of this.bullets) {
      if (b.dead) continue;
      for (const e of this.enemies) {
        if (b.hitIds.has(e.id)) continue;
        const rr = e.radius + b.radius;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < rr * rr) {
          b.hitIds.add(e.id);
          this.sound.hit();
          this.particles.burst(b.x, b.y, e.color, 4, 120, 0.3);
          if (e.damage(b.damage)) this.killEnemy(e);
          if (b.pierce <= 0) { b.dead = true; break; }
          b.pierce -= 1;
        }
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.enemyBullets = this.enemyBullets.filter((b) => !b.dead);
    // Enemies vs player.
    for (const e of this.enemies) {
      const rr = e.radius + p.radius - 2;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < rr * rr) {
        const res = p.takeHit();
        if (res === 'hit') {
          this.sound.hurt();
          this.shake = 10;
          this.particles.burst(p.x, p.y, '#ff3b30', 16, 220, 0.5);
          if (e.damage(2)) this.killEnemy(e);
          this.enemies = this.enemies.filter((x) => x.hp > 0);
        } else if (res === 'shield') {
          this.sound.hit();
          this.particles.ring(p.x, p.y, '#40e0ff', 70);
        }
        if (!p.alive) { this.gameOver(); return; }
      }
    }
    // Enemy bullets vs player.
    for (const b of this.enemyBullets) {
      if (b.dead) continue;
      const rr = p.radius + b.radius - 2;
      if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < rr * rr) {
        b.dead = true;
        const res = p.takeHit();
        if (res === 'hit') {
          this.sound.hurt();
          this.shake = 10;
          if (!p.alive) { this.gameOver(); return; }
        }
      }
    }
    this.enemyBullets = this.enemyBullets.filter((b) => !b.dead);
    // Shards.
    for (const s of this.shards) {
      s.update(dt, p);
      if (s.dead) {
        this.score += 10;
        p.shards += 1;
        p.shardBank += 1;
        this.sound.pickup();
        if (p.shardBank >= PLAYER.shardHealEvery && p.hull < p.maxHull) {
          p.hull += 1;
          p.shardBank -= PLAYER.shardHealEvery;
          this.particles.text(p.x, p.y - 24, '+1 HULL', '#5cffa1');
        }
      }
    }
    this.shards = this.shards.filter((s) => !s.dead);
    // Power-ups.
    for (const u of this.powerups) {
      u.update(dt);
      const rr = p.radius + u.radius + 4;
      if ((u.x - p.x) ** 2 + (u.y - p.y) ** 2 < rr * rr) {
        u.dead = true;
        this.sound.powerup();
        if (u.kind === 'shield') p.shield = 20;
        if (u.kind === 'rapid') p.rapid = 8;
        if (u.kind === 'bomb') p.bombs = Math.min(PLAYER.maxBombs, p.bombs + 1);
        this.particles.text(p.x, p.y - 24, u.kind.toUpperCase(), '#40e0ff');
      }
    }
    this.powerups = this.powerups.filter((u) => !u.dead);
  }

  nearestEnemy() {
    let bestE = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      const d = (e.x - this.player.x) ** 2 + (e.y - this.player.y) ** 2;
      if (d < bestD) { bestD = d; bestE = e; }
    }
    return bestE;
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    this.particles.drawBackground(ctx, this.time);
    if (this.state === 'playing' || this.state === 'paused') Render.drawCore(ctx, this.time);
    for (const s of this.shards) Render.drawShard(ctx, s);
    for (const u of this.powerups) Render.drawPowerUp(ctx, u);
    for (const e of this.enemies) Render.drawEnemy(ctx, e);
    for (const b of this.bullets) Render.drawBullet(ctx, b);
    for (const b of this.enemyBullets) Render.drawBullet(ctx, b);
    Render.drawPlayer(ctx, this.player, this.time);
    this.particles.draw(ctx);
    ctx.restore();
    if (this.state === 'playing' || this.state === 'paused' || this.state === 'upgrade') {
      Render.drawHUD(ctx, this);
    }
    if (this.state === 'title') Render.drawTitle(ctx, this, this.input, this.time);
    if (this.state === 'upgrade') Render.drawUpgrade(ctx, this, this.input, this.offers);
    if (this.state === 'victory') Render.drawVictory(ctx, this, this.input);
    if (this.state === 'gameover') Render.drawGameOver(ctx, this, this.input);
    if (this.state === 'paused') Render.drawPaused(ctx);
  }

  // Screenshot scenes: deterministic set-ups of real game states, reached
  // through ?shot=<name>&seed=<n> like the starter's shots.json.
  applyShotMode() {
    const q = new URLSearchParams(window.location.search);
    const shot = q.get('shot');
    if (!shot) return;
    const seed = Number(q.get('seed') || 7);
    const rng = mulberry32(seed);
    this.shotMode = shot;
    this.sound.setMuted(true);
    if (shot === 'title') {
      this.state = 'title';
      return;
    }
    if (shot === 'play') {
      this.state = 'playing';
      this.wave = 3;
      this.score = 2450;
      this.player.reset();
      this.player.x = ARENA_W / 2;
      this.player.y = ARENA_H / 2 + 80;
      this.player.hull = 3;
      this.player.bombs = 2;
      this.player.shards = 17;
      this.director = new WaveDirector(rng);
      this.director.startWave(3);
      this.director.toSpawn = 0;
      const kinds = ['drifter', 'drifter', 'stinger', 'weaver', 'bulwark'];
      for (const kind of kinds) {
        const e = new Enemy(kind, 120 + rng() * 720, 80 + rng() * 320, 3, rng() < 0.2);
        this.enemies.push(e);
      }
      for (let i = 0; i < 4; i++) {
        this.bullets.push(new Bullet(300 + i * 90, 380 - i * 30, -Math.PI / 2.4, PLAYER.bulletSpeed, 1, true, 0));
      }
      for (let i = 0; i < 3; i++) this.shards.push(new Shard(300 + rng() * 360, 300 + rng() * 160, 1));
      this.powerups.push(new PowerUp(700, 180, 'shield'));
      this.particles.burst(420, 240, '#ff2d95', 18, 200, 0.7);
      this.autopilot = true;
      return;
    }
    if (shot === 'win') {
      this.state = 'victory';
      this.wave = 10;
      this.score = 18400;
      return;
    }
    if (shot === 'over') {
      this.state = 'gameover';
      this.wave = 6;
      this.score = 7350;
      this.player.reset();
      this.player.hull = 0;
      this.player.alive = false;
      return;
    }
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    if (this.state === 'paused') {
      if (this.input.takePressed('p') || this.input.takePressed('Escape')) this.state = 'playing';
      this.draw();
      return;
    }
    this.update(dt);
    this.draw();
  }

  run() {
    this.applyShotMode();
    const loop = (now) => {
      this.frame(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__game = game;
game.run();
