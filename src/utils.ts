import { LogLevel, NumericLogLevels } from "./constants";

export function toLogLevel(level: LogLevel): number {
  if (level.toString() in NumericLogLevels) {
    return (NumericLogLevels as Record<string, any>)[level.toString()];
  }
  throw new Error(`Invalid level: ${level.toString()}`);
}
