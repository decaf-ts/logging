import { DefaultLoggerFactory } from "./default";
import { Logger } from "./interfaces";
import { LoggerFactory } from "./Factory";
import { LogLevel } from "./constants";

export class Logging {
  private static _level: LogLevel = LogLevel.Info;
  private static _factory = DefaultLoggerFactory;
  private static _instance: LoggerFactory;

  static get level() {
    return this._level;
  }

  protected static get factory(): LoggerFactory {
    if (!this._instance) this._instance = new this._factory(this.level);
    return this._instance;
  }

  static forClass(clazz: { new (...args: any[]): any }) {
    return this.factory.forClass(clazz);
  }

  static forMethod(
    clazz: { new (...args: any[]): any },
    method: ((...args: any[]) => any) | string
  ): Logger {
    return this.factory.forMethod(clazz, method);
  }

  static get(): Logger {
    return this.factory.get();
  }
}
