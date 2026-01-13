import {
  LoggerFactory,
  LoggingConfig,
  LoggingContext,
  LogMeta,
  StringLike,
  Theme,
  ThemeOption,
  ThemeOptionByLogLevel,
  Logger,
} from "./types";
import { ColorizeOptions, style, StyledString } from "styled-string-builder";
import { DefaultTheme, LogLevel, NumericLogLevels } from "./constants";
import { sf } from "./text";
import { LoggedEnvironment } from "./environment";
import { getObjectName, isClass, isFunction, isInstance } from "./utils";

export const ROOT_CONTEXT_SYMBOL = Symbol("MiniLoggerRootContext");

/**
 * @description A minimal logger implementation.
 * @summary MiniLogger is a lightweight logging class that implements the Logger interface. It provides basic logging functionality with support for different log levels, verbosity, context-aware logging, and customizable formatting.
 * @param {string} [context] - The context (typically class name) this logger is associated with.
 * @param {Partial<LoggingConfig>} [conf] - Optional configuration to override global settings.
 * @param {string[]} [baseContext=[]] - The base context for the logger.
 * @class MiniLogger
 * @example
 * // Create a new logger for a class
 * const logger = new MiniLogger('MyClass');
 *
 * // Log messages at different levels
 * logger.info('This is an info message');
 * logger.debug('This is a debug message');
 * logger.error('Something went wrong');
 *
 * // Create a child logger for a specific method
 * const methodLogger = logger.for('myMethod');
 * methodLogger.verbose('Detailed information', 2);
 *
 * // Log with custom configuration
 * logger.for('specialMethod', { style: true }).info('Styled message');
 */
export class MiniLogger implements Logger {
  protected context: string[];
  protected baseContext: string[];

  constructor(
    context?: string,
    protected conf?: Partial<LoggingConfig>,
    baseContext: string[] = []
  ) {
    this.baseContext = Array.isArray(baseContext) ? [...baseContext] : [];
    if (context) this.baseContext.push(context);
    this.context = [...this.baseContext];
    (this as any)[ROOT_CONTEXT_SYMBOL] = [...this.baseContext];
  }

  protected config(
    key: keyof LoggingConfig
  ): LoggingConfig[keyof LoggingConfig] {
    if (this.conf && key in this.conf) return this.conf[key];
    return Logging.getConfig()[key];
  }

  for(config: Partial<LoggingConfig>): this;
  for(
    method:
      | string
      | ((...args: any[]) => any)
      | { new (...args: any[]): any }
      | object
  ): this;
  for(
    method:
      | string
      | ((...args: any[]) => any)
      | { new (...args: any[]): any }
      | object
      | Partial<LoggingConfig>,
    config: Partial<LoggingConfig>,
    ...args: any[]
  ): this;
  /**
   * @description Creates a child logger for a specific method or context.
   * @summary Returns a new logger instance with the current context extended by the specified method name.
   * @param {string | Function | object | Partial<LoggingConfig>} [method] - The method name, function, or configuration to create a logger for.
   * @param {Partial<LoggingConfig>} [config] - Optional configuration to override settings.
   * @param {...any[]} args - Additional arguments to pass to the logger factory.
   * @return {Logger} A new logger instance for the specified method.
   */
  for(
    method?:
      | string
      | ((...args: any[]) => any)
      | { new (...args: any[]): any }
      | object
      | Partial<LoggingConfig>,
    config?: Partial<LoggingConfig>,
    ...args: any[] // eslint-disable-line @typescript-eslint/no-unused-vars
  ): this {
    let contextName: string | undefined;
    let childConfig = config;
    const parentContext = Array.isArray(this.context)
      ? [...this.context]
      : typeof this.context === "string" && this.context
        ? [this.context]
        : [];
    const rootCandidate = (this as any)[ROOT_CONTEXT_SYMBOL];
    const baseContext = Array.isArray(rootCandidate)
      ? [...rootCandidate]
      : Array.isArray(this.baseContext)
        ? [...this.baseContext]
        : [];

    if (typeof method === "string") {
      contextName = method;
    } else if (method !== undefined) {
      if (isClass(method) || isInstance(method) || isFunction(method)) {
        contextName = getObjectName(method);
      } else if (!childConfig && method && typeof method === "object") {
        childConfig = method as Partial<LoggingConfig>;
      }
    }

    let contextSegments = contextName
      ? [...parentContext, contextName]
      : [...parentContext];

    return new Proxy(this, {
      get: (target: typeof this, p: string | symbol, receiver: any) => {
        const result = Reflect.get(target, p, receiver);
        if (p === "config") {
          return new Proxy(this.config, {
            apply: (
              target: typeof this.config,
              _thisArg: unknown,
              argArray: [keyof LoggingConfig]
            ) => {
              const [key] = argArray;
              if (childConfig && key !== undefined && key in childConfig) {
                return childConfig[key];
              }
              return Reflect.apply(target, receiver, argArray);
            },
            get: (target: typeof this.config, key: string | symbol) => {
              if (childConfig && key in childConfig)
                return childConfig[key as keyof LoggingConfig];
              return Reflect.get(target, key, receiver);
            },
          });
        }
        if (p === "clear") {
          return () => {
            contextSegments = [...baseContext];
            childConfig = undefined;
            return receiver;
          };
        }
        if (p === "context") {
          return contextSegments;
        }
        if (p === "root") {
          return [...baseContext];
        }
        if (p === ROOT_CONTEXT_SYMBOL) {
          return baseContext;
        }
        if (p === "for") {
          return (...innerArgs: Parameters<MiniLogger["for"]>) => {
            const originalContext = Array.isArray(target.context)
              ? [...target.context]
              : typeof target.context === "string" && target.context
                ? [target.context]
                : [];
            target.context = [...contextSegments];
            try {
              // eslint-disable-next-line prefer-spread
              return target.for.apply(target, innerArgs);
            } finally {
              target.context = originalContext;
            }
          };
        }
        return result;
      },
    }) as this;
  }

  /**
   * @description Creates a formatted log string.
   * @summary Generates a log string with timestamp, colored log level, context, and message.
   * @param {LogLevel} level - The log level for this message.
   * @param {StringLike | Error} message - The message to log or an Error object.
   * @param {Error} [error] - Optional error to extract stack trace to include in the log.
   * @return {string} A formatted log string with all components.
   */
  protected createLog(
    level: LogLevel,
    message: StringLike | Error,
    error?: Error,
    meta?: LogMeta
  ): string {
    const log: Record<
      | "timestamp"
      | "level"
      | "context"
      | "correlationId"
      | "message"
      | "separator"
      | "stack"
      | "app"
      | "meta",
      string | LogMeta
    > = {} as any;
    const style = this.config("style");
    const separator = this.config("separator");
    const app = Logging.getConfig().app;
    if (app) log.app = style ? Logging.theme(app as string, "app", level) : app;

    if (separator)
      log.separator = style
        ? Logging.theme(separator as string, "separator", level)
        : (separator as string);

    if (this.config("timestamp")) {
      const date = new Date().toISOString();
      const timestamp = style ? Logging.theme(date, "timestamp", level) : date;
      log.timestamp = timestamp;
    }

    if (this.config("logLevel")) {
      const lvl: string = style
        ? Logging.theme(level, "logLevel", level)
        : level;
      log.level = lvl.toUpperCase();
    }

    if (this.config("context")) {
      const contextSegments = Array.isArray(this.context)
        ? this.context
        : typeof this.context === "string" && this.context
          ? [this.context]
          : [];
      if (contextSegments.length) {
        const joined = contextSegments.join(
          (this.config("contextSeparator") as string) || "."
        );
        const context = style ? Logging.theme(joined, "class", level) : joined;
        log.context = context;
      }
    }

    if (this.config("correlationId")) {
      {
        const id: string = style
          ? Logging.theme(this.config("correlationId")!.toString(), "id", level)
          : this.config("correlationId")!.toString();
        log.correlationId = id;
      }
    }

    const msg: string = style
      ? Logging.theme(
          typeof message === "string" ? message : (message as Error).message,
          "message",
          level
        )
      : typeof message === "string"
        ? message
        : (message as Error).message;
    log.message = msg;
    const showMeta = Boolean(this.config("meta"));
    const metaPayload = showMeta && meta ? meta : undefined;
    const metaString = metaPayload ? this.formatMeta(metaPayload) : undefined;

    if (metaPayload) {
      log.meta = metaPayload;
    }

    if (error || message instanceof Error) {
      const stack = style
        ? Logging.theme(
            (error?.stack || (message as Error).stack) as string,
            "stack",
            level
          )
        : error?.stack || "";
      log.stack = ` | ${(error || (message as Error)).message} - Stack trace:\n${stack}`;
    }

    switch (this.config("format")) {
      case "json":
        return JSON.stringify(log);
      case "raw": {
        const generated = (this.config("pattern") as string)
          .split(" ")
          .map((s) => {
            if (!s.match(/\{.*?}/g)) return s;
            const formattedS = sf(s, log);
            if (formattedS !== s) return formattedS;
            return undefined;
          })
          .filter((s) => s)
          .join(" ");
        return metaString ? `${generated} ${metaString}` : generated;
      }
      default:
        throw new Error(`Unsupported logging format: ${this.config("format")}`);
    }
  }

  private formatMeta(meta: LogMeta): string {
    try {
      return JSON.stringify(meta);
    } catch (err: unknown) {
      return String(meta);
    }
  }

  /**
   * @description Logs a message with the specified log level.
   * @summary Checks if the message should be logged based on the current log level, then uses the appropriate console method to output the formatted log.
   * @param {LogLevel} level - The log level of the message.
   * @param {StringLike | Error} msg - The message to be logged or an Error object.
   * @param {Error} [error] - Optional stack trace to include in the log.
   * @return {void}
   */
  protected log(
    level: LogLevel,
    msg: StringLike | Error,
    error?: Error,
    meta?: LogMeta
  ): void {
    const confLvl = this.config("level") as LogLevel;
    if (NumericLogLevels[confLvl] < NumericLogLevels[level]) return;
    let method;
    switch (level) {
      case LogLevel.benchmark:
        method = console.log;
        break;
      case LogLevel.info:
      case LogLevel.verbose:
        method = console.log;
        break;
      case LogLevel.debug:
        method = console.debug;
        break;
      case LogLevel.error:
        method = console.error;
        break;
      case LogLevel.trace:
        method = console.trace;
        break;
      case LogLevel.warn:
        method = console.warn;
        break;
      case LogLevel.silly:
        method = console.debug;
        break;
      default:
        throw new Error("Invalid log level");
    }
    method(this.createLog(level, msg, error, meta));
  }

  /**
   * @description Logs a message at the benchmark level.
   * @summary Logs a message at the benchmark level if the current verbosity setting allows it.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  benchmark(msg: StringLike, meta?: LogMeta): void {
    this.log(LogLevel.benchmark, msg, undefined, meta);
  }

  /**
   * @description Logs a message at the silly level.
   * @summary Logs a message at the silly level if the current verbosity setting allows it.
   * @param {StringLike} msg - The message to be logged.
   * @param {number} [verbosity=0] - The verbosity level of the message.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  silly(
    msg: StringLike,
    verbosityOrMeta: number | LogMeta = 0,
    meta?: LogMeta
  ): void {
    const verbosity = typeof verbosityOrMeta === "number" ? verbosityOrMeta : 0;
    const payloadMeta =
      typeof verbosityOrMeta === "number" ? meta : verbosityOrMeta;
    if ((this.config("verbose") as number) >= verbosity)
      this.log(LogLevel.silly, msg, undefined, payloadMeta);
  }

  /**
   * @description Logs a message at the verbose level.
   * @summary Logs a message at the verbose level if the current verbosity setting allows it.
   * @param {StringLike} msg - The message to be logged.
   * @param {number} [verbosity=0] - The verbosity level of the message.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  verbose(
    msg: StringLike,
    verbosityOrMeta: number | LogMeta = 0,
    meta?: LogMeta
  ): void {
    const verbosity = typeof verbosityOrMeta === "number" ? verbosityOrMeta : 0;
    const payloadMeta =
      typeof verbosityOrMeta === "number" ? meta : verbosityOrMeta;
    if ((this.config("verbose") as number) >= verbosity)
      this.log(LogLevel.verbose, msg, undefined, payloadMeta);
  }

  /**
   * @description Logs a message at the info level.
   * @summary Logs a message at the info level for general application information.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  info(msg: StringLike, meta?: LogMeta): void {
    this.log(LogLevel.info, msg, undefined, meta);
  }

  /**
   * @description Logs a message at the debug level.
   * @summary Logs a message at the debug level for detailed troubleshooting information.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  debug(msg: StringLike, meta?: LogMeta): void {
    this.log(LogLevel.debug, msg, undefined, meta);
  }

  /**
   * @description Logs a message at the error level.
   * @summary Logs a message at the error level for errors and exceptions.
   * @param {StringLike | Error} msg - The message to be logged or an Error object.
   * @param {Error|object} [e] - Optional error or metadata to include in the log.
   * @param {object} [meta] - Optional metadata to include with the entry when an error is supplied.
   * @return {void}
   */
  error(msg: StringLike | Error, e?: Error | LogMeta, meta?: LogMeta): void {
    let errorCandidate: Error | undefined;
    let payloadMeta: LogMeta | undefined;
    if (e instanceof Error) {
      errorCandidate = e;
      payloadMeta = meta;
    } else {
      payloadMeta = e;
    }
    this.log(LogLevel.error, msg, errorCandidate, payloadMeta);
  }

  /**
   * @description Logs a message at the warning level.
   * @summary Logs a message at the warning level for potential issues.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  warn(msg: StringLike, meta?: LogMeta): void {
    this.log(LogLevel.warn, msg, undefined, meta);
  }

  /**
   * @description Logs a message at the trace level.
   * @summary Logs a message at the trace level for tracing code execution.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  trace(msg: StringLike, meta?: LogMeta): void {
    this.log(LogLevel.trace, msg, undefined, meta);
  }

  /**
   * @description Updates the logger configuration.
   * @summary Merges the provided configuration with the existing configuration.
   * @param {Partial<LoggingConfig>} config - The configuration options to apply.
   * @return {void}
   */
  setConfig(config: Partial<LoggingConfig>): void {
    this.conf = { ...(this.conf || {}), ...config };
  }

  get root(): string[] {
    return [...this.baseContext];
  }

  /**
   * @description Clears any contextual overrides applied by `for`.
   * @summary Returns the same logger instance so more contexts can be chained afterwards.
   * @return {this} The same logger instance.
   */
  clear(): this {
    this.context = [...this.baseContext];
    return this;
  }
}

/**
 * @description A static class for managing logging operations.
 * @summary The Logging class provides a centralized logging mechanism with support for different log levels, verbosity, and styling. It uses a singleton pattern to maintain a global logger instance and allows creating specific loggers for different classes and methods.
 * @class Logging
 * @example
 * // Set global configuration
 * Logging.setConfig({ level: LogLevel.debug, style: true });
 *
 * // Get a logger for a specific class
 * const logger = Logging.for('MyClass');
 *
 * // Log messages at different levels
 * logger.info('Application started');
 * logger.debug('Processing data...');
 *
 * // Log with context
 * const methodLogger = Logging.for('MyClass.myMethod');
 * methodLogger.verbose('Detailed operation information', 1);
 *
 * // Log errors
 * try {
 *   // some operation
 * } catch (error) {
 *   logger.error(error);
 * }
 * @mermaid
 * classDiagram
 *   class Logger {
 *     <<interface>>
 *     +for(method, config, ...args)
 *     +silly(msg, verbosity)
 *     +verbose(msg, verbosity)
 *     +info(msg)
 *     +debug(msg)
 *     +error(msg)
 *     +setConfig(config)
 *   }
 *
 *   class Logging {
 *     -global: Logger
 *     -_factory: LoggerFactory
 *     -_config: LoggingConfig
 *     +setFactory(factory)
 *     +setConfig(config)
 *     +getConfig()
 *     +get()
 *     +verbose(msg, verbosity)
 *     +info(msg)
 *     +debug(msg)
 *     +silly(msg)
 *     +error(msg)
 *     +for(object, config, ...args)
 *     +because(reason, id)
 *     +theme(text, type, loggerLevel, template)
 *   }
 *
 *   class MiniLogger {
 *     +constructor(context, conf?)
 *   }
 *
 *   Logging ..> Logger : creates
 *   Logging ..> MiniLogger : creates by default
 */
export class Logging {
  /**
   * @description The global logger instance.
   * @summary A singleton instance of Logger used for global logging.
   */
  private static global?: Logger;

  /**
   * @description Factory function for creating logger instances.
   * @summary A function that creates new Logger instances. By default, it creates a MiniLogger.
   */
  private static _factory: LoggerFactory = (
    object?: string,
    config?: Partial<LoggingConfig>
  ) => {
    const base =
      typeof LoggedEnvironment.app === "string"
        ? [LoggedEnvironment.app as string]
        : [];
    return new MiniLogger(object, config, base) as unknown as Logger;
  };

  private static _config: typeof LoggedEnvironment = LoggedEnvironment;

  private constructor() {}

  /**
   * @description Sets the factory function for creating logger instances.
   * @summary Allows customizing how logger instances are created.
   * @param {LoggerFactory} factory - The factory function to use for creating loggers.
   * @return {void}
   */
  static setFactory(factory: LoggerFactory) {
    Logging._factory = factory;
    this.global = undefined;
  }

  /**
   * @description Updates the global logging configuration.
   * @summary Allows updating the global logging configuration with new settings.
   * @param {Partial<LoggingConfig>} config - The configuration options to apply.
   * @return {void}
   */
  static setConfig(config: Partial<LoggingConfig>): void {
    Object.entries(config).forEach(([k, v]) => {
      (this._config as any)[k] = v as any;
    });
  }

  /**
   * @description Gets a copy of the current global logging configuration.
   * @summary Returns a copy of the current global logging configuration.
   * @return {LoggingConfig} A copy of the current configuration.
   */
  static getConfig(): typeof LoggedEnvironment {
    return this._config;
  }

  /**
   * @description Retrieves or creates the global logger instance.
   * @summary Returns the existing global logger or creates a new one if it doesn't exist.
   * @return {Logger} The global Logger instance.
   */
  static get(): Logger {
    return this.ensureRoot();
  }

  /**
   * @description Logs a verbose message.
   * @summary Delegates the verbose logging to the global logger instance.
   * @param {StringLike} msg - The message to be logged.
   * @param {number|object} [verbosity] - The verbosity level or metadata object.
   * @param {object} [meta] - Optional metadata applied when a verbosity level is provided.
   * @return {void}
   */
  static verbose(
    msg: StringLike,
    verbosityOrMeta: number | LogMeta = 0,
    meta?: LogMeta
  ): void {
    return this.get().verbose(msg, verbosityOrMeta, meta);
  }

  /**
   * @description Logs an info message.
   * @summary Delegates the info logging to the global logger instance.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  static info(msg: StringLike, meta?: LogMeta): void {
    return this.get().info(msg, meta);
  }

  /**
   * @description Logs a trace message.
   * @summary Delegates the trace logging to the global logger instance.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  static trace(msg: StringLike, meta?: LogMeta): void {
    return this.get().trace(msg, meta);
  }

  /**
   * @description Logs a debug message.
   * @summary Delegates the debug logging to the global logger instance.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  static debug(msg: StringLike, meta?: LogMeta): void {
    return this.get().debug(msg, meta);
  }

  /**
   * @description Logs a benchmark message.
   * @summary Delegates the benchmark logging to the global logger instance.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  static benchmark(msg: StringLike, meta?: LogMeta): void {
    return this.get().benchmark(msg, meta);
  }

  /**
   * @description Logs a silly message.
   * @summary Delegates the silly logging to the global logger instance.
   * @param {StringLike} msg - The message to be logged.
   * @param {number|object} [verbosity] - The verbosity level or metadata object.
   * @param {object} [meta] - Optional metadata applied when a verbosity level is provided.
   * @return {void}
   */
  static silly(
    msg: StringLike,
    verbosityOrMeta: number | LogMeta = 0,
    meta?: LogMeta
  ): void {
    return this.get().silly(msg, verbosityOrMeta, meta);
  }

  /**
   * @description Logs a warning message.
   * @summary Delegates the warning logging to the global logger instance.
   * @param {StringLike} msg - The message to be logged.
   * @param {object} [meta] - Optional metadata to include with the entry.
   * @return {void}
   */
  static warn(msg: StringLike, meta?: LogMeta): void {
    return this.get().warn(msg, meta);
  }

  /**
   * @description Logs an error message.
   * @summary Delegates the error logging to the global logger instance.
   * @param {StringLike | Error} msg - The message to be logged.
   * @param {Error|object} [e] - Optional error or metadata to include in the log.
   * @param {object} [meta] - Optional metadata to include with the entry when an error is supplied.
   * @return {void}
   */
  static error(
    msg: StringLike | Error,
    e?: Error | LogMeta,
    meta?: LogMeta
  ): void {
    return this.get().error(msg, e, meta);
  }

  /**
   * @description Creates a logger for a specific object or context.
   * @summary Creates a new logger instance for the given object or context using the factory function.
   * @param {LoggingContext} object - The object, class, or context to create a logger for.
   * @param {Partial<LoggingConfig>} [config] - Optional configuration to override global settings.
   * @param {...any} args - Additional arguments to pass to the logger factory.
   * @return {Logger} A new logger instance for the specified object or context.
   */
  static for(
    object: LoggingContext,
    config?: Partial<LoggingConfig>,
    ...args: any[]
  ): Logger {
    const root = this.global ? this.global : this.ensureRoot(args);
    const callArgs = config !== undefined ? [object, config] : [object];
    return (root.for as any)(...callArgs);
  }

  /**
   * @description Creates a logger for a specific reason or correlation context.
   * @summary Utility to quickly create a logger labeled with a free-form reason and optional identifier so that ad-hoc operations can be traced without tying the logger to a class or method name.
   * @param {string} reason - A textual reason or context label for this logger instance.
   * @param {string} [id] - Optional identifier to help correlate related log entries.
   * @return {Logger} A new logger instance labeled with the provided reason and id.
   */
  static because(reason: string, id?: string): Logger {
    const root = this.ensureRoot();
    let logger = (root.for as any)(reason, this._config);
    if (id) logger = (logger.for as any)(id);
    return logger;
  }

  private static baseContext(): string[] {
    const app = this._config.app;
    return typeof app === "string" && app.length ? [app] : [];
  }

  private static attachRootContext(logger: Logger): Logger {
    const base =
      (logger as any).root && Array.isArray((logger as any).root)
        ? [...(logger as any).root]
        : this.baseContext();
    if (
      !(logger as any).context ||
      (Array.isArray((logger as any).context) &&
        (logger as any).context.length === 0)
    ) {
      (logger as any).context = [...base];
    }
    (logger as any)[ROOT_CONTEXT_SYMBOL] = [...base];
    return logger;
  }

  private static ensureRoot(extras: any[] = []): Logger {
    if (!this.global) {
      const instance = this._factory(undefined, undefined, ...extras);
      this.global = this.attachRootContext(instance);
    }
    return this.global;
  }

  /**
   * @description Applies theme styling to text.
   * @summary Applies styling (colors, formatting) to text based on the theme configuration.
   * @param {string} text - The text to style.
   * @param type - The type of element to style (e.g., "class", "message", "logLevel").
   * @param {LogLevel} loggerLevel - The log level to use for styling.
   * @param {Theme} [template=DefaultTheme] - The theme to use for styling.
   * @return {string} The styled text.
   * @mermaid
   * sequenceDiagram
   *   participant Caller
   *   participant Theme as Logging.theme
   *   participant Apply as apply function
   *   participant Style as styled-string-builder
   *
   *   Caller->>Theme: theme(text, type, loggerLevel)
   *   Theme->>Theme: Check if styling is enabled
   *   alt styling disabled
   *     Theme-->>Caller: return original text
   *   else styling enabled
   *     Theme->>Theme: Get theme for type
   *     alt theme not found
   *       Theme-->>Caller: return original text
   *     else theme found
   *       Theme->>Theme: Determine actual theme based on log level
   *       Theme->>Apply: Apply each style property
   *       Apply->>Style: Apply colors and formatting
   *       Style-->>Apply: Return styled text
   *       Apply-->>Theme: Return styled text
   *       Theme-->>Caller: Return final styled text
   *     end
   *   end
   */
  static theme(
    text: string,
    type: keyof Theme | keyof LogLevel,
    loggerLevel: LogLevel,
    template: Theme = DefaultTheme
  ) {
    if (!this._config.style) return text;
    function apply(
      txt: string,
      option: keyof ThemeOption,
      value: number | [number] | [number, number, number] | number[] | string[]
    ): string {
      try {
        const t: string | StyledString = txt;
        let c = style(t);

        function applyColor(
          val: number | [number] | [number, number, number],
          isBg = false
        ): StyledString {
          let f:
            | typeof c.background
            | typeof c.foreground
            | typeof c.rgb
            | typeof c.color256 = isBg ? c.background : c.foreground;
          if (!Array.isArray(val)) {
            return (f as typeof c.background | typeof c.foreground).call(
              c,
              value as number
            );
          }
          switch (val.length) {
            case 1:
              f = isBg ? c.bgColor256 : c.color256;
              return (f as typeof c.bgColor256 | typeof c.color256)(val[0]);
            case 3:
              f = isBg ? c.bgRgb : c.rgb;
              return c.rgb(val[0], val[1], val[2]);
            default:
              console.error(`Not a valid color option: ${option}`);
              return style(t as string);
          }
        }

        function applyStyle(v: number | string): void {
          if (typeof v === "number") {
            c = c.style(v);
          } else {
            c = c[v as keyof ColorizeOptions] as StyledString;
          }
        }

        switch (option) {
          case "bg":
          case "fg":
            return applyColor(value as number).text;
          case "style":
            if (Array.isArray(value)) {
              value.forEach(applyStyle);
            } else {
              applyStyle(value as number | string);
            }
            return c.text;
          default:
            console.error(`Not a valid theme option: ${option}`);
            return t;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e: unknown) {
        console.error(`Error applying style: ${option} with value ${value}`);
        return txt;
      }
    }

    const individualTheme = template[type as keyof Theme];
    if (!individualTheme || !Object.keys(individualTheme).length) {
      return text;
    }

    let actualTheme: ThemeOption = individualTheme as ThemeOption;

    const logLevels = Object.assign({}, LogLevel);
    if (Object.keys(individualTheme)[0] in logLevels)
      actualTheme =
        (individualTheme as ThemeOptionByLogLevel)[loggerLevel] || {};

    return Object.keys(actualTheme).reduce((acc: string, key: string) => {
      const val = (actualTheme as ThemeOption)[key as keyof ThemeOption];
      if (val)
        return apply(
          acc,
          key as keyof ThemeOption,
          val as
            | number
            | [number]
            | [number, number, number]
            | number[]
            | string[]
        );
      return acc;
    }, text);
  }
}
