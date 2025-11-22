import winston, { LogEntry, LoggerOptions } from "winston";
import Transport from "winston-transport";
import { Logger, LoggerFactory, LoggingConfig, StringLike } from "../types";
import { Logging, MiniLogger } from "../logging";
import { LogLevel } from "../constants";

/**
 * @description A logger implementation that uses Winston.
 * @summary This class extends {@link MiniLogger} to provide logging functionality using the Winston library. It configures Winston with the appropriate transports and formats based on the logging configuration.
 * @param {string} [cont] - The context (typically the class name) that this logger is associated with.
 * @param {Partial<LoggingConfig>} [conf] - Optional configuration to override global settings.
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
 */
export class WinstonLogger extends MiniLogger implements Logger {
  protected winston: winston.Logger;

  constructor(cont?: string, conf?: Partial<LoggingConfig>) {
    super(cont, conf);
    const config = Object.assign(
      {},
      Logging.getConfig(),
      this.conf || {}
    ) as LoggingConfig<Transport>;

    const transports = this.resolveTransports(
      (config.transports as Transport[] | undefined) || undefined
    );
    const passThrough = winston.format.printf(({ message }) =>
      typeof message === "string" ? message : JSON.stringify(message)
    );

    const winstonConfig: LoggerOptions = {
      level: config.level,
      transports,
      format: passThrough,
    };
    this.winston = winston.createLogger(winstonConfig);
  }

  private resolveTransports(transports?: Transport[]): Transport[] {
    if (transports && transports.length) return transports;
    return [new winston.transports.Console()];
  }

  /**
   * @description Logs a message with the specified log level using Winston.
   * @summary This method overrides the base log method to use Winston for logging.
   * @param {LogLevel} level - The log level of the message.
   * @param {(StringLike|Error)} msg - The message to be logged or an Error object.
   * @param {Error} [error] - An optional stack trace to include in the log.
   * @return {void}
   */
  protected override log(
    level: LogLevel,
    msg: StringLike | Error,
    error?: Error
  ) {
    const logData: LogEntry = {
      level: level,
      message: this.createLog(level, msg, error),
    };
    if (this.config("correlationId"))
      logData["correlationId"] = this.config("correlationId");
    this.winston.log(logData);
  }
}

/**
 * @description A factory function for creating Winston loggers.
 * @summary This is a {@link LoggerFactory} implementation that creates {@link WinstonLogger} instances.
 * @param {string} [context] - The context (typically the class name) for the logger.
 * @param {Partial<LoggingConfig>} [conf] - Optional configuration to override global settings.
 * @param {...any} _args - Additional arguments to pass to the WinstonLogger constructor.
 * @return {WinstonLogger} A new WinstonLogger instance.
 * @const WinstonFactory
 * @memberOf module:Logging
 */
export const WinstonFactory: LoggerFactory = (
  context?: string,
  conf?: Partial<LoggingConfig>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ..._args: any[]
): WinstonLogger => new WinstonLogger(context, conf);
