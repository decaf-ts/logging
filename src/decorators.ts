import { LogLevel } from "./constants";
import { Logging } from "./logging";

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
  verbosity = 0
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const log = Logging.for(target).for(target[propertyKey]);
    const method = log[level].bind(log);
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      method(`called with ${args}`, verbosity);
      const start = Date.now();
      let end: number;
      const result: any = originalMethod.apply(this, args);
      if (result instanceof Promise) {
        return result.then((r) => {
          if (benchmark) {
            end = Date.now();
            if (benchmark) method(`completed in ${end - start}ms`, verbosity);
          }
          return r;
        });
      }
      if (benchmark) {
        end = Date.now();
        if (benchmark) method(`completed in ${end - start}ms`, verbosity);
      }

      return result;
    };
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
export function verbose(): void;

/**
 * @description Method decorator for logging function calls with verbose level
 * @summary Convenience wrapper around the log decorator that uses LogLevel.verbose with configurable verbosity
 * @param {boolean} benchmark - Whether to log execution time
 * @return {Function} A method decorator that wraps the original method with verbose logging
 * @function verbose
 */
export function verbose(benchmark: boolean): void;

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
