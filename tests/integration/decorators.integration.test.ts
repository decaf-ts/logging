import { LogLevel, Logging, DefaultLoggingConfig } from "../../src";
import { log, debug, info, silly, verbose } from "../../src/decorators";

// Integration tests: no mocks; we only execute decorated methods to cover branches.

describe("decorators (integration)", () => {
  beforeEach(() => {
    // ensure consistent baseline
    Logging.setConfig({ ...DefaultLoggingConfig, style: false });
  });

  class Service {
    @info()
    sum(a: number, b: number) {
      return a + b;
    }

    @log(LogLevel.debug, true)
    slowDouble(x: number) {
      // simulate small delay
      const start = Date.now();
      while (Date.now() - start < 5) {
        //do nothing
      }
      return x * 2;
    }

    @log(LogLevel.info, true)
    async asyncOp(val: string) {
      await new Promise((r) => setTimeout(r, 1));
      return `ok:${val}`;
    }

    @debug()
    d(a: string) {
      return a.toUpperCase();
    }

    @info()
    i(a: string) {
      return a.toLowerCase();
    }

    @silly()
    s(a: string) {
      return `${a}!`;
    }

    @verbose(2)
    v(a: string) {
      return `v:${a}`;
    }

    @verbose(true)
    vb(a: string) {
      return `vb:${a}`;
    }
  }

  it("executes sync decorated methods and returns expected values", () => {
    const svc = new Service();
    expect(svc.sum(2, 3)).toBe(5);
    expect(svc.slowDouble(4)).toBe(8);
    expect(svc.d("hi")).toBe("HI");
    expect(svc.i("HI")).toBe("hi");
    expect(svc.s("ok")).toBe("ok!");
    expect(svc.v("x")).toBe("v:x");
    expect(svc.vb("x")).toBe("vb:x");
  });

  it("executes async decorated method with benchmark and resolves", async () => {
    const svc = new Service();
    await expect(svc.asyncOp("z")).resolves.toBe("ok:z");
  });
});
