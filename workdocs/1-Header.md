<!-- AUTO-GENERATED: logging/workdocs/1-Header.md -->
![Banner](./workdocs/assets/decaf-logo.svg)

# Logging Library (decaf-ts/logging)

Decaf’s logging toolkit keeps one fast MiniLogger at the core while exposing adapters, filters, and utilities that fit both browser and Node.js runtimes:
- Configure once through `Logging.setConfig` or the `Environment` accumulator and let impersonated child loggers inherit overrides without allocations.
- Apply filter chains, transports, and adapter-specific features (Pino, Winston, custom factories) through the shared `LoggingConfig` contract.
- Instrument classes using decorators, `LoggedClass`, and `Logging.because` while StopWatch, text/time utilities, and environment helpers round out the diagnostics surface.
