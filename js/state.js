/**
 * Flappy Kiro - State Machine
 * Manages game state transitions: Ready → Playing → Game_Over → Ready
 */

(function () {
  // Valid transitions map: from → [allowed destinations]
  var validTransitions = {};
  validTransitions[GameState.READY] = [GameState.PLAYING];
  validTransitions[GameState.PLAYING] = [GameState.GAME_OVER];
  validTransitions[GameState.GAME_OVER] = [GameState.READY];

  // Internal state
  var currentState = GameState.READY;
  var stateChangeTimestamp = Date.now();

  /**
   * Transition to a new game state.
   * Only allows valid transitions as defined in the state machine.
   * @param {string} newState - The target GameState value
   * @returns {boolean} true if transition was successful, false if invalid
   */
  function transitionTo(newState) {
    var allowed = validTransitions[currentState];
    if (!allowed) {
      return false;
    }

    for (var i = 0; i < allowed.length; i++) {
      if (allowed[i] === newState) {
        currentState = newState;
        stateChangeTimestamp = Date.now();
        return true;
      }
    }

    return false;
  }

  /**
   * Get the current game state.
   * @returns {string} The current GameState value
   */
  function getCurrentState() {
    return currentState;
  }

  /**
   * Get the time in milliseconds since the last state change.
   * Used to enforce the 500ms restart delay in Game_Over state.
   * @returns {number} Milliseconds since last state transition
   */
  function getTimeSinceStateChange() {
    return Date.now() - stateChangeTimestamp;
  }

  // Expose functions globally
  window.transitionTo = transitionTo;
  window.getCurrentState = getCurrentState;
  window.getTimeSinceStateChange = getTimeSinceStateChange;
})();
