// Everything the player sees: the arena, the ships, the HUD and every
// screen (title, upgrade choice, victory, game over, pause). Canvas only.

import { ARENA_W, ARENA_H, PALETTE, PLAYER, WAVES_TOTAL } from './config.js';

function glow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function noGlow(ctx) {
  ctx.shadowBlur = 0;
}

export function drawCore(ctx, time) {
  const cx = ARENA_W / 2;
  const cy = ARENA_H / 2;
  const pulse = 1 + Math.sin(time * 2.2) * 0.06;
  // The Ember Core: a dim beacon at the arena's heart. Pure scenery.
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90 * pulse);
  g.addColorStop(0, 'rgba(255, 122, 26, 0.20)');
  g.addColorStop(0.6, 'rgba(255, 122, 26, 0.05)');
  g.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 90 * pulse, 0, Math.PI * 2);
  ctx.fill();
  glow(ctx, PALETTE.ember, 18);
  ctx.strokeStyle = 'rgba(255, 194, 61, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 26 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  noGlow(ctx);
}

export function drawPlayer(ctx, p, time) {
  if (!p.alive) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.invuln > 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.35;
  if (p.shield > 0) {
    glow(ctx, PALETTE.cyan, 14);
    ctx.strokeStyle = 'rgba(64, 224, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 9 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
    noGlow(ctx);
  }
  ctx.rotate(p.angle + Math.PI / 2);
  // Ship: a dart with ember wings and a cyan cockpit.
  glow(ctx, PALETTE.ember, 16);
  ctx.fillStyle = PALETTE.ember;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(11, 12);
  ctx.lineTo(4, 7);
  ctx.lineTo(-4, 7);
  ctx.lineTo(-11, 12);
  ctx.closePath();
  ctx.fill();
  noGlow(ctx);
  ctx.fillStyle = PALETTE.cyan;
  ctx.beginPath();
  ctx.arc(0, -4, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Engine flame while moving.
  if (p.thrust) {
    glow(ctx, PALETTE.emberHot, 12);
    ctx.fillStyle = PALETTE.emberHot;
    const f = 10 + Math.random() * 8;
    ctx.beginPath();
    ctx.moveTo(-4, 10);
    ctx.lineTo(0, 10 + f);
    ctx.lineTo(4, 10);
    ctx.closePath();
    ctx.fill();
    noGlow(ctx);
  }
  ctx.restore();
}

export function drawEnemy(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const flash = e.flash > 0;
  const body = flash ? '#ffffff' : e.color;
  glow(ctx, e.color, e.elite ? 22 : 12);
  ctx.fillStyle = body;
  ctx.strokeStyle = body;
  ctx.lineWidth = 2;
  if (e.kind === 'drifter') {
    ctx.rotate(e.spin * 0.8);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * e.radius;
      const py = Math.sin(a) * e.radius;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0b0620';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'stinger') {
    const a = Math.atan2(e.vy || 0, e.vx || 0);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(e.radius + 4, 0);
    ctx.lineTo(-e.radius, e.radius * 0.8);
    ctx.lineTo(-e.radius * 0.4, 0);
    ctx.lineTo(-e.radius, -e.radius * 0.8);
    ctx.closePath();
    ctx.fill();
  } else if (e.kind === 'weaver') {
    ctx.rotate(e.spin * 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0620';
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + e.spin;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * e.radius * 0.55, Math.sin(a) * e.radius * 0.55, e.radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Bulwark: a heavy ringed square.
    ctx.rotate(e.spin * 0.3);
    ctx.strokeRect(-e.radius * 0.8, -e.radius * 0.8, e.radius * 1.6, e.radius * 1.6);
    ctx.fillRect(-e.radius * 0.45, -e.radius * 0.45, e.radius * 0.9, e.radius * 0.9);
    ctx.fillStyle = '#0b0620';
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  noGlow(ctx);
  if (e.elite) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  // HP bar for wounded tough enemies.
  if (e.hp < e.maxHp && e.maxHp >= 3) {
    const w = e.radius * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-w / 2, -e.radius - 10, w, 4);
    ctx.fillStyle = e.color;
    ctx.fillRect(-w / 2, -e.radius - 10, w * (e.hp / e.maxHp), 4);
  }
  ctx.restore();
}

export function drawBullet(ctx, b) {
  ctx.save();
  glow(ctx, b.friendly ? PALETTE.emberHot : PALETTE.magenta, 10);
  ctx.fillStyle = b.friendly ? PALETTE.emberHot : PALETTE.magenta;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fill();
  noGlow(ctx);
  ctx.restore();
}

export function drawShard(ctx, s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.spin);
  glow(ctx, PALETTE.emberHot, 10);
  ctx.fillStyle = PALETTE.emberHot;
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 7);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();
  noGlow(ctx);
  ctx.restore();
}

export function drawPowerUp(ctx, u) {
  ctx.save();
  ctx.translate(u.x, u.y);
  const color = u.kind === 'shield' ? PALETTE.cyan : u.kind === 'rapid' ? PALETTE.magenta : PALETTE.emberHot;
  glow(ctx, color, 14);
  ctx.fillStyle = 'rgba(11, 6, 32, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, u.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  noGlow(ctx);
  ctx.fillStyle = color;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(u.kind === 'shield' ? 'S' : u.kind === 'rapid' ? 'R' : 'B', 0, 1);
  ctx.restore();
}

export function drawHUD(ctx, game) {
  const p = game.player;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  // Top-left: score and best.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.white;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(game.score.toLocaleString(), 18, 34);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`BEST ${Math.max(game.best, game.score).toLocaleString()}`, 18, 54);
  // Top-center: wave + progress.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.white;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(`WAVE ${game.wave} / ${WAVES_TOTAL}`, ARENA_W / 2, 30);
  const prog = game.waveProgress();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(ARENA_W / 2 - 90, 40, 180, 6);
  ctx.fillStyle = PALETTE.ember;
  ctx.fillRect(ARENA_W / 2 - 90, 40, 180 * prog, 6);
  // Top-right: hull hearts and bombs.
  ctx.textAlign = 'right';
  for (let i = 0; i < p.maxHull; i++) {
    const x = ARENA_W - 22 - i * 26;
    ctx.fillStyle = i < p.hull ? '#ff5b6e' : 'rgba(255,255,255,0.15)';
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('♥', x, 34);
  }
  ctx.fillStyle = PALETTE.emberHot;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`✸ ${p.bombs}`, ARENA_W - 18, 58);
  // Bottom-left: shards to next repair.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.emberHot;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`◆ ${p.shards} shards`, 18, ARENA_H - 16);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`every ${PLAYER.shardHealEvery} shards repairs 1 hull`, 18, ARENA_H - 34);
  // Bottom-right: weapon readout.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '12px system-ui, sans-serif';
  const parts = [];
  if (p.damageMul > 1) parts.push(`DMG ×${p.damageMul.toFixed(2)}`);
  if (p.fireMul > 1) parts.push(`RATE ×${p.fireMul.toFixed(2)}`);
  if (p.pierce > 0) parts.push(`PIERCE ${p.pierce}`);
  if (p.rapid > 0) parts.push(`RAPID ${Math.ceil(p.rapid)}s`);
  if (p.shield > 0) parts.push(`SHIELD ${Math.ceil(p.shield)}s`);
  ctx.fillText(parts.join('   ') || 'WASD move · mouse aim · hold click to fire · SPACE bomb', ARENA_W - 18, ARENA_H - 16);
  ctx.restore();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(8, 5, 26, 0.82)';
  ctx.strokeStyle = 'rgba(255, 122, 26, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
}

export function drawTitle(ctx, game, input, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 2, 16, 0.55)';
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);
  ctx.textAlign = 'center';
  const bob = Math.sin(time * 1.4) * 6;
  glow(ctx, PALETTE.ember, 26);
  ctx.fillStyle = PALETTE.emberHot;
  ctx.font = 'bold 74px system-ui, sans-serif';
  ctx.fillText('EMBERFALL', ARENA_W / 2, 190 + bob);
  noGlow(ctx);
  ctx.fillStyle = PALETTE.white;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Defend the last ember. Survive all 10 waves.', ARENA_W / 2, 232 + bob);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move      Mouse — aim      Hold click — fire', ARENA_W / 2, 292);
  ctx.fillText('SPACE — bomb (clears the sky)      P — pause      M — mute', ARENA_W / 2, 318);
  ctx.fillText('Destroy the void swarm, gather ember shards, choose upgrades between waves.', ARENA_W / 2, 344);
  // Start button.
  const bw = 240;
  const bh = 56;
  const bx = ARENA_W / 2 - bw / 2;
  const by = 390;
  const hover = input.hovering(bx, by, bw, bh);
  input.button('start', bx, by, bw, bh);
  ctx.fillStyle = hover ? PALETTE.ember : '#c85a10';
  glow(ctx, PALETTE.ember, hover ? 22 : 10);
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 12);
  ctx.fill();
  noGlow(ctx);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('▶  START RUN', ARENA_W / 2, by + 37);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Best score: ${game.best.toLocaleString()}`, ARENA_W / 2, by + 92);
  ctx.restore();
}

export function drawUpgrade(ctx, game, input, offers) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 2, 16, 0.72)';
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);
  ctx.textAlign = 'center';
  glow(ctx, PALETTE.green, 16);
  ctx.fillStyle = PALETTE.green;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText(`WAVE ${game.wave} CLEARED`, ARENA_W / 2, 130);
  noGlow(ctx);
  ctx.fillStyle = PALETTE.white;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Choose one upgrade — press 1, 2 or 3, or click a card.', ARENA_W / 2, 168);
  const cw = 240;
  const ch = 210;
  const gap = 28;
  const total = cw * 3 + gap * 2;
  const x0 = (ARENA_W - total) / 2;
  const y0 = 210;
  offers.forEach((u, i) => {
    const x = x0 + i * (cw + gap);
    const hover = input.hovering(x, y0, cw, ch);
    input.button(`upgrade:${i}`, x, y0, cw, ch);
    ctx.fillStyle = hover ? 'rgba(30, 18, 56, 0.95)' : 'rgba(12, 8, 34, 0.9)';
    ctx.strokeStyle = hover ? u.color : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = hover ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y0, cw, ch, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = u.color;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(u.icon, x + cw / 2, y0 + 78);
    ctx.fillStyle = PALETTE.white;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(u.name, x + cw / 2, y0 + 122);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(u.desc, x + cw / 2, y0 + 152);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`[${i + 1}]`, x + cw / 2, y0 + 184);
  });
  ctx.restore();
}

function endPanel(ctx, game, input, title, titleColor, lines, scoreLabel) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 2, 16, 0.66)';
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);
  panel(ctx, ARENA_W / 2 - 260, 120, 520, 330);
  ctx.textAlign = 'center';
  glow(ctx, titleColor, 20);
  ctx.fillStyle = titleColor;
  ctx.font = 'bold 46px system-ui, sans-serif';
  ctx.fillText(title, ARENA_W / 2, 190);
  noGlow(ctx);
  ctx.fillStyle = PALETTE.white;
  ctx.font = '19px system-ui, sans-serif';
  let y = 232;
  for (const line of lines) {
    ctx.fillText(line, ARENA_W / 2, y);
    y += 28;
  }
  ctx.fillStyle = PALETTE.emberHot;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`${scoreLabel}: ${game.score.toLocaleString()}`, ARENA_W / 2, y + 14);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(`Best: ${Math.max(game.best, game.score).toLocaleString()}`, ARENA_W / 2, y + 44);
  const bw = 240;
  const bh = 52;
  const bx = ARENA_W / 2 - bw / 2;
  const by = 372;
  const hover = input.hovering(bx, by, bw, bh);
  input.button('restart', bx, by, bw, bh);
  ctx.fillStyle = hover ? PALETTE.ember : '#c85a10';
  glow(ctx, PALETTE.ember, hover ? 20 : 10);
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 12);
  ctx.fill();
  noGlow(ctx);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('↻  PLAY AGAIN  (R)', ARENA_W / 2, by + 35);
  ctx.restore();
}

export function drawVictory(ctx, game, input) {
  endPanel(ctx, game, input, 'EMBER KEPT', PALETTE.green,
    ['All 10 waves broken. The swarm is ash,', 'and the last ember still burns.'], 'Final score');
}

export function drawGameOver(ctx, game, input) {
  endPanel(ctx, game, input, 'THE EMBER FADES', PALETTE.danger,
    [`The swarm broke through on wave ${game.wave}.`, 'The core dims — but embers always return.'], 'Score');
}

export function drawPaused(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 2, 16, 0.6)';
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.white;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('PAUSED', ARENA_W / 2, ARENA_H / 2 - 10);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Press P to resume', ARENA_W / 2, ARENA_H / 2 + 28);
  ctx.restore();
}
