import { LogLevel } from "./constants";

export interface LogData {
  organization?: string; // Organization or project name
  context?: string; // Bounded Context name
  app?: string; // Application or Microservice name
  sourceClass?: string; // Classname of the source
  correlationId?: string; // Correlation ID
  error?: Error; // Error object
  props?: Record<string, any>; // Additional custom properties
}

export interface Logger {
  log(
    level: LogLevel,
    message: string | Error,
    data?: LogData,
    profile?: string
  ): void;
  silly(message: string, data?: LogData, profile?: string): void;
  verbose(message: string, data?: LogData, profile?: string): void;
  debug(message: string, data?: LogData, profile?: string): void;
  info(message: string, data?: LogData, profile?: string): void;
  warn(message: string | Error, data?: LogData, profile?: string): void;
  error(message: string | Error, data?: LogData, profile?: string): void;
  emerg(message: string | Error, data?: LogData, profile?: string): void;
  profile(id: string | number, meta?: Record<string, any>): void;
}
