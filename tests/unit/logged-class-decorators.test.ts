import { benchmark, info, log } from "../../src/decorators";
import { LoggedClass, Logging, LogLevel } from "../../src";

describe("decorators logged classes unit", () => {
  let logMock: jest.SpyInstance;
  let errorMock: jest.SpyInstance;

  beforeEach(() => {
    Logging.setConfig({ level: LogLevel.verbose, verbose: 1, style: false });
    logMock = jest.spyOn(console, "log");
    errorMock = jest.spyOn(console, "error");
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("benchmark decorator tracks time", async () => {
    class Logged extends LoggedClass {
      constructor() {
        super();
      }
      @benchmark()
      async opAsync(x: string) {
        return `ok:${x}`;
      }

      @info()
      @benchmark()
      op(x: string) {
        return `ok:${x}`;
      }
    }
    const s = new Logged();
    await expect(s.opAsync("z")).resolves.toBe("ok:z");

    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock).toHaveBeenCalledWith(
      expect.stringContaining("Logged.opAsync")
    );
    expect(s.op("z")).toBe("ok:z");

    expect(logMock).toHaveBeenCalledTimes(3);
    expect(logMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("Logged.op")
    );
  });

  it("other convenience decorators are callable", () => {
    class Logged2 extends LoggedClass {
      constructor() {
        super();
      }

      @log(
        LogLevel.info,
        0,
        (...args: any[]) => `called with ${args}`,
        (e?: Error, result?: any) => {
          return e ? e.message : result;
        }
      )
      a(err: boolean = false) {
        if (err) throw new Error("error");
        return 1;
      }
    }
    const s = new Logged2();
    expect(s.a(false)).toBe(1);
    expect(logMock).toBeCalledTimes(2);
    expect(logMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("called with false")
    );
    expect(logMock).toHaveBeenNthCalledWith(2, expect.stringContaining("1"));

    expect(() => s.a(true)).toThrow();
    expect(logMock).toBeCalledTimes(3);
    expect(logMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("called with true")
    );
    expect(errorMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("error")
    );
  });
});
