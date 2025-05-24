import { LogLevel } from "./constants";
import { Logging } from "./logging";

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

export function debug(benchmark: boolean = false) {
  return log(LogLevel.debug, benchmark);
}

export function info(benchmark: boolean = false) {
  return log(LogLevel.info, benchmark);
}

export function silly(benchmark: boolean = false) {
  return log(LogLevel.silly, benchmark);
}

export function verbose(verbosity = 0, benchmark: boolean = false) {
  return log(LogLevel.verbose, benchmark, verbosity);
}
