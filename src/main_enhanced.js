/**
 * main_enhanced.js - Enhanced game initialization with full menu handling
 * 
 * Complete event handling for:
 * - Main Menu (Start, Continue, Level Select)
 * - Pause Menu (Resume, Restart, Main Menu)
 * - Game Over (Retry, Quit)
 * - Victory (Next Level, Main Menu)
 */

import { Game } from './core/Game.js';
import { HUDEnhanced } from './ui/HUD_Enhanced.js';
import { MenuEnhanced } from './ui/Menu_Enhanced.js';

// Global game state
const gameState = {
    game: null,
    menu: null,
    hud: null,
    isPaused: false,
    isPlaying: false,
    currentScene: 'menu',
    currentLevel: 1,
    score: 0,
    savedProgress: null
};

/**
 * Initialize the game
 */
async function initGame() {
    try {
        console.log('[Main] Initializing game...');
        
        // Initialize HUD first
        gameState.hud = new HUDEnhanced();
        
        // Initialize Menu
        gameState.menu = new MenuEnhanced();
        
        // Create game instance with custom HUD
        gameState.game = new Game('gameCanvas', gameState.hud);
        gameState.game.resizeCanvas();
        
        // Setup all event listeners
        setupMainMenuHandlers();
        setupPauseMenuHandlers();
        setupGameOverHandlers();
        setupVictoryHandlers();
        setupLevelSelectHandlers();
        setupKeyboardControls();
        
        // Setup window resize
        window.addEventListener('resize', () => {
            if (gameState.game) {
                gameState.game.resizeCanvas();
            }
        });
        
        // Load saved progress
        loadSavedProgress();
        
        // Show main menu
        gameState.menu.showMainMenu();
        gameState.currentScene = 'menu';
        
        // Expose for debugging
        window.game = gameState.game;
        window.gameState = gameState;
        
        console.log('[Main] Game initialized successfully');
        return gameState.game;
        
    } catch (error) {
        console.error('[Main] Failed to initialize game:', error);
        showFatalError(`Failed to initialize: ${error.message}`);
        throw error;
    }
}

/**
 * Setup Main Menu event handlers
 */
function setupMainMenuHandlers() {
    // Start Game button
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.addEventListener('click', async () => {
            console.log('[Main] Start button clicked');
            await startGame(1); // Start from level 1
        });
    }
    
    // Continue button (if there's saved progress)
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.addEventListener('click', async () => {
            console.log('[Main] Continue button clicked');
            if (gameState.savedProgress) {
                await startGame(
                    gameState.savedProgress.level,
                    gameState.savedProgress.scene
                );
            }
        });
    }
    
    // Level Select button
    const levelSelectButton = document.getElementById('levelSelectButton');
    if (levelSelectButton) {
        levelSelectButton.addEventListener('click', () => {
            console.log('[Main] Level Select button clicked');
            gameState.menu.showLevelSelect();
        });
    }
}

/**
 * Setup Pause Menu event handlers
 */
function setupPauseMenuHandlers() {
    // Resume button
    const resumeButton = document.getElementById('resumeButton');
    if (resumeButton) {
        resumeButton.addEventListener('click', () => {
            console.log('[Main] Resume button clicked');
            resumeGame();
        });
    }
    
    // Restart button
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
        restartButton.addEventListener('click', async () => {
            console.log('[Main] Restart button clicked');
            await restartLevel();
        });
    }
    
    // Main Menu button (from pause)
    const mainMenuButton = document.getElementById('mainMenuButton');
    if (mainMenuButton) {
        mainMenuButton.addEventListener('click', () => {
            console.log('[Main] Main Menu button clicked (from pause)');
            returnToMainMenu();
        });
    }
}

/**
 * Setup Game Over screen handlers
 */
function setupGameOverHandlers() {
    // Retry button
    const retryButton = document.getElementById('retryButton');
    if (retryButton) {
        retryButton.addEventListener('click', async () => {
            console.log('[Main] Retry button clicked');
            await restartLevel();
        });
    }
    
    // Quit button (to main menu)
    const quitButton = document.getElementById('quitButton');
    if (quitButton) {
        quitButton.addEventListener('click', () => {
            console.log('[Main] Quit button clicked');
            returnToMainMenu();
        });
    }
}

/**
 * Setup Victory screen handlers
 */
function setupVictoryHandlers() {
    // Next Level button
    const nextLevelButton = document.getElementById('nextLevelButton');
    if (nextLevelButton) {
        nextLevelButton.addEventListener('click', async () => {
            console.log('[Main] Next Level button clicked');
            await loadNextLevel();
        });
    }
    
    // Main Menu button (from victory)
    const victoryMenuButton = document.getElementById('victoryMenuButton');
    if (victoryMenuButton) {
        victoryMenuButton.addEventListener('click', () => {
            console.log('[Main] Main Menu button clicked (from victory)');
            returnToMainMenu();
        });
    }
}

/**
 * Setup Level Select handlers
 */
function setupLevelSelectHandlers() {
    // Back to Main Menu button
    const backToMainButton = document.getElementById('backToMainButton');
    if (backToMainButton) {
        backToMainButton.addEventListener('click', () => {
            console.log('[Main] Back to Main Menu clicked');
            gameState.menu.showMainMenu();
        });
    }
    
    // Level buttons (dynamically created)
    const levelSelectButtons = document.getElementById('levelSelectButtons');
    if (levelSelectButtons) {
        levelSelectButtons.addEventListener('click', async (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.level) {
                const level = parseInt(e.target.dataset.level);
                const scene = e.target.dataset.scene;
                console.log(`[Main] Level ${level} selected (${scene})`);
                await startGame(level, scene);
            }
        });
    }
}

/**
 * Setup keyboard controls
 */
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        // ESC key - Pause/Resume
        if (e.code === 'Escape') {
            if (gameState.isPlaying) {
                if (gameState.isPaused) {
                    resumeGame();
                } else {
                    pauseGame();
                }
            }
        }
        
        // Enter/Space - Start from main menu
        if ((e.code === 'Enter' || e.code === 'Space') && gameState.currentScene === 'menu') {
            const startButton = document.getElementById('startButton');
            if (startButton && !startButton.disabled) {
                startButton.click();
            }
        }
    });
}

/**
 * Start the game at a specific level
 * @param {number} level - Level number to start
 * @param {string} scene - Scene name (optional, auto-detected if not provided)
 */
async function startGame(level = 1, scene = null) {
    try {
        console.log(`[Main] Starting game at level ${level}`);
        
        // Show loading
        gameState.menu.showLoading('Loading level...');
        
        // Determine scene if not provided
        if (!scene) {
            scene = getSceneForLevel(level);
        }
        
        // Hide all menus
        gameState.menu.hideAll();
        
        // Show HUD
        gameState.hud.show();
        gameState.hud.reset();
        
        // Load the level
        await gameState.game.loadLevel(scene, level);
        
        // Update game state
        gameState.game.gameState.currentLevel = level;
        gameState.game.gameState.currentScene = scene;
        gameState.currentLevel = level;
        gameState.currentScene = scene;
        gameState.isPlaying = true;
        gameState.isPaused = false;
        
        // Start the game
        gameState.game.startGame();
        
        // Hide loading
        gameState.menu.hideLoading();
        
        // Save progress
        saveProgress(level, scene);
        
        console.log(`[Main] Game started successfully at level ${level}`);
        
    } catch (error) {
        console.error('[Main] Failed to start game:', error);
        gameState.menu.hideLoading();
        gameState.menu.showError(`Failed to start: ${error.message}`);
        gameState.menu.showMainMenu();
    }
}

/**
 * Pause the game
 */
function pauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    console.log('[Main] Pausing game');
    
    gameState.isPaused = true;
    gameState.game.pauseGame();
    gameState.menu.showPauseMenu();
}

/**
 * Resume the game
 */
function resumeGame() {
    if (!gameState.isPlaying || !gameState.isPaused) return;
    
    console.log('[Main] Resuming game');
    
    gameState.isPaused = false;
    gameState.menu.hidePauseMenu();
    gameState.game.resumeGame();
}

/**
 * Restart the current level
 */
async function restartLevel() {
    try {
        console.log('[Main] Restarting level');
        
        // Hide pause/game over menus
        gameState.menu.hideAll();
        
        // Show loading
        gameState.menu.showLoading('Restarting level...');
        
        // Reset HUD
        gameState.hud.reset();
        
        // Restart the level
        await gameState.game.restartLevel();
        
        // Update state
        gameState.isPaused = false;
        gameState.isPlaying = true;
        
        // Hide loading
        gameState.menu.hideLoading();
        
        console.log('[Main] Level restarted successfully');
        
    } catch (error) {
        console.error('[Main] Failed to restart level:', error);
        gameState.menu.showError(`Failed to restart: ${error.message}`);
    }
}

/**
 * Return to main menu
 */
function returnToMainMenu() {
    console.log('[Main] Returning to main menu');
    
    // Stop the game
    if (gameState.game) {
        gameState.game.stopGame();
    }
    
    // Update state
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.currentScene = 'menu';
    
    // Hide HUD and all menus
    gameState.hud.hide();
    gameState.menu.hideAll();
    
    // Show main menu
    gameState.menu.showMainMenu();
    
    console.log('[Main] Returned to main menu');
}

/**
 * Load next level
 */
async function loadNextLevel() {
    const nextLevel = gameState.currentLevel + 1;
    
    // Check if there's a next level
    if (nextLevel > 100) {
        console.log('[Main] Game completed!');
        gameState.hud.showNotification('Congratulations!', 'You completed all 100 levels!', 5000);
        returnToMainMenu();
        return;
    }
    
    // Check if we need to transition to a new chapter
    const currentScene = getSceneForLevel(gameState.currentLevel);
    const nextScene = getSceneForLevel(nextLevel);
    
    if (currentScene !== nextScene) {
        // Show chapter transition
        const chapterInfo = getChapterInfo(nextScene);
        gameState.menu.showChapterTransition(
            chapterInfo.number,
            chapterInfo.title,
            chapterInfo.subtitle,
            3000
        );
        
        // Wait for transition
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Hide victory screen
    gameState.menu.hideVictory();
    
    // Start next level
    await startGame(nextLevel, nextScene);
}

/**
 * Get scene name for a level
 * @param {number} level - Level number
 * @returns {string} Scene name
 */
function getSceneForLevel(level) {
    if (level >= 1 && level <= 10) return 'earth';
    if (level >= 11 && level <= 25) return 'sky';
    if (level >= 26 && level <= 45) return 'space';
    if (level >= 46 && level <= 65) return 'moon';
    if (level >= 66) return 'mars';
    return 'earth';
}

/**
 * Get chapter information
 * @param {string} scene - Scene name
 * @returns {Object} Chapter info
 */
function getChapterInfo(scene) {
    const chapters = {
        earth: { number: 1, title: 'EARTH', subtitle: 'The Beginning' },
        sky: { number: 2, title: 'SKY', subtitle: 'The Burning Ascent' },
        space: { number: 3, title: 'SPACE', subtitle: 'Silent Drift' },
        moon: { number: 4, title: 'MOON', subtitle: 'Low Gravity Nightmare' },
        mars: { number: 5, title: 'MARS', subtitle: 'The Red Apocalypse' }
    };
    return chapters[scene] || chapters.earth;
}

/**
 * Save game progress to localStorage
 * @param {number} level - Current level
 * @param {string} scene - Current scene
 */
function saveProgress(level, scene) {
    try {
        const progress = {
            level: level,
            scene: scene,
            timestamp: Date.now()
        };
        localStorage.setItem('orbitBreakerProgress', JSON.stringify(progress));
        gameState.savedProgress = progress;
        
        // Show continue button if we have progress
        const continueButton = document.getElementById('continueButton');
        if (continueButton && level > 1) {
            continueButton.style.display = 'block';
        }
        
        console.log('[Main] Progress saved:', progress);
    } catch (error) {
        console.warn('[Main] Failed to save progress:', error);
    }
}

/**
 * Load saved progress from localStorage
 */
function loadSavedProgress() {
    try {
        const saved = localStorage.getItem('orbitBreakerProgress');
        if (saved) {
            gameState.savedProgress = JSON.parse(saved);
            
            // Show continue button
            const continueButton = document.getElementById('continueButton');
            if (continueButton && gameState.savedProgress.level > 1) {
                continueButton.style.display = 'block';
                continueButton.textContent = `Continue (Level ${gameState.savedProgress.level})`;
            }
            
            console.log('[Main] Loaded saved progress:', gameState.savedProgress);
        }
    } catch (error) {
        console.warn('[Main] Failed to load progress:', error);
    }
}

/**
 * Show fatal error message
 * @param {string} message - Error message
 */
function showFatalError(message) {
    const errorEl = document.getElementById('startError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    
    // Also show in console
    console.error('[Main] Fatal error:', message);
}

/**
 * Handle window errors
 */
window.addEventListener('error', (event) => {
    console.error('[Main] Window error:', event.error);
    if (gameState.menu) {
        gameState.menu.showError(`Error: ${event.message}`);
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('[Main] Unhandled rejection:', event.reason);
    if (gameState.menu) {
        gameState.menu.showError(`Error: ${event.reason?.message || event.reason}`);
    }
});

/**
 * Main initialization
 */
async function main() {
    console.log('[Main] Starting Orbit Breaker...');
    
    try {
        await initGame();
        console.log('[Main] Orbit Breaker ready!');
    } catch (error) {
        console.error('[Main] Failed to start:', error);
        showFatalError(`Failed to start: ${error.message}`);
    }
}

/**
 * Start when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

// Export for testing
export { gameState, startGame, pauseGame, resumeGame, restartLevel, returnToMainMenu };
