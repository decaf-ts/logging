/**
 * @description Checks if a value is a class.
 * @summary This function determines if the given value is a class constructor.
 * @param {unknown} value - The value to check.
 * @return {boolean} `true` if the value is a class, `false` otherwise.
 * @function isClass
 * @memberOf module:Logging
 */
export function isClass(
  value: unknown
): value is abstract new (...args: any[]) => any {
  if (typeof value !== "function") return false;

  // 1) Native ES class? (fast path)
  // e.g., "class Foo { ... }" → source starts with "class"
  try {
    const src = Function.prototype.toString.call(value);
    if (/^\s*class[\s{]/.test(src)) return true;
  } catch {
    // Some environments may block .toString; ignore and continue.
  }

  // 2) Has a prototype at all? (filters out arrow funcs, bound funcs)
  const protoDesc = Object.getOwnPropertyDescriptor(value, "prototype");
  if (!protoDesc || !protoDesc.value) return false;

  // 3) In native classes, the "prototype" property is non-writable.
  // (In plain functions, it's writable.) This is a strong signal.
  if (protoDesc.writable === false) return true;

  // 4) Classic constructor or transpiled class:
  // Must have its own "constructor" and at least one prototype method.
  const proto = (value as any).prototype;
  if (!Object.prototype.hasOwnProperty.call(proto, "constructor")) return false;

  const names = Object.getOwnPropertyNames(proto).filter(
    (n) => n !== "constructor"
  );
  return names.length > 0;
}

/**
 * @description Checks if a value is a function.
 * @summary This function determines if the given value is a function, but not a class.
 * @template T
 * @param {unknown} value - The value to check.
 * @return {boolean} `true` if the value is a function, `false` otherwise.
 * @function isFunction
 * @memberOf module:Logging
 */
export function isFunction<T extends (...args: any[]) => unknown>(
  value: unknown
): value is T {
  return typeof value === "function" && !isClass(value);
}

/**
 * @description Checks if a value is a method.
 * @summary This function determines if the given value is a method.
 * @template T
 * @param {unknown} value - The value to check.
 * @return {boolean} `true` if the value is a method, `false` otherwise.
 * @function isMethod
 * @memberOf module:Logging
 */
export function isMethod<T extends (...args: any[]) => unknown>(
  value: unknown
): value is T {
  if (!isFunction<T>(value)) return false;

  const descriptor = Object.getOwnPropertyDescriptor(value, "prototype");
  return !descriptor || descriptor.value === undefined;
}

/**
 * @description Checks if a value is an instance of a class.
 * @summary This function determines if the given value is an instance of a class.
 * @template T
 * @param {unknown} value - The value to check.
 * @return {boolean} `true` if the value is an instance of a class, `false` otherwise.
 * @function isInstance
 * @memberOf module:Logging
 */
export function isInstance<T extends object>(value: unknown): value is T {
  if (value === null || typeof value !== "object") return false;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const ctor = (value as { constructor?: Function }).constructor;
  if (!ctor || ctor === Object) return false;

  return isClass(ctor);
}

/**
 * @description Gets the name of an object.
 * @summary This function returns the name of the given object, which can be a class, an instance of a class, a function, or a primitive value.
 * @param {unknown} value - The value to get the name of.
 * @return {string} The name of the object.
 * @function getObjectName
 * @memberOf module:Logging
 */
export function getObjectName(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;

  if (isClass(value)) {
    return value.name || "AnonymousClass";
  }

  if (isInstance(value)) {
    const toStringFn = (value as { toString?: () => string }).toString;
    if (
      typeof toStringFn === "function" &&
      toStringFn !== Object.prototype.toString
    ) {
      try {
        const rendered = toStringFn.call(value);
        if (typeof rendered === "string" && rendered.length) return rendered;
      } catch {
        // ignore custom toString errors and fall back to constructor name.
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const ctor = (value as { constructor?: Function }).constructor;
    return ctor && ctor.name ? ctor.name : "AnonymousInstance";
  }

  if (isMethod(value) || isFunction(value)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const fn = value as Function;
    if (fn.name) return fn.name;
    return "anonymous";
  }

  if (typeof value === "object") {
    const tag = Object.prototype.toString.call(value);
    const match = /^\[object ([^\]]+)\]$/.exec(tag);
    if (match?.[1]) return match[1];
    return "Object";
  }

  return typeof value;
}
