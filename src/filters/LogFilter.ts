import { LoggingConfig, LoggingFilter } from "../types";
import { LoggedClass } from "../LoggedClass";

export abstract class LogFilter extends LoggedClass implements LoggingFilter {
  override get log() {
    return super.log.for(this, { filters: [] });
  }

  abstract filter(
    config: LoggingConfig,
    message: string,
    context: string[]
  ): string;
}
