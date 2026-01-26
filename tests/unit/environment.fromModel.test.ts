import { Environment } from "../../src/environment";
import { ENV_PATH_DELIMITER } from "../../src/constants";

describe("Environment.proxy", () => {
  it("exports a path delimiter constant", () => {
    expect(ENV_PATH_DELIMITER).toBe("__");
  });

  it("maps top-level properties to ENV strings (except undefined which resolves to undefined)", () => {
    const env = Environment.accumulate({
      service: { host: "", port: 0 },
      logLevel: undefined,
    });

    expect(String((env as any).service)).toBe("SERVICE");
    expect((env as any).logLevel).toBeUndefined();
  });

  it("maps nested properties using delimiter between parent and child (non-empty leaves), empty string leaves resolve to undefined", () => {
    const env = Environment.accumulate({ service: { host: "", port: 0 } });

    expect((env as any).service.host).toBeUndefined();
    expect(String((env as any).service.port)).toBe(
      ["SERVICE", "PORT"].join(ENV_PATH_DELIMITER)
    );
  });

  it("supports template string coercion for any depth", () => {
    const env = Environment.accumulate({ a: { b: { c: 1 } } });
    expect(`${(env as any).a}`).toBe("A");
    expect(`${(env as any).a.b}`).toBe("A__B");
    expect(`${(env as any).a.b.c}`).toBe("A__B__C");
  });

  it("supports explicit toString() and valueOf() coercion", () => {
    const env = Environment.accumulate({ x: { y: true } });
    expect(((env as any).x as any).toString()).toBe("X");
    expect(((env as any).x.y as any).toString()).toBe("X__Y");
    // valueOf should also return the composed key
    expect(((env as any).x as any).valueOf()).toBe("X");
  });

  it("getOwnPropertyDescriptor returns undefined when key not in model", () => {
    const env = Environment.accumulate({ known: 1 } as any);
    const desc = Object.getOwnPropertyDescriptor(env as any, "unknown");
    expect(desc).toBeUndefined();
  });

  it("only enumerates keys present in the model shape", () => {
    const env = Environment.accumulate({ one: { two: 2 }, three: 3 });
    const keys = Object.keys(env as any);
    expect(keys.sort()).toEqual(["one", "three"]);
  });

  it("composes ENV path even for keys not present in the model", () => {
    const env = Environment.accumulate({ known: { child: true } });
    expect(String((env as any).unknown.key)).toBe("UNKNOWN__KEY");
  });

  it("reads from ENV when available and when craete via accumulate", () => {
    process.env["SERVICE__HOST"] = "envhost";
    process.env["SERVICE__PORT"] = "port";
    process.env["SERVICE__CONFIG__ALLOW"] = "allow";
    const env = Environment.accumulate({
      service: { host: "defaulthost", port: 8080, config: { allow: "deny" } },
    });

    expect(env.service.host).toBe("envhost");
    expect(env.service.port).toBe("port");
    expect(env.service.config.allow).toBe("allow");
  });

  it("parses numeric overrides from ENV when returning proxy leaves", () => {
    const envKey = "SERVICE__PORT";
    const previous = process.env[envKey];
    process.env[envKey] = "3";
    try {
      const env = Environment.accumulate({ service: { port: 0 } });
      expect(env.service.port).toBe(3);
      expect(typeof env.service.port).toBe("number");
    } finally {
      if (typeof previous === "undefined") delete process.env[envKey];
      else process.env[envKey] = previous;
    }
  });

  it("parses boolean overrides from ENV when returning proxy leaves", () => {
    const envKey = "SERVICE__ENABLED";
    const previous = process.env[envKey];
    process.env[envKey] = "true";
    try {
      const env = Environment.accumulate({ service: { enabled: false } });
      expect(env.service.enabled).toBe(true);
      expect(typeof env.service.enabled).toBe("boolean");
    } finally {
      if (typeof previous === "undefined") delete process.env[envKey];
      else process.env[envKey] = previous;
    }
  });

  it("treats explicitly undefined model leaves as undefined (no proxy) at any depth", () => {
    const env = Environment.accumulate({
      top: undefined,
      nested: { leaf: undefined, other: 1 },
    } as any);

    expect((env as any).top).toBeUndefined();
    expect((env as any).nested.leaf).toBeUndefined();
    // ensure other non-undefined leaf still composes
    expect(String((env as any).nested.other)).toBe(
      ["NESTED", "OTHER"].join(ENV_PATH_DELIMITER)
    );
  });
});
