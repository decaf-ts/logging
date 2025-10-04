import { Environment } from "../../src/environment";
import { ENV_PATH_DELIMITER } from "../../src/constants

describe("Environment.fromModel", () => {
  it("exports a path delimiter constant", () => {
    expect(ENV_PATH_DELIMITER).toBe("__");
  });

  it("maps top-level properties to ENV strings", () => {
    const env = Environment.fromModel({ service: { host: "", port: 0 }, logLevel: "" });

    expect(String((env as any).service)).toBe("SERVICE");
    expect(String((env as any).logLevel)).toBe("LOG_LEVEL");
  });

  it("maps nested properties using delimiter between parent and child", () => {
    const env = Environment.fromModel({ service: { host: "", port: 0 } });

    expect(String((env as any).service.host)).toBe(
      ["SERVICE", "HOST"].join(ENV_PATH_DELIMITER)
    );
    expect(String((env as any).service.port)).toBe(
      ["SERVICE", "PORT"].join(ENV_PATH_DELIMITER)
    );
  });

  it("supports template string coercion for any depth", () => {
    const env = Environment.fromModel({ a: { b: { c: 1 } } });
    expect(`${(env as any).a}`).toBe("A");
    expect(`${(env as any).a.b}`).toBe("A__B");
    expect(`${(env as any).a.b.c}`).toBe("A__B__C");
  });

  it("supports explicit toString() and valueOf() coercion", () => {
    const env = Environment.fromModel({ x: { y: true } });
    expect(((env as any).x as any).toString()).toBe("X");
    expect(((env as any).x.y as any).toString()).toBe("X__Y");
    // valueOf should also return the composed key
    expect(((env as any).x as any).valueOf()).toBe("X");
  });

  it("getOwnPropertyDescriptor returns undefined when key not in model", () => {
    const env = Environment.fromModel({ known: 1 } as any);
    const desc = Object.getOwnPropertyDescriptor(env as any, "unknown");
    expect(desc).toBeUndefined();
  });

  it("only enumerates keys present in the model shape", () => {
    const env = Environment.fromModel({ one: { two: 2 }, three: 3 });
    const keys = Object.keys(env as any);
    expect(keys.sort()).toEqual(["one", "three"]);
  });

  it("composes ENV path even for keys not present in the model", () => {
    const env = Environment.fromModel({ known: { child: true } });
    expect(String((env as any).unknown.key)).toBe("UNKNOWN__KEY");
  });
});
