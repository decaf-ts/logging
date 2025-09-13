# Logging Library — Detailed Description

The logging package is a lightweight, extensible logging solution for TypeScript projects. It centers on two main constructs:
- MiniLogger — a minimal, context-aware logger used by default.
- Logging — a static facade that manages global configuration, creates loggers for classes/functions/strings, and applies optional theming.

It also offers:
- A concise set of decorators (log, debug, info, verbose, silly) to instrument methods with consistent logging and optional benchmarking.
- Pluggable factories so that alternate implementations (e.g., WinstonLogger) can be used without changing call sites.
- Strong typing for configuration and theming primitives.

Core files and their roles
- src/types.ts: Type definitions and contracts
  - Logger: the runtime contract with methods silly, verbose, info, debug, error, for, setConfig.
  - LoggingConfig: runtime configuration for filtering, formatting, and styling.
  - LoggerFactory: factory signature returning a Logger for a given context and optional config.
  - Theme/ThemeOption/ThemeOptionByLogLevel: shape of color and style configuration, optionally varying by LogLevel.
  - Additional helpers: StringLike, AnyFunction, Class, LoggingContext.

- src/constants.ts: Defaults and enums
  - LogLevel: error | info | verbose | debug | silly (string values), plus NumericLogLevels for filtering.
  - LoggingMode: RAW | JSON (current implementation focuses on RAW; JSON is available for adapters like Winston).
  - DefaultTheme: sensible default colors/styles per component and per log level.
  - DefaultLoggingConfig: default global configuration (info level, no styling, timestamp on, etc.).

- src/logging.ts: Implementations and static facade
  - MiniLogger: A small, dependency-light logger that:
    - Generates formatted log strings (timestamp, log level, context, correlation id, message, stack) according to config.
    - Supports child loggers via .for(method|config) with a Proxy to overlay per-child config and extend the context (class.method).
    - Emits to console.log/console.debug/console.error based on level. Verbosity controls .silly output (gated by config.verbose).
  - Logging: The static entry point that:
    - Holds global configuration (Logging.getConfig(), Logging.setConfig()).
    - Creates loggers for arbitrary contexts (Logging.for(object|class|function|string, config?)).
    - Provides convenience static logging methods (info, debug, error, verbose, silly) delegating to a global logger instance.
    - Supports theming (Logging.theme) by applying Theme options through styled-string-builder when style=true.
    - Allows replacing the logger factory (Logging.setFactory) to integrate with other backends (e.g., Winston).

- src/decorators.ts: Method decorators
  - log(level=info, benchmark=false, verbosity=0): wraps a method to emit a call log and optionally a completion time; supports Promise-returning methods.
  - debug/info/silly/verbose: concise wrappers around log() for common patterns.

- src/LoggedClass.ts: Base convenience class
  - LoggedClass exposes a protected this.log getter returning a context-aware Logger built via Logging.for(this), simplifying logging inside class methods.

- src/winston/winston.ts: Optional Winston adapter
  - WinstonLogger: extends MiniLogger but delegates emission to a configured Winston instance.
  - WinstonFactory: a LoggerFactory you can install with Logging.setFactory(WinstonFactory) to globally route logs through Winston.

Design principles
- Minimal by default: Console output with small surface area and no heavy dependencies (except styled-string-builder when style is enabled).
- Config-driven: Behavior (level thresholds, verbosity, timestamps, separators, theming) is controlled via LoggingConfig.
- Context-first: Log context is explicit ("MyClass" or "MyClass.method"), aiding filtering and debugging.
- Extensible: Swap logger implementations via a factory; MiniLogger serves as a reference implementation.
- Safe theming: Logging.theme guards against invalid theme keys and values and logs errors instead of throwing.

Key behaviors
- Level filtering: NumericLogLevels are used to compare configured level with the message level and decide emission.
- Verbosity: .silly obeys LoggingConfig.verbose; only messages with <= configured verbosity are emitted.
- Theming and styling: When style=true, Logging.theme applies Theme rules per component (class, message, logLevel, id, stack, timestamp). Theme can vary per LogLevel via ThemeOptionByLogLevel.
- Correlation IDs: If correlationId is configured in a logger or child logger, it is included in output for easier traceability.

Public API surface
- Classes: MiniLogger, Logging, LoggedClass; WinstonLogger (optional).
- Decorators: log, debug, info, verbose, silly.
- Enums/Consts: LogLevel, LoggingMode, NumericLogLevels, DefaultTheme, DefaultLoggingConfig.
- Types: Logger, LoggingConfig, LoggerFactory, Theme, ThemeOption, ThemeOptionByLogLevel, LoggingContext.

Intended usage
- Use Logging.setConfig() at application startup to set level/style/timestamps.
- Create class- or method-scoped loggers via Logging.for(MyClass) or logger.for('method').
- Adopt LoggedClass to remove boilerplate in classes.
- Add decorators to methods for automatic call/benchmark logs.
- For advanced deployments, swap to WinstonFactory.
