import { Logging } from "./logging";
import { Logger } from "./types";

/**
 * @description Base class that provides a ready-to-use logger instance.
 * @summary Supplies inheriting classes with a lazily created, context-aware {@link Logger} via the protected `log` getter, promoting consistent structured logging without manual wiring.
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
  private _log?: Logger;

  /**
   * @description Lazily provides a context-aware logger for the current instance.
   * @summary Calls {@link Logging.for} with the subclass instance to obtain a logger whose context matches the subclass name.
   * @return {Logger} Logger bound to the subclass context.
   */
  protected get log(): Logger {
    if (!this._log) this._log = Logging.for(this as any);
    return this._log;
  }

  protected constructor() {}
}
