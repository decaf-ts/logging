![Banner](./workdocs/assets/Banner.png)

## Decaf's Logging

A comprehensive, flexible, and type-safe logging library for TypeScript applications that provides hierarchical context-aware logging, configurable styling, multiple output formats, and method decorators. It offers a lightweight built-in logger and seamless Winston integration, enabling developers to easily add structured logging with different verbosity levels to their applications.


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

### Description

Decaf's Logging is a powerful TypeScript logging library designed to provide flexible, context-aware logging capabilities for applications of any size. The library is built with a focus on type safety, configurability, and ease of use.

#### Core Architecture

The library follows a modular architecture with several key components:

1. **Logging System**:
   - `Logging`: A static class that serves as the central entry point for the logging system. It manages global configuration, provides factory methods for creating loggers, and offers static logging methods.
   - `MiniLogger`: A lightweight logger implementation that provides the core logging functionality with support for different log levels, context-aware logging, and customizable formatting.
   - `Logger` interface: Defines the standard methods that all logger implementations must provide, ensuring consistency across different logger types.

2. **Configuration System**:
   - `LoggingConfig`: Defines configuration options for the logging system, including log level, verbosity, styling, timestamp format, and more.
   - `DefaultLoggingConfig`: Provides sensible default settings that can be overridden as needed.

3. **Log Levels**:
   - `LogLevel` enum: Defines standard log levels (error, info, verbose, debug, silly) for categorizing log messages.
   - `NumericLogLevels`: Maps log levels to numeric values for comparison and filtering.

4. **Styling System**:
   - `Theme` interface: Defines a comprehensive theming system for styling log output with colors and formatting.
   - `DefaultTheme`: Provides a default color scheme for log output.
   - `LoggingMode` enum: Supports different output formats (RAW, JSON) for log messages.

5. **Decorator System**:
   - Method decorators (`@log`, `@debug`, `@info`, `@verbose`, `@silly`): Allow for easy integration of logging into class methods with options for benchmarking and verbosity control.

6. **Winston Integration**:
   - `WinstonLogger`: Extends the core logging functionality to leverage the Winston logging library.
   - `WinstonFactory`: A factory function for creating Winston-based loggers.

#### Key Features

1. **Hierarchical Context-Aware Logging**:
   The library allows creating loggers for specific classes and methods, maintaining a hierarchy of contexts. This makes it easy to trace log messages back to their source and filter logs by context.

2. **Configurable Styling**:
   Extensive support for styling log output with colors and formatting, with a theme system that allows customizing the appearance of different log components.

3. **Multiple Output Formats**:
   Support for both human-readable (RAW) and machine-parseable (JSON) output formats.

4. **Method Decorators**:
   Easy-to-use decorators for adding logging to class methods, with support for benchmarking execution time.

5. **Verbosity Control**:
   Fine-grained control over log verbosity, allowing developers to adjust the detail level of logs without changing code.

6. **Type Safety**:
   Comprehensive TypeScript type definitions ensure type safety and enable IDE autocompletion.

7. **Winston Integration**:
   Seamless integration with the popular Winston logging library, providing access to its advanced features while maintaining the same interface.

8. **Error Handling**:
   Special support for logging errors with stack traces for better debugging.

#### Usage Patterns

The library supports several usage patterns:

1. **Global Logging**:
   Using the static `Logging` class methods for simple, application-wide logging.

2. **Class-Specific Logging**:
   Creating loggers for specific classes to provide context for log messages.

3. **Method-Specific Logging**:
   Creating child loggers for specific methods to further refine the context.

4. **Decorator-Based Logging**:
   Using method decorators to automatically log method calls and execution times.

5. **Winston-Based Logging**:
   Leveraging Winston's advanced features while maintaining the same interface.

This flexible design makes the library suitable for a wide range of applications, from simple scripts to complex enterprise systems.


### How to Use

- [Initial Setup](./tutorials/For%20Developers.md#_initial-setup_)
- [Installation](./tutorials/For%20Developers.md#installation)

## Basic Usage

### Global Logging

The simplest way to use the library is through the static `Logging` class:

```typescript
import { Logging, LogLevel } from 'decaf-logging';

// Configure global logging settings
Logging.setConfig({
  level: LogLevel.debug,
  style: true,
  timestamp: true
});

// Log messages at different levels
Logging.info('Application started');
Logging.debug('Debug information');
Logging.error('An error occurred');
Logging.verbose('Detailed information', 1); // With verbosity level
```

### Class-Specific Logging

For more context-aware logging, create loggers for specific classes:

```typescript
import { Logging, Logger } from 'decaf-logging';

class UserService {
  private logger: Logger;

  constructor() {
    // Create a logger for this class
    this.logger = Logging.for(UserService);
    // Or with string name: Logging.for('UserService');
  }

  getUser(id: string) {
    this.logger.info(`Getting user with ID: ${id}`);
    // ... implementation
    this.logger.debug('User retrieved successfully');
  }

  updateUser(id: string, data: any) {
    try {
      this.logger.info(`Updating user with ID: ${id}`);
      // ... implementation
      this.logger.debug('User updated successfully');
    } catch (error) {
      this.logger.error(error); // Logs error with stack trace
    }
  }
}
```

### Method-Specific Logging

Create child loggers for specific methods to further refine the context:

```typescript
import { Logging, Logger } from 'decaf-logging';

class DataProcessor {
  private logger: Logger;

  constructor() {
    this.logger = Logging.for(DataProcessor);
  }

  processData(data: any[]) {
    // Create a method-specific logger
    const methodLogger = this.logger.for('processData');

    methodLogger.info(`Processing ${data.length} items`);

    // With custom configuration
    const verboseLogger = methodLogger.for('details', { verbose: 2 });
    verboseLogger.verbose('Starting detailed processing', 1);

    // ... implementation
  }
}
```

### Using Decorators

Decorators provide an easy way to add logging to class methods:

```typescript
import { debug, info, log, LogLevel, verbose } from 'decaf-logging';

class PaymentProcessor {
  // Basic logging with info level
  @info()
  processPayment(amount: number, userId: string) {
    // Method implementation
    return true;
  }

  // Debug level logging with benchmarking
  @debug(true)
  validatePayment(paymentData: any) {
    // Method implementation
    return true;
  }

  // Verbose logging with custom verbosity
  @verbose(2)
  recordTransaction(transactionData: any) {
    // Method implementation
  }

  // Custom log level with benchmarking and verbosity
  @log(LogLevel.error, true, 1)
  handleFailure(error: Error) {
    // Method implementation
  }
}
```

### Winston Integration

To use Winston for logging:

```typescript
import { Logging, LogLevel } from 'decaf-logging';
import { WinstonFactory } from 'decaf-logging/winston';
import winston from 'winston';

// Configure Winston transports
const transports = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'app.log' })
];

// Set Winston as the logger factory
Logging.setFactory(WinstonFactory);

// Configure global logging
Logging.setConfig({
  level: LogLevel.info,
  timestamp: true,
  timestampFormat: 'YYYY-MM-DD HH:mm:ss'
});

// Create a Winston logger for a class
const logger = Logging.for('MyService');
logger.info('Service initialized');
```

## Advanced Usage

### Custom Styling

Configure custom styling for log output:

```typescript
import { Logging, LogLevel, Theme } from 'decaf-logging';

// Define a custom theme
const customTheme: Theme = {
  class: {
    fg: 35, // Magenta
  },
  id: {
    fg: 36, // Cyan
  },
  stack: {},
  timestamp: {
    fg: 90, // Gray
  },
  message: {
    error: {
      fg: 31, // Red
      style: ['bold'],
    },
  },
  method: {},
  logLevel: {
    error: {
      fg: 31, // Red
      style: ['bold'],
    },
    info: {
      fg: 32, // Green
    },
    verbose: {
      fg: 34, // Blue
    },
    debug: {
      fg: 33, // Yellow
    },
  },
};

// Apply the custom theme
Logging.setConfig({
  style: true,
  theme: customTheme
});
```

### Correlation IDs

Track related log messages with correlation IDs:

```typescript
import { Logging } from 'decaf-logging';

function processRequest(requestId: string, data: any) {
  // Create a logger with correlation ID
  const logger = Logging.for('RequestProcessor', { 
    correlationId: requestId 
  });

  logger.info('Processing request');

  // All log messages from this logger will include the correlation ID
  processRequestData(data, logger);

  logger.info('Request processing completed');
}

function processRequestData(data: any, logger: Logger) {
  // Child loggers inherit the correlation ID
  const dataLogger = logger.for('DataProcessor');
  dataLogger.debug('Processing data');
  // ...
}
```

### JSON Output Mode

For machine-readable logs:

```typescript
import { Logging, LoggingMode } from 'decaf-logging';

// Configure for JSON output
Logging.setConfig({
  mode: LoggingMode.JSON,
  timestamp: true
});

Logging.info('This will be output in JSON format');
```

### Custom Logger Factory

Create a custom logger implementation:

```typescript
import { Logger, LoggerFactory, Logging, MiniLogger } from 'decaf-logging';

// Custom logger that adds prefix to all messages
class PrefixedLogger extends MiniLogger {
  constructor(context: string, prefix: string, conf?: Partial<LoggingConfig>) {
    super(context, conf);
    this.prefix = prefix;
  }

  private prefix: string;

  protected override createLog(level: LogLevel, message: StringLike | Error, stack?: string): string {
    const msg = typeof message === 'string' ? message : message.message;
    const prefixedMsg = `${this.prefix}: ${msg}`;
    return super.createLog(level, prefixedMsg, stack);
  }
}

// Custom factory function
const PrefixedLoggerFactory: LoggerFactory = (
  context: string,
  conf?: Partial<LoggingConfig>,
  ...args: any[]
) => new PrefixedLogger(context, args[0] || '[APP]', conf);

// Set the custom factory
Logging.setFactory(PrefixedLoggerFactory);

// Create a logger with the custom factory
const logger = Logging.for('MyClass', undefined, '[CUSTOM]');
logger.info('Hello world'); // Outputs: "[CUSTOM]: Hello world"
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