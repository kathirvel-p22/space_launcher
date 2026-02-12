/**
 * main.js - Game initialization and asset loading
 *
 * This is the main entry point for the game. It initializes the game engine,
 * loads assets, and starts the game loop.
 */

import { Game } from './core/Game.js';
import { Menu } from './ui/Menu.js';
import { HUD } from './ui/HUD.js';

// Game state
const gameState = {
    game: null,
    menu: null,
    hud: null,
    isPaused: false,
    currentScene: 'menu',
    score: 0,
    health: 100,
    level: 1,
    time: 0
};

/**
 * Initialize UI elements
 */
function initUI() {
    // Initialize HUD with DOM elements
    gameState.hud = new HUD({
        healthBar: document.getElementById('healthBar'),
        scoreValue: document.getElementById('scoreValue'),
        levelValue: document.getElementById('levelValue'),
        timeValue: document.getElementById('timeValue')
    });
    
    // Initialize Menu with DOM elements
    gameState.menu = new Menu({
        mainMenu: document.getElementById('mainMenu'),
        pauseMenu: document.getElementById('pauseMenu'),
        gameOverScreen: document.getElementById('gameOverScreen'),
        optionsMenu: null,
        creditsMenu: null,
        emergencyAlarm: document.getElementById('emergencyAlarm'),
        damageIndicator: document.getElementById('damageIndicator')
    });
    
    // Initialize game state
    gameState.score = 0;
    gameState.health = 100;
    gameState.level = 1;
    gameState.time = 0;
}

/**
 * Main game initialization function
 */
async function initGame() {
    try {
        // Initialize UI
        initUI();
        
        // Create the game instance
        gameState.game = new Game('gameCanvas');
        
        // Set up canvas size
        gameState.game.resizeCanvas();
        
        // Initialize HUD with game state
        gameState.hud.update({
            playerStats: {
                health: 100,
                maxHealth: 100,
                score: 0
            },
            currentLevel: 1,
            time: 0
        });
        
        // Link HUD to game instance
        gameState.game.hud = gameState.hud;
        
        // Add window resize listener
        window.addEventListener('resize', () => {
            gameState.game.resizeCanvas();
        });
        
        // Set up event listeners
        setupEventListeners();

        // Mark UI as ready (helps confirm JS is running)
        const startStatus = document.getElementById('startStatus');
        if (startStatus) startStatus.textContent = 'Ready. Click Start to play.';

        // Show main menu and wait for the user to start
        gameState.currentScene = 'menu';
        gameState.menu.showMainMenu();
        
        // Return game instance for testing/debugging
        return gameState.game;
    } catch (error) {
        console.error('Failed to initialize game:', error);
        
        // Show error message to user
        const errorElement = document.createElement('div');
        errorElement.style.position = 'absolute';
        errorElement.style.top = '50%';
        errorElement.style.left = '50%';
        errorElement.style.transform = 'translate(-50%, -50%)';
        errorElement.style.color = 'white';
        errorElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        errorElement.style.padding = '20px';
        errorElement.style.borderRadius = '10px';
        errorElement.style.textAlign = 'center';
        errorElement.style.fontFamily = 'Arial, sans-serif';
        errorElement.textContent = 'Failed to load the game. Please try again later.';
        
        document.body.appendChild(errorElement);
        
        throw error;
    }
}

/**
 * Check if WebGL is supported
 * @returns {boolean}
 */
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!window.WebGLRenderingContext && !!canvas.getContext('webgl');
    } catch (e) {
        return false;
    }
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
    const isSupported = checkWebGLSupport();
    
    if (!isSupported) {
        const warning = document.createElement('div');
        warning.style.position = 'absolute';
        warning.style.top = '20px';
        warning.style.left = '20px';
        warning.style.color = 'white';
        warning.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
        warning.style.padding = '10px';
        warning.style.borderRadius = '5px';
        warning.style.fontFamily = 'Arial, sans-serif';
        warning.style.fontSize = '14px';
        warning.textContent = 'Warning: WebGL not supported. Game may not work properly.';
        
        document.body.appendChild(warning);
    }
    
    return isSupported;
}

/**
 * Preload assets (removed - no loading screens)
 * @returns {Promise<Object>}
 */
async function preloadAssets() {
    // No asset preloading - assets load on demand
    return { images: [], audio: [] };
}


/**
 * Set up event listeners for UI controls
 */
function setupEventListeners() {
    // Start button
    const startButton = document.getElementById('startButton');
    const startStatus = document.getElementById('startStatus');
    const startError = document.getElementById('startError');

    const startGameFromMenu = async (startLevel = 1) => {
        if (!gameState.game) {
            if (startStatus) startStatus.textContent = 'Loading...';
            return;
        }

        try {
            if (startError) {
                startError.style.display = 'none';
                startError.textContent = '';
            }
            if (startStatus) startStatus.textContent = 'Starting...';
            if (startButton) startButton.disabled = true;

            // Determine scene based on level
            let sceneName = 'earth';
            if (startLevel >= 11 && startLevel <= 25) sceneName = 'sky';
            else if (startLevel >= 26 && startLevel <= 45) sceneName = 'space';
            else if (startLevel >= 46 && startLevel <= 65) sceneName = 'moon';
            else if (startLevel >= 66) sceneName = 'mars';

            await gameState.game.loadLevel(sceneName, startLevel);
            gameState.game.gameState.currentLevel = startLevel;
            gameState.game.gameState.currentScene = sceneName;
            gameState.currentScene = 'game';
            gameState.game.startGame();
            if (gameState.menu) gameState.menu.hideMainMenu();
            if (startStatus) startStatus.textContent = '';
        } catch (error) {
            console.error('Failed to start game:', error);
            if (startStatus) startStatus.textContent = '';
            if (startError) {
                startError.textContent = `Failed to start: ${error?.message || error}`;
                startError.style.display = 'block';
            }
            if (startButton) startButton.disabled = false;
        }
    };
    
    // Allow starting at specific level via URL parameter or console
    // Usage: window.startAtLevel(11) to start at Sky scene
    window.startAtLevel = (level) => startGameFromMenu(level);

    // Expose for non-module fallback click handler
    window.__orbitBreakerStart = startGameFromMenu;

    if (startButton) {
        startButton.addEventListener('click', async (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            await startGameFromMenu();
        });
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        // Start game from menu
        if ((e.code === 'Enter' || e.code === 'Space') && gameState.currentScene === 'menu') {
            const btn = document.getElementById('startButton');
            if (btn) btn.click();
        }

        // Pause game
        if (e.code === 'Escape' && gameState.currentScene === 'game') {
            if (gameState.isPaused) {
                gameState.menu.hidePauseMenu();
                gameState.isPaused = false;
                gameState.game.resumeGame();
            } else {
                gameState.menu.showPauseMenu();
                gameState.isPaused = true;
                gameState.game.pauseGame();
            }
        }
        
        // Mute toggle
        if (e.code === 'KeyM') {
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                audio.muted = !audio.muted;
            });
        }
    });
    
    // Pause menu buttons
    const resumeButton = document.getElementById('resumeButton');
    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            gameState.menu.hidePauseMenu();
            gameState.isPaused = false;
            gameState.game.resumeGame();
        });
    }
    
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', async () => {
            gameState.menu.hidePauseMenu();
            gameState.isPaused = false;
            await gameState.game.restartLevel();
        });
    }
    
    const mainMenuButton = document.getElementById('mainMenuButton');
    if (mainMenuButton) {
        mainMenuButton.addEventListener('click', () => {
            gameState.menu.hidePauseMenu();
            gameState.game.returnToMainMenu();
            gameState.currentScene = 'menu';
            gameState.menu.showMainMenu();
        });
    }
    
    // Game over buttons
    const retryButton = document.getElementById('retryButton');
    if (retryButton) {
        retryButton.addEventListener('click', async () => {
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (gameOverScreen) gameOverScreen.style.display = 'none';
            await gameState.game.restartLevel();
        });
    }
    
    const quitButton = document.getElementById('quitButton');
    if (quitButton) {
        quitButton.addEventListener('click', () => {
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (gameOverScreen) gameOverScreen.style.display = 'none';
            gameState.game.returnToMainMenu();
            gameState.currentScene = 'menu';
            gameState.menu.showMainMenu();
        });
    }
    
    // Touch controls (optional)
    const touchControls = document.createElement('div');
    touchControls.className = 'touch-controls';
    touchControls.innerHTML = `
        <button class="touch-button" id="touchUp">↑</button>
        <button class="touch-button" id="touchDown">↓</button>
        <button class="touch-button" id="touchLeft">←</button>
        <button class="touch-button" id="touchRight">→</button>
        <button class="touch-button" id="touchFire">💥</button>
    `;
    document.body.appendChild(touchControls);
    
    // Touch control event listeners
    document.getElementById('touchUp').addEventListener('touchstart', () => {
        gameState.game.input.setKeyState('ArrowUp', true);
    });
    document.getElementById('touchUp').addEventListener('touchend', () => {
        gameState.game.input.setKeyState('ArrowUp', false);
    });
    
    document.getElementById('touchDown').addEventListener('touchstart', () => {
        gameState.game.input.setKeyState('ArrowDown', true);
    });
    document.getElementById('touchDown').addEventListener('touchend', () => {
        gameState.game.input.setKeyState('ArrowDown', false);
    });
    
    document.getElementById('touchLeft').addEventListener('touchstart', () => {
        gameState.game.input.setKeyState('ArrowLeft', true);
    });
    document.getElementById('touchLeft').addEventListener('touchend', () => {
        gameState.game.input.setKeyState('ArrowLeft', false);
    });
    
    document.getElementById('touchRight').addEventListener('touchstart', () => {
        gameState.game.input.setKeyState('ArrowRight', true);
    });
    document.getElementById('touchRight').addEventListener('touchend', () => {
        gameState.game.input.setKeyState('ArrowRight', false);
    });
    
    document.getElementById('touchFire').addEventListener('touchstart', () => {
        gameState.game.input.setKeyState('Space', true);
    });
    document.getElementById('touchFire').addEventListener('touchend', () => {
        gameState.game.input.setKeyState('Space', false);
    });
}

/**
 * Main initialization sequence
 */
async function main() {
    // Check browser compatibility
    checkBrowserCompatibility();
    
    // Initialize game directly without loading screen
    const game = await initGame();
    window.game = game;
    window.gameState = gameState;
    
    // Return game instance
    return game;
}

function showFatalError(message) {
    const startError = document.getElementById('startError');
    const startStatus = document.getElementById('startStatus');
    if (startStatus) startStatus.textContent = '';
    if (startError) {
        startError.textContent = message;
        startError.style.display = 'block';
    }
}

window.addEventListener('error', (event) => {
    try {
        showFatalError(`Error: ${event?.message || 'Unknown error'}`);
    } catch (_) {
        // ignore
    }
});

window.addEventListener('unhandledrejection', (event) => {
    try {
        const reason = event?.reason;
        const msg = reason?.message || String(reason);
        showFatalError(`Unhandled promise rejection: ${msg}`);
    } catch (_) {
        // ignore
    }
});

// Start the game when the page loads (works even if DOMContentLoaded already fired)
function startApp() {
    main().catch(error => {
        console.error('Game initialization failed:', error);
        showFatalError(`Game initialization failed: ${error?.message || error}`);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initGame, preloadAssets, checkBrowserCompatibility, gameState };
}
