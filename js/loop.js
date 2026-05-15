/**
 * Flappy Kiro - Game Loop
 * requestAnimationFrame-based loop with delta-time normalization.
 */

(function () {
  'use strict';

  var lastTimestamp = 0;
  var animationFrameId = null;

  // Maximum delta-time cap: 3 frames worth to prevent spiral-of-death on tab switches
  var MAX_DELTA = GameConfig.FRAME_DURATION * 3;

  /**
   * Update game state based on the current game state.
   * @param {number} normalizedDelta - Delta-time normalized against FRAME_DURATION (1.0 = one frame at 60fps)
   */
  function update(normalizedDelta) {
    var state = (typeof window.getCurrentState === 'function')
      ? window.getCurrentState()
      : GameState.READY;

    if (state === GameState.PLAYING) {
      // Update parallax background scrolling
      if (typeof window.updateBackground === 'function') {
        window.updateBackground(normalizedDelta);
      }
      // Physics, pipes, collision, and scoring updates will be wired here
      if (typeof window.updatePlaying === 'function') {
        window.updatePlaying(normalizedDelta);
      }
      // Update ground scroll
      if (typeof window.updateGround === 'function') {
        window.updateGround(normalizedDelta);
      }
    }
  }

  /**
   * Render the current frame based on game state.
   */
  function render() {
    var ctx = window.gameCtx;
    var canvas = window.gameCanvas;

    if (!ctx || !canvas) {
      return;
    }

    // Clear the canvas each frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Delegate to the active renderer if available
    if (typeof window.renderFrame === 'function') {
      window.renderFrame(ctx, canvas);
    }
  }

  /**
   * Main game loop driven by requestAnimationFrame.
   * @param {DOMHighResTimeStamp} timestamp - Current frame timestamp in milliseconds
   */
  function gameLoop(timestamp) {
    // On first frame, initialize lastTimestamp to avoid a large initial delta
    if (lastTimestamp === 0) {
      lastTimestamp = timestamp;
    }

    // Calculate raw delta-time in milliseconds
    var deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Cap delta-time to prevent spiral-of-death (e.g., after tab switch)
    if (deltaTime > MAX_DELTA) {
      deltaTime = MAX_DELTA;
    }

    // Normalize delta-time: 1.0 means one frame at target 60fps
    var normalizedDelta = deltaTime / GameConfig.FRAME_DURATION;

    // Update game logic
    update(normalizedDelta);

    // Render the frame
    render();

    // Request next frame
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  /**
   * Start the game loop.
   */
  function startGameLoop() {
    if (animationFrameId !== null) {
      return; // Already running
    }
    lastTimestamp = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  /**
   * Stop the game loop.
   */
  function stopGameLoop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // Expose loop control functions globally
  window.startGameLoop = startGameLoop;
  window.stopGameLoop = stopGameLoop;
  window.gameLoop = gameLoop;

  // Start the loop
  startGameLoop();
})();
