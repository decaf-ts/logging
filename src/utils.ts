/**
 * @summary Util function to provide string format functionality similar to C#'s string.format
 *
 * @param {string} string
 * @param {Array<string | number> | Record<string, any>} [args] replacements made by order of appearance (replacement0 wil replace {0} and so on)
 * @return {string} formatted string
 *
 * @function stringFormat
 * @memberOf module:logging
 * @category Model
 */
export function stringFormat(
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
