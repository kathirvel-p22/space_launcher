/**
 * GameState.js - Game state management
 *
 * This module manages the game state including player progress,
 * completed levels, and game settings.
 */

/**
 * Game state class that tracks player progress and game settings
 */
export class GameState {
    /** @type {string} */
    currentScene = 'earth';
    /** @type {number} */
    currentLevel = 1;
    /** @type {Array<number>} */
    completedLevels = [];
    /** @type {number} */
    highScore = 0;
    /** @type {number} */
    totalScore = 0;
    /** @type {number} */
    totalTimePlayed = 0;
    /** @type {Object} */
    playerStats = {
        health: 100,
        maxHealth: 100,
        score: 0,
        fuel: 100,
        maxFuel: 100
    };
    /** @type {Object} */
    settings = {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        controls: 'keyboard',
        fullscreen: false
    };
    /** @type {number} */
    lastSaveTime = 0;

    /**
     * Create a new GameState instance
     * @param {Object} [initialState] - Initial state to load
     */
    constructor(initialState = {}) {
        Object.assign(this, initialState);
    }

    /**
     * Update player stats
     * @param {Object} stats - Player stats to update
     */
    updatePlayerStats(stats) {
        this.playerStats = { ...this.playerStats, ...stats };
    }

    /**
     * Mark a level as completed
     * @param {number} levelId - Level ID to mark as completed
     */
    completeLevel(levelId) {
        if (!this.completedLevels.includes(levelId)) {
            this.completedLevels.push(levelId);
            this.completedLevels.sort((a, b) => a - b);
        }
    }

    /**
     * Check if a level is completed
     * @param {number} levelId - Level ID to check
     * @returns {boolean}
     */
    isLevelCompleted(levelId) {
        return this.completedLevels.includes(levelId);
    }

    /**
     * Update high score
     * @param {number} score - New score
     */
    updateHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
        }
    }

    /**
     * Update total score
     * @param {number} score - Score to add
     */
    addToTotalScore(score) {
        this.totalScore += score;
        this.updateHighScore(this.totalScore);
    }

    /**
     * Update total time played
     * @param {number} seconds - Seconds to add
     */
    addToTotalTime(seconds) {
        this.totalTimePlayed += seconds;
    }

    /**
     * Update settings
     * @param {Object} newSettings - Settings to update
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Clone the game state
     * @returns {GameState}
     */
    clone() {
        return new GameState(JSON.parse(JSON.stringify(this)));
    }

    /**
     * Reset game state
     */
    reset() {
        this.currentScene = 'earth';
        this.currentLevel = 1;
        this.completedLevels = [];
        this.highScore = 0;
        this.totalScore = 0;
        this.totalTimePlayed = 0;
        this.playerStats = {
            health: 100,
            maxHealth: 100,
            score: 0,
            fuel: 100,
            maxFuel: 100
        };
        this.lastSaveTime = 0;
    }
}
