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
    // @ts-expect-error accessing dynamically
    const service = (env as any).service;
    expect(`${service}`).toBe("SERVICE");
    expect(`${service.host}`).toBe("SERVICE__HOST");
  });

  it("Environment.get returns accumulated value by key path", () => {
    Environment.accumulate({ sampleKey: "value123" });
    // @ts-expect-error accessing private in test context
    const got = Environment.get("sampleKey");
    expect(got).toBe("value123");
  });

  it("expands blank string models into ENV key composing proxies", () => {
    const env = Environment.accumulate({ service: "" });
    // @ts-expect-error accessing dynamically
    const proxy = (env as any).service;
    expect(`${proxy}`).toBe("SERVICE");
    expect(`${proxy.api}`).toBe("SERVICE__API");
  });

  it("buildEnvProxy exposes own keys and property descriptors", () => {
    const target = (Environment as any).buildEnvProxy(
      { nested: { leaf: "x" } },
      ["cfg"]
    );
    expect(Object.keys(target)).toContain("nested");
    const descriptor = Object.getOwnPropertyDescriptor(target, "nested");
    expect(descriptor?.enumerable).toBe(true);
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
});
