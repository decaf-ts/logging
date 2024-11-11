import { Logger } from "./interfaces";
import { LogLevel } from "./constants";

export abstract class LoggerFactory {
  protected constructor(protected level: LogLevel) {}
  abstract forClass(clazz: { new (...args: any[]): any }): Logger;
  abstract forMethod(
    clazz: { new (...args: any[]): any },
    method: ((...args: any[]) => any) | string
  ): Logger;
  abstract get(): Logger;
}
