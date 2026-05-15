/**
 * Flappy Kiro - Audio Manager
 * Handles sound playback with graceful degradation.
 * Loads jump.wav and game_over.wav via Audio elements,
 * generates score sound via WebAudio oscillator.
 * All play functions are no-ops if audio fails to initialize.
 */

(function() {
  var audioManager = null;

  function initAudio() {
    try {
      var jumpSound = new Audio('assets/jump.wav');
      var gameOverSound = new Audio('assets/game_over.wav');
      var audioCtx = null;

      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) { /* WebAudio unavailable */ }

      return {
        jumpSound: jumpSound,
        gameOverSound: gameOverSound,
        audioCtx: audioCtx
      };
    } catch(e) {
      return null;
    }
  }

  function playJump() {
    if (!audioManager || !audioManager.jumpSound) return;
    try {
      audioManager.jumpSound.currentTime = 0;
      audioManager.jumpSound.play();
    } catch(e) {}
  }

  function playScore() {
    if (!audioManager || !audioManager.audioCtx) return;
    try {
      var ctx = audioManager.audioCtx;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + GameConfig.SCORE_SOUND_DURATION / 1000);
    } catch(e) {}
  }

  function playGameOver() {
    if (!audioManager || !audioManager.gameOverSound) return;
    try {
      audioManager.gameOverSound.currentTime = 0;
      audioManager.gameOverSound.play();
    } catch(e) {}
  }

  audioManager = initAudio();

  window.playJump = playJump;
  window.playScore = playScore;
  window.playGameOver = playGameOver;
})();
