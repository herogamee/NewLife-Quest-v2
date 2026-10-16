export class Soundscape {
  constructor(settings, onChange = () => {}, environment = globalThis) {
    this.settings = settings;
    this.onChange = onChange;
    this.environment = environment;
    this.music = new environment.Audio();
    this.music.loop = true;
    this.music.preload = 'none';
    this.music.src = this.music.canPlayType('audio/ogg; codecs="vorbis"') ? 'assets/audio/riverside-theme.ogg' : 'assets/audio/riverside-theme.mp3';
    this.music.volume = settings.musicVolume;
    this.unlocked = false;
    this.playing = false;
    this.hidden = false;
    this.ducked = false;
    this.context = null;
    this.buffers = new Map();
    this.pendingBuffers = null;
    this.sources = new Set();
    this.lastEffect = -Infinity;
    this.music.addEventListener('playing', () => { this.playing = true; this.onChange(); });
    this.music.addEventListener('pause', () => { this.playing = false; this.onChange(); });
    this.music.addEventListener('error', () => { this.playing = false; this.onChange('music-error'); });
  }
  gesture() {
    this.unlocked = true;
    const Context = this.environment.AudioContext || this.environment.webkitAudioContext;
    if (!this.context && Context) {
      try { this.context = new Context(); this.prepareEffects(); } catch { /* HTML audio music still works. */ }
    }
    if (this.context?.state === 'suspended') this.context.resume().catch(() => {});
    if (this.settings.music && !this.hidden && this.music.paused) this.startMusic();
  }
  startMusic() {
    try {
      const promise = this.music.play();
      promise?.catch(() => { this.playing = false; this.onChange('play-blocked'); });
    } catch { this.onChange('play-blocked'); }
  }
  async prepareEffects() {
    if (!this.context || this.pendingBuffers) return this.pendingBuffers;
    this.pendingBuffers = Promise.all(['click', 'enter', 'back'].map(async name => {
      try {
        const response = await this.environment.fetch(`assets/audio/menu-${name}.wav`);
        if (!response.ok) return;
        const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(name, buffer);
      } catch { /* A short original synth cue is used until WAV decoding is available. */ }
    }));
    return this.pendingBuffers;
  }
  effect(name = 'click') {
    if (!this.settings.sfx || !this.unlocked || this.hidden || !this.settings.sfxVolume) return;
    const now = this.environment.performance.now();
    if (now - this.lastEffect < 55) return;
    this.lastEffect = now;
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    if (this.sources.size >= 5) return;
    const gain = ctx.createGain();
    gain.gain.value = this.settings.sfxVolume * .8;
    gain.connect(ctx.destination);
    const buffer = this.buffers.get(name);
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      this.sources.add(source);
      source.onended = () => { this.sources.delete(source); source.disconnect(); gain.disconnect(); };
      source.start();
    } else {
      const notes = name === 'enter' ? [523.25, 659.25, 783.99] : name === 'back' ? [659.25, 523.25] : [783.99];
      notes.forEach((hz, index) => {
        const voice = ctx.createOscillator();
        const envelope = ctx.createGain();
        const at = ctx.currentTime + index * .065;
        voice.type = 'sine'; voice.frequency.value = hz;
        envelope.gain.setValueAtTime(0, at);
        envelope.gain.linearRampToValueAtTime(.17, at + .005);
        envelope.gain.exponentialRampToValueAtTime(.001, at + .19);
        voice.connect(envelope); envelope.connect(gain);
        this.sources.add(voice);
        voice.onended = () => { this.sources.delete(voice); voice.disconnect(); envelope.disconnect(); if (index === notes.length - 1) gain.disconnect(); };
        voice.start(at); voice.stop(at + .2);
      });
    }
  }
  setMusic(enabled) {
    this.settings.music = enabled;
    if (enabled) this.gesture(); else this.music.pause();
    this.onChange();
  }
  setVolumes() { this.music.volume = Math.max(0, Math.min(1, this.settings.musicVolume * (this.ducked ? .65 : 1))); }
  duck(enabled) { this.ducked = enabled; this.setVolumes(); }
  visibility(hidden) {
    this.hidden = hidden;
    if (hidden) { this.music.pause(); this.context?.suspend().catch(() => {}); }
    else if (this.unlocked) {
      if (this.settings.music) this.startMusic();
      this.context?.resume().catch(() => {});
    }
  }
}
