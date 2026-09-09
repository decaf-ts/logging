import {
  DefaultLoggingConfig,
  LogLevel,
  LoggingMode,
  Logging,
  MiniLogger,
  LoggedEnvironment,
} from "../../src";

// Mock the styled-string library (same approach as logging.test.ts)
jest.mock("styled-string-builder", () => {
  const mockStyle = jest.fn().mockImplementation(() => ({
    text: "styled-text",
    background: jest.fn().mockReturnThis(),
    foreground: jest.fn().mockReturnThis(),
    color256: jest.fn().mockReturnThis(),
    bgColor256: jest.fn().mockReturnThis(),
    rgb: jest.fn().mockReturnThis(),
    bgRgb: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    bold: jest.fn().mockReturnThis(),
    italic: jest.fn().mockReturnThis(),
    underline: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
  }));

  return {
    style: mockStyle,
    StyledString: jest.fn(),
    ColorizeOptions: {},
  };
});

const baseConfig = {
  ...DefaultLoggingConfig,
  style: false,
  timestamp: false,
};

describe("MiniLogger.action", () => {
  let logger: MiniLogger;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    Logging.setConfig({ ...DefaultLoggingConfig });
    (LoggedEnvironment as any).app = undefined;
    logger = new MiniLogger("TestContext");
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("renders `<action> - <code>` in the level slot", () => {
    Logging.setConfig({ ...baseConfig });
    logger.action("user_login", 3001);
    const raw = consoleLogSpy.mock.calls[0][0] as string;
    expect(raw).toMatch(/^user_login - 3001/);
  });

  it("renders just the action when no code is given", () => {
    Logging.setConfig({ ...baseConfig });
    logger.action("user_logout");
    const raw = consoleLogSpy.mock.calls[0][0] as string;
    expect(raw).toMatch(/^user_logout(\s|\[|$)/);
    expect(raw).not.toContain("user_logout - ");
  });

  it("accepts meta without a code via the codeless overload", () => {
    Logging.setConfig({ ...baseConfig });
    logger.action("user_logout", { userId: "u1" });
    const raw = consoleLogSpy.mock.calls[0][0] as string;
    expect(raw).toMatch(/^user_logout(\s|\[|$)/);
    expect(raw).not.toContain("user_logout - ");
    expect(raw).toContain('"userId":"u1"');
  });

  it("carries no message", () => {
    Logging.setConfig({ ...baseConfig });
    logger.action("user_login", 3001, { userId: "u1" });
    const raw = consoleLogSpy.mock.calls[0][0] as string;
    expect(raw).toBe(`user_login - 3001 TestContext - {"userId":"u1"}`);
  });

  it("surfaces the action even when the configured level is error", () => {
    Logging.setConfig({ ...baseConfig, level: LogLevel.error });
    logger.action("user_login", 3001);
    const raw = consoleLogSpy.mock.calls[0][0] as string;
    expect(raw).toMatch(/^user_login - 3001/);
  });

  it("styles the level slot with the action theme, carrying no log level", () => {
    Logging.setConfig({ ...baseConfig, style: true });
    const themeSpy = jest
      .spyOn(Logging, "theme")
      .mockImplementation((text) => text);
    logger.action("user_login", 3001);
    expect(themeSpy).toHaveBeenCalledWith(
      expect.stringContaining("user_login - 3001"),
      "action",
      undefined
    );
    expect(themeSpy).not.toHaveBeenCalledWith(
      expect.anything(),
      "logLevel",
      expect.anything()
    );
  });

  it("always renders meta, even when the `meta` display setting is off", () => {
    Logging.setConfig({ ...baseConfig, meta: false });
    logger.action("user_login", 3001, { userId: "u1" });
    const raw = consoleLogSpy.mock.calls[0][0] as string;
    expect(raw).toContain('"userId":"u1"');
  });

  it("still respects the `meta` display setting for ordinary logs", () => {
    Logging.setConfig({ ...baseConfig, meta: false });
    logger.info("msg", { userId: "u1" });
    const raw = consoleLogSpy.mock.calls[0][0] as string;
    expect(raw).not.toContain("userId");
  });

  describe("JSON mode", () => {
    beforeEach(() => {
      Logging.setConfig({
        ...baseConfig,
        format: LoggingMode.JSON,
      });
    });

    it("surfaces action, actionCode and level containing '<action> - <code>', with no message field", () => {
      logger.action("user_login", 3001);
      const raw = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(raw.action).toBe("user_login");
      expect(raw.actionCode).toBe("3001");
      expect(raw.level).toBe("user_login - 3001");
      expect(raw.message).toBeUndefined();
    });

    it("omits actionCode when no code is given", () => {
      logger.action("user_logout");
      const raw = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(raw.action).toBe("user_logout");
      expect(raw.actionCode).toBeUndefined();
      expect(raw.level).toBe("user_logout");
    });

    it("surfaces meta even when the `meta` display setting is off", () => {
      Logging.setConfig({ meta: false });
      logger.action("user_login", 3001, { userId: "u1" });
      const raw = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(raw.meta).toEqual({ userId: "u1" });
    });

    it("emits errorCode for an Error carrying a numeric code", () => {
      class E extends Error {
        code: number;
        constructor(message: string, code: number) {
          super(message);
          this.code = code;
        }
      }
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation();
      logger.error("boom", new E("boom", 500));
      const raw = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(raw.errorCode).toBe("500");
    });

    it("omits errorCode for an Error without a code", () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation();
      logger.error("boom", new Error("boom"));
      const raw = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      expect(raw.errorCode).toBeUndefined();
    });

    it("emits errorCode for critical/fatal Errors with a numeric code", () => {
      class E extends Error {
        code: number;
        constructor(message: string, code: number) {
          super(message);
          this.code = code;
        }
      }
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation();
      logger.critical("boom", new E("boom", 400));
      logger.fatal("boom", new E("boom", 500));
      const critical = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string);
      const fatal = JSON.parse(consoleErrorSpy.mock.calls[1][0] as string);
      expect(critical.errorCode).toBe("400");
      expect(fatal.errorCode).toBe("500");
    });
  });
});

describe("Logging.action", () => {
  it("delegates to the global logger", () => {
    const actionMock = jest.fn();
    jest.spyOn(Logging, "get").mockReturnValue({
      action: actionMock,
    } as any);
    Logging.action("user_login", 500, { foo: 1 });
    expect(actionMock).toHaveBeenCalledWith("user_login", 500, { foo: 1 });
  });
});
