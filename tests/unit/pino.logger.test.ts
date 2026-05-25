import {
  DefaultLoggingConfig,
  LogLevel,
  LoggingMode,
  LoggingConfig,
} from "../../src";
import type { DestinationStream, Logger as PinoBaseLogger } from "pino";
import { MiniLogger } from "../../src/logging";
import { PinoFactory, PinoLogger } from "../../src/pino/pino";
import { WinstonLogger } from "../../src/winston/winston";
import { Logging } from "../../src";

type PinoMockInstance = {
  __options: Record<string, unknown>;
  __destination?: unknown;
  __calls: Record<string, string[]>;
};

const customLevels = {
  benchmark: 100,
  fatal: 90,
  critical: 80,
  error: 70,
  warn: 60,
  info: 50,
  verbose: 40,
  debug: 30,
  trace: 20,
  silly: 10,
} as const;

const createPinoInstance = (): PinoMockInstance & Record<string, any> => {
  const calls: Record<string, string[]> = {
    benchmark: [],
    fatal: [],
    critical: [],
    error: [],
    warn: [],
    trace: [],
    debug: [],
    info: [],
    verbose: [],
    silly: [],
  };

  const instance: Record<string, any> = {
    level: "info",
    __options: {},
    __calls: calls,
    benchmark: jest.fn((msg: string) => {
      calls.benchmark.push(msg);
    }),
    trace: jest.fn((msg: string) => {
      calls.trace.push(msg);
    }),
    debug: jest.fn((msg: string) => {
      calls.debug.push(msg);
    }),
    info: jest.fn((msg: string) => {
      calls.info.push(msg);
    }),
    warn: jest.fn((msg: string) => {
      calls.warn.push(msg);
    }),
    error: jest.fn((msg: string) => {
      calls.error.push(msg);
    }),
    fatal: jest.fn((msg: string) => {
      calls.fatal.push(msg);
    }),
    critical: jest.fn((msg: string) => {
      calls.critical.push(msg);
    }),
    verbose: jest.fn((msg: string) => {
      calls.verbose.push(msg);
    }),
    silly: jest.fn((msg: string) => {
      calls.silly.push(msg);
    }),
  };

  instance.child = jest.fn(() => {
    const child = createPinoInstance();
    return { ...child, __parent: instance };
  });
  instance.flush = jest.fn();
  return instance as PinoMockInstance & Record<string, any>;
};

jest.mock("pino", () => {
  const instances: Array<PinoMockInstance & Record<string, any>> = [];
  const factory = jest.fn(
    (options?: Record<string, unknown>, destination?: unknown) => {
      const instance = createPinoInstance();
      instance.__options = options || {};
      instance.__destination = destination;
      instances.push(instance);
      return instance;
    }
  );
  (factory as any).__instances = instances;
  const multistream = jest.fn(
    (targets: Array<{ stream: DestinationStream }>) => {
      const combined: DestinationStream = {
        write: jest.fn((msg: string) => {
          targets.forEach((target) => target.stream.write(msg));
        }),
        flush: jest.fn(),
      } as unknown as DestinationStream;
      return combined;
    }
  );
  return { __esModule: true, default: factory, multistream };
});

jest.mock("winston-transport", () => ({
  __esModule: true,
  default: class Transport {},
}));

type WinstonMockModule = {
  default: {
    createLogger: jest.Mock;
    transports: {
      Console: jest.Mock;
    };
    format: Record<string, jest.Mock>;
  };
  __logCalls: Array<{ message: string }>;
};

jest.mock("winston", () => {
  const logCalls: Array<{ message: string }> = [];
  const createLogger = jest.fn(() => ({
    log: jest.fn((entry: { message: string }) => {
      logCalls.push(entry);
    }),
  }));

  const transports = {
    Console: jest.fn(function Console(this: any, options: unknown) {
      this.options = options;
    }),
  };

  const format = {
    splat: jest.fn(() => "splat"),
    simple: jest.fn(() => "simple"),
    timestamp: jest.fn(() => "timestamp"),
    colorize: jest.fn(() => "colorize"),
    json: jest.fn(() => "json"),
    combine: jest.fn((...parts: unknown[]) => parts.filter(Boolean)),
    printf: jest.fn(() => "printf"),
  };

  return {
    __esModule: true,
    default: {
      createLogger,
      transports,
      format,
    },
    createLogger,
    transports,
    format,
    __logCalls: logCalls,
  };
});

const getPinoFactory = () => jest.requireMock("pino").default as jest.Mock;
const getPinoInstances = () =>
  ((
    getPinoFactory() as unknown as {
      __instances: Array<PinoMockInstance & Record<string, any>>;
    }
  ).__instances || []) as Array<PinoMockInstance & Record<string, any>>;
const getPinoMultistream = () =>
  jest.requireMock("pino").multistream as jest.Mock;
const getWinstonMock = () =>
  jest.requireMock("winston") as WinstonMockModule & {
    createLogger: jest.Mock;
  };
const getWinstonLogCalls = () => getWinstonMock().__logCalls;

const buildDriver = (
  overrides: Partial<PinoBaseLogger & { log?: jest.Mock; flush?: jest.Mock }> =
    {}
) => {
  const base: Record<string, any> = {
    benchmark: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    critical: jest.fn(),
    silly: jest.fn(),
    log: jest.fn(),
    level: "info",
    child: jest.fn().mockImplementation(() => base),
    flush: jest.fn(),
  };
  return Object.assign(base, overrides);
};

type OperationMethod =
  | "benchmark"
  | "fatal"
  | "critical"
  | "info"
  | "debug"
  | "verbose"
  | "warn"
  | "error"
  | "trace"
  | "silly";

type ConsoleMethod = "log" | "debug" | "error" | "warn" | "trace";

const methodToConsole: Record<OperationMethod, ConsoleMethod> = {
  benchmark: "log",
  fatal: "error",
  critical: "error",
  info: "log",
  debug: "debug",
  verbose: "log",
  warn: "warn",
  error: "error",
  trace: "trace",
  silly: "debug",
};

const methodToPino: Record<OperationMethod, keyof PinoMockInstance["__calls"]> =
  {
    benchmark: "benchmark",
    fatal: "fatal",
    critical: "critical",
    info: "info",
    debug: "debug",
    verbose: "verbose",
    warn: "warn",
    error: "error",
    trace: "trace",
    silly: "silly",
  };

describe("PinoLogger", () => {
  beforeEach(() => {
    Logging.setConfig({ ...DefaultLoggingConfig });
    Logging.setConfig({
      level: LogLevel.trace,
      verbose: 9,
      timestamp: false,
      style: false,
      logLevel: true,
      context: true,
      separator: "|",
      pattern: "{level}|{context}|{message}{stack}",
      format: LoggingMode.RAW,
    });
    const pinoFactory = getPinoFactory();
    pinoFactory.mockClear();
    getPinoInstances().length = 0;
    getPinoMultistream().mockClear();
    const winstonMock = getWinstonMock();
    winstonMock.createLogger.mockClear();
    getWinstonLogCalls().length = 0;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates a Pino instance with mapped defaults", () => {
    const pinoFactory = getPinoFactory();
    const logger = new PinoLogger("Ctx", { level: LogLevel.debug });
    expect(logger).toBeInstanceOf(PinoLogger);
    expect(pinoFactory).toHaveBeenCalledTimes(1);
    const [options, destination] = pinoFactory.mock.calls[0];
    expect(options).toMatchObject({
      level: "debug",
      name: "Ctx",
      customLevels,
      useOnlyCustomLevels: true,
    });
    expect(destination).toBeUndefined();
  });

  it("reuses a provided Pino logger instance", () => {
    const external: any = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
      level: "debug",
    };
    const logger = new PinoLogger("Ctx", undefined, external);
    expect(logger).toBeInstanceOf(PinoLogger);
    expect(getPinoFactory()).not.toHaveBeenCalled();
    logger.info("hello");
    expect(external.info).toHaveBeenCalled();
  });

  it("uses transports from config as destination streams", () => {
    const sink: DestinationStream = {
      write: jest.fn(),
    } as unknown as DestinationStream;
    new PinoLogger("Ctx", { transports: [sink] });
    // @ts-expect-error jest
    const [, destination] = getPinoFactory().mock.calls.at(-1) ?? [];
    expect(destination).toBe(sink);
  });

  it("leaves destination undefined when transports are omitted", () => {
    new PinoLogger("Ctx");
    // @ts-expect-error jest
    const [, destination] = getPinoFactory().mock.calls.at(-1) ?? [];
    expect(destination).toBeUndefined();
  });

  it("combines multiple transports via multistream", () => {
    const first: DestinationStream = {
      write: jest.fn(),
    } as unknown as DestinationStream;
    const second: DestinationStream = {
      write: jest.fn(),
    } as unknown as DestinationStream;
    const multi = getPinoMultistream();
    new PinoLogger("Ctx", { transports: [first, second] });
    expect(multi).toHaveBeenCalledTimes(1);
    // @ts-expect-error jest
    const [, destination] = getPinoFactory().mock.calls.at(-1) ?? [];
    expect(destination).toBe(multi.mock.results[0].value);
  });

  it("returns undefined when transport list is empty", () => {
    new PinoLogger("Ctx", { transports: [] });
    // @ts-expect-error jest
    const [, destination] = getPinoFactory().mock.calls.at(-1) ?? [];
    expect(destination).toBeUndefined();
  });

  it("ignores transports lacking a write method", () => {
    const valid: DestinationStream = {
      write: jest.fn(),
    } as unknown as DestinationStream;
    const invalid = {} as DestinationStream;
    new PinoLogger("Ctx", { transports: [invalid, valid] });
    // @ts-expect-error jest
    const [, destination] = getPinoFactory().mock.calls.at(-1) ?? [];
    expect(destination).toBe(valid);
  });

  it("creates child logger preserving Pino child bindings", () => {
    const logger = new PinoLogger("Parent");
    const instance = getPinoInstances()[0];
    const child = logger.child({ name: "Child" });
    expect(instance.child).toHaveBeenCalled();
    expect(child).toBeInstanceOf(PinoLogger);
    expect((child as unknown as MiniLogger)["context"]).toEqual([
      "Parent",
      "Child",
    ]);
  });

  it("preserves subclass typing for for/clear chains", () => {
    const logger = new PinoLogger("Ctx");
    const scoped = logger.for("Child");
    expect(scoped).toBeInstanceOf(PinoLogger);
    expect((scoped as unknown as MiniLogger)["context"]).toEqual([
      "Ctx",
      "Child",
    ]);

    const cleared = scoped.clear();
    expect(cleared).toBe(scoped);
    expect((cleared as unknown as MiniLogger)["context"]).toEqual(["Ctx"]);

    const next = cleared.for("Next");
    expect(next).toBeInstanceOf(PinoLogger);
    expect((next as unknown as MiniLogger)["context"]).toEqual(["Ctx", "Next"]);
  });

  it("keeps clear accessible after multiple nested for calls", () => {
    const logger = new PinoLogger("Ctx");
    const chained = logger.for("A").for("B").for("C");
    expect(chained).toBeInstanceOf(PinoLogger);
    expect((chained as unknown as MiniLogger)["context"]).toEqual([
      "Ctx",
      "A",
      "B",
      "C",
    ]);
    expect(typeof (chained as MiniLogger).clear).toBe("function");

    const cleared = chained.clear();
    expect((cleared as unknown as MiniLogger)["context"]).toEqual(["Ctx"]);
    const final = cleared.for("Next");
    expect(final).toBeInstanceOf(PinoLogger);
    expect((final as unknown as MiniLogger)["context"]).toEqual([
      "Ctx",
      "Next",
    ]);
  });

  it("exposes level setter and getter syncing with config", () => {
    const logger = new PinoLogger("Ctx");
    logger.level = "debug";
    expect(logger.level).toBe("debug");
    logger.info("info");
    const instance = getPinoInstances()[0];
    expect(instance.__calls.info).toHaveLength(1);
  });

  it("ignores level assignments when value is undefined", () => {
    const logger = new PinoLogger("Ctx");
    const instance = getPinoInstances()[0];
    logger.level = undefined;
    expect(instance.level).toBe("info");
  });

  it("keeps config untouched when mapping level fails", () => {
    const logger = new PinoLogger("Ctx");
    const before = (logger as any).config("level");
    logger.level = "silent" as any;
    expect((logger as any).config("level")).toBe(before);
  });

  it("syncs config level from external driver instances", () => {
    const driver = buildDriver({ level: "warn" });
    const logger = new PinoLogger("Ctx", undefined, driver as PinoBaseLogger);
    expect((logger as any).config("level")).toBe(LogLevel.warn);
  });

  it("ignores driver level when undefined", () => {
    const driver = buildDriver({ level: undefined });
    const logger = new PinoLogger("Ctx", undefined, driver as PinoBaseLogger);
    expect((logger as any).config("level")).toBe(LogLevel.trace);
  });

  it("emits identical messages across MiniLogger, WinstonLogger, and PinoLogger", () => {
    const config: Partial<LoggingConfig> = {
      level: LogLevel.silly,
      verbose: 9,
      timestamp: false,
      style: false,
      logLevel: true,
      context: true,
      separator: "|",
      pattern: "{level}|{context}|{message}{stack}",
      format: LoggingMode.RAW,
    };

    const operations: Array<{
      method: OperationMethod;
      invoke: (logger: MiniLogger) => void;
    }> = [
      {
        method: "benchmark",
        invoke: (logger) => logger.benchmark("Benchmark test"),
      },
      { method: "fatal", invoke: (logger) => logger.fatal("Fatal test") },
      {
        method: "critical",
        invoke: (logger) => logger.critical("Critical test"),
      },
      { method: "info", invoke: (logger) => logger.info("Info test") },
      { method: "debug", invoke: (logger) => logger.debug("Debug test") },
      {
        method: "verbose",
        invoke: (logger) => logger.verbose("Verbose test", 0),
      },
      { method: "warn", invoke: (logger) => logger.warn("Warn test") },
      { method: "error", invoke: (logger) => logger.error("Error test") },
      { method: "trace", invoke: (logger) => logger.trace("Trace test") },
      { method: "silly", invoke: (logger) => logger.silly("Silly test") },
    ];

    operations.forEach(({ method, invoke }) => {
      const miniSpy = jest
        .spyOn(console, methodToConsole[method])
        .mockImplementation(() => {});
      const mini = new MiniLogger("Compat", config);
      invoke(mini);
      const miniOutput = miniSpy.mock.calls.at(-1)?.[0];
      miniSpy.mockRestore();

      getWinstonLogCalls().length = 0;
      const winston = new WinstonLogger("Compat", config);
      invoke(winston);
      const winstonOutput = getWinstonLogCalls().at(-1)?.message;

      getPinoInstances().length = 0;
      const pinoLogger = new PinoLogger("Compat", config);
      invoke(pinoLogger);
      const pinoInstance = getPinoInstances()[0];
      const pinoOutput = pinoInstance?.__calls[methodToPino[method]].at(-1);

      expect(miniOutput).toBeDefined();
      expect(winstonOutput).toEqual(miniOutput);
      expect(pinoOutput).toEqual(miniOutput);
    });
  });

  it("factory produces PinoLogger instances", () => {
    const logger = PinoFactory("Ctx");
    expect(logger).toBeInstanceOf(PinoLogger);
  });

  it("defaults context name to 'Logger' when no segments exist", () => {
    new PinoLogger(undefined);
    // @ts-expect-error jest
    const [options] = getPinoFactory().mock.calls.at(-1) ?? [];
    expect(options.name).toBe("Logger");
  });

  it("coerces unknown log levels to info", () => {
    new PinoLogger("Ctx", { level: undefined as unknown as LogLevel });
    // @ts-expect-error jest
    const [options] = getPinoFactory().mock.calls.at(-1) ?? [];
    expect(options.level).toBe("info");
  });

  it("falls back to global context separator when override is falsy", () => {
    Logging.setConfig({ contextSeparator: "::" });
    new PinoLogger("Root", { contextSeparator: "" as any });
    // @ts-expect-error jest
    const [options] = getPinoFactory().mock.calls.at(-1) ?? [];
    expect(options.name).toBe("Root");
  });

  it("enables timestamp functions when configured", () => {
    Logging.setConfig({ timestamp: true });
    const logger = new PinoLogger("TimeCtx");
    expect(logger).toBeInstanceOf(PinoLogger);
    // @ts-expect-error jest
    const [options] = getPinoFactory().mock.calls.at(-1) ?? [];
    expect(typeof options.timestamp).toBe("function");
    expect(options.timestamp()).toMatch(/T/);
  });

  it("falls back to driver.log when specific log method is missing", () => {
    const logSpy = jest.fn();
    const driver = buildDriver({
      info: undefined,
      log: logSpy,
    });
    const logger = new PinoLogger("Ctx", undefined, driver as PinoBaseLogger);
    logger.info("payload");
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ level: "info", msg: expect.any(String) })
    );
  });

  it("falls back to log when a custom-level method is unavailable", () => {
    const logSpy = jest.fn();
    const driver = buildDriver({
      fatal: undefined,
      log: logSpy,
    });
    const logger = new PinoLogger("Ctx", undefined, driver as PinoBaseLogger);
    logger.fatal("failure");
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ level: "fatal", msg: expect.any(String) })
    );
  });

  it("invokes the custom-level methods when supported by the driver", () => {
    const fatalSpy = jest.fn();
    const criticalSpy = jest.fn();
    const driver = buildDriver({ fatal: fatalSpy, critical: criticalSpy });
    const logger = new PinoLogger("Ctx", undefined, driver as PinoBaseLogger);
    logger.fatal("fatal error");
    logger.critical("critical error");
    expect(fatalSpy).toHaveBeenCalledWith(expect.any(String));
    expect(criticalSpy).toHaveBeenCalledWith(expect.any(String));
  });

  it("delegates flush to the underlying Pino driver when present", () => {
    const flushSpy = jest.fn();
    const driver = buildDriver({ flush: flushSpy });
    const logger = new PinoLogger("Ctx", undefined, driver as PinoBaseLogger);
    logger.flush();
    expect(flushSpy).toHaveBeenCalled();
  });

  it("falls back to the parent logger when driver does not expose child", () => {
    const driver = buildDriver({ child: undefined });
    const logger = new PinoLogger("Ctx", undefined, driver as PinoBaseLogger);
    const child = logger.child({});
    expect(child).toBeInstanceOf(PinoLogger);
  });

  it("prefers bindings.context when deriving the child name", () => {
    const logger = new PinoLogger("Parent");
    const child = logger.child({ context: "Override" });
    expect((child as unknown as MiniLogger)["context"]).toEqual([
      "Parent",
      "Override",
    ]);
  });

  it("propagates context when bindings omit routing hints", () => {
    const logger = new PinoLogger("Parent");
    const child = logger.child({});
    expect((child as unknown as MiniLogger)["context"]).toEqual(["Parent"]);
  });

  it("honors winston transports and raw log output", () => {
    const winstonMock = getWinstonMock();
    // @ts-expect-error jest
    const transport = new (winstonMock.transports.Console as any)();
    const logger = new WinstonLogger("Compat", { transports: [transport] });
    logger.info("message");
    const [{ transports: appliedTransports, format }] =
      // @ts-expect-error jest
      winstonMock.createLogger.mock.calls.at(-1) || [];
    expect(appliedTransports).toEqual([transport]);
    // @ts-expect-error jest
    const logEntry = getWinstonLogCalls().at(-1);
    expect(format).toBeDefined();
    expect(logEntry?.message).toContain("INFO|Compat|message");
  });

  it("appends metadata to log output when configured", () => {
    const metaPayload = { traceId: "meta" };
    Logging.setConfig({
      ...DefaultLoggingConfig,
      format: LoggingMode.RAW,
      pattern: "{message}",
      meta: true,
    });
    const logger = new PinoLogger("Ctx");
    logger.info("payload", metaPayload);
    const pinoInstance = getPinoInstances()[0];
    const logged = pinoInstance?.__calls.info.at(-1);
    expect(logged).toContain(JSON.stringify(metaPayload));
  });
});
