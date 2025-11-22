import { Logger, LoggingConfig, LoggingFilter } from "../types";
import { LoggedClass } from "../LoggedClass";

/**
 * @description A base class for message filters that can be plugged into the logging pipeline.
 * @summary This class extends {@link LoggedClass} to supply a scoped logger, and defines the contract that is required by {@link LoggingFilter} implementers that transform or drop log messages before emission.
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
   * @description A scoped logger that excludes other filters from the chain.
   * @summary This method returns a child logger that is dedicated to the filter, which prevents recursive filter invocation when emitting diagnostic messages.
   * @return {Logger} A context-aware logger for the filter instance.
   */
  override get log(): Logger {
    return super.log.for(this as any, { filters: [] });
  }

  /**
   * @description Transforms or suppresses a log message.
   * @summary This method inspects the provided message and context to produce the value that will be forwarded to subsequent filters or emitters.
   * @param {LoggingConfig} config - The active logging configuration.
   * @param {string} message - The original log message payload.
   * @param {string[]} context - The context values that are attached to the message.
   * @return {string} The filtered message to pass to downstream processing.
   */
  abstract filter(
    config: LoggingConfig,
    message: string,
    context: string[]
  ): string;
}
