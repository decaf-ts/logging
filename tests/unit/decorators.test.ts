import { debug, info, log, silly, verbose, final } from "../../src/decorators";
import { Logging, LogLevel } from "../../src";

describe("decorators unit", () => {
  beforeEach(() => {
    Logging.setConfig({ level: LogLevel.verbose, verbose: 1, style: false });
  });

  it("log decorator throws when used on non-method", () => {
    const dec = log();
    expect(() => dec({}, "prop" as any)).toThrow(
      "Logging decoration only applies to methods"
    );
  });

  it("final decorator throws when used on non-method (no descriptor)", () => {
    const dec = final();
    expect(() => dec({}, "prop" as any)).toThrow(
      "final decorator can only be used on methods"
    );
  });

  it("verbose overload treats boolean as benchmark flag", async () => {
    class Svc {
      @verbose(true)
      async op(x: string) {
        return `ok:${x}`;
      }
    }
    const s = new Svc();
    await expect(s.op("z")).resolves.toBe("ok:z");
  });

  it("other convenience decorators are callable", () => {
    class Svc2 {
      @info()
      a() {
        return 1;
      }
      @debug()
      b() {
        return 2;
      }
      @silly()
      c() {
        return 3;
      }
    }
    const s = new Svc2();
    expect(s.a()).toBe(1);
    expect(s.b()).toBe(2);
    expect(s.c()).toBe(3);
  });
});

