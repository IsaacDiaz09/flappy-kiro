/**
 * Flappy Kiro - Game Integration
 * Wires all components together: physics, pipes, collision, scoring, and audio.
 * Provides updatePlaying() called each frame during PLAYING state,
 * and resetGame() called when restarting from Game_Over.
 */

(function () {
  'use strict';

  /**
   * Main update function called each frame during PLAYING state.
   * Execution order: physics → pipes → collision → score
   * Background and ground updates are handled separately by the game loop.
   *
   * @param {number} normalizedDelta - Delta-time normalized against FRAME_DURATION (1.0 = one frame at 60fps)
   */
  function updatePlaying(normalizedDelta) {
    // 1. Physics - apply gravity and update Kiro's position
    if (typeof window.updateKiroPhysics === 'function') {
      window.updateKiroPhysics(window.kiro, normalizedDelta);
    }

    // 2. Pipes - spawn new pipes and scroll existing ones
    var deltaMs = normalizedDelta * GameConfig.FRAME_DURATION;
    if (typeof window.trySpawnPipe === 'function') {
      window.trySpawnPipe(window.pipes, deltaMs);
    }
    if (typeof window.updatePipes === 'function') {
      window.updatePipes(window.pipes, normalizedDelta);
    }

    // 3. Collision detection - check Kiro against pipes and boundaries
    if (typeof window.checkCollisions === 'function') {
      var result = window.checkCollisions(window.kiro, window.pipes, window.GROUND_Y);
      if (result.collided) {
        if (typeof window.transitionTo === 'function') {
          window.transitionTo(GameState.GAME_OVER);
        }
        if (typeof window.playGameOver === 'function') {
          window.playGameOver();
        }
        return; // Stop processing this frame
      }
    }

    // 4. Score check - detect when Kiro passes a pipe
    var prevScore = window.scoreState ? window.scoreState.current : 0;
    if (typeof window.checkScore === 'function') {
      window.checkScore(window.kiro, window.pipes);
    }
    if (window.scoreState && window.scoreState.current > prevScore) {
      if (typeof window.playScore === 'function') {
        window.playScore();
      }
    }
  }

  /**
   * Reset all game entities to their initial state.
   * Called when transitioning from Game_Over → Ready.
   */
  function resetGame() {
    if (typeof window.resetKiro === 'function') {
      window.resetKiro();
    }
    if (typeof window.resetPipes === 'function') {
      window.resetPipes();
    }
    if (typeof window.resetScore === 'function') {
      window.resetScore();
    }
  }

  // Expose globally
  window.updatePlaying = updatePlaying;
  window.resetGame = resetGame;
})();
