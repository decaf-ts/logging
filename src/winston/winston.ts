import winston, { LogEntry, LoggerOptions } from "winston";
import Transport from "winston-transport";
import { Logger, LoggerFactory, LoggingConfig, StringLike } from "../types";
import { Logging, MiniLogger } from "../logging";
import { LogLevel } from "../constants";

export class WinstonLogger extends MiniLogger implements Logger {
  protected winston: winston.Logger;

  constructor(
    cont: string,
    conf?: Partial<LoggingConfig>,
    id?: string,
    protected transports?: Transport[] | Transport
  ) {
    super(cont, conf, id);
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

  protected log(level: LogLevel, msg: StringLike | Error, stack?: string) {
    const logData: LogEntry = {
      level: level,
      message: this.createLog(level, msg, stack),
    };
    if (this.id) logData["correlationId"] = this.id;
    this.winston.log(logData);
  }
}

export const WinstonFactory: LoggerFactory = (
  context: string,
  conf?: Partial<LoggingConfig>,
  id?: string
) => new WinstonLogger(context, conf, id);
