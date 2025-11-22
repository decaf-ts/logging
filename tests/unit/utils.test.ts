import {
  getObjectName,
  isClass,
  isFunction,
  isInstance,
  isMethod,
} from "../../src/utils";

describe("utils:isClass", () => {
  it("detects native ES class declarations", () => {
    class NativeExample {
      method() {
        return 42;
      }
    }

    expect(isClass(NativeExample)).toBe(true);
  });

  it("detects classic constructor functions with prototype methods", () => {
    function LegacyCtor(this: any, value: number) {
      this.value = value;
    }
    LegacyCtor.prototype.getValue = function getValue() {
      return this.value;
    };

    expect(isClass(LegacyCtor)).toBe(true);
  });

  it("detects functions that emulate classes via non-writable prototype", () => {
    function FauxClass(this: any) {
      this.value = 7;
    }

    Object.defineProperty(FauxClass, "prototype", {
      value: {
        constructor: FauxClass,
        method() {
          return 1;
        },
      },
      writable: false,
    });

    expect(isClass(FauxClass)).toBe(true);
  });

  it("treats plain functions without prototype members as non-classes", () => {
    function PlainFn() {
      return 1;
    }
    PlainFn.prototype = Object.create(null);

    expect(isClass(PlainFn)).toBe(false);
  });

  it("rejects arrow functions that lack a prototype", () => {
    const arrow = () => 123;

    expect(isClass(arrow)).toBe(false);
  });

  it("rejects non-function values", () => {
    expect(isClass({} as any)).toBe(false);
    expect(isClass(undefined)).toBe(false);
  });

  it("rejects plain constructor functions without prototype members", () => {
    function BareCtor() {}

    expect(isClass(BareCtor)).toBe(false);
  });

  it("falls back gracefully when Function.prototype.toString throws", () => {
    const original = Function.prototype.toString;
    function Weird() {}
    Object.defineProperty(Weird, "prototype", {
      value: { constructor: Weird },
      writable: true,
    });

    Function.prototype.toString = function toString() {
      throw new Error("blocked");
    } as typeof original;

    try {
      expect(isClass(Weird)).toBe(false);
    } finally {
      Function.prototype.toString = original;
    }
  });
});

describe("utils:isFunction", () => {
  it("detects plain functions", () => {
    function testFn() {
      return true;
    }
    expect(isFunction(testFn)).toBe(true);
  });

  it("rejects classes", () => {
    class Sample {}
    expect(isFunction(Sample)).toBe(false);
  });

  it("rejects non-functions", () => {
    expect(isFunction({})).toBe(false);
  });
});

describe("utils:isMethod", () => {
  it("detects prototype methods", () => {
    class Example {
      method() {}
    }
    expect(isMethod(Example.prototype.method)).toBe(true);
  });

  it("rejects constructors", () => {
    class Example {}
    expect(isMethod(Example)).toBe(false);
  });

  it("rejects non-functions", () => {
    expect(isMethod(undefined)).toBe(false);
  });
});

describe("utils:isInstance", () => {
  it("detects class instances", () => {
    class Example {}
    const instance = new Example();
    expect(isInstance(instance)).toBe(true);
  });

  it("rejects plain functions", () => {
    function Example() {
      return null;
    }
    expect(isInstance(Example)).toBe(false);
  });

  it("rejects primitives and null", () => {
    expect(isInstance(null)).toBe(false);
    expect(isInstance(42)).toBe(false);
    expect(isInstance({})).toBe(false);
  });
});

describe("utils:getObjectName", () => {
  it("returns class names", () => {
    class Example {}
    expect(getObjectName(Example)).toBe("Example");
  });

  it("returns method names", () => {
    class Example {
      method() {}
    }
    expect(getObjectName(Example.prototype.method)).toBe("method");
  });

  it("returns function names", () => {
    const anon = () => true;
    expect(getObjectName(anon)).toBe("anon");
  });

  it("returns instance constructor names", () => {
    class Example {}
    expect(getObjectName(new Example())).toBe("Example");
  });

  it("returns 'anonymous' for unnamed functions", () => {
    const fn = new Function("return true;");
    expect(getObjectName(fn)).toBe("anonymous");
  });

  it("prefers custom toString() on instances", () => {
    class Fancy {
      toString() {
        return "CustomFancy#1";
      }
    }
    expect(getObjectName(new Fancy())).toBe("CustomFancy#1");
  });

  it("falls back to class name when toString is default", () => {
    class Plain {}
    expect(getObjectName(new Plain())).toBe("Plain");
  });

  it("returns string representations for primitives and objects", () => {
    expect(getObjectName("context")).toBe("context");
    expect(getObjectName(Symbol.for("test"))).toBe("symbol");
    expect(getObjectName({})).toBe("Object");
    expect(getObjectName(undefined)).toBe("undefined");
    expect(getObjectName(null)).toBe("null");
  });
});
