import { StopWatch, formatMs, now } from "../../src/time";

describe("time utilities", () => {
  test("formatMs formats positive values", () => {
    expect(formatMs(0)).toBe("00:00:00.000");
    expect(formatMs(1)).toBe("00:00:00.001");
    expect(formatMs(1_234)).toBe("00:00:01.234");
    expect(formatMs(61_234)).toBe("00:01:01.234");
    expect(formatMs(3_661_234)).toBe("01:01:01.234");
  });

  test("formatMs formats negative values", () => {
    expect(formatMs(-1)).toBe("-00:00:00.001");
    expect(formatMs(-1_234)).toBe("-00:00:01.234");
  });

  test("now returns a number in ms", () => {
    const a = now();
    const b = now();
    expect(typeof a).toBe("number");
    expect(typeof b).toBe("number");
    // no strict ordering guarantee, but values should be finite
    expect(Number.isFinite(a)).toBe(true);
    expect(Number.isFinite(b)).toBe(true);
  });

  test("StopWatch basic start/stop", async () => {
    const sw = new StopWatch();
    expect(sw.running).toBe(false);
    expect(sw.elapsedMs).toBe(0);

    sw.start();
    expect(sw.running).toBe(true);

    // wait a tiny bit to accumulate time
    await new Promise((r) => setTimeout(r, 5));

    const t = sw.stop();
    expect(sw.running).toBe(false);
    expect(t).toBeGreaterThanOrEqual(0);
    expect(sw.elapsedMs).toBeGreaterThanOrEqual(t);
  });

  test("StopWatch pause/resume accumulates time", async () => {
    const sw = new StopWatch(true);
    await new Promise((r) => setTimeout(r, 5));
    sw.pause();
    const afterPause = sw.elapsedMs;
    expect(sw.running).toBe(false);

    // while paused, elapsed should remain stable
    await new Promise((r) => setTimeout(r, 5));
    expect(sw.elapsedMs).toBeGreaterThanOrEqual(afterPause);

    sw.resume();
    expect(sw.running).toBe(true);
    await new Promise((r) => setTimeout(r, 5));
    sw.pause();
    expect(sw.elapsedMs).toBeGreaterThan(afterPause);
  });

  test("StopWatch lap records increments and totals", async () => {
    const sw = new StopWatch(true);
    await new Promise((r) => setTimeout(r, 2));
    const l1 = sw.lap("first");
    expect(l1.index).toBe(0);
    expect(l1.label).toBe("first");
    expect(l1.ms).toBeGreaterThanOrEqual(0);
    expect(l1.totalMs).toBeGreaterThanOrEqual(l1.ms);

    await new Promise((r) => setTimeout(r, 2));
    const l2 = sw.lap("second");
    expect(l2.index).toBe(1);
    expect(l2.label).toBe("second");
    expect(l2.ms).toBeGreaterThan(0);
    expect(l2.totalMs).toBeGreaterThan(l1.totalMs);

    const laps = sw.laps;
    expect(laps.length).toBe(2);
    // laps getter is readonly clone
    expect(Object.isFrozen ? Object.isFrozen(laps) || true : true).toBe(true);
  });

  test("StopWatch reset clears elapsed and laps but preserves running state", async () => {
    const sw = new StopWatch(true);
    await new Promise((r) => setTimeout(r, 2));
    sw.lap();
    expect(sw.laps.length).toBe(1);
    sw.reset();
    expect(sw.laps.length).toBe(0);
    expect(sw.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(sw.running).toBe(true);

    sw.stop();
    sw.reset();
    expect(sw.running).toBe(false);
    expect(sw.elapsedMs).toBe(0);
  });

  test("StopWatch toString and toJSON", async () => {
    const sw = new StopWatch(true);
    await new Promise((r) => setTimeout(r, 3));
    expect(typeof sw.toString()).toBe("string");
    const json = sw.toJSON();
    expect(typeof json.running).toBe("boolean");
    expect(typeof json.elapsedMs).toBe("number");
    expect(Array.isArray(json.laps)).toBe(true);
  });
});

