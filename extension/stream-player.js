// Schedule generated PCM passages on Web Audio's clock. Inference stays in the
// worker; this player can continue even while another passage is generating.
globalThis.MarginStreamPlayer = class {
  constructor(onState) {
    this.context = new AudioContext();
    this.onState = onState;
    this.entries = [];
    this.sources = new Set();
    this.nextStart = 0;
    this.paused = false;
    this.closed = false;
    // Called from Make audio's click so Chrome can unlock playback immediately.
    this.context.resume().catch(() => {
      if (!this.closed) { this.paused = true; this.onState('paused'); }
    });
  }

  add(samples, speed) {
    if (this.closed) return;
    const pause = Math.floor(2400 / speed);
    const buffer = this.context.createBuffer(1, samples.length + pause, 24000);
    buffer.copyToChannel(samples, 0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    const start = Math.max(this.nextStart, this.context.currentTime + .04);
    this.nextStart = start + buffer.duration;
    this.entries.push({ start, duration: buffer.duration });
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      if (!this.closed && !this.paused && !this.sources.size) this.onState('buffering');
    };
    source.start(start);
    this.onState(this.paused ? 'paused' : 'playing');
  }

  get position() {
    const now = this.context.currentTime;
    return this.entries.reduce((sum, entry) => sum + Math.max(0, Math.min(entry.duration, now - entry.start)), 0);
  }

  async toggle() {
    if (this.closed) return;
    if (this.paused) {
      try { await this.context.resume(); } catch (error) { if (!this.closed) throw error; }
      if (this.closed) return;
      this.paused = false;
      this.onState(this.sources.size ? 'playing' : 'buffering');
    } else {
      try { await this.context.suspend(); } catch (error) { if (!this.closed) throw error; }
      if (this.closed) return;
      this.paused = true;
      this.onState('paused');
    }
  }

  stop() {
    if (this.closed) return;
    this.closed = true;
    for (const source of this.sources) { source.onended = null; source.stop(); source.disconnect(); }
    this.sources.clear();
    this.context.close().catch(() => {});
  }
};
