/**
 * SaveSystem.js - Game save/load functionality
 *
 * This module handles saving and loading game state using localStorage.
 */

/**
 * Save system for persisting game state
 */
export class SaveSystem {
    /** @type {string} */
    saveKey = 'orbitBreakerSave';

    /**
     * Save game state
     * @param {GameState} gameState - Game state to save
     */
    saveGame(gameState) {
        try {
            const saveData = {
                currentScene: gameState.currentScene,
                currentLevel: gameState.currentLevel,
                completedLevels: gameState.completedLevels,
                highScore: gameState.highScore,
                totalScore: gameState.totalScore,
                totalTimePlayed: gameState.totalTimePlayed,
                playerStats: gameState.playerStats,
                settings: gameState.settings,
                lastSaveTime: Date.now()
            };

            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    /**
     * Load game state
     * @returns {GameState|null} Loaded game state or null if not found
     */
    loadGame() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (!saveData) {
                return null;
            }

            const parsedData = JSON.parse(saveData);
            return {
                currentScene: parsedData.currentScene || 'earth',
                currentLevel: parsedData.currentLevel || 1,
                completedLevels: parsedData.completedLevels || [],
                highScore: parsedData.highScore || 0,
                totalScore: parsedData.totalScore || 0,
                totalTimePlayed: parsedData.totalTimePlayed || 0,
                playerStats: parsedData.playerStats || {
                    health: 100,
                    maxHealth: 100,
                    score: 0,
                    fuel: 100,
                    maxFuel: 100
                },
                settings: parsedData.settings || {
                    musicVolume: 0.5,
                    sfxVolume: 0.7,
                    controls: 'keyboard',
                    fullscreen: false
                },
                lastSaveTime: parsedData.lastSaveTime || 0
            };
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    /**
     * Delete saved game
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    }

    /**
     * Check if a saved game exists
     * @returns {boolean}
     */
    hasSave() {
        try {
            return localStorage.getItem(this.saveKey) !== null;
        } catch (error) {
            console.error('Failed to check for save:', error);
            return false;
        }
    }

    /**
     * Get save file size
     * @returns {number} Size in bytes
     */
    getSaveSize() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (!saveData) {
                return 0;
            }
            return JSON.stringify(saveData).length;
        } catch (error) {
            console.error('Failed to get save size:', error);
            return 0;
        }
    }
}
