import { LogLevel } from "./constants";
import { Logging } from "./logging";
import { now } from "./time";
import { LoggedClass } from "./LoggedClass";
import { Logger } from "./types";

export type ArgFormatFunction = (...args: any[]) => string;
export type ReturnFormatFunction = (e?: Error, result?: any) => string;

/**
 * @description Method decorator for logging function calls.
 * @summary Wraps class methods to automatically log entry, exit, timing, and optional custom messages at a configurable {@link LogLevel}.
 * @param {LogLevel} level - Log level applied to the generated log statements (defaults to `LogLevel.info`).
 * @param {number} [verbosity=0] - Verbosity threshold required for the entry log to appear.
 * @param {ArgFormatFunction} [entryMessage] - Formatter invoked with the original method arguments to describe the invocation.
 * @param {ReturnFormatFunction} [exitMessage] - Optional formatter that describes the outcome or failure of the call.
 * @return {function(any, any, PropertyDescriptor): void} Method decorator proxy that injects logging behavior.
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
  verbosity = 0,
  entryMessage: ArgFormatFunction = (...args: any[]) => `called with ${args}`,
  exitMessage?: ReturnFormatFunction
) {
  return function log(target: any, propertyKey?: any, descriptor?: any) {
    if (!descriptor || typeof descriptor === "number")
      throw new Error(`Logging decoration only applies to methods`);
    const logger: Logger =
      target instanceof LoggedClass
        ? target["log"].for(target[propertyKey as keyof typeof target])
        : Logging.for(target).for(target[propertyKey]);
    const method = logger[level].bind(logger) as any;
    const originalMethod = descriptor.value;

    descriptor.value = new Proxy(originalMethod, {
      apply(fn, thisArg, args: any[]) {
        method(entryMessage(...args), verbosity);
        try {
          const result = Reflect.apply(fn, thisArg, args);
          if (result instanceof Promise) {
            return result
              .then((r: any) => {
                if (exitMessage) method(exitMessage(undefined, r));
                return r;
              })
              .catch((e) => {
                if (exitMessage) logger.error(exitMessage(e as Error));
                throw e;
              });
          }
          if (exitMessage) method(exitMessage(undefined, result));
          return result;
        } catch (err: unknown) {
          if (exitMessage) logger.error(exitMessage(err as Error));
          throw err;
        }
      },
    });
    return descriptor;
  };
}

/**
 * @description Method decorator that records execution time at the benchmark level.
 * @summary Wraps the target method to emit {@link Logger.benchmark} entries capturing completion time or failure latency.
 * @return {function(any, any,  PropertyDescriptor): void} Method decorator proxy that benchmarks the original implementation.
 * @function benchmark
 * @mermaid
 * sequenceDiagram
 *   participant Caller
 *   participant Decorator as benchmark
 *   participant Method as Original Method
 *   Caller->>Decorator: invoke()
 *   Decorator->>Method: Reflect.apply(...)
 *   alt Promise result
 *     Method-->>Decorator: Promise
 *     Decorator->>Decorator: attach then()
 *     Decorator->>Decorator: log completion duration
 *   else Synchronous result
 *     Method-->>Decorator: value
 *     Decorator->>Decorator: log completion duration
 *   end
 *   Decorator-->>Caller: return result
 * @category Method Decorators
 */
export function benchmark() {
  return function benchmark(target: any, propertyKey?: any, descriptor?: any) {
    if (!descriptor || typeof descriptor === "number")
      throw new Error(`benchmark decoration only applies to methods`);
    const logger: Logger =
      target instanceof LoggedClass
        ? target["log"].for(target[propertyKey as keyof typeof target])
        : Logging.for(target).for(target[propertyKey]);
    const originalMethod = descriptor.value;

    descriptor.value = new Proxy(originalMethod, {
      apply(fn, thisArg, args: any[]) {
        const start = now();
        try {
          const result = Reflect.apply(fn, thisArg, args);
          if (result instanceof Promise) {
            return result
              .then((r: any) => {
                logger.benchmark(`completed in ${now() - start}ms`);
                return r;
              })
              .catch((e) => {
                logger.benchmark(`failed in ${now() - start}ms`);
                throw e;
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

    return descriptor;
  };
}

/**
 * @description Method decorator for logging function calls with debug level.
 * @summary Convenience wrapper around {@link log} that logs using `LogLevel.debug`.
 * @return {function(any, any, PropertyDescriptor): void} Debug-level logging decorator.
 * @function debug
 * @category Method Decorators
 */
export function debug() {
  return log(
    LogLevel.debug,
    0,
    (...args: any[]) => `called with ${args}`,
    (e?: Error, result?: any) =>
      e
        ? `Failed with: ${e}`
        : result
          ? `Completed with ${JSON.stringify(result)}`
          : "completed"
  );
}

/**
 * @description Method decorator for logging function calls with info level.
 * @summary Convenience wrapper around {@link log} that logs using `LogLevel.info`.
 * @return {function(any, any, PropertyDescriptor): void} Info-level logging decorator.
 * @function info
 * @category Method Decorators
 */
export function info() {
  return log(LogLevel.info);
}

/**
 * @description Method decorator for logging function calls with silly level.
 * @summary Convenience wrapper around {@link log} that logs using `LogLevel.silly`.
 * @return {function(any, any, PropertyDescriptor): void} Silly-level logging decorator.
 * @function silly
 * @category Method Decorators
 */
export function silly() {
  return log(LogLevel.silly);
}

/**
 * @description Method decorator for logging function calls with trace level.
 * @summary Convenience wrapper around {@link log} that logs using `LogLevel.trace`.
 * @return {function(any, any, PropertyDescriptor): void} Trace-level logging decorator.
 * @function trace
 * @category Method Decorators
 */
export function trace() {
  return log(LogLevel.trace);
}

/**
 * @description Method decorator for logging function calls with verbose level.
 * @summary Convenience wrapper around {@link log} that logs using `LogLevel.verbose` with configurable verbosity.
 * @return {function(any, any, PropertyDescriptor): void} Verbose logging decorator.
 * @function verbose
 * @category Method Decorators
 */
export function verbose(): (
  target: any,
  propertyKey?: any,
  descriptor?: any
) => void;

/**
 * @description Method decorator for logging function calls with verbose level.
 * @summary Convenience wrapper around {@link log} that logs using `LogLevel.verbose` while toggling benchmarking.
 * @return {function(any, PropertyDescriptor): void} Verbose logging decorator.
 * @function verbose
 * @category Method Decorators
 */
export function verbose(): (
  target: any,
  propertyKey?: any,
  descriptor?: any
) => void;

/**
 * @description Method decorator for logging function calls with verbose level.
 * @summary Convenience wrapper around {@link log} that logs using `LogLevel.verbose` with configurable verbosity and optional benchmarking.
 * @param {number|boolean} verbosity - Verbosity level for log filtering or flag to enable benchmarking.
 * @return {function(any, any,PropertyDescriptor): void} Verbose logging decorator.
 * @function verbose
 * @category Method Decorators
 */
export function verbose(verbosity: number | boolean = 0) {
  if (!verbosity) {
    verbosity = 0;
  }
  return log(LogLevel.verbose, verbosity as number);
}

/**
 * @description Creates a decorator that makes a method non-configurable.
 * @summary Prevents overriding by marking the method descriptor as non-configurable, throwing if applied to non-method targets.
 * @return {function(object, any, PropertyDescriptor): PropertyDescriptor|undefined} Decorator that hardens the method descriptor.
 * @function final
 * @category Method Decorators
 */
export function final() {
  return (target: object, propertyKey?: any, descriptor?: any) => {
    if (!descriptor)
      throw new Error("final decorator can only be used on methods");
    if (descriptor?.configurable) {
      descriptor.configurable = false;
    }
    return descriptor;
  };
}
