/**
 * Flappy Kiro - Pipe Manager
 * Handles pipe generation with randomized gaps, spawning, and lifecycle.
 */

(function () {
  // Active pipes array
  var pipes = [];

  // Time accumulator for pipe spawning
  var timeSinceLastPipe = 0;

  /**
   * Creates a new PipePair with a randomized gap center.
   * Gap center is constrained so the entire gap stays at least
   * MIN_GAP_MARGIN * CANVAS_HEIGHT from both the top edge and the ground boundary.
   *
   * @returns {object} A PipePair object
   */
  function createPipePair() {
    var gapHeight = GameConfig.GAP_HEIGHT;
    var halfGap = gapHeight / 2;

    // Minimum Y: gap must be at least 10% canvas height from top
    var minGapCenterY = GameConfig.MIN_GAP_MARGIN * GameConfig.CANVAS_HEIGHT + halfGap;

    // Maximum Y: gap must be at least 10% canvas height from ground boundary
    var groundY = GameConfig.CANVAS_HEIGHT - GameConfig.GROUND_HEIGHT;
    var maxGapCenterY = groundY - GameConfig.MIN_GAP_MARGIN * GameConfig.CANVAS_HEIGHT - halfGap;

    // Randomize gap center within valid range
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

  /**
   * Attempts to spawn a new pipe if enough time has elapsed.
   *
   * @param {Array} pipesArray - The current array of active pipes
   * @param {number} deltaMs - Time elapsed since last frame in milliseconds
   * @returns {Array} The pipes array (possibly with a new pipe appended)
   */
  function trySpawnPipe(pipesArray, deltaMs) {
    timeSinceLastPipe += deltaMs;

    if (timeSinceLastPipe >= GameConfig.PIPE_SPAWN_INTERVAL) {
      var newPipe = createPipePair();
      pipesArray.push(newPipe);
      timeSinceLastPipe = 0;
    }

    return pipesArray;
  }

  /**
   * Updates all pipes by scrolling them left and removing off-screen pipes.
   *
   * @param {Array} pipesArray - The current array of active pipes
   * @param {number} normalizedDelta - Delta time normalized to frame duration (deltaTime / FRAME_DURATION)
   * @returns {Array} The pipes array with positions updated and off-screen pipes removed
   */
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

  /**
   * Resets the pipe system (clears all pipes and resets spawn timer).
   */
  function resetPipes() {
    pipes.length = 0;
    timeSinceLastPipe = 0;
  }

  // Expose globally
  window.pipes = pipes;
  window.trySpawnPipe = trySpawnPipe;
  window.createPipePair = createPipePair;
  window.updatePipes = updatePipes;
  window.resetPipes = resetPipes;
})();
