# Flappy Hermes

A browser-based Flappy Bird clone with a retro 8-bit pixel-art style. Guide Hermes — a flying character inspired by Project Hermes — through an endless series of pipes.

## How to Run

No build step or server required. Simply open `index.html` directly in your browser:

- Google Chrome
- Mozilla Firefox
- Apple Safari

You can open the file via `file://` protocol (double-click or drag into the browser).

## Controls

| Input | Action |
|-------|--------|
| Space | Flap |
| Up Arrow | Flap |
| Mouse Click | Flap |
| Screen Tap | Flap |

## Objective

Guide Hermes through gaps between pipes without colliding. You earn one point for each pipe pair you pass. Try to beat your high score!

## Project Structure

- `index.html` — Game entry point
- `js/` — Game logic (physics, rendering, input, state management)
- `assets/` — Audio files and sprites (`hermes_sprite.png`, `jump.wav`, `game_over.wav`)
- `tests/` — Property-based and unit tests (vitest + fast-check)

## Built With

- HTML5 Canvas (vanilla JavaScript, zero dependencies)
- Spec-driven development via Kiro
- Property-based testing for correctness guarantees
