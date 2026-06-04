import { Environment } from "../../src/environment";

describe("Environment (integration)", () => {
  const restoreEnv = (key: string, previous: string | undefined) => {
    if (typeof previous === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  };

  beforeEach(() => {
    (Environment as any)._instance = undefined;
  });

  afterEach(() => {
    (Environment as any)._instance = undefined;
  });

  it("parses floats from real process.env overrides", () => {
    const key = "INTEGRATION__SERVICE__RATIO";
    const previous = process.env[key];
    process.env[key] = "3.25";

    try {
      const env = Environment.accumulate({
        integration: {
          service: {
            ratio: 0,
          },
        },
      });

      expect(env.integration.service.ratio).toBe(3.25);
      expect(typeof env.integration.service.ratio).toBe("number");
    } finally {
      restoreEnv(key, previous);
    }
  });

  it("infers array dimensions from runtime overrides beyond the seed model", () => {
    const keys = [
      "INTEGRATION__ARRAY_PROP__0__OBJ",
      "INTEGRATION__ARRAY_PROP__1__OBJ",
      "INTEGRATION__ARRAY_PROP__2__OBJ",
    ];
    const previousValues = keys.map((key) => process.env[key]);
    process.env[keys[0]] = "zero";
    process.env[keys[1]] = "one";
    process.env[keys[2]] = "two";

    try {
      const env = Environment.accumulate({
        integration: {
          arrayProp: [{ obj: "seed" }],
        },
      });

      expect(env.integration.arrayProp[0].obj).toBe("zero");
      expect(env.integration.arrayProp[1].obj).toBe("one");
      expect(env.integration.arrayProp[2].obj).toBe("two");
      expect(Object.keys(env.integration.arrayProp as any)).toEqual(
        expect.arrayContaining(["0", "1", "2"])
      );
    } finally {
      keys.forEach((key, index) => {
        restoreEnv(key, previousValues[index]);
      });
    }
  });

  it("infers nested array dimensions from runtime overrides beyond the seed model", () => {
    const keys = [
      "INTEGRATION__ARRAY_PROP__1__CHILD__0__OBJ",
      "INTEGRATION__ARRAY_PROP__1__CHILD__1__OBJ",
    ];
    const previousValues = keys.map((key) => process.env[key]);
    process.env[keys[0]] = "nested-zero";
    process.env[keys[1]] = "nested-one";

    try {
      const env = Environment.accumulate({
        integration: {
          arrayProp: [
            { obj: "seed-zero" },
            { child: [{ obj: "seed-child" }] },
          ],
        },
      });

      expect(env.integration.arrayProp[1].child[0].obj).toBe("nested-zero");
      expect(env.integration.arrayProp[1].child[1].obj).toBe("nested-one");
      expect(Object.keys(env.integration.arrayProp[1].child as any)).toEqual(
        expect.arrayContaining(["0", "1"])
      );
    } finally {
      keys.forEach((key, index) => {
        restoreEnv(key, previousValues[index]);
      });
    }
  });
});
