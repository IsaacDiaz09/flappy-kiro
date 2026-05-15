/**
 * Flappy Kiro - Input Handler
 * Captures and normalizes player input across keyboard, mouse, and touch.
 * Routes input actions based on current game state.
 */

(function () {
  /**
   * Handle a validated input action by routing based on current game state.
   * - READY: transition to PLAYING and apply flap
   * - PLAYING: apply flap
   * - GAME_OVER: reset game and transition to READY (after 500ms delay)
   */
  function handleInput() {
    var state = getCurrentState();

    if (state === GameState.READY) {
      transitionTo(GameState.PLAYING);
      if (typeof window.applyFlap === 'function') {
        window.applyFlap();
      }
      if (typeof window.playJump === 'function') {
        window.playJump();
      }
    } else if (state === GameState.PLAYING) {
      if (typeof window.applyFlap === 'function') {
        window.applyFlap();
      }
      if (typeof window.playJump === 'function') {
        window.playJump();
      }
    } else if (state === GameState.GAME_OVER) {
      // Enforce 500ms delay before accepting input in Game_Over state
      if (getTimeSinceStateChange() >= GameConfig.RESTART_DELAY) {
        if (typeof window.resetGame === 'function') {
          window.resetGame();
        }
        transitionTo(GameState.READY);
      }
    }
  }

  /**
   * Keyboard event handler.
   * Only responds to Space and ArrowUp keys.
   * Ignores key repeat events (event.repeat === true).
   */
  function onKeyDown(e) {
    if (e.repeat) {
      return;
    }

    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleInput();
    }
  }

  /**
   * Mouse event handler.
   */
  function onMouseDown(e) {
    e.preventDefault();
    handleInput();
  }

  /**
   * Touch event handler.
   */
  function onTouchStart(e) {
    e.preventDefault();
    handleInput();
  }

  // Register event listeners
  document.addEventListener('keydown', onKeyDown);
  window.gameCanvas.addEventListener('mousedown', onMouseDown);
  window.gameCanvas.addEventListener('touchstart', onTouchStart, { passive: false });

  // Expose handleInput for testing purposes
  window.handleInput = handleInput;
})();
