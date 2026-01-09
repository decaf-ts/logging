import pino, {
  DestinationStream,
  Logger as PinoBaseLogger,
  LoggerOptions as PinoLoggerOptions,
  multistream,
} from "pino";
import { Logging, MiniLogger } from "../logging";
import { Logger, LoggerFactory, LoggingConfig, StringLike } from "../types";
import { LogLevel } from "../constants";

type PinoLogMethod =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "verbose"
  | "fatal";

const LogLevelToPino: Record<LogLevel, PinoLogMethod> = {
  [LogLevel.benchmark]: "info",
  [LogLevel.error]: "error",
  [LogLevel.warn]: "warn",
  [LogLevel.info]: "info",
  [LogLevel.verbose]: "info",
  [LogLevel.debug]: "debug",
  [LogLevel.trace]: "trace",
  [LogLevel.silly]: "trace",
};

const PinoToLogLevel: Partial<Record<PinoLogMethod, LogLevel>> = {
  fatal: LogLevel.error,
  error: LogLevel.error,
  warn: LogLevel.warn,
  info: LogLevel.info,
  debug: LogLevel.debug,
  trace: LogLevel.trace,
};

const toPinoLevel = (level: LogLevel): PinoLogMethod =>
  LogLevelToPino[level] ?? "info";

const fromPinoLevel = (level?: string): LogLevel | undefined => {
  if (!level) return undefined;
  return PinoToLogLevel[level as PinoLogMethod];
};

const joinContext = (segments: string[], separator: string): string => {
  if (!segments.length) return "Logger";
  return segments.join(separator);
};

const buildPinoOptions = (
  context: string,
  config: LoggingConfig,
  overrides?: PinoLoggerOptions
): PinoLoggerOptions => {
  const options: PinoLoggerOptions = {
    level: toPinoLevel(config.level),
    name: context,
    ...overrides,
  };
  if (!options.level) options.level = toPinoLevel(config.level);
  if (!options.name) options.name = context;
  options.timestamp = config.timestamp ? () => new Date().toISOString() : false;
  return options;
};

const isDestinationStream = (
  candidate: unknown
): candidate is DestinationStream => {
  if (!candidate || typeof candidate !== "object") return false;
  return typeof (candidate as DestinationStream).write === "function";
};

const buildDestination = (
  transports?: DestinationStream[]
): DestinationStream | undefined => {
  if (!transports || transports.length === 0) return undefined;
  const streams = transports.filter(isDestinationStream);
  if (streams.length <= 1) return streams[0];
  return multistream(streams.map((stream) => ({ stream })));
};

/**
 * @description A logger that is powered by the Pino logging library.
 * @summary This class extends {@link MiniLogger} and uses Pino as its underlying logging engine.
 * @param {string} [context] - The context (typically the class name) that this logger is associated with.
 * @param {Partial<LoggingConfig>} [conf] - Optional configuration to override global settings.
 * @param {PinoBaseLogger} [driver] - An optional, pre-existing Pino logger instance to use.
 * @class PinoLogger
 */
export class PinoLogger extends MiniLogger implements Logger {
  protected pino: PinoBaseLogger;

  constructor(
    context?: string,
    conf?: Partial<LoggingConfig>,
    driver?: PinoBaseLogger
  ) {
    super(context, conf);
    if (driver) {
      this.pino = driver;
      const derivedLevel = fromPinoLevel(driver.level);
      if (derivedLevel) this.setConfig({ level: derivedLevel });
      return;
    }

    const globalConfig = Logging.getConfig();
    const config = Object.assign(
      {},
      globalConfig,
      this.conf || {}
    ) as LoggingConfig<DestinationStream>;

    const separator =
      (config.contextSeparator as string) ||
      (Logging.getConfig().contextSeparator as string);
    const contextName = joinContext(
      Array.isArray(this.context) ? this.context : [],
      separator
    );
    const options = buildPinoOptions(contextName, config);
    const destination = buildDestination(
      (config.transports as DestinationStream[] | undefined) || undefined
    );
    this.pino = pino(options, destination);
  }

  protected override log(
    level: LogLevel,
    msg: StringLike | Error,
    error?: Error
  ): void {
    const formatted = this.createLog(level, msg, error);
    const methodName = toPinoLevel(level);
    const emitter = this.pino[methodName as keyof typeof this.pino];

    if (typeof emitter === "function") {
      (emitter as (payload: unknown) => void).call(this.pino, formatted);
      return;
    }

    if (typeof (this.pino as any).log === "function") {
      (this.pino as any).log({
        level: methodName,
        msg: formatted,
      });
    }
  }

  fatal(msg: StringLike | Error, error?: Error): void {
    const formatted = this.createLog(LogLevel.error, msg, error);
    const fatal = (this.pino as any).fatal;
    if (typeof fatal === "function") {
      (fatal as (payload: unknown) => void).call(this.pino, formatted);
    } else {
      this.error(msg, error);
    }
  }

  child(
    bindings: Record<string, unknown> = {},
    options?: Record<string, unknown>
  ): PinoLogger {
    const nextContext =
      typeof bindings.context === "string"
        ? bindings.context
        : typeof bindings.name === "string"
          ? bindings.name
          : undefined;

    const childInstance =
      typeof this.pino.child === "function"
        ? this.pino.child(bindings, options)
        : this.pino;
    const childLogger = new PinoLogger(
      nextContext ??
        joinContext(
          this.context,
          (this.config("contextSeparator") as string) || "."
        ),
      this.conf,
      childInstance
    );
    childLogger.context = nextContext
      ? [...this.context, nextContext]
      : [...this.context];
    return childLogger;
  }

  flush(): void | Promise<void> {
    if (typeof (this.pino as any).flush === "function") {
      return (this.pino as any).flush();
    }
  }

  get level(): string | undefined {
    return this.pino.level;
  }

  set level(value: string | undefined) {
    if (!value) return;
    this.pino.level = value;
    const mapped = fromPinoLevel(value);
    if (mapped) this.setConfig({ level: mapped });
  }
}

/**
 * @description A factory for creating {@link PinoLogger} instances.
 * @summary This factory function creates a new {@link PinoLogger} instance, and can optionally accept a pre-existing Pino logger instance.
 * @const {LoggerFactory} PinoFactory
 * @memberOf module:Logging
 */
export const PinoFactory: LoggerFactory = (
  context?: string,
  conf?: Partial<LoggingConfig>,
  ...args: any[]
) => {
  const [driver] = args as [PinoBaseLogger | undefined];
  return new PinoLogger(context, conf, driver);
};
