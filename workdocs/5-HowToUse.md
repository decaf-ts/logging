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
