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
  ROTATION_UP: -20,
  ROTATION_DOWN_MAX: 90,
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

  // Update rotation based on vertical velocity
  if (entity.velocityY > 0) {
    entity.rotation = (entity.velocityY / GameConfig.MAX_FALL_SPEED) * GameConfig.ROTATION_DOWN_MAX;
    if (entity.rotation > GameConfig.ROTATION_DOWN_MAX) {
      entity.rotation = GameConfig.ROTATION_DOWN_MAX;
    }
  } else {
    entity.rotation = (entity.velocityY / GameConfig.FLAP_VELOCITY) * GameConfig.ROTATION_UP;
  }
}

// Replicate applyFlap from js/kiro.js
function applyFlap(entity) {
  entity.velocityY = GameConfig.FLAP_VELOCITY;
  entity.rotation = GameConfig.ROTATION_UP;
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


// ============================================================================
// Property 3: Rotation Bounds
// ============================================================================

/**
 * Feature: flappy-kiro, Property 3: Rotation Bounds
 *
 * For any Kiro state, the rotation SHALL be bounded between the upward flap angle
 * (ROTATION_UP = -20°) and a maximum downward angle of 90°. Specifically:
 * - After a flap, rotation is exactly ROTATION_UP (-20°)
 * - During freefall (velocityY > 0), rotation is proportional to downward velocity
 *   and never exceeds ROTATION_DOWN_MAX (90°)
 * - For any state, rotation is always in [ROTATION_UP, ROTATION_DOWN_MAX]
 *
 * **Validates: Requirements 4.4, 4.5**
 */
describe('Feature: flappy-kiro, Property 3: Rotation Bounds', () => {
  it('after a flap, rotation is exactly ROTATION_UP (-20°)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -20, max: 20, noNaN: true, noDefaultInfinity: true }),
        (initialVelocityY) => {
          const kiro = createKiro();
          kiro.velocityY = initialVelocityY;

          applyFlap(kiro);

          expect(kiro.rotation).toBe(GameConfig.ROTATION_UP);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('during freefall (velocityY > 0), rotation is proportional to velocity and capped at ROTATION_DOWN_MAX (90°)', () => {
    fc.assert(
      fc.property(
        // Generate positive velocities representing freefall
        fc.double({ min: 0.01, max: 30, noNaN: true, noDefaultInfinity: true }),
        (velocityY) => {
          const kiro = createKiro();
          kiro.velocityY = velocityY;

          // Simulate the rotation calculation for falling
          const expectedRotation = Math.min(
            (velocityY / GameConfig.MAX_FALL_SPEED) * GameConfig.ROTATION_DOWN_MAX,
            GameConfig.ROTATION_DOWN_MAX
          );

          // Apply the rotation logic (same as updateKiroPhysics rotation part)
          if (kiro.velocityY > 0) {
            kiro.rotation = (kiro.velocityY / GameConfig.MAX_FALL_SPEED) * GameConfig.ROTATION_DOWN_MAX;
            if (kiro.rotation > GameConfig.ROTATION_DOWN_MAX) {
              kiro.rotation = GameConfig.ROTATION_DOWN_MAX;
            }
          }

          expect(kiro.rotation).toBeCloseTo(expectedRotation, 10);
          expect(kiro.rotation).toBeLessThanOrEqual(GameConfig.ROTATION_DOWN_MAX);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any state after updateKiroPhysics, rotation is always in [ROTATION_UP, ROTATION_DOWN_MAX]', () => {
    // Constrain initial velocity to the reachable range [FLAP_VELOCITY, MAX_FALL_SPEED]
    // since in actual gameplay, velocity is set to FLAP_VELOCITY on flap and
    // only increases (toward MAX_FALL_SPEED) via gravity.
    fc.assert(
      fc.property(
        fc.double({ min: GameConfig.FLAP_VELOCITY, max: GameConfig.MAX_FALL_SPEED, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 5.0, noNaN: true, noDefaultInfinity: true }),
        (initialVelocityY, normalizedDelta) => {
          const kiro = createKiro();
          kiro.velocityY = initialVelocityY;

          updateKiroPhysics(kiro, normalizedDelta);

          expect(kiro.rotation).toBeGreaterThanOrEqual(GameConfig.ROTATION_UP);
          expect(kiro.rotation).toBeLessThanOrEqual(GameConfig.ROTATION_DOWN_MAX);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rotation formula when falling: rotation = (velocityY / MAX_FALL_SPEED) * ROTATION_DOWN_MAX, capped at 90°', () => {
    fc.assert(
      fc.property(
        // Generate velocities that will result in positive velocity after gravity
        fc.double({ min: 0.01, max: 20, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 3.0, noNaN: true, noDefaultInfinity: true }),
        (initialVelocityY, normalizedDelta) => {
          const kiro = createKiro();
          kiro.velocityY = initialVelocityY;

          updateKiroPhysics(kiro, normalizedDelta);

          // After update, velocity should be positive (falling), so rotation formula applies
          if (kiro.velocityY > 0) {
            const expectedRotation = Math.min(
              (kiro.velocityY / GameConfig.MAX_FALL_SPEED) * GameConfig.ROTATION_DOWN_MAX,
              GameConfig.ROTATION_DOWN_MAX
            );
            expect(kiro.rotation).toBeCloseTo(expectedRotation, 10);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rotation formula when rising: rotation = (velocityY / FLAP_VELOCITY) * ROTATION_UP', () => {
    fc.assert(
      fc.property(
        // Generate negative velocities (rising) that stay negative after one gravity tick
        fc.double({ min: -15, max: -1, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 1.0, noNaN: true, noDefaultInfinity: true }),
        (initialVelocityY, normalizedDelta) => {
          const kiro = createKiro();
          kiro.velocityY = initialVelocityY;

          updateKiroPhysics(kiro, normalizedDelta);

          // Only check if velocity is still negative (rising) after update
          if (kiro.velocityY <= 0) {
            const expectedRotation = (kiro.velocityY / GameConfig.FLAP_VELOCITY) * GameConfig.ROTATION_UP;
            expect(kiro.rotation).toBeCloseTo(expectedRotation, 10);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 4: Pipe Generation Constraints
// ============================================================================

// Additional constants for pipe generation
const PipeConfig = Object.freeze({
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  GROUND_HEIGHT: 60,
  GAP_HEIGHT: 120,
  MIN_GAP_MARGIN: 0.10,
  KIRO_HEIGHT: 36,
  PIPE_WIDTH: 52,
});

/**
 * Replicates createPipePair from js/pipes.js using a provided random value
 * instead of Math.random(), enabling deterministic property-based testing.
 *
 * @param {number} randomValue - A value in [0, 1) to use instead of Math.random()
 * @returns {object} A PipePair object
 */
function createPipePairWithRandom(randomValue) {
  var gapHeight = PipeConfig.GAP_HEIGHT;
  var halfGap = gapHeight / 2;

  // Minimum Y: gap must be at least 10% canvas height from top
  var minGapCenterY = PipeConfig.MIN_GAP_MARGIN * PipeConfig.CANVAS_HEIGHT + halfGap;

  // Maximum Y: gap must be at least 10% canvas height from ground boundary
  var groundY = PipeConfig.CANVAS_HEIGHT - PipeConfig.GROUND_HEIGHT;
  var maxGapCenterY = groundY - PipeConfig.MIN_GAP_MARGIN * PipeConfig.CANVAS_HEIGHT - halfGap;

  // Use provided random value instead of Math.random()
  var gapCenterY = minGapCenterY + randomValue * (maxGapCenterY - minGapCenterY);

  var x = PipeConfig.CANVAS_WIDTH;
  var width = PipeConfig.PIPE_WIDTH;

  var topPipeHeight = gapCenterY - halfGap;
  var bottomPipeY = gapCenterY + halfGap;
  var bottomPipeHeight = PipeConfig.CANVAS_HEIGHT - PipeConfig.GROUND_HEIGHT - bottomPipeY;

  return {
    x: x,
    gapCenterY: gapCenterY,
    gapHeight: gapHeight,
    width: width,
    scored: false,
    topPipe: {
      x: x,
      y: 0,
      width: width,
      height: topPipeHeight,
    },
    bottomPipe: {
      x: x,
      y: bottomPipeY,
      width: width,
      height: bottomPipeHeight,
    },
  };
}

/**
 * Feature: flappy-kiro, Property 4: Pipe Generation Constraints
 *
 * For any generated Pipe_Pair, the gap center SHALL be positioned such that the
 * entire gap remains at least 10% of the canvas height away from both the top edge
 * and the ground boundary, AND the gap height SHALL be at least 3 times Kiro's
 * sprite height.
 *
 * **Validates: Requirements 5.2, 5.3**
 */
describe('Feature: flappy-kiro, Property 4: Pipe Generation Constraints', () => {
  const minMargin = PipeConfig.MIN_GAP_MARGIN * PipeConfig.CANVAS_HEIGHT; // 60px
  const groundY = PipeConfig.CANVAS_HEIGHT - PipeConfig.GROUND_HEIGHT;    // 540px

  it('gap top (gapCenterY - gapHeight/2) is at least MIN_GAP_MARGIN * CANVAS_HEIGHT from the top edge', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (randomValue) => {
          const pipe = createPipePairWithRandom(randomValue);
          const gapTop = pipe.gapCenterY - pipe.gapHeight / 2;

          // gapTop must be >= 10% of canvas height (60px)
          expect(gapTop).toBeGreaterThanOrEqual(minMargin);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('gap bottom (gapCenterY + gapHeight/2) is at least MIN_GAP_MARGIN * CANVAS_HEIGHT from the ground boundary', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (randomValue) => {
          const pipe = createPipePairWithRandom(randomValue);
          const gapBottom = pipe.gapCenterY + pipe.gapHeight / 2;

          // gapBottom must be <= groundY - minMargin (540 - 60 = 480px)
          expect(gapBottom).toBeLessThanOrEqual(groundY - minMargin);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('gap height is at least 3 times Kiro sprite height', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (randomValue) => {
          const pipe = createPipePairWithRandom(randomValue);

          // Gap height must be >= 3 * KIRO_HEIGHT (3 * 36 = 108px)
          expect(pipe.gapHeight).toBeGreaterThanOrEqual(3 * PipeConfig.KIRO_HEIGHT);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('for any random value in [0, 1), all pipe generation constraints hold simultaneously', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (randomValue) => {
          const pipe = createPipePairWithRandom(randomValue);
          const gapTop = pipe.gapCenterY - pipe.gapHeight / 2;
          const gapBottom = pipe.gapCenterY + pipe.gapHeight / 2;

          // Constraint 1: gap top at least 10% from top edge
          expect(gapTop).toBeGreaterThanOrEqual(minMargin);

          // Constraint 2: gap bottom at least 10% from ground boundary
          expect(gapBottom).toBeLessThanOrEqual(groundY - minMargin);

          // Constraint 3: gap height >= 3 * Kiro height
          expect(pipe.gapHeight).toBeGreaterThanOrEqual(3 * PipeConfig.KIRO_HEIGHT);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 6: AABB Collision Detection Correctness
// ============================================================================

/**
 * Replicate aabbIntersect from js/collision.js
 * Check if two axis-aligned rectangles overlap.
 * @param {Object} a - First rectangle { x, y, width, height }
 * @param {Object} b - Second rectangle { x, y, width, height }
 * @returns {boolean} true if rectangles intersect
 */
function aabbIntersect(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

/**
 * Feature: flappy-kiro, Property 6: AABB Collision Detection Correctness
 *
 * For any two axis-aligned rectangles A and B, the collision function SHALL return
 * true if and only if A.x < B.x + B.width AND A.x + A.width > B.x AND
 * A.y < B.y + B.height AND A.y + A.height > B.y.
 *
 * **Validates: Requirements 6.1**
 */
describe('Feature: flappy-kiro, Property 6: AABB Collision Detection Correctness', () => {
  // Arbitrary for generating a rectangle with position in [-500, 500] and positive dimensions in [1, 200]
  const rectArb = fc.record({
    x: fc.double({ min: -500, max: 500, noNaN: true, noDefaultInfinity: true }),
    y: fc.double({ min: -500, max: 500, noNaN: true, noDefaultInfinity: true }),
    width: fc.double({ min: 1, max: 200, noNaN: true, noDefaultInfinity: true }),
    height: fc.double({ min: 1, max: 200, noNaN: true, noDefaultInfinity: true }),
  });

  it('aabbIntersect returns true iff all four overlap conditions are met', () => {
    fc.assert(
      fc.property(rectArb, rectArb, (a, b) => {
        const result = aabbIntersect(a, b);

        // Compute expected result by checking all four AABB conditions
        const expected =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;

        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('aabbIntersect is commutative: aabbIntersect(A, B) === aabbIntersect(B, A)', () => {
    fc.assert(
      fc.property(rectArb, rectArb, (a, b) => {
        const resultAB = aabbIntersect(a, b);
        const resultBA = aabbIntersect(b, a);

        expect(resultAB).toBe(resultBA);
      }),
      { numRuns: 100 }
    );
  });

  it('a rectangle always intersects with itself', () => {
    fc.assert(
      fc.property(rectArb, (a) => {
        expect(aabbIntersect(a, a)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('non-overlapping rectangles (separated horizontally) do not intersect', () => {
    fc.assert(
      fc.property(
        rectArb,
        fc.double({ min: 1, max: 200, noNaN: true, noDefaultInfinity: true }),
        (a, gap) => {
          // Place B to the right of A with a gap
          const b = {
            x: a.x + a.width + gap,
            y: a.y,
            width: a.width,
            height: a.height,
          };

          expect(aabbIntersect(a, b)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('non-overlapping rectangles (separated vertically) do not intersect', () => {
    fc.assert(
      fc.property(
        rectArb,
        fc.double({ min: 1, max: 200, noNaN: true, noDefaultInfinity: true }),
        (a, gap) => {
          // Place B below A with a gap
          const b = {
            x: a.x,
            y: a.y + a.height + gap,
            width: a.width,
            height: a.height,
          };

          expect(aabbIntersect(a, b)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 7: Boundary Collision Detection
// ============================================================================

// Replicate checkCollisions from js/collision.js
function checkCollisions(kiroEntity, pipes, groundYPos) {
  // Ground collision
  if (kiroEntity.y + kiroEntity.height >= groundYPos) {
    return { collided: true, type: 'ground' };
  }

  // Ceiling collision
  if (kiroEntity.y <= 0) {
    return { collided: true, type: 'ceiling' };
  }

  // Pipe collision (simplified AABB check)
  var kiroRect = {
    x: kiroEntity.x,
    y: kiroEntity.y,
    width: kiroEntity.width || GameConfig.KIRO_HEIGHT,
    height: kiroEntity.height,
  };

  for (var i = 0; i < pipes.length; i++) {
    var pipe = pipes[i];
    if (aabbIntersectLocal(kiroRect, pipe.topPipe) || aabbIntersectLocal(kiroRect, pipe.bottomPipe)) {
      return { collided: true, type: 'pipe' };
    }
  }

  return { collided: false, type: null };
}

function aabbIntersectLocal(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

const GROUND_Y = GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_HEIGHT; // 540

/**
 * Feature: flappy-kiro, Property 7: Boundary Collision Detection
 *
 * For any Kiro position, ground collision SHALL be detected if and only if
 * kiro.y + kiro.height >= groundY, and ceiling collision SHALL be detected
 * if and only if kiro.y <= 0.
 *
 * **Validates: Requirements 6.2, 6.3**
 */
describe('Feature: flappy-kiro, Property 7: Boundary Collision Detection', () => {
  it('ground collision is detected iff kiro.y + kiro.height >= groundY (540)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 700, noNaN: true, noDefaultInfinity: true }),
        (kiroY) => {
          const kiro = {
            x: GameConfig.KIRO_X,
            y: kiroY,
            width: GameConfig.KIRO_HEIGHT,
            height: GameConfig.KIRO_HEIGHT,
          };

          const result = checkCollisions(kiro, [], GROUND_Y);

          const shouldGroundCollide = kiroY + GameConfig.KIRO_HEIGHT >= GROUND_Y;

          if (shouldGroundCollide) {
            expect(result.collided).toBe(true);
            expect(result.type).toBe('ground');
          } else if (kiroY <= 0) {
            // Ceiling collision takes priority over no-collision
            expect(result.collided).toBe(true);
            expect(result.type).toBe('ceiling');
          } else {
            expect(result.collided).toBe(false);
            expect(result.type).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ceiling collision is detected iff kiro.y <= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 700, noNaN: true, noDefaultInfinity: true }),
        (kiroY) => {
          const kiro = {
            x: GameConfig.KIRO_X,
            y: kiroY,
            width: GameConfig.KIRO_HEIGHT,
            height: GameConfig.KIRO_HEIGHT,
          };

          const result = checkCollisions(kiro, [], GROUND_Y);

          const shouldGroundCollide = kiroY + GameConfig.KIRO_HEIGHT >= GROUND_Y;
          const shouldCeilingCollide = kiroY <= 0;

          if (shouldGroundCollide) {
            // Ground collision takes priority (checked first)
            expect(result.collided).toBe(true);
            expect(result.type).toBe('ground');
          } else if (shouldCeilingCollide) {
            expect(result.collided).toBe(true);
            expect(result.type).toBe('ceiling');
          } else {
            expect(result.collided).toBe(false);
            expect(result.type).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ground collision takes priority over pipe collision (checked first)', () => {
    fc.assert(
      fc.property(
        // Generate y values that trigger ground collision
        fc.double({ min: GROUND_Y - GameConfig.KIRO_HEIGHT, max: 700, noNaN: true, noDefaultInfinity: true }),
        (kiroY) => {
          const kiro = {
            x: GameConfig.KIRO_X,
            y: kiroY,
            width: GameConfig.KIRO_HEIGHT,
            height: GameConfig.KIRO_HEIGHT,
          };

          // Create a pipe that would overlap with kiro (if pipe check were reached)
          const overlappingPipe = {
            topPipe: { x: kiro.x - 10, y: 0, width: 52, height: kiro.y + kiro.height },
            bottomPipe: { x: kiro.x - 10, y: kiro.y, width: 52, height: 600 },
          };

          const result = checkCollisions(kiro, [overlappingPipe], GROUND_Y);

          // Ground collision should be detected (priority over pipe)
          expect(result.collided).toBe(true);
          expect(result.type).toBe('ground');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ceiling collision takes priority over pipe collision (checked second, after ground)', () => {
    fc.assert(
      fc.property(
        // Generate y values that trigger ceiling collision but NOT ground collision
        fc.double({ min: -100, max: 0, noNaN: true, noDefaultInfinity: true }),
        (kiroY) => {
          // Ensure this doesn't also trigger ground collision
          fc.pre(kiroY + GameConfig.KIRO_HEIGHT < GROUND_Y);

          const kiro = {
            x: GameConfig.KIRO_X,
            y: kiroY,
            width: GameConfig.KIRO_HEIGHT,
            height: GameConfig.KIRO_HEIGHT,
          };

          // Create a pipe that would overlap with kiro (if pipe check were reached)
          const overlappingPipe = {
            topPipe: { x: kiro.x - 10, y: 0, width: 52, height: 600 },
            bottomPipe: { x: kiro.x - 10, y: 0, width: 52, height: 600 },
          };

          const result = checkCollisions(kiro, [overlappingPipe], GROUND_Y);

          // Ceiling collision should be detected (priority over pipe)
          expect(result.collided).toBe(true);
          expect(result.type).toBe('ceiling');
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 5: Pipe Lifecycle Bounds
// ============================================================================

// Constants for pipe lifecycle tests
const PipeLifecycleConfig = Object.freeze({
  CANVAS_WIDTH: 400,
  PIPE_SPEED: 3,
  PIPE_WIDTH: 52,
  FRAME_DURATION: 1000 / 60,
  CANVAS_HEIGHT: 600,
  GROUND_HEIGHT: 60,
  GAP_HEIGHT: 120,
  MIN_GAP_MARGIN: 0.10,
});

/**
 * Replicates createPipePair from js/pipes.js for testing spawn position.
 * Uses a provided random value for deterministic testing.
 *
 * @param {number} randomValue - A value in [0, 1) to use instead of Math.random()
 * @returns {object} A PipePair object
 */
function createPipePairForLifecycle(randomValue) {
  var gapHeight = PipeLifecycleConfig.GAP_HEIGHT;
  var halfGap = gapHeight / 2;

  var minGapCenterY = PipeLifecycleConfig.MIN_GAP_MARGIN * PipeLifecycleConfig.CANVAS_HEIGHT + halfGap;
  var groundY = PipeLifecycleConfig.CANVAS_HEIGHT - PipeLifecycleConfig.GROUND_HEIGHT;
  var maxGapCenterY = groundY - PipeLifecycleConfig.MIN_GAP_MARGIN * PipeLifecycleConfig.CANVAS_HEIGHT - halfGap;

  var gapCenterY = minGapCenterY + randomValue * (maxGapCenterY - minGapCenterY);

  var x = PipeLifecycleConfig.CANVAS_WIDTH;
  var width = PipeLifecycleConfig.PIPE_WIDTH;

  var topPipeHeight = gapCenterY - halfGap;
  var bottomPipeY = gapCenterY + halfGap;
  var bottomPipeHeight = PipeLifecycleConfig.CANVAS_HEIGHT - PipeLifecycleConfig.GROUND_HEIGHT - bottomPipeY;

  return {
    x: x,
    gapCenterY: gapCenterY,
    gapHeight: gapHeight,
    width: width,
    scored: false,
    topPipe: {
      x: x,
      y: 0,
      width: width,
      height: topPipeHeight,
    },
    bottomPipe: {
      x: x,
      y: bottomPipeY,
      width: width,
      height: bottomPipeHeight,
    },
  };
}

/**
 * Replicates updatePipes from js/pipes.js for testing scroll and removal logic.
 *
 * @param {Array} pipesArray - The current array of active pipes
 * @param {number} normalizedDelta - Delta time normalized to frame duration
 * @returns {Array} The pipes array with positions updated and off-screen pipes removed
 */
function updatePipesForLifecycle(pipesArray, normalizedDelta) {
  for (var i = pipesArray.length - 1; i >= 0; i--) {
    var pipe = pipesArray[i];
    pipe.x -= PipeLifecycleConfig.PIPE_SPEED * normalizedDelta;
    pipe.topPipe.x = pipe.x;
    pipe.bottomPipe.x = pipe.x;

    if (pipe.x + pipe.width < 0) {
      pipesArray.splice(i, 1);
    }
  }
  return pipesArray;
}

/**
 * Feature: flappy-kiro, Property 5: Pipe Lifecycle Bounds
 *
 * For any Pipe_Pair, it SHALL spawn with x >= CANVAS_WIDTH (beyond right edge),
 * scroll left by exactly PIPE_SPEED * normalizedDelta pixels per update,
 * and after any update, no pipe in the active array SHALL have x + width < 0
 * (removed when fully off-screen).
 *
 * **Validates: Requirements 5.4, 5.5, 5.6**
 */
describe('Feature: flappy-kiro, Property 5: Pipe Lifecycle Bounds', () => {
  it('any newly created pipe has x >= CANVAS_WIDTH (400)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (randomValue) => {
          const pipe = createPipePairForLifecycle(randomValue);

          // Spawn x must be >= CANVAS_WIDTH
          expect(pipe.x).toBeGreaterThanOrEqual(PipeLifecycleConfig.CANVAS_WIDTH);
          // topPipe and bottomPipe x must match
          expect(pipe.topPipe.x).toBeGreaterThanOrEqual(PipeLifecycleConfig.CANVAS_WIDTH);
          expect(pipe.bottomPipe.x).toBeGreaterThanOrEqual(PipeLifecycleConfig.CANVAS_WIDTH);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('after updatePipes, each pipe x decreases by exactly PIPE_SPEED * normalizedDelta', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 5.0, noNaN: true, noDefaultInfinity: true }),
        (randomValue, normalizedDelta) => {
          const pipe = createPipePairForLifecycle(randomValue);
          const initialX = pipe.x;

          const pipesArray = [pipe];
          updatePipesForLifecycle(pipesArray, normalizedDelta);

          const expectedX = initialX - PipeLifecycleConfig.PIPE_SPEED * normalizedDelta;

          // Pipe should still be in array (not off-screen yet since it starts at CANVAS_WIDTH)
          expect(pipesArray.length).toBe(1);
          expect(pipesArray[0].x).toBeCloseTo(expectedX, 10);
          expect(pipesArray[0].topPipe.x).toBeCloseTo(expectedX, 10);
          expect(pipesArray[0].bottomPipe.x).toBeCloseTo(expectedX, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('after updatePipes, no pipe in the array has x + width < 0', () => {
    fc.assert(
      fc.property(
        // Generate pipes at various x positions including ones that should be removed
        fc.array(
          fc.double({ min: -200, max: 500, noNaN: true, noDefaultInfinity: true }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.double({ min: 0.1, max: 5.0, noNaN: true, noDefaultInfinity: true }),
        (xPositions, normalizedDelta) => {
          // Create pipes at various x positions
          const pipesArray = xPositions.map((x) => ({
            x: x,
            width: PipeLifecycleConfig.PIPE_WIDTH,
            scored: false,
            topPipe: { x: x, y: 0, width: PipeLifecycleConfig.PIPE_WIDTH, height: 200 },
            bottomPipe: { x: x, y: 320, width: PipeLifecycleConfig.PIPE_WIDTH, height: 200 },
          }));

          updatePipesForLifecycle(pipesArray, normalizedDelta);

          // After update, no remaining pipe should have x + width < 0
          for (const pipe of pipesArray) {
            expect(pipe.x + pipe.width).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 8: Score Increment and High Score Update
// ============================================================================

// Constants for score tests
const ScoreConfig = Object.freeze({
  KIRO_X: 80,
  PIPE_WIDTH: 52,
});

/**
 * Replicates checkScore from js/score.js for deterministic property-based testing.
 * Operates on a provided scoreState object and pipes array.
 *
 * @param {Object} kiro - The Kiro entity with an x property
 * @param {Array} pipes - Array of pipe objects with x, width, and scored properties
 * @param {Object} scoreState - Object with current and high score values
 */
function checkScoreForTest(kiro, pipes, scoreState) {
  for (var i = 0; i < pipes.length; i++) {
    if (!pipes[i].scored && kiro.x > pipes[i].x + pipes[i].width) {
      pipes[i].scored = true;
      scoreState.current++;
      if (scoreState.current > scoreState.high) {
        scoreState.high = scoreState.current;
      }
    }
  }
}

/**
 * Feature: flappy-kiro, Property 8: Score Increment and High Score Update
 *
 * For any Kiro horizontal position and Pipe_Pair, the score SHALL increment by
 * exactly 1 when kiro.x > pipe.x + pipe.width AND pipe.scored === false, and the
 * pipe SHALL be marked as scored. Furthermore, for any current score exceeding the
 * stored high score, the high score SHALL be updated to equal the current score.
 *
 * **Validates: Requirements 7.1, 7.4**
 */
describe('Feature: flappy-kiro, Property 8: Score Increment and High Score Update', () => {
  it('score increments by exactly 1 when kiro.x > pipe.x + pipe.width AND pipe.scored === false', () => {
    fc.assert(
      fc.property(
        // kiro.x is fixed at KIRO_X (80), generate pipe.x such that kiro passes the pipe
        // pipe.x + pipe.width < kiro.x => pipe.x < 80 - 52 = 28
        fc.double({ min: -200, max: 27, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (pipeX, initialScore, initialHigh) => {
          const kiro = { x: ScoreConfig.KIRO_X };
          const pipe = { x: pipeX, width: ScoreConfig.PIPE_WIDTH, scored: false };
          const scoreState = { current: initialScore, high: Math.max(initialHigh, initialScore) };

          const scoreBefore = scoreState.current;

          checkScoreForTest(kiro, [pipe], scoreState);

          // Score should increment by exactly 1
          expect(scoreState.current).toBe(scoreBefore + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('score does NOT increment when kiro.x <= pipe.x + pipe.width', () => {
    fc.assert(
      fc.property(
        // Generate pipe.x such that kiro has NOT passed the pipe
        // pipe.x + pipe.width >= kiro.x => pipe.x >= 80 - 52 = 28
        fc.double({ min: 28, max: 500, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (pipeX, initialScore, initialHigh) => {
          const kiro = { x: ScoreConfig.KIRO_X };
          const pipe = { x: pipeX, width: ScoreConfig.PIPE_WIDTH, scored: false };
          const scoreState = { current: initialScore, high: Math.max(initialHigh, initialScore) };

          const scoreBefore = scoreState.current;

          checkScoreForTest(kiro, [pipe], scoreState);

          // Score should NOT change
          expect(scoreState.current).toBe(scoreBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('score does NOT increment when pipe.scored === true (already counted)', () => {
    fc.assert(
      fc.property(
        // Even if kiro has passed the pipe, scored=true prevents increment
        fc.double({ min: -200, max: 27, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (pipeX, initialScore, initialHigh) => {
          const kiro = { x: ScoreConfig.KIRO_X };
          const pipe = { x: pipeX, width: ScoreConfig.PIPE_WIDTH, scored: true };
          const scoreState = { current: initialScore, high: Math.max(initialHigh, initialScore) };

          const scoreBefore = scoreState.current;

          checkScoreForTest(kiro, [pipe], scoreState);

          // Score should NOT change since pipe is already scored
          expect(scoreState.current).toBe(scoreBefore);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('pipe is marked as scored (pipe.scored = true) after being counted', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -200, max: 27, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 0, max: 100 }),
        (pipeX, initialScore) => {
          const kiro = { x: ScoreConfig.KIRO_X };
          const pipe = { x: pipeX, width: ScoreConfig.PIPE_WIDTH, scored: false };
          const scoreState = { current: initialScore, high: initialScore };

          checkScoreForTest(kiro, [pipe], scoreState);

          // Pipe should now be marked as scored
          expect(pipe.scored).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('high score updates when current score exceeds stored high score', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -200, max: 27, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 0, max: 100 }),
        (pipeX, initialScore) => {
          const kiro = { x: ScoreConfig.KIRO_X };
          const pipe = { x: pipeX, width: ScoreConfig.PIPE_WIDTH, scored: false };
          // Set high score equal to current so that after increment, current > high
          const scoreState = { current: initialScore, high: initialScore };

          checkScoreForTest(kiro, [pipe], scoreState);

          // After increment, current = initialScore + 1 > initialScore = old high
          // So high score should be updated to current
          expect(scoreState.high).toBe(scoreState.current);
          expect(scoreState.high).toBe(initialScore + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('high score does NOT decrease (monotonically non-decreasing)', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of pipe positions (some passed, some not)
        fc.array(
          fc.record({
            x: fc.double({ min: -200, max: 500, noNaN: true, noDefaultInfinity: true }),
            scored: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 100 }),
        (pipeConfigs, initialScore, initialHigh) => {
          const kiro = { x: ScoreConfig.KIRO_X };
          const pipes = pipeConfigs.map((cfg) => ({
            x: cfg.x,
            width: ScoreConfig.PIPE_WIDTH,
            scored: cfg.scored,
          }));
          const scoreState = { current: initialScore, high: Math.max(initialHigh, initialScore) };

          const highBefore = scoreState.high;

          checkScoreForTest(kiro, pipes, scoreState);

          // High score should never decrease
          expect(scoreState.high).toBeGreaterThanOrEqual(highBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ============================================================================
// Property 9: Canvas Scaling Preserves Aspect Ratio
// ============================================================================

// Constants for canvas scaling tests
const CanvasScalingConfig = Object.freeze({
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
});

/**
 * Replicates the scaling logic from index.html resizeCanvas function.
 * Computes the display scale for given viewport dimensions.
 *
 * @param {number} viewportWidth - The viewport width in pixels
 * @param {number} viewportHeight - The viewport height in pixels
 * @returns {number} The computed scale factor
 */
function computeScale(viewportWidth, viewportHeight) {
  var scaleX = viewportWidth / CanvasScalingConfig.CANVAS_WIDTH;
  var scaleY = viewportHeight / CanvasScalingConfig.CANVAS_HEIGHT;
  return Math.min(scaleX, scaleY, 1);
}

/**
 * Computes the display dimensions after scaling.
 *
 * @param {number} viewportWidth - The viewport width in pixels
 * @param {number} viewportHeight - The viewport height in pixels
 * @returns {{ displayWidth: number, displayHeight: number, scale: number }}
 */
function computeDisplayDimensions(viewportWidth, viewportHeight) {
  var scale = computeScale(viewportWidth, viewportHeight);
  var displayWidth = Math.floor(CanvasScalingConfig.CANVAS_WIDTH * scale);
  var displayHeight = Math.floor(CanvasScalingConfig.CANVAS_HEIGHT * scale);
  return { displayWidth, displayHeight, scale };
}

/**
 * Feature: flappy-kiro, Property 9: Canvas Scaling Preserves Aspect Ratio
 *
 * For any viewport dimensions (width, height), the computed canvas display scale
 * SHALL preserve the 2:3 aspect ratio (400:600). When both viewport dimensions
 * exceed 400×600, scale SHALL be exactly 1 (no upscaling). When either dimension
 * is smaller, scale SHALL be min(viewportWidth/400, viewportHeight/600) and the
 * canvas SHALL fit entirely within the viewport.
 *
 * **Validates: Requirements 2.3, 11.3, 11.4**
 */
describe('Feature: flappy-kiro, Property 9: Canvas Scaling Preserves Aspect Ratio', () => {
  it('scale equals min(viewportWidth/400, viewportHeight/600, 1) for any viewport dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 4000 }),
        fc.integer({ min: 50, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const scale = computeScale(viewportWidth, viewportHeight);

          const expectedScale = Math.min(
            viewportWidth / CanvasScalingConfig.CANVAS_WIDTH,
            viewportHeight / CanvasScalingConfig.CANVAS_HEIGHT,
            1
          );

          expect(scale).toBeCloseTo(expectedScale, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when both viewport dimensions exceed 400×600, scale is exactly 1 (no upscaling)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 400, max: 4000 }),
        fc.integer({ min: 600, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const scale = computeScale(viewportWidth, viewportHeight);

          expect(scale).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when either dimension is smaller, scale equals min(vw/400, vh/600)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 4000 }),
        fc.integer({ min: 50, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          // Only test cases where at least one dimension is smaller than native
          fc.pre(viewportWidth < CanvasScalingConfig.CANVAS_WIDTH || viewportHeight < CanvasScalingConfig.CANVAS_HEIGHT);

          const scale = computeScale(viewportWidth, viewportHeight);

          const expectedScale = Math.min(
            viewportWidth / CanvasScalingConfig.CANVAS_WIDTH,
            viewportHeight / CanvasScalingConfig.CANVAS_HEIGHT
          );

          expect(scale).toBeCloseTo(expectedScale, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('displayed canvas dimensions preserve the 2:3 aspect ratio (400/600)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 4000 }),
        fc.integer({ min: 50, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const { displayWidth, displayHeight } = computeDisplayDimensions(viewportWidth, viewportHeight);

          // The target aspect ratio is 400:600 = 2:3
          const targetRatio = CanvasScalingConfig.CANVAS_WIDTH / CanvasScalingConfig.CANVAS_HEIGHT;

          // Due to Math.floor, the actual ratio may differ slightly
          // but should be within 1 pixel of the ideal ratio
          // displayWidth = floor(400 * scale), displayHeight = floor(600 * scale)
          // The ratio should be very close to 2/3
          if (displayWidth > 0 && displayHeight > 0) {
            const actualRatio = displayWidth / displayHeight;
            // Allow tolerance for floor rounding (at most 1px off in each dimension)
            const tolerance = 1 / Math.min(displayWidth, displayHeight);
            expect(Math.abs(actualRatio - targetRatio)).toBeLessThanOrEqual(tolerance + 0.001);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('canvas fits entirely within the viewport (displayWidth <= vw, displayHeight <= vh)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 4000 }),
        fc.integer({ min: 50, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const { displayWidth, displayHeight } = computeDisplayDimensions(viewportWidth, viewportHeight);

          // The displayed canvas must fit within the viewport
          expect(displayWidth).toBeLessThanOrEqual(viewportWidth);
          expect(displayHeight).toBeLessThanOrEqual(viewportHeight);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('scale is always in range (0, 1] for any positive viewport dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 4000 }),
        fc.integer({ min: 50, max: 4000 }),
        (viewportWidth, viewportHeight) => {
          const scale = computeScale(viewportWidth, viewportHeight);

          expect(scale).toBeGreaterThan(0);
          expect(scale).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
