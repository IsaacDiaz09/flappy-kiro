/**
 * Flappy Kiro - Collision Detection Unit Tests
 * Tests for aabbIntersect() and checkCollisions() functions.
 */

import { describe, it, expect } from 'vitest';

// Replicate GameConfig constants
const GameConfig = Object.freeze({
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  GROUND_HEIGHT: 60,
  KIRO_HEIGHT: 36,
  KIRO_X: 80,
});

const GROUND_Y = GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_HEIGHT; // 540

// Replicate aabbIntersect from js/collision.js
function aabbIntersect(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

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

describe('Collision Detection (Task 5.5)', () => {
  describe('aabbIntersect', () => {
    it('returns true for overlapping rectangles', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 5, y: 5, width: 10, height: 10 };
      expect(aabbIntersect(a, b)).toBe(true);
    });

    it('returns false for non-overlapping rectangles (side by side)', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 20, y: 0, width: 10, height: 10 };
      expect(aabbIntersect(a, b)).toBe(false);
    });

    it('returns false for non-overlapping rectangles (above/below)', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 0, y: 20, width: 10, height: 10 };
      expect(aabbIntersect(a, b)).toBe(false);
    });

    it('returns false when rectangles share an edge (touching but not overlapping)', () => {
      const a = { x: 0, y: 0, width: 10, height: 10 };
      const b = { x: 10, y: 0, width: 10, height: 10 };
      expect(aabbIntersect(a, b)).toBe(false);
    });

    it('returns true when one rectangle is fully inside another', () => {
      const a = { x: 0, y: 0, width: 100, height: 100 };
      const b = { x: 25, y: 25, width: 10, height: 10 };
      expect(aabbIntersect(a, b)).toBe(true);
    });

    it('returns true for identical rectangles', () => {
      const a = { x: 5, y: 5, width: 20, height: 20 };
      expect(aabbIntersect(a, a)).toBe(true);
    });
  });

  describe('checkCollisions', () => {
    it('detects ground collision when kiro.y + kiro.height >= groundY', () => {
      const kiro = { x: 80, y: 510, width: 30, height: 36 };
      const result = checkCollisions(kiro, [], GROUND_Y);
      expect(result).toEqual({ collided: true, type: 'ground' });
    });

    it('detects ground collision at exact boundary', () => {
      const kiro = { x: 80, y: GROUND_Y - 36, width: 30, height: 36 };
      const result = checkCollisions(kiro, [], GROUND_Y);
      expect(result).toEqual({ collided: true, type: 'ground' });
    });

    it('detects ceiling collision when kiro.y <= 0', () => {
      const kiro = { x: 80, y: 0, width: 30, height: 36 };
      const result = checkCollisions(kiro, [], GROUND_Y);
      expect(result).toEqual({ collided: true, type: 'ceiling' });
    });

    it('detects ceiling collision when kiro.y is negative', () => {
      const kiro = { x: 80, y: -5, width: 30, height: 36 };
      const result = checkCollisions(kiro, [], GROUND_Y);
      expect(result).toEqual({ collided: true, type: 'ceiling' });
    });

    it('detects pipe collision with top pipe', () => {
      const kiro = { x: 80, y: 50, width: 30, height: 36 };
      const pipe = {
        topPipe: { x: 70, y: 0, width: 52, height: 100 },
        bottomPipe: { x: 70, y: 300, width: 52, height: 240 }
      };
      const result = checkCollisions(kiro, [pipe], GROUND_Y);
      expect(result).toEqual({ collided: true, type: 'pipe' });
    });

    it('detects pipe collision with bottom pipe', () => {
      const kiro = { x: 80, y: 350, width: 30, height: 36 };
      const pipe = {
        topPipe: { x: 70, y: 0, width: 52, height: 100 },
        bottomPipe: { x: 70, y: 300, width: 52, height: 240 }
      };
      const result = checkCollisions(kiro, [pipe], GROUND_Y);
      expect(result).toEqual({ collided: true, type: 'pipe' });
    });

    it('returns no collision when kiro is safely in the gap', () => {
      const kiro = { x: 80, y: 200, width: 30, height: 36 };
      const pipe = {
        topPipe: { x: 70, y: 0, width: 52, height: 150 },
        bottomPipe: { x: 70, y: 300, width: 52, height: 240 }
      };
      const result = checkCollisions(kiro, [pipe], GROUND_Y);
      expect(result).toEqual({ collided: false, type: null });
    });

    it('returns no collision when no pipes and kiro is in safe zone', () => {
      const kiro = { x: 80, y: 300, width: 30, height: 36 };
      const result = checkCollisions(kiro, [], GROUND_Y);
      expect(result).toEqual({ collided: false, type: null });
    });

    it('uses KIRO_HEIGHT as fallback width when kiro.width is 0', () => {
      const kiro = { x: 80, y: 200, width: 0, height: 36 };
      // Pipe overlaps with kiro if width is KIRO_HEIGHT (36)
      const pipe = {
        topPipe: { x: 100, y: 180, width: 52, height: 60 },
        bottomPipe: { x: 100, y: 400, width: 52, height: 140 }
      };
      // kiro rect would be x:80, width:36, so right edge = 116, which overlaps pipe at x:100
      const result = checkCollisions(kiro, [pipe], GROUND_Y);
      expect(result).toEqual({ collided: true, type: 'pipe' });
    });

    it('ground collision takes priority over pipe collision', () => {
      const kiro = { x: 80, y: 520, width: 30, height: 36 };
      const pipe = {
        topPipe: { x: 70, y: 0, width: 52, height: 100 },
        bottomPipe: { x: 70, y: 500, width: 52, height: 40 }
      };
      const result = checkCollisions(kiro, [pipe], GROUND_Y);
      expect(result).toEqual({ collided: true, type: 'ground' });
    });

    it('ceiling collision takes priority over pipe collision', () => {
      const kiro = { x: 80, y: -2, width: 30, height: 36 };
      const pipe = {
        topPipe: { x: 70, y: 0, width: 52, height: 100 },
        bottomPipe: { x: 70, y: 300, width: 52, height: 240 }
      };
      const result = checkCollisions(kiro, [pipe], GROUND_Y);
      expect(result).toEqual({ collided: true, type: 'ceiling' });
    });
  });
});
