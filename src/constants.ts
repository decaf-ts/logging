import { LoggingConfig, Theme } from "./types";

/**
 * @description Enum for log levels.
 * @summary Defines different levels of logging for the application.
 * @enum {string}
 * @readonly
 * @memberOf module:Logging
 */
export enum LogLevel {
  /** Error events that are likely to cause problems. */
  error = "error",
  /** Routine information, such as ongoing status or performance. */
  info = "info",
  /** Additional relevant information. */
  verbose = "verbose",
  /** Debug or trace information. */
  debug = "debug",
  /** way too verbose or silly information. */
  silly = "silly",
}

/**
 * @description Numeric values associated with log levels.
 * @summary Provides a numeric representation of log levels for comparison and filtering.
 * @const NumericLogLevels
 * @property {number} error - Numeric value for error level (2).
 * @property {number} info - Numeric value for info level (4).
 * @property {number} verbose - Numeric value for verbose level (6).
 * @property {number} debug - Numeric value for debug level (7).
 * @property {number} silly - Numeric value for silly level (9).
 * @memberOf module:Logging
 */
export const NumericLogLevels = {
  error: 2,
  info: 4,
  verbose: 6,
  debug: 7,
  silly: 9,
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
 * @const DefaultTheme
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
 * @memberOf module:Logging
 */
export const DefaultTheme: Theme = {
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
    error: {
      fg: 31,
      style: ["bold"],
    },
    info: {},
    verbose: {},
    debug: {
      fg: 33,
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
export const DefaultLoggingConfig: LoggingConfig = {
  verbose: 0,
  level: LogLevel.info,
  logLevel: true,
  mode: LoggingMode.RAW,
  style: false,
  contextSeparator: ".",
  separator: " - ",
  timestamp: true,
  timestampFormat: "HH:mm:ss.SSS",
  context: true,
  theme: DefaultTheme,
};
