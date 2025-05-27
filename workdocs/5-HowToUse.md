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
