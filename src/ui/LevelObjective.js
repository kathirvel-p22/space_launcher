/**
 * LevelObjective.js - Display level objectives and completion animations
 */

export class LevelObjective {
    constructor() {
        this.objectiveElement = null;
        this.completionElement = null;
        this.createElements();
    }
    
    /**
     * Create DOM elements for objectives and completion
     */
    createElements() {
        // Create objective display
        this.objectiveElement = document.createElement('div');
        this.objectiveElement.id = 'levelObjective';
        this.objectiveElement.style.cssText = `
            position: fixed;
            top: 15px;
            right: 15px;
            background: rgba(10, 10, 30, 0.92);
            backdrop-filter: blur(8px);
            border: 2px solid #E8A33C;
            border-radius: 8px;
            padding: 12px 20px;
            z-index: 100;
            display: none;
            text-align: left;
            box-shadow: 0 3px 15px rgba(0, 0, 0, 0.7), 0 0 15px rgba(232, 163, 60, 0.4);
            min-width: 220px;
            max-width: 280px;
            pointer-events: none;
        `;
        this.objectiveElement.innerHTML = `
            <div style="font-size: 10px; color: rgba(255, 255, 255, 0.6); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">🎯 OBJECTIVE</div>
            <div id="objectiveText" style="font-size: 14px; color: #E8A33C; font-weight: bold; text-shadow: 0 0 8px rgba(232, 163, 60, 0.4); line-height: 1.3;"></div>
            <div id="objectiveProgress" style="font-size: 13px; color: #00FFFF; margin-top: 6px; font-weight: 500;"></div>
        `;
        document.body.appendChild(this.objectiveElement);
        
        // Create completion animation
        this.completionElement = document.createElement('div');
        this.completionElement.id = 'levelCompletion';
        this.completionElement.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 600;
            animation: fadeIn 0.3s ease;
        `;
        this.completionElement.innerHTML = `
            <div style="text-align: center; animation: slideInScale 0.5s ease;">
                <div id="completionTitle" style="font-size: 64px; font-weight: bold; color: #4AFF4A; text-shadow: 0 0 30px rgba(74, 255, 74, 0.8); margin-bottom: 20px; animation: glow 1.5s infinite;">
                    LEVEL COMPLETE!
                </div>
                <div id="completionStats" style="background: rgba(10, 10, 30, 0.9); border: 2px solid #4AFF4A; border-radius: 15px; padding: 30px; margin: 20px auto; max-width: 500px;">
                    <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                        <span style="color: rgba(255, 255, 255, 0.7); font-size: 18px;">Score:</span>
                        <span id="completionScore" style="color: #00FFFF; font-size: 22px; font-weight: bold;">0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                        <span style="color: rgba(255, 255, 255, 0.7); font-size: 18px;">Time:</span>
                        <span id="completionTime" style="color: #E8A33C; font-size: 22px; font-weight: bold;">0:00</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 15px 0;">
                        <span style="color: rgba(255, 255, 255, 0.7); font-size: 18px;">Bonus:</span>
                        <span id="completionBonus" style="color: #FFD700; font-size: 22px; font-weight: bold;">+0</span>
                    </div>
                </div>
                <div style="margin-top: 30px; font-size: 16px; color: rgba(255, 255, 255, 0.7);">
                    Loading next level...
                </div>
            </div>
        `;
        document.body.appendChild(this.completionElement);
        
        // Add CSS animations
        this.addAnimations();
    }
    
    /**
     * Add CSS animations
     */
    addAnimations() {
        if (!document.querySelector('style[data-level-objective-animations]')) {
            const style = document.createElement('style');
            style.setAttribute('data-level-objective-animations', 'true');
            style.textContent = `
                @keyframes slideInScale {
                    from {
                        transform: scale(0.5) translateY(-100px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes glow {
                    0%, 100% { 
                        text-shadow: 0 0 30px rgba(74, 255, 74, 0.8);
                        transform: scale(1);
                    }
                    50% { 
                        text-shadow: 0 0 50px rgba(74, 255, 74, 1);
                        transform: scale(1.05);
                    }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Show level objective
     * @param {Object} objective - Objective data
     */
    showObjective(objective) {
        console.log('[LevelObjective] Showing objective:', objective);
        
        const textEl = document.getElementById('objectiveText');
        const progressEl = document.getElementById('objectiveProgress');
        
        if (textEl) {
            if (objective.type === 'score') {
                textEl.textContent = `Reach ${objective.target} points`;
            } else if (objective.type === 'survive') {
                textEl.textContent = `Survive for ${objective.time} seconds`;
            } else if (objective.type === 'altitude') {
                textEl.textContent = `Reach altitude ${objective.target}m`;
            } else if (objective.type === 'destroy') {
                textEl.textContent = `Destroy ${objective.target} enemies`;
            }
        }
        
        if (progressEl) {
            progressEl.textContent = 'Starting...';
        }
        
        // Make sure it's visible
        this.objectiveElement.style.display = 'block';
        this.objectiveElement.style.opacity = '1';
        this.objectiveElement.style.visibility = 'visible';
        
        console.log('[LevelObjective] Objective element displayed:', this.objectiveElement.style.display);
        
        // Keep visible for 10 seconds, then fade to 70%
        setTimeout(() => {
            if (this.objectiveElement) {
                this.objectiveElement.style.opacity = '0.7';
                this.objectiveElement.style.transition = 'opacity 0.5s ease';
            }
        }, 10000);
    }
    
    /**
     * Update objective progress
     * @param {number} current - Current progress
     * @param {number} target - Target value
     */
    updateProgress(current, target) {
        const progressEl = document.getElementById('objectiveProgress');
        if (progressEl) {
            const percentage = Math.min(100, (current / target) * 100);
            progressEl.textContent = `${Math.round(current)} / ${target} (${Math.round(percentage)}%)`;
            
            // Make objective visible again when progress updates
            if (this.objectiveElement) {
                this.objectiveElement.style.opacity = '1';
                this.objectiveElement.style.display = 'block';
                this.objectiveElement.style.visibility = 'visible';
            }
        }
    }
    
    /**
     * Hide objective display
     */
    hideObjective() {
        if (this.objectiveElement) {
            this.objectiveElement.style.display = 'none';
        }
    }
    
    /**
     * Show level completion animation
     * @param {Object} stats - Completion statistics
     * @param {Function} callback - Callback after animation
     */
    showCompletion(stats, callback) {
        const scoreEl = document.getElementById('completionScore');
        const timeEl = document.getElementById('completionTime');
        const bonusEl = document.getElementById('completionBonus');
        
        if (scoreEl) {
            this.animateNumber(scoreEl, 0, stats.score || 0, 1000);
        }
        
        if (timeEl) {
            timeEl.textContent = this.formatTime(stats.time || 0);
        }
        
        if (bonusEl) {
            const bonus = this.calculateBonus(stats);
            this.animateNumber(bonusEl, 0, bonus, 1000, '+');
        }
        
        this.completionElement.style.display = 'flex';
        
        // Play success sound (if available)
        this.playSuccessSound();
        
        // Auto-advance after 3 seconds
        setTimeout(() => {
            this.hideCompletion();
            if (callback) callback();
        }, 3000);
    }
    
    /**
     * Hide completion animation
     */
    hideCompletion() {
        if (this.completionElement) {
            this.completionElement.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                this.completionElement.style.display = 'none';
                this.completionElement.style.animation = '';
            }, 300);
        }
    }
    
    /**
     * Calculate bonus points
     * @param {Object} stats - Level statistics
     * @returns {number} Bonus points
     */
    calculateBonus(stats) {
        let bonus = 0;
        
        // Time bonus (faster = more bonus)
        if (stats.time < 30) bonus += 500;
        else if (stats.time < 60) bonus += 300;
        else if (stats.time < 90) bonus += 100;
        
        // Health bonus
        if (stats.health >= 80) bonus += 200;
        else if (stats.health >= 50) bonus += 100;
        
        // Accuracy bonus
        if (stats.accuracy >= 90) bonus += 300;
        else if (stats.accuracy >= 70) bonus += 150;
        
        return bonus;
    }
    
    /**
     * Animate number counting
     * @param {HTMLElement} element - Element to animate
     * @param {number} from - Starting value
     * @param {number} to - Ending value
     * @param {number} duration - Animation duration in ms
     * @param {string} prefix - Prefix for number (e.g., '+')
     */
    animateNumber(element, from, to, duration, prefix = '') {
        const startTime = performance.now();
        const difference = to - from;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + difference * easeOut);
            
            element.textContent = prefix + current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
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
     * Play success sound
     */
    playSuccessSound() {
        // Try to play success sound if available
        try {
            const audio = new Audio('assets/audio/level_complete.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Ignore if sound fails to play
            });
        } catch (e) {
            // Ignore sound errors
        }
    }
    
    /**
     * Clean up
     */
    cleanup() {
        if (this.objectiveElement) {
            this.objectiveElement.remove();
        }
        if (this.completionElement) {
            this.completionElement.remove();
        }
    }
}
