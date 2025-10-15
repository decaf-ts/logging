import * as Decorators from "../../src/decorators";
import { debug, info, log, silly, verbose, final } from "../../src/decorators";
import { Logging, LogLevel } from "../../src";
import * as time from "../../src/time";

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

  it("log decorator forwards promise rejections through the exitMessage", async () => {
    const entryMessage = jest.fn().mockReturnValue("entry");
    const exitMessage = jest
      .fn()
      .mockImplementation((error?: Error, result?: any) =>
        error ? `failed:${error.message}` : `ok:${result}`
      );

    const methodLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as any;
    methodLogger.info.mockReturnValue(undefined);

    const rootLogger = { for: jest.fn().mockReturnValue(methodLogger) } as any;
    const forSpy = jest.spyOn(Logging, "for").mockReturnValue(rootLogger);

    class Svc {
      @log(LogLevel.info, 0, entryMessage, exitMessage)
      async op() {
        throw new Error("boom");
      }
    }

    const svc = new Svc();
    await expect(svc.op()).rejects.toThrow("boom");

    expect(entryMessage).toHaveBeenCalled();
    expect(exitMessage).toHaveBeenCalledWith(expect.any(Error));
    expect(methodLogger.error).toHaveBeenCalledWith("failed:boom");

    forSpy.mockRestore();
  });

  it("benchmark decorator logs failures for rejected promises", async () => {
    const methodLogger = {
      benchmark: jest.fn(),
    } as any;

    const rootLogger = { for: jest.fn().mockReturnValue(methodLogger) } as any;
    const forSpy = jest.spyOn(Logging, "for").mockReturnValue(rootLogger);
    const nowSpy = jest.spyOn(time, "now").mockReturnValue(5);

    class BenchSvc {
      @Decorators.benchmark()
      async run() {
        throw new Error("slow fail");
      }
    }

    const svc = new BenchSvc();
    await expect(svc.run()).rejects.toThrow("slow fail");

    expect(methodLogger.benchmark).toHaveBeenCalledWith(
      expect.stringContaining("failed in")
    );

    nowSpy.mockRestore();
    forSpy.mockRestore();
  });

  it("verbose coerces falsy values to zero before delegating", () => {
    const methodLogger = {
      verbose: jest.fn().mockReturnValue(undefined),
      error: jest.fn(),
    } as any;

    const rootLogger = { for: jest.fn().mockReturnValue(methodLogger) } as any;
    const forSpy = jest.spyOn(Logging, "for").mockReturnValue(rootLogger);

    class VerboseSvc {
      @Decorators.verbose(false)
      act(value: string) {
        return value;
      }
    }

    const svc = new VerboseSvc();
    expect(svc.act("done")).toBe("done");

    expect(methodLogger.verbose).toHaveBeenCalledWith(
      expect.stringContaining("called with"),
      0
    );

    forSpy.mockRestore();
  });
});
