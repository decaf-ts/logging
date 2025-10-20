import * as styledString from "styled-string-builder";
import {
  DefaultLoggingConfig,
  MiniLogger,
  Logging,
  LoggingConfig,
  LogLevel,
  Theme,
} from "../../src";

// Mock the styled-string library
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

describe("MiniLogger", () => {
  let logger: MiniLogger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset Logging configuration
    Logging.setConfig({ ...DefaultLoggingConfig });

    // Create a new logger instance
    logger = new MiniLogger("TestContext");

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a new MiniLogger instance with default config", () => {
      expect(logger).toBeInstanceOf(MiniLogger);
    });

    it("should create a new MiniLogger instance with custom config", () => {
      const customConfig: Partial<LoggingConfig> = {
        level: LogLevel.debug,
        verbose: 2,
      };
      const customLogger = new MiniLogger("CustomContext", customConfig);
      expect(customLogger).toBeInstanceOf(MiniLogger);
    });

    it("should create a new MiniLogger instance with an ID", () => {
      const idLogger = new MiniLogger("IdContext", {
        correlationId: "test-id",
      });
      expect(idLogger).toBeInstanceOf(MiniLogger);
    });
  });

  describe("config", () => {
    it("should return the logger's config value if set", () => {
      const customConfig: Partial<LoggingConfig> = {
        level: LogLevel.debug,
        verbose: 2,
      };
      const customLogger = new MiniLogger("CustomContext", customConfig);

      // Access the protected config method using type assertion
      const level = (customLogger as any).config("level");
      expect(level).toBe(LogLevel.debug);
    });

    it("should return the global config value if not set in logger", () => {
      Logging.setConfig({ level: LogLevel.error });

      // Access the protected config method using type assertion
      const level = (logger as any).config("level");
      expect(level).toBe(LogLevel.error);
    });
  });

  describe("for", () => {
    it("should create a new logger for a method", () => {
      const methodLogger = logger.for("testMethod");
      expect(methodLogger).toBeInstanceOf(MiniLogger);
    });

    it("should create a new logger for a function", () => {
      function testFunction() {
        return true;
      }
      const functionLogger = logger.for(testFunction);
      expect(functionLogger).toBeInstanceOf(MiniLogger);
    });

    it("should create a new logger with custom config", () => {
      const customConfig: Partial<LoggingConfig> = {
        level: LogLevel.debug,
        verbose: 2,
      };
      const configLogger = logger.for("testMethod", customConfig);
      expect(configLogger).toBeInstanceOf(MiniLogger);
    });

    it("falls back to parent config when child override omits a key", () => {
      Logging.setConfig({ verbose: 3 });

      const childLogger = logger.for("child", { level: LogLevel.debug });

      expect((childLogger as any).config("verbose")).toBe(3);
    });

    it("exposes config proxy metadata for non-overridden properties", () => {
      const childLogger = logger.for("meta", { level: LogLevel.debug });

      const childConfig = (childLogger as any).config;
      const parentConfig = (logger as any).config;

      expect(childConfig.name).toBe(parentConfig.name);
    });
  });

  describe("createLog", () => {
    it("should create a formatted log string without timestamp", () => {
      Logging.setConfig({ timestamp: false });

      // Access the protected createLog method using type assertion
      const logString = (logger as any).createLog(
        LogLevel.info,
        "Test message"
      );
      expect(logString).toContain("INFO");
      expect(logString).toContain("Test message");
    });

    it("should create a formatted log string with timestamp", () => {
      Logging.setConfig({ timestamp: true });

      // Access the protected createLog method using type assertion
      const logString = (logger as any).createLog(
        LogLevel.info,
        "Test message"
      );
      expect(logString).toContain("INFO");
      expect(logString).toContain("Test message");
    });

    it("should handle Error objects", () => {
      const error = new Error("Test error");

      // Access the protected createLog method using type assertion
      const logString = (logger as any).createLog(LogLevel.error, error);
      expect(logString).toContain("ERROR");
      expect(logString).toContain("Test error");
    });

    it("should include stack trace if provided", () => {
      const stack = "Error stack trace";

      // Access the protected createLog method using type assertion
      const logString = (logger as any).createLog(
        LogLevel.error,
        "Test error",
        new Error(stack)
      );
      expect(logString).toContain("Stack trace");
      expect(logString).toContain(stack);
    });

    it("includes the configured app identifier when present", () => {
      Logging.setConfig({ app: "SvcApp" });

      const logString = (logger as any).createLog(
        LogLevel.info,
        "message with app"
      );

      expect(logString).toContain("SvcApp");

      Logging.setConfig({ app: undefined as any });
    });
  });

  describe("log", () => {
    it("should not log if level is below configured level", () => {
      Logging.setConfig({ level: LogLevel.error });

      // Access the protected log method using type assertion
      (logger as any).log(LogLevel.info, "Test message");
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should log info messages with console.log", () => {
      Logging.setConfig({ level: LogLevel.verbose });
      // Access the protected log method using type assertion
      (logger as any).log(LogLevel.info, "Test info message");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test info message")
      );
    });

    it("should log verbose messages with console.log", () => {
      Logging.setConfig({ level: LogLevel.verbose });
      // Access the protected log method using type assertion
      (logger as any).log(LogLevel.verbose, "Test verbose message");
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test verbose message")
      );
    });

    it("should log debug messages with console.debug", () => {
      // Access the protected log method using type assertion
      Logging.setConfig({ level: LogLevel.debug });
      (logger as any).log(LogLevel.debug, "Test debug message");
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test debug message")
      );
    });

    it("should log error messages with console.error", () => {
      // Access the protected log method using type assertion
      (logger as any).log(LogLevel.error, "Test error message");
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test error message")
      );
    });

    it("does not throw for unknown log level and uses console.debug fallback", () => {
      // Access the protected log method using type assertion
      expect(() => (logger as any).log("unknown" as LogLevel, "Test message")).not.toThrow();
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test message")
      );
    });
  });

  describe("silly", () => {
    it("should log silly messages if verbosity is sufficient", () => {
      Logging.setConfig({ verbose: 1, level: LogLevel.verbose });
      logger.silly("Test silly message", 1);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test silly message")
      );
    });

    it("should not log silly messages if verbosity is insufficient", () => {
      Logging.setConfig({ verbose: 0 });
      logger.silly("Test silly message", 1);
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe("verbose", () => {
    it("should log verbose messages if verbosity is sufficient", () => {
      Logging.setConfig({ verbose: 1, level: LogLevel.verbose });
      logger.verbose("Test verbose message", 1);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test verbose message")
      );
    });

    it("should not log verbose messages if verbosity is insufficient", () => {
      Logging.setConfig({ verbose: 0 });
      logger.verbose("Test verbose message", 1);
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe("info", () => {
    it("should log info messages", () => {
      logger.info("Test info message");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test info message")
      );
    });
  });

  describe("debug", () => {
    it("should log debug messages", () => {
      Logging.setConfig({ level: LogLevel.debug });
      logger.debug("Test debug message");
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test debug message")
      );
    });
  });

  describe("error", () => {
    it("should log error messages", () => {
      logger.error("Test error message");
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test error message")
      );
    });

    it("should handle Error objects", () => {
      const error = new Error("Test error object");
      logger.error(error);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test error object")
      );
    });
  });

  describe("warn", () => {
    it("logs warn messages using console.log and does not throw", () => {
      expect(() => logger.warn("warn message")).not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("warn message")
      );
    });
  });

  describe("benchmark", () => {
    it("attempts to log benchmark messages", () => {
      logger.benchmark("timing");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("timing")
      );
    });
  });

  describe("setConfig", () => {
    it("should update the logger's configuration", () => {
      logger.setConfig({ level: LogLevel.error });

      // Access the protected config method using type assertion
      const level = (logger as any).config("level");
      expect(level).toBe(LogLevel.error);
    });

    it("should merge with existing configuration", () => {
      const initialConfig: Partial<LoggingConfig> = {
        level: LogLevel.info,
        verbose: 1,
      };
      const customLogger = new MiniLogger("CustomContext", initialConfig);
      customLogger.setConfig({ level: LogLevel.error });

      // Access the protected config method using type assertion
      const level = (customLogger as any).config("level");
      const verbose = (customLogger as any).config("verbose");
      expect(level).toBe(LogLevel.error);
      expect(verbose).toBe(1);
    });
  });
});

describe("Logging", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset Logging configuration
    Logging.setConfig({ ...DefaultLoggingConfig });

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("setConfig and getConfig", () => {
    it("should update the global configuration", () => {
      Logging.setConfig({ level: LogLevel.error });
      const config = Logging.getConfig();
      expect(config.level).toBe(LogLevel.error);
    });

    it("should merge with existing configuration", () => {
      Logging.setConfig({ level: LogLevel.info, verbose: 1 });
      Logging.setConfig({ level: LogLevel.error });
      const config = Logging.getConfig();
      expect(config.level).toBe(LogLevel.error);
      expect(config.verbose).toBe(1);
    });
  });

  describe("get", () => {
    it("should return the global logger instance", () => {
      const logger = Logging.get();
      expect(logger).toBeDefined();
    });

    it("should return the same instance on multiple calls", () => {
      const logger1 = Logging.get();
      const logger2 = Logging.get();
      expect(logger1).toBe(logger2);
    });
  });

  describe("for", () => {
    it("should create a new logger for a string context", () => {
      const logger = Logging.for("TestContext");
      expect(logger).toBeInstanceOf(MiniLogger);
    });

    it("should create a new logger with an ID", () => {
      const logger = Logging.for("TestContext", { correlationId: "test-id" });
      expect(logger).toBeInstanceOf(MiniLogger);
    });

    it("should create a new logger with custom config", () => {
      const config: Partial<LoggingConfig> = { level: LogLevel.debug };
      const logger = Logging.for("TestContext", config);
      expect(logger).toBeInstanceOf(MiniLogger);
    });

    it("should create a new logger with an ID and custom config", () => {
      const config: Partial<LoggingConfig> = { level: LogLevel.debug };
      const logger = Logging.for(
        "TestContext",
        Object.assign({ correlationId: "test-id" }, config)
      );
      expect(logger).toBeInstanceOf(MiniLogger);
    });
  });

  describe("because", () => {
    it("should create a new logger with a reason", () => {
      const logger = Logging.because("Test reason");
      expect(logger).toBeInstanceOf(MiniLogger);
    });

    it("should create a new logger with a reason and ID", () => {
      const logger = Logging.because("Test reason", "test-id");
      expect(logger).toBeInstanceOf(MiniLogger);
    });
  });

  describe("logging methods", () => {
    it("should log verbose messages", () => {
      Logging.setConfig({ verbose: 1, level: LogLevel.verbose });
      Logging.verbose("Test verbose message", 1);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test verbose message")
      );
    });

    it("should log info messages", () => {
      Logging.info("Test info message");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test info message")
      );
    });

    it("should log debug messages", () => {
      Logging.setConfig({ verbose: 1, level: LogLevel.silly });
      Logging.debug("Test debug message");
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test debug message")
      );
    });

    it("should log silly messages", () => {
      Logging.setConfig({ verbose: 1, level: LogLevel.silly });
      Logging.silly("Test silly message");
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test silly message")
      );
    });

    it("delegates warn calls to the global logger", () => {
      const stubLogger = {
        warn: jest.fn(),
      } as any;
      const originalGlobal = (Logging as any).global;
      (Logging as any).global = stubLogger;

      Logging.warn("Test warn message");

      expect(stubLogger.warn).toHaveBeenCalledWith("Test warn message");

      (Logging as any).global = originalGlobal;
    });

    it("should log error messages", () => {
      Logging.error("Test error message");
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test error message")
      );
    });
  });

  it("setFactory swaps the logger implementation", () => {
    const originalFactory = (Logging as any)._factory;
    const originalGlobal = (Logging as any).global;
    const fakeLogger = {
      benchmark: jest.fn(),
      verbose: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      silly: jest.fn(),
      error: jest.fn(),
      setConfig: jest.fn(),
      for: jest.fn(() => fakeLogger),
    };

    Logging.setFactory(() => fakeLogger as any);
    (Logging as any).global = undefined;

    const logger = Logging.get();
    expect(logger).toBe(fakeLogger);

    (Logging as any)._factory = originalFactory;
    (Logging as any).global = originalGlobal;
  });

  it("benchmark delegates to the current global logger", () => {
    const originalFactory = (Logging as any)._factory;
    const originalGlobal = (Logging as any).global;
    const fakeLogger = {
      benchmark: jest.fn(() => {
        throw new Error("benchmark not implemented");
      }),
      verbose: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      silly: jest.fn(),
      error: jest.fn(),
      setConfig: jest.fn(),
      for: jest.fn(() => fakeLogger),
    };

    Logging.setFactory(() => fakeLogger as any);
    (Logging as any).global = undefined;

    expect(() => Logging.benchmark("payload"))
      .toThrow("benchmark not implemented");
    expect(fakeLogger.benchmark).toHaveBeenCalledWith("payload");

    (Logging as any)._factory = originalFactory;
    (Logging as any).global = originalGlobal;
  });

  describe("theme", () => {
    it("should return the original text if timestamp is disabled", () => {
      Logging.setConfig({ timestamp: false });
      const result = Logging.theme("Test text", "message", LogLevel.info);
      expect(result).toBe("Test text");
    });

    it("should apply theme to text", () => {
      Logging.setConfig({ timestamp: true });
      const result = Logging.theme("Test text", "message", LogLevel.info);
      expect(result).toBe("Test text");
    });

    it("should handle missing theme", () => {
      Logging.setConfig({ timestamp: true });
      const customTheme: Theme = {} as Theme;
      const result = Logging.theme(
        "Test text",
        "nonexistent" as any,
        LogLevel.info,
        customTheme
      );
      expect(result).toBe("Test text");
    });

    it("should handle empty theme", () => {
      Logging.setConfig({ timestamp: true });
      const customTheme: Theme = { message: {} } as Theme;
      const result = Logging.theme(
        "Test text",
        "message",
        LogLevel.info,
        customTheme
      );
      expect(result).toBe("Test text");
    });

    it("should handle log level specific theme", () => {
      Logging.setConfig({ timestamp: true });
      const customTheme: Theme = {
        message: {
          [LogLevel.info]: {
            fg: 2,
          },
        },
      } as Theme;
      const result = Logging.theme(
        "Test text",
        "message",
        LogLevel.info,
        customTheme
      );
      expect(result).toBe("Test text");
    });

    it("should handle background color", () => {
      Logging.setConfig({ timestamp: true });
      const customTheme: Theme = {
        message: {
          bg: 2,
        },
      } as Theme;
      const result = Logging.theme(
        "Test text",
        "message",
        LogLevel.info,
        customTheme
      );
      expect(result).toBe("Test text");
    });

    it("should handle foreground color", () => {
      Logging.setConfig({ timestamp: true });
      const customTheme: Theme = {
        message: {
          fg: 2,
        },
      } as Theme;
      const result = Logging.theme(
        "Test text",
        "message",
        LogLevel.info,
        customTheme
      );
      expect(result).toBe("Test text");
    });

    it("should handle style", () => {
      Logging.setConfig({ timestamp: true });
      const customTheme: Theme = {
        message: {
          style: "bold",
        },
      } as unknown as Theme;
      const result = Logging.theme(
        "Test text",
        "message",
        LogLevel.info,
        customTheme
      );
      expect(result).toBe("Test text");
    });

    it("should handle array of styles", () => {
      Logging.setConfig({ timestamp: true });
      const customTheme: Theme = {
        message: {
          style: ["bold", "italic"],
        },
      } as unknown as Theme;
      const result = Logging.theme(
        "Test text",
        "message",
        LogLevel.info,
        customTheme
      );
      expect(result).toBe("Test text");
    });

    it("should handle invalid theme option", () => {
      Logging.setConfig({ timestamp: true });
      const customTheme: Theme = {
        message: {
          invalid: 2 as any,
        },
      } as unknown as Theme;
      const result = Logging.theme(
        "Test text",
        "message",
        LogLevel.info,
        customTheme
      );
      expect(result).toBe("Test text");
    });

    it("should handle errors in styling", () => {
      Logging.setConfig({ timestamp: true });

      // Mock style to throw an error
      (styledString.style as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Styling error");
      });

      const result = Logging.theme("Test text", "message", LogLevel.info);
      expect(result).toBe("Test text");
    });

    it("skips falsy theme values without altering text", () => {
      Logging.setConfig({ timestamp: true, style: true });
      const customTheme: Theme = {
        message: {
          fg: undefined,
        },
      } as unknown as Theme;
      const result = Logging.theme(
        "Plain",
        "message",
        LogLevel.info,
        customTheme
      );
      expect(result).toBe("Plain");
    });
  });
});
