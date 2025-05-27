import winston, { LogEntry, LoggerOptions } from "winston";
import Transport from "winston-transport";
import { Logger, LoggerFactory, LoggingConfig, StringLike } from "../types";
import { Logging, MiniLogger } from "../logging";
import { LogLevel } from "../constants";

/**
 * @description A logger implementation using Winston
 * @summary WinstonLogger extends MiniLogger to provide logging functionality using the Winston library.
 * It configures Winston with appropriate transports and formats based on the logging configuration.
 * @param {string} cont - The context (typically class name) this logger is associated with
 * @param {Partial<LoggingConfig>} [conf] - Optional configuration to override global settings
 * @param {Transport[]|Transport} [transports] - Winston transports to use for logging
 * @class WinstonLogger
 * @example
 * // Create a Winston logger for a class
 * const logger = new WinstonLogger('MyClass');
 * 
 * // Log messages at different levels
 * logger.info('Application started');
 * logger.error(new Error('Something went wrong'));
 * 
 * // Create a child logger for a specific method
 * const methodLogger = logger.for('myMethod');
 * methodLogger.debug('Processing data...');
 * @mermaid
 * classDiagram
 *   class Logger {
 *     <<interface>>
 *   }
 *   
 *   class MiniLogger {
 *     #context: string
 *     #conf?: Partial~LoggingConfig~
 *   }
 *   
 *   class WinstonLogger {
 *     #winston: winston.Logger
 *     #transports?: Transport[]|Transport
 *     +constructor(cont, conf?, transports?)
 *     #log(level, msg, stack?)
 *   }
 *   
 *   Logger <|-- MiniLogger : implements
 *   MiniLogger <|-- WinstonLogger : extends
 */
export class WinstonLogger extends MiniLogger implements Logger {
  protected winston: winston.Logger;

  constructor(
    cont: string,
    conf?: Partial<LoggingConfig>,
    protected transports?: Transport[] | Transport
  ) {
    super(cont, conf);
    const config: LoggingConfig = Object.assign(
      {},
      this.conf || {},
      Logging.getConfig()
    );
    this.conf = Object.assign({}, this.conf || {}, {
      style: false,
      logLevel: false,
      timestamp: false,
      context: false,
    });
    const { level, context, style, timestamp, timestampFormat } = config;

    const formats = [winston.format.splat(), winston.format.simple()];
    if (timestamp)
      formats.unshift(winston.format.timestamp({ format: timestampFormat }));
    if (style) formats.unshift(winston.format.colorize());

    this.transports = this.transports || [
      new winston.transports.Console({
        format: winston.format.combine(...formats),
      }),
    ];

    const winstonConfig: LoggerOptions = {
      level: level,
      defaultMeta: context,
      format: winston.format.json(),
      transports: transports,
    };
    this.winston = winston.createLogger(winstonConfig);
  }

  /**
   * @description Logs a message with the specified log level using Winston
   * @summary Overrides the base log method to use Winston for logging
   * @param {LogLevel} level - The log level of the message
   * @param {StringLike | Error} msg - The message to be logged or an Error object
   * @param {string} [stack] - Optional stack trace to include in the log
   * @return {void}
   */
  protected override log(
    level: LogLevel,
    msg: StringLike | Error,
    stack?: string
  ) {
    const logData: LogEntry = {
      level: level,
      message: this.createLog(level, msg, stack),
    };
    if (this.config("correlationId"))
      logData["correlationId"] = this.config("correlationId");
    this.winston.log(logData);
  }
}

/**
 * @description Factory function for creating Winston loggers
 * @summary A LoggerFactory implementation that creates WinstonLogger instances
 * @const WinstonFactory
 * @type {LoggerFactory}
 * @param {string} context - The context (typically class name) for the logger
 * @param {Partial<LoggingConfig>} [conf] - Optional configuration to override global settings
 * @param {...any} args - Additional arguments to pass to the WinstonLogger constructor
 * @return {WinstonLogger} A new WinstonLogger instance
 * @memberOf module:Logging
 */
export const WinstonFactory: LoggerFactory = (
  context: string,
  conf?: Partial<LoggingConfig>,
  ...args: any[]
) => new WinstonLogger(context, conf, ...args);
