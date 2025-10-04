import * as winston from "winston";
import { Logging, DefaultLoggingConfig } from "../../src";
import { WinstonFactory, WinstonLogger } from "../../src/winston/winston";

// No mocks: rely on winston devDependency present in package.json

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
    const wl = new WinstonLogger("WCtx", {}, transport);
    wl.info("hello");
    wl.debug("dbg");
    wl.error("oops");
    wl.verbose("vv", 1);
    wl.silly("ss");
  });

  it("creates via WinstonFactory and is instance of WinstonLogger", () => {
    const transport = new winston.transports.Console();
    const logger = WinstonFactory("F", {}, transport);
    expect(logger).toBeInstanceOf(WinstonLogger);
    logger.info("hi");
  });

  it("applies style branch when style=true", () => {
    Logging.setConfig({ style: true, timestamp: false });
    const transport = new winston.transports.Console();
    const wl = new WinstonLogger("B1", {}, transport);
    wl.info("x");
  });

  it("applies timestamp branch when timestamp=true", () => {
    Logging.setConfig({ style: false, timestamp: true });
    const transport = new winston.transports.Console();
    const wl = new WinstonLogger("B2", {}, transport);
    wl.info("y");
  });
});
