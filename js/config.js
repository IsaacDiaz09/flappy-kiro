/**
 * Flappy Kiro - Game Configuration
 * All game constants and configuration values.
 */

// Game State enum
var GameState = Object.freeze({
  READY: 'ready',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
});

// Game configuration constants
var GameConfig = Object.freeze({
  // Canvas dimensions
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  GROUND_HEIGHT: 60,

  // Physics
  GRAVITY: 0.5,
  FLAP_VELOCITY: -7.5,
  MAX_FALL_SPEED: 12,

  // Pipes
  PIPE_SPEED: 3,
  PIPE_SPAWN_INTERVAL: 1500,
  PIPE_WIDTH: 52,
  GAP_HEIGHT: 120,
  MIN_GAP_MARGIN: 0.10,

  // Kiro
  KIRO_X: 80,
  KIRO_HEIGHT: 36,

  // Rotation (degrees)
  ROTATION_UP: -20,
  ROTATION_DOWN_MAX: 90,

  // Timing
  RESTART_DELAY: 500,
  SCORE_SOUND_DURATION: 150,
  TARGET_FPS: 60,
  FRAME_DURATION: 1000 / 60
});
