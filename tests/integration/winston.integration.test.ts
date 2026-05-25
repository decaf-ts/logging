import * as winston from "winston";
import Transport from "winston-transport";
import { Logging, DefaultLoggingConfig } from "../../src";
import { WinstonFactory, WinstonLogger } from "../../src/winston/winston";

// No mocks: rely on winston devDependency present in package.json

class MemoryTransport extends Transport {
  messages: Array<{ level: string; message: string }> = [];

  override log(
    info: { level: string; message: string },
    callback: () => void
  ): void {
    this.messages.push(info);
    callback();
  }
}

describe("Winston adapter (integration)", () => {
  beforeEach(() => {
    Logging.setConfig({
      ...DefaultLoggingConfig,
      style: false,
      logLevel: false,
      timestamp: true,
      context: false,
      format: "raw",
      correlationId: "cid-1",
    });
  });

  it("creates WinstonLogger via constructor and logs at different levels", () => {
    const transport = new winston.transports.Console();
    const wl = new WinstonLogger("WCtx", { transports: [transport] });
    wl.info("hello");
    wl.debug("dbg");
    wl.error("oops");
    wl.verbose("vv", 1);
    wl.silly("ss");
  });

  it("supports critical and fatal levels with a real Winston transport", () => {
    const transport = new MemoryTransport();
    const wl = new WinstonLogger("Severity", { transports: [transport] });

    expect(typeof wl.critical).toBe("function");
    expect(typeof wl.fatal).toBe("function");

    wl.critical("critical path");
    wl.fatal("fatal path");

    expect(
      transport.messages.some((entry) => entry.message.includes("critical path"))
    ).toBe(true);
    expect(
      transport.messages.some((entry) => entry.message.includes("fatal path"))
    ).toBe(true);
    expect(
      transport.messages
        .filter((entry) => entry.message.includes("critical path"))
        .every((entry) => entry.level === "critical")
    ).toBe(true);
    expect(
      transport.messages
        .filter((entry) => entry.message.includes("fatal path"))
        .every((entry) => entry.level === "fatal")
    ).toBe(true);
  });

  it("creates via WinstonFactory and is instance of WinstonLogger", () => {
    const transport = new winston.transports.Console();
    const logger = WinstonFactory("F", { transports: [transport] });
    expect(logger).toBeInstanceOf(WinstonLogger);
    logger.info("hi");
  });

  it("applies style branch when style=true", () => {
    Logging.setConfig({ style: true, timestamp: false });
    const transport = new winston.transports.Console();
    const wl = new WinstonLogger("B1", { transports: [transport] });
    wl.info("x");
  });

  it("applies timestamp branch when timestamp=true", () => {
    Logging.setConfig({ style: false, timestamp: true });
    const transport = new winston.transports.Console();
    const wl = new WinstonLogger("B2", { transports: [transport] });
    wl.info("y");
  });

  it("uses default Console transport when none provided", () => {
    Logging.setConfig({ style: false, timestamp: false });
    const wl = new WinstonLogger("DefaultTransport");
    wl.info("z");
  });
});
