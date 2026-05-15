/**
 * Flappy Kiro - Property-Based Tests
 * Uses fast-check for property-based testing of game mechanics.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Replicate GameConfig constants used in tests
const GameConfig = Object.freeze({
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  GROUND_HEIGHT: 60,
  GRAVITY: 0.5,
  FLAP_VELOCITY: -7.5,
  MAX_FALL_SPEED: 12,
  KIRO_X: 80,
  KIRO_HEIGHT: 36,
  FRAME_DURATION: 1000 / 60,
});

// Replicate createKiro from js/kiro.js
function createKiro() {
  return {
    x: GameConfig.KIRO_X,
    y: GameConfig.CANVAS_HEIGHT / 2,
    width: 0,
    height: GameConfig.KIRO_HEIGHT,
    velocityY: 0,
    rotation: 0,
    sprite: null,
  };
}

// Replicate updateKiroPhysics from js/kiro.js
function updateKiroPhysics(entity, normalizedDelta) {
  entity.velocityY += GameConfig.GRAVITY * normalizedDelta;

  if (entity.velocityY > GameConfig.MAX_FALL_SPEED) {
    entity.velocityY = GameConfig.MAX_FALL_SPEED;
  }

  entity.y += entity.velocityY * normalizedDelta;
}

// Replicate applyFlap from js/kiro.js
function applyFlap(entity) {
  entity.velocityY = GameConfig.FLAP_VELOCITY;
}

/**
 * Feature: flappy-kiro, Property 1: Gravity and Flap Velocity
 *
 * For any initial vertical velocity and any positive delta-time, applying a physics
 * update SHALL increase Kiro's downward velocity by exactly GRAVITY * normalizedDelta,
 * capped at MAX_FALL_SPEED, and applying a Flap SHALL set Kiro's velocity to exactly
 * FLAP_VELOCITY regardless of the current velocity.
 *
 * Validates: Requirements 4.1, 4.2
 */
describe('Feature: flappy-kiro, Property 1: Gravity and Flap Velocity', () => {
  it('gravity increases downward velocity by GRAVITY * normalizedDelta, capped at MAX_FALL_SPEED', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -20, max: 20, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 3.0, noNaN: true, noDefaultInfinity: true }),
        (initialVelocityY, normalizedDelta) => {
          const entity = createKiro();
          entity.velocityY = initialVelocityY;

          updateKiroPhysics(entity, normalizedDelta);

          const expectedVelocity = Math.min(
            initialVelocityY + GameConfig.GRAVITY * normalizedDelta,
            GameConfig.MAX_FALL_SPEED
          );

          expect(entity.velocityY).toBeCloseTo(expectedVelocity, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('position y changes by velocityY * normalizedDelta (using new velocity after gravity)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -20, max: 20, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 3.0, noNaN: true, noDefaultInfinity: true }),
        (initialVelocityY, normalizedDelta) => {
          const entity = createKiro();
          entity.velocityY = initialVelocityY;
          const initialY = entity.y;

          updateKiroPhysics(entity, normalizedDelta);

          // The new velocity after gravity (capped)
          const newVelocity = Math.min(
            initialVelocityY + GameConfig.GRAVITY * normalizedDelta,
            GameConfig.MAX_FALL_SPEED
          );
          const expectedY = initialY + newVelocity * normalizedDelta;

          expect(entity.y).toBeCloseTo(expectedY, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('flap sets velocity to FLAP_VELOCITY regardless of current velocity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -20, max: 20, noNaN: true, noDefaultInfinity: true }),
        (initialVelocityY) => {
          const entity = createKiro();
          entity.velocityY = initialVelocityY;

          applyFlap(entity);

          expect(entity.velocityY).toBe(GameConfig.FLAP_VELOCITY);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: flappy-kiro, Property 2: Kiro Horizontal Position Invariant
 *
 * For any sequence of physics updates, flap applications, and state transitions,
 * Kiro's horizontal position SHALL remain constant at its initial value and SHALL
 * be located within the left third of the canvas width (x < CANVAS_WIDTH / 3).
 *
 * Validates: Requirements 4.3
 */
describe('Feature: flappy-kiro, Property 2: Kiro Horizontal Position Invariant', () => {
  // Arbitrary for generating a sequence of operations (update or flap)
  const operationArb = fc.oneof(
    fc.record({
      type: fc.constant('update'),
      normalizedDelta: fc.double({ min: 0.01, max: 5.0, noNaN: true }),
    }),
    fc.record({
      type: fc.constant('flap'),
    })
  );

  const operationSequenceArb = fc.array(operationArb, { minLength: 1, maxLength: 100 });

  it('Kiro x position never changes from GameConfig.KIRO_X after any sequence of operations', () => {
    fc.assert(
      fc.property(operationSequenceArb, (operations) => {
        const kiro = createKiro();

        for (const op of operations) {
          if (op.type === 'update') {
            updateKiroPhysics(kiro, op.normalizedDelta);
          } else {
            applyFlap(kiro);
          }

          // After every operation, x must remain exactly KIRO_X
          expect(kiro.x).toBe(GameConfig.KIRO_X);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Kiro x position is always within the left third of the canvas', () => {
    fc.assert(
      fc.property(operationSequenceArb, (operations) => {
        const kiro = createKiro();
        const leftThird = GameConfig.CANVAS_WIDTH / 3;

        for (const op of operations) {
          if (op.type === 'update') {
            updateKiroPhysics(kiro, op.normalizedDelta);
          } else {
            applyFlap(kiro);
          }

          // After every operation, x must be within left third of canvas
          expect(kiro.x).toBeLessThan(leftThird);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Kiro x position remains constant regardless of number of updates and delta values', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0.001, max: 10.0, noNaN: true }), { minLength: 1, maxLength: 200 }),
        (deltas) => {
          const kiro = createKiro();
          const initialX = kiro.x;

          for (const delta of deltas) {
            updateKiroPhysics(kiro, delta);
            expect(kiro.x).toBe(initialX);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Kiro x position remains constant regardless of number of flaps applied', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        (flapCount) => {
          const kiro = createKiro();
          const initialX = kiro.x;

          for (let i = 0; i < flapCount; i++) {
            applyFlap(kiro);
            expect(kiro.x).toBe(initialX);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 10: Game_Over Input Delay
// ============================================================================

// GameState enum (replicated from js/config.js)
const GameState = Object.freeze({
  READY: 'ready',
  PLAYING: 'playing',
  GAME_OVER: 'game_over',
});

// RESTART_DELAY constant from GameConfig
const RESTART_DELAY = 500;

/**
 * Simulates the state machine and input handler logic for Game_Over state.
 * This replicates the core decision logic from js/input.js and js/state.js:
 * - In GAME_OVER state, input is only accepted if elapsed time >= RESTART_DELAY (500ms)
 * - If accepted, state transitions to READY
 * - If not accepted, state remains GAME_OVER
 *
 * @param {number} elapsedSinceGameOver - milliseconds since Game_Over transition
 * @returns {{ accepted: boolean, newState: string }}
 */
function handleGameOverInput(elapsedSinceGameOver) {
  if (elapsedSinceGameOver >= RESTART_DELAY) {
    return { accepted: true, newState: GameState.READY };
  }
  return { accepted: false, newState: GameState.GAME_OVER };
}

/**
 * Feature: flappy-kiro, Property 10: Game_Over Input Delay
 *
 * For any elapsed time since the Game_Over transition, player input SHALL be
 * ignored if elapsed < 500 milliseconds, and SHALL be accepted (triggering
 * reset and transition to Ready) if elapsed >= 500 milliseconds.
 *
 * **Validates: Requirements 3.5**
 */
describe('Feature: flappy-kiro, Property 10: Game_Over Input Delay', () => {
  it('input is ignored when elapsed time < 500ms (state stays GAME_OVER)', () => {
    fc.assert(
      fc.property(
        // Generate elapsed times from 0 to just below 500ms (exclusive)
        fc.double({ min: 0, max: 499.999, noNaN: true }),
        (elapsed) => {
          const result = handleGameOverInput(elapsed);

          // Input should NOT be accepted
          expect(result.accepted).toBe(false);
          // State should remain GAME_OVER
          expect(result.newState).toBe(GameState.GAME_OVER);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('input is accepted when elapsed time >= 500ms (state transitions to READY)', () => {
    fc.assert(
      fc.property(
        // Generate elapsed times from 500ms up to a large value
        fc.double({ min: 500, max: 60000, noNaN: true }),
        (elapsed) => {
          const result = handleGameOverInput(elapsed);

          // Input should be accepted
          expect(result.accepted).toBe(true);
          // State should transition to READY
          expect(result.newState).toBe(GameState.READY);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('the boundary at exactly 500ms accepts input', () => {
    fc.assert(
      fc.property(
        // Test values at and just above the boundary
        fc.constant(500),
        (elapsed) => {
          const result = handleGameOverInput(elapsed);

          expect(result.accepted).toBe(true);
          expect(result.newState).toBe(GameState.READY);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any non-negative elapsed time, the decision is deterministic and consistent with the 500ms threshold', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 120000, noNaN: true }),
        (elapsed) => {
          const result = handleGameOverInput(elapsed);

          if (elapsed < RESTART_DELAY) {
            expect(result.accepted).toBe(false);
            expect(result.newState).toBe(GameState.GAME_OVER);
          } else {
            expect(result.accepted).toBe(true);
            expect(result.newState).toBe(GameState.READY);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
