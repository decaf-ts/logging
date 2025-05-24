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

      function finish(res: any, error?: Error) {
        if (benchmark) end = Date.now();
        const msg = [`${error ? "failed" : "completed"}`];
        if (benchmark) msg.push(` in ${end - start}ms`);
        msg.push(`: ${error ? "Error" : "Result"}: ${error ? error : res}`);
        method(msg.join(""), verbosity);
        if (error) throw error;
        return res;
      }

      let result: any;
      try {
        result = originalMethod.apply(this, args);
      } catch (e: unknown) {
        return finish(undefined, e as Error);
      }
      if (result instanceof Promise) {
        return result.then(finish).catch((e) => finish(undefined, e));
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
