/**
 * Game.js - Main game loop and state management
 * 
 * This module handles the core game loop, scene management, and overall game state.
 * It coordinates between the SceneManager, PhysicsEngine, and other systems.
 */

import { SceneManager } from './SceneManager.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import { Input } from './Input.js';
import { HUD } from '../ui/HUD.js';
import { SaveSystem } from '../state/SaveSystem.js';
import { EventBus } from './EventBus.js';
import { GameState } from '../state/GameState.js';

/**
 * Main game engine class that manages the game loop and state
 */
export class Game {
    /** @type {HTMLCanvasElement} */
    canvas;
    /** @type {CanvasRenderingContext2D} */
    context;
    /** @type {SceneManager} */
    sceneManager;
    /** @type {PhysicsEngine} */
    physicsEngine;
    /** @type {Input} */
    input;
    /** @type {HUD} */
    hud;
    /** @type {SaveSystem} */
    saveSystem;
    /** @type {GameState} */
    gameState;
    /** @type {number} */
    lastTime = 0;
    /** @type {number} */
    deltaTime = 0;
    /** @type {boolean} */
    isRunning = false;
    /** @type {boolean} */
    isPaused = false;
    /** @type {number} */
    targetFPS = 60;
    /** @type {number} */
    frameInterval = 1000 / 60;
    /** @type {number} */
    accumulatedTime = 0;
    /** @type {number} */
    fixedTimeStep = 1 / 60;
    /** @type {number} */
    maxFrameSkip = 5;

    /**
     * Create a new Game instance
     * @param {string} canvasId - ID of the canvas element
     * @param {HUD} [customHud] - Optional custom HUD instance
     */
    constructor(canvasId, customHud = null) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with ID ${canvasId} not found`);
        }
        
        this.context = this.canvas.getContext('2d');
        if (!this.context) {
            throw new Error('Could not get 2D rendering context');
        }
        
        // Initialize systems
        this.physicsEngine = new PhysicsEngine();
        this.input = new Input();
        this.hud = customHud || new HUD(); // Use custom HUD if provided
        this.sceneManager = new SceneManager(this.physicsEngine, this.hud);
        this.saveSystem = new SaveSystem();
        
        // Link physics engine to game instance
        this.physicsEngine.setGame(this);
        
        // Initialize game state
        this.initializeGameState();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize input
        this.input.initialize();
    }

    /**
     * Initialize the game state
     */
    initializeGameState() {
        const savedState = this.saveSystem.loadGame();
        this.gameState = savedState || new GameState();
        
        // Auto-save every 5 minutes
        setInterval(() => {
            this.saveSystem.saveGame(this.gameState);
        }, 300000);
    }

    /**
     * Set up event listeners for game events
     */
    setupEventListeners() {
        EventBus.on('restart_level', () => this.restartLevel());
        EventBus.on('player_death', () => this.handlePlayerDeath());
        EventBus.on('level_complete', () => this.handleLevelComplete());
    }

    /**
     * Start the game
     */
    startGame() {
        if (this.isRunning) return;
        
        console.log('[Game] startGame() called, starting game loop...');
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        // Start the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Pause the game
     */
    pauseGame() {
        if (!this.isRunning || this.isPaused) return;
        this.isPaused = true;
        console.log('[Game] Game paused');
    }

    /**
     * Resume the game
     */
    resumeGame() {
        if (!this.isRunning || !this.isPaused) return;
        this.isPaused = false;
        this.lastTime = performance.now(); // Reset time to avoid large delta
        console.log('[Game] Game resumed');
    }
    
    /**
     * Stop the game completely
     */
    stopGame() {
        console.log('[Game] Stopping game');
        this.isRunning = false;
        this.isPaused = false;
        
        // Clean up current scene
        if (this.sceneManager && this.sceneManager.currentScene) {
            this.sceneManager.currentScene.cleanup();
        }
    }

    /**
     * Restart the current level
     */
    async restartLevel() {
        console.log('[Game] Restarting level');
        await this.sceneManager.loadScene(
            this.gameState.currentScene,
            this.gameState.currentLevel
        );
        this.resumeGame();
    }

    /**
     * Return to the main menu
     */
    returnToMainMenu() {
        console.log('[Game] Returning to main menu');
        this.stopGame();
    }

    /**
     * Handle player death
     */
    handlePlayerDeath() {
        this.pauseGame();
    }

    /**
     * Handle level completion
     */
    handleLevelComplete() {
        const previousLevel = this.gameState.currentLevel;
        const previousScene = this.gameState.currentScene;
        
        this.gameState.currentLevel++;
        this.gameState.completedLevels = this.gameState.completedLevels || [];
        this.gameState.completedLevels.push(previousLevel);
        this.saveSystem.saveGame(this.gameState);
        
        // Determine which scene to load based on level
        let sceneName = this.gameState.currentScene;
        const nextLevel = this.gameState.currentLevel;
        
        // Scene transitions based on level ranges
        if (nextLevel >= 1 && nextLevel <= 10) {
            sceneName = 'earth';
        } else if (nextLevel >= 11 && nextLevel <= 25) {
            sceneName = 'sky';
        } else if (nextLevel >= 26 && nextLevel <= 45) {
            sceneName = 'space';
        } else if (nextLevel >= 46 && nextLevel <= 65) {
            sceneName = 'moon';
        } else if (nextLevel >= 66 && nextLevel <= 100) {
            sceneName = 'mars';
        }
        
        // Check if scene is changing (chapter transition)
        const isChapterTransition = previousScene !== sceneName;
        
        // Update current scene
        this.gameState.currentScene = sceneName;
        
        // Load next level or show completion screen
        if (nextLevel <= 100) {
            console.log(`[Game] Level ${previousLevel} complete! Loading ${sceneName} level ${nextLevel}`);
            
            if (isChapterTransition) {
                console.log(`[Game] CHAPTER TRANSITION: ${previousScene.toUpperCase()} → ${sceneName.toUpperCase()}`);
                // Add a brief delay for chapter transitions to show transition effect
                this.showChapterTransition(previousScene, sceneName, nextLevel);
            } else {
                this.sceneManager.loadScene(sceneName, nextLevel);
            }
        } else {
            // All levels completed
            console.log('Congratulations! All levels completed!');
            this.showGameComplete();
        }
    }
    
    /**
     * Show chapter transition effect
     * @param {string} fromScene - Previous scene name
     * @param {string} toScene - Next scene name
     * @param {number} level - Level number
     */
    showChapterTransition(fromScene, toScene, level) {
        // Draw transition overlay
        const ctx = this.context;
        const canvas = this.canvas;
        
        // Chapter names
        const chapterNames = {
            'earth': 'CHAPTER 1: EARTH',
            'sky': 'CHAPTER 2: SKY - The Burning Ascent',
            'space': 'CHAPTER 3: SPACE',
            'moon': 'CHAPTER 4: MOON',
            'mars': 'CHAPTER 5: MARS'
        };
        
        let alpha = 0;
        const fadeIn = setInterval(() => {
            alpha += 0.05;
            
            // Draw fade overlay
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, alpha)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (alpha >= 1) {
                clearInterval(fadeIn);
                
                // Show chapter title
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Chapter title
                ctx.fillStyle = '#FF6600';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(chapterNames[toScene] || toScene.toUpperCase(), canvas.width / 2, canvas.height / 2 - 30);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '24px Arial';
                ctx.fillText(`Level ${level}`, canvas.width / 2, canvas.height / 2 + 20);
                
                ctx.fillStyle = '#AAAAAA';
                ctx.font = '18px Arial';
                ctx.fillText('Get ready...', canvas.width / 2, canvas.height / 2 + 60);
                
                // Load scene after showing title
                setTimeout(() => {
                    this.sceneManager.loadScene(toScene, level);
                }, 2000);
            }
        }, 50);
    }
    
    /**
     * Show game complete screen
     */
    showGameComplete() {
        const ctx = this.context;
        const canvas = this.canvas;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 CONGRATULATIONS! 🎉', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '28px Arial';
        ctx.fillText('You completed all 100 levels!', canvas.width / 2, canvas.height / 2 + 10);
        
        ctx.fillStyle = '#00FF00';
        ctx.font = '20px Arial';
        ctx.fillText('Earth → Sky → Space → Moon → Mars', canvas.width / 2, canvas.height / 2 + 50);
        
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '16px Arial';
        ctx.fillText('Press F5 to play again', canvas.width / 2, canvas.height / 2 + 100);
    }

    /**
     * Main game loop
     * @param {number} currentTime - Current timestamp
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Debug: log game loop running
        if (Math.random() < 0.02) {
            console.log('[Game] gameLoop running, isRunning:', this.isRunning, 'isPaused:', this.isPaused);
        }
        
        // Calculate delta time
        this.deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Fixed timestep for physics
        this.accumulatedTime += this.deltaTime;
        let frameCount = 0;
        
        // Process multiple fixed updates per frame if needed
        while (this.accumulatedTime >= this.fixedTimeStep && frameCount < this.maxFrameSkip) {
            this.update(this.fixedTimeStep);
            this.accumulatedTime -= this.fixedTimeStep;
            frameCount++;
        }
        
        // Render (always called once per frame)
        this.render();
        
        // Continue the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (this.isPaused) return;
        
        // Update input
        this.input.update();
        
        // Update scene
        this.sceneManager.update(deltaTime);
        
        // Update HUD with game state
        this.hud.update(this.gameState);
        
        // Debug: log update loop running
        if (Math.random() < 0.01) {
            console.log('[Game] Update loop running, scene:', this.gameState.currentScene);
        }
    }

    /**
     * Render the game
     */
    render() {
        if (this.isPaused) return;
        
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render scene
        this.sceneManager.render();
        
        // Render HUD
        this.hud.render(this.context);
    }

    /**
     * Load a specific level
     * @param {string} sceneName - Name of the scene
     * @param {number} levelId - ID of the level to load
     */
    async loadLevel(sceneName, levelId) {
        this.gameState.currentScene = sceneName;
        this.gameState.currentLevel = levelId;
        
        await this.sceneManager.loadScene(sceneName, levelId);
        this.resumeGame();
    }

    /**
     * Resize the canvas to match window size
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Notify systems about resize
        this.hud.resize(this.canvas.width, this.canvas.height);
        
        // Notify scene manager about resize
        this.sceneManager.resize(this.canvas.width, this.canvas.height);
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.isRunning = false;
        this.physicsEngine.clear();
        this.saveSystem.saveGame(this.gameState);
    }
}
