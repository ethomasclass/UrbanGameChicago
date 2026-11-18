// Small synthesized sound set. No audio files to download.
export class Sound {
  constructor() { this.on = true; this.ctx = null; }
  start() {
    if (this.ctx || !this.on) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; const c = this.ctx = new AC();
      this.master = c.createGain(); this.master.gain.value = .5; this.master.connect(c.destination);
      const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0); let v = 0;
      for (let i = 0; i < d.length; i++) { v = (v + (Math.random() * 2 - 1) * .08) * .985; d[i] = v * 3; }
      const mk = (type, freq) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.master); s.start(); return g; };
      this.amb = mk('lowpass', 420); this.fireG = mk('bandpass', 1100);
    } catch (e) { this.ctx = null; }
  }
  setOn(v) { this.on = v; if (v) this.start(); if (this.master) this.master.gain.value = v ? .5 : 0; }
  city(level) { if (this.ctx) this.amb.gain.setTargetAtTime(.03 + level * .16, this.ctx.currentTime, 1.5); }
  fire(level) { if (this.ctx) this.fireG.gain.setTargetAtTime(level * .55, this.ctx.currentTime, .6); }
  tone(freq, dur, type = 'sine', vol = .1, to = 0, delay = 0) {
    if (!this.ctx || !this.on) return; const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .05);
  }
  bell() { for (let k = 0; k < 3; k++) { this.tone(932, 1.1, 'sine', .2, 0, k * .42); this.tone(1398, .7, 'sine', .08, 0, k * .42); } }
  place() { this.tone(180, .1, 'triangle', .25, 90); this.tone(700, .05, 'square', .03); }
  zone() { this.tone(520, .05, 'sine', .06); }
  err() { this.tone(150, .18, 'sawtooth', .07, 110); }
  whistle() { this.tone(587, .7, 'triangle', .07); this.tone(698, .7, 'triangle', .06); this.tone(587, .5, 'triangle', .07, 0, .85); this.tone(698, .5, 'triangle', .06, 0, .85); }
  paper() { this.tone(240, .09, 'square', .05, 120); this.tone(1200, .04, 'square', .02, 0, .06); }
  shutter() { this.tone(2400, .03, 'square', .08); this.tone(1400, .05, 'square', .06, 0, .09); }
  coin() { this.tone(1245, .1, 'sine', .07); this.tone(1661, .18, 'sine', .06, 0, .07); }
}
