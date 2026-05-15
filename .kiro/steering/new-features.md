---
inclusion: manual
---

# Flappy Kiro — Adding New Features

## Checklist for New Game Modules

1. **Create the JS file** in `js/` following the IIFE pattern:
   ```javascript
   (function () {
     'use strict';
     // ... implementation ...
     window.myFunction = myFunction;
   })();
   ```

2. **Add the script tag** to `index.html` in the correct position (respect dependency order).

3. **Wire into the game loop** if the feature needs per-frame updates:
   - Add update call in `js/game.js` → `updatePlaying()` for gameplay logic.
   - Add render call in `js/renderer.js` → `renderFrame()` for visuals.

4. **Add constants** to `GameConfig` in `js/config.js` if needed.

5. **Write tests** in `tests/` — both unit tests and property-based tests where applicable.

6. **Default parameters** — If a function takes an entity parameter, support being called without it by defaulting to the global instance: `entity = entity || kiro;`

## Adding New Visual Elements

- Draw in `renderFrame()` in the correct layer order: background → pipes → kiro → ground → overlays → UI.
- Use `ctx.save()` / `ctx.restore()` for any transforms.
- Keep image smoothing disabled (already set globally).

## Adding New Audio

- Add audio files to `assets/`.
- Load via `new Audio('assets/filename.wav')` in `js/audio.js`.
- Wrap all playback in try/catch for graceful degradation.
- Expose a `window.playXxx()` function.

## Adding New Game States

- Add the state to `GameState` enum in `js/config.js`.
- Update the valid transitions map in `js/state.js`.
- Handle the new state in `js/loop.js` (update function) and `js/renderer.js` (render function).
- Update `js/input.js` if the state responds to player input.

## Script Load Order Rules

When adding a new script to `index.html`:
- It must come AFTER any scripts it depends on.
- It must come BEFORE any scripts that depend on it.
- The inline canvas setup script must come after all game logic scripts that need `GameConfig` but before scripts that need `window.gameCanvas` / `window.gameCtx`.

## Performance Guidelines

- Avoid creating objects in the game loop (reuse existing objects/arrays).
- Use `for` loops with `var i` (not `forEach` or `for...of`).
- Minimize canvas state changes (batch similar fillStyle operations).
- Remove off-screen entities promptly (pipes with `x + width < 0`).
