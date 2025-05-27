import { styles } from "styled-string-builder";
import { LoggingMode, LogLevel } from "./constants";

/**
 * @description A type representing string-like values
 * @summary Represents either a string or an object with a toString method that returns a string
 * @typedef {(string|Object)} StringLike
 * @memberOf module:Logging
 */
export type StringLike = string | { toString: () => string };

export type AnyFunction = (...args: any[]) => any;

/**
 * @description A type representing logging context
 * @summary Represents a context for logging, which can be a string, a class constructor, or a function
 * @typedef {(string|Function|Object)} LoggingContext
 * @memberOf module:Logging
 */
export type LoggingContext =
  | string
  | { new (...args: any[]): any }
  | AnyFunction;

/**
 * @description Interface for a logger with verbosity levels.
 * @summary Defines methods for logging at different verbosity levels.
 * @interface Logger
 * @memberOf module:Logging
 */
export interface Logger {
  /**
   * @description Logs a `way too verbose` or a silly message.
   * @param {StringLike} msg - The message to log.
   */
  silly(msg: StringLike): void;
  /**
   * @description Logs a verbose message.
   * @param {StringLike} msg - The message to log.
   * @param {number} verbosity - The verbosity level of the message.
   */
  verbose(msg: StringLike, verbosity?: number): void;

  /**
   * @description Logs an info message.
   * @param {StringLike} msg - The message to log.
   */
  info(msg: StringLike): void;

  /**
   * @description Logs an error message.
   * @param {StringLike | Error} msg - The message to log.
   */
  error(msg: StringLike | Error): void;

  /**
   * @description Logs a debug message.
   * @param {string} msg - The message to log.
   */
  debug(msg: StringLike): void;

  /**
   * @description Creates a new logger for a specific method or context
   * @summary Returns a new logger instance that includes the specified method or context in its logs
   * @param {string|Function} [method] - The method name or function to create a logger for
   * @param {Partial<LoggingConfig>} [config] - Optional configuration for the new logger
   * @return {Logger} A new logger instance
   */
  for(
    method?: string | ((...args: any[]) => any),
    config?: Partial<LoggingConfig>
  ): Logger;

  /**
   * @description Updates the logger configuration
   * @summary Sets or updates the configuration options for this logger instance
   * @param {Partial<LoggingConfig>} config - The configuration options to apply
   */
  setConfig(config: Partial<LoggingConfig>): void;
}

/**
 * @description Configuration for logging.
 * @summary Defines the log level and verbosity for logging.
 * @typedef {Object} LoggingConfig
 * @property {LogLevel} level - The logging level.
 * @property {boolean} [logLevel] - Whether to display log level in output.
 * @property {number} verbose - The verbosity level.
 * @property {LoggingMode} [mode] - Output format mode.
 * @property {string} separator - Separator between log components.
 * @property {boolean} [style] - Whether to apply styling to log output.
 * @property {boolean} [timestamp] - Whether to include timestamps in log messages.
 * @property {string} [timestampFormat] - Format for timestamps.
 * @property {boolean} [context] - Whether to include context information in log messages.
 * @property {Theme} [theme] - The theme to use for styling log messages.
 * @property {string|number} [correlationId] - Correlation ID for tracking related log messages.
 * @memberOf module:Logging
 */
export type LoggingConfig = {
  level: LogLevel;
  logLevel?: boolean;
  verbose: number;
  mode?: LoggingMode;
  separator: string;
  style?: boolean;
  timestamp?: boolean;
  timestampFormat?: string;
  context?: boolean;
  theme?: Theme;
  correlationId?: string | number;
};

/**
 * @description A factory function type for creating loggers
 * @summary Defines a function type that creates and returns a logger instance for a given object
 * @template L - The logger type, extending the base Logger interface
 * @typedef {Function} LoggerFactory
 * @param {string} object - The object or context name for the logger
 * @param {Partial<LoggingConfig>} [config] - Optional configuration for the logger
 * @return {L} A logger instance
 * @memberOf module:Logging
 */
export type LoggerFactory<L extends Logger = Logger> = (
  object: string,
  config?: Partial<LoggingConfig>,
  ...args: any[]
) => L;

/**
 * @description Represents a theme option for console output styling.
 * @summary Defines the structure for styling a specific element in the console output.
 * It allows for customization of foreground color, background color, and additional styles.
 * Colors can be specified as a single number, an RGB array, or left undefined for default.
 * @interface ThemeOption
 * @memberOf module:Logging
 */
export interface ThemeOption {
  fg?: number | [number] | [number, number, number];

  bg?: number | [number] | [number, number, number];

  style?: number[] | [keyof typeof styles];
}

/**
 * @description A type for theme options organized by log level
 * @summary Defines a partial record mapping log levels to theme options, allowing different styling for different log levels
 * @typedef {Object} ThemeOptionByLogLevel
 * @memberOf module:Logging
 */
export type ThemeOptionByLogLevel = Partial<Record<LogLevel, ThemeOption>>;

/**
 * @description Defines the color theme for console output.
 * @summary This interface specifies the color scheme for various elements of console output,
 * including styling for different log levels and components. It uses ThemeOption to
 * define the styling for each element, allowing for customization of colors and styles
 * for different parts of the log output.
 * @interface Theme
 * @memberOf module:Logging
 */
export interface Theme {
  /**
   * @description Styling for class names in the output.
   */
  class: ThemeOption | ThemeOptionByLogLevel;

  /**
   * @description Styling for timestamps in the output.
   */
  timestamp: ThemeOption | ThemeOptionByLogLevel;

  /**
   * @description Styling for the main message text in the output.
   */
  message: ThemeOption | ThemeOptionByLogLevel;

  /**
   * @description Styling for method names in the output.
   */
  method: ThemeOption | ThemeOptionByLogLevel;

  /**
   * @description Styling for identifier elements in the output.
   */
  id: ThemeOption | ThemeOptionByLogLevel;

  /**
   * @description Styling for identifier elements in the output.
   */
  stack: ThemeOption;

  /**
   * @description Styling for different log levels in the output.
   */
  logLevel: ThemeOptionByLogLevel;
}
