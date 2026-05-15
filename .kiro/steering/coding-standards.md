---
inclusion: always
---

# Flappy Kiro — Coding Standards

## Architecture

- **Zero-build, file:// compatible** — No ES modules, no bundlers, no npm in the game itself. All game code uses classic `<script>` tags.
- **IIFE pattern** — Each JS file wraps its code in `(function () { 'use strict'; ... })();` to avoid polluting the global scope accidentally.
- **Global exposure** — Public functions and state are explicitly attached to `window` at the end of each IIFE (e.g., `window.updateKiroPhysics = updateKiroPhysics;`).
- **Script load order matters** — Scripts in index.html load sequentially. Dependencies must be loaded before dependents. Current order:
  1. config.js (constants, enums)
  2. state.js (state machine)
  3. kiro.js (player entity + physics)
  4. pipes.js (pipe generation, scrolling, removal)
  5. collision.js (AABB detection)
  6. score.js (scoring + localStorage)
  7. background.js (parallax + ground)
  8. audio.js (sound effects)
  9. Inline canvas setup script
  10. game.js (integration / wiring)
  11. renderer.js (all drawing)
  12. input.js (event listeners)
  13. loop.js (requestAnimationFrame loop)

## JavaScript Conventions

- Use `var` declarations (not `let`/`const`) for broadest file:// compatibility.
- Use `Object.freeze()` for immutable config objects and enums.
- Use JSDoc-style comments (`/** ... */`) for all public functions.
- Defensive checks: use `typeof window.fn === 'function'` before calling cross-module functions to tolerate missing scripts gracefully.
- Default parameters via `entity = entity || kiro;` pattern (no ES6 defaults).
- All constants live in `js/config.js` inside the `GameConfig` frozen object.
- Game state enum lives in `GameState` (also in config.js).

## Naming Conventions

- Files: lowercase with hyphens if multi-word (e.g., `background.js`).
- Global functions: camelCase (e.g., `updateKiroPhysics`, `checkCollisions`).
- Constants object: PascalCase (`GameConfig`, `GameState`).
- Constant keys: UPPER_SNAKE_CASE (e.g., `CANVAS_WIDTH`, `FLAP_VELOCITY`).
- Entity objects: camelCase (e.g., `kiro`, `scoreState`, `pipes`).

## Canvas & Rendering

- Internal resolution is always 400×600 logical pixels. Never change canvas width/height attributes.
- Image smoothing must be disabled (`ctx.imageSmoothingEnabled = false`) for pixel-art rendering.
- Render order in `renderFrame()`: background → pipes → kiro → ground → overlays → score UI.
- Use `ctx.save()` / `ctx.restore()` around any transform operations (translate, rotate).

## Game Loop

- The loop uses `requestAnimationFrame` with delta-time normalization.
- `normalizedDelta` = `deltaTime / GameConfig.FRAME_DURATION` (1.0 = one frame at 60fps).
- All physics and movement multiply by `normalizedDelta` for frame-rate independence.
- Delta is capped at 3 frames to prevent spiral-of-death after tab switches.
- Update order during PLAYING: physics → pipes → collision → score → background/ground.

## Error Handling

- Audio: all play calls wrapped in try/catch; failures are silent no-ops.
- localStorage: reads default to 0 on failure; writes silently fail.
- Sprite loading: fallback to colored rectangle if image fails to load.
