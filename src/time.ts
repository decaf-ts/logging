/**
 * @description A snapshot of a recorded lap interval.
 * @summary This captures the lap index, an optional label, the elapsed milliseconds for the lap, and the cumulative elapsed time since the stopwatch started.
 * @typedef {object} Lap
 * @property {number} index - The zero-based lap order.
 * @property {string} [label] - An optional label that describes the lap.
 * @property {number} ms - The duration of the lap in milliseconds.
 * @property {number} totalMs - The total elapsed time when the lap was recorded.
 * @memberOf module:Logging
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

/**
 * @description A high-resolution clock accessor that returns milliseconds.
 * @summary This function chooses the most precise timer available in the current runtime, preferring `performance.now` or `process.hrtime.bigint`.
 * @return {number} The milliseconds that have elapsed, according to the best available clock.
 * @function now
 * @memberOf module:Logging
 */
export const now = safeNow();

/**
 * @description A high-resolution stopwatch with pause, resume, and lap tracking.
 * @summary This class tracks elapsed time using the highest precision timer available. It supports pausing, resuming, and recording labeled laps for diagnostics and benchmarking.
 * @param {boolean} [autoStart=false] - When `true`, the stopwatch starts immediately upon construction.
 * @class StopWatch
 * @example
 * const sw = new StopWatch(true);
 * // ... work ...
 * const lap = sw.lap("phase 1");
 * sw.pause();
 * console.log(`Elapsed: ${lap.totalMs}ms`);
 * @mermaid
 * sequenceDiagram
 *   participant Client
 *   participant StopWatch
 *   participant Clock as now()
 *   Client->>StopWatch: start()
 *   StopWatch->>Clock: now()
 *   Clock-->>StopWatch: timestamp
 *   Client->>StopWatch: lap()
 *   StopWatch->>Clock: now()
 *   Clock-->>StopWatch: timestamp
 *   StopWatch-->>Client: Lap
 *   Client->>StopWatch: pause()
 *   StopWatch->>Clock: now()
 *   Clock-->>StopWatch: timestamp
 */
export class StopWatch {
  private _startMs: number | null = null;
  private _elapsedMs = 0;
  private _running = false;
  private _laps: Lap[] = [];
  private _lastLapTotalMs = 0;

  constructor(autoStart = false) {
    if (autoStart) this.start();
  }

  /**
   * @description Indicates whether the stopwatch is actively running.
   * @summary This method returns `true` when timing is in progress, and `false` when it is paused or stopped.
   * @return {boolean} The current running state.
   */
  get running(): boolean {
    return this._running;
  }

  /**
   * @description The elapsed time that has been captured by the stopwatch.
   * @summary This method computes the total elapsed time in milliseconds, including the current session if it is running.
   * @return {number} The milliseconds that have elapsed since the stopwatch started.
   */
  get elapsedMs(): number {
    if (!this._running || this._startMs == null) return this._elapsedMs;
    return this._elapsedMs + (now() - this._startMs);
  }

  /**
   * @description Starts timing if the stopwatch is not already running.
   * @summary This method records the current timestamp and transitions the stopwatch into the running state.
   * @return {this} A fluent reference to the stopwatch.
   */
  start(): this {
    if (!this._running) {
      this._running = true;
      this._startMs = now();
    }
    return this;
  }

  /**
   * @description Pauses timing and accumulates the elapsed milliseconds.
   * @summary This method captures the partial duration, updates the accumulator, and keeps the stopwatch ready to resume later.
   * @return {this} A fluent reference to the stopwatch.
   */
  pause(): this {
    if (this._running && this._startMs != null) {
      this._elapsedMs += now() - this._startMs;
      this._startMs = null;
      this._running = false;
    }
    return this;
  }

  /**
   * @description Resumes timing after a pause.
   * @summary This method captures a fresh start timestamp, while keeping the previous elapsed time intact.
   * @return {this} A fluent reference to the stopwatch.
   */
  resume(): this {
    if (!this._running) {
      this._running = true;
      this._startMs = now();
    }
    return this;
  }

  /**
   * @description Stops timing and returns the total elapsed milliseconds.
   * @summary This method invokes {@link StopWatch.pause} to consolidate the elapsed time, and leaves the stopwatch in a non-running state.
   * @return {number} The milliseconds that have accumulated across all runs.
   */
  stop(): number {
    this.pause();
    return this._elapsedMs;
  }

  /**
   * @description Resets the stopwatch state, while optionally continuing to run.
   * @summary This method clears the elapsed time and lap history, and preserves whether the stopwatch should continue ticking.
   * @return {this} A fluent reference to the stopwatch.
   */
  reset(): this {
    const wasRunning = this._running;
    this._startMs = wasRunning ? now() : null;
    this._elapsedMs = 0;
    this._laps = [];
    this._lastLapTotalMs = 0;
    return this;
  }

  /**
   * @description Records a lap split since the stopwatch started, or since the previous lap.
   * @summary This method stores the lap metadata, updates the cumulative tracking, and returns the newly created {@link Lap}.
   * @param {string} [label] - An optional label that describes the lap.
   * @return {Lap} A lap snapshot that captures incremental and cumulative timings.
   */
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
  /**
   * @description Retrieves the recorded lap history.
   * @summary This method returns the internal lap array as a read-only view to prevent external mutation.
   * @return {Array<Lap>} The laps that have been captured by the stopwatch.
   */
  get laps(): readonly Lap[] {
    return this._laps;
  }

  /**
   * @description Formats the elapsed time in a human-readable representation.
   * @summary This method uses {@link formatMs} to produce an `hh:mm:ss.mmm` string for display and logging.
   * @return {string} The elapsed time, formatted for presentation.
   */
  toString(): string {
    return formatMs(this.elapsedMs);
  }

  /**
   * @description Serializes the stopwatch state.
   * @summary This method provides a JSON-friendly snapshot that includes the running state, elapsed time, and lap details.
   * @return {{running: boolean, elapsedMs: number, laps: Lap[]}} A serializable stopwatch representation.
   */
  toJSON() {
    return {
      running: this._running,
      elapsedMs: this.elapsedMs,
      laps: this._laps.slice(),
    };
  }
}
/**
 * @description Formats milliseconds into `hh:mm:ss.mmm`.
 * @summary This function breaks the duration into hours, minutes, seconds, and milliseconds, and returns a zero-padded string.
 * @param {number} ms - The milliseconds to format.
 * @return {string} The formatted duration string.
 * @function formatMs
 * @memberOf module:Logging
 * @mermaid
 * sequenceDiagram
 *   participant Caller
 *   participant Formatter as formatMs
 *   Caller->>Formatter: formatMs(ms)
 *   Formatter->>Formatter: derive hours/minutes/seconds
 *   Formatter->>Formatter: pad segments
 *   Formatter-->>Caller: hh:mm:ss.mmm
 */
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
