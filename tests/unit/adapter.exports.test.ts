import * as PinoExports from "../../src/pino";
import * as WinstonExports from "../../src/winston";

describe("adapter entrypoints", () => {
  it("re-export logger classes for consumers", () => {
    expect(typeof PinoExports.PinoLogger).toBe("function");
    expect(typeof WinstonExports.WinstonLogger).toBe("function");
  });
});
