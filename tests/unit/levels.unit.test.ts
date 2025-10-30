import { Logging, LogLevel } from "../../src";

describe("Dynamic logging levels (unit)", () => {
  it("exposes default level methods on instance", () => {
    const logger = Logging.for("Unit");
    for (const lvl of Object.values(LogLevel)) {
      expect(typeof (logger as any)[lvl]).toBe("function");
    }
  });
});
