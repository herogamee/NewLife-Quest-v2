export class LandscapeMode {
  constructor({ document, orientation, isMobile, isActive }) {
    this.document = document; this.orientation = orientation; this.isMobile = isMobile; this.isActive = isActive;
    this.generation = 0; this.ownsFullscreen = false; this.ownsLock = false;
  }
  get available() { return Boolean(this.isMobile() && this.orientation?.lock && this.document.documentElement.requestFullscreen && this.document.fullscreenEnabled !== false); }
  async request() {
    if (!this.available || !this.isActive()) return false;
    const generation = ++this.generation;
    try {
      if (!this.document.fullscreenElement) { await this.document.documentElement.requestFullscreen(); this.ownsFullscreen = true; }
      if (generation !== this.generation || !this.isActive()) { this.release(); return false; }
      await this.orientation.lock('landscape'); this.ownsLock = true;
      if (generation !== this.generation || !this.isActive()) { this.release(); return false; }
      return true;
    } catch { return false; }
  }
  release() {
    this.generation++;
    if (this.ownsLock) { try { this.orientation.unlock(); } catch {} this.ownsLock = false; }
    if (this.ownsFullscreen && this.document.fullscreenElement === this.document.documentElement) this.document.exitFullscreen?.().catch(() => {});
    this.ownsFullscreen = false;
  }
}
