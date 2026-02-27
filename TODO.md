# Engineering TODO: Robust Property-Based Testing Refactor

This document tracks the architectural transition from object-oriented state management to a pure functional data flow to enable high-confidence Property-Based Testing (PBT).

## Phase 1: Mathematical Decoupling
- [x] **Extract Pure Physiology Module**
  - Move all formulaic calculations (Mifflin-St Jeor, BFP, ECW, K-factor) from `Baseline` class methods into a standalone `physiology.js` module.
  - Ensure functions are pure: `(weight, height, age, isMale) => rmr`.
  - **PBT Goal:** Test formula stability and monotonicity (e.g., "Increasing weight never decreases RMR") without object instantiation.
  - **Status:** Completed with 100% line coverage and magic constants extracted to `constants.js`.

- [ ] **Define PhysiologicalState POJO**
  - Create a structured data definition for the constants derived from a baseline.
  - Refactor `Baseline` to act as a "Factory" or "Parser" that returns this state object.
  - **PBT Goal:** Enable the generation of "Arbitrary Humans" by injecting random but mathematically valid state objects into the `BodyModel`.

## Phase 2: Algorithm Abstraction
- [ ] **Extract Generic Solver Utility**
  - Remove the binary search logic from `Intervention.forgoal`.
  - Create a reusable `Solver.binarySearch(fn, target, range, epsilon)` utility.
  - **PBT Goal:** Verify the solver's correctness using simple monotonic functions before applying it to the body weight model.

- [ ] **Implement Parameter Interpolators**
  - Refactor `DailyParams.makeparamtrajectory` to use interpolator functions instead of imperative loops.
  - Represent a trajectory as a collection of `(time) => Params` functions.
  - **PBT Goal:** Verify the "Linearity Property" (e.g., "Day 5 must be exactly the midpoint of a Day 0 to Day 10 ramp").

## Phase 3: Domain & Robustness
- [ ] **Define Explicit Data Domains**
  - Create a centralized configuration for input ranges (e.g., `HUMAN_AGE_RANGE`, `PHYSICAL_MAX_WEIGHT`).
  - Update `fast-check` properties to use these standard generators.
  - **PBT Goal:** Systematically verify both "Physiological Validity" (Real humans) and "Numerical Robustness" (Garbage data/Extreme values).

- [ ] **Standardize Clamping and Safety**
  - Audit all `Math.max(0, ...)` and `safeNum` calls.
  - Move safety logic into the functional layer.
  - **PBT Goal:** Prove that the simulation can never produce `NaN` or `Infinity` regardless of input severity.
