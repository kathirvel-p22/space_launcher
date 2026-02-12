# Space Launcher Game

A dynamic space-themed game featuring rocket launches, meteor defense, and planetary exploration across multiple celestial bodies.

## Overview

Space Launcher is an interactive browser-based game that challenges players to navigate rockets through space, defend against meteors, and explore different planetary environments including Earth, Mars, Moon, and deep space.

## Features

### Core Gameplay

- **Rocket Control**: Navigate your rocket through various space environments
- **Meteor Defense**: Protect your rocket from incoming meteor threats
- **Level Progression**: Multiple levels with increasing difficulty
- **Planetary Exploration**: Visit different celestial bodies (Earth, Mars, Moon, Space)

### Technical Features

- Canvas-based rendering with smooth animations
- Physics simulation for realistic rocket movement
- Sprite-based animations for game entities
- Scene management system for seamless level transitions
- Save/Load game state functionality
- Responsive HUD with score and health tracking

## Project Structure

```
machi_Projects/
├── src/                    # Source code
│   ├── core/              # Game core systems
│   │   ├── Game.js       # Main game loop
│   │   ├── Input.js      # Keyboard/mouse input handling
│   │   ├── SceneManager.js # Scene management
│   │   └── EventBus.js   # Event system
│   ├── entities/          # Game entities
│   │   ├── Rocket.js     # Player rocket
│   │   ├── Meteor.js     # Enemy meteors
│   │   ├── Player.js     # Player controller
│   │   └── Projectile.js # Shooting mechanics
│   ├── scenes/           # Game scenes
│   │   ├── EarthScene.js
│   │   ├── MarsScene.js
│   │   ├── MoonScene.js
│   │   ├── SkyScene.js
│   │   └── SpaceScene.js
│   ├── levels/           # Level data
│   ├── physics/          # Physics engine
│   ├── animation/        # Sprite animations
│   ├── ui/               # UI components
│   └── state/            # Game state management
├── build/                 # Compiled/built version
├── assets/              # Game assets
│   ├── sprites/         # Images
│   └── audio/           # Sound effects
└── index.html           # Main entry point
```

## How to Play

1. Open `index.html` in a web browser
2. Use arrow keys or WASD to control your rocket
3. Press Space to shoot/launch
4. Avoid or destroy incoming meteors
5. Complete level objectives to progress

## Installation

```bash
# Clone the repository
git clone https://github.com/kathirvel-p22/space_launcher.git

# Navigate to project directory
cd space_launcher

# Open index.html in your browser
# or serve with a local server
npx serve
```

## Technologies Used

- **JavaScript (ES6+)**: Core game logic
- **HTML5 Canvas**: Rendering engine
- **CSS3**: Styling and UI
- **Git**: Version control

## Development

To modify the game:

1. Edit source files in `src/`
2. Build using `node build/build.js`
3. Test changes in browser

## License

This project is open source and available for personal use and modification.

---

**Repository**: https://github.com/kathirvel-p22/space_launcher
