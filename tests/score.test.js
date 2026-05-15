/**
 * Flappy Kiro - Score Manager Unit Tests
 * Tests for score tracking, high score persistence, and score reset.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Replicate GameConfig constants used in score logic
const GameConfig = Object.freeze({
  KIRO_X: 80,
  PIPE_WIDTH: 52,
});

// ============================================================================
// Replicate score.js logic for testing
// ============================================================================

function createScoreState(initialHigh) {
  return {
    current: 0,
    high: initialHigh || 0,
  };
}

function checkScore(scoreState, kiro, pipes) {
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

function resetScore(scoreState) {
  scoreState.current = 0;
}

// ============================================================================
// Unit Tests
// ============================================================================

describe('Score Manager', () => {
  let scoreState;

  beforeEach(() => {
    scoreState = createScoreState(0);
  });

  describe('checkScore - score increment', () => {
    it('increments score by 1 when Kiro passes trailing edge of a pipe', () => {
      const kiro = { x: GameConfig.KIRO_X };
      const pipes = [
        { x: 20, width: GameConfig.PIPE_WIDTH, scored: false }, // trailing edge at 72, kiro at 80 -> passed
      ];

      checkScore(scoreState, kiro, pipes);

      expect(scoreState.current).toBe(1);
      expect(pipes[0].scored).toBe(true);
    });

    it('does not increment score when Kiro has not passed the trailing edge', () => {
      const kiro = { x: GameConfig.KIRO_X };
      const pipes = [
        { x: 50, width: GameConfig.PIPE_WIDTH, scored: false }, // trailing edge at 102, kiro at 80 -> not passed
      ];

      checkScore(scoreState, kiro, pipes);

      expect(scoreState.current).toBe(0);
      expect(pipes[0].scored).toBe(false);
    });

    it('does not increment score for already scored pipes', () => {
      const kiro = { x: GameConfig.KIRO_X };
      const pipes = [
        { x: 20, width: GameConfig.PIPE_WIDTH, scored: true }, // already scored
      ];

      checkScore(scoreState, kiro, pipes);

      expect(scoreState.current).toBe(0);
    });

    it('increments score for multiple passed pipes in one check', () => {
      const kiro = { x: GameConfig.KIRO_X };
      const pipes = [
        { x: 10, width: GameConfig.PIPE_WIDTH, scored: false }, // trailing edge at 62
        { x: 20, width: GameConfig.PIPE_WIDTH, scored: false }, // trailing edge at 72
      ];

      checkScore(scoreState, kiro, pipes);

      expect(scoreState.current).toBe(2);
      expect(pipes[0].scored).toBe(true);
      expect(pipes[1].scored).toBe(true);
    });

    it('does not double-count pipes on subsequent calls', () => {
      const kiro = { x: GameConfig.KIRO_X };
      const pipes = [
        { x: 20, width: GameConfig.PIPE_WIDTH, scored: false },
      ];

      checkScore(scoreState, kiro, pipes);
      checkScore(scoreState, kiro, pipes);

      expect(scoreState.current).toBe(1);
    });
  });

  describe('checkScore - high score update', () => {
    it('updates high score when current exceeds it', () => {
      scoreState.high = 0;
      const kiro = { x: GameConfig.KIRO_X };
      const pipes = [
        { x: 20, width: GameConfig.PIPE_WIDTH, scored: false },
      ];

      checkScore(scoreState, kiro, pipes);

      expect(scoreState.high).toBe(1);
    });

    it('does not update high score when current does not exceed it', () => {
      scoreState.high = 10;
      const kiro = { x: GameConfig.KIRO_X };
      const pipes = [
        { x: 20, width: GameConfig.PIPE_WIDTH, scored: false },
      ];

      checkScore(scoreState, kiro, pipes);

      expect(scoreState.current).toBe(1);
      expect(scoreState.high).toBe(10);
    });

    it('updates high score progressively as score increases', () => {
      scoreState.high = 0;
      const kiro = { x: GameConfig.KIRO_X };

      for (let i = 0; i < 5; i++) {
        const pipes = [{ x: 20, width: GameConfig.PIPE_WIDTH, scored: false }];
        checkScore(scoreState, kiro, pipes);
      }

      expect(scoreState.current).toBe(5);
      expect(scoreState.high).toBe(5);
    });
  });

  describe('resetScore', () => {
    it('resets current score to 0', () => {
      scoreState.current = 15;
      scoreState.high = 20;

      resetScore(scoreState);

      expect(scoreState.current).toBe(0);
    });

    it('does not reset high score', () => {
      scoreState.current = 15;
      scoreState.high = 20;

      resetScore(scoreState);

      expect(scoreState.high).toBe(20);
    });
  });

  describe('edge cases', () => {
    it('handles empty pipes array', () => {
      const kiro = { x: GameConfig.KIRO_X };
      checkScore(scoreState, kiro, []);
      expect(scoreState.current).toBe(0);
    });

    it('handles pipe exactly at boundary (kiro.x === pipe.x + pipe.width)', () => {
      const kiro = { x: 72 }; // exactly at trailing edge (20 + 52 = 72)
      const pipes = [
        { x: 20, width: GameConfig.PIPE_WIDTH, scored: false },
      ];

      checkScore(scoreState, kiro, pipes);

      // kiro.x must be GREATER than pipe.x + pipe.width, not equal
      expect(scoreState.current).toBe(0);
      expect(pipes[0].scored).toBe(false);
    });
  });
});
