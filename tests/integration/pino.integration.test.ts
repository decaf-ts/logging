import { Writable } from "node:stream";
import pino from "pino";
import {
  DefaultLoggingConfig,
  Logging,
  LogLevel,
  MiniLogger,
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

const resetFactory = () =>
  Logging.setFactory(
    (context, conf, ...rest) => new MiniLogger(context, conf, ...rest)
  );

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
    const pinoInstance = pino({ level: "trace", name: "Compat" }, sink);
    const logger = new PinoLogger("Compat", { pino: { instance: pinoInstance } });

    logger.info("hello");
    logger.error("boom");

    expect(sink.chunks.length).toBeGreaterThanOrEqual(2);
    const last = sink.chunks.at(-1) ?? "";
    expect(last).toContain("ERROR|Compat|boom");
  });

  it("can be registered globally via Logging.setFactory", () => {
    Logging.setFactory(PinoFactory);
    const sink = new MemoryStream();
    const external = pino({ level: "trace", name: "FactoryCtx" }, sink);
    const logger = Logging.for("FactoryCtx", { pino: { instance: external } });

    expect(logger).toBeInstanceOf(PinoLogger);

    logger.debug("from factory");
    expect(sink.chunks.at(-1)).toContain("DEBUG|FactoryCtx|from factory");
  });
});
