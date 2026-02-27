# Testing Methodology

This project employs a multi-layered testing strategy to ensure mathematical precision, physiological stability, and code robustness.

## 1. Unit & Integration Testing
Standard functional tests using the Node.js native test runner.
- **Location:** `*.test.js`
- **Goal:** Verify individual functions and the integration of the physiological model.
- **Run:** `npm test`

## 2. Code Coverage
Measured using Node.js's experimental coverage tracking.
- **Goal:** Ensure every line, branch, and function is exercised.
- **Current Status:** 100% Line/Branch/Function coverage.
- **Run:** `node --test --experimental-test-coverage`

## 3. Property-Based Testing (Fuzzing)
Utilizes `fast-check` to verify mathematical invariants across thousands of randomized inputs.
- **Location:** `properties.test.js`
- **Goal:** Find edge cases (e.g., negative RMR, numerical instability) that manual tests might miss.
- **Run:** `node --test properties.test.js`

## 4. Mutation Testing
Powered by **StrykerJS**, this systematically mutates source code (e.g., changing `+` to `-` or `>` to `>=`) to verify that the test suite actually catches logic errors.
- **Goal:** Measure the effectiveness of assertions (Mutation Score).
- **Run:** `npx stryker run`
- **Report:** Generated at `reports/mutation/mutation.html`

---

## Maintenance Commands

### Run Everything
```bash
npm test && node --test properties.test.js && node --test --experimental-test-coverage
```

### Check Assertions (Mutation)
```bash
npx stryker run
```
