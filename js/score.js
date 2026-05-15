/**
 * Flappy Kiro - Score Manager
 * Tracks current score, persists high score to localStorage,
 * and detects when Kiro passes a pipe's trailing edge.
 */

(function () {
  'use strict';

  /**
   * Reads the high score from localStorage.
   * Defaults to 0 if localStorage is unavailable or value is invalid.
   * @returns {number} The stored high score or 0
   */
  function getHighScore() {
    try {
      return parseInt(localStorage.getItem('flappyKiroHighScore')) || 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Persists the high score to localStorage.
   * Silently fails if localStorage is unavailable.
   * @param {number} score - The high score to persist
   */
  function persistHighScore(score) {
    try {
      localStorage.setItem('flappyKiroHighScore', score);
    } catch (e) {
      /* silently fail */
    }
  }

  // Score state object
  var scoreState = {
    current: 0,
    high: getHighScore()
  };

  /**
   * Checks if Kiro has passed any unscored pipes and increments score.
   * A pipe is considered passed when kiro.x > pipe.x + pipe.width
   * (Kiro's fixed X position has passed the trailing edge of the pipe).
   *
   * @param {Object} kiro - The Kiro entity with an x property
   * @param {Array} pipes - Array of pipe objects with x, width, and scored properties
   */
  function checkScore(kiro, pipes) {
    for (var i = 0; i < pipes.length; i++) {
      if (!pipes[i].scored && kiro.x > pipes[i].x + pipes[i].width) {
        pipes[i].scored = true;
        scoreState.current++;
        if (scoreState.current > scoreState.high) {
          scoreState.high = scoreState.current;
          persistHighScore(scoreState.high);
        }
      }
    }
  }

  /**
   * Resets the current score to 0.
   * Called when the game restarts (Game_Over → Ready transition).
   */
  function resetScore() {
    scoreState.current = 0;
  }

  // Expose globally
  window.scoreState = scoreState;
  window.checkScore = checkScore;
  window.resetScore = resetScore;
  window.getHighScore = getHighScore;
})();
