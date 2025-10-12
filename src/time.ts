/**
 * A high‑resolution stopwatch with pause/resume and lap support.
 * Works in Node and browsers using the best available clock.
 */
export type Lap = {
  index: number;
  label?: string;
  /** Duration of this lap in milliseconds */
  ms: number;
  /** Cumulative time up to this lap in milliseconds */
  totalMs: number;
};

type NowFn = () => number; // milliseconds

function safeNow(): NowFn {
  // Prefer performance.now when available
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.performance?.now === "function"
  ) {
    return () => globalThis.performance.now();
  }
  // Node: use process.hrtime.bigint for higher precision if available
  if (
    typeof process !== "undefined" &&
    typeof (process as any).hrtime?.bigint === "function"
  ) {
    return () => {
      const ns = (process as any).hrtime.bigint() as bigint; // nanoseconds
      return Number(ns) / 1_000_000; // to ms
    };
  }
  // Fallback
  return () => Date.now();
}

export const now = safeNow();

export class StopWatch {
  private _startMs: number | null = null;
  private _elapsedMs = 0;
  private _running = false;
  private _laps: Lap[] = [];
  private _lastLapTotalMs = 0;

  constructor(autoStart = false) {
    if (autoStart) this.start();
  }

  get running(): boolean {
    return this._running;
  }

  /** Total elapsed time in milliseconds. */
  get elapsedMs(): number {
    if (!this._running || this._startMs == null) return this._elapsedMs;
    return this._elapsedMs + (now() - this._startMs);
  }

  /** Start the stopwatch. No‑op if already running. */
  start(): this {
    if (!this._running) {
      this._running = true;
      this._startMs = now();
    }
    return this;
  }

  /** Pause the stopwatch, accumulating time so far. */
  pause(): this {
    if (this._running && this._startMs != null) {
      this._elapsedMs += now() - this._startMs;
      this._startMs = null;
      this._running = false;
    }
    return this;
  }

  /** Resume if paused. No‑op if already running. */
  resume(): this {
    if (!this._running) {
      this._running = true;
      this._startMs = now();
    }
    return this;
  }

  /** Stop the stopwatch and freeze the elapsed time. */
  stop(): number {
    this.pause();
    return this._elapsedMs;
  }

  /** Reset elapsed time and laps. Keeps running state unless stop is desired. */
  reset(): this {
    const wasRunning = this._running;
    this._startMs = wasRunning ? now() : null;
    this._elapsedMs = 0;
    this._laps = [];
    this._lastLapTotalMs = 0;
    return this;
  }

  /** Record a lap split since the last lap or start. */
  lap(label?: string): Lap {
    const total = this.elapsedMs;
    const ms = total - this._lastLapTotalMs;
    const lap: Lap = {
      index: this._laps.length,
      label,
      ms,
      totalMs: total,
    };
    this._laps.push(lap);
    this._lastLapTotalMs = total;
    return lap;
  }

  /** Immutable list of recorded laps. */
  get laps(): readonly Lap[] {
    return this._laps;
  }

  /** Human friendly formatting of the elapsed time. */
  toString(): string {
    return formatMs(this.elapsedMs);
  }

  toJSON() {
    return {
      running: this._running,
      elapsedMs: this.elapsedMs,
      laps: this._laps.slice(),
    };
  }
}

/** Format milliseconds as `hh:mm:ss.mmm`. */
export function formatMs(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1000);
  const millis = Math.floor(abs % 1000);
  const pad = (n: number, w: number) => n.toString().padStart(w, "0");
  return `${sign}${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
}
