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
});
