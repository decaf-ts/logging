export function isClass(
  value: unknown
): value is abstract new (...args: any[]) => any {
  if (typeof value !== "function") return false;

  // 1) Native ES class? (fast path)
  // e.g., "class Foo { ... }" → source starts with "class"
  try {
    const src = Function.prototype.toString.call(value);
    if (/^\s*class[\s{]/.test(src)) return true;
  } catch {
    // Some environments may block .toString; ignore and continue.
  }

  // 2) Has a prototype at all? (filters out arrow funcs, bound funcs)
  const protoDesc = Object.getOwnPropertyDescriptor(value, "prototype");
  if (!protoDesc || !protoDesc.value) return false;

  // 3) In native classes, the "prototype" property is non-writable.
  // (In plain functions, it's writable.) This is a strong signal.
  if (protoDesc.writable === false) return true;

  // 4) Classic constructor or transpiled class:
  // Must have its own "constructor" and at least one prototype method.
  const proto = (value as any).prototype;
  if (!Object.prototype.hasOwnProperty.call(proto, "constructor")) return false;

  const names = Object.getOwnPropertyNames(proto).filter(
    (n) => n !== "constructor"
  );
  return names.length > 0;
}
