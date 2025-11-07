import { Logging, LogLevel } from "../../src/index";

describe("silly log level", () => {
  it("Properly sets the level", () => {
    Logging.setConfig({ level: LogLevel.silly });
    expect(Logging.getConfig().level).toBe(LogLevel.silly);
  });

  it("logs in silly level", () => {
    const log = Logging.for("silly-test");
    log.silly("This is a silly log message");
    expect(true).toBe(true);
  });
});
