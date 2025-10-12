import { LogLevel } from "./constants";
import { Logging } from "./logging";
import { now } from "./time";
import { LoggedClass } from "./LoggedClass";
import { Logger } from "./types";

/**
 * @description Method decorator for logging function calls
 * @summary Creates a decorator that logs method calls with specified level, benchmarking, and verbosity
 * @param {LogLevel} level - The log level to use (default: LogLevel.info)
 * @param {boolean} [benchmark=false] - Whether to log execution time (default: false)
 * @param {number} [verbosity=0] - The verbosity level for the log messages (default: 0)
 * @return {Function} A method decorator that wraps the original method with logging
 * @function log
 * @mermaid
 * sequenceDiagram
 *   participant Client
 *   participant Decorator as log decorator
 *   participant Method as Original Method
 *   participant Logger as Logging instance
 *
 *   Client->>Decorator: call decorated method
 *   Decorator->>Logger: log method call
 *   Decorator->>Method: call original method
 *   alt result is Promise
 *     Method-->>Decorator: return Promise
 *     Decorator->>Decorator: attach then handler
 *     Note over Decorator: Promise resolves
 *     Decorator->>Logger: log benchmark (if enabled)
 *     Decorator-->>Client: return result
 *   else result is not Promise
 *     Method-->>Decorator: return result
 *     Decorator->>Logger: log benchmark (if enabled)
 *     Decorator-->>Client: return result
 *   end
 * @category Method Decorators
 */
export function log(
  level: LogLevel = LogLevel.info,
  benchmark: boolean = false,
  verbosity = 0,
  entryMessage: (...args: any[]) => string = (...args: any[]) =>
    `called with ${args}`,
  exitMessage?: (e?: Error, result?: any) => string
) {
  return function log(
    target: any,
    propertyKey?: any,
    descriptor?: PropertyDescriptor
  ) {
    if (!descriptor || typeof descriptor === "number")
      throw new Error(`Logging decoration only applies to methods`);
    const isLoggedClass = target instanceof LoggedClass;
    const logger =
      target.log && target.log.info
        ? target.log.for(target[propertyKey])
        : Logging.for(target).for(target[propertyKey]);
    const method = logger[level].bind(logger) as any;
    const originalMethod = descriptor.value;

    descriptor.value = new Proxy(originalMethod, {
      apply(fn, thisArg, args: any[]) {
        method(entryMessage(...args), verbosity);
        const start = now();
        try {
          const result = Reflect.apply(fn, thisArg, args);
          if (result instanceof Promise) {
            return result.then((r: any) => {
              if (benchmark)
                method(`completed in ${now() - start}ms`, verbosity);
              return r;
            });
          }
          if (benchmark) method(`completed in ${now() - start}ms`, verbosity);
          if (exitMessage) method(exitMessage(undefined, result));
          return result;
        } catch (err: unknown) {
          if (benchmark)
            logger.error(`failed in ${now() - start}ms`, verbosity);
          if (exitMessage) logger.error(exitMessage(err as Error));
          throw err;
        }
      },
    });
  };
}

export function benchmark() {
  return function benchmark(
    target: any,
    propertyKey?: any,
    descriptor?: PropertyDescriptor
  ) {
    if (!descriptor || typeof descriptor === "number")
      throw new Error(`benchmark decoration only applies to methods`);
    const isLoggedClass = target instanceof LoggedClass;
    const logger: Logger =
      target.log && target.log.info
        ? target.log.for(target[propertyKey])
        : Logging.for(target).for(target[propertyKey]);
    const originalMethod = descriptor.value;

    descriptor.value = new Proxy(originalMethod, {
      apply(fn, thisArg, args: any[]) {
        const start = now();
        try {
          const result = Reflect.apply(fn, thisArg, args);
          if (result instanceof Promise) {
            return result.then((r: any) => {
              logger.benchmark(`completed in ${now() - start}ms`);
              return r;
            });
          }
          logger.benchmark(`completed in ${now() - start}ms`);
          return result;
        } catch (err: unknown) {
          logger.benchmark(`failed in ${now() - start}ms`);
          throw err;
        }
      },
    });
  };
}

/**
 * @description Method decorator for logging function calls with debug level
 * @summary Convenience wrapper around the log decorator that uses LogLevel.debug
 * @param {boolean} [benchmark=false] - Whether to log execution time (default: false)
 * @return {Function} A method decorator that wraps the original method with debug logging
 * @function debug
 * @category Method Decorators
 */
export function debug(benchmark: boolean = false) {
  return log(LogLevel.debug, benchmark);
}

/**
 * @description Method decorator for logging function calls with info level
 * @summary Convenience wrapper around the log decorator that uses LogLevel.info
 * @param {boolean} [benchmark=false] - Whether to log execution time (default: false)
 * @return {Function} A method decorator that wraps the original method with info logging
 * @function info
 * @category Method Decorators
 */
export function info(benchmark: boolean = false) {
  return log(LogLevel.info, benchmark);
}

/**
 * @description Method decorator for logging function calls with silly level
 * @summary Convenience wrapper around the log decorator that uses LogLevel.silly
 * @param {boolean} [benchmark=false] - Whether to log execution time (default: false)
 * @return {Function} A method decorator that wraps the original method with silly logging
 * @function silly
 * @category Method Decorators
 */
export function silly(benchmark: boolean = false) {
  return log(LogLevel.silly, benchmark);
}

/**
 * @description Method decorator for logging function calls with verbose level
 * @summary Convenience wrapper around the log decorator that uses LogLevel.verbose with configurable verbosity
 * @return {Function} A method decorator that wraps the original method with verbose logging
 * @function verbose
 */
export function verbose(): (
  target: any,
  propertyKey?: any,
  descriptor?: any
) => void;

/**
 * @description Method decorator for logging function calls with verbose level
 * @summary Convenience wrapper around the log decorator that uses LogLevel.verbose with configurable verbosity
 * @param {boolean} benchmark - Whether to log execution time
 * @return {Function} A method decorator that wraps the original method with verbose logging
 * @function verbose
 */
export function verbose(
  benchmark: boolean
): (target: any, propertyKey?: any, descriptor?: any) => void;

/**
 * @description Method decorator for logging function calls with verbose level
 * @summary Convenience wrapper around the log decorator that uses LogLevel.verbose with configurable verbosity
 * @param {number} verbosity - The verbosity level for the log messages (default: 0)
 * @return {Function} A method decorator that wraps the original method with verbose logging
 * @function verbose
 * @category Method Decorators
 */
export function verbose(
  verbosity: number | boolean
): (target: any, propertyKey?: any, descriptor?: any) => void;
/**
 * @description Method decorator for logging function calls with verbose level
 * @summary Convenience wrapper around the log decorator that uses LogLevel.verbose with configurable verbosity
 * @param {number} verbosity - The verbosity level for the log messages (default: 0)
 * @param {boolean} [benchmark=false] - Whether to log execution time (default: false)
 * @return {Function} A method decorator that wraps the original method with verbose logging
 * @function verbose
 * @category Method Decorators
 */
export function verbose(verbosity: number | boolean = 0, benchmark?: boolean) {
  if (typeof verbosity === "boolean") {
    benchmark = verbosity;
    verbosity = 0;
  }
  return log(LogLevel.verbose, benchmark, verbosity);
}

/**
 * @description Creates a decorator that makes a method non-configurable
 * @summary This decorator prevents a method from being overridden by making it non-configurable.
 * It throws an error if used on anything other than a method.
 * @return {Function} A decorator function that can be applied to methods
 * @function final
 * @category Method Decorators
 */
export function final() {
  return (
    target: object,
    propertyKey?: any,
    descriptor?: PropertyDescriptor
  ) => {
    if (!descriptor)
      throw new Error("final decorator can only be used on methods");
    if (descriptor?.configurable) {
      descriptor.configurable = false;
    }
    return descriptor;
  };
}
