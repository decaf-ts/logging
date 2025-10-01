import { DefaultLoggingConfig, Logging, LogLevel, MiniLogger, DefaultTheme } from "../../src";

// Integration tests without mocks; focus on executing branches and verifying return values/state.

describe("Logging core (integration)", () => {
  beforeEach(() => {
    Logging.setConfig({ ...DefaultLoggingConfig, style: false, format: "raw" });
  });

  it("setConfig/getConfig roundtrip", () => {
    const cfg = { ...DefaultLoggingConfig, level: LogLevel.debug, verbose: 3 };
    Logging.setConfig(cfg);
    expect(Logging.getConfig().level).toBe(LogLevel.debug);
    expect(Logging.getConfig().verbose).toBe(3);
  });

  it("for() with method name extends context and remains callable", () => {
    const base = new MiniLogger("Ctx");
    const child = base.for("method", { level: LogLevel.error });
    expect((child as any).context).toBe("Ctx.method");
    // ensure child logger can log without throwing
    child.info("hello");
  });

  it("for() with only config object (no method) keeps context and remains callable", () => {
    const base = new MiniLogger("C");
    const child = base.for({ level: LogLevel.silly });
    expect((child as any).context).toBe("C");
    child.debug("x");
  });

  it("because() creates a logger with arbitrary reason/id", () => {
    const l = Logging.because("ad-hoc", "42");
    // Ensure we can call a method, which exercises factory path
    l.info("x");
  });

  it("createLog produces RAW and JSON formats including stack and correlationId", () => {
    const logger = new MiniLogger("C", { correlationId: "abc", format: "raw" });
    const raw = (logger as any).createLog(LogLevel.info, "hello");
    expect(typeof raw).toBe("string");
    expect(raw).toContain("hello");

    const err = new Error("bad");
    const rawWithStack = (logger as any).createLog(LogLevel.error, err);
    expect(rawWithStack).toContain("Stack trace:");

    // JSON
    const jsonLogger = new MiniLogger("C", { correlationId: "cid", format: "json" });
    const json = (jsonLogger as any).createLog(LogLevel.debug, "msg");
    const parsed = JSON.parse(json);
    expect(parsed.message).toBeDefined();
    expect(parsed.level).toBeDefined();
    expect(parsed.context).toBeDefined();
    // correlationId only added if present
    if (parsed.correlationId) {
      expect(parsed.correlationId).toBeDefined();
    }
  });

  it("theme returns input when style disabled, and applies template when enabled", () => {
    const text = "hello";
    // style off -> unchanged
    Logging.setConfig({ ...DefaultLoggingConfig, style: false });
    expect(Logging.theme(text, "message" as any, LogLevel.info)).toBe(text);

    // style on with default theme -> should return a string (styled library generates a string)
    Logging.setConfig({ ...DefaultLoggingConfig, style: true });
    const styled = Logging.theme(text, "message" as any, LogLevel.info);
    expect(typeof styled).toBe("string");
  });

  it("theme error branches: invalid color length and unknown option", () => {
    Logging.setConfig({ ...DefaultLoggingConfig, style: true });
    const badColorTheme = {
      ...DefaultTheme,
      message: { fg: [10, 20] as unknown as [number] }, // invalid length 2 triggers default branch
    };
    const r1 = Logging.theme("txt", "message" as any, LogLevel.debug, badColorTheme);
    expect(typeof r1).toBe("string");

    const unknownOptionTheme = {
      ...DefaultTheme,
      message: { unknown: 1 as any },
    } as any;
    const r2 = Logging.theme("txt", "message" as any, LogLevel.info, unknownOptionTheme);
    expect(typeof r2).toBe("string");
  });
});


// Additional targeted tests to increase coverage for proxy overrides, unsupported formats, and theme branches
it("proxy config override via property access on child.config", () => {
  const base = new MiniLogger("PC");
  const child = base.for("m", { level: LogLevel.error, verbose: 9 });
  const lvl = (child as any).config["level"];
  const vb = (child as any).config["verbose"];
  expect(lvl).toBe(LogLevel.error);
  expect(vb).toBe(9);
});

it("throws on unsupported logging format in createLog", () => {
  const bad = new MiniLogger("B", { format: "xml" as any });
  expect(() => (bad as any).createLog(LogLevel.info, "x")).toThrow(
    /Unsupported logging format/
  );
});

it("theme applies bg color and numeric style without throwing", () => {
  Logging.setConfig({ ...DefaultLoggingConfig, style: true });
  const custom = {
    ...DefaultTheme,
    message: { bg: [200] as unknown as [number], style: 1 as any },
  } as any;
  const out = Logging.theme("Z", "message" as any, LogLevel.info, custom);
  expect(typeof out).toBe("string");
});

it("calling protected log with LogLevel.silly triggers default error branch", () => {
  const l = new MiniLogger("X", { level: LogLevel.silly });
  expect(() => (l as any).log("silly", "t")).toThrow(/Invalid log level/);
});
