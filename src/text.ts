import { DefaultPlaceholderWrappers } from "./constants";

/**
 * @description Pads the end of a string with a specified character.
 * @summary This function extends the input string to a specified length by adding a padding character to the end. If the input string is already longer than the specified length, it is returned unchanged.
 * @param {string} str - The input string to be padded.
 * @param {number} length - The desired total length of the resulting string.
 * @param {string} [char=" "] - The character to use for padding.
 * @return {string} The padded string.
 * @throws {Error} If the padding character is not exactly one character long.
 * @function padEnd
 * @memberOf module:Logging
 */
export function padEnd(
  str: string,
  length: number,
  char: string = " "
): string {
  if (char.length !== 1)
    throw new Error("Invalid character length for padding. must be one!");
  return str.padEnd(length, char);
}

/**
 * @description Replaces placeholders in a string with the provided values.
 * @summary This function interpolates a string by replacing placeholders of the form `${variableName}` with the corresponding values from the provided object. If a placeholder does not have a corresponding value, it is left unchanged in the string.
 * @param {string} input - The input string containing the placeholders to be replaced.
 * @param {Record<string, (number|string)>} values - An object containing key-value pairs for the replacement.
 * @param {string} [prefix="${"] - The prefix for the placeholders.
 * @param {string} [suffix="}"] - The suffix for the placeholders.
 * @param {string} [flags="g"] - The regular expression flags to use.
 * @return {string} The interpolated string with the placeholders replaced by their corresponding values.
 * @function patchPlaceholders
 * @mermaid
 * sequenceDiagram
 *   participant Caller
 *   participant patchString
 *   participant String.replace
 *   Caller->>patchString: Call with input and values
 *   patchString->>String.replace: Call with regex and replacement function
 *   String.replace->>patchString: Return replaced string
 *   patchString-->>Caller: Return patched string
 * @memberOf module:Logging
 */
export function patchPlaceholders(
  input: string,
  values: Record<string, number | string>,
  prefix: string = DefaultPlaceholderWrappers[0],
  suffix: string = DefaultPlaceholderWrappers[1],
  flags: string = "g"
): string {
  const placeholders = Object.entries(values).reduce(
    (acc: Record<string, any>, [key, val]) => {
      acc[`${prefix}${key}${suffix}`] = val;
      return acc;
    },
    {}
  );
  return patchString(input, placeholders, flags);
}

/**
 * @description Replaces occurrences of keys with their corresponding values in a string.
 * @summary This function iterates through a set of key-value pairs and replaces all occurrences of each key in the input string with its corresponding value. It supports regular expression flags for customized replacement.
 * @param {string} input - The input string in which the replacements will be made.
 * @param {Record<string, (number|string)>} values - An object containing key-value pairs for the replacement.
 * @param {string} [flags="g"] - The regular expression flags to control the replacement behavior.
 * @return {string} The string with all the specified replacements applied.
 * @function patchString
 * @memberOf module:Logging
 */
export function patchString(
  input: string,
  values: Record<string, number | string>,
  flags: string = "g"
): string {
  Object.entries(values).forEach(([key, val]) => {
    const regexp = new RegExp(escapeRegExp(key), flags);
    input = input.replace(regexp, val as string);
  });
  return input;
}

/**
 * @description Converts a string to camelCase.
 * @summary This function transforms the input string into camelCase format, where words are joined without spaces and each word after the first starts with a capital letter.
 * @param {string} text - The input string to be converted.
 * @return {string} The input string converted to camelCase.
 * @function toCamelCase
 * @memberOf module:Logging
 */
export function toCamelCase(text: string): string {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "");
}

/**
 * @description Converts a string to ENVIRONMENT_VARIABLE format.
 * @summary This function transforms the input string into uppercase with words separated by underscores, which is a format that is typically used for environment variable names.
 * @param {string} text - The input string to be converted.
 * @return {string} The input string converted to ENVIRONMENT_VARIABLE format.
 * @function toENVFormat
 * @memberOf module:Logging
 */
export function toENVFormat(text: string): string {
  return toSnakeCase(text).toUpperCase();
}

/**
 * @description Converts a string to snake_case.
 * @summary This function transforms the input string into lowercase with words separated by underscores.
 * @param {string} text - The input string to be converted.
 * @return {string} The input string converted to snake_case.
 * @function toSnakeCase
 * @memberOf module:Logging
 */
export function toSnakeCase(text: string): string {
  return text
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

/**
 * @description Converts a string to kebab-case.
 * @summary This function transforms the input string into lowercase with words separated by hyphens.
 * @param {string} text - The input string to be converted.
 * @return {string} The input string converted to kebab-case.
 * @function toKebabCase
 * @memberOf module:Logging
 */
export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * @description Converts a string to PascalCase.
 * @summary This function transforms the input string into PascalCase format, where words are joined without spaces and each word starts with a capital letter.
 * @param {string} text - The input string to be converted.
 * @return {string} The input string converted to PascalCase.
 * @function toPascalCase
 * @memberOf module:Logging
 */
export function toPascalCase(text: string): string {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/\s+/g, "");
}

/**
 * @description Escapes special characters in a string for use in a regular expression.
 * @summary This function adds backslashes before characters that have a special meaning in regular expressions, which allows the string to be used as a literal match in a RegExp.
 * @param {string} string - The string to escape for regular expression use.
 * @return {string} The escaped string that is safe for use in regular expressions.
 * @function escapeRegExp
 * @memberOf module:Logging
 */
export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * @description A utility function that provides string formatting functionality that is similar to C#'s string.format.
 * @summary This function replaces placeholders in a string with the provided arguments.
 * @param {string} string - The string to format.
 * @param {...(string|number|Record<string, any>)} args - The arguments to use for formatting.
 * @return {string} The formatted string.
 * @function sf
 * @memberOf module:Logging
 */
export function sf(
  string: string,
  ...args: (string | number | Record<string, any>)[]
) {
  if (args.length > 1) {
    if (
      !args.every((arg) => typeof arg === "string" || typeof arg === "number")
    )
      throw new Error(
        `Only string and number arguments are supported for multiple replacements.`
      );
  }

  if (args.length === 1 && typeof args[0] === "object") {
    const obj = args[0] as Record<string, any>;
    return Object.entries(obj).reduce((acc, [key, val]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, "g"), function () {
        return val;
      });
    }, string);
  }

  return string.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== "undefined"
      ? args[number].toString()
      : "undefined";
  });
}

/**
 * @description A utility function that provides string formatting functionality that is similar to C#'s string.format.
 * @summary This function is deprecated. Use {@link sf} instead.
 * @see sf
 * @deprecated
 * @function stringFormat
 * @memberOf module:Logging
 */
export const stringFormat = sf;
