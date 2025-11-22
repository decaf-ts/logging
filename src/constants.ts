import { LoggingConfig, Theme } from "./types";

/**
 * @description The global key that is used to store environment variables in browser contexts.
 * @summary This enables the logging environment helpers to locate serialized environment configuration on `globalThis`.
 * @const {string} BrowserEnvKey
 * @memberOf module:Logging
 */
export const BrowserEnvKey = "ENV";

/**
 * @description The delimiter that is used for composing nested environment variable names.
 * @summary This joins parent and child keys when mapping object paths to ENV strings.
 * @const {string} ENV_PATH_DELIMITER
 * @memberOf module:Logging
 */
export const ENV_PATH_DELIMITER = "__";

/**
 * @description The default prefix and suffix that are used for template placeholders.
 * @summary This provides wrapper strings that are applied when interpolating messages with {@link patchPlaceholders}.
 * @const {string[]} DefaultPlaceholderWrappers
 * @memberOf module:Logging
 */
export const DefaultPlaceholderWrappers = ["${", "}"];

/**
 * @description An enum for log levels.
 * @summary Defines the different levels of logging for the application.
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
 * @description The numeric values that are associated with log levels.
 * @summary This provides a numeric representation of log levels for comparison and filtering.
 * @typedef {object} NumericLogLevelsShape
 * @property {number} benchmark - The numeric value for the benchmark level (0).
 * @property {number} error - The numeric value for the error level (3).
 * @property {number} warn - The numeric value for the warn level (6).
 * @property {number} info - The numeric value for the info level (9).
 * @property {number} verbose - The numeric value for the verbose level (12).
 * @property {number} debug - The numeric value for the debug level (15).
 * @property {number} trace - The numeric value for the trace level (18).
 * @property {number} silly - The numeric value for the silly level (21).
 * @memberOf module:Logging
 */

/**
 * @description The numeric values that are associated with log levels.
 * @summary This provides a numeric representation of log levels for comparison and filtering.
 * @const {NumericLogLevelsShape} NumericLogLevels
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
 * @description An enum for logging output modes.
 * @summary Defines the different output formats for log messages.
 * @enum {string}
 * @readonly
 * @memberOf module:Logging
 */
export enum LoggingMode {
  /** Raw text format for human readability */
  RAW = "raw",
  /** JSON format for machine parsing */
  JSON = "json",
}

/**
 * @description The default theme for styling log output.
 * @summary Defines the default color and style settings for various components of log messages.
 * @const {Theme} DefaultTheme
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
 * @description The default configuration for logging.
 * @summary Defines the default settings for the logging system, including verbosity, log level, styling, and timestamp format.
 * @const {LoggingConfig} DefaultLoggingConfig
 * @memberOf module:Logging
 */
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
};
