import { compileLogPattern, renderPattern } from "../../src/logParameters";

describe("logParameters pattern rendering", () => {
  it("renders optional segments when values exist", () => {
    const definition = compileLogPattern("[{timestamp}] {message}");
    const generated = renderPattern(definition, {
      timestamp: "2026-01-01T00:00:00.000Z",
      message: "hello",
    });

    expect(generated).toContain("hello");
    expect(generated).toMatch(/\[2026-01-01T00:00:00\.000Z\]/);
  });

  it("skips optional segments when parameters are missing", () => {
    const definition = compileLogPattern("[{timestamp}] {message}");
    const generated = renderPattern(definition, { message: "hello" });

    expect(generated).not.toContain("[");
    expect(generated).not.toContain("]");
    expect(generated.trim()).toBe("hello");
  });

  it("keeps literal text next to values only when the optional block fires", () => {
    const definition = compileLogPattern("[ctx={context}] {message}");
    const withContext = renderPattern(definition, {
      context: "UserService",
      message: "ok",
    });
    expect(withContext).toContain("[ctx=UserService]");

    const withoutContext = renderPattern(definition, { message: "ok" });
    expect(withoutContext).not.toContain("ctx=");
    expect(withoutContext.trim()).toBe("ok");
  });
});
