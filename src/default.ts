import { LoggerFactory } from "./Factory";
import { Logger } from "./interfaces";
import * as winston from "winston";
import { LogLevel } from "./constants";
import { LoggerOptions } from "winston";

export class DefaultLoggerFactory extends LoggerFactory {
  constructor(level: LogLevel) {
    super(level);
  }

  private generate(lvl: LogLevel, clazz?: string, method?: string) {
    const config: LoggerOptions = {
      level: lvl,
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.splat(),
            winston.format.simple()
          ),
        }),
      ],
    };
    let meta: Record<string, unknown>;
    if (clazz || method) {
      meta = {};
      if (clazz) meta["service"] = clazz;
      if (method) meta["method"] = method;
      config.defaultMeta = meta;
    }
    return winston.createLogger(config);
  }

  forClass(clazz: { new (...args: any[]): any }): Logger {
    return this.generate(this.level, clazz.name);
  }
  forMethod(
    clazz: { new (...args: any[]): any },
    method: ((...args: any[]) => any) | string
  ): Logger {
    return this.generate(
      this.level,
      clazz.name,
      typeof method === "string" ? method : method.name
    );
  }
  get(): Logger {
    return this.generate(this.level);
  }
}
