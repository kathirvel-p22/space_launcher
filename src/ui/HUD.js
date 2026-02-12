/**
 * HUD.js - Heads-up display (health, score, level display)
 * 
 * This module implements the game's heads-up display showing health,
 * score, level information, and objectives.
 */

import { EventBus } from '../core/EventBus.js';

/**
 * Heads-up display for the game
 */
export class HUD {
    /** @type {HTMLDivElement} */
    healthBar;
    /** @type {HTMLDivElement} */
    scoreValue;
    /** @type {HTMLDivElement} */
    levelValue;
    /** @type {HTMLDivElement} */
    timeValue;

    /**
     * Create a new HUD
     * @param {Object} elements - DOM elements for HUD
     * @param {HTMLDivElement} elements.healthBar - Health bar element
     * @param {HTMLDivElement} elements.scoreValue - Score value element
     * @param {HTMLDivElement} elements.levelValue - Level value element
     * @param {HTMLDivElement} elements.timeValue - Time value element
     */
    constructor(elements = {}) {
        this.healthBar = elements.healthBar;
        this.scoreValue = elements.scoreValue;
        this.levelValue = elements.levelValue;
        this.timeValue = elements.timeValue;
        
        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        EventBus.on('player_death', () => this.handlePlayerDeath());
        EventBus.on('level_complete', () => this.handleLevelComplete());
    }

    /**
     * Handle player death
     */
    handlePlayerDeath() {
        // Visual feedback for player death
        // No DOM manipulation needed - handled by CSS animations
    }

    /**
     * Handle level completion
     */
    handleLevelComplete() {
        // Visual feedback for level completion
        // No DOM manipulation needed - handled by CSS animations
    }

    /**
     * Update the HUD with game state
     * @param {Object} gameState - Current game state
     */
    update(gameState) {
        // Update health bar
        if (gameState && gameState.playerStats) {
            const healthPercentage = (gameState.playerStats.health / gameState.playerStats.maxHealth) * 100;
            if (this.healthBar) {
                this.healthBar.style.width = `${healthPercentage}%`;
            }
        }
        
        // Update score
        if (gameState && gameState.playerStats) {
            if (this.scoreValue) {
                this.scoreValue.textContent = gameState.playerStats.score || 0;
            }
        }
        
        // Update level
        if (gameState && gameState.currentLevel !== undefined) {
            if (this.levelValue) {
                this.levelValue.textContent = gameState.currentLevel || 1;
            }
        }
        
        // Update time
        if (gameState && gameState.time !== undefined) {
            const minutes = Math.floor(gameState.time / 60);
            const seconds = Math.floor(gameState.time % 60);
            if (this.timeValue) {
                this.timeValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }

    /**
     * Render the HUD (canvas-based rendering)
     * @param {CanvasRenderingContext2D} context - Canvas rendering context
     */
    render(context) {
        // Canvas-based HUD rendering
        const canvas = context.canvas;
        
        // Health bar
        context.fillStyle = '#ff4444';
        context.fillRect(20, 20, 200, 20);
        context.fillStyle = '#ffaaaa';
        context.fillRect(20, 20, 200, 20);
        
        // Score
        context.fillStyle = '#ffffff';
        context.font = '20px Arial';
        context.fillText(`Score: ${this.scoreValue.textContent}`, 20, 90);
        
        // Level
        context.fillText(`Level: ${this.levelValue.textContent}`, 20, 120);
        
        // Time
        context.fillText(`Time: ${this.timeValue.textContent}`, 20, 150);
    }

    /**
     * Resize the HUD
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // No DOM manipulation needed - CSS handles responsiveness
    }

    /**
     * Clean up HUD elements
     */
    cleanup() {
        // No cleanup needed - elements are managed by HTML
    }
}
