import { ObjectAccumulator } from "typed-object-accumulator";
import { toENVFormat } from "./text";
import { isBrowser } from "./web";
import {
  BrowserEnvKey,
  DefaultLoggingConfig,
  ENV_PATH_DELIMITER,
} from "./constants";
import { LoggingConfig } from "./types";

/**
 * @description Factory type for creating Environment instances.
 * @summary Defines a function type that creates and returns Environment instances.
 *
 * @template T - The type of object the Environment will accumulate.
 * @template E - The specific Environment type to be created, extending Environment<T>.
 * @typedef {function(...unknown[]): E} EnvironmentFactory
 * @memberOf module:Logging
 */
export type EnvironmentFactory<T extends object, E extends Environment<T>> = (
  ...args: unknown[]
) => E;

/**
 * @class Environment
 * @extends {ObjectAccumulator<T>}
 * @template T
 * @description A class representing an environment with accumulation capabilities.
 * @summary Manages environment-related data and provides methods for accumulation and key retrieval.
 * @param {T} [initialData] - The initial data to populate the environment with.
 */
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
  }

  /**
   * @description Retrieves a value from the environment
   * @summary Gets a value from the environment variables, handling browser and Node.js environments differently
   * @param {string} k - The key to retrieve from the environment
   * @return {unknown} The value from the environment, or undefined if not found
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

  protected parseEnvValue(val: unknown) {
    if (typeof val !== "string") return val;
    if (val === "true") return true;
    if (val === "false") return false;
    const result = parseFloat(val);
    if (!isNaN(result)) return result;
    return val;
  }

  /**
   * @description Expands an object into the environment
   * @summary Defines properties on the environment object that can be accessed as getters and setters
   * @template V - Type of the object being expanded
   * @param {V} value - The object to expand into the environment
   * @return {void}
   */
  protected override expand<V extends object>(value: V): void {
    Object.entries(value).forEach(([k, v]) => {
      Object.defineProperty(this, k, {
        get: () => {
          const fromEnv = this.fromEnv(k);
          if (typeof fromEnv !== "undefined") return fromEnv;
          if (v && typeof v === "object") {
            return Environment.buildEnvProxy(v as any, [k]);
          }
          // If the model provides an empty string, expose a proxy that composes ENV keys
          if (v === "") {
            return Environment.buildEnvProxy(undefined, [k]);
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
   * @protected
   * @static
   * @description Retrieves or creates the singleton instance of the Environment class.
   * @summary Ensures only one instance of the Environment class exists.
   * @template E
   * @param {...unknown[]} args - Arguments to pass to the factory function if a new instance is created.
   * @return {E} The singleton instance of the Environment class.
   */
  protected static instance<E extends Environment<any>>(...args: unknown[]): E {
    if (!Environment._instance) {
      const base = Environment.factory(...args) as E;
      const proxied = new Proxy(base as any, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver);
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

  /**
   * @static
   * @description Accumulates the given value into the environment.
   * @summary Adds new properties to the environment from the provided object.
   * @template V
   * @param {V} value - The object to accumulate into the environment.
   * @return {V} The updated environment instance.
   */
  static accumulate<V extends object>(
    value: V
  ): typeof Environment._instance &
    V &
    ObjectAccumulator<typeof Environment._instance & V> {
    const instance = Environment.instance();
    Object.keys(instance as any).forEach((key) => {
      const desc = Object.getOwnPropertyDescriptor(instance as any, key);
      if (desc && desc.configurable && desc.enumerable) {
        Object.defineProperty(instance as any, key, {
          ...desc,
          enumerable: false,
        });
      }
    });
    return instance.accumulate(value);
  }

  static get(key: string) {
    return Environment._instance.get(key);
  }

  private static buildEnvProxy(current: any, path: string[]): any {
    const buildKey = (p: string[]) =>
      p.map((seg) => toENVFormat(seg)).join(ENV_PATH_DELIMITER);

    // Helper to read from the active environment given a composed key
    const readEnv = (key: string): unknown => {
      if (isBrowser()) {
        const env = (
          globalThis as typeof globalThis & {
            [BrowserEnvKey]?: Record<string, unknown>;
          }
        )[BrowserEnvKey];
        return env ? env[key] : undefined;
      }
      return (globalThis as any)?.process?.env?.[key];
    };

    const handler: ProxyHandler<any> = {
      get(_target, prop: string | symbol) {
        if (prop === Symbol.toPrimitive) {
          return () => buildKey(path);
        }
        if (prop === "toString") {
          return () => buildKey(path);
        }
        if (prop === "valueOf") {
          return () => buildKey(path);
        }
        if (typeof prop === "symbol") return undefined;

        const nextModel =
          current && Object.prototype.hasOwnProperty.call(current, prop)
            ? (current as any)[prop]
            : undefined;
        const nextPath = [...path, prop];
        const composedKey = buildKey(nextPath);

        // If an ENV value exists for this path, return it directly
        const envValue = readEnv(composedKey);
        if (typeof envValue !== "undefined") return envValue;

        // Otherwise, if the model has an object at this path, keep drilling with a proxy
        const isNextObject = nextModel && typeof nextModel === "object";
        if (isNextObject) return Environment.buildEnvProxy(nextModel, nextPath);

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

    const target = {} as any;
    return new Proxy(target, handler);
  }

  /**
   * @static
   * @description Retrieves the keys of the environment, optionally converting them to ENV format.
   * @summary Gets all keys in the environment, with an option to format them for environment variables.
   * @param {boolean} [toEnv=true] - Whether to convert the keys to ENV format.
   * @return {string[]} An array of keys from the environment.
   */
  static keys(toEnv: boolean = true): string[] {
    return Environment.instance()
      .keys()
      .map((k) => (toEnv ? toENVFormat(k) : k));
  }
}

export const LoggedEnvironment = Environment.accumulate(
  Object.assign({}, DefaultLoggingConfig, {
    env:
      (isBrowser() && (globalThis as any)[BrowserEnvKey]
        ? (globalThis as any)[BrowserEnvKey]["NODE_ENV"]
        : (globalThis as any).process.env["NODE_ENV"]) || "development",
  })
);
