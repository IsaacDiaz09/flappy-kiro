---
inclusion: fileMatch
fileMatchPattern: "tests/**"
---

# Flappy Kiro — Testing Standards

## Test Infrastructure

- **Framework**: Vitest (v2.1.8) with fast-check (v3.22.0) for property-based testing.
- **Location**: All tests live in the `tests/` directory with their own `package.json`.
- **Run command**: `cd tests && npx vitest run`
- **File naming**: `*.test.js` (vitest auto-discovers these).

## Test File Organization

| File | Purpose |
|------|---------|
| `property-tests.test.js` | All 10 property-based tests (Properties 1–10) |
| `pipes.test.js` | Unit tests for pipe generation, scrolling, removal |
| `collision.test.js` | Unit tests for AABB and boundary collision |
| `score.test.js` | Unit tests for score increment and high score |
| `background.test.js` | Unit tests for parallax layers and ground |

## Property-Based Testing Conventions

- Use `fast-check` (`import * as fc from 'fast-check'`).
- Minimum **100 iterations** per property (`{ numRuns: 100 }`).
- Tag each describe block: `"Feature: flappy-kiro, Property N: Title"`.
- Replicate game logic in the test file (pure functions) rather than importing from game source (since game code uses IIFEs and globals, not modules).
- When testing randomized logic (e.g., pipe generation), accept a `randomValue` parameter instead of mocking `Math.random()`.

## Writing New Property Tests

1. Identify the correctness property from `design.md` (Properties 1–10).
2. Create a pure function replicating the logic under test.
3. Use `fc.assert(fc.property(...), { numRuns: 100 })` with appropriate arbitraries.
4. Use `fc.double({ noNaN: true, noDefaultInfinity: true })` for numeric inputs.
5. Use `expect(...).toBeCloseTo(expected, 10)` for floating-point comparisons.
6. Use `fc.pre(condition)` to filter invalid inputs rather than conditional assertions.

## Writing New Unit Tests

1. Replicate the relevant game logic as a pure function in the test file.
2. Use `describe` / `it` blocks with clear descriptions.
3. Test edge cases: zero values, boundary conditions, empty arrays.
4. For functions with side effects (e.g., scoring), test the state before and after.

## Adding New Test Files

- Create `tests/new-feature.test.js`.
- Import vitest (`import { describe, it, expect } from 'vitest'`).
- Replicate only the constants and logic needed (don't import the full GameConfig).
- Run `npx vitest run` from `tests/` to verify.

## Constants Replication

Since game code uses globals (not modules), tests replicate constants locally:

```javascript
const GameConfig = Object.freeze({
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  // ... only what's needed for this test file
});
```

Keep these in sync with `js/config.js` when constants change.
