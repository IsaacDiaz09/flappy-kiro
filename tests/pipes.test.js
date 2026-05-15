/**
 * Flappy Kiro - Pipe Generation Unit Tests
 * Tests for pipe generation with randomized gaps (Task 5.1).
 */

import { describe, it, expect } from 'vitest';

// Replicate GameConfig constants used in pipe generation
const GameConfig = Object.freeze({
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  GROUND_HEIGHT: 60,
  PIPE_SPEED: 3,
  PIPE_SPAWN_INTERVAL: 1500,
  PIPE_WIDTH: 52,
  GAP_HEIGHT: 120,
  MIN_GAP_MARGIN: 0.10,
  KIRO_HEIGHT: 36,
  FRAME_DURATION: 1000 / 60,
});

// Replicate createPipePair logic from js/pipes.js
function createPipePair() {
  var gapHeight = GameConfig.GAP_HEIGHT;
  var halfGap = gapHeight / 2;

  var minGapCenterY = GameConfig.MIN_GAP_MARGIN * GameConfig.CANVAS_HEIGHT + halfGap;
  var groundY = GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_HEIGHT;
  var maxGapCenterY = groundY - GameConfig.MIN_GAP_MARGIN * GameConfig.CANVAS_HEIGHT - halfGap;

  var gapCenterY = minGapCenterY + Math.random() * (maxGapCenterY - minGapCenterY);

  var x = GameConfig.CANVAS_WIDTH;
  var width = GameConfig.PIPE_WIDTH;

  var topPipeHeight = gapCenterY - halfGap;
  var bottomPipeY = gapCenterY + halfGap;
  var bottomPipeHeight = GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_HEIGHT - bottomPipeY;

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
      height: topPipeHeight
    },
    bottomPipe: {
      x: x,
      y: bottomPipeY,
      width: width,
      height: bottomPipeHeight
    }
  };
}

// Replicate trySpawnPipe logic from js/pipes.js
function createPipeManager() {
  var timeSinceLastPipe = 0;

  function trySpawnPipe(pipesArray, deltaMs) {
    timeSinceLastPipe += deltaMs;

    if (timeSinceLastPipe >= GameConfig.PIPE_SPAWN_INTERVAL) {
      var newPipe = createPipePair();
      pipesArray.push(newPipe);
      timeSinceLastPipe = 0;
    }

    return pipesArray;
  }

  function resetPipes(pipesArray) {
    pipesArray.length = 0;
    timeSinceLastPipe = 0;
  }

  function getTimeSinceLastPipe() {
    return timeSinceLastPipe;
  }

  return { trySpawnPipe, resetPipes, getTimeSinceLastPipe };
}

describe('Pipe Generation (Task 5.1)', () => {
  describe('createPipePair', () => {
    it('spawns pipe at the right edge of the canvas (x = CANVAS_WIDTH)', () => {
      const pipe = createPipePair();
      expect(pipe.x).toBe(GameConfig.CANVAS_WIDTH);
    });

    it('sets pipe width to PIPE_WIDTH', () => {
      const pipe = createPipePair();
      expect(pipe.width).toBe(GameConfig.PIPE_WIDTH);
    });

    it('sets gap height to GAP_HEIGHT (>= 3 * KIRO_HEIGHT)', () => {
      const pipe = createPipePair();
      expect(pipe.gapHeight).toBe(GameConfig.GAP_HEIGHT);
      expect(pipe.gapHeight).toBeGreaterThanOrEqual(3 * GameConfig.KIRO_HEIGHT);
    });

    it('initializes scored to false', () => {
      const pipe = createPipePair();
      expect(pipe.scored).toBe(false);
    });

    it('gap center Y is within valid range [120, 420]', () => {
      const halfGap = GameConfig.GAP_HEIGHT / 2;
      const minY = GameConfig.MIN_GAP_MARGIN * GameConfig.CANVAS_HEIGHT + halfGap;
      const groundY = GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_HEIGHT;
      const maxY = groundY - GameConfig.MIN_GAP_MARGIN * GameConfig.CANVAS_HEIGHT - halfGap;

      // Run multiple times to test randomization
      for (let i = 0; i < 50; i++) {
        const pipe = createPipePair();
        expect(pipe.gapCenterY).toBeGreaterThanOrEqual(minY);
        expect(pipe.gapCenterY).toBeLessThanOrEqual(maxY);
      }
    });

    it('top pipe starts at y=0 and ends at gap top', () => {
      const pipe = createPipePair();
      expect(pipe.topPipe.y).toBe(0);
      expect(pipe.topPipe.height).toBeCloseTo(pipe.gapCenterY - pipe.gapHeight / 2);
    });

    it('bottom pipe starts at gap bottom and extends to ground', () => {
      const pipe = createPipePair();
      const expectedBottomY = pipe.gapCenterY + pipe.gapHeight / 2;
      expect(pipe.bottomPipe.y).toBeCloseTo(expectedBottomY);

      const expectedHeight = GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_HEIGHT - expectedBottomY;
      expect(pipe.bottomPipe.height).toBeCloseTo(expectedHeight);
    });

    it('top pipe and bottom pipe have same x and width as parent', () => {
      const pipe = createPipePair();
      expect(pipe.topPipe.x).toBe(pipe.x);
      expect(pipe.topPipe.width).toBe(pipe.width);
      expect(pipe.bottomPipe.x).toBe(pipe.x);
      expect(pipe.bottomPipe.width).toBe(pipe.width);
    });

    it('entire gap is at least 10% canvas height from top edge', () => {
      for (let i = 0; i < 50; i++) {
        const pipe = createPipePair();
        const gapTop = pipe.gapCenterY - pipe.gapHeight / 2;
        const minMargin = GameConfig.MIN_GAP_MARGIN * GameConfig.CANVAS_HEIGHT;
        expect(gapTop).toBeGreaterThanOrEqual(minMargin);
      }
    });

    it('entire gap is at least 10% canvas height from ground boundary', () => {
      for (let i = 0; i < 50; i++) {
        const pipe = createPipePair();
        const gapBottom = pipe.gapCenterY + pipe.gapHeight / 2;
        const groundY = GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_HEIGHT;
        const minMargin = GameConfig.MIN_GAP_MARGIN * GameConfig.CANVAS_HEIGHT;
        expect(gapBottom).toBeLessThanOrEqual(groundY - minMargin);
      }
    });
  });

  describe('trySpawnPipe', () => {
    it('does not spawn a pipe before PIPE_SPAWN_INTERVAL has elapsed', () => {
      const manager = createPipeManager();
      const pipes = [];

      manager.trySpawnPipe(pipes, 1000); // 1000ms < 1500ms
      expect(pipes.length).toBe(0);
    });

    it('spawns a pipe when PIPE_SPAWN_INTERVAL has elapsed', () => {
      const manager = createPipeManager();
      const pipes = [];

      manager.trySpawnPipe(pipes, 1500);
      expect(pipes.length).toBe(1);
    });

    it('spawns a pipe when accumulated time exceeds PIPE_SPAWN_INTERVAL', () => {
      const manager = createPipeManager();
      const pipes = [];

      manager.trySpawnPipe(pipes, 800);
      expect(pipes.length).toBe(0);

      manager.trySpawnPipe(pipes, 800); // total: 1600ms >= 1500ms
      expect(pipes.length).toBe(1);
    });

    it('resets timer after spawning a pipe', () => {
      const manager = createPipeManager();
      const pipes = [];

      manager.trySpawnPipe(pipes, 1500);
      expect(pipes.length).toBe(1);

      // After reset, need another full interval
      manager.trySpawnPipe(pipes, 1000);
      expect(pipes.length).toBe(1); // still 1

      manager.trySpawnPipe(pipes, 500);
      expect(pipes.length).toBe(2); // now 2
    });

    it('spawns multiple pipes over time', () => {
      const manager = createPipeManager();
      const pipes = [];

      // Simulate 5 seconds of gameplay at ~16ms frames
      for (let t = 0; t < 5000; t += 16) {
        manager.trySpawnPipe(pipes, 16);
      }

      // At 1500ms interval over 5000ms, expect ~3 pipes
      expect(pipes.length).toBeGreaterThanOrEqual(3);
      expect(pipes.length).toBeLessThanOrEqual(4);
    });
  });

  describe('resetPipes', () => {
    it('clears all pipes and resets timer', () => {
      const manager = createPipeManager();
      const pipes = [];

      manager.trySpawnPipe(pipes, 1500);
      expect(pipes.length).toBe(1);

      manager.resetPipes(pipes);
      expect(pipes.length).toBe(0);

      // Timer should be reset - need full interval again
      manager.trySpawnPipe(pipes, 1000);
      expect(pipes.length).toBe(0);
    });
  });
});

// Replicate updatePipes logic from js/pipes.js
function updatePipes(pipesArray, normalizedDelta) {
  for (var i = pipesArray.length - 1; i >= 0; i--) {
    var pipe = pipesArray[i];
    pipe.x -= GameConfig.PIPE_SPEED * normalizedDelta;
    pipe.topPipe.x = pipe.x;
    pipe.bottomPipe.x = pipe.x;

    // Remove if fully off-screen left
    if (pipe.x + pipe.width < 0) {
      pipesArray.splice(i, 1);
    }
  }
  return pipesArray;
}

describe('Pipe Scrolling and Removal (Task 5.3)', () => {
  describe('updatePipes - scrolling', () => {
    it('scrolls a pipe left by PIPE_SPEED * normalizedDelta', () => {
      const pipe = createPipePair();
      const initialX = pipe.x;
      const pipes = [pipe];

      updatePipes(pipes, 1.0); // normalizedDelta = 1 (one frame at 60fps)

      expect(pipe.x).toBeCloseTo(initialX - GameConfig.PIPE_SPEED);
    });

    it('updates topPipe.x and bottomPipe.x to match pipe.x', () => {
      const pipe = createPipePair();
      const pipes = [pipe];

      updatePipes(pipes, 1.0);

      expect(pipe.topPipe.x).toBe(pipe.x);
      expect(pipe.bottomPipe.x).toBe(pipe.x);
    });

    it('scales scrolling by normalizedDelta (half frame)', () => {
      const pipe = createPipePair();
      const initialX = pipe.x;
      const pipes = [pipe];

      updatePipes(pipes, 0.5); // half a frame

      expect(pipe.x).toBeCloseTo(initialX - GameConfig.PIPE_SPEED * 0.5);
    });

    it('scales scrolling by normalizedDelta (double frame)', () => {
      const pipe = createPipePair();
      const initialX = pipe.x;
      const pipes = [pipe];

      updatePipes(pipes, 2.0); // two frames worth

      expect(pipe.x).toBeCloseTo(initialX - GameConfig.PIPE_SPEED * 2.0);
    });

    it('scrolls multiple pipes simultaneously', () => {
      const pipe1 = createPipePair();
      const pipe2 = createPipePair();
      pipe2.x = 200; // place second pipe at different position
      pipe2.topPipe.x = 200;
      pipe2.bottomPipe.x = 200;

      const pipes = [pipe1, pipe2];
      const initialX1 = pipe1.x;
      const initialX2 = pipe2.x;

      updatePipes(pipes, 1.0);

      expect(pipe1.x).toBeCloseTo(initialX1 - GameConfig.PIPE_SPEED);
      expect(pipe2.x).toBeCloseTo(initialX2 - GameConfig.PIPE_SPEED);
    });
  });

  describe('updatePipes - removal', () => {
    it('removes a pipe when pipe.x + pipe.width < 0', () => {
      const pipe = createPipePair();
      // Position pipe so it will be fully off-screen after update
      pipe.x = -GameConfig.PIPE_WIDTH - 1;
      pipe.topPipe.x = pipe.x;
      pipe.bottomPipe.x = pipe.x;

      const pipes = [pipe];
      updatePipes(pipes, 1.0);

      expect(pipes.length).toBe(0);
    });

    it('does not remove a pipe still partially visible', () => {
      const pipe = createPipePair();
      // Position pipe so right edge is still at x=0 (not off-screen yet)
      pipe.x = 0;
      pipe.topPipe.x = pipe.x;
      pipe.bottomPipe.x = pipe.x;

      const pipes = [pipe];
      updatePipes(pipes, 1.0);

      expect(pipes.length).toBe(1);
    });

    it('removes only off-screen pipes, keeps visible ones', () => {
      const pipeOffScreen = createPipePair();
      pipeOffScreen.x = -GameConfig.PIPE_WIDTH - 1;
      pipeOffScreen.topPipe.x = pipeOffScreen.x;
      pipeOffScreen.bottomPipe.x = pipeOffScreen.x;

      const pipeOnScreen = createPipePair();
      pipeOnScreen.x = 200;
      pipeOnScreen.topPipe.x = 200;
      pipeOnScreen.bottomPipe.x = 200;

      const pipes = [pipeOffScreen, pipeOnScreen];
      updatePipes(pipes, 1.0);

      expect(pipes.length).toBe(1);
      expect(pipes[0].x).toBeCloseTo(200 - GameConfig.PIPE_SPEED);
    });

    it('returns the pipes array', () => {
      const pipes = [createPipePair()];
      const result = updatePipes(pipes, 1.0);
      expect(result).toBe(pipes);
    });

    it('handles empty pipes array gracefully', () => {
      const pipes = [];
      const result = updatePipes(pipes, 1.0);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });
});
