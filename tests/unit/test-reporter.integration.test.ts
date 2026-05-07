import { TestReporter } from "@decaf-ts/utils/tests";
import { Logging, LogLevel, MiniLogger } from "../../src";

describe("TestReporter integration via @decaf-ts/utils/tests export", () => {
  it("reports logging payloads without tsconfig path aliases", async () => {
    const reporter = new TestReporter("logging-test-reporter");

    Logging.setFactory((context, conf) => new MiniLogger(context, conf, []));
    Logging.setConfig({ level: LogLevel.info, style: false, format: "raw" });

    const logger = Logging.for("TestReporterSpec");
    logger.info("log through reporter integration test");

    await reporter.reportData(
      "logger-config",
      {
        level: Logging.getConfig().level,
        format: Logging.getConfig().format,
      },
      "json",
      true
    );
  });
});
