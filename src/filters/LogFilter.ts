import { Logger, LoggingConfig, LoggingFilter } from "../types";
import { LoggedClass } from "../LoggedClass";

export abstract class LogFilter extends LoggedClass implements LoggingFilter {
  override get log(): Logger {
    return super.log.for(this as any, { filters: [] });
  }

  abstract filter(
    config: LoggingConfig,
    message: string,
    context: string[]
  ): string;
}
