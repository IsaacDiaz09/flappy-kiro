/**
 * Flappy Kiro - Renderer
 * Loads the Kiro sprite and renders the game frame.
 */

(function () {
  'use strict';

  // Load the Kiro sprite image
  var kiroSprite = new Image();
  var kiroSpriteLoaded = false;

  kiroSprite.onload = function () {
    kiroSpriteLoaded = true;
    // Derive width from aspect ratio, preserving height = KIRO_HEIGHT (36px)
    var aspectRatio = kiroSprite.naturalWidth / kiroSprite.naturalHeight;
    var derivedWidth = Math.round(GameConfig.KIRO_HEIGHT * aspectRatio);
    // Set width on the kiro entity for collision detection
    window.kiro.width = derivedWidth;
  };

  kiroSprite.onerror = function () {
    // Sprite failed to load; fallback rectangle will be used
    kiroSpriteLoaded = false;
    // Set a default width for collision detection
    if (window.kiro.width === 0) {
      window.kiro.width = GameConfig.KIRO_HEIGHT;
    }
  };

  kiroSprite.src = 'assets/ghosty.png';

  /**
   * Render Kiro with rotation transform.
   * Falls back to a colored rectangle if the sprite hasn't loaded.
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
   * @param {Object} entity - The KiroEntity to render
   */
  function renderKiro(ctx, entity) {
    var w = entity.width || GameConfig.KIRO_HEIGHT;
    var h = entity.height;
    var centerX = entity.x + w / 2;
    var centerY = entity.y + h / 2;

    ctx.save();

    // Translate to sprite center for rotation
    ctx.translate(centerX, centerY);

    // Rotate (convert degrees to radians)
    ctx.rotate(entity.rotation * Math.PI / 180);

    if (kiroSpriteLoaded) {
      // Draw sprite centered at origin (after translate)
      ctx.drawImage(kiroSprite, -w / 2, -h / 2, w, h);
    } else {
      // Fallback: draw a colored rectangle
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    ctx.restore();
  }

  /**
   * Render pipes procedurally with cap elements in a consistent green color palette.
   * Draw order: border/outline first, then body fill, then cap.
   * Top pipe has cap at the bottom (near the gap).
   * Bottom pipe has cap at the top (near the gap).
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
   * @param {Array} pipes - Array of PipePair objects
   */
  function renderPipes(ctx, pipes) {
    var PIPE_COLOR = '#73bf2e';
    var CAP_COLOR = '#558b2f';
    var BORDER_COLOR = '#2e7d32';
    var CAP_HEIGHT = 24;
    var CAP_OVERHANG = 6; // extra width on each side
    var BORDER_WIDTH = 2;

    for (var i = 0; i < pipes.length; i++) {
      var pipe = pipes[i];

      // --- Top pipe ---
      // Border/outline (drawn slightly larger than body)
      ctx.fillStyle = BORDER_COLOR;
      ctx.fillRect(
        pipe.topPipe.x - BORDER_WIDTH,
        pipe.topPipe.y,
        pipe.topPipe.width + BORDER_WIDTH * 2,
        pipe.topPipe.height + BORDER_WIDTH
      );

      // Body fill
      ctx.fillStyle = PIPE_COLOR;
      ctx.fillRect(pipe.topPipe.x, pipe.topPipe.y, pipe.topPipe.width, pipe.topPipe.height);

      // Cap at bottom of top pipe (near the gap)
      ctx.fillStyle = BORDER_COLOR;
      ctx.fillRect(
        pipe.topPipe.x - CAP_OVERHANG - BORDER_WIDTH,
        pipe.topPipe.height - CAP_HEIGHT - BORDER_WIDTH,
        pipe.topPipe.width + (CAP_OVERHANG + BORDER_WIDTH) * 2,
        CAP_HEIGHT + BORDER_WIDTH * 2
      );
      ctx.fillStyle = CAP_COLOR;
      ctx.fillRect(
        pipe.topPipe.x - CAP_OVERHANG,
        pipe.topPipe.height - CAP_HEIGHT,
        pipe.topPipe.width + CAP_OVERHANG * 2,
        CAP_HEIGHT
      );

      // --- Bottom pipe ---
      // Border/outline (drawn slightly larger than body)
      ctx.fillStyle = BORDER_COLOR;
      ctx.fillRect(
        pipe.bottomPipe.x - BORDER_WIDTH,
        pipe.bottomPipe.y - BORDER_WIDTH,
        pipe.bottomPipe.width + BORDER_WIDTH * 2,
        pipe.bottomPipe.height + BORDER_WIDTH
      );

      // Body fill
      ctx.fillStyle = PIPE_COLOR;
      ctx.fillRect(pipe.bottomPipe.x, pipe.bottomPipe.y, pipe.bottomPipe.width, pipe.bottomPipe.height);

      // Cap at top of bottom pipe (near the gap)
      ctx.fillStyle = BORDER_COLOR;
      ctx.fillRect(
        pipe.bottomPipe.x - CAP_OVERHANG - BORDER_WIDTH,
        pipe.bottomPipe.y - BORDER_WIDTH,
        pipe.bottomPipe.width + (CAP_OVERHANG + BORDER_WIDTH) * 2,
        CAP_HEIGHT + BORDER_WIDTH * 2
      );
      ctx.fillStyle = CAP_COLOR;
      ctx.fillRect(
        pipe.bottomPipe.x - CAP_OVERHANG,
        pipe.bottomPipe.y,
        pipe.bottomPipe.width + CAP_OVERHANG * 2,
        CAP_HEIGHT
      );
    }
  }

  /**
   * Render score display UI.
   * - During Playing state: current score at top-center, high score at top-right
   * - During Game_Over state: final score and high score centered on screen
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
   */
  function renderScore(ctx) {
    var state = window.getCurrentState ? window.getCurrentState() : 'ready';

    if (state === GameState.PLAYING) {
      // Current score at top-center with stroke for readability
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(window.scoreState.current, GameConfig.CANVAS_WIDTH / 2, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(window.scoreState.current, GameConfig.CANVAS_WIDTH / 2, 16);

      // High score at top-right with stroke for readability
      ctx.font = '16px monospace';
      ctx.textAlign = 'right';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText('HI: ' + window.scoreState.high, GameConfig.CANVAS_WIDTH - 10, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HI: ' + window.scoreState.high, GameConfig.CANVAS_WIDTH - 10, 18);
    } else if (state === GameState.GAME_OVER) {
      // Final score centered on screen
      var centerX = GameConfig.CANVAS_WIDTH / 2;
      var centerY = GameConfig.CANVAS_HEIGHT / 2;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // "GAME OVER" title
      ctx.font = 'bold 28px monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('GAME OVER', centerX, centerY - 50);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('GAME OVER', centerX, centerY - 50);

      // Final score
      ctx.font = 'bold 22px monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText('Score: ' + window.scoreState.current, centerX, centerY);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Score: ' + window.scoreState.current, centerX, centerY);

      // High score
      ctx.font = '18px monospace';
      ctx.strokeText('Best: ' + window.scoreState.high, centerX, centerY + 35);
      ctx.fillStyle = '#ffdd57';
      ctx.fillText('Best: ' + window.scoreState.high, centerX, centerY + 35);

      // Restart prompt
      ctx.font = '14px monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText('Tap to Restart', centerX, centerY + 80);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Tap to Restart', centerX, centerY + 80);
    }
  }

  /**
   * Render screen overlays based on game state.
   * - Ready state: "Flappy Kiro" title and "Tap to Start" prompt
   * - Game Over state: semi-transparent dark background overlay
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
   */
  function renderOverlay(ctx) {
    var state = window.getCurrentState ? window.getCurrentState() : 'ready';

    if (state === GameState.READY) {
      // Title text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 36px monospace';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('Flappy Kiro', GameConfig.CANVAS_WIDTH / 2, 120);
      ctx.fillStyle = '#fff';
      ctx.fillText('Flappy Kiro', GameConfig.CANVAS_WIDTH / 2, 120);

      // "Tap to Start" prompt
      ctx.font = '18px monospace';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText('Tap to Start', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 + 60);
      ctx.fillStyle = '#fff';
      ctx.fillText('Tap to Start', GameConfig.CANVAS_WIDTH / 2, GameConfig.CANVAS_HEIGHT / 2 + 60);
    } else if (state === GameState.GAME_OVER) {
      // Semi-transparent dark overlay behind score text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
    }
  }

  /**
   * Render a full game frame: clear canvas and draw all game elements.
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
   * @param {HTMLCanvasElement} canvas - The canvas element
   */
  function renderFrame(ctx, canvas) {
    // Draw parallax background first (behind everything)
    if (typeof window.renderBackground === 'function') {
      window.renderBackground(ctx);
    }

    // Draw pipes before Kiro so Kiro appears on top
    renderPipes(ctx, window.pipes);

    // Draw Kiro
    renderKiro(ctx, window.kiro);

    // Draw ground in front of pipes and Kiro
    if (typeof window.renderGround === 'function') {
      window.renderGround(ctx);
    }

    // Draw overlays (Ready title/prompt, Game Over dark background)
    renderOverlay(ctx);

    // Draw score UI on top of everything
    renderScore(ctx);
  }

  // Expose globally
  window.renderKiro = renderKiro;
  window.renderPipes = renderPipes;
  window.renderScore = renderScore;
  window.renderOverlay = renderOverlay;
  window.renderFrame = renderFrame;
})();
