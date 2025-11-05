/* eslint-disable @typescript-eslint/no-unused-vars */
// Type-level checks ensuring chained accumulate calls preserve types and `orThrow()`.
// This file is intended to be type-checked during the package build (no runtime use).
import { Environment } from "./environment";

// Chained accumulate pattern (recommended) — type should preserve across calls
const env1 = Environment.accumulate({ alpha: "one" })
  .accumulate({ beta: "two" })
  .accumulate({ gamma: "three" });

// TypeScript should know these properties exist and have the correct types
const tAlpha: string = env1.alpha;
const tBeta: string = env1.beta;
const tGamma: string = env1.gamma;

// `orThrow` should remain available on the result and type to the same interface
const orThrowAlpha: string = env1.orThrow().alpha;

// Verify that further chained accumulate continues to preserve types
const env2 = env1.accumulate({ delta: 4 });
const tDelta: number = env2.delta;
// older props still present
const stillAlpha: string = env2.alpha;

// Also ensure `Environment.accumulate` return can be used directly in chained style
const env3 = Environment.accumulate({ one: 1 }).accumulate({ two: 2 });
const checkOne: number = env3.one;
const checkTwo: number = env3.two;

// If any of these lines fail to type-check, the package build (tsc) will error.
