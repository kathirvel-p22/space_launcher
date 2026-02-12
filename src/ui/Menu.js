/**
 * Menu.js - Main menu and pause menu
 * 
 * This module implements the game's menu system including the main menu,
 * pause menu, and other UI menus.
 */

import { EventBus } from '../core/EventBus.js';

/**
 * Abstract base class for all menus
 */
export class Menu {
    /** @type {HTMLDivElement} */
    mainMenu;
    /** @type {HTMLDivElement} */
    pauseMenu;
    /** @type {HTMLDivElement} */
    gameOverScreen;
    /** @type {HTMLDivElement} */
    optionsMenu;
    /** @type {HTMLDivElement} */
    creditsMenu;
    /** @type {HTMLDivElement} */
    emergencyAlarm;
    /** @type {HTMLDivElement} */
    damageIndicator;

    /**
     * Create a new Menu
     * @param {Object} elements - DOM elements for menu
     */
    constructor(elements) {
        this.mainMenu = elements.mainMenu;
        this.pauseMenu = elements.pauseMenu;
        this.gameOverScreen = elements.gameOverScreen;
        this.optionsMenu = elements.optionsMenu;
        this.creditsMenu = elements.creditsMenu;
        this.emergencyAlarm = elements.emergencyAlarm;
        this.damageIndicator = elements.damageIndicator;
    }

    /**
     * Show the main menu
     */
    showMainMenu() {
        if (this.mainMenu) {
            this.mainMenu.style.display = 'flex';
        }
    }
    
    /**
     * Hide the main menu
     */
    hideMainMenu() {
        if (this.mainMenu) {
            this.mainMenu.style.display = 'none';
        }
    }

    /**
     * Show the pause menu
     */
    showPauseMenu() {
        this.pauseMenu.style.display = 'flex';
    }

    /**
     * Hide the pause menu
     */
    hidePauseMenu() {
        this.pauseMenu.style.display = 'none';
    }

    /**
     * Show the game over screen
     */
    showGameOverScreen() {
        this.gameOverScreen.style.display = 'flex';
    }

    /**
     * Hide the game over screen
     */
    hideGameOverScreen() {
        this.gameOverScreen.style.display = 'none';
    }

    /**
     * Show the options menu
     */
    showOptionsMenu() {
        if (this.optionsMenu) {
            this.optionsMenu.style.display = 'flex';
        }
    }
    
    /**
     * Hide the options menu
     */
    hideOptionsMenu() {
        if (this.optionsMenu) {
            this.optionsMenu.style.display = 'none';
        }
    }
    
    /**
     * Show the credits menu
     */
    showCreditsMenu() {
        if (this.creditsMenu) {
            this.creditsMenu.style.display = 'flex';
        }
    }
    
    /**
     * Hide the credits menu
     */
    hideCreditsMenu() {
        if (this.creditsMenu) {
            this.creditsMenu.style.display = 'none';
        }
    }

    /**
     * Show emergency alarm
     */
    showEmergencyAlarm() {
        this.emergencyAlarm.classList.add('active');
    }

    /**
     * Hide emergency alarm
     */
    hideEmergencyAlarm() {
        this.emergencyAlarm.classList.remove('active');
    }

    /**
     * Show damage indicator
     */
    showDamageIndicator() {
        this.damageIndicator.classList.add('active');
        setTimeout(() => {
            this.damageIndicator.classList.remove('active');
        }, 200);
    }

    /**
     * Hide damage indicator
     */
    hideDamageIndicator() {
        this.damageIndicator.classList.remove('active');
    }

    /**
     * Clean up the menu
     */
    cleanup() {
        // No cleanup needed - elements are managed by HTML
    }
}

// Menu classes removed - using HTML structure directly
