import * as styledString from "styled-string-builder";
import {
  DefaultLoggingConfig,
  MiniLogger,
  Logging,
  LoggingConfig,
  LogLevel,
  Theme,
  LoggedEnvironment,
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

const rootFactory = (context?: string, conf?: Partial<LoggingConfig>) => {
  const base =
    typeof LoggedEnvironment.app === "string" &&
    LoggedEnvironment.app?.length
      ? [LoggedEnvironment.app as string]
      : [];
  return new MiniLogger(context, conf, base);
};

describe("MiniLogger", () => {
  let logger: MiniLogger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    Logging.setFactory(rootFactory);
    (LoggedEnvironment as any).app = undefined;
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

    it("stores the initial context as the immutable root", () => {
      expect(logger.root).toEqual(["TestContext"]);
      const rootCopy = logger.root as string[];
      (rootCopy as string[]).push("mutated");
      expect(logger.root).toEqual(["TestContext"]);
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
    it("extends context with string method names", () => {
      const methodLogger = logger.for("testMethod");
      expect(methodLogger).toBeInstanceOf(MiniLogger);
      expect((methodLogger as any).context).toEqual([
        "TestContext",
        "testMethod",
      ]);
    });

    it("extends context with function names", () => {
      function testFunction() {
        return true;
      }
      const functionLogger = logger.for(testFunction);
      expect(functionLogger).toBeInstanceOf(MiniLogger);
      expect((functionLogger as any).context).toEqual([
        "TestContext",
        "testFunction",
      ]);
    });

    it("extends context with class references", () => {
      class TestClass {}
      const classLogger = logger.for(TestClass);
      expect(classLogger).toBeInstanceOf(MiniLogger);
      expect((classLogger as any).context).toEqual([
        "TestContext",
        "TestClass",
      ]);
    });

    it("extends context with class instances", () => {
      class TestClass {}
      const instanceLogger = logger.for(new TestClass());
      expect(instanceLogger).toBeInstanceOf(MiniLogger);
      expect((instanceLogger as any).context).toEqual([
        "TestContext",
        "TestClass",
      ]);
    });

    it("should create a new logger with custom config", () => {
      const customConfig: Partial<LoggingConfig> = {
        level: LogLevel.debug,
        verbose: 2,
      };
      const configLogger = logger.for("testMethod", customConfig);
      expect(configLogger).toBeInstanceOf(MiniLogger);
      expect((configLogger as any).context).toEqual([
        "TestContext",
        "testMethod",
      ]);
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

    it("treats leading config objects as configuration overrides", () => {
      const overrides: Partial<LoggingConfig> = {
        level: LogLevel.debug,
        verbose: 1,
      };

      const childLogger = logger.for(overrides);

      expect(childLogger).toBeInstanceOf(MiniLogger);
      expect((childLogger as any).context).toEqual(["TestContext"]);
      expect((childLogger as any).config("level")).toBe(LogLevel.debug);
    });
  });

  describe("clear", () => {
    it("resets proxy context and config overrides", () => {
      const child = logger.for("method", { level: LogLevel.debug });
      expect((child as any).context).toEqual(["TestContext", "method"]);
      expect((child as any).config("level")).toBe(LogLevel.debug);

      const cleared = child.clear();

      expect(cleared).toBe(child);
      expect((cleared as any).context).toEqual(["TestContext"]);
      expect((cleared as any).config("level")).toBe(
        (logger as any).config("level")
      );
    });

    it("preserves subclass instances when chaining", () => {
      class CustomLogger extends MiniLogger {
        custom(): string {
          return "ok";
        }
      }

      const custom = new CustomLogger("Custom");
      const scoped = custom.for("Child");

      expect(scoped).toBeInstanceOf(CustomLogger);
      expect(scoped.custom()).toBe("ok");
      expect((scoped as any).context).toEqual(["Custom", "Child"]);

      const cleared = scoped.clear();
      expect(cleared).toBe(scoped);
      expect((cleared as any).context).toEqual(["Custom"]);

      const next = cleared.for("Next");
      expect(next).toBeInstanceOf(CustomLogger);
      expect((next as any).context).toEqual(["Custom", "Next"]);
    });

    it("keeps clear available across arbitrary for chains", () => {
      const segments = ["One", "Two", "Three", "Four"];
      let scoped: MiniLogger = logger;

      segments.forEach((segment) => {
        scoped = scoped.for(segment);
        expect(typeof (scoped as any).clear).toBe("function");
      });

      const cleared = scoped.clear();
      expect((cleared as any).context).toEqual(["TestContext"]);
      expect(typeof (cleared as any).clear).toBe("function");

      const next = cleared.for("Final");
      expect(next).toBeInstanceOf(MiniLogger);
      expect((next as any).context).toEqual(["TestContext", "Final"]);
    });
  });

  describe("app context prefix", () => {
    it("keeps the configured app as the leading context entry", () => {
      (LoggedEnvironment as any).app = "SeedApp";
      Logging.setFactory(rootFactory);
      const logger = Logging.for("Root") as MiniLogger;
      expect((logger as any).context).toEqual(["SeedApp", "Root"]);

      const child = logger.for("Child");
      expect((child as any).context).toEqual(["SeedApp", "Root", "Child"]);

      child.clear();
      expect((child as any).context).toEqual(["SeedApp"]);

      logger.clear();
      expect((logger as any).context).toEqual(["SeedApp"]);
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
      const prev = LoggedEnvironment.app;
      (LoggedEnvironment as any).app = "SvcApp";

      const logString = (logger as any).createLog(
        LogLevel.info,
        "message with app"
      );

      expect(logString).toContain("SvcApp");

      (LoggedEnvironment as any).app = prev;
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

    it("should log verbose messages with console.debug", () => {
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

    it("should throw an error for invalid log level", () => {
      expect(() => {
        // Access the protected log method using type assertion
        (logger as any).log("invalid" as LogLevel, "Test message");
      }).toThrow("Invalid log level");
    });
  });

  describe("silly", () => {
    it("should log silly messages if verbosity is sufficient", () => {
      Logging.setConfig({ verbose: 1, level: LogLevel.silly });
      logger.silly("Test silly message", 1);
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test silly message")
      );
      const loggedArg = consoleDebugSpy.mock.calls[0][0] as string;
      expect(loggedArg).toContain("SILLY");
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
    it("does not throws because warn is now supported", () => {
      expect(() => logger.warn("warn message")).not.toThrow(
        "Invalid log level"
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

  describe("single logger reuse", () => {
    afterEach(() => {
      Logging.setFactory(rootFactory);
    });

    it("reuses the root logger for multiple for/because calls", () => {
      const factory = jest.fn(rootFactory);
      Logging.setFactory(factory);

      Logging.for("Alpha");
      Logging.for("Beta");
      Logging.because("Gamma", "123");

      expect(factory).toHaveBeenCalledTimes(1);
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
      const loggedArg = consoleDebugSpy.mock.calls[0][0] as string;
      expect(loggedArg).toContain("SILLY");
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

    expect(() => Logging.benchmark("payload")).toThrow(
      "benchmark not implemented"
    );
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
