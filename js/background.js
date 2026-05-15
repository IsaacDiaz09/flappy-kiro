/**
 * Flappy Kiro - Parallax Background & Ground
 * Renders a scrolling parallax background with multiple layers and the ground element.
 */

(function () {
  'use strict';

  var CANVAS_WIDTH = GameConfig.CANVAS_WIDTH;
  var CANVAS_HEIGHT = GameConfig.CANVAS_HEIGHT;
  var GROUND_HEIGHT = GameConfig.GROUND_HEIGHT;
  var PIPE_SPEED = GameConfig.PIPE_SPEED;

  // Sky area height (above the ground)
  var SKY_HEIGHT = CANVAS_HEIGHT - GROUND_HEIGHT;

  // ============================================================================
  // Parallax Background
  // ============================================================================

  /**
   * Generate procedural elements for a parallax layer.
   * Creates a set of rectangles (mountains/hills) that tile across the canvas width * 2
   * so we can seamlessly wrap them.
   * @param {Object} layerConfig - Configuration for the layer
   * @returns {Array} Array of element objects with x, y, width, height
   */
  function generateLayerElements(layerConfig) {
    var elements = [];
    var totalWidth = CANVAS_WIDTH * 2; // Double width for seamless wrapping
    var x = 0;

    while (x < totalWidth) {
      var width = layerConfig.minWidth + Math.floor(Math.random() * (layerConfig.maxWidth - layerConfig.minWidth));
      var height = layerConfig.minHeight + Math.floor(Math.random() * (layerConfig.maxHeight - layerConfig.minHeight));
      var y = SKY_HEIGHT - height; // Anchor to ground level

      elements.push({ x: x, y: y, width: width, height: height });
      x += width + layerConfig.gap + Math.floor(Math.random() * layerConfig.gapVariance);
    }

    return elements;
  }

  // Far layer: distant mountains/clouds - scrolls at 25% of pipe speed
  var farLayerConfig = {
    minWidth: 60,
    maxWidth: 120,
    minHeight: 80,
    maxHeight: 160,
    gap: 10,
    gapVariance: 30
  };

  // Near layer: closer hills/buildings - scrolls at 50% of pipe speed
  var nearLayerConfig = {
    minWidth: 40,
    maxWidth: 80,
    minHeight: 50,
    maxHeight: 110,
    gap: 5,
    gapVariance: 20
  };

  // Background layers array (drawn back-to-front)
  var backgroundLayers = [
    {
      color: '#2d5a27',
      speedMultiplier: 0.25,
      elements: generateLayerElements(farLayerConfig),
      offsetX: 0
    },
    {
      color: '#3d7a37',
      speedMultiplier: 0.50,
      elements: generateLayerElements(nearLayerConfig),
      offsetX: 0
    }
  ];

  /**
   * Update background layer offsets based on scroll speed.
   * Each layer scrolls at its own speed (fraction of pipe speed).
   * @param {number} normalizedDelta - Delta-time normalized (1.0 = one frame at 60fps)
   */
  function updateBackground(normalizedDelta) {
    for (var i = 0; i < backgroundLayers.length; i++) {
      var layer = backgroundLayers[i];
      layer.offsetX -= PIPE_SPEED * layer.speedMultiplier * normalizedDelta;

      // Wrap offset when it scrolls past one full canvas width
      if (layer.offsetX <= -CANVAS_WIDTH) {
        layer.offsetX += CANVAS_WIDTH;
      }
    }
  }

  /**
   * Render the parallax background layers.
   * Draws a sky gradient first, then each layer's elements with wrapping.
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
   */
  function renderBackground(ctx) {
    // Sky gradient background
    var gradient = ctx.createLinearGradient(0, 0, 0, SKY_HEIGHT);
    gradient.addColorStop(0, '#87ceeb');   // Light sky blue at top
    gradient.addColorStop(1, '#e0f7fa');   // Lighter near horizon
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, SKY_HEIGHT);

    // Ground area fill (solid brown)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, SKY_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Draw each parallax layer (back-to-front order)
    for (var i = 0; i < backgroundLayers.length; i++) {
      var layer = backgroundLayers[i];
      ctx.fillStyle = layer.color;

      for (var j = 0; j < layer.elements.length; j++) {
        var el = layer.elements[j];
        var drawX = el.x + layer.offsetX;

        // Wrap: draw element at its position and also shifted for seamless loop
        // Only draw if visible on screen
        if (drawX + el.width > 0 && drawX < CANVAS_WIDTH) {
          ctx.fillRect(drawX, el.y, el.width, el.height);
        }

        // Also draw the wrapped copy (shifted by CANVAS_WIDTH)
        var wrappedX = drawX + CANVAS_WIDTH;
        if (wrappedX + el.width > 0 && wrappedX < CANVAS_WIDTH) {
          ctx.fillRect(wrappedX, el.y, el.width, el.height);
        }
      }
    }
  }

  // ============================================================================
  // Ground
  // ============================================================================

  var groundOffset = 0;

  /**
   * Update ground scroll offset.
   * Ground scrolls at the same speed as pipes.
   * @param {number} normalizedDelta - Delta-time normalized (1.0 = one frame at 60fps)
   */
  function updateGround(normalizedDelta) {
    groundOffset -= PIPE_SPEED * normalizedDelta;
    // Wrap offset to prevent floating point overflow
    if (groundOffset <= -CANVAS_WIDTH) {
      groundOffset += CANVAS_WIDTH;
    }
  }

  /**
   * Render the ground element at the bottom of the canvas.
   * Ground occupies the bottom 60px (GROUND_HEIGHT) with a scrolling stripe pattern.
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
   */
  function renderGround(ctx) {
    var groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

    // Ground base color
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, groundY, CANVAS_WIDTH, GROUND_HEIGHT);

    // Ground top edge (darker green line)
    ctx.fillStyle = '#5b8c2a';
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 4);

    // Scrolling stripe pattern
    ctx.fillStyle = '#c4b87a';
    var stripeWidth = 40;
    for (var x = groundOffset % stripeWidth - stripeWidth; x < CANVAS_WIDTH; x += stripeWidth * 2) {
      ctx.fillRect(x, groundY + 10, stripeWidth, GROUND_HEIGHT - 10);
    }
  }

  // ============================================================================
  // Expose globally
  // ============================================================================

  window.backgroundLayers = backgroundLayers;
  window.updateBackground = updateBackground;
  window.renderBackground = renderBackground;
  window.updateGround = updateGround;
  window.renderGround = renderGround;

  // Expose groundOffset as a getter so external code sees the current value
  Object.defineProperty(window, 'groundOffset', {
    get: function () { return groundOffset; },
    set: function (val) { groundOffset = val; },
    configurable: true
  });
})();
