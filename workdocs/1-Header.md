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
