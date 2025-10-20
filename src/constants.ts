import { LoggingConfig, Theme } from "./types";

/**
 * @description Global key used to store environment variables in browser contexts.
 * @summary Enables the logging environment helpers to locate serialized environment configuration on `globalThis`.
 * @const BrowserEnvKey
 * @type {string}
 * @memberOf module:Logging
 */
export const BrowserEnvKey = "ENV";

/**
 * @description Delimiter used for composing nested environment variable names.
 * @summary Joins parent and child keys when mapping object paths to ENV strings.
 * @const ENV_PATH_DELIMITER
 * @type {string}
 * @memberOf module:Logging
 */
export const ENV_PATH_DELIMITER = "__";

/**
 * @description Default prefix and suffix used for template placeholders.
 * @summary Provides wrapper strings applied when interpolating messages with {@link patchPlaceholders}.
 * @const DefaultPlaceholderWrappers
 * @type {string[]}
 * @memberOf module:Logging
 */
export const DefaultPlaceholderWrappers = ["${", "}"];

/**
 * @description Enum for log levels.
 * @summary Defines different levels of logging for the application.
 * @enum {string}
 * @readonly
 * @memberOf module:Logging
 */
export enum LogLevel {
  /** @description Benchmark events that capture performance metrics. */
  benchmark = "benchmark",
  /** @description Error events that indicate failures requiring attention. */
  error = "error",
  /** @description Warning events that may indicate issues. */
  warn = "warn",
  /** @description Informational events describing normal operation. */
  info = "info",
  /** @description Verbose diagnostic information for detailed tracing. */
  verbose = "verbose",
  /** @description Debug or trace details aimed at developers. */
  debug = "debug",
  /** @description trace details aimed at developers */
  trace = "trace",
  /** @description Extremely chatty or playful log entries. */
  silly = "silly",
}

/**
 * @description Numeric values associated with log levels.
 * @summary Provides a numeric representation of log levels for comparison and filtering.
 * @typedef {Object} NumericLogLevelsShape
 * @property {number} benchmark - Numeric value for benchmark level (0).
 * @property {number} error - Numeric value for error level (2).
 * @property {number} info - Numeric value for info level (4).
 * @property {number} verbose - Numeric value for verbose level (6).
 * @property {number} debug - Numeric value for debug level (7).
 * @property {number} silly - Numeric value for silly level (9).
 * @memberOf module:Logging
 */
/**
 * @description Numeric values associated with log levels.
 * @summary Provides a numeric representation of log levels for comparison and filtering.
 * @const NumericLogLevels
 * @type {NumericLogLevelsShape}
 * @memberOf module:Logging
 */
export const NumericLogLevels = {
  benchmark: 0,
  error: 3,
  warn: 6,
  info: 9,
  verbose: 12,
  debug: 15,
  trace: 18,
  silly: 21,
};

/**
 * @description Enum for logging output modes.
 * @summary Defines different output formats for log messages.
 * @enum {string}
 * @memberOf module:Logging
 */
export enum LoggingMode {
  /** Raw text format for human readability */
  RAW = "raw",
  /** JSON format for machine parsing */
  JSON = "json",
}

/**
 * @description Default theme for styling log output.
 * @summary Defines the default color and style settings for various components of log messages.
 * @typedef {Theme} DefaultTheme
 * @property {Object} class - Styling for class names.
 * @property {number} class.fg - Foreground color code for class names (34).
 * @property {Object} id - Styling for identifiers.
 * @property {number} id.fg - Foreground color code for identifiers (36).
 * @property {Object} stack - Styling for stack traces (empty object).
 * @property {Object} timestamp - Styling for timestamps (empty object).
 * @property {Object} message - Styling for different types of messages.
 * @property {Object} message.error - Styling for error messages.
 * @property {number} message.error.fg - Foreground color code for error messages (31).
 * @property {Object} method - Styling for method names (empty object).
 * @property {Object} logLevel - Styling for different log levels.
 * @property {Object} logLevel.error - Styling for error level logs.
 * @property {number} logLevel.error.fg - Foreground color code for error level logs (31).
 * @property {string[]} logLevel.error.style - Style attributes for error level logs (["bold"]).
 * @property {Object} logLevel.info - Styling for info level logs (empty object).
 * @property {Object} logLevel.verbose - Styling for verbose level logs (empty object).
 * @property {Object} logLevel.debug - Styling for debug level logs.
 * @property {number} logLevel.debug.fg - Foreground color code for debug level logs (33).
 * @const DefaultTheme
 * @memberOf module:Logging
 */
export const DefaultTheme: Theme = {
  app: {},
  separator: {},
  class: {
    fg: 34,
  },
  id: {
    fg: 36,
  },
  stack: {},
  timestamp: {},
  message: {
    error: {
      fg: 31,
    },
  },
  method: {},
  logLevel: {
    benchmark: {
      fg: 32,
      style: ["bold"],
    },
    error: {
      fg: 31,
      style: ["bold"],
    },
    info: {
      fg: 34,
      style: ["bold"],
    },
    verbose: {
      fg: 34,
      style: ["bold"],
    },
    debug: {
      fg: 33,
      style: ["bold"],
    },
    trace: {
      fg: 33,
      style: ["bold"],
    },
    silly: {
      fg: 33,
      style: ["bold"],
    },
  },
};

/**
 * @description Default configuration for logging.
 * @summary Defines the default settings for the logging system, including verbosity, log level, styling, and timestamp format.
 * @const DefaultLoggingConfig
 * @typedef {LoggingConfig} DefaultLoggingConfig
 * @property {number} verbose - Verbosity level (0).
 * @property {LogLevel} level - Default log level (LogLevel.info).
 * @property {boolean} logLevel - Whether to display log level in output (true).
 * @property {LoggingMode} mode - Output format mode (LoggingMode.RAW).
 * @property {boolean} style - Whether to apply styling to log output (false).
 * @property {string} separator - Separator between log components (" - ").
 * @property {boolean} timestamp - Whether to include timestamps in log messages (true).
 * @property {string} timestampFormat - Format for timestamps ("HH:mm:ss.SSS").
 * @property {boolean} context - Whether to include context information in log messages (true).
 * @property {Theme} theme - The theme to use for styling log messages (DefaultTheme).
 * @memberOf module:Logging
 */
export const DefaultLevels = [
  "benchmark",
  "error",
  "warn",
  "info",
  "verbose",
  "debug",
  "trace",
  "silly",
] as const;

export const DefaultLoggingConfig: LoggingConfig = {
  env: "development",
  verbose: 0,
  level: LogLevel.info,
  logLevel: true,
  style: false,
  contextSeparator: ".",
  separator: "-",
  timestamp: true,
  timestampFormat: "HH:mm:ss.SSS",
  context: true,
  format: LoggingMode.RAW,
  pattern:
    "{level} [{timestamp}] {app} {context} {separator} {message} {stack}",
  theme: DefaultTheme,
  levels: DefaultLevels,
};
