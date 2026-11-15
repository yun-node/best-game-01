// Keyboard + mouse state, translated into the game's logical coordinates.
// Also owns the clickable regions the canvas UI registers each frame.

import { ARENA_W, ARENA_H } from './config.js';

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseX = ARENA_W / 2;
    this.mouseY = ARENA_H / 2;
    this.mouseDown = false;
    this.clicks = [];
    this.buttons = [];
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      this.keys.add(k);
      if (!e.repeat) this.pressed.add(k);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
    canvas.addEventListener('mousemove', (e) => this.updateMouse(e, canvas));
    canvas.addEventListener('mousedown', (e) => {
      this.updateMouse(e, canvas);
      this.mouseDown = true;
      this.clicks.push({ x: this.mouseX, y: this.mouseY });
    });
    window.addEventListener('mouseup', () => { this.mouseDown = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateMouse(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    this.scale = canvas.width / rect.width;
    this.mouseX = (e.clientX - rect.left) * this.scale;
    this.mouseY = (e.clientY - rect.top) * this.scale;
  }

  // Movement vector from WASD or arrow keys, normalized.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('w') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('s') || this.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }

  pressed(key) {
    return this.keys.has(key);
  }

  // One-shot edge trigger: true once per physical press, even a tap
  // shorter than one frame (the press is queued on keydown).
  takePressed(key) {
    if (this.pressed.has(key)) {
      this.pressed.delete(key);
      this.keys.delete(key);
      return true;
    }
    return false;
  }

  // Drop queued presses (used on state changes so a key tapped on a menu
  // does not fire later in gameplay).
  clearPressed() {
    this.pressed.clear();
  }

  // Canvas UI: register a clickable rect for this frame, returns its id
  // when a click landed inside it.
  beginFrame() {
    this.buttons = [];
  }

  button(id, x, y, w, h) {
    this.buttons.push({ id, x, y, w, h });
  }

  consumeClicks() {
    const hits = [];
    for (const c of this.clicks) {
      for (const b of this.buttons) {
        if (c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h) hits.push(b.id);
      }
    }
    this.clicks.length = 0;
    return hits;
  }

  hovering(x, y, w, h) {
    return this.mouseX >= x && this.mouseX <= x + w && this.mouseY >= y && this.mouseY <= y + h;
  }
}
