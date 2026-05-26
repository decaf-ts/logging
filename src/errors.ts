/**
 * @description Base error class for the repository module
 * @summary Abstract base error class that all other error types extend from. Provides common error handling functionality and standardized HTTP code mapping.
 * @param {string} name - The name of the error
 * @param {string|Error} msg - The error message or Error object to wrap
 * @param {number} code - The HTTP status code associated with this error
 * @return {void}
 * @class BaseError
 * @example
 * // This is an abstract class and should not be instantiated directly
 * // Instead, use one of the concrete error classes:
 * throw new ValidationError('Invalid data provided');
 * @mermaid
 * sequenceDiagram
 *   participant C as Caller
 *   participant E as BaseError
 *   C->>E: new BaseError(name,msg,code)
 *   E-->>C: Error instance with message and code
 * @category Errors
 */
export abstract class BaseError extends Error {
  readonly code!: number;

  protected constructor(name: string, msg: string | Error, code: number) {
    if (msg instanceof BaseError) return msg;
    const message = `[${name}][${code}] ${msg instanceof Error ? msg.message : msg}`;
    super(message);
    this.code = code;
    if (msg instanceof Error) this.stack = msg.stack;
  }

  override get message() {
    return `[${this.name}] ${this.code} | ${super.message.replaceAll(/\[.*?Error\]\[\d+\]\s/g, "")}`;
  }

  override toString(): string {
    return this.message;
  }
}
