import { DefaultLoggingConfig, Logging } from "../../src";

describe("Logging.theme", () => {
  afterEach(() => {
    Logging.setConfig({ ...DefaultLoggingConfig });
    jest.restoreAllMocks();
  });

  it("applies the action theme's 256-colour foreground without logging an error", () => {
    Logging.setConfig({ ...DefaultLoggingConfig, style: true });
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation();

    const themed = Logging.theme("create", "action", undefined);

    expect(themed).toContain("\u001b[38;5;18m");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
