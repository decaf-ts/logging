// ...existing code...
import { Environment } from "../../src/environment";
import { isBrowser } from "../../src/web";

jest.mock("../../src/web");

describe("Environment.accumulate preserves orThrow", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("keeps orThrow after multiple accumulate calls and returns the proxied instance", () => {
    // First accumulation
    const first = Environment.accumulate({ alpha: "one" });
    expect(typeof first.orThrow).toBe("function");
    expect(first.orThrow().alpha).toBe("one");

    // Second accumulation
    const second = Environment.accumulate({ beta: "two" });
    expect(typeof second.orThrow).toBe("function");
    expect(second.orThrow().beta).toBe("two");

    // The singleton instance should reflect both values
    const combined = Environment.accumulate({ gamma: "three" });
    expect(combined.orThrow().alpha).toBe("one");
    expect(combined.orThrow().beta).toBe("two");
    expect(combined.orThrow().gamma).toBe("three");

    // Ensure the returned object remains an Environment-like proxy exposing orThrow
    expect((combined as any).orThrow).toBeDefined();
    expect(typeof (combined as any).orThrow).toBe("function");
  });

  it("orThrow continues to enforce required env variables after repeated accumulations", () => {
    // ensure node mode
    (isBrowser as jest.Mock).mockReturnValue(false);

    const key = "REPEATED__REQUIRED";
    const prev = process.env[key];
    delete process.env[key];

    const env = Environment.accumulate({ repeated: { required: "" } });

    expect(() => env.orThrow().repeated.required).toThrow();

    // restore
    if (typeof prev === "undefined") delete process.env[key];
    else process.env[key] = prev;
  });

  it("orThrow nested proxies survive JSON.stringify (toJSON called internally)", () => {
    (isBrowser as jest.Mock).mockReturnValue(false);

    const hostKey = "DB__HOST";
    const prevHost = process.env[hostKey];
    process.env[hostKey] = "localhost";

    const env = Environment.accumulate({
      db: { host: "", port: 5432 },
    });

    // JSON.stringify calls .toJSON() on the proxy internally.
    // The proxy must not interpret "toJSON" as an env-var lookup
    // (which would build key "DB__TO_JSON" and throw "required but was undefined").
    const db = env.orThrow().db;
    expect(() => JSON.stringify(db)).not.toThrow();

    const parsed = JSON.parse(JSON.stringify(db));
    expect(parsed.host).toBe("localhost");
    expect(parsed.port).toBe(5432);

    if (typeof prevHost === "undefined") delete process.env[hostKey];
    else process.env[hostKey] = prevHost;
  });

  it("orThrow nested proxies do not interpret well-known methods as env vars", () => {
    (isBrowser as jest.Mock).mockReturnValue(false);

    const env = Environment.accumulate({
      server: { host: "0.0.0.0", port: 8080 },
    });

    const server = env.orThrow().server;

    // `then` is checked by the JS runtime when awaiting a thenable.
    // If the proxy returns a truthy value, `await` treats it as a Promise.
    expect(server.then).toBeUndefined();

    // `toJSON` is called by JSON.stringify. Must not throw.
    expect(() => server.toJSON).not.toThrow();

    // `toString` / `valueOf` / `Symbol.toPrimitive` are used for string
    // coercion and should return the composed env key (same as buildEnvProxy).
    expect(server.toString()).toBe("SERVER");
    expect(server.valueOf()).toBe("SERVER");
    expect(String(server)).toBe("SERVER");

    // `constructor` should reflect the real prototype, not throw.
    expect(server.constructor).toBe(Object);
  });
});
