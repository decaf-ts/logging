import { Logging } from "./logging";
import { Logger } from "./types";

/**
 * @description Base class that provides a ready-to-use logger instance
 * @summary LoggedClass is a convenience abstract class that injects a type-safe logger
 * into derived classes through a protected getter. Subclasses can directly access
 * this.log to emit messages without manually creating a logger. This promotes
 * consistent, context-aware logging across the codebase.
 * @param {void} [constructor] - No constructor arguments; subclasses may define their own
 * @class LoggedClass
 * @example
 * class UserService extends LoggedClass {
 *   create(user: User) {
 *     this.log.info(`Creating user ${user.id}`);
 *   }
 * }
 *
 * const svc = new UserService();
 * svc.create({ id: "42" });
 * @mermaid
 * sequenceDiagram
 *   participant Client
 *   participant Instance as Subclass Instance
 *   participant Getter as LoggedClass.log
 *   participant Logging as Logging
 *   participant Logger as Logger
 *
 *   Client->>Instance: call someMethod()
 *   Instance->>Getter: access this.log
 *   Getter->>Logging: Logging.for(this)
 *   Logging-->>Getter: return Logger
 *   Getter-->>Instance: return Logger
 *   Instance->>Logger: info/debug/error(...)
 */
export abstract class LoggedClass {
  /**
   * @description Lazily provides a context-aware logger for the current instance
   * @summary Uses Logging.for(this) to create a logger whose context is the
   * subclass name, allowing uniform and structured logs from any inheriting class.
   * @return {Logger} A logger bound to the subclass context
   */
  protected get log(): Logger {
    return Logging.for(this as any);
  }

  protected constructor() {}
}
