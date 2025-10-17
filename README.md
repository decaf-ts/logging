<!-- AUTO-GENERATED: logging/workdocs/1-Header.md -->
# Logging Library (decaf-ts/logging)

A small, flexible TypeScript logging library designed for framework-agnostic projects. It provides:
- Context-aware loggers with hierarchical contexts (class.method) via MiniLogger and the static Logging facade.
- Configurable output (level filtering, verbosity, separators, timestamps) and optional ANSI styling/theming.
- Simple method decorators (log/debug/info/verbose/silly) to instrument class methods without boilerplate.
- Extensibility through a pluggable LoggerFactory (e.g., WinstonLogger) while keeping a minimal default runtime.


![Licence](https://img.shields.io/github/license/decaf-ts/logging.svg?style=plastic)
![GitHub language count](https://img.shields.io/github/languages/count/decaf-ts/logging?style=plastic)
![GitHub top language](https://img.shields.io/github/languages/top/decaf-ts/logging?style=plastic)

[![Build & Test](https://github.com/decaf-ts/logging/actions/workflows/nodejs-build-prod.yaml/badge.svg)](https://github.com/decaf-ts/logging/actions/workflows/nodejs-build-prod.yaml)
[![CodeQL](https://github.com/decaf-ts/logging/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/decaf-ts/logging/actions/workflows/codeql-analysis.yml)[![Snyk Analysis](https://github.com/decaf-ts/logging/actions/workflows/snyk-analysis.yaml/badge.svg)](https://github.com/decaf-ts/logging/actions/workflows/snyk-analysis.yaml)
[![Pages builder](https://github.com/decaf-ts/logging/actions/workflows/pages.yaml/badge.svg)](https://github.com/decaf-ts/logging/actions/workflows/pages.yaml)
[![.github/workflows/release-on-tag.yaml](https://github.com/decaf-ts/logging/actions/workflows/release-on-tag.yaml/badge.svg?event=release)](https://github.com/decaf-ts/logging/actions/workflows/release-on-tag.yaml)

![Open Issues](https://img.shields.io/github/issues/decaf-ts/logging.svg)
![Closed Issues](https://img.shields.io/github/issues-closed/decaf-ts/logging.svg)
![Pull Requests](https://img.shields.io/github/issues-pr-closed/decaf-ts/logging.svg)
![Maintained](https://img.shields.io/badge/Maintained%3F-yes-green.svg)

![Line Coverage](workdocs/reports/coverage/badge-lines.svg)
![Function Coverage](workdocs/reports/coverage/badge-functions.svg)
![Statement Coverage](workdocs/reports/coverage/badge-statements.svg)
![Branch Coverage](workdocs/reports/coverage/badge-branches.svg)


![Forks](https://img.shields.io/github/forks/decaf-ts/logging.svg)
![Stars](https://img.shields.io/github/stars/decaf-ts/logging.svg)
![Watchers](https://img.shields.io/github/watchers/decaf-ts/logging.svg)

![Node Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fbadges%2Fshields%2Fmaster%2Fpackage.json&label=Node&query=$.engines.node&colorB=blue)
![NPM Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fbadges%2Fshields%2Fmaster%2Fpackage.json&label=NPM&query=$.engines.npm&colorB=purple)

Documentation available [here](https://decaf-ts.github.io/logging/)

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


# How to Use the Logging Library

This guide provides concise, non-redundant examples for each public API. Examples are inspired by the package’s unit tests and reflect real usage.

Note: Replace the import path with your actual package name. In this monorepo, tests import from "../../src".

- import { ... } from "@your-scope/logging" // typical
- import { ... } from "../../src" // inside this repo while developing


Basic setup and global logging via Logging
Description: Configure global logging and write messages through the static facade, similar to unit tests that verify console output and level filtering.

```ts
import { Logging, LogLevel } from "@decaf-ts/logging";

// Set global configuration
Logging.setConfig({
  level: LogLevel.debug, // allow debug and above
  style: false,          // plain output (tests use both styled and themeless)
  timestamp: false,      // omit timestamp for simplicity in this example
});

// Log using the global logger
Logging.info("Application started");
Logging.debug("Debug details");
Logging.error("Something went wrong");

// Verbosity-controlled logs (silly delegates to verbose internally)
Logging.setConfig({ verbose: 2 });
Logging.silly("Extra details at verbosity 1");      // emitted when verbose >= 1
Logging.verbose("Even more details", 2);            // only with verbose >= 2
```


Create a class-scoped logger and child method logger
Description: Create a logger bound to a specific context (class) and derive a child logger for a method, matching patterns used in tests.

```ts
import { Logging, LogLevel } from "@decaf-ts/logging";

Logging.setConfig({ level: LogLevel.debug });

// A class-scoped logger
const classLogger = Logging.for("UserService");
classLogger.info("Fetching users");

// A child logger for a specific method with temporary config overrides
const methodLogger = classLogger.for("list", { style: false });
methodLogger.debug("Querying repository...");
```


MiniLogger: direct use and per-instance config
Description: Instantiate MiniLogger directly (the default implementation behind Logging.setFactory). Tests create MiniLogger with and without custom config.

```ts
import { MiniLogger, LogLevel, type LoggingConfig } from "@decaf-ts/logging";

const logger = new MiniLogger("TestContext");
logger.info("Info from MiniLogger");

// With custom configuration
const custom: Partial<LoggingConfig> = { level: LogLevel.debug, verbose: 2 };
const customLogger = new MiniLogger("TestContext", custom);
customLogger.debug("Debug with custom level");

// Child logger with correlation id
const traced = customLogger.for("run", { correlationId: "req-123" });
traced.info("Tracing this operation");
```


Decorators: log, debug, info, verbose, silly
Description: Instrument methods to log calls and optional benchmarks. Tests validate decorator behavior for call and completion messages.

```ts
import { log, debug, info as infoDecor, verbose as verboseDecor, silly as sillyDecor, LogLevel, Logging } from "@decaf-ts/logging";

// Configure logging for demo
Logging.setConfig({ level: LogLevel.debug, style: false, timestamp: false });

class AccountService {
  @log(LogLevel.info) // logs method call with args
  create(name: string) {
    return { id: "1", name };
  }

  @debug(true) // logs call and completion time at debug level
  rebuildIndex() {
    // heavy work...
    return true;
  }

  @info() // convenience wrapper for info level
  enable() {
    return true;
  }

  @verbose(1, true) // verbose with verbosity threshold and benchmark
  syncAll() {
    return Promise.resolve("ok");
  }

  @silly() // very chatty, only emitted when verbose allows
  ping() {
    return "pong";
  }
}

const svc = new AccountService();
svc.create("Alice");
svc.rebuildIndex();
svc.enable();
await svc.syncAll();
svc.ping();
```


LoggedClass: zero-boilerplate logging inside classes
Description: Extend LoggedClass to gain a protected this.log with the correct context (class name). Tests use Logging.for to build similar context.

```ts
import { LoggedClass } from "@your-scope/logging";

class UserRepository extends LoggedClass {
  findById(id: string) {
    this.log.info(`Finding ${id}`);
    return { id };
  }
}

const repo = new UserRepository();
repo.findById("42");
```


Winston integration: swap the logger factory
Description: Route all logging through WinstonLogger by installing WinstonFactory. This mirrors the optional adapter in src/winston.

```ts
import { Logging } from "@your-scope/logging";
import { WinstonFactory } from "@your-scope/logging/winston/winston";

// Install Winston as the logger factory
Logging.setFactory(WinstonFactory);

// Now any logger created will use Winston under the hood
const log = Logging.for("ApiGateway");
log.info("Gateway started");
```


Theming and styling with Logging.theme and config
Description: Enable style and customize theme to colorize parts of the log (tests check styled output patterns).

```ts
import { Logging, LogLevel, DefaultTheme, type Theme } from "@your-scope/logging";

// Enable styling globally
Logging.setConfig({ style: true, timestamp: true, context: false });

// Optionally override theme: make debug level yellow (fg:33) and error red+bold
const theme: Theme = {
  ...DefaultTheme,
  logLevel: {
    ...DefaultTheme.logLevel,
    debug: { fg: 33 },
    error: { fg: 31, style: ["bold"] },
  },
};

// Apply at runtime by passing to Logging.theme where needed (MiniLogger does this internally)
const styled = Logging.theme("debug", "logLevel", LogLevel.debug, theme);

// Regular logging picks up style=true and formats output accordingly
Logging.debug("This is a styled debug message");
```


Factory basics and because(reason, id)
Description: Create ad-hoc, labeled loggers and use factory semantics.

```ts
import { Logging } from "@your-scope/logging";

// Ad-hoc logger labeled with a reason and optional id (handy for correlation)
const jobLog = Logging.because("reindex", "job-77");
jobLog.info("Starting reindex");
```


Types: Logger and LoggingConfig in your code
Description: Use the library’s types for better APIs.

```ts
import type { Logger, LoggingConfig } from "@your-scope/logging";

export interface ServiceDeps {
  log: Logger;
  config?: Partial<LoggingConfig>;
}

export class PaymentService {
  constructor(private deps: ServiceDeps) {}
  charge(amount: number) {
    this.deps.log.info(`Charging ${amount}`);
  }
}
```


### Related

[![decaf-ts](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=decaf-ts)](https://github.com/decaf-ts/decaf-ts)
[![core](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=core)](https://github.com/decaf-ts/core)
[![decorator-validation](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=decorator-validation)](https://github.com/decaf-ts/decorator-validation)
[![db-decorators](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=db-decorators)](https://github.com/decaf-ts/db-decorators)


### Social

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/decaf-ts/)




#### Languages

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![ShellScript](https://img.shields.io/badge/Shell_Script-121011?style=for-the-badge&logo=gnu-bash&logoColor=white)

## Getting help

If you have bug reports, questions or suggestions please [create a new issue](https://github.com/decaf-ts/ts-workspace/issues/new/choose).

## Contributing

I am grateful for any contributions made to this project. Please read [this](./workdocs/98-Contributing.md) to get started.

## Supporting

The first and easiest way you can support it is by [Contributing](./workdocs/98-Contributing.md). Even just finding a typo in the documentation is important.

Financial support is always welcome and helps keep both me and the project alive and healthy.

So if you can, if this project in any way. either by learning something or simply by helping you save precious time, please consider donating.

## License

This project is released under the [MIT License](./LICENSE.md).

By developers, for developers...
