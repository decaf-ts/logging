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
