import { Writable } from "node:stream";
import pino from "pino";
import {
  DefaultLoggingConfig,
  Logging,
  LogLevel,
  MiniLogger,
  LoggedEnvironment,
} from "../../src";
import { PinoFactory, PinoLogger } from "../../src/pino/pino";

class MemoryStream extends Writable {
  chunks: string[] = [];

  override _write(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.chunks.push(
      typeof chunk === "string" ? chunk : chunk.toString("utf8")
    );
    callback();
  }
}

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

const resetFactory = () =>
  Logging.setFactory((context, conf) => {
    const base =
      typeof LoggedEnvironment.app === "string" &&
      LoggedEnvironment.app?.length
        ? [LoggedEnvironment.app as string]
        : [];
    return new MiniLogger(context, conf, base);
  });

describe("PinoLogger (integration)", () => {
  beforeEach(() => {
    Logging.setConfig({
      ...DefaultLoggingConfig,
      level: LogLevel.trace,
      style: false,
      logLevel: true,
      context: true,
      timestamp: false,
      separator: "|",
      format: "raw",
      pattern: "{level}|{context}|{message}{stack}",
    });
  });

  afterEach(() => {
    resetFactory();
  });

  it("wraps a real Pino instance and emits formatted messages", () => {
    const sink = new MemoryStream();
    const pinoInstance = pino(
      {
        level: "trace",
        customLevels,
        useOnlyCustomLevels: true,
        name: "Compat",
      },
      sink
    );
    const logger = new PinoLogger("Compat", undefined, pinoInstance);

    logger.info("hello");
    logger.error("boom");

    expect(sink.chunks.length).toBeGreaterThanOrEqual(2);
    const last = sink.chunks.at(-1) ?? "";
    expect(last).toContain("ERROR|Compat|boom");
  });

  it("supports critical and fatal levels with a real Pino driver", () => {
    const sink = new MemoryStream();
    const pinoInstance = pino(
      {
        level: "trace",
        customLevels,
        useOnlyCustomLevels: true,
        name: "Severity",
      },
      sink
    );
    const logger = new PinoLogger("Severity", undefined, pinoInstance);

    expect(typeof logger.critical).toBe("function");
    expect(typeof logger.fatal).toBe("function");

    logger.critical("critical path");
    logger.fatal("fatal path");

    const combined = sink.chunks.join("");
    expect(combined).toContain("critical path");
    expect(combined).toContain("fatal path");
  });

  it("can be registered globally via Logging.setFactory", () => {
    Logging.setFactory(PinoFactory);
    const sink = new MemoryStream();
    const external = pino(
      {
        level: "trace",
        customLevels,
        useOnlyCustomLevels: true,
        name: "FactoryCtx",
      },
      sink
    );
    const logger = Logging.for("FactoryCtx", undefined, external);

    expect(logger).toBeInstanceOf(PinoLogger);

    logger.debug("from factory");
    expect(sink.chunks.at(-1)).toContain("DEBUG|FactoryCtx|from factory");
  });
});
