<!-- AUTO-GENERATED: logging/workdocs/1-Header.md -->
![Banner](./workdocs/assets/decaf-logo.svg)

# Logging Library (decaf-ts/logging)

Decaf’s logging toolkit keeps one fast MiniLogger at the core while exposing adapters, filters, and utilities that fit both browser and Node.js runtimes:
- Configure once through `Logging.setConfig` or the `Environment` accumulator and let impersonated child loggers inherit overrides without allocations.
- Apply filter chains, transports, and adapter-specific features (Pino, Winston, custom factories) through the shared `LoggingConfig` contract.
- Instrument classes using decorators, `LoggedClass`, and `Logging.because` while StopWatch, text/time utilities, and environment helpers round out the diagnostics surface.

### Core Concepts

*   **`Logging`**: A static class for managing global logging configuration and creating logger instances.
*   **`MiniLogger`**: A lightweight, default logger implementation.
*   **`LoggedClass`**: An abstract base class that provides a pre-configured logger instance to its subclasses.
*   **`LoggedEnvironment`**: A class for managing environment-specific logging configurations.
*   **Decorators**: A set of decorators (`@log`, `@benchmark`, etc.) for easily adding logging and benchmarking to your methods.
*   **Filters and Transports**: A system for filtering sensitive information and transporting logs to different destinations.
*   **Pino and Winston Integration**: Built-in support for two popular logging libraries, Pino and Winston.

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

Minimal size: 6.2 KB kb gzipped


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


# How to Use

This guide provides examples of how to use the main features of the `@decaf-ts/logging` library.

## Initial Configuration

You can set the initial logging configuration using `Logging.setConfig()`.

```typescript
import { Logging, LogLevel } from '@decaf-ts/logging';

Logging.setConfig({
  level: LogLevel.debug,
  style: true,
  timestamp: true,
});
```

## Impersonation Mechanism

The logging framework uses a proxy-based impersonation mechanism to create child loggers. This provides a significant performance gain by avoiding the need to create new logger instances for each context.

```typescript
import { Logging } from '@decaf-ts/logging';

const rootLogger = Logging.get();
const childLogger = rootLogger.for('MyClass');

// childLogger is a proxy that inherits the configuration of rootLogger
childLogger.info('This is a message from the child logger');
```

## Filters

Filters allow you to process log messages before they are written. You can use them to filter out sensitive information.

```typescript
import { Logging, PatternFilter } from '@decaf-ts/logging';

// Filter out passwords
const passwordFilter = new PatternFilter(/password/i, '********');
Logging.setConfig({
  filters: [passwordFilter],
});

const logger = Logging.get();
logger.info('User logged in with password: mysecretpassword');
// Output will be: User logged in with password: ********
```

## Transports

Transports are responsible for writing log messages to a destination. The library includes a default console transport, and you can create your own.

*Note: The library currently focuses on filters and logger implementation, with transport-like functionality being a feature of the underlying adapters (Pino, Winston).*

## Pino and Winston Integration

The library includes built-in support for Pino and Winston.

### Pino

```typescript
import { Logging } from '@decaf-ts/logging';
import { pino } from 'pino';
import { PinoLogFactory } from '@decaf-ts/logging/pino';

const pinoInstance = pino();
Logging.setFactory(new PinoLogFactory(pinoInstance));

const logger = Logging.get();
logger.info('This message will be logged by Pino');
```

### Winston

```typescript
import { Logging } from '@decaf-ts/logging';
import * as winston from 'winston';
import { WinstonLogFactory } from '@decaf-ts/logging/winston';

const winstonInstance = winston.createLogger({
  transports: [new winston.transports.Console()],
});
Logging.setFactory(new WinstonLogFactory(winstonInstance));

const logger = Logging.get();
logger.info('This message will be logged by Winston');
```

## `LoggedEnvironment`

The `LoggedEnvironment` class allows you to manage environment-specific logging configurations.

```typescript
import { LoggedEnvironment } from '@decaf-ts/logging';

// Set the application name
LoggedEnvironment.app = 'MyAwesomeApp';

// Accumulate additional environment configuration
LoggedEnvironment.accumulate({
  database: {
    host: 'localhost',
    port: 5432,
  },
});
```

## `LoggedClass`

The `LoggedClass` is an abstract base class that provides a pre-configured logger instance to its subclasses.

```typescript
import { LoggedClass } from '@decaf-ts/logging';

class MyService extends LoggedClass {
  doSomething() {
    this.log.info('Doing something...');
  }
}

const service = new MyService();
service.doSomething();
```

## Decorators

The library provides a set of decorators for easily adding logging and benchmarking to your methods.

### `@log`

```typescript
import { log, LogLevel } from '@decaf-ts/logging';

class MyDecoratedService {
  @log(LogLevel.info)
  myMethod(arg1: string) {
    // ...
  }
}
```

### `@benchmark`

```typescript
import { benchmark } from '@decaf-ts/logging';

class MyBenchmarkedService {
  @benchmark()
  myLongRunningMethod() {
    // ...
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
