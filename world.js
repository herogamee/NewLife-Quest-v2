import { nextBlink } from './core.js';
export class FrameMeter {
  constructor(output) { this.output=output; this.frame=0; this.tick=this.tick.bind(this); }
  update(enabled) {
    cancelAnimationFrame(this.frame); this.output.hidden=!enabled;
    this.previous=0;this.started=0;this.frames=0;this.worst=0;
    if(enabled&&!document.hidden) { this.output.textContent='กำลังวัด FPS…';this.frame=requestAnimationFrame(this.tick); }
  }
  tick(now) {
    if(!this.started)this.started=now;
    if(this.previous)this.worst=Math.max(this.worst,now-this.previous);
    this.previous=now;this.frames++;
    if(now-this.started>=1000) {
      const fps=Math.round((this.frames-1)*1000/(now-this.started));
      this.output.textContent=`${fps} FPS · ช่วงเฟรมสูงสุด ${Math.round(this.worst)} ms`;
      this.output.dataset.slow=String(fps<40||this.worst>70);
      this.started=now;this.frames=1;this.worst=0;
    }
    this.frame=requestAnimationFrame(this.tick);
  }
}
export class LivingWorld {
  constructor(canvas, characters, { river = false } = {}) {
    this.canvas = canvas; this.characters = characters;
    this.river = river;
    this.context = canvas.getContext('2d');
    this.enabled = true; this.hidden = false; this.frame = 0; this.lastFrame = 0;
    this.elapsed = 0; this.previous = 0;
    this.blinkTimers = new Set(); this.closeTimers = new Set();
    this.resize = this.resize.bind(this); this.loop = this.loop.bind(this);
    if (globalThis.ResizeObserver) { this.observer = new ResizeObserver(this.resize); this.observer.observe(canvas); }
    else addEventListener('resize', this.resize);
    this.resize();
  }
  resize() {
    this.width = this.canvas.clientWidth; this.height = this.canvas.clientHeight;
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 1.4, 2200 / Math.max(1, this.width));
    this.canvas.width = Math.round(this.width * ratio); this.canvas.height = Math.round(this.height * ratio);
    this.context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.draw();
  }
  update(enabled, hidden = document.hidden) {
    this.enabled = enabled; this.hidden = hidden;
    cancelAnimationFrame(this.frame);
    for (const timer of this.blinkTimers) clearTimeout(timer);
    for (const timer of this.closeTimers) clearTimeout(timer);
    this.blinkTimers.clear(); this.closeTimers.clear();
    this.characters?.classList.remove('is-blinking-male', 'is-blinking-female');
    this.previous = 0; this.lastFrame = 0;
    if (enabled && !hidden) {
      this.frame = requestAnimationFrame(this.loop);
      if (this.characters) { this.scheduleBlink('male'); this.scheduleBlink('female'); }
    } else this.draw();
  }
  scheduleBlink(character) {
    const timer = setTimeout(() => {
      this.blinkTimers.delete(timer);
      if (!this.enabled || this.hidden) return;
      this.characters.classList.add(`is-blinking-${character}`);
      const end = setTimeout(() => {
        this.closeTimers.delete(end);
        this.characters.classList.remove(`is-blinking-${character}`);
        this.scheduleBlink(character);
      }, 150);
      this.closeTimers.add(end);
    }, nextBlink(Math.random, character));
    this.blinkTimers.add(timer);
  }
  loop(timestamp) {
    if (!this.enabled || this.hidden) return;
    if (timestamp - this.lastFrame >= 33) {
      if (this.previous) this.elapsed += Math.min(timestamp - this.previous, 100) / 1000;
      this.previous = timestamp; this.lastFrame = timestamp;
      this.draw();
    }
    this.frame = requestAnimationFrame(this.loop);
  }
  draw() {
    const ctx = this.context, w = this.width, h = this.height, t = this.elapsed;
    if (!ctx || !w || !h) return;
    ctx.clearRect(0, 0, w, h);
    // Coordinates follow the illustrated world plate, including object-fit on small screens.
    for (let i = 0; i < 6; i++) {
      const phase = (t * (.014 + i * .0012) + i * .19) % 1.4 - .2;
      const x = phase * w;
      const y = (.075 + (i % 3) * .04 + Math.sin(t * .32 + i * 2) * .012) * h;
      const wing = (.0042 + i % 2 * .002) * w;
      const flap = Math.sin(t * (3.7 + i * .2) + i) * wing * .5;
      ctx.beginPath(); ctx.moveTo(x - wing, y - flap);
      ctx.quadraticCurveTo(x - wing * .3, y - wing * .18, x, y + wing * .23);
      ctx.quadraticCurveTo(x + wing * .3, y - wing * .18, x + wing, y - flap);
      ctx.lineWidth = Math.max(1.2, w * .0011); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(81,112,132,.28)'; ctx.stroke();
      ctx.translate(0, -1); ctx.strokeStyle = 'rgba(255,254,234,.94)'; ctx.stroke(); ctx.translate(0, 1);
    }
    for (let i = 0; i < 34; i++) {
      const x = (this.river ? .28 + ((i * .0713) % .42) : .17 + ((i * .0713) % .39)) * w;
      const y = (this.river ? .55 + ((i * .0177) % .22) : .535 + ((i * .0177) % .108)) * h;
      const opacity = Math.max(0, Math.sin(t * (1.2 + i % 3 * .13) + i * 2.17)) ** 5 * .7;
      const len = (2.5 + (i % 4) * 1.3) * w / 1672;
      ctx.strokeStyle = `rgba(255,255,233,${opacity})`; ctx.lineWidth = Math.max(.8, w / 1672);
      ctx.beginPath(); ctx.moveTo(x - len, y); ctx.lineTo(x + len, y); ctx.stroke();
      if (i % 4 === 0) { ctx.beginPath(); ctx.moveTo(x, y - len * .7); ctx.lineTo(x, y + len * .7); ctx.stroke(); }
    }
  }
}
