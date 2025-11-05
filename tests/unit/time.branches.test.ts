import type { Performance } from "perf_hooks";

describe("time module high resolution selection", () => {
  const originalPerformanceDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "performance"
  );
  const originalHrtime = process.hrtime;

  afterEach(() => {
    jest.resetModules();
    if (originalPerformanceDescriptor) {
      Object.defineProperty(
        globalThis,
        "performance",
        originalPerformanceDescriptor
      );
    } else {
      delete (globalThis as unknown as { performance?: Performance })
        .performance;
    }
    process.hrtime = originalHrtime;
    jest.restoreAllMocks();
  });

  test("uses process.hrtime.bigint when performance.now is unavailable", async () => {
    Object.defineProperty(globalThis, "performance", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const bigintSpy = jest.fn(() => BigInt(5_000_000));
    (process as any).hrtime = Object.assign(() => undefined, {
      bigint: bigintSpy,
    });

    const { now } = await import("../../src/time");
    expect(now()).toBeCloseTo(5, 6);
    expect(bigintSpy).toHaveBeenCalled();
  });

  test("falls back to Date.now when no high-resolution timers exist", async () => {
    Object.defineProperty(globalThis, "performance", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    (process as any).hrtime = undefined;
    const dateSpy = jest.spyOn(Date, "now").mockReturnValue(123_456);

    const { now } = await import("../../src/time");
    expect(now()).toBe(123_456);
    expect(dateSpy).toHaveBeenCalled();
  });
});
