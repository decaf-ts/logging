import { LoggerFactory } from "./Factory";
import { LogLevel } from "./constants";
import { LogData, Logger } from "./interfaces";
import { toLogLevel } from "./utils";

class DefaultLogger implements Logger {
  constructor(
    protected level: LogLevel,
    protected clazz?: string,
    protected method?: string
  ) {}

  log(
    level: LogLevel,
    message: string | Error,
    data?: LogData | undefined,
    profile?: string | undefined
  ): void {
    if (toLogLevel(level) < toLogLevel(this.level)) return;

    const { context, app } = data || {};

     
    const msg = `${profile ? `[${profile}]` : ""}${app ? `[${app}]` : ""}${context ? `[${context}]` : ""}${this.clazz ? `[${this.clazz}]` : ""}${this.method ? `[${this.method}]` : ""} ${message}`;
    switch (level) {
    case LogLevel.Fatal:
    case LogLevel.Error:
      return console.error(msg);
    case LogLevel.Warn:
      return console.warn(msg);
    case LogLevel.Info:
      return console.info(msg);
    case LogLevel.Http:
    case LogLevel.Verbose:
    case LogLevel.Debug:
    case LogLevel.Silly:
      return console.debug(msg);
    default:
      throw new Error(`Invalid log level: ${level}`);
    }
  }
  silly(
    message: string,
    data?: LogData | undefined,
    profile?: string | undefined
  ): void {
    return this.log(LogLevel.Silly, message, data, profile);
  }

  verbose(
    message: string,
    data?: LogData | undefined,
    profile?: string | undefined
  ): void {
    return this.log(LogLevel.Verbose, message, data, profile);
  }

  debug(
    message: string,
    data?: LogData | undefined,
    profile?: string | undefined
  ): void {
    return this.log(LogLevel.Debug, message, data, profile);
  }
  info(
    message: string,
    data?: LogData | undefined,
    profile?: string | undefined
  ): void {
    return this.log(LogLevel.Info, message, data, profile);
  }
  warn(
    message: string | Error,
    data?: LogData | undefined,
    profile?: string | undefined
  ): void {
    return this.log(LogLevel.Warn, message, data, profile);
  }
  error(
    message: string | Error,
    data?: LogData | undefined,
    profile?: string | undefined
  ): void {
    return this.log(LogLevel.Error, message, data, profile);
  }
  emerg(
    message: string | Error,
    data?: LogData | undefined,
    profile?: string | undefined
  ): void {
    return this.log(LogLevel.Fatal, message, data, profile);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  profile(id: string | number, meta?: Record<string, any> | undefined): void {
    throw new Error("Not implemented");
  }
}

export class DefaultLoggerFactory extends LoggerFactory {
  constructor(level: LogLevel) {
    super(level);
  }

  forClass(clazz: new (...args: any[]) => any): Logger {
    return new DefaultLogger(this.level, clazz.name);
  }
  forMethod(
    clazz: new (...args: any[]) => any,
    method: string | ((...args: any[]) => any)
  ): Logger {
    return new DefaultLogger(
      this.level,
      clazz.name,
      typeof method === "string" ? method : method.name
    );
  }

  get(): Logger {
    return new DefaultLogger(this.level);
  }
}
