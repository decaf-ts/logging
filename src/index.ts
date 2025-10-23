export * from "./filters";
export * from "./constants";
export * from "./decorators";
export * from "./environment";
export * from "./LoggedClass";
export * from "./logging";
export * from "./text";
export * from "./time";
export * from "./types";
export * from "./web";
export * from "./utils";

/**
 * @description Comprehensive logging toolkit for browser and Node environments.
 * @summary Exposes {@link Logging} and {@link MiniLogger} for runtime logging, decorators such as {@link log} for method instrumentation, and utilities like {@link PatternFilter}, {@link StopWatch}, and {@link LoggedEnvironment} to build configurable, theme-aware log pipelines.
 * @module Logging
 */

/**
 * @description Current package version string.
 * @summary Stores the package version for diagnostics and compatibility checks.
 * @const VERSION
 * @type {string}
 * @memberOf module:Logging
 */
export const VERSION: string = "##VERSION##";

/**
 * @description Current package version string.
 * @summary Stores the package version for diagnostics and compatibility checks.
 * @const PACKAGE_NAME
 * @type {string}
 * @memberOf module:Logging
 */
export const PACKAGE_NAME: string = "##PACKAGE##";
