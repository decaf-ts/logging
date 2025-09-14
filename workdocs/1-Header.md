<!-- AUTO-GENERATED: logging/workdocs/1-Header.md -->
# Logging Library (decaf-ts/logging)

A small, flexible TypeScript logging library designed for framework-agnostic projects. It provides:
- Context-aware loggers with hierarchical contexts (class.method) via MiniLogger and the static Logging facade.
- Configurable output (level filtering, verbosity, separators, timestamps) and optional ANSI styling/theming.
- Simple method decorators (log/debug/info/verbose/silly) to instrument class methods without boilerplate.
- Extensibility through a pluggable LoggerFactory (e.g., WinstonLogger) while keeping a minimal default runtime.
