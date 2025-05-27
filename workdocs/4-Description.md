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
