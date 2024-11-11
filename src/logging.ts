import { Logger } from "./interfaces";
import { LoggerFactory } from "./Factory";
import { LogLevel } from "./constants";
import { DefaultLoggerFactory } from "./default";

export class Logging {
  private static _level: LogLevel = LogLevel.Info;
  private static _factory: { new (level: LogLevel): LoggerFactory } =
    DefaultLoggerFactory;
  private static _instance: LoggerFactory;

  private static cacheByClass: Record<string, Logger> = {};
  private static cacheByClassMethod: Record<string, Record<string, Logger>> =
    {};
  private static global: Logger;

  private constructor() {}

  static get level() {
    return this._level;
  }

  static set level(level: LogLevel) {
    this._level = level;
  }

  protected static get instance(): LoggerFactory {
    if (!this._instance) this._instance = new this._factory(this.level);
    return this._instance;
  }

  static set factory(factory: { new (level: LogLevel): LoggerFactory }) {
    this._factory = factory;
  }

  static forClass(clazz: { new (...args: any[]): any }) {
    const name = clazz.name;
    if (!(name in this.cacheByClass))
      this.cacheByClass[name] = this.instance.forClass(clazz);
    return this.cacheByClass[name];
  }

  static forMethod(
    clazz: { new (...args: any[]): any },
    method: ((...args: any[]) => any) | string
  ): Logger {
    const name = clazz.name;
    if (!(name in this.cacheByClassMethod)) this.cacheByClassMethod[name] = {};
    const methodName = typeof method === "string" ? method : method.name;
    if (!(methodName in this.cacheByClassMethod[name]))
      this.cacheByClassMethod[name][methodName] = this.instance.forMethod(
        clazz,
        method
      );
    return this.cacheByClassMethod[name][methodName];
  }

  static get(): Logger {
    if (!this.global) this.global = this.instance.get();
    return this.global;
  }
}
