/**
 * Flappy Kiro - Background Parallax Unit Tests
 * Tests for parallax scrolling background layers.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Replicate GameConfig constants used in background logic
const GameConfig = Object.freeze({
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  GROUND_HEIGHT: 60,
  PIPE_SPEED: 3,
});

const CANVAS_WIDTH = GameConfig.CANVAS_WIDTH;
const PIPE_SPEED = GameConfig.PIPE_SPEED;

// ============================================================================
// Replicate background.js logic for testing
// ============================================================================

function createBackgroundLayers() {
  return [
    {
      color: '#2d5a27',
      speedMultiplier: 0.25,
      elements: [{ x: 0, y: 400, width: 80, height: 140 }],
      offsetX: 0,
    },
    {
      color: '#3d7a37',
      speedMultiplier: 0.50,
      elements: [{ x: 0, y: 450, width: 60, height: 90 }],
      offsetX: 0,
    },
  ];
}

function updateBackground(layers, normalizedDelta) {
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    layer.offsetX -= PIPE_SPEED * layer.speedMultiplier * normalizedDelta;

    // Wrap offset when it scrolls past one full canvas width
    if (layer.offsetX <= -CANVAS_WIDTH) {
      layer.offsetX += CANVAS_WIDTH;
    }
  }
}

// ============================================================================
// Unit Tests
// ============================================================================

describe('Parallax Background', () => {
  let layers;

  beforeEach(() => {
    layers = createBackgroundLayers();
  });

  describe('layer configuration', () => {
    it('has at least 2 parallax layers', () => {
      expect(layers.length).toBeGreaterThanOrEqual(2);
    });

    it('far layer scrolls at 25% of pipe speed', () => {
      expect(layers[0].speedMultiplier).toBe(0.25);
    });

    it('near layer scrolls at 50% of pipe speed', () => {
      expect(layers[1].speedMultiplier).toBe(0.50);
    });

    it('farthest layer scrolls at no more than 50% of pipe speed', () => {
      expect(layers[0].speedMultiplier).toBeLessThanOrEqual(0.50);
    });

    it('all layers have speedMultiplier no more than 50% for farthest', () => {
      // The farthest layer (index 0) must be <= 50%
      expect(layers[0].speedMultiplier).toBeLessThanOrEqual(0.50);
    });
  });

  describe('updateBackground - scroll speeds', () => {
    it('far layer moves at 0.75 px/frame (25% of pipe speed 3)', () => {
      updateBackground(layers, 1.0);
      // 3 * 0.25 * 1.0 = 0.75
      expect(layers[0].offsetX).toBeCloseTo(-0.75);
    });

    it('near layer moves at 1.5 px/frame (50% of pipe speed 3)', () => {
      updateBackground(layers, 1.0);
      // 3 * 0.50 * 1.0 = 1.5
      expect(layers[1].offsetX).toBeCloseTo(-1.5);
    });

    it('respects normalizedDelta for variable frame rates', () => {
      updateBackground(layers, 2.0); // double speed frame
      expect(layers[0].offsetX).toBeCloseTo(-1.5); // 0.75 * 2
      expect(layers[1].offsetX).toBeCloseTo(-3.0); // 1.5 * 2
    });

    it('far layer always scrolls slower than near layer', () => {
      updateBackground(layers, 1.0);
      // Far layer offset should be less negative (slower)
      expect(Math.abs(layers[0].offsetX)).toBeLessThan(Math.abs(layers[1].offsetX));
    });
  });

  describe('updateBackground - wrapping', () => {
    it('wraps offset when it reaches -CANVAS_WIDTH', () => {
      layers[0].offsetX = -399.5;
      // After update: -399.5 - 0.75 = -400.25, which is <= -400, so wraps to -400.25 + 400 = -0.25
      updateBackground(layers, 1.0);
      expect(layers[0].offsetX).toBeCloseTo(-0.25);
    });

    it('does not wrap when offset has not reached -CANVAS_WIDTH', () => {
      layers[0].offsetX = -100;
      updateBackground(layers, 1.0);
      // -100 - 0.75 = -100.75, not <= -400, no wrap
      expect(layers[0].offsetX).toBeCloseTo(-100.75);
    });

    it('wraps seamlessly for continuous scrolling', () => {
      // Simulate many frames of scrolling
      for (let i = 0; i < 600; i++) {
        updateBackground(layers, 1.0);
      }
      // After wrapping, offset should be between -CANVAS_WIDTH and 0
      expect(layers[0].offsetX).toBeGreaterThan(-CANVAS_WIDTH);
      expect(layers[0].offsetX).toBeLessThanOrEqual(0);
      expect(layers[1].offsetX).toBeGreaterThan(-CANVAS_WIDTH);
      expect(layers[1].offsetX).toBeLessThanOrEqual(0);
    });
  });
});
