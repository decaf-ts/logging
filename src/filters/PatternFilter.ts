import { LogFilter } from "./LogFilter";
import { LoggingConfig } from "../types";
import { final } from "../decorators";

/**
 * @description A replacement callback that is used to transform RegExp matches.
 * @summary This function receives the matched substring and additional capture arguments, and returns the replacement text that will be injected into the log message.
 * @typedef {function(string, ...any): string} ReplacementFunction
 * @memberOf module:Logging
 */
export type ReplacementFunction = (substring: string, ...args: any[]) => string;

/**
 * @description A filter that patches log messages using regular expressions.
 * @summary This class applies a configured {@link RegExp} and replacement strategy to redact, mask, or restructure log payloads before they are emitted.
 * @param {RegExp} regexp - The expression to use for detecting sensitive or formatted text.
 * @param {(string|ReplacementFunction)} replacement - The replacement string or a callback that is invoked for each match.
 * @class PatternFilter
 * @example
 * const filter = new PatternFilter(/token=[^&]+/g, "token=***");
 * const sanitized = filter.filter(config, "token=123&user=tom", []);
 * // sanitized === "token=***&user=tom"
 * @mermaid
 * sequenceDiagram
 *   participant Logger
 *   participant Filter as PatternFilter
 *   participant RegExp
 *   Logger->>Filter: filter(config, message, context)
 *   Filter->>RegExp: execute match()
 *   alt match found
 *     RegExp-->>Filter: captures
 *     Filter->>RegExp: replace(message, replacement)
 *     RegExp-->>Filter: transformed message
 *   else no match
 *     RegExp-->>Filter: null
 *   end
 *   Filter-->>Logger: sanitized message
 */
export class PatternFilter extends LogFilter {
  constructor(
    protected readonly regexp: RegExp,
    protected readonly replacement: string | ReplacementFunction
  ) {
    super();
  }

  /**
   * @description Ensures deterministic RegExp matching.
   * @summary This method runs the configured expression, then resets its state so that repeated invocations behave consistently.
   * @param {string} message - The message to test for matches.
   * @return {(RegExpExecArray|null)} The match result, or null if no match is found.
   */
  @final()
  protected match(message: string) {
    const match = this.regexp.exec(message);
    this.regexp.lastIndex = 0;
    return match;
  }

  /**
   * @description Applies the replacement strategy to the incoming message.
   * @summary This method executes {@link PatternFilter.match} and, when a match is found, replaces every occurrence using the configured replacement handler.
   * @param {LoggingConfig} config - The active logging configuration (unused, but part of the filter contract).
   * @param {string} message - The message to be sanitized.
   * @param {string[]} context - The context entries that are associated with the log event.
   * @return {string} The sanitized log message.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filter(config: LoggingConfig, message: string, context: string[]): string {
    const log = this.log.for(this.filter);
    const match = this.match(message);
    if (!match) return message;
    try {
      return message.replace(this.regexp, this.replacement as any);
    } catch (e: unknown) {
      log.error(`PatternFilter replacement error: ${e}`);
    }
    return "";
  }
}
