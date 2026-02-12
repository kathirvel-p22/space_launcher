/**
 * SceneManager.js - Scene transitions and loading
 * 
 * This module manages scene transitions, loading, and cleanup.
 * It handles the lifecycle of different game scenes (Earth, Sky, Space, etc.).
 */

import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import { LevelManager } from '../levels/LevelManager.js';
import { Scene } from './Scene.js';
import { EarthScene } from '../scenes/EarthScene.js';
import { SkyScene } from '../scenes/SkyScene.js';
import { SpaceScene } from '../scenes/SpaceScene.js';
import { MoonScene } from '../scenes/MoonScene.js';
import { MarsScene } from '../scenes/MarsScene.js';

/**
 * Manages scene transitions and loading
 */
export class SceneManager {
    /** @type {Scene | null} */
    currentScene = null;
    /** @type {Map<string, Scene>} */
    sceneMap = new Map();
    /** @type {PhysicsEngine} */
    physicsEngine;
    /** @type {LevelManager} */
    levelManager;

    /**
     * Create a new SceneManager instance
     * @param {PhysicsEngine} physicsEngine - The physics engine instance
     * @param {HUD} hud - The HUD instance
     */
    constructor(physicsEngine, hud = null) {
        this.physicsEngine = physicsEngine;
        this.levelManager = new LevelManager();
        this.hud = hud;
        this.initializeScenes();
    }

    /**
     * Initialize all available scenes
     */
    initializeScenes() {
        this.sceneMap.set('earth', new EarthScene(this.physicsEngine, this.levelManager));
        this.sceneMap.set('sky', new SkyScene(this.physicsEngine, this.levelManager));
        this.sceneMap.set('space', new SpaceScene(this.physicsEngine, this.levelManager));
        this.sceneMap.set('moon', new MoonScene(this.physicsEngine, this.levelManager));
        this.sceneMap.set('mars', new MarsScene(this.physicsEngine, this.levelManager));
    }

    /**
     * Load a scene with the specified level
     * @param {string} sceneName - Name of the scene to load
     * @param {number} levelId - ID of the level to load
     * @returns {Promise<void>}
     */
    async loadScene(sceneName, levelId) {
        console.log(`[SceneManager] Loading scene: ${sceneName}, level: ${levelId}`);
        
        if (!this.sceneMap.has(sceneName)) {
            throw new Error(`Scene ${sceneName} not found`);
        }
        
        // Clean up current scene
        if (this.currentScene) {
            console.log('[SceneManager] Cleaning up current scene');
            this.currentScene.cleanup();
        }
        
        // Load level data
        const levelConfig = await this.levelManager.loadLevel(levelId);
        console.log('[SceneManager] Level config loaded:', levelConfig);
        
        // Get the scene and reinitialize it
        const scene = this.sceneMap.get(sceneName);
        if (scene) {
            console.log(`[SceneManager] Initializing ${sceneName} scene`);
            scene.initialize(levelConfig);
            this.currentScene = scene;
            console.log('[SceneManager] Scene loaded successfully');
        }
    }

    /**
     * Update the current scene
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }

    /**
     * Render the current scene
     */
    render() {
        if (this.currentScene) {
            this.currentScene.render();
        }
    }

    /**
     * Get the current scene
     * @returns {Scene | null}
     */
    getCurrentScene() {
        return this.currentScene;
    }

    /**
     * Check if a scene exists
     * @param {string} sceneName - Name of the scene to check
     * @returns {boolean}
     */
    hasScene(sceneName) {
        return this.sceneMap.has(sceneName);
    }

    /**
     * Resize all scenes
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        if (this.currentScene && this.currentScene.resize) {
            this.currentScene.resize(width, height);
        }
    }
}
