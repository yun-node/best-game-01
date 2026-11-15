// Particles, floating score text, shockwave rings and the starfield.
// Pure visual feedback: nothing here changes the game state.

import { ARENA_W, ARENA_H } from './config.js';

export class Particles {
  constructor() {
    this.list = [];
    this.texts = [];
    this.rings = [];
    this.stars = [];
    for (let i = 0; i < 110; i++) {
      this.stars.push({
        x: Math.random() * ARENA_W,
        y: Math.random() * ARENA_H,
        r: Math.random() * 1.6 + 0.4,
        tw: Math.random() * Math.PI * 2,
        speed: Math.random() * 6 + 2,
      });
    }
  }

  burst(x, y, color, n, speed, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.list.push({
        x, y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: life * (0.5 + Math.random() * 0.5), maxLife: life,
        size: 1.5 + Math.random() * 2.5, color,
      });
    }
  }

  ring(x, y, color, maxR) {
    this.rings.push({ x, y, r: 6, maxR, color, life: 0.45, maxLife: 0.45 });
  }

  text(x, y, str, color) {
    this.texts.push({ x, y, str, color, life: 0.9, maxLife: 0.9 });
  }

  update(dt) {
    for (const p of this.list) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
    for (const t of this.texts) { t.y -= 34 * dt; t.life -= dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const r of this.rings) { r.r += (r.maxR - r.r) * dt * 9; r.life -= dt; }
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const s of this.stars) {
      s.y += s.speed * dt;
      s.tw += dt * 2;
      if (s.y > ARENA_H + 2) { s.y = -2; s.x = Math.random() * ARENA_W; }
    }
  }

  drawBackground(ctx, time) {
    const g = ctx.createLinearGradient(0, 0, 0, ARENA_H);
    g.addColorStop(0, '#0b0620');
    g.addColorStop(1, '#160a33');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ARENA_W, ARENA_H);
    // Nebula blobs, slow-drifting.
    this.nebula(ctx, 220 + Math.sin(time * 0.07) * 20, 150, 190, 'rgba(255, 94, 20, 0.10)');
    this.nebula(ctx, 760 + Math.cos(time * 0.05) * 24, 420, 220, 'rgba(64, 224, 255, 0.08)');
    this.nebula(ctx, 520, 90 + Math.sin(time * 0.09) * 12, 150, 'rgba(255, 45, 149, 0.07)');
    // Stars.
    for (const s of this.stars) {
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(s.tw));
      ctx.fillStyle = '#dfe6ff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
  }

  nebula(ctx, x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  draw(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const r of this.rings) {
      ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
