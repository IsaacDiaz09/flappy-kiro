# Implementation Plan: Flappy Kiro

## Overview

Implement a zero-build, browser-based Flappy Bird clone using HTML5 Canvas and vanilla JavaScript. The game runs from the file:// protocol, uses existing assets (ghosty.png, jump.wav, game_over.wav), and procedurally generates remaining visuals and audio. The implementation follows a modular approach with logical components for physics, rendering, pipes, audio, scoring, and state management, all wired together through a requestAnimationFrame game loop.

## Tasks

- [x] 1. Set up project structure and core game scaffold
  - [x] 1.1 Create index.html with canvas element, inline CSS for centering/scaling, and script tags
    - Create the HTML file with a 400×600 canvas element
    - Add inline CSS to center the canvas in the viewport, handle letterboxing, and scale responsively
    - Add a classic `<script>` tag (not type="module") for the game code
    - Implement viewport resize handling that recalculates scale within 100ms
    - Disable image smoothing on the canvas context for pixel-art rendering
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 9.2, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 1.2 Define game constants and configuration object
    - Create a GameConfig object with all constants from the design (CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, FLAP_VELOCITY, PIPE_SPEED, etc.)
    - Define the GameState enum (READY, PLAYING, GAME_OVER)
    - _Requirements: 2.1, 4.1, 4.2, 5.1, 5.4_

  - [x] 1.3 Implement the game loop with delta-time calculation
    - Create the requestAnimationFrame-based game loop
    - Calculate deltaTime from timestamps
    - Implement frame-rate-independent updates using delta-time normalization
    - Call update and render functions based on current game state
    - _Requirements: 2.2_

- [x] 2. Implement state machine and input handling
  - [x] 2.1 Implement the state machine with transitions
    - Create transitionTo(), getCurrentState(), and getTimeSinceStateChange() functions
    - Implement Ready → Playing, Playing → Game_Over, Game_Over → Ready transitions
    - Track timestamp of each state change for the 500ms restart delay
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 3.5_

  - [x] 2.2 Implement input handler for keyboard, mouse, and touch
    - Listen for keydown (Space, ArrowUp), mousedown, and touchstart events
    - Call preventDefault() on all captured events
    - Route input actions based on current game state (flap in Playing, start in Ready, restart in Game_Over)
    - Ignore key repeat events (only process first keydown)
    - Enforce 500ms delay before accepting input in Game_Over state
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 2.3 Write property test for Game_Over input delay
    - **Property 10: Game_Over Input Delay**
    - For any elapsed time since Game_Over transition, verify input is ignored if elapsed < 500ms and accepted if elapsed >= 500ms
    - **Validates: Requirements 3.5**

- [x] 3. Implement Kiro physics and rendering
  - [x] 3.1 Implement Kiro entity with physics (gravity, flap, velocity)
    - Create KiroEntity data structure with position, velocity, rotation, and sprite reference
    - Implement updateKiroPhysics() applying gravity scaled by deltaTime
    - Implement applyFlap() setting velocity to FLAP_VELOCITY regardless of current velocity
    - Cap terminal velocity at MAX_FALL_SPEED
    - Position Kiro at fixed X in the left third of the canvas
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.2 Write property test for gravity and flap velocity
    - **Property 1: Gravity and Flap Velocity**
    - For any initial velocity and positive deltaTime, verify gravity increases downward velocity by GRAVITY * (deltaTime / FRAME_DURATION), and flap sets velocity to FLAP_VELOCITY
    - **Validates: Requirements 4.1, 4.2**

  - [x] 3.3 Write property test for Kiro horizontal position invariant
    - **Property 2: Kiro Horizontal Position Invariant**
    - For any sequence of updates, verify Kiro's X position remains constant and within left third of canvas
    - **Validates: Requirements 4.3**

  - [x] 3.4 Implement Kiro rotation logic
    - Set rotation to upward angle (−20°) on flap
    - Progressively rotate downward proportional to downward velocity, capped at 90°
    - Apply rotation transform when rendering the sprite
    - _Requirements: 4.4, 4.5_

  - [x] 3.5 Write property test for rotation bounds
    - **Property 3: Rotation Bounds**
    - For any Kiro state, verify rotation is bounded between flap angle and 90° maximum
    - **Validates: Requirements 4.4, 4.5**

  - [x] 3.6 Render Kiro sprite from ghosty.png with rotation
    - Load ghosty.png and render at 36px height preserving aspect ratio
    - Apply rotation transform around sprite center
    - Render with image smoothing disabled
    - _Requirements: 9.1, 9.2_

- [x] 4. Checkpoint - Ensure core character mechanics work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement pipe generation, scrolling, and collision
  - [x] 5.1 Implement pipe generation with randomized gaps
    - Generate new PipePair every ~1.5 seconds (±0.2s tolerance)
    - Randomize gap center ensuring entire gap is at least 10% canvas height from top and ground
    - Set gap height to at least 3× Kiro sprite height
    - Spawn pipes just beyond the right edge of the canvas
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 5.2 Write property test for pipe generation constraints
    - **Property 4: Pipe Generation Constraints**
    - For any generated pipe, verify gap center keeps entire gap at least 10% from edges and gap height >= 3× Kiro height
    - **Validates: Requirements 5.2, 5.3**

  - [x] 5.3 Implement pipe scrolling and removal
    - Scroll all pipes left at PIPE_SPEED scaled by deltaTime
    - Remove pipes that have scrolled completely off the left edge
    - _Requirements: 5.4, 5.6_

  - [x] 5.4 Write property test for pipe lifecycle bounds
    - **Property 5: Pipe Lifecycle Bounds**
    - For any pipe, verify spawn x >= CANVAS_WIDTH, scroll rate matches PIPE_SPEED * deltaTime/FRAME_DURATION, and no pipe with x + width < 0 remains in active array
    - **Validates: Requirements 5.4, 5.5, 5.6**

  - [x] 5.5 Implement AABB collision detection
    - Implement aabbIntersect() for rectangle overlap detection
    - Check Kiro bounding box against all active pipe pairs each frame
    - Check ground boundary collision (kiro.y + kiro.height >= groundY)
    - Check ceiling boundary collision (kiro.y <= 0)
    - Transition to Game_Over on any collision
    - Evaluate collisions before rendering each frame
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 5.6 Write property test for AABB collision detection
    - **Property 6: AABB Collision Detection Correctness**
    - For any two rectangles, verify collision returns true iff the four AABB overlap conditions are all met
    - **Validates: Requirements 6.1**

  - [x] 5.7 Write property test for boundary collision detection
    - **Property 7: Boundary Collision Detection**
    - For any Kiro position, verify ground collision iff kiro.y + kiro.height >= groundY, ceiling collision iff kiro.y <= 0
    - **Validates: Requirements 6.2, 6.3**

  - [x] 5.8 Render pipes procedurally with cap elements
    - Draw pipes as flat-colored rectangles with cap elements in a consistent color palette
    - _Requirements: 9.3_

- [x] 6. Implement scoring system
  - [x] 6.1 Implement score tracking and high score persistence
    - Increment score by 1 when Kiro passes trailing edge of a pipe, mark pipe as scored
    - Read high score from localStorage (default to 0 if unavailable)
    - Update and persist high score when current score exceeds it
    - Reset score to 0 on game restart
    - _Requirements: 7.1, 7.4, 7.5, 7.7_

  - [x] 6.2 Write property test for score increment and high score
    - **Property 8: Score Increment and High Score Update**
    - For any Kiro position and pipe, verify score increments exactly once when kiro.x > pipe.x + pipe.width and pipe.scored is false, and high score updates when current exceeds stored
    - **Validates: Requirements 7.1, 7.4**

  - [x] 6.3 Render score display UI
    - Show current score at top-center during Playing state
    - Show high score at top-right during Playing state
    - Show final score and high score on Game Over screen
    - _Requirements: 7.2, 7.3, 7.6_

- [x] 7. Checkpoint - Ensure gameplay loop is complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement visual layers and audio
  - [x] 8.1 Implement parallax scrolling background
    - Create at least 2 parallax layers with different scroll speeds
    - Farthest layer scrolls at no more than 50% of pipe speed
    - Draw background behind gameplay layer each frame
    - _Requirements: 9.4_

  - [x] 8.2 Implement scrolling ground element
    - Render ground at bottom of canvas occupying ~10% of canvas height (60px)
    - Scroll ground horizontally at same speed as pipes
    - _Requirements: 9.5_

  - [x] 8.3 Implement audio manager with graceful degradation
    - Load jump.wav and game_over.wav via Audio elements
    - Play jump.wav on flap (restart from beginning if already playing)
    - Generate score sound via WebAudio oscillator (≤200ms duration)
    - Play game_over.wav on Game_Over transition
    - Gracefully degrade to silent operation if audio fails to load or WebAudio is unavailable
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 9. Implement game state screens and canvas scaling
  - [x] 9.1 Implement Ready and Game Over screen overlays
    - Display "Tap to Start" prompt and Kiro at starting position in Ready state
    - Display final score and "Tap to Restart" prompt in Game_Over state
    - _Requirements: 8.2, 8.4_

  - [x] 9.2 Implement responsive canvas scaling logic
    - Maintain fixed 400×600 internal resolution
    - Scale down to fit viewport when smaller, display at native resolution when larger
    - Preserve 2:3 aspect ratio with letterboxing
    - Recalculate on window resize within 100ms
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 2.3, 2.4_

  - [x] 9.3 Write property test for canvas scaling
    - **Property 9: Canvas Scaling Preserves Aspect Ratio**
    - For any viewport dimensions, verify scale preserves 2:3 ratio, equals 1 when viewport exceeds 400×600, and equals min(vw/400, vh/600) otherwise
    - **Validates: Requirements 2.3, 11.3, 11.4**

- [x] 10. Wire everything together and finalize
  - [x] 10.1 Integrate all components into the game loop
    - Wire state machine, input, physics, pipes, collision, scoring, audio, and renderer together
    - Ensure correct execution order: input → physics → pipes → collision → score → render
    - Verify no orphaned or disconnected code
    - _Requirements: 2.2, 8.3_

  - [x] 10.2 Update README.md with game documentation
    - Add game description (name, genre, browser-based)
    - Document how to run (open index.html in Chrome/Firefox/Safari, no build step)
    - List all controls (Space, Up Arrow, mouse click, screen tap)
    - Describe game objective (guide Kiro through pipes, earn points)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The game uses vanilla JavaScript with no build step — all code lives in index.html or classic script-tagged JS files
- Assets (ghosty.png, jump.wav, game_over.wav) are loaded via relative paths from the assets/ folder
- Property-based tests should use fast-check library loaded via CDN or local copy in a separate test file

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["3.5", "3.6"] },
    { "id": 5, "tasks": ["5.1", "5.5"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.6", "5.7"] },
    { "id": 7, "tasks": ["5.4", "5.8", "6.1"] },
    { "id": 8, "tasks": ["6.2", "6.3"] },
    { "id": 9, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 10, "tasks": ["9.1", "9.2"] },
    { "id": 11, "tasks": ["9.3", "10.1"] },
    { "id": 12, "tasks": ["10.2"] }
  ]
}
```
