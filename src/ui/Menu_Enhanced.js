/**
 * Menu_Enhanced.js - Enhanced menu system with full functionality
 * 
 * Handles all menu screens: main menu, pause, game over, victory, level select
 */

export class MenuEnhanced {
    constructor(elements) {
        this.elements = elements || {};
        
        // Get menu elements
        this.mainMenu = document.getElementById('mainMenu');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.victoryScreen = document.getElementById('victoryScreen');
        this.levelSelectMenu = document.getElementById('levelSelectMenu');
        this.chapterTransition = document.getElementById('chapterTransition');
        
        // Initialize
        this.currentMenu = null;
        this.setupLevelSelect();
    }
    
    /**
     * Show main menu
     */
    showMainMenu() {
        this.hideAll();
        if (this.mainMenu) {
            this.mainMenu.style.display = 'flex';
            this.currentMenu = 'main';
        }
    }
    
    /**
     * Hide main menu
     */
    hideMainMenu() {
        if (this.mainMenu) {
            this.mainMenu.style.display = 'none';
        }
    }
    
    /**
     * Show pause menu
     */
    showPauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.style.display = 'flex';
            this.currentMenu = 'pause';
        }
    }
    
    /**
     * Hide pause menu
     */
    hidePauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.style.display = 'none';
        }
    }
    
    /**
     * Show game over screen
     * @param {Object} stats - Game statistics
     */
    showGameOver(stats = {}) {
        if (this.gameOverScreen) {
            // Update stats
            const finalScore = document.getElementById('finalScore');
            const finalLevel = document.getElementById('finalLevel');
            const finalTime = document.getElementById('finalTime');
            
            if (finalScore) finalScore.textContent = stats.score || 0;
            if (finalLevel) finalLevel.textContent = stats.level || 1;
            if (finalTime) finalTime.textContent = this.formatTime(stats.time || 0);
            
            this.gameOverScreen.style.display = 'flex';
            this.currentMenu = 'gameover';
        }
    }
    
    /**
     * Hide game over screen
     */
    hideGameOver() {
        if (this.gameOverScreen) {
            this.gameOverScreen.style.display = 'none';
        }
    }
    
    /**
     * Show victory screen
     * @param {Object} stats - Level completion statistics
     */
    showVictory(stats = {}) {
        if (this.victoryScreen) {
            // Update stats
            const victoryScore = document.getElementById('victoryScore');
            const victoryTime = document.getElementById('victoryTime');
            const victoryAccuracy = document.getElementById('victoryAccuracy');
            
            if (victoryScore) victoryScore.textContent = stats.score || 0;
            if (victoryTime) victoryTime.textContent = this.formatTime(stats.time || 0);
            if (victoryAccuracy) {
                const accuracy = stats.accuracy || 100;
                victoryAccuracy.textContent = `${Math.round(accuracy)}%`;
            }
            
            this.victoryScreen.style.display = 'flex';
            this.currentMenu = 'victory';
        }
    }
    
    /**
     * Hide victory screen
     */
    hideVictory() {
        if (this.victoryScreen) {
            this.victoryScreen.style.display = 'none';
        }
    }
    
    /**
     * Show level select menu
     */
    showLevelSelect() {
        this.hideAll();
        if (this.levelSelectMenu) {
            this.levelSelectMenu.style.display = 'flex';
            this.currentMenu = 'levelselect';
        }
    }
    
    /**
     * Hide level select menu
     */
    hideLevelSelect() {
        if (this.levelSelectMenu) {
            this.levelSelectMenu.style.display = 'none';
        }
    }
    
    /**
     * Setup level select menu with all levels
     */
    setupLevelSelect() {
        const container = document.getElementById('levelSelectButtons');
        if (!container) return;
        
        // Define chapters and their level ranges
        const chapters = [
            { name: 'Earth', subtitle: 'The Beginning', range: [1, 10], color: '#4AFF4A' },
            { name: 'Sky', subtitle: 'The Burning Ascent', range: [11, 25], color: '#FF8800' },
            { name: 'Space', subtitle: 'Silent Drift', range: [26, 45], color: '#00BFFF' },
            { name: 'Moon', subtitle: 'Low Gravity Nightmare', range: [46, 65], color: '#CCCCCC' },
            { name: 'Mars', subtitle: 'The Red Apocalypse', range: [66, 100], color: '#FF4444' }
        ];
        
        container.innerHTML = '';
        
        chapters.forEach(chapter => {
            // Chapter header
            const chapterHeader = document.createElement('div');
            chapterHeader.style.cssText = `
                margin: 20px 0 10px 0;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border-left: 4px solid ${chapter.color};
                border-radius: 4px;
            `;
            chapterHeader.innerHTML = `
                <div style="font-size: 18px; font-weight: bold; color: ${chapter.color};">
                    ${chapter.name}
                </div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                    ${chapter.subtitle}
                </div>
            `;
            container.appendChild(chapterHeader);
            
            // Level buttons container
            const levelsContainer = document.createElement('div');
            levelsContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                gap: 8px;
                margin-bottom: 10px;
            `;
            
            // Create level buttons
            for (let level = chapter.range[0]; level <= chapter.range[1]; level++) {
                const button = document.createElement('button');
                button.className = 'menu-button-secondary menu-button';
                button.textContent = level;
                button.style.cssText = `
                    padding: 12px;
                    font-size: 16px;
                    min-width: 60px;
                `;
                button.dataset.level = level;
                button.dataset.scene = this.getSceneForLevel(level);
                
                // Highlight milestone levels
                if (level % 5 === 0) {
                    button.style.borderColor = chapter.color;
                    button.style.fontWeight = 'bold';
                }
                
                levelsContainer.appendChild(button);
            }
            
            container.appendChild(levelsContainer);
        });
    }
    
    /**
     * Get scene name for a level
     * @param {number} level - Level number
     * @returns {string} Scene name
     */
    getSceneForLevel(level) {
        if (level >= 1 && level <= 10) return 'earth';
        if (level >= 11 && level <= 25) return 'sky';
        if (level >= 26 && level <= 45) return 'space';
        if (level >= 46 && level <= 65) return 'moon';
        if (level >= 66) return 'mars';
        return 'earth';
    }
    
    /**
     * Show chapter transition
     * @param {number} chapterNum - Chapter number
     * @param {string} title - Chapter title
     * @param {string} subtitle - Chapter subtitle
     * @param {number} duration - Display duration in ms
     */
    showChapterTransition(chapterNum, title, subtitle, duration = 3000) {
        if (!this.chapterTransition) return;
        
        const chapterNumEl = document.getElementById('chapterNum');
        const chapterTitleEl = document.getElementById('chapterTitle');
        const chapterSubtitleEl = document.getElementById('chapterSubtitle');
        
        if (chapterNumEl) chapterNumEl.textContent = chapterNum;
        if (chapterTitleEl) chapterTitleEl.textContent = title;
        if (chapterSubtitleEl) chapterSubtitleEl.textContent = subtitle;
        
        this.chapterTransition.style.display = 'flex';
        
        setTimeout(() => {
            this.hideChapterTransition();
        }, duration);
    }
    
    /**
     * Hide chapter transition
     */
    hideChapterTransition() {
        if (this.chapterTransition) {
            this.chapterTransition.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => {
                this.chapterTransition.style.display = 'none';
                this.chapterTransition.style.animation = '';
            }, 500);
        }
    }
    
    /**
     * Hide all menus
     */
    hideAll() {
        this.hideMainMenu();
        this.hidePauseMenu();
        this.hideGameOver();
        this.hideVictory();
        this.hideLevelSelect();
        this.hideChapterTransition();
        this.currentMenu = null;
    }
    
    /**
     * Check if any menu is currently visible
     * @returns {boolean}
     */
    isAnyMenuVisible() {
        return this.currentMenu !== null;
    }
    
    /**
     * Get current visible menu
     * @returns {string|null}
     */
    getCurrentMenu() {
        return this.currentMenu;
    }
    
    /**
     * Format time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string}
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Show loading indicator
     * @param {string} message - Loading message
     */
    showLoading(message = 'Loading...') {
        const statusEl = document.getElementById('startStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.display = 'block';
            statusEl.className = 'status-message status-info';
        }
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        const statusEl = document.getElementById('startStatus');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorEl = document.getElementById('startError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }
    
    /**
     * Hide error message
     */
    hideError() {
        const errorEl = document.getElementById('startError');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
    
    /**
     * Enable/disable button
     * @param {string} buttonId - Button element ID
     * @param {boolean} enabled - Whether to enable the button
     */
    setButtonEnabled(buttonId, enabled) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = !enabled;
        }
    }
    
    /**
     * Clean up menu resources
     */
    cleanup() {
        this.hideAll();
    }
}
