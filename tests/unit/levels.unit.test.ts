// import { Logging, DefaultLoggingConfig, DefaultLevels } from "../../src";

describe.skip("Dynamic logging levels (unit)", () => {
  // beforeEach(() => {
  //   // reset to defaults before each test
  //   Logging.setConfig({
  //     ...DefaultLoggingConfig,
  //     levels: DefaultLevels,
  //     level: "silly",
  //   });
  // });

  it("exposes default level methods on instance", () => {
    // const logger = Logging.for("Unit");
    // for (const lvl of DefaultLevels) {
    //   expect(typeof (logger as any)[lvl]).toBe("function");
    // }
  });
  //
  // it("adds custom runtime levels and methods are callable", () => {
  //   const custom = ["notice", "critical", "error"] as const;
  //   Logging.setConfig({
  //     ...DefaultLoggingConfig,
  //     levels: custom,
  //     level: custom[custom.length - 1],
  //   });
  //   const logger = Logging.for("Custom");
  //
  //   // Ensure methods exist
  //   for (const lvl of custom) {
  //     expect(typeof (logger as any)[lvl]).toBe("function");
  //   }
  //
  //   // Spy on console to avoid noisy output and assert calls don't throw
  //   const spy = jest
  //     .spyOn(console, "debug")
  //     .mockImplementation(() => undefined as any);
  //   const eSpy = jest
  //     .spyOn(console, "error")
  //     .mockImplementation(() => undefined as any);
  //
  //   expect(() => (logger as any).notice("hello")).not.toThrow();
  //   expect(() => (logger as any).critical("boom")).not.toThrow();
  //   expect(() => (logger as any).error("bad")).not.toThrow();
  //
  //   spy.mockRestore();
  //   eSpy.mockRestore();
  // });
  //
  // it("respects configured threshold order for custom levels", () => {
  //   const custom = ["a", "b", "c"] as const;
  //   // Highest threshold is the last one in the list
  //   Logging.setConfig({ ...DefaultLoggingConfig, levels: custom, level: "b" });
  //   const logger = Logging.for("Thresh");
  //
  //   const debugSpy = jest
  //     .spyOn(console, "debug")
  //     .mockImplementation(() => undefined as any);
  //
  //   // below or equal -> should print
  //   expect(() => (logger as any).a("low")).not.toThrow();
  //   expect(() => (logger as any).b("mid")).not.toThrow();
  //
  //   // above -> should be filtered out (no console call)
  //   (logger as any).c("high");
  //   expect(debugSpy).toHaveBeenCalledTimes(2);
  //
  //   debugSpy.mockRestore();
  // });
});
