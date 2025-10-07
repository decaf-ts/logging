import { sf } from "../../src";

describe("utils.sf (integration)", () => {
  it("replaces ordered placeholders with multiple string/number args", () => {
    const res = sf("Hello {0}, you have {1} new messages", "Alice", 3);
    expect(res).toBe("Hello Alice, you have 3 new messages");
  });

  it("returns 'undefined' when an ordered placeholder has no arg", () => {
    const res = sf("{0}-{1}-{2}", "A", "B");
    expect(res).toBe("A-B-undefined");
  });

  it("supports object-based replacement for named placeholders", () => {
    const res = sf("{name} has {count} items", {
      name: "Bob",
      count: 7,
    });
    expect(res).toBe("Bob has 7 items");
  });

  it("throws when multiple replacements include a non-string/number", () => {
    expect(() => sf("{0} {1}", "ok", { bad: true } as any)).toThrow(
      /Only string and number arguments are supported/
    );
  });
});
