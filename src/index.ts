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
 * @module Logging
 * @description A comprehensive and versatile logging toolkit for both browser and Node.js environments.
 * @summary This module provides a complete logging solution, exposing {@link Logging} and {@link MiniLogger} for runtime logging. It also includes decorators like {@link log} for method instrumentation, and various utilities such as {@link PatternFilter}, {@link StopWatch}, and {@link LoggedEnvironment} to help build configurable and theme-aware log pipelines.
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
