import {
  BaseError,
  DefaultLoggingConfig,
  DefaultTheme,
  LogLevel,
  Logging,
  LoggingMode,
  MiniLogger,
} from "../../src";

// Integration tests (no mocks). They exercise the real createLog path and
// assert that the `errorName` log parameter (added alongside `errorCode` in
// SAA-795) is derived from the Error candidate's `name`, rendered by the
// `{errorName}` pattern slot, and emitted in JSON mode as a separate field
// that is NOT baked into the error's toString().

describe("errorName integration", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    Logging.setConfig({ ...DefaultLoggingConfig });
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  const rawLogger = (
    pattern: string,
    overrides: Record<string, unknown> = {}
  ) =>
    new MiniLogger("Ctx", {
      style: false,
      timestamp: false,
      format: LoggingMode.RAW,
      pattern,
      ...overrides,
    });

  describe("pattern rendering", () => {
    it("renders {errorName} for a generic Error", () => {
      const logger = rawLogger("{level} {errorName} {message}");
      const out = (logger as any).createLog(
        LogLevel.error,
        "boom",
        new Error("boom")
      );
      expect(out).toContain("Error");
      expect(out).toContain("boom");
    });

    it("renders {errorName} from the Error name, not from the message", () => {
      const logger = rawLogger("{errorName} - {message}");
      const err = new Error("boom");
      err.name = "CustomError";
      const out = (logger as any).createLog(LogLevel.error, "boom", err);
      expect(out).toBe("CustomError - boom");
    });

    it("renders {errorName} for a TypeError", () => {
      const logger = rawLogger("{errorName} {message}");
      const out = (logger as any).createLog(
        LogLevel.error,
        "boom",
        new TypeError("boom")
      );
      expect(out).toMatch(/^TypeError boom/);
    });

    it("renders {errorName} when the Error is passed as the message", () => {
      const logger = rawLogger("{errorName} - {message}");
      const out = (logger as any).createLog(LogLevel.error, new Error("boom"));
      expect(out).toMatch(/^Error - boom/);
    });

    it("omits {errorName} when there is no Error candidate", () => {
      const logger = rawLogger("{level}|{errorName}|{message}");
      const out = (logger as any).createLog(LogLevel.info, "plain message");
      expect(out).not.toContain("Error");
      // the parameter slot renders empty for an absent value
      expect(out).toEqual("INFO||plain message");
    });

    it("renders {errorName} for a decaf BaseError subclass name", () => {
      class AppError extends BaseError {
        constructor(msg: string, code: number) {
          super(AppError.name, msg, code);
          this.name = AppError.name;
        }
      }
      const logger = rawLogger("{errorName} {message}");
      const err = new AppError("broken", 500);
      const out = (logger as any).createLog(LogLevel.error, "broken", err);
      expect(out).toMatch(/^AppError /);
    });
  });

  describe("JSON mode", () => {
    const jsonLogger = (overrides: Record<string, unknown> = {}) =>
      new MiniLogger("Ctx", {
        style: false,
        timestamp: false,
        format: LoggingMode.JSON,
        ...overrides,
      });

    it("emits errorName for an Error (mirrors errorCode)", () => {
      class E extends Error {
        code: number;
        constructor(message: string, code: number) {
          super(message);
          this.code = code;
          this.name = "E";
        }
      }
      const logger = jsonLogger();
      logger.error("boom", new E("boom", 500));
      const raw = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(raw.errorName).toBe("E");
      expect(raw.errorCode).toBe("500");
    });

    it("emits errorName=Error for a plain Error without a code", () => {
      const logger = jsonLogger();
      logger.error("boom", new Error("boom"));
      const raw = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(raw.errorName).toBe("Error");
      expect(raw.errorCode).toBeUndefined();
    });
  });

  describe("behavior preserved on the error itself", () => {
    it("Error.prototype.toString() still prints the name by default", () => {
      expect(new Error("x").toString()).toBe("Error: x");
      expect(new TypeError("x").toString()).toBe("TypeError: x");
    });

    it("errorName is a separate log field, not part of the message field", () => {
      // pattern only exposes {message}; the error name must not leak into it
      const logger = rawLogger("{message}");
      const err = new TypeError("boom");
      const out = (logger as any).createLog(LogLevel.error, "boom", err);
      expect(out).toBe("boom");
      expect(out).not.toContain("TypeError");
    });

    it("requires no new theme slot (Theme stays unchanged for errorName)", () => {
      // errorName has no styling descriptor wired into DefaultTheme
      expect((DefaultTheme as any).errorName).toBeUndefined();
    });
  });
});
