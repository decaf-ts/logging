import { ObjectAccumulator } from "typed-object-accumulator";
import { toENVFormat } from "./text";
import { isBrowser } from "./web";
import {
  BrowserEnvKey,
  DefaultLoggingConfig,
  ENV_PATH_DELIMITER,
} from "./constants";

/**
 * @description A factory type for creating Environment instances.
 * @summary This describes factories that construct {@link Environment} derivatives with custom initialization.
 * @template T - The type of object the Environment will accumulate.
 * @template E - The specific Environment type to be created, extending Environment<T>.
 * @typedef {function(unknown[]): E} EnvironmentFactory
 * @memberOf module:Logging
 */
export type EnvironmentFactory<T extends object, E extends Environment<T>> = (
  ...args: unknown[]
) => E;

// Default to `any` so standalone static `Environment.accumulate(...)` calls
// remain permissive and don't narrow the global singleton's shape.
export type EnvironmentInstance<T extends object = any> = Environment<T> &
  T & { orThrow(): EnvironmentInstance<any> };

export type AccumulatedEnvironment<T extends object = any> =
  EnvironmentInstance<T> &
    ObjectAccumulator<T> & {
      accumulate<V extends object>(value: V): AccumulatedEnvironment<T & V>;
    };

/**
 * @description An environment accumulator that lazily reads from runtime sources.
 * @summary This class extends {@link ObjectAccumulator} to merge configuration objects while resolving values from Node or browser environment variables on demand.
 * @template T
 * @class Environment
 * @example
 * const Config = Environment.accumulate({ logging: { level: "info" } });
 * console.log(Config.logging.level);
 * console.log(String(Config.logging.level)); // => LOGGING__LEVEL key when serialized
 * @mermaid
 * sequenceDiagram
 *   participant Client
 *   participant Env as Environment
 *   participant Process as process.env
 *   participant Browser as globalThis.ENV
 *   Client->>Env: accumulate(partialConfig)
 *   Env->>Env: expand(values)
 *   Client->>Env: Config.logging.level
 *   alt Browser runtime
 *     Env->>Browser: lookup ENV key
 *     Browser-->>Env: resolved value
 *   else Node runtime
 *     Env->>Process: lookup ENV key
 *     Process-->>Env: resolved value
 *   end
 *   Env-->>Client: merged value
 */
const EmptyValue = Symbol("EnvironmentEmpty");
const ModelSymbol = Symbol("EnvironmentModel");

const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;

export class Environment<T extends object> extends ObjectAccumulator<T> {
  /**
   * @static
   * @protected
   * @description A factory function for creating Environment instances.
   * @summary Defines how new instances of the Environment class should be created.
   * @return {Environment<any>} A new instance of the Environment class.
   */
  protected static factory: EnvironmentFactory<any, any> =
    (): Environment<any> => new Environment();

  /**
   * @static
   * @private
   * @description The singleton instance of the Environment class.
   * @type {Environment<any>}
   */
  private static _instance: Environment<any>;

  protected constructor() {
    super();
    Object.defineProperty(this, ModelSymbol, {
      value: {},
      writable: true,
      enumerable: false,
      configurable: false,
    });
  }

  /**
   * @description Retrieves a value from the runtime environment.
   * @summary This method handles browser and Node.js environments by normalizing keys and parsing values.
   * @param {string} k - The key to resolve from the environment.
   * @return {unknown} The value that is resolved from the environment, or `undefined` if it is absent.
   */
  protected fromEnv(k: string) {
    let env: Record<string, unknown>;
    if (isBrowser()) {
      env =
        (
          globalThis as typeof globalThis & {
            [BrowserEnvKey]: Record<string, any>;
          }
        )[BrowserEnvKey] || {};
    } else {
      env = globalThis.process.env;
      k = toENVFormat(k);
    }
    return this.parseEnvValue(env[k]);
  }

  /**
   * @description Converts stringified environment values into native types.
   * @summary This method interprets booleans and numbers, while leaving other types unchanged.
   * @param {unknown} val - The raw value that is retrieved from the environment.
   * @return {unknown} The parsed value, converted to a boolean or number, or left as-is.
   */
  protected parseEnvValue(val: unknown) {
    return Environment.parseRuntimeValue(val);
  }

  private static parseRuntimeValue(val: unknown) {
    if (typeof val !== "string") return val;
    if (val === "true") return true;
    if (val === "false") return false;
    const trimmed = val.trim();
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    return val;
  }

  /**
   * @description Expands an object into the environment.
   * @summary This method defines lazy properties that first consult runtime variables before falling back to seeded values.
   * @template V - The type of the object being expanded.
   * @param {V} value - The object to expose through environment getters and setters.
   * @return {void}
   */
  protected override expand<V extends object>(value: V): void {
    Object.entries(value).forEach(([k, v]) => {
      Environment.mergeModel((this as any)[ModelSymbol], k, v);
      Object.defineProperty(this, k, {
        get: () => {
          const fromEnv = this.fromEnv(k);
          if (typeof fromEnv !== "undefined") return fromEnv;
          if (v && typeof v === "object") {
            return Environment.buildEnvProxy(v as any, [k]);
          }
          // If the model provides an empty string, mark with EmptyValue so instance proxy can return undefined without enabling key composition
          if (v === "") {
            return EmptyValue as unknown as V[keyof V];
          }
          return v;
        },
        set: (val: V[keyof V]) => {
          v = val;
        },
        configurable: true,
        enumerable: true,
      });
    });
  }

  /**
   * @description Returns a proxy that enforces required environment variables.
   * @summary Accessing a property that resolves to `undefined` or an empty string when declared in the model will throw an error.
   * @return {EnvironmentInstance<any>} A proxy of the environment that enforces required variables.
   */
  orThrow(): EnvironmentInstance<any> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const base = this;
    const modelRoot = (base as any)[ModelSymbol] as Record<string, any>;
    const parseRuntime = (raw: unknown) =>
      typeof raw !== "undefined" ? this.parseEnvValue(raw) : undefined;

    const missing = (key: string, empty: boolean = false) =>
      Environment.missingEnvError(key, empty);

    const createNestedProxy = (model: any, path: string[]): any => {
      const handler: ProxyHandler<any> = {
        get(_target, prop) {
          if (typeof prop !== "string") return undefined;
          if (Array.isArray(model) && prop === "length") return model.length;
          const nextPath = [...path, prop];
          const { key: envKey, value: runtimeRaw } =
            Environment.readRuntimeForPath(nextPath);
          if (typeof runtimeRaw === "string" && runtimeRaw.length === 0)
            throw missing(envKey, true);
          const runtimeValue = parseRuntime(runtimeRaw);
          if (typeof runtimeValue !== "undefined") {
            if (typeof runtimeValue === "string" && runtimeValue.length === 0)
              throw missing(envKey, true);
            return runtimeValue;
          }

          const hasProp =
            model && Object.prototype.hasOwnProperty.call(model, prop);
          if (!hasProp) throw missing(envKey);

          const modelValue = model[prop];
          if (typeof modelValue === "undefined") return undefined;
          if (modelValue === "") throw missing(envKey);

          if (modelValue && typeof modelValue === "object") {
            return createNestedProxy(modelValue, nextPath);
          }

          return modelValue;
        },
        ownKeys() {
          return model ? Reflect.ownKeys(model) : [];
        },
        getOwnPropertyDescriptor(_target, prop) {
          if (!model) return undefined;
          if (Object.prototype.hasOwnProperty.call(model, prop)) {
            return {
              enumerable: true,
              configurable: true,
            } as PropertyDescriptor;
          }
          return undefined;
        },
      };
      const target = Array.isArray(model) ? [] : {};
      return new Proxy(target, handler);
    };

    const handler: ProxyHandler<any> = {
      get(target, prop, receiver) {
        if (typeof prop !== "string")
          return Reflect.get(target, prop, receiver);
        const hasModelProp = Object.prototype.hasOwnProperty.call(
          modelRoot,
          prop
        );
        if (!hasModelProp) return Reflect.get(target, prop, receiver);

        const { key: envKey, value: runtimeRaw } =
          Environment.readRuntimeForPath([prop]);
        if (typeof runtimeRaw === "string" && runtimeRaw.length === 0)
          throw missing(envKey, true);
        const runtimeValue = parseRuntime(runtimeRaw);
        if (typeof runtimeValue !== "undefined") {
          if (typeof runtimeValue === "string" && runtimeValue.length === 0)
            throw missing(envKey, true);
          return runtimeValue;
        }

        const modelValue = modelRoot[prop];
        if (modelValue && typeof modelValue === "object") {
          return createNestedProxy(modelValue, [prop]);
        }

        if (typeof modelValue === "undefined")
          return Reflect.get(target, prop, receiver);

        const actual = Reflect.get(target, prop);
        if (typeof actual === "undefined" || actual === "")
          throw missing(envKey, actual === "");

        return actual;
      },
    };

    return new Proxy(base, handler) as EnvironmentInstance<any>;
  }

  /**
   * @protected
   * @static
   * @description Retrieves or creates the singleton instance of the Environment class.
   * @summary This method ensures that only one {@link Environment} instance is created, and wraps it in a proxy to compose ENV keys on demand.
   * @template E
   * @param {...unknown[]} args - Arguments that are forwarded to the factory when instantiating the singleton.
   * @return {E} The singleton environment instance.
   */
  protected static instance<E extends Environment<any>>(...args: unknown[]): E {
    if (!Environment._instance) {
      const base = Environment.factory(...args) as E;
      const proxied = new Proxy(base as any, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver);
          if (value === EmptyValue) return undefined;
          // If the property exists on the instance but resolves to undefined, return undefined (no proxy)
          if (
            typeof prop === "string" &&
            Object.prototype.hasOwnProperty.call(target, prop)
          ) {
            if (typeof value === "undefined") return undefined;
          }
          if (typeof value !== "undefined") return value;
          if (typeof prop === "string") {
            // Avoid interfering with logging config lookups for optional fields like 'app'
            if (prop === "app") return undefined;
            return Environment.buildEnvProxy(undefined, [prop]);
          }
          return value;
        },
      });
      Environment._instance = proxied as any;
    }
    return Environment._instance as E;
  }

  // Instance-level override so chained calls to `.accumulate(...)` keep the
  // EnvironmentInstance typing (including `orThrow`) instead of falling back
  // to the ObjectAccumulator return type which lacks that method.
  public override accumulate<V extends object>(
    value: V
  ): AccumulatedEnvironment<T & V> {
    // delegate to base behavior to define properties and update internal size
    super.accumulate(value as any);
    return this as unknown as AccumulatedEnvironment<T & V>;
  }

  /**
   * @static
   * @description Accumulates the given value into the environment.
   * @summary This method adds new properties and hides raw descriptors to avoid leaking enumeration semantics.
   * @template V
   * @param {V} value - The object to merge into the environment.
   * @return {AccumulatedEnvironment<any>} The updated environment reference.
   */
  static accumulate<V extends object>(value: V): AccumulatedEnvironment<any> {
    const instance = Environment.instance<Environment<any>>();
    Object.keys(instance as any).forEach((key) => {
      const desc = Object.getOwnPropertyDescriptor(instance as any, key);
      if (desc && desc.configurable && desc.enumerable) {
        Object.defineProperty(instance as any, key, {
          ...desc,
          enumerable: false,
        });
      }
    });
    // Call the accumulator to attach properties, but always return the
    // proxied singleton `instance` so instance methods like `orThrow` are
    // preserved on every call to `Environment.accumulate`.
    instance.accumulate(value);
    // Also expose the ObjectAccumulator typing so chained accumulate calls
    // preserve the accumulated type information.
    return instance as unknown as AccumulatedEnvironment<any>;
  }

  /**
   * @description Retrieves a value using a dot-path key from the accumulated environment.
   * @summary This method delegates to the singleton instance to access stored configuration.
   * @param {string} key - The key to resolve from the environment store.
   * @return {unknown} The stored value that corresponds to the provided key.
   */
  static get(key: string) {
    return Environment._instance.get(key);
  }

  private static formatEnvSegment(segment: string) {
    return camelCasePattern.test(segment)
      ? toENVFormat(segment)
      : segment.toUpperCase();
  }

  private static buildEnvKey(path: string[]) {
    return path
      .map((segment) => Environment.formatEnvSegment(segment))
      .join(ENV_PATH_DELIMITER);
  }

  private static buildRawKey(path: string[]) {
    return path.join(ENV_PATH_DELIMITER);
  }

  private static readRuntimeForPath(path: string[]) {
    const formattedKey = Environment.buildEnvKey(path);
    const rawKey = Environment.buildRawKey(path);
    const runtimeFormatted = Environment.readRuntimeEnv(formattedKey);
    if (typeof runtimeFormatted !== "undefined") {
      return { key: formattedKey, value: runtimeFormatted };
    }
    if (rawKey !== formattedKey) {
      const runtimeRaw = Environment.readRuntimeEnv(rawKey);
      if (typeof runtimeRaw !== "undefined") {
        return { key: rawKey, value: runtimeRaw };
      }
    }
    return { key: formattedKey, value: undefined };
  }

  /**
   * @description Builds a proxy that composes environment keys for nested properties.
   * @summary This allows chained property access to emit uppercase ENV identifiers, while honoring existing runtime overrides.
   * @param {any} current - The seed model segment to use when projecting nested structures.
   * @param {string[]} path - The accumulated path segments that lead to the proxy.
   * @return {any} A proxy that resolves environment values or composes additional proxies for deeper paths.
   */
  private static buildEnvProxy(current: any, path: string[]): any {
    const readEnv = (key: string): unknown => {
      return Environment.readRuntimeEnv(key);
    };

    const arrayIndexPattern = /^[0-9]+$/;
    const isArrayIndex = (prop: string | symbol): prop is string =>
      typeof prop === "string" && arrayIndexPattern.test(prop);

    const handler: ProxyHandler<any> = {
      get(_target, prop: string | symbol) {
        if (prop === Symbol.toPrimitive) {
          return () => Environment.buildEnvKey(path);
        }
        if (prop === "toString") {
          return () => Environment.buildEnvKey(path);
        }
        if (prop === "valueOf") {
          return () => Environment.buildEnvKey(path);
        }
        if (typeof prop === "symbol") return undefined;

        if (Array.isArray(current) && prop === "length") return current.length;
        const nextPath = [...path, prop];
        const composedKey = Environment.buildEnvKey(nextPath);
        const rawKey = Environment.buildRawKey(nextPath);

        // If an ENV value exists for this path, return it directly
        let envValue = readEnv(composedKey);
        if (typeof envValue === "undefined" && rawKey !== composedKey) {
          envValue = readEnv(rawKey);
        }
        if (typeof envValue !== "undefined")
          return Environment.parseRuntimeValue(envValue);

        const hasProp =
          !!current && Object.prototype.hasOwnProperty.call(current, prop);
        const nextModel = hasProp ? (current as any)[prop] : undefined;

        if (Array.isArray(current) && isArrayIndex(prop)) {
          if (!hasProp) return undefined;
          if (nextModel && typeof nextModel === "object")
            return Environment.buildEnvProxy(nextModel, nextPath);
          return Environment.parseRuntimeValue(nextModel);
        }

        const isNextObject = nextModel && typeof nextModel === "object";
        if (isNextObject) return Environment.buildEnvProxy(nextModel, nextPath);

        if (hasProp && nextModel === "") return undefined;
        if (hasProp && typeof nextModel === "undefined") return undefined;

        if (hasProp) {
          return Environment.parseRuntimeValue(nextModel);
        }

        // Always return a proxy for further path composition when no ENV value;
        // do not surface primitive model defaults here (this API is for key composition).
        return Environment.buildEnvProxy(undefined, nextPath);
      },
      ownKeys() {
        return current ? Reflect.ownKeys(current) : [];
      },
      getOwnPropertyDescriptor(_t, p) {
        if (!current) return undefined as any;
        if (Object.prototype.hasOwnProperty.call(current, p)) {
          return { enumerable: true, configurable: true } as PropertyDescriptor;
        }
        return undefined as any;
      },
    };

    const target = Array.isArray(current) ? [] : ({} as any);
    return new Proxy(target, handler);
  }

  /**
   * @static
   * @description Retrieves the keys of the environment, optionally converting them to ENV format.
   * @summary This method gets all keys in the environment, with an option to format them for environment variables.
   * @param {boolean} [toEnv=true] - Whether to convert the keys to ENV format.
   * @return {string[]} An array of keys from the environment.
   */
  static keys(toEnv: boolean = true): string[] {
    return Environment.instance()
      .keys()
      .map((k) => (toEnv ? toENVFormat(k) : k));
  }

  private static mergeModel(
    model: Record<string, any>,
    key: string,
    value: any
  ) {
    if (!model) return;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const existing = model[key];
      const target =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? existing
          : {};
      model[key] = target;
      Object.entries(value).forEach(([childKey, childValue]) => {
        Environment.mergeModel(target, childKey, childValue);
      });
      return;
    }
    model[key] = value;
  }

  private static readRuntimeEnv(key: string): unknown {
    if (isBrowser()) {
      const env = (
        globalThis as typeof globalThis & {
          [BrowserEnvKey]?: Record<string, unknown>;
        }
      )[BrowserEnvKey];
      return env ? env[key] : undefined;
    }
    return (globalThis as any)?.process?.env?.[key];
  }

  private static missingEnvError(key: string, empty: boolean): Error {
    const suffix = empty ? "an empty string" : "undefined";
    return new Error(
      `Environment variable ${key} is required but was ${suffix}.`
    );
  }
}

/**
 * @description A singleton environment instance that is seeded with the default logging configuration.
 * @summary This constant combines {@link DefaultLoggingConfig} with runtime environment variables to provide consistent logging defaults across platforms.
 * @const {AccumulatedEnvironment<any>} LoggedEnvironment
 * @memberOf module:Logging
 */
export const LoggedEnvironment = Environment.accumulate(
  Object.assign(
    {
      app: undefined as string | undefined,
    },
    DefaultLoggingConfig,
    {
      env:
        (isBrowser() && (globalThis as any)[BrowserEnvKey]
          ? (globalThis as any)[BrowserEnvKey]["NODE_ENV"]
        : (globalThis as any).process.env["NODE_ENV"]) || "development",
    }
  )
);
