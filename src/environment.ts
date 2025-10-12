import { ObjectAccumulator } from "typed-object-accumulator";
import { toENVFormat } from "./text";
import { isBrowser } from "./web";
import {
  BrowserEnvKey,
  DefaultLoggingConfig,
  ENV_PATH_DELIMITER,
} from "./constants";

/**
 * @description Factory type for creating Environment instances.
 * @summary Describes factories that construct {@link Environment} derivatives with custom initialization.
 * @template T - The type of object the Environment will accumulate.
 * @template E - The specific Environment type to be created, extending Environment<T>.
 * @typedef {function(unknown[]): E} EnvironmentFactory
 * @memberOf module:Logging
 */
export type EnvironmentFactory<T extends object, E extends Environment<T>> = (
  ...args: unknown[]
) => E;

/**
 * @description Environment accumulator that lazily reads from runtime sources.
 * @summary Extends {@link ObjectAccumulator} to merge configuration objects while resolving values from Node or browser environment variables on demand.
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
   * @description Retrieves a value from the runtime environment.
   * @summary Handles browser and Node.js environments by normalizing keys and parsing values.
   * @param {string} k - Key to resolve from the environment.
   * @return {unknown} Value resolved from the environment or `undefined` when absent.
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
   * @summary Interprets booleans and numbers while leaving other types unchanged.
   * @param {unknown} val - Raw value retrieved from the environment.
   * @return {unknown} Parsed value converted to boolean, number, or left as-is.
   */
  protected parseEnvValue(val: unknown) {
    if (typeof val !== "string") return val;
    if (val === "true") return true;
    if (val === "false") return false;
    const result = parseFloat(val);
    if (!isNaN(result)) return result;
    return val;
  }

  /**
   * @description Expands an object into the environment.
   * @summary Defines lazy properties that first consult runtime variables before falling back to seeded values.
   * @template V - Type of the object being expanded.
   * @param {V} value - Object to expose through environment getters and setters.
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
   * @summary Ensures only one {@link Environment} instance is created, wrapping it in a proxy to compose ENV keys on demand.
   * @template E
   * @param {...unknown[]} args - Arguments forwarded to the factory when instantiating the singleton.
   * @return {E} Singleton environment instance.
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
   * @summary Adds new properties, hiding raw descriptors to avoid leaking enumeration semantics.
   * @template T
   * @template V
   * @param {V} value - Object to merge into the environment.
   * @return {Environment} Updated environment reference.
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

  /**
   * @description Retrieves a value using a dot-path key from the accumulated environment.
   * @summary Delegates to the singleton instance to access stored configuration.
   * @param {string} key - Key to resolve from the environment store.
   * @return {unknown} Stored value corresponding to the provided key.
   */
  static get(key: string) {
    return Environment._instance.get(key);
  }

  /**
   * @description Builds a proxy that composes environment keys for nested properties.
   * @summary Allows chained property access to emit uppercase ENV identifiers while honoring existing runtime overrides.
   * @param {any} current - Seed model segment used when projecting nested structures.
   * @param {string[]} path - Accumulated path segments leading to the proxy.
   * @return {any} Proxy that resolves environment values or composes additional proxies for deeper paths.
   */
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

/**
 * @description Singleton environment instance seeded with default logging configuration.
 * @summary Combines {@link DefaultLoggingConfig} with runtime environment variables to provide consistent logging defaults across platforms.
 * @const LoggedEnvironment
 * @memberOf module:Logging
 */
export const LoggedEnvironment = Environment.accumulate(
  Object.assign({}, DefaultLoggingConfig, {
    env:
      (isBrowser() && (globalThis as any)[BrowserEnvKey]
        ? (globalThis as any)[BrowserEnvKey]["NODE_ENV"]
        : (globalThis as any).process.env["NODE_ENV"]) || "development",
  })
);
