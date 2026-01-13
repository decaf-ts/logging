import { styles } from "styled-string-builder";
import { LoggingMode, LogLevel } from "./constants";

/**
 * @description A string-compatible value that can be accepted by the logging APIs.
 * @summary Represents either a literal string or an object that has a `toString()` method. This allows for the lazy stringification of complex payloads.
 * @typedef {(string|Object)} StringLike
 * @memberOf module:Logging
 */
export type StringLike = string | { toString: () => string };

export type LogMeta = Record<string, unknown>;

/**
 * @description A generic function signature for loosely typed callbacks.
 * @summary This type covers variadic functions where the arguments and return types are not constrained, which enables the logging layer to accept any callable.
 * @typedef {function(...any[]): any} AnyFunction
 * @memberOf module:Logging
 */
export type AnyFunction = (...args: any[]) => any;

/**
 * @description A constructable class type.
 * @summary Describes a constructor that produces instances of type `T`. This allows APIs to accept class references for context-aware logging.
 * @template T
 * @typedef Class
 * @memberOf module:Logging
 */
export type Class<T> = {
  new (...args: any[]): T;
};

/**
 * @description A context descriptor that is accepted when requesting a logger instance.
 * @summary Allows the logging system to resolve context names from strings, constructors, or functions.
 * @typedef {(string|Class<any>|AnyFunction)} LoggingContext
 * @memberOf module:Logging
 */
export type LoggingContext = string | Class<any> | AnyFunction;

/**
 * @description An interface for factories that create contextual clones of the receiver.
 * @summary Declares a `for` method that returns another instance of `THIS` using the provided arguments. This enables chained logger customization.
 * @template THIS
 * @template ARGS
 * @interface Impersonatable
 * @memberOf module:Logging
 */
export interface Impersonatable<THIS, ARGS extends any[] = any[]> {
  /**
   * @description Produce a copy of the current instance with altered context.
   * @summary Called by logging utilities to derive child objects with supplemental configuration and context metadata.
   * @param {ARGS} args - Arguments forwarded to the impersonation strategy.
   * @return {THIS} Derived instance using the provided arguments.
   */
  for(...args: ARGS): THIS;
}

/**
 * @description An interface for loggers that support multiple verbosity levels.
 * @summary This interface declares severity-specific log methods, configuration overrides, and factory helpers that are used throughout the logging toolkit.
 * @interface Logger
 * @memberOf module:Logging
 */
export interface Logger
  extends Impersonatable<
    Logger,
    [
      (
        | string
        | { new (...args: any[]): any }
        | AnyFunction
        | Partial<LoggingConfig>
      ),
      Partial<LoggingConfig>,
      ...any[],
    ]
  > {
  /**
   * @description Logs a benchmark message.
   * @summary Emits high-frequency performance metrics at the `benchmark` log level.
   * @param {StringLike} msg - Message or payload to emit.
   * @return {void}
   */
  benchmark(msg: StringLike, meta?: LogMeta): void;

  /**
   * @description Logs a `way too verbose` or a silly message.
   * @summary Emits playful or extremely verbose details at the `silly` log level.
   * @param {StringLike} msg - Message or payload to emit.
   * @return {void}
   */
  silly(msg: StringLike, meta?: LogMeta): void;

  /**
   * @description Logs developer trace messages.
   * @summary Emits playful or extremely verbose details at the `silly` log level.
   * @param {StringLike} msg - Message or payload to emit.
   * @return {void}
   */
  trace(msg: StringLike, meta?: LogMeta): void;
  /**
   * @description Logs a verbose message.
   * @summary Writes diagnostic output governed by the configured verbosity threshold.
   * @param {StringLike} msg - Message or payload to emit.
   * @param {number} [verbosity] - Verbosity level required for the message to pass through.
   * @return {void}
   */
  verbose(
    msg: StringLike,
    verbosityOrMeta?: number | LogMeta,
    meta?: LogMeta
  ): void;

  /**
   * @description Logs an info message.
   * @summary Emits general informational events that describe application progress.
   * @param {StringLike} msg - Message or payload to emit.
   * @return {void}
   */
  info(msg: StringLike, meta?: LogMeta): void;

  /**
   * @description Logs an error message.
   * @summary Records errors and exceptions, including optional stack traces.
   * @param {StringLike|Error} msg - Message or {@link Error} instance to log.
   * @param {Error} [e] - Optional secondary error or cause.
   * @return {void}
   */
  error(
    msg: StringLike | Error,
    error?: Error | LogMeta,
    meta?: LogMeta
  ): void;

  /**
   * @description Logs a debug message.
   * @summary Emits fine-grained diagnostic details useful during development and troubleshooting.
   * @param {StringLike} msg - Message or payload to emit.
   * @return {void}
   */
  debug(msg: StringLike, meta?: LogMeta): void;

  /**
   * @description Logs a debug message.
   * @summary Emits fine-grained diagnostic details useful during development and troubleshooting.
   * @param {StringLike} msg - Message or payload to emit.
   * @return {void}
   */
  warn(msg: StringLike, meta?: LogMeta): void;

  /**
   * @description Creates a new logger for a specific method or context.
   * @summary Produces a scoped logger that formats entries using the derived context and overrides supplied configuration.
   * @param {any} method - Method name, callback, constructor, or partial configuration used to seed the child logger.
   * @param {Partial<LoggingConfig>} [config] - Optional configuration overrides for the child logger.
   * @param {...any[]} args - Extra arguments forwarded to factory implementations.
   * @return {Logger} Logger instance tailored to the supplied context.
   */
  for(config: Partial<LoggingConfig>): this;
  for(
    context: string | { new (...args: any[]): any } | AnyFunction | object
  ): this;
  for(
    method:
      | string
      | { new (...args: any[]): any }
      | AnyFunction
      | object
      | Partial<LoggingConfig>,
    config?: Partial<LoggingConfig>,
    ...args: any[]
  ): this;

  /**
   * @description Clears any contextual overrides applied via {@link Logger.for}.
   * @summary Resets temporary context/configuration so ensuing chains start from the base logger while preserving the concrete instance type.
   * @return {this} The same logger instance to continue chaining.
   */
  clear(): this;

  /**
   * @description Updates the logger configuration.
   * @summary Merges the given options into the logger's existing configuration.
   * @param {Partial<LoggingConfig>} config - Configuration overrides to apply.
   * @return {void}
   */
  setConfig(config: Partial<LoggingConfig>): void;

  /**
   * @description Immutable base context for the logger instance.
   * @summary Returned as a copy so callers cannot mutate the internal base context while still allowing inspection.
   */
  readonly root: string[];
}

/**
 * @description An interface for filters that can mutate or reject log messages.
 * @summary This allows for custom pre-processing of log entries before they are formatted or emitted.
 * @interface LoggingFilter
 * @memberOf module:Logging
 */
export interface LoggingFilter {
  /**
   * @description Apply filtering logic to an incoming message.
   * @summary Receives the active configuration, original message, and context stack to produce the final message string.
   * @param {LoggingConfig} config - Active logging configuration.
   * @param {string} message - Message submitted for logging.
   * @param {string[]} context - Context identifiers associated with the message.
   * @return {string} Filtered message string.
   */
  filter(config: LoggingConfig, message: string, context: string[]): string;
}

/**
 * @description Configuration for the logging system.
 * @summary Defines the log level, verbosity, and other settings for logging.
 * @template TRANSPORT
 * @typedef {object} LoggingConfig
 * @property {string} env - The environment, e.g., "development", "production".
 * @property {LogLevel} level - The logging level.
 * @property {boolean} [logLevel] - Whether to display the log level in the output.
 * @property {number} verbose - The verbosity level.
 * @property {string} contextSeparator - The separator to use between context entries.
 * @property {string} separator - The separator to use between log components.
 * @property {boolean} [style] - Whether to apply styling to the log output.
 * @property {boolean} [timestamp] - Whether to include timestamps in log messages.
 * @property {string} [timestampFormat] - The format for timestamps.
 * @property {boolean} [context] - Whether to include context information in log messages.
 * @property {Theme} [theme] - The theme to use for styling log messages.
 * @property {LoggingMode} format - The output format for log messages.
 * @property {string} pattern - The pattern to use for formatting log messages.
 * @property {(string|number)} [correlationId] - A correlation ID for tracking related log messages.
 * @property {(string[]|LoggingFilter[])} [filters] - An array of filters to apply to log messages.
 * @property {TRANSPORT[]} [transports] - An array of transports to use for logging.
 * @memberOf module:Logging
 */
export type LoggingConfig<TRANSPORT = object> = {
  env: "development" | "production" | "test" | "staging" | string;
  level: LogLevel;
  logLevel?: boolean;
  verbose: number;
  contextSeparator: string;
  separator: string;
  style?: boolean;
  timestamp?: boolean;
  timestampFormat?: string;
  context?: boolean;
  meta?: boolean;
  theme?: Theme;
  format: LoggingMode;
  pattern: string;
  correlationId?: string | number;
  filters?: string[] | LoggingFilter[];
  transports?: TRANSPORT[];
};

/**
 * @description A factory signature for creating logger instances.
 * @summary This allows consumers to override the logger construction with custom implementations.
 * @template L
 * @typedef {function(string, Partial<LoggingConfig>, ...any[]): L} LoggerFactory
 * @memberOf module:Logging
 */
export type LoggerFactory<L extends Logger = Logger> = (
  object?: string,
  config?: Partial<LoggingConfig>,
  ...args: any[]
) => L;

/**
 * @description A theme option that is applied to a specific log element.
 * @summary This interface configures the foreground and background colors, as well as additional style directives for styled console output.
 * @interface ThemeOption
 * @memberOf module:Logging
 */
export interface ThemeOption {
  fg?: number | [number] | [number, number, number];
  bg?: number | [number] | [number, number, number];
  style?: number[] | [keyof typeof styles];
}

/**
 * @description A mapping between log levels and theme overrides.
 * @summary This enables level-specific styling by associating each {@link LogLevel} with a {@link ThemeOption} configuration.
 * @typedef {Partial<Record<LogLevel, ThemeOption>>} ThemeOptionByLogLevel
 * @memberOf module:Logging
 */
export type ThemeOptionByLogLevel = Partial<Record<LogLevel, ThemeOption>>;

/**
 * @description A theme definition that is applied to the console output.
 * @summary This interface specifies the styling for each console log element and supports overrides based on {@link LogLevel} values.
 * @interface Theme
 * @memberOf module:Logging
 */
export interface Theme {
  /**
   * @description Styling for application identifiers in the output.
   */
  app: ThemeOption | ThemeOptionByLogLevel;
  /**
   * @description Styling for separators inserted between log sections.
   */
  separator: ThemeOption | ThemeOptionByLogLevel;
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
   * @description Styling for stack trace blocks in the output.
   */
  stack: ThemeOption;

  /**
   * @description Styling overrides keyed by {@link LogLevel}.
   */
  logLevel: ThemeOptionByLogLevel;
}
