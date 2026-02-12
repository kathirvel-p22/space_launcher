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
     */
    constructor(canvasId) {
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
        this.hud = new HUD();
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
    }

    /**
     * Resume the game
     */
    resumeGame() {
        if (!this.isRunning || !this.isPaused) return;
        this.isPaused = false;
    }

    /**
     * Restart the current level
     */
    async restartLevel() {
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
        this.isRunning = false;
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
        this.gameState.currentLevel++;
        this.gameState.completedLevels = this.gameState.completedLevels || [];
        this.gameState.completedLevels.push(this.gameState.currentLevel - 1);
        this.saveSystem.saveGame(this.gameState);
        
        // Load next level or show completion screen
        if (this.gameState.currentLevel < 100) {
            this.sceneManager.loadScene(
                this.gameState.currentScene,
                this.gameState.currentLevel
            );
        } else {
            // All levels completed
            // Show victory message or return to menu
            console.log('Congratulations! All levels completed!');
        }
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
