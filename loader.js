import { loadResources } from './core.js';

// The timeout covers both response headers and body. No simulated progress or timers advance the bar.
export async function fetchWithDeadline(fetcher, url, options, timeoutMs = 20000) {
  const parent = options.signal;
  if (parent?.aborted) throw parent.reason || new DOMException('Canceled', 'AbortError');
  const controller = new AbortController();
  const cancel = () => controller.abort(parent.reason || new DOMException('Canceled', 'AbortError'));
  parent?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException('Resource timed out', 'TimeoutError')), timeoutMs);
  try {
    const response = await fetcher(url, { ...options, signal: controller.signal });
    const bytes = response.ok ? await response.arrayBuffer() : new ArrayBuffer(0);
    return { ok: response.ok, status: response.status, arrayBuffer: async () => bytes };
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    throw error;
  } finally { clearTimeout(timer); parent?.removeEventListener('abort', cancel); }
}

export class LoadingSession {
  constructor({ onState = () => {}, fetcher = fetch, prepare = async () => {}, timeoutMs = 20000 } = {}) {
    this.onState = onState; this.fetcher = fetcher; this.prepare = prepare; this.timeoutMs = timeoutMs;
    this.run = 0; this.controller = null;
    this.state = { phase: 'idle', completed: 0, total: 0, percent: 0, failed: [] };
  }
  emit(change) { this.state = { ...this.state, ...change }; this.onState({ ...this.state, failed: [...this.state.failed] }); }
  current(run) { return this.run === run && !this.controller.signal.aborted; }
  cancel() {
    this.run++; this.controller?.abort();
    this.emit({ phase: 'cancelled' });
  }
  async start(resources) {
    this.controller?.abort(); const run = ++this.run;
    const controller = new AbortController(); this.controller = controller;
    this.emit({ phase: 'loading', completed: 0, total: new Set(resources).size, percent: 0, failed: [], failure: null });
    try {
      const result = await loadResources(resources, {
        signal: controller.signal,
        fetcher: (url, options) => fetchWithDeadline(this.fetcher, url, options, this.timeoutMs),
        onProgress: progress => { if (this.current(run)) this.emit(progress); }
      });
      if (!this.current(run)) return;
      if (result.failed.length) {
        this.emit({ phase: 'error', failed: result.failed, completed: result.loaded.length, percent: Math.floor(result.loaded.length / this.state.total * 100) });
        return;
      }
      this.emit({ phase: 'preparing', percent: 100 });
      await this.prepare(controller.signal);
      if (this.current(run)) this.emit({ phase: 'ready', percent: 100, completed: this.state.total });
    } catch (error) {
      if (!this.current(run)) return;
      this.emit({ phase: 'error', failure: 'prepare', percent: 0 });
    }
  }
}
