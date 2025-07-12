import { Logging } from "./logging";
import { Logger } from "./types";

export abstract class LoggedClass {
  protected get log(): Logger {
    return Logging.for(this as any);
  }

  protected constructor() {}
}
