import { isClass } from "../../src/utils";

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
