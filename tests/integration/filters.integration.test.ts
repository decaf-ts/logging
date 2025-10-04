import { PatternFilter } from "../../src/filters/PatternFilter";
import { Logging, LogLevel } from "../../src";

describe("filters (integration)", () => {
  beforeEach(() => {
    Logging.setConfig({ level: LogLevel.info, style: false });
  });

  it("returns original when no match", () => {
    const f = new PatternFilter(/secret:(\w+)/, "***");
    expect(f.filter(Logging.getConfig() as any, "plain text", ["Ctx"]))
      .toBe("plain text");
  });

  it("replaces with string", () => {
    const f = new PatternFilter(/secret:(\w+)/, "secret:***");
    const msg = "hello secret:token world";
    expect(f.filter(Logging.getConfig() as any, msg, ["Ctx"]))
      .toBe("hello secret:*** world");
  });

  it("replaces with function", () => {
    const f = new PatternFilter(/id:(\d+)/, (_s, id) => `id:${Number(id) + 1}`);
    const msg = "id:41";
    expect(f.filter(Logging.getConfig() as any, msg, ["Ctx"]))
      .toBe("id:42");
  });

  it("logs error and returns empty string when replacement throws", () => {
    const f = new PatternFilter(/x/, () => {
      throw new Error("boom");
    });
    const out = f.filter(Logging.getConfig() as any, "x", ["Ctx"]);
    expect(out).toBe("");
  });
});

