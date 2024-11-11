import { Logging } from "../../src/logging";

describe("Logging", function () {
  it("Generates a default logger", () => {
    const logger = Logging.get();
    expect(logger).toBeDefined();
  });

  class TestClass {
    logger = Logging.forClass(TestClass);

    doSomething() {
      return Logging.forMethod(TestClass, this.doSomething);
    }
  }

  it("Adds class and method metadata", () => {
    const clazz = new TestClass();

    expect(clazz.logger).toBeDefined();
    clazz.logger.info("test");
    const logger = clazz.doSomething();
    expect(logger).toBeDefined();
    logger.info("test");
  });
});
