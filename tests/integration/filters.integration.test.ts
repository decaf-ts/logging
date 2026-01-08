import { PatternFilter } from "../../src/filters/PatternFilter";
import { Logging, LogLevel } from "../../src";

describe("filters (integration)", () => {
  beforeEach(() => {
    Logging.setConfig({ level: LogLevel.info, style: false });
  });

  it("returns original when no match", () => {
    const f = new PatternFilter(/secret:(\w+)/, "***");
    expect(f.filter(Logging.getConfig() as any, "plain text", ["Ctx"])).toBe(
      "plain text"
    );
  });

  it("replaces with string", () => {
    const f = new PatternFilter(/secret:(\w+)/, "secret:***");
    const msg = "hello secret:token world";
    expect(f.filter(Logging.getConfig() as any, msg, ["Ctx"])).toBe(
      "hello secret:*** world"
    );
  });

  it("replaces with function", () => {
    const f = new PatternFilter(/id:(\d+)/, (_s, id) => `id:${Number(id) + 1}`);
    const msg = "id:41";
    expect(f.filter(Logging.getConfig() as any, msg, ["Ctx"])).toBe("id:42");
  });

  it("logs error and returns empty string when replacement throws", () => {
    const f = new PatternFilter(/x/, () => {
      throw new Error("boom");
    });
    const out = f.filter(Logging.getConfig() as any, "x", ["Ctx"]);
    expect(out).toBe("");
  });

  class FileContentFilter extends PatternFilter {
    constructor() {
      super(
        /(["'])(xmlContent|fileContent|content)\1(\s?[:=]\s?)(["'])(.+?)\4/gm,
        (match: string, ...groups: string[]) => {
          const [quote, key, equality, otherQuote, content] = groups;
          return `${quote}${key}${quote}${equality}${otherQuote}${content.substring(0, 5)}...${content.substring(content.length - 6)}${otherQuote}`;
        }
      );
    }
  }

  it("filters out via groups", () => {
    const f = new FileContentFilter();
    const payload = JSON.stringify({
      fileContent: "sdfgasghjsfdbhhsdbjfhbasdfhjsbadhjgasdg",
      xmlContent: "sdfgasghjsfdbhhsdbjfhbasdfhjsbadhjgasdg",
      content: "sdfgasghjsfdbhhsdbjfhbasdfhjsbadhjgasdg",
    });

    expect(f.filter(Logging.getConfig() as any, payload, ["Ctx"])).toBe(
      '{"fileContent":"sdfga...jgasdg","xmlContent":"sdfga...jgasdg","content":"sdfga...jgasdg"}'
    );
  });
});
