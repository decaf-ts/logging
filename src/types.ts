import { styles } from "styled-string-builder";
import { LoggingMode, LogLevel } from "./constants";

export type StringLike = string | { toString: () => string };

export type LoggingContext =
  | string
  | { new (...args: any[]): any }
  | ((...args: any[]) => any);

/**
 * @description Interface for a logger with verbosity levels.
 * @summary Defines methods for logging at different verbosity levels.
 * @interface Logger
 * @memberOf @decaf-ts/utils
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

  for(
    method?: string | ((...args: any[]) => any),
    config?: Partial<LoggingConfig>
  ): Logger;

  setConfig(config: Partial<LoggingConfig>): void;
}

/**
 * @description Configuration for logging.
 * @summary Defines the log level and verbosity for logging.
 * @typedef {Object} LoggingConfig
 * @property {LogLevel} level - The logging level.
 * @property {number} verbose - The verbosity level.
 * @memberOf @decaf-ts/utils
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

export type LoggerFactory<L extends Logger = Logger> = (
  object: string,
  config?: Partial<LoggingConfig>,
  ...args: any[]
) => L;

/**
 /**
 * @description Represents a theme option for console output styling.
 * @summary Defines the structure for styling a specific element in the console output.
 * It allows for customization of foreground color, background color, and additional styles.
 * Colors can be specified as a single number, an RGB array, or left undefined for default.
 *
 * @interface ThemeOption
 * @memberOf @decaf-ts/utils
 */
export interface ThemeOption {
  fg?: number | [number] | [number, number, number];

  bg?: number | [number] | [number, number, number];

  style?: number[] | [keyof typeof styles];
}

export type ThemeOptionByLogLevel = Partial<Record<LogLevel, ThemeOption>>;

/**
 /**
 * @description Defines the color theme for console output.
 * @summary This interface specifies the color scheme for various elements of console output,
 * including styling for different log levels and components. It uses ThemeOption to
 * define the styling for each element, allowing for customization of colors and styles
 * for different parts of the log output.
 *
 * @interface Theme
 * @memberOf @decaf-ts/utils
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
