import {
  padEnd,
  patchPlaceholders,
  patchString,
  toCamelCase,
  toENVFormat,
  toSnakeCase,
  toKebabCase,
  toPascalCase,
  escapeRegExp,
  sf,
} from "../../src/text";

describe("text utils", () => {
  it("padEnd pads and respects char length", () => {
    expect(padEnd("hi", 4, ".")).toBe("hi..");
  });

  it("padEnd uses the default space padding when char omitted", () => {
    expect(padEnd("xy", 4)).toBe("xy  ");
  });

  it("padEnd throws on invalid pad char length", () => {
    expect(() => padEnd("x", 3, "--")).toThrow(
      "Invalid character length for padding. must be one!"
    );
  });

  it("patchPlaceholders default prefix/suffix", () => {
    const s = "Hello {name}, id={id}";
    expect(patchPlaceholders(s, { name: "Bob", id: 7 }, "{", "}")).toBe(
      "Hello Bob, id=7"
    );
  });

  it("patchPlaceholders custom prefix/suffix", () => {
    const s = "Hello $<name>, id=$<id>!";
    expect(patchPlaceholders(s, { name: "Ana", id: 1 }, "$<", ">")).toBe(
      "Hello Ana, id=1!"
    );
  });

  it("patchString with flags and multiple keys", () => {
    const out = patchString("abc ABC abc", { abc: "x" }, "gi");
    expect(out).toBe("x x x");
  });

  it("case conversions", () => {
    expect(toCamelCase("Hello world"))
      .toBe("helloWorld");
    expect(toSnakeCase("HelloWorld Test"))
      .toBe("hello_world_test");
    expect(toKebabCase("HelloWorld Test"))
      .toBe("hello-world-test");
    expect(toPascalCase("hello world")).toBe("HelloWorld");
    expect(toENVFormat("helloWorld test"))
      .toBe("HELLO_WORLD_TEST");
  });

  it("escapeRegExp escapes characters", () => {
    const escaped = escapeRegExp("a+b*c?^$");
    expect(new RegExp(escaped).test("a+b*c?^$"))
      .toBe(true);
  });

  it("sf ordered and named replacements and missing index", () => {
    expect(sf("{0}-{1}", "a", 2)).toBe("a-2");
    expect(sf("{name}-{n}", { name: "x", n: 3 })).toBe("x-3");
    expect(sf("{0}-{2}", "a")).toBe("a-undefined");
  });

  it("patchPlaceholders uses default ${} when not provided", () => {
    const s = "Hello ${name}!";
    expect(patchPlaceholders(s, { name: "Eve" })).toBe("Hello Eve!");
  });

  it("patchString uses default flags (global)", () => {
    const out = patchString("foo foo", { foo: "bar" });
    expect(out).toBe("bar bar");
  });

  it("sf throws when multiple args include a non-string/number", () => {
    expect(() => sf("{0}", "a", { bad: true } as any)).toThrow(
      "Only string and number arguments are supported for multiple replacements."
    );
  });
});
