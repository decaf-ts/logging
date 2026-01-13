import { DefaultLoggingConfig, Logging, LoggingMode } from "../../src";
import {
  WinstonFactory,
  WinstonLogger,
} from "../../src/winston/winston";

jest.mock("winston", () => {
  const logSpy = jest.fn();
  const createLogger = jest.fn(() => ({
    log: logSpy,
  }));
  const consoleCtor = jest.fn(function Console(this: any) {
    this.type = "console";
  });
  const printf = jest.fn(
    (formatter: (payload: { message: unknown }) => string) => formatter
  );
  return {
    __esModule: true,
    default: {
      createLogger,
      transports: {
        Console: consoleCtor,
      },
      format: {
        printf,
      },
    },
    createLogger,
    transports: {
      Console: consoleCtor,
    },
    format: {
      printf,
    },
    __logSpy: logSpy,
  };
});

const winstonMock = jest.requireMock("winston") as {
  createLogger: jest.Mock;
  transports: {
    Console: jest.Mock;
  };
  format: {
    printf: jest.Mock;
  };
  __logSpy: jest.Mock;
};

const createLogger = winstonMock.createLogger;
const consoleCtor = winstonMock.transports.Console;
const printf = winstonMock.format.printf;
const logSpy = winstonMock.__logSpy;

describe("WinstonLogger (unit)", () => {
  beforeEach(() => {
    Logging.setConfig({ ...DefaultLoggingConfig });
    jest.clearAllMocks();
  });

  it("uses a default Console transport when none are provided", () => {
    new WinstonLogger("Ctx");
    expect(consoleCtor).toHaveBeenCalledTimes(1);
    const [{ transports }] = createLogger.mock.calls.at(-1) ?? [];
    expect(transports).toHaveLength(1);
    expect(transports?.[0]).toBe(consoleCtor.mock.instances[0]);
  });

  it("reuses explicit transports without creating a Console", () => {
    const custom = { write: jest.fn() } as any;
    new WinstonLogger("Ctx", { transports: [custom] });
    const [{ transports }] = createLogger.mock.calls.at(-1) ?? [];
    expect(transports).toEqual([custom]);
    expect(consoleCtor).not.toHaveBeenCalled();
  });

  it("passes correlation ids through to winston", () => {
    Logging.setConfig({ correlationId: "abc-123" });
    const logger = new WinstonLogger("Ctx");
    logger.info("payload");
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: "abc-123" })
    );
  });

  it("serializes non-string payloads through printf formatter", () => {
    new WinstonLogger("Ctx");
    const formatter = printf.mock.calls.at(-1)?.[0] as (
      payload: { message: unknown }
    ) => string;
    expect(formatter({ message: "text" })).toBe("text");
    expect(formatter({ message: { nested: true } })).toBe(
      JSON.stringify({ nested: true })
    );
  });

  it("factory returns WinstonLogger instances", () => {
    expect(WinstonFactory("Ctx")).toBeInstanceOf(WinstonLogger);
  });

  it("appends metadata to log entries when configured", () => {
    const payload = { traceId: "meta" };
    Logging.setConfig({
      ...DefaultLoggingConfig,
      format: LoggingMode.RAW,
      pattern: "{message}",
      meta: true,
    });
    const logger = new WinstonLogger("Ctx");
    logger.info("message", payload);
    const logEntry = logSpy.mock.calls.at(-1)?.[0] as { message: string };
    expect(logEntry?.message).toContain(JSON.stringify(payload));
  });
});
