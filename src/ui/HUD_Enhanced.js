import { LevelObjective } from './LevelObjective.js';

/**
 * HUD_Enhanced.js - Enhanced Heads-Up Display with full functionality
 * 
 * Displays game information including health, fuel, score, level, time, and notifications
 */

export class HUDEnhanced {
    constructor(elements) {
        this.elements = elements || {};
        this.isVisible = false;
        this.notifications = [];
        this.animationFrames = new Map();
        this.levelObjective = new LevelObjective();
        
        // Get DOM elements
        this.hudContainer = document.getElementById('hud');
        this.healthBar = document.getElementById('healthBar');
        this.fuelBar = document.getElementById('fuelBar');
        this.scoreValue = document.getElementById('scoreValue');
        this.levelValue = document.getElementById('levelValue');
        this.timeValue = document.getElementById('timeValue');
        
        // Get bar fill elements
        this.healthBarFill = this.healthBar?.querySelector('.health-bar-fill');
        this.healthBarText = this.healthBar?.querySelector('.health-bar-text');
        this.fuelBarFill = this.fuelBar?.querySelector('.fuel-bar-fill');
        this.fuelBarText = this.fuelBar?.querySelector('.fuel-bar-text');
        
        // Initialize
        this.hide();
    }
    
    /**
     * Show the HUD
     */
    show() {
        if (this.hudContainer) {
            this.hudContainer.style.display = 'grid';
            this.isVisible = true;
        }
    }
    
    /**
     * Hide the HUD
     */
    hide() {
        if (this.hudContainer) {
            this.hudContainer.style.display = 'none';
            this.isVisible = false;
        }
    }
    
    /**
     * Update HUD with game state
     * @param {Object} data - Game state data
     */
    update(data) {
        if (!this.isVisible) return;
        
        // Update health
        if (data.playerStats) {
            this.updateHealth(data.playerStats.health, data.playerStats.maxHealth);
            
            // Also check for score in playerStats
            if (data.playerStats.score !== undefined) {
                this.updateScore(data.playerStats.score);
            }
        }
        
        // Update fuel (if applicable)
        if (data.fuel !== undefined) {
            this.updateFuel(data.fuel, data.maxFuel || 100);
        }
        
        // Update score (check both locations)
        if (data.score !== undefined) {
            this.updateScore(data.score);
        }
        
        // Update level
        if (data.currentLevel !== undefined) {
            this.updateLevel(data.currentLevel);
        }
        
        // Update time
        if (data.time !== undefined) {
            this.updateTime(data.time);
        }
    }
    
    /**
     * Update health bar
     * @param {number} current - Current health
     * @param {number} max - Maximum health
     */
    updateHealth(current, max) {
        if (!this.healthBarFill || !this.healthBarText) return;
        
        const percentage = Math.max(0, Math.min(100, (current / max) * 100));
        this.healthBarFill.style.width = `${percentage}%`;
        this.healthBarText.textContent = `${Math.round(current)} / ${Math.round(max)}`;
        
        // Change color based on health percentage
        if (percentage <= 25) {
            this.healthBarFill.style.background = 'linear-gradient(90deg, #ff0000 0%, #ff4444 100%)';
            this.healthBarFill.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.8)';
            this.pulseElement(this.healthBar);
        } else if (percentage <= 50) {
            this.healthBarFill.style.background = 'linear-gradient(90deg, #ff4444 0%, #ffc107 100%)';
            this.healthBarFill.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.6)';
        } else {
            this.healthBarFill.style.background = 'linear-gradient(90deg, #ffc107 0%, #4AFF4A 100%)';
            this.healthBarFill.style.boxShadow = '0 0 15px rgba(74, 255, 74, 0.5)';
        }
    }
    
    /**
     * Update fuel bar
     * @param {number} current - Current fuel
     * @param {number} max - Maximum fuel
     */
    updateFuel(current, max) {
        if (!this.fuelBarFill || !this.fuelBarText) return;
        
        // Show fuel bar
        if (this.fuelBar) {
            this.fuelBar.style.display = 'block';
        }
        
        const percentage = Math.max(0, Math.min(100, (current / max) * 100));
        this.fuelBarFill.style.width = `${percentage}%`;
        this.fuelBarText.textContent = `${Math.round(percentage)}%`;
        
        // Change color based on fuel percentage
        if (percentage <= 20) {
            this.fuelBarFill.style.background = 'linear-gradient(90deg, #ff4444 0%, #ff8800 100%)';
            this.fuelBarFill.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.8)';
            this.pulseElement(this.fuelBar);
        } else if (percentage <= 50) {
            this.fuelBarFill.style.background = 'linear-gradient(90deg, #ffc107 0%, #00d4ff 100%)';
            this.fuelBarFill.style.boxShadow = '0 0 15px rgba(255, 193, 7, 0.6)';
        } else {
            this.fuelBarFill.style.background = 'linear-gradient(90deg, #00d4ff 0%, #0099ff 100%)';
            this.fuelBarFill.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.5)';
        }
    }
    
    /**
     * Hide fuel bar
     */
    hideFuelBar() {
        if (this.fuelBar) {
            this.fuelBar.style.display = 'none';
        }
    }
    
    /**
     * Update score display
     * @param {number} score - Current score
     * @param {boolean} forceUpdate - Force immediate update without animation
     */
    updateScore(score, forceUpdate = false) {
        if (!this.scoreValue) return;
        
        const currentScore = parseInt(this.scoreValue.textContent) || 0;
        if (score !== currentScore) {
            if (forceUpdate) {
                this.scoreValue.textContent = score;
            } else {
                this.animateNumber(this.scoreValue, currentScore, score, 500);
            }
        }
    }
    
    /**
     * Update level display
     * @param {number} level - Current level
     */
    updateLevel(level) {
        if (!this.levelValue) return;
        this.levelValue.textContent = level;
    }
    
    /**
     * Update time display
     * @param {number} seconds - Time in seconds
     */
    updateTime(seconds) {
        if (!this.timeValue) return;
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        this.timeValue.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Show notification message
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(title, message, duration = 3000) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        document.body.appendChild(notification);
        this.notifications.push(notification);
        
        // Position notifications
        this.repositionNotifications();
        
        // Remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => {
                notification.remove();
                this.notifications = this.notifications.filter(n => n !== notification);
                this.repositionNotifications();
            }, 400);
        }, duration);
    }
    
    /**
     * Reposition stacked notifications
     */
    repositionNotifications() {
        this.notifications.forEach((notification, index) => {
            notification.style.top = `${100 + index * 80}px`;
        });
    }
    
    /**
     * Pulse animation for low health/fuel warning
     * @param {HTMLElement} element - Element to pulse
     */
    pulseElement(element) {
        if (!element || this.animationFrames.has(element)) return;
        
        element.style.animation = 'pulse 1s infinite';
        this.animationFrames.set(element, true);
        
        // Stop pulsing after a while
        setTimeout(() => {
            element.style.animation = '';
            this.animationFrames.delete(element);
        }, 3000);
    }
    
    /**
     * Animate number change
     * @param {HTMLElement} element - Element to animate
     * @param {number} from - Starting value
     * @param {number} to - Ending value
     * @param {number} duration - Animation duration in ms
     */
    animateNumber(element, from, to, duration) {
        const startTime = performance.now();
        const difference = to - from;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + difference * easeOut);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Show damage flash effect
     */
    showDamageFlash() {
        const damageIndicator = document.getElementById('damageIndicator');
        if (!damageIndicator) return;
        
        damageIndicator.style.display = 'block';
        damageIndicator.style.background = 'rgba(255, 0, 0, 0.3)';
        damageIndicator.style.animation = 'none';
        
        // Trigger reflow
        void damageIndicator.offsetWidth;
        
        damageIndicator.style.animation = 'fadeOut 0.5s ease';
        
        setTimeout(() => {
            damageIndicator.style.display = 'none';
        }, 500);
    }
    
    /**
     * Show level complete message
     * @param {Object} stats - Level completion stats
     * @param {Function} callback - Callback after animation
     */
    showLevelComplete(stats, callback) {
        this.levelObjective.showCompletion(stats, callback);
    }
    
    /**
     * Show level objective
     * @param {Object} objective - Level objective
     */
    showLevelObjective(objective) {
        this.levelObjective.showObjective(objective);
    }
    
    /**
     * Update objective progress
     * @param {number} current - Current progress
     * @param {number} target - Target value
     */
    updateObjectiveProgress(current, target) {
        this.levelObjective.updateProgress(current, target);
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
     * Reset HUD to initial state
     */
    reset() {
        this.updateHealth(100, 100);
        this.updateFuel(100, 100);
        this.updateScore(0, true); // Force immediate update without animation
        this.updateLevel(1);
        this.updateTime(0);
        
        // Clear notifications
        this.notifications.forEach(n => n.remove());
        this.notifications = [];
        
        // Clear animations
        this.animationFrames.clear();
        
        // Hide objective
        if (this.levelObjective) {
            this.levelObjective.hideObjective();
        }
    }
    
    /**
     * Resize handler (called when canvas resizes)
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // HUD is CSS-based and responsive, no action needed
        // This method exists for compatibility with Game.js
    }
    
    /**
     * Render method (for compatibility with Game.js)
     * HUD is CSS-based, so no canvas rendering needed
     * @param {CanvasRenderingContext2D} context - Canvas context (unused)
     */
    render(context) {
        // HUD is rendered via CSS/HTML, not canvas
        // This method exists for compatibility with Game.js
    }
    
    /**
     * Clean up HUD resources
     */
    cleanup() {
        this.hide();
        this.notifications.forEach(n => n.remove());
        this.notifications = [];
        this.animationFrames.clear();
        
        if (this.levelObjective) {
            this.levelObjective.cleanup();
        }
    }
}

// Add fadeOut animation to CSS if not present
if (!document.querySelector('style[data-hud-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-hud-animations', 'true');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
    `;
    document.head.appendChild(style);
}
