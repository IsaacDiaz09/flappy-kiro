/**
 * Flappy Kiro - Collision Detection
 * AABB (Axis-Aligned Bounding Box) collision detection for Kiro against pipes and boundaries.
 */

(function () {
  'use strict';

  var groundY = GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_HEIGHT;

  /**
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
   * Check all collisions for Kiro against pipes and boundaries.
   * @param {Object} kiroEntity - Kiro entity with x, y, width, height
   * @param {Array} pipes - Array of PipePair objects with topPipe and bottomPipe rects
   * @param {number} groundYPos - Y coordinate of the ground top edge
   * @returns {Object} CollisionResult { collided: boolean, type: 'ground'|'ceiling'|'pipe'|null }
   */
  function checkCollisions(kiroEntity, pipes, groundYPos) {
    // Ground collision
    if (kiroEntity.y + kiroEntity.height >= groundYPos) {
      return { collided: true, type: 'ground' };
    }

    // Ceiling collision
    if (kiroEntity.y <= 0) {
      return { collided: true, type: 'ceiling' };
    }

    // Pipe collision
    var kiroRect = {
      x: kiroEntity.x,
      y: kiroEntity.y,
      width: kiroEntity.width || GameConfig.KIRO_HEIGHT,
      height: kiroEntity.height
    };

    for (var i = 0; i < pipes.length; i++) {
      var pipe = pipes[i];
      if (aabbIntersect(kiroRect, pipe.topPipe) || aabbIntersect(kiroRect, pipe.bottomPipe)) {
        return { collided: true, type: 'pipe' };
      }
    }

    return { collided: false, type: null };
  }

  // Expose globally
  window.aabbIntersect = aabbIntersect;
  window.checkCollisions = checkCollisions;
  window.GROUND_Y = groundY;
})();
