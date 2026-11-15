// Synthesized sound: every effect and the music loop are built with the
// Web Audio API, so the game ships no audio files at all.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicTimer = null;
    this.muted = false;
    this.musicStep = 0;
  }

  // Browsers only let audio start after a user gesture; call from one.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startMusic();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, vol, lowpass) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    let node = src;
    if (lowpass) {
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = lowpass;
      src.connect(filt);
      node = filt;
    }
    node.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  shoot() { this.tone(880 + Math.random() * 120, 0.07, 'square', 0.08, 320); }
  hit() { this.tone(220, 0.06, 'sawtooth', 0.10, 110); }
  explode() { this.noise(0.35, 0.28, 900); this.tone(90, 0.3, 'sine', 0.22, 40); }
  pickup() { this.tone(660, 0.09, 'sine', 0.12, 990); }
  powerup() { this.tone(520, 0.12, 'triangle', 0.14, 780); this.tone(780, 0.14, 'triangle', 0.12, 1170); }
  hurt() { this.tone(160, 0.25, 'sawtooth', 0.2, 55); this.noise(0.15, 0.15, 500); }
  bomb() { this.noise(0.6, 0.32, 600); this.tone(70, 0.55, 'sine', 0.26, 30); }
  waveClear() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, 'triangle', 0.14), i * 90)); }
  victory() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.15), i * 120)); }
  gameOver() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.28, 'sawtooth', 0.12), i * 160)); }
  click() { this.tone(1200, 0.05, 'sine', 0.1, 900); }

  // A quiet bass pulse with a slow pad above it. Eight steps, ~100 BPM.
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const bass = [55, 0, 65.4, 0, 49, 0, 58.3, 73.4];
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const f = bass[this.musicStep % bass.length];
      if (f) this.tone(f, 0.5, 'triangle', 0.07, f);
      if (this.musicStep % 8 === 0) this.tone(220, 1.8, 'sine', 0.03, 220);
      this.musicStep++;
    }, 300);
  }
}
