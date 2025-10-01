import { LoggedClass, DefaultLoggingConfig, Logging } from "../../src";

describe("LoggedClass (integration)", () => {
  beforeEach(() => {
    Logging.setConfig({ ...DefaultLoggingConfig, style: false });
  });

  class UserService extends LoggedClass {
    constructor() {
      super();
    }
    create(id: string) {
      this.log.info(`Creating ${id}`);
      return `ok:${id}`;
    }
  }

  it("provides a working logger via protected getter", () => {
    const svc = new UserService();
    const result = svc.create("42");
    expect(result).toBe("ok:42");
  });
});
