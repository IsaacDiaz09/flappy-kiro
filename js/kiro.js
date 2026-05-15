/**
 * Flappy Kiro - Kiro Entity and Physics
 * Manages Kiro's position, velocity, gravity, and flap mechanics.
 */

(function () {
  'use strict';

  /**
   * Create the Kiro entity with initial state.
   * @returns {Object} KiroEntity data structure
   */
  function createKiro() {
    return {
      x: GameConfig.KIRO_X,
      y: GameConfig.CANVAS_HEIGHT / 2,
      width: 0,   // Will be set when sprite loads (derived from aspect ratio)
      height: GameConfig.KIRO_HEIGHT,
      velocityY: 0,
      rotation: 0,
      sprite: null // Will be set when image loads
    };
  }

  // Create the global Kiro instance
  var kiro = createKiro();

  /**
   * Update Kiro's physics: apply gravity, update position, and compute rotation.
   * @param {Object} entity - The KiroEntity to update
   * @param {number} normalizedDelta - Delta-time normalized against FRAME_DURATION (1.0 = one frame at 60fps)
   */
  function updateKiroPhysics(entity, normalizedDelta) {
    entity = entity || kiro;
    // Apply gravity: increase downward velocity
    entity.velocityY += GameConfig.GRAVITY * normalizedDelta;

    // Cap terminal velocity at MAX_FALL_SPEED
    if (entity.velocityY > GameConfig.MAX_FALL_SPEED) {
      entity.velocityY = GameConfig.MAX_FALL_SPEED;
    }

    // Update vertical position
    entity.y += entity.velocityY * normalizedDelta;

    // Update rotation based on vertical velocity
    if (entity.velocityY > 0) {
      // Falling: progressively rotate downward proportional to velocity
      entity.rotation = (entity.velocityY / GameConfig.MAX_FALL_SPEED) * GameConfig.ROTATION_DOWN_MAX;
      // Cap at maximum downward rotation
      if (entity.rotation > GameConfig.ROTATION_DOWN_MAX) {
        entity.rotation = GameConfig.ROTATION_DOWN_MAX;
      }
    } else {
      // Rising or neutral: interpolate rotation toward 0 from ROTATION_UP
      // Map velocity from [FLAP_VELOCITY, 0] to [ROTATION_UP, 0]
      entity.rotation = (entity.velocityY / GameConfig.FLAP_VELOCITY) * GameConfig.ROTATION_UP;
    }
  }

  /**
   * Apply a flap impulse to Kiro, setting velocity to FLAP_VELOCITY
   * regardless of current velocity.
   * @param {Object} entity - The KiroEntity to flap
   */
  function applyFlap(entity) {
    entity = entity || kiro;
    entity.velocityY = GameConfig.FLAP_VELOCITY;
    entity.rotation = GameConfig.ROTATION_UP;
  }

  /**
   * Reset Kiro to the starting position (center of canvas).
   * Used when transitioning back to Ready state.
   */
  function resetKiro() {
    kiro.y = GameConfig.CANVAS_HEIGHT / 2;
    kiro.velocityY = 0;
    kiro.rotation = 0;
  }

  // Expose globally
  window.kiro = kiro;
  window.updateKiroPhysics = updateKiroPhysics;
  window.applyFlap = applyFlap;
  window.resetKiro = resetKiro;
})();
