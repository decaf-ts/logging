import {
  DefaultLoggingConfig,
  LogLevel,
  LoggingMode,
  LoggingConfig,
} from "../../src";
import { MiniLogger } from "../../src/logging";
import { PinoFactory, PinoLogger } from "../../src/pino/pino";
import { WinstonLogger } from "../../src/winston/winston";
import { Logging } from "../../src";

type PinoMockInstance = {
  __options: Record<string, unknown>;
  __calls: Record<string, string[]>;
};

const createPinoInstance = (): PinoMockInstance & Record<string, any> => {
  const calls: Record<string, string[]> = {
    trace: [],
    debug: [],
    info: [],
    warn: [],
    error: [],
    fatal: [],
  };

  const instance: Record<string, any> = {
    level: "info",
    __options: {},
    __calls: calls,
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
  const factory = jest.fn((options?: Record<string, unknown>) => {
    const instance = createPinoInstance();
    instance.__options = options || {};
    instances.push(instance);
    return instance;
  });
  (factory as any).__instances = instances;
  return { __esModule: true, default: factory };
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
  ((getPinoFactory() as unknown as {
    __instances: Array<PinoMockInstance & Record<string, any>>;
  }).__instances || []) as Array<PinoMockInstance & Record<string, any>>;
const getWinstonMock = () =>
  jest.requireMock("winston") as WinstonMockModule & {
    createLogger: jest.Mock;
  };
const getWinstonLogCalls = () => getWinstonMock().__logCalls;

type OperationMethod =
  | "benchmark"
  | "info"
  | "debug"
  | "verbose"
  | "warn"
  | "error"
  | "trace";

type ConsoleMethod = "log" | "debug" | "error" | "warn" | "trace";

const methodToConsole: Record<OperationMethod, ConsoleMethod> = {
  benchmark: "log",
  info: "log",
  debug: "debug",
  verbose: "debug",
  warn: "warn",
  error: "error",
  trace: "trace",
};

const methodToPino: Record<
  OperationMethod,
  keyof PinoMockInstance["__calls"]
> = {
  benchmark: "info",
  info: "info",
  debug: "debug",
  verbose: "debug",
  warn: "warn",
  error: "error",
  trace: "trace",
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
    const [options] = pinoFactory.mock.calls[0];
    expect(options).toMatchObject({ level: "debug", name: "Ctx" });
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
    const logger = new PinoLogger("Ctx", { pino: { instance: external } });
    expect(logger).toBeInstanceOf(PinoLogger);
    expect(getPinoFactory()).not.toHaveBeenCalled();
    logger.info("hello");
    expect(external.info).toHaveBeenCalled();
  });

  it("creates child logger preserving Pino child bindings", () => {
    const logger = new PinoLogger("Parent");
    const instance = getPinoInstances()[0];
    const child = logger.child({ name: "Child" });
    expect(instance.child).toHaveBeenCalled();
    expect(child).toBeInstanceOf(PinoLogger);
    expect((child as unknown as MiniLogger)["context"]).toBe("Parent.Child");
  });

  it("exposes level setter and getter syncing with config", () => {
    const logger = new PinoLogger("Ctx");
    logger.level = "debug";
    expect(logger.level).toBe("debug");
    logger.info("info");
    const instance = getPinoInstances()[0];
    expect(instance.__calls.info).toHaveLength(1);
  });

  it("emits identical messages across MiniLogger, WinstonLogger, and PinoLogger", () => {
    const config: Partial<LoggingConfig> = {
      level: LogLevel.trace,
      verbose: 9,
      timestamp: false,
      style: false,
      logLevel: true,
      context: true,
      separator: "|",
      pattern: "{level}|{context}|{message}{stack}",
      format: LoggingMode.RAW,
    };

    const mini = new MiniLogger("Compat", config);
    const winston = new WinstonLogger("Compat", config);
    const pinoLogger = new PinoLogger("Compat", config);

    const spies: Record<ConsoleMethod, jest.SpyInstance> = {
      log: jest.spyOn(console, "log").mockImplementation(() => {}),
      debug: jest.spyOn(console, "debug").mockImplementation(() => {}),
      error: jest.spyOn(console, "error").mockImplementation(() => {}),
      warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
      trace: jest.spyOn(console, "trace").mockImplementation(() => {}),
    };

    const operations: Array<{
      method: OperationMethod;
      invoke: (logger: MiniLogger) => void;
    }> = [
      {
        method: "benchmark",
        invoke: (logger) => logger.benchmark("Benchmark test"),
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
    ];

    operations.forEach(({ method, invoke }) => {
      invoke(mini);
      const miniOutput =
        spies[methodToConsole[method]].mock.calls.at(-1)?.[0];

      invoke(winston);
      const winstonOutput = getWinstonLogCalls().at(-1)?.message;

      invoke(pinoLogger);
      const pinoInstance = getPinoInstances()[0];
      const pinoOutput = pinoInstance?.__calls[methodToPino[method]].at(-1);
      expect(miniOutput).toBeDefined();
      expect(winstonOutput).toEqual(miniOutput);
      expect(pinoOutput).toEqual(miniOutput);
    });

    (Object.values(spies) as jest.SpyInstance[]).forEach((spy) =>
      spy.mockRestore()
    );
  });

  it("factory produces PinoLogger instances", () => {
    const logger = PinoFactory("Ctx");
    expect(logger).toBeInstanceOf(PinoLogger);
  });
});
