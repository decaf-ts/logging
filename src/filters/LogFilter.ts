import { Logger, LoggingConfig, LoggingFilter } from "../types";
import { LoggedClass } from "../LoggedClass";

/**
 * @description Base class for message filters that plug into the logging pipeline.
 * @summary Extends {@link LoggedClass} to supply a scoped logger and defines the contract required by {@link LoggingFilter} implementers that transform or drop log messages before emission.
 * @class LogFilter
 * @example
 * class RedactSecretsFilter extends LogFilter {
 *   filter(config: LoggingConfig, message: string): string {
 *     return message.replace(/secret/gi, "***");
 *   }
 * }
 *
 * const filter = new RedactSecretsFilter();
 * filter.filter({ ...DefaultLoggingConfig, verbose: 0 }, "secret token");
 * @mermaid
 * sequenceDiagram
 *   participant Logger
 *   participant Filter as LogFilter
 *   participant Impl as ConcreteFilter
 *   participant Output
 *   Logger->>Filter: filter(config, message, context)
 *   Filter->>Impl: delegate to subclass implementation
 *   Impl-->>Filter: transformed message
 *   Filter-->>Output: return filtered message
 */
export abstract class LogFilter extends LoggedClass implements LoggingFilter {
  /**
   * @description Scoped logger that excludes other filters from the chain.
   * @summary Returns a child logger dedicated to the filter, preventing recursive filter invocation when emitting diagnostic messages.
   * @return {Logger} Context-aware logger for the filter instance.
   */
  override get log(): Logger {
    return super.log.for(this as any, { filters: [] });
  }

  /**
   * @description Transform or suppress a log message.
   * @summary Inspect the provided message and context to produce the value that will be forwarded to subsequent filters or emitters.
   * @param {LoggingConfig} config - Active logging configuration.
   * @param {string} message - Original log message payload.
   * @param {string[]} context - Context values attached to the message.
   * @return {string} Filtered message to pass to downstream processing.
   */
  abstract filter(
    config: LoggingConfig,
    message: string,
    context: string[]
  ): string;
}
