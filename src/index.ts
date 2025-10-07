export * from "./filters";
export * from "./constants";
export * from "./decorators";
export * from "./environment";
export * from "./LoggedClass";
export * from "./logging";
export * from "./text";
export * from "./types";
export * from "./web";

/**
 * @description A logging module for TypeScript applications
 * @summary Provides a comprehensive, flexible logging solution. This module exposes:
 * - Core classes like {@link Logging} and {@link MiniLogger}
 * - Decorators such as {@link log} for instrumenting methods
 * - Configuration and constants like {@link LogLevel} and {@link DefaultLoggingConfig}
 * - Type definitions including {@link Logger} and {@link LoggingConfig}
 * These exports enable consistent, context-aware, and optionally themed logging across projects.
 * @module Logging
 */

/**
 * @description Current package version string
 * @summary Stores the current package version, used for version tracking and compatibility checks
 * @const VERSION
 * @memberOf module:Logging
 */
export const VERSION = "##VERSION##";
