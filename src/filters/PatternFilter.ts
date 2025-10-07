import { LogFilter } from "./LogFilter";
import { LoggingConfig } from "../types";
import { final } from "../decorators";

export type ReplacementFunction = (substring: string, ...args: any[]) => string;

export class PatternFilter extends LogFilter {
  constructor(
    protected readonly regexp: RegExp,
    protected readonly replacement: string | ReplacementFunction
  ) {
    super();
  }

  @final()
  protected match(message: string) {
    const match = this.regexp.exec(message);
    this.regexp.lastIndex = 0;
    return match;
  }

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
