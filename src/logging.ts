import {
  LoggerFactory,
  LoggingConfig,
  LoggingContext,
  StringLike,
  Theme,
  ThemeOption,
  ThemeOptionByLogLevel,
  Logger,
} from "./types";
import { ColorizeOptions, style, StyledString } from "styled-string-builder";
import {
  DefaultLoggingConfig,
  DefaultTheme,
  LogLevel,
  NumericLogLevels,
} from "./constants";

/**
 * @description A minimal logger implementation.
 * @summary MiniLogger is a lightweight logging class that implements the Logger interface.
 * It provides basic logging functionality with support for different log levels, verbosity,
 * context-aware logging, and customizable formatting.
 * @param {string} context - The context (typically class name) this logger is associated with
 * @param {Partial<LoggingConfig>} conf - Optional configuration to override global settings
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
 *   class MiniLogger {
 *     -context: string
 *     -conf?: Partial~LoggingConfig~
 *     +constructor(context, conf?)
 *     #config(key)
 *     +for(method?, config?, ...args)
 *     #createLog(level, message, stack?)
 *     +log(level, msg, stack?)
 *     +silly(msg, verbosity)
 *     +verbose(msg, verbosity)
 *     +info(msg)
 *     +debug(msg)
 *     +error(msg)
 *     +setConfig(config)
 *   }
 *   
 *   Logger <|-- MiniLogger : implements
 */
export class MiniLogger implements Logger {
  /**
   * Creates a new MiniLogger instance.
   */
  constructor(
    protected context: string,
    protected conf?: Partial<LoggingConfig>
  ) {}

  protected config(
    key: keyof LoggingConfig
  ): LoggingConfig[keyof LoggingConfig] {
    if (this.conf && key in this.conf) return this.conf[key];
    return Logging.getConfig()[key];
  }

  /**
   * @description Creates a child logger for a specific method or context
   * @summary Returns a new logger instance with the current context extended by the specified method name
   * @param {string | Function} method - The method name or function to create a logger for
   * @param {Partial<LoggingConfig>} config - Optional configuration to override settings
   * @param {...any} args - Additional arguments to pass to the logger factory
   * @return {Logger} A new logger instance for the specified method
   */
  for(
    method?: string | ((...args: any[]) => any),
    config?: Partial<LoggingConfig>,
    ...args: any[]
  ): Logger {
    method = method
      ? typeof method === "string"
        ? method
        : method.name
      : undefined;

    return Logging.for([this.context, method].join("."), config, ...args);
  }

  /**
   * @description Creates a formatted log string
   * @summary Generates a log string with timestamp, colored log level, context, and message
   * @param {LogLevel} level - The log level for this message
   * @param {StringLike | Error} message - The message to log or an Error object
   * @param {string} [stack] - Optional stack trace to include in the log
   * @return {string} A formatted log string with all components
   */
  protected createLog(
    level: LogLevel,
    message: StringLike | Error,
    stack?: string
  ): string {
    const log: string[] = [];
    const style = this.config("style");
    if (this.config("timestamp")) {
      const date = new Date().toISOString();
      const timestamp = style ? Logging.theme(date, "timestamp", level) : date;
      log.push(timestamp);
    }

    if (this.config("logLevel")) {
      const lvl: string = style
        ? Logging.theme(level, "logLevel", level)
        : level;
      log.push(lvl);
    }

    if (this.config("context")) {
      const context: string = style
        ? Logging.theme(this.context, "class", level)
        : this.context;
      log.push(context);
    }

    if (this.config("correlationId")) {
      {
        const id: string = style
          ? Logging.theme(this.config("correlationId")!.toString(), "id", level)
          : this.config("correlationId")!.toString();
        log.push(id);
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
    log.push(msg);
    if (stack || message instanceof Error) {
      stack = style
        ? Logging.theme(
            (stack || (message as Error).stack) as string,
            "stack",
            level
          )
        : stack;
      log.push(`\nStack trace:\n${stack}`);
    }

    return log.join(this.config("separator") as string);
  }

  /**
   * @description Logs a message with the specified log level
   * @summary Checks if the message should be logged based on the current log level,
   * then uses the appropriate console method to output the formatted log
   * @param {LogLevel} level - The log level of the message
   * @param {StringLike | Error} msg - The message to be logged or an Error object
   * @param {string} [stack] - Optional stack trace to include in the log
   * @return {void}
   */
  protected log(
    level: LogLevel,
    msg: StringLike | Error,
    stack?: string
  ): void {
    if (
      NumericLogLevels[this.config("level") as LogLevel] <
      NumericLogLevels[level]
    )
      return;
    let method;
    switch (level) {
      case LogLevel.info:
        method = console.log;
        break;
      case LogLevel.verbose:
      case LogLevel.debug:
        method = console.debug;
        break;
      case LogLevel.error:
        method = console.error;
        break;
      default:
        throw new Error("Invalid log level");
    }
    method(this.createLog(level, msg, stack));
  }

  /**
   * @description Logs a message at the silly level
   * @summary Logs a message at the silly level if the current verbosity setting allows it
   * @param {StringLike} msg - The message to be logged
   * @param {number} [verbosity=0] - The verbosity level of the message
   * @return {void}
   */
  silly(msg: StringLike, verbosity: number = 0): void {
    if ((this.config("verbose") as number) >= verbosity)
      this.log(LogLevel.verbose, msg);
  }

  /**
   * @description Logs a message at the verbose level
   * @summary Logs a message at the verbose level if the current verbosity setting allows it
   * @param {StringLike} msg - The message to be logged
   * @param {number} [verbosity=0] - The verbosity level of the message
   * @return {void}
   */
  verbose(msg: StringLike, verbosity: number = 0): void {
    if ((this.config("verbose") as number) >= verbosity)
      this.log(LogLevel.verbose, msg);
  }

  /**
   * @description Logs a message at the info level
   * @summary Logs a message at the info level for general application information
   * @param {StringLike} msg - The message to be logged
   * @return {void}
   */
  info(msg: StringLike): void {
    this.log(LogLevel.info, msg);
  }

  /**
   * @description Logs a message at the debug level
   * @summary Logs a message at the debug level for detailed troubleshooting information
   * @param {StringLike} msg - The message to be logged
   * @return {void}
   */
  debug(msg: StringLike): void {
    this.log(LogLevel.debug, msg);
  }

  /**
   * @description Logs a message at the error level
   * @summary Logs a message at the error level for errors and exceptions
   * @param {StringLike | Error} msg - The message to be logged or an Error object
   * @return {void}
   */
  error(msg: StringLike | Error): void {
    this.log(LogLevel.error, msg);
  }

  /**
   * @description Updates the logger configuration
   * @summary Merges the provided configuration with the existing configuration
   * @param {Partial<LoggingConfig>} config - The configuration options to apply
   * @return {void}
   */
  setConfig(config: Partial<LoggingConfig>) {
    this.conf = { ...(this.conf || {}), ...config };
  }
}

/**
 * @description A static class for managing logging operations
 * @summary The Logging class provides a centralized logging mechanism with support for
 * different log levels, verbosity, and styling. It uses a singleton pattern to maintain a global
 * logger instance and allows creating specific loggers for different classes and methods.
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
   * @description The global logger instance
   * @summary A singleton instance of Logger used for global logging
   */
  private static global?: Logger;

  /**
   * @description Factory function for creating logger instances
   * @summary A function that creates new Logger instances. By default, it creates a MiniLogger.
   */
  private static _factory: LoggerFactory = (
    object: string,
    config?: Partial<LoggingConfig>
  ) => {
    return new MiniLogger(object, config);
  };
  /**
   * @description Configuration for the logging system
   * @summary Stores the global logging configuration including verbosity, log level, styling, and formatting settings
   */
  private static _config: LoggingConfig = DefaultLoggingConfig;

  /**
   * Private constructor to prevent instantiation
   */
  private constructor() {}

  /**
   * @description Sets the factory function for creating logger instances
   * @summary Allows customizing how logger instances are created
   * @param {LoggerFactory} factory - The factory function to use for creating loggers
   * @return {void}
   */
  static setFactory(factory: LoggerFactory) {
    Logging._factory = factory;
  }

  /**
   * @description Updates the global logging configuration
   * @summary Allows updating the global logging configuration with new settings
   * @param {Partial<LoggingConfig>} config - The configuration options to apply
   * @return {void}
   */
  static setConfig(config: Partial<LoggingConfig>) {
    Object.assign(this._config, config);
  }

  /**
   * @description Gets a copy of the current global logging configuration
   * @summary Returns a copy of the current global logging configuration
   * @return {LoggingConfig} A copy of the current configuration
   */
  static getConfig(): LoggingConfig {
    return Object.assign({}, this._config);
  }

  /**
   * @description Retrieves or creates the global logger instance.
   * @summary Returns the existing global logger or creates a new one if it doesn't exist.
   *
   * @return The global VerbosityLogger instance.
   */
  static get(): Logger {
    this.global = this.global ? this.global : this._factory("Logging");
    return this.global;
  }

  /**
   * @description Logs a verbose message.
   * @summary Delegates the verbose logging to the global logger instance.
   *
   * @param msg - The message to be logged.
   * @param verbosity - The verbosity level of the message (default: 0).
   */
  static verbose(msg: StringLike, verbosity: number = 0): void {
    return this.get().verbose(msg, verbosity);
  }

  /**
   * @description Logs an info message.
   * @summary Delegates the info logging to the global logger instance.
   *
   * @param msg - The message to be logged.
   */
  static info(msg: StringLike): void {
    return this.get().info(msg);
  }

  /**
   * @description Logs a debug message.
   * @summary Delegates the debug logging to the global logger instance.
   *
   * @param msg - The message to be logged.
   */
  static debug(msg: StringLike): void {
    return this.get().debug(msg);
  }

  /**
   * @description Logs a silly message.
   * @summary Delegates the debug logging to the global logger instance.
   *
   * @param msg - The message to be logged.
   */
  static silly(msg: StringLike): void {
    return this.get().silly(msg);
  }

  /**
   * @description Logs an error message.
   * @summary Delegates the error logging to the global logger instance.
   *
   * @param msg - The message to be logged.
   */
  static error(msg: StringLike): void {
    return this.get().error(msg);
  }

  /**
   * @description Creates a logger for a specific object or context
   * @summary Creates a new logger instance for the given object or context using the factory function
   * @param {LoggingContext} object - The object, class, or context to create a logger for
   * @param {Partial<LoggingConfig>} [config] - Optional configuration to override global settings
   * @param {...any} args - Additional arguments to pass to the logger factory
   * @return {Logger} A new logger instance for the specified object or context
   */
  static for(
    object: LoggingContext,
    config?: Partial<LoggingConfig>,
    ...args: any[]
  ): Logger {
    object =
      typeof object === "string"
        ? object
        : object.constructor
          ? object.constructor.name
          : object.name;
    return this._factory(object, config, ...args);
  }

  /**
   * @description Creates a logger for a specific reason or context.
   *
   * @summary This static method creates a new logger instance using the factory function,
   * based on a given reason or context.
   *
   * @param reason - A string describing the reason or context for creating this logger.
   * @param id
   * @returns A new VerbosityLogger or ClassLogger instance.
   */
  static because(reason: string, id?: string): Logger {
    return this._factory(reason, this._config, id);
  }

  /**
   * @description Applies theme styling to text
   * @summary Applies styling (colors, formatting) to text based on the theme configuration
   * @param {string} text - The text to style
   * @param {keyof Theme | keyof LogLevel} type - The type of element to style (e.g., "class", "message", "logLevel")
   * @param {LogLevel} loggerLevel - The log level to use for styling
   * @param {Theme} [template=DefaultTheme] - The theme to use for styling
   * @return {string} The styled text
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
    const logger = Logging.get().for(this.theme);

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
              logger.error(`Not a valid color option: ${option}`);
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
            logger.error(`Not a valid theme option: ${option}`);
            return t;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e: unknown) {
        logger.error(`Error applying style: ${option} with value ${value}`);
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
