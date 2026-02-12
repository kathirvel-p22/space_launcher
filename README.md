# 🚀 Orbit Breaker - Advanced Space Launcher Game

An epic space adventure featuring 100 levels across 5 chapters, with advanced physics, dynamic gameplay mechanics, and stunning visual effects. Navigate through Earth's atmosphere, soar through the sky, orbit celestial bodies, and venture into deep space!

## 🌟 Overview

Orbit Breaker is a comprehensive browser-based space game that takes players on an incredible journey from Earth's surface to the depths of space. With 100 meticulously designed levels, each chapter introduces unique gameplay mechanics, challenges, and environments.

## ✨ Features

### 🎮 Core Gameplay

- **5 Epic Chapters**: Earth (Levels 1-10), Sky (Levels 11-25), Moon (Levels 26-50), Mars (Levels 51-75), Space (Levels 76-100)
- **100 Unique Levels**: Each with custom objectives, difficulty curves, and mechanics
- **Dynamic Controls**: Ground-based running/jumping on Earth, rocket flight in Sky, orbital mechanics in space
- **Progressive Difficulty**: From simple meteor dodging to complex multi-enemy combat scenarios
- **Score-Based Progression**: Reach target scores to advance through levels
- **Multi-Bullet Upgrades**: Unlock more powerful weapons as you progress

### 🎯 Chapter-Specific Features

#### Chapter 1: EARTH (Levels 1-10)
- Ground-based gameplay with running and jumping
- Meteor storm defense
- Progressive difficulty with increasing meteor density
- Rocket discovery and launch sequence (Level 10)
- Multi-bullet upgrades based on level progression

#### Chapter 2: SKY (Levels 11-25) - ADVANCED MECHANICS
- **Rocket flight controls** with thrust management
- **Fuel system** with regeneration mechanics
- **Heat management** - avoid overheating during ascent
- **Advanced enemy types**: Debris, Fireballs, Tracking Drones
- **Special mechanics per level**:
  - Wind push and turbulence
  - Control lag and input delay
  - Sideways drift (broken stabilizers)
  - Fuel crisis scenarios
  - Thermal barriers and fire corridors
  - System glitches and visual distortion
  - Narrow corridors requiring pixel-perfect navigation
  - Survival challenges

#### Chapter 3: MOON (Levels 26-50)
- Low gravity orbital mechanics
- Lunar surface exploration
- Crater navigation

#### Chapter 4: MARS (Levels 51-75)
- Martian atmosphere challenges
- Red planet terrain
- Dust storm mechanics

#### Chapter 5: SPACE (Levels 76-100)
- Zero gravity navigation
- Asteroid fields
- Deep space exploration
- Final boss encounters

### 🎨 Enhanced UI System

- **Glassmorphism Design**: Modern, sleek interface with blur effects
- **Animated Menus**: Smooth transitions and hover effects
- **Level Select Screen**: Browse all 100 levels organized by chapter
- **Real-time HUD**: Health, fuel, score, level, and time tracking
- **Level Objectives Display**: Clear objectives shown at level start
- **Completion Animations**: Animated success screens with statistics
- **Progress Tracking**: Visual progress bars and objective updates

### 🔧 Technical Features

- **Force-Based Physics Engine**: Realistic Newtonian physics simulation
- **Event-Driven Architecture**: Efficient event bus system
- **Scene Management**: Seamless transitions between chapters
- **Save/Load System**: Persistent game progress
- **Responsive Canvas**: Adapts to different screen sizes
- **Particle Effects**: Explosions, smoke, and visual feedback
- **Sound System**: Background music and sound effects
- **Performance Optimized**: Smooth 60 FPS gameplay

## 📁 Project Structure

```
space_launcher/
├── src/                          # Source code
│   ├── core/                    # Game core systems
│   │   ├── Game.js             # Main game loop and state management
│   │   ├── Input.js            # Keyboard/mouse input handling
│   │   ├── Scene.js            # Base scene class
│   │   ├── SceneManager.js     # Scene transitions and management
│   │   └── EventBus.js         # Event system for decoupled communication
│   ├── entities/                # Game entities
│   │   ├── Entity.js           # Base entity class
│   │   ├── Rocket.js           # Player rocket with thrust mechanics
│   │   ├── Meteor.js           # Enemy meteors with variants
│   │   ├── Player.js           # Ground-based player controller
│   │   └── Projectile.js       # Shooting mechanics and bullets
│   ├── scenes/                  # Game scenes (chapters)
│   │   ├── EarthScene.js       # Chapter 1: Ground gameplay
│   │   ├── SkyScene.js         # Chapter 2: Rocket flight (ADVANCED)
│   │   ├── MoonScene.js        # Chapter 3: Lunar exploration
│   │   ├── MarsScene.js        # Chapter 4: Martian challenges
│   │   └── SpaceScene.js       # Chapter 5: Deep space
│   ├── levels/                  # Level configurations
│   │   ├── LevelManager.js     # Level loading and progression
│   │   └── level_data/         # JSON level definitions
│   ├── physics/                 # Physics engine
│   │   ├── PhysicsEngine.js    # Main physics simulation
│   │   └── PhysicsBody.js      # Force-based physics bodies
│   ├── animation/               # Animation system
│   │   └── SpriteAnimator.js   # Sprite animation controller
│   ├── ui/                      # User interface
│   │   ├── HUD.js              # Basic heads-up display
│   │   ├── HUD_Enhanced.js     # Advanced HUD with animations
│   │   ├── Menu.js             # Basic menu system
│   │   ├── Menu_Enhanced.js    # Advanced menu with level select
│   │   └── LevelObjective.js   # Objective display and completion
│   ├── state/                   # Game state management
│   │   ├── GameState.js        # Global game state
│   │   └── SaveSystem.js       # Save/load functionality
│   ├── data/                    # Game data
│   │   └── planets.js          # Planet configurations
│   ├── main.js                  # Basic game entry point
│   └── main_enhanced.js         # Enhanced game entry point
├── assets/                      # Game assets
│   ├── sprites/                # Images and textures
│   │   ├── earth_*.png         # Earth chapter assets
│   │   ├── sky_*.png           # Sky chapter assets
│   │   ├── moon_*.png          # Moon chapter assets
│   │   ├── mars_*.png          # Mars chapter assets
│   │   ├── space_*.png         # Space chapter assets
│   │   ├── player_*.png        # Player sprites
│   │   ├── rocket.png          # Rocket sprite
│   │   ├── meteor_*.png        # Meteor variants
│   │   └── projectile.png      # Bullet sprite
│   └── audio/                  # Sound effects and music
│       ├── background_music.mp3
│       ├── rocket_engine.mp3
│       ├── explosion.mp3
│       ├── shoot.mp3
│       └── alarm.mp3
├── styles.css                   # Basic styles
├── styles_enhanced.css          # Enhanced UI styles
├── index.html                   # Basic game entry
├── index_enhanced.html          # Enhanced game entry (RECOMMENDED)
├── test_fixes.html             # Test environment for fixes
└── README.md                    # This file
```

## 🎮 How to Play

### Quick Start

1. Open `index_enhanced.html` in a modern web browser (Chrome, Firefox, Edge recommended)
2. Click "Start Game" or "Continue" to resume your progress
3. Use the controls below to navigate and fight
4. Complete level objectives to progress through all 100 levels!

### Controls

#### Earth Chapter (Levels 1-10)
- **Arrow Keys** or **A/D**: Move left/right
- **W/↑/Space**: Jump
- **S/↓**: Fast fall (when in air)
- **X/Enter**: Shoot
- **F**: Enter rocket (Level 10)
- **ESC**: Pause game

#### Sky Chapter (Levels 11-25)
- **Arrow Keys** or **A/D**: Move rocket left/right
- **W/↑/Space**: Thrust upward (uses fuel)
- **S/↓**: Move down
- **X/Enter**: Shoot
- **ESC**: Pause game

#### Moon/Mars/Space Chapters (Levels 26-100)
- **Arrow Keys** or **WASD**: Navigate in low/zero gravity
- **Space**: Boost/Thrust
- **X/Enter**: Shoot
- **ESC**: Pause game

### Gameplay Tips

1. **Watch Your Resources**: Monitor health, fuel, and heat levels in the HUD
2. **Read Objectives**: Each level has specific goals - check the objective display at the top
3. **Upgrade Weapons**: Higher levels unlock multi-bullet shooting
4. **Master Physics**: Each chapter has unique physics - practice makes perfect
5. **Use Cover**: In later levels, use terrain and obstacles strategically
6. **Manage Fuel**: In Sky chapter, balance thrusting with fuel conservation
7. **Avoid Overheating**: Too much thrusting causes heat damage
8. **Score Matters**: Reach target scores by destroying enemies efficiently

## 🚀 Installation & Setup

### Option 1: Direct Play (Recommended)

```bash
# Clone the repository
git clone https://github.com/kathirvel-p22/space_launcher.git

# Navigate to project directory
cd space_launcher

# Open the enhanced version in your browser
# Double-click index_enhanced.html
# OR use a local server (recommended for best performance)
```

### Option 2: Local Server (Best Performance)

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000

# Then open: http://localhost:8000/index_enhanced.html
```

### Option 3: Live Server (VS Code)

1. Install "Live Server" extension in VS Code
2. Right-click `index_enhanced.html`
3. Select "Open with Live Server"

## 🎯 Game Progression

### Level Structure

- **Levels 1-10**: Earth - Learn basic controls and shooting
- **Levels 11-25**: Sky - Master rocket flight and fuel management
- **Levels 26-50**: Moon - Navigate low gravity environments
- **Levels 51-75**: Mars - Survive harsh Martian conditions
- **Levels 76-100**: Space - Conquer the final frontier

### Difficulty Curve

- **Easy (1-20)**: Introduction to mechanics
- **Medium (21-50)**: Increased enemy density and speed
- **Hard (51-75)**: Complex mechanics and multiple enemy types
- **Expert (76-100)**: Ultimate challenges requiring mastery

### Unlockables

- **Level 5**: 2-bullet shooting
- **Level 10**: Rocket access
- **Level 14**: 2-bullet rocket shooting
- **Level 17**: 3-bullet spread
- **Level 20**: 4-bullet spread
- **Level 23**: 5-bullet spread (maximum firepower)

## 🛠️ Technologies Used

- **JavaScript (ES6+)**: Core game logic with modern features (classes, modules, async/await)
- **HTML5 Canvas**: High-performance 2D rendering engine
- **CSS3**: Advanced styling with glassmorphism, animations, and transitions
- **Physics Engine**: Custom force-based Newtonian physics simulation
- **Event System**: Decoupled architecture using event bus pattern
- **Module System**: ES6 modules for clean code organization
- **Git**: Version control and collaboration

## 🔧 Development

### Project Architecture

The game follows a modular, object-oriented architecture:

- **Entity-Component Pattern**: Reusable game objects with physics bodies
- **Scene System**: Each chapter is a separate scene with unique logic
- **Event-Driven**: Loose coupling through EventBus
- **State Management**: Centralized game state with save/load
- **Physics Simulation**: Force-based physics with realistic movement

### Adding New Levels

1. Create level configuration in `src/levels/level_data/`
2. Define objectives, enemies, and mechanics
3. Test using the level select menu
4. Adjust difficulty based on playtesting

### Modifying Scenes

1. Edit scene files in `src/scenes/`
2. Each scene has `initialize()`, `update()`, `render()`, and `cleanup()` methods
3. Add custom mechanics in the scene's update loop
4. Test thoroughly before committing

### Creating New Enemies

1. Extend the `Entity` class in `src/entities/`
2. Implement collision detection and behavior
3. Add rendering logic
4. Register in the appropriate scene

### Testing

- Use `test_fixes.html` for isolated feature testing
- Use `test_level11.html` for Sky chapter testing
- Use `test_enhanced_ui.html` for UI testing
- Check browser console for debug logs

## 🐛 Known Issues & Fixes

### Recent Fixes (Latest Commit)

✅ **Fixed Level 11 Rocket Controls**: Rocket now responds properly to keyboard input (left/right/up/down)
✅ **Fixed Level Objective Visibility**: Objectives now display prominently at the top of the screen
✅ **Fixed Score Updates**: Score updates in real-time during gameplay
✅ **Improved Event Listener Cleanup**: Proper cleanup between scene transitions

### Browser Compatibility

- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ⚠️ Internet Explorer: Not supported

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ES6+ features
- Follow existing naming conventions
- Add comments for complex logic
- Test thoroughly before submitting

## 📝 Changelog

### Version 2.0.0 (Latest)
- ✨ Added 100 levels across 5 chapters
- ✨ Implemented advanced Sky chapter with 15 unique mechanics
- ✨ Created enhanced UI with glassmorphism design
- ✨ Added level objectives and completion animations
- ✨ Implemented fuel and heat management systems
- 🐛 Fixed Level 11 rocket controls
- 🐛 Fixed level objective visibility
- 🐛 Fixed score update issues
- 🎨 Improved visual effects and animations

### Version 1.0.0
- 🎮 Initial release with basic gameplay
- 🌍 Earth chapter implementation
- 🎯 Basic HUD and menu system

## 📜 License

This project is open source and available under the MIT License. Feel free to use, modify, and distribute for personal and educational purposes.

## 🙏 Acknowledgments

- Inspired by classic space shooter games
- Built with modern web technologies
- Community feedback and testing

## 📞 Contact & Support

- **Repository**: https://github.com/kathirvel-p22/space_launcher
- **Issues**: Report bugs and request features via GitHub Issues
- **Developer**: Kathirvel P

## 🎮 Play Now!

Ready to embark on your space adventure? Clone the repo and open `index_enhanced.html` to start your journey through all 100 levels!

**Good luck, Space Commander! 🚀🌟**

---

*Last Updated: February 2026*
*Version: 2.0.0*
