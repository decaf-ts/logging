import { ObjectAccumulator } from "typed-object-accumulator";
import { isBrowser } from "../../src/web";
import { Environment } from "../../src/environment";
jest.mock("../../src/web");

describe("Environment", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("Should return the existing instance when calling instance() multiple times", () => {
    const firstInstance = Environment["instance"]();
    const secondInstance = Environment["instance"]();

    expect(firstInstance).toBe(secondInstance);
    expect(Environment["_instance"]).toBe(firstInstance);
  });

  it("should accumulate new properties into the environment", () => {
    const newProps = { testKey: "testValue", anotherKey: 42 };
    const result = Environment.accumulate(newProps);

    expect(result).toHaveProperty("testKey", "testValue");
    expect(result).toHaveProperty("anotherKey", 42);

    // Check if the accumulated properties are accessible via the instance
    expect(Environment["_instance"]).toHaveProperty("testKey", "testValue");
    expect(Environment["_instance"]).toHaveProperty("anotherKey", 42);

    // Verify that the result is an instance of Environment and ObjectAccumulator
    expect(result).toBeInstanceOf(Environment);
    expect(result).toBeInstanceOf(ObjectAccumulator);

    // Check if the keys method returns the accumulated keys
    const keys = Environment.keys(false);
    expect(keys).toContain("testKey");
    expect(keys).toContain("anotherKey");
  });

  it("Should retrieve environment variables from process.env in Node.js", () => {
    const mockProcessEnv = {
      TEST_VAR: "test_value",
    };
    Object.defineProperty(globalThis, "process", {
      value: { env: mockProcessEnv },
      writable: true,
    });

    (isBrowser as jest.Mock).mockReturnValue(false);

    const env = Environment["instance"]();
    const result = env["fromEnv"]("TEST_VAR");

    expect(isBrowser).toHaveBeenCalled();
    expect(result).toBe("test_value");
  });

  it("should retrieve environment variables from globalThis.ENV in browser", () => {
    jest.unmock("../../src/text");
    (isBrowser as jest.Mock).mockReturnValue(true);
    (globalThis as any).ENV = { TEST_VAR: "test_value" };

    const env = Environment["instance"]();
    const accumulated = env.accumulate({ TEST_VAR: "default_value" });

    expect(accumulated.TEST_VAR).toBe("test_value");

    delete (globalThis as any).ENV;
  });

  it("should return keys in ENV format when keys() is called with default parameter", () => {
    const mockInstance = {
      keys: jest.fn().mockReturnValue(["testKey", "anotherKey"]),
    };
    // @ts-expect-error jest crap
    jest.spyOn(Environment, "instance").mockReturnValue(mockInstance as any);

    const result = Environment.keys();

    expect(mockInstance.keys).toHaveBeenCalled();
    expect(result).toEqual(["TEST_KEY", "ANOTHER_KEY"]);
  });

  it("Should return keys in original format when keys() is called with false parameter", () => {
    const testData = { testKey: "testValue", anotherKey: 123 };
    Environment.accumulate(testData);

    const keys = Environment.keys(false);

    expect(keys).toEqual(expect.arrayContaining(["testKey", "anotherKey"]));
    expect(keys).not.toEqual(
      expect.arrayContaining(["TEST_KEY", "ANOTHER_KEY"])
    );
  });

  it("should override accumulated values with environment variables when available", () => {
    const mockIsBrowser = isBrowser as jest.MockedFunction<typeof isBrowser>;
    mockIsBrowser.mockReturnValue(false);

    const originalEnv = process.env;
    process.env = { ...originalEnv, TEST_KEY: "env_value" };

    const env = Environment.accumulate({
      testKey: "default_value",
    });

    expect(env["testKey"]).toBe("env_value");

    // Clean up
    process.env = originalEnv;
  });

  it("Should allow setting new values for accumulated properties", () => {
    const testObj = { testKey: "testValue" };
    const env = Environment.accumulate(testObj);

    expect(env.testKey).toBe("testValue");

    env.testKey = "newValue";
    expect(env.testKey).toBe("newValue");

    // Check if the original object is not modified
    expect(testObj.testKey).toBe("testValue");
  });

  it("Should handle accumulation of nested objects correctly", () => {
    const nestedObject = {
      level1: {
        level2: {
          level3: "value",
        },
      },
      anotherProp: "test",
    };

    const result = Environment.accumulate(nestedObject);

    expect(result).toHaveProperty("level1.level2.level3", "value");
    expect(result).toHaveProperty("anotherProp", "test");

    expect(Environment.keys(false)).toContain("level1");
    expect(Environment.keys(false)).toContain("anotherProp");

    expect(Environment.keys()).toContain("LEVEL1");
    expect(Environment.keys()).toContain("ANOTHER_PROP");
  });

  it("Expanded nested objects support ENV key composition via string coercion", () => {
    const env = Environment.accumulate({ service: { host: "localhost" } });
    const service = (env as any).service;
    expect(`${service}`).toBe("SERVICE");
    expect(`${service.host}`).toBe("SERVICE__HOST");
  });

  it("Environment.get returns accumulated value by key path", () => {
    Environment.accumulate({ sampleKey: "value123" });
    const got = Environment.get("sampleKey");
    expect(got).toBe("value123");
  });

  it("does not build ENV key composing proxies for blank string models (returns undefined)", () => {
    const env = Environment.accumulate({ service: "" });
    const value = (env as any).service;
    expect(value).toBeUndefined();
  });

  it("buildEnvProxy exposes own keys and property descriptors", () => {
    const target = (Environment as any).buildEnvProxy(
      { nested: { leaf: "x" } },
      ["cfg"]
    );
    expect(Object.keys(target)).toContain("nested");
    const descriptor = Object.getOwnPropertyDescriptor(target, "nested");
    expect(descriptor?.enumerable).toBe(true);
    expect(Object.getOwnPropertyDescriptor(target, "missing")).toBeUndefined();
  });

  it("buildEnvProxy reads values from browser ENV storage", () => {
    (isBrowser as jest.Mock).mockReturnValue(true);
    (globalThis as any).ENV = { CFG__URL: "https://example" };

    const proxy = (Environment as any).buildEnvProxy(undefined, ["cfg"]);
    expect(proxy.url).toBe("https://example");

    delete (globalThis as any).ENV;
    (isBrowser as jest.Mock).mockReturnValue(false);
  });

  it("proxy instance returns base values for symbol lookups", () => {
    const instance = Environment["instance"]();
    expect((instance as any)[Symbol.toPrimitive]).toBeUndefined();
  });

  describe("orThrow", () => {
    const restoreEnv = (key: string, previous: string | undefined) => {
      if (typeof previous === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = previous;
      }
    };

    it("returns the resolved value when present", () => {
      const env = Environment.accumulate({
        orThrowDefined: "present",
      });

      expect(env.orThrow().orThrowDefined).toBe("present");
    });

    it("applies runtime overrides before falling back", () => {
      const key = "OR_THROW_RUNTIME";
      const previous = process.env[key];
      process.env[key] = "runtime";

      const env = Environment.accumulate({
        orThrowRuntime: "default",
      });

      expect(env.orThrow().orThrowRuntime).toBe("runtime");

      restoreEnv(key, previous);
    });

    it("throws when runtime env resolves to an empty string", () => {
      const key = "OR_THROW_EMPTY";
      const previous = process.env[key];
      process.env[key] = "";

      const env = Environment.accumulate({
        orThrowEmpty: "default",
      });

      expect(() => env.orThrow().orThrowEmpty).toThrow(
        "Environment variable OR_THROW_EMPTY is required but was an empty string."
      );

      restoreEnv(key, previous);
    });

    it("throws when the model marks a required value with an empty string", () => {
      delete process.env["OR_THROW_REQUIRED"];
      const env = Environment.accumulate({
        orThrowRequired: "",
      });

      expect(() => env.orThrow().orThrowRequired).toThrow(
        "Environment variable OR_THROW_REQUIRED is required but was undefined."
      );
    });

    it("does not throw for optional undefined leaves", () => {
      const env = Environment.accumulate({
        orThrowOptional: undefined as any,
      });

      expect(env.orThrow().orThrowOptional).toBeUndefined();
    });

    it("throws for nested required leaves", () => {
      delete process.env["SERVICE__HOST"];
      const env = Environment.accumulate({
        service: { host: "" },
      });

      expect(() => env.orThrow().service.host).toThrow(
        "Environment variable SERVICE__HOST is required but was undefined."
      );
    });

    it("throws when nested runtime env resolves to an empty string", () => {
      const key = "RT_NESTED__EMPTY";
      const previous = process.env[key];
      process.env[key] = "";

      const env = Environment.accumulate({
        rtNested: { empty: "default" },
      });

      expect(() => env.orThrow().rtNested.empty).toThrow(
        `Environment variable ${key} is required but was an empty string.`
      );

      restoreEnv(key, previous);
    });

    it("returns runtime overrides for nested leaves", () => {
      const key = "RT_NESTED__VALUE";
      const previous = process.env[key];
      process.env[key] = "runtime";

      const env = Environment.accumulate({
        rtNested: { value: "default" },
      });

      expect(env.orThrow().rtNested.value).toBe("runtime");

      restoreEnv(key, previous);
    });

    it("enumerates nested proxy keys and descriptors", () => {
      const env = Environment.accumulate({ nestedProxy: { leaf: "value" } });

      const nested = env.orThrow().nestedProxy;

      expect(Object.keys(nested)).toContain("leaf");
      expect(Object.getOwnPropertyDescriptor(nested, "leaf")?.enumerable).toBe(
        true
      );
      expect(
        Object.getOwnPropertyDescriptor(nested, "missing")
      ).toBeUndefined();
    });

    it("falls back to base handler for symbol property access", () => {
      const env = Environment.accumulate({ symbolSpec: "value" });
      const symbol = Symbol("test");

      expect((env.orThrow() as any)[symbol]).toBeUndefined();
    });
  });
});
