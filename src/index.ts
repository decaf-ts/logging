/**
 * @module Logging
 * @description A comprehensive and versatile logging toolkit for both browser and Node.js environments.
 * @summary This module provides a complete logging solution, exposing {@link Logging} and {@link MiniLogger} for runtime logging. It also includes decorators like {@link log} for method instrumentation, and various utilities such as {@link PatternFilter}, {@link StopWatch}, and {@link LoggedEnvironment} to help build configurable and theme-aware log pipelines.
 */
export * from "./filters";
export * from "./constants";
export * from "./decorators";
export * from "./environment";
export * from "./errors";
export * from "./LoggedClass";
export * from "./logging";
export * from "./logParameters";
export * from "./text";
export * from "./time";
export * from "./types";
export * from "./web";
export * from "./utils";
export * from "styled-string-builder";

/**
 * @description Current package version string.
 * @summary Stores the package version for diagnostics and compatibility checks.
 * @const VERSION
 * @type {string}
 * @memberOf module:Logging
 */
export const VERSION: string = "##VERSION##";

/**
 * @description Represents the current commit hash of the module build.
 * @summary Stores the current git commit hash for the package. The build replaces
 * the placeholder with the actual commit hash at publish time.
 * @const COMMIT
 */
export const COMMIT = "##COMMIT##";

/**
 * @description Represents the full version string of the module.
 * @summary Stores the semver version and commit hash for the package.
 * The build replaces the placeholder with the actual `<version>-<commit>` value at publish time.
 * @const FULL_VERSION
 */
export const FULL_VERSION = "##FULL_VERSION##";

/**
 * @description Current package version string.
 * @summary Stores the package version for diagnostics and compatibility checks.
 * @const PACKAGE_NAME
 * @type {string}
 * @memberOf module:Logging
 */
export const PACKAGE_NAME: string = "##PACKAGE##";
