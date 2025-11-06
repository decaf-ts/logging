import pino, {
  DestinationStream,
  Logger as PinoBaseLogger,
  LoggerOptions as PinoLoggerOptions,
} from "pino";
import { Logging, MiniLogger } from "../logging";
import { Logger, LoggerFactory, LoggingConfig, StringLike } from "../types";
import { LogLevel, NumericLogLevels } from "../constants";

type PinoLogMethod = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

const LogLevelToPino: Record<LogLevel, PinoLogMethod> = {
  [LogLevel.benchmark]: "info",
  [LogLevel.error]: "error",
  [LogLevel.warn]: "warn",
  [LogLevel.info]: "info",
  [LogLevel.verbose]: "debug",
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

const isPinoLogger = (candidate?: unknown): candidate is PinoBaseLogger => {
  if (!candidate || typeof candidate !== "object") return false;
  const required = ["info", "error", "warn", "debug", "trace"];
  return required.every(
    (method) =>
      typeof (candidate as Record<string, unknown>)[method] === "function"
  );
};

const toPinoLevel = (level: LogLevel): PinoLogMethod =>
  LogLevelToPino[level] ?? "info";

const fromPinoLevel = (level?: string): LogLevel | undefined => {
  if (!level) return undefined;
  return PinoToLogLevel[level as PinoLogMethod];
};

const buildPinoOptions = (
  context: string,
  config: LoggingConfig,
  candidate?: PinoLoggerOptions
): PinoLoggerOptions => {
  const options: PinoLoggerOptions = {
    level: toPinoLevel(config.level),
    name: context,
    ...((candidate as PinoLoggerOptions) || {}),
  };
  if (!options.level) options.level = toPinoLevel(config.level);
  if (!options.name) options.name = context;
  return options;
};

/**
 * @description Logger adapter that wraps Pino while preserving MiniLogger behaviours.
 * @summary Provides a Pino-backed logger that stays compatible with the MiniLogger contract and Pino's native API.
 */
type PinoDriverConfig = {
  instance?: PinoBaseLogger;
  options?: PinoLoggerOptions;
  destination?: DestinationStream;
};

const mergePinoConfig = (
  base?: PinoDriverConfig,
  overrides?: PinoDriverConfig
): PinoDriverConfig => {
  if (!base && !overrides) return {};
  return {
    ...(base || {}),
    ...(overrides || {}),
    options: {
      ...(base?.options || {}),
      ...(overrides?.options || {}),
    },
  };
};

const extractPinoConfig = (
  config?: Partial<LoggingConfig>
): PinoDriverConfig => {
  if (!config) return {};
  const raw = (config as { pino?: PinoDriverConfig }).pino;
  if (!raw || typeof raw !== "object") return {};

  return {
    instance: raw.instance as PinoBaseLogger | undefined,
    options: raw.options as PinoLoggerOptions | undefined,
    destination: raw.destination as DestinationStream | undefined,
  };
};

const getPinoConfig = (
  globalConfig: Partial<LoggingConfig>,
  instanceConfig?: Partial<LoggingConfig>
): PinoDriverConfig =>
  mergePinoConfig(
    extractPinoConfig(globalConfig),
    extractPinoConfig(instanceConfig)
  );

export class PinoLogger extends MiniLogger implements Logger {
  protected pino: PinoBaseLogger;
  private readonly childLoggers = new Map<string, PinoBaseLogger>();

  constructor(
    context: string,
    conf?: Partial<LoggingConfig>
  ) {
    super(context, conf);
    const globalConfig = Logging.getConfig();
    const config: LoggingConfig = Object.assign({}, globalConfig, this.conf || {});
    const pinoConfig = getPinoConfig(globalConfig, this.conf);

    if (isPinoLogger(pinoConfig.instance)) {
      this.pino = pinoConfig.instance;
      const logLevel = fromPinoLevel(this.pino.level);
      if (logLevel) this.conf = { ...(this.conf || {}), level: logLevel };
    } else {
      const options = buildPinoOptions(context, config, pinoConfig.options);
      this.pino = pino(options, pinoConfig.destination);
    }
  }

  private activePino(): PinoBaseLogger {
    const override = this.config("pino") as PinoDriverConfig | undefined;
    if (override && override.instance && isPinoLogger(override.instance)) {
      return override.instance;
    }
    return this.pino;
  }

  protected override log(
    level: LogLevel,
    msg: StringLike | Error,
    error?: Error
  ): void {
    const configuredLevel = (this.config("level") as LogLevel) || LogLevel.info;
    if (NumericLogLevels[configuredLevel] < NumericLogLevels[level]) return;

    const formatted = this.createLog(level, msg, error);
    const methodName = toPinoLevel(level);
    const target = this.activePino();
    const emitter = target[methodName];

    if (typeof emitter === "function") {
      (emitter as (payload: unknown) => void).call(target, formatted);
      return;
    }

    if (typeof target["log" as keyof typeof target] === "function") {
      (target as any).log({
        level: methodName,
        msg: formatted,
      });
      return;
    }
  }

  fatal(msg: StringLike | Error, error?: Error): void {
    const formatted = this.createLog(LogLevel.error, msg, error);
    const target = this.activePino();
    const fatal = (target as any).fatal;
    if (typeof fatal === "function") {
      (fatal as (payload: unknown) => void).call(target, formatted);
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

    const combinedContext = nextContext
      ? [this.context, nextContext].join(
          this.config("contextSeparator") as string
        )
      : this.context;

    const key = combinedContext;
    let childPino = this.childLoggers.get(key);
    if (!childPino) {
      childPino =
        typeof this.pino.child === "function"
          ? this.pino.child(bindings, options)
          : this.pino;
      this.childLoggers.set(key, childPino);
    }

    const baseConfig = getPinoConfig(Logging.getConfig(), this.conf);
    const overrides: Partial<LoggingConfig> = {
      pino: mergePinoConfig(baseConfig, { instance: childPino }),
    };

    if (nextContext) {
      return super.for(nextContext, overrides) as PinoLogger;
    }
    return super.for(overrides) as PinoLogger;
  }

  flush(): void | Promise<void> {
    const target = this.activePino();
    if (typeof target.flush === "function") {
      return target.flush();
    }
  }

  get level(): string | undefined {
    const target = this.activePino();
    return target.level;
  }

  set level(value: string | undefined) {
    if (!value) return;
    const target = this.activePino();
    (target as any).level = value;
    const mapped = fromPinoLevel(value);
    if (mapped) this.setConfig({ level: mapped });
  }
}

/**
 * @description Factory function returning a Pino-backed logger.
 * @summary Allows registering the Pino logger with the global Logging facade.
 */
export const PinoFactory: LoggerFactory = (
  context: string,
  conf?: Partial<LoggingConfig>,
  ...args: any[]
) => {
  const shallowClone = conf
    ? {
        ...conf,
        pino: conf.pino ? { ...conf.pino } : undefined,
      }
    : {};
  const normalized: Partial<LoggingConfig> = shallowClone;

  const ensurePinoConfig = (): PinoDriverConfig => {
    const current = (normalized as { pino?: PinoDriverConfig }).pino;
    if (current) return current;
    const fresh: PinoDriverConfig = {};
    (normalized as { pino?: PinoDriverConfig }).pino = fresh;
    return fresh;
  };

  const [firstArg, secondArg] = args;
  if (isPinoLogger(firstArg)) {
    const pinoConfig = ensurePinoConfig();
    pinoConfig.instance = firstArg;
  } else if (firstArg) {
    const pinoConfig = ensurePinoConfig();
    pinoConfig.options = {
      ...(pinoConfig.options || {}),
      ...(firstArg as PinoLoggerOptions),
    };
    if (secondArg !== undefined) pinoConfig.destination = secondArg;
  }

  return new PinoLogger(context, normalized);
};
