# Requirements Document

## Introduction

Flappy Kiro is a browser-based Flappy Bird clone where the player guides Kiro (a friendly ghost-like character inspired by the AWS Kiro mascot) through an endless series of pipes. The game uses a retro 8-bit pixel-art aesthetic, runs entirely in the browser with no build step, and is rendered on an HTML5 canvas. The project leverages existing assets (ghosty.png, jump.wav, game_over.wav) and procedurally generates remaining visuals and audio using canvas drawing and WebAudio oscillators.

## Glossary

- **Game**: The Flappy Kiro browser application, consisting of HTML, CSS, and JavaScript files
- **Kiro**: The player-controlled character, a ghost-like sprite rendered from the existing ghosty.png asset
- **Pipe_Pair**: A pair of obstacles (top pipe and bottom pipe) with a vertical gap between them that Kiro must navigate through
- **Canvas**: The HTML5 canvas element used to render all game graphics
- **Game_Loop**: The requestAnimationFrame-based loop that updates game state and renders frames
- **Score_Display**: The on-screen text showing the current score (top-center) and high score (top-right)
- **Game_State**: One of three states the game can be in: Ready, Playing, or Game_Over
- **Flap**: The upward impulse applied to Kiro when the player activates the control input
- **Gap**: The vertical opening between the top and bottom pipes in a Pipe_Pair
- **High_Score**: The highest score achieved, persisted in the browser's localStorage

## Requirements

### Requirement 1: Zero-Build Browser Execution

**User Story:** As a player, I want to open the game directly in my browser without any build step or server, so that I can play immediately.

#### Acceptance Criteria

1. WHEN the player opens index.html via the file system (file:// protocol) in the latest two major versions of Chrome, Firefox, or Safari, THE Game SHALL load and reach Game_State Ready within 5 seconds without errors in the browser console
2. THE Game SHALL consist of plain HTML, CSS, and vanilla JavaScript with no external libraries, frameworks, or ES module imports
3. THE Game SHALL use only local assets (ghosty.png, jump.wav, game_over.wav) loaded via relative file paths and inline-generated graphics, with no external network requests required
4. THE Game SHALL load all scripts using classic script tags (not type="module") to ensure compatibility with the file:// protocol

### Requirement 2: Canvas Rendering

**User Story:** As a player, I want the game to render smoothly on an HTML5 canvas, so that I have a consistent visual experience.

#### Acceptance Criteria

1. THE Game SHALL render all game graphics on a single HTML5 Canvas element with a fixed internal resolution of 400×600 logical pixels
2. THE Game_Loop SHALL update game state using delta-time derived from requestAnimationFrame timestamps, targeting 60 frames per second, and SHALL NOT drop below 30 frames per second during normal gameplay on supported browsers
3. THE Canvas SHALL scale to fit the viewport while preserving the internal resolution aspect ratio, letterboxing with a solid background color if the viewport aspect ratio differs
4. WHEN the browser window is resized, THE Canvas SHALL re-scale to fit the new viewport dimensions within 100 milliseconds without distorting the aspect ratio

### Requirement 3: Player Input Controls

**User Story:** As a player, I want to control Kiro using keyboard, mouse, or touch, so that I can play on any device.

#### Acceptance Criteria

1. WHILE Game_State is Playing, WHEN the player presses the Space key, THE Game SHALL apply a Flap to Kiro
2. WHILE Game_State is Playing, WHEN the player presses the Up Arrow key, THE Game SHALL apply a Flap to Kiro
3. WHILE Game_State is Playing, WHEN the player clicks the mouse or taps the screen, THE Game SHALL apply a Flap to Kiro
4. WHILE Game_State is Ready, WHEN the player activates any control input, THE Game SHALL transition Game_State to Playing and apply a Flap to Kiro
5. WHILE Game_State is Game_Over, WHEN the player activates any control input after a minimum delay of 500 milliseconds following the Game_Over transition, THE Game SHALL reset the current score to zero, remove all Pipe_Pairs, return Kiro to the starting position, and transition Game_State to Ready
6. WHEN the player activates any control input, THE Game SHALL prevent the browser's default behavior for that input event

### Requirement 4: Kiro Physics and Movement

**User Story:** As a player, I want Kiro to respond to gravity and flap inputs realistically, so that the game feels responsive and challenging.

#### Acceptance Criteria

1. WHILE Game_State is Playing, THE Game SHALL apply a constant downward gravitational acceleration to Kiro each frame, increasing Kiro's downward velocity by a fixed amount per frame such that Kiro falls from mid-screen to the ground boundary in approximately 1 second without any Flap input
2. WHEN a Flap is applied, THE Game SHALL set Kiro's vertical velocity to a fixed upward value that moves Kiro upward by approximately 40 to 60 pixels over the following frames, overriding the current downward velocity
3. THE Game SHALL keep Kiro at a fixed horizontal position located within the left third of the Canvas width while pipes scroll past
4. WHEN a Flap is applied, THE Game SHALL rotate Kiro's sprite between 15 and 30 degrees upward from horizontal
5. WHILE Game_State is Playing, IF Kiro's vertical velocity is downward, THEN THE Game SHALL progressively rotate Kiro's sprite downward to a maximum of 90 degrees from horizontal proportional to the current downward velocity

### Requirement 5: Pipe Generation and Scrolling

**User Story:** As a player, I want pipes to appear at regular intervals with randomized gaps, so that the game provides varied and endless challenge.

#### Acceptance Criteria

1. WHILE Game_State is Playing, THE Game SHALL generate a new Pipe_Pair every 1.5 seconds with a tolerance of ±0.2 seconds (i.e., between 1.3 and 1.7 seconds apart)
2. WHILE Game_State is Playing, THE Game SHALL randomize the vertical center of each Gap such that the entire Gap remains at least 10% of the Canvas height away from both the top edge and the ground boundary
3. THE Game SHALL render each Gap with a fixed height equal to at least 3 times Kiro's sprite height
4. WHILE Game_State is Playing, THE Game SHALL scroll all Pipe_Pairs from right to left at a constant horizontal speed of 2 to 4 pixels per frame at the target 60 fps rate
5. THE Game SHALL spawn each new Pipe_Pair just beyond the right edge of the Canvas so it is not visible at the moment of creation
6. WHEN a Pipe_Pair scrolls completely off the left edge of the Canvas, THE Game SHALL remove that Pipe_Pair from memory

### Requirement 6: Collision Detection

**User Story:** As a player, I want the game to end when Kiro hits an obstacle, so that the game has clear fail conditions.

#### Acceptance Criteria

1. WHEN Kiro's axis-aligned bounding box (defined by the sprite's rectangular bounds) intersects with any Pipe_Pair's rectangular bounds, THE Game SHALL transition Game_State to Game_Over
2. WHEN the bottom edge of Kiro's bounding box reaches or exceeds the top edge of the ground element, THE Game SHALL transition Game_State to Game_Over
3. WHEN the top edge of Kiro's bounding box reaches or exceeds the top edge of the Canvas (y = 0), THE Game SHALL transition Game_State to Game_Over
4. WHILE Game_State is Playing, THE Game SHALL evaluate collision checks against all active Pipe_Pairs and boundaries once per frame before rendering
5. WHEN Game_State transitions to Game_Over due to collision, THE Game SHALL stop applying gravity and player input to Kiro

### Requirement 7: Scoring System

**User Story:** As a player, I want to earn points for passing pipes and see my score, so that I can track my progress.

#### Acceptance Criteria

1. WHEN Kiro's horizontal position passes the trailing edge of a Pipe_Pair, THE Game SHALL increment the current score by 1 and mark that Pipe_Pair as scored so that it is not counted again
2. WHILE Game_State is Playing, THE Score_Display SHALL show the current score at the top-center of the Canvas
3. WHILE Game_State is Playing, THE Score_Display SHALL show the High_Score at the top-right of the Canvas
4. WHEN the current score exceeds the stored High_Score, THE Game SHALL update the High_Score value and persist it to localStorage
5. IF localStorage is unavailable or empty, THEN THE Game SHALL default the High_Score to 0
6. WHILE Game_State is Game_Over, THE Score_Display SHALL show both the final score and the High_Score on the Game Over screen
7. WHEN Game_State transitions from Game_Over to Ready, THE Game SHALL reset the current score to 0

### Requirement 8: Game State Management

**User Story:** As a player, I want clear game states with appropriate screens, so that I know when to start, when I'm playing, and when the game is over.

#### Acceptance Criteria

1. WHEN the Game first loads, THE Game SHALL initialize Game_State to Ready
2. WHILE Game_State is Ready, THE Game SHALL display a "Tap to Start" prompt on the Canvas and render Kiro at the starting position
3. WHILE Game_State is Playing, THE Game SHALL update Kiro's position, scroll pipes, and check collisions each frame
4. WHILE Game_State is Game_Over, THE Game SHALL display the final score and a "Tap to Restart" prompt on the Canvas
5. WHEN Game_State transitions to Game_Over, THE Game SHALL stop pipe generation, pipe scrolling, and Kiro physics updates

### Requirement 9: Visual Style and Character Rendering

**User Story:** As a player, I want the game to have a retro pixel-art look with the Kiro character, so that the game feels nostalgic and on-brand.

#### Acceptance Criteria

1. THE Game SHALL render Kiro using the existing ghosty.png asset from the assets folder, scaled to a height between 24 and 48 logical pixels while preserving the original aspect ratio
2. THE Game SHALL render all sprite and asset graphics with image smoothing disabled so that scaled pixel art retains sharp, unblended edges
3. THE Game SHALL render Pipe_Pairs procedurally on the Canvas using flat-colored rectangles with a cap element, drawn in a single consistent color palette (either green or AWS-orange) chosen at development time and applied uniformly to all Pipe_Pairs
4. THE Game SHALL render a scrolling background behind the gameplay layer consisting of at least 2 parallax layers, where the farthest layer scrolls at no more than 50% of the pipe scroll speed
5. THE Game SHALL render a ground element at the bottom of the Canvas, occupying between 5% and 15% of the Canvas height, that scrolls horizontally at the same speed as the pipes

### Requirement 10: Audio Feedback

**User Story:** As a player, I want sound effects for key actions, so that the game feels responsive and engaging.

#### Acceptance Criteria

1. WHEN a Flap is applied, THE Game SHALL play the jump.wav audio asset from the beginning, restarting playback if the sound is already playing
2. WHEN the current score increments, THE Game SHALL play a score sound generated via WebAudio oscillators lasting no more than 200 milliseconds
3. WHEN Game_State transitions to Game_Over, THE Game SHALL play the game_over.wav audio asset
4. IF an audio asset fails to load or the WebAudio API is unavailable, THEN THE Game SHALL continue gameplay without sound and without displaying an error to the player

### Requirement 11: Responsive Layout

**User Story:** As a player, I want the game to fit my screen regardless of device size, so that I can play on desktop or mobile.

#### Acceptance Criteria

1. THE Canvas SHALL maintain a fixed internal resolution of 400×600 pixels for consistent gameplay regardless of display size
2. THE Game SHALL center the Canvas horizontally and vertically within the browser viewport
3. WHEN the viewport is smaller than 400×600 pixels in either dimension, THE Game SHALL scale the Canvas down to fit entirely within the viewport while preserving the aspect ratio and without cropping any content
4. WHEN the viewport is larger than 400×600 pixels in both dimensions, THE Game SHALL display the Canvas at its native resolution without scaling up
5. WHEN the browser window is resized, THE Game SHALL recalculate and apply the appropriate scale within 100 milliseconds

### Requirement 12: Project Documentation

**User Story:** As a developer, I want a README file explaining how to run the game and its controls, so that anyone can pick it up and play.

#### Acceptance Criteria

1. THE Game SHALL include a README.md file in the project root directory
2. THE README.md SHALL contain a brief description of the game stating its name, genre, and that it runs in the browser
3. THE README.md SHALL document how to run the game, including the instruction to open index.html directly in Chrome, Firefox, or Safari without a build step or server
4. THE README.md SHALL list all supported control inputs: Space key, Up Arrow key, mouse click, and screen tap
5. THE README.md SHALL describe the game objective: guide Kiro through pipes without colliding, earning one point per pipe passed
