/**
 * Input.js - Keyboard controls
 * 
 * This module handles keyboard input for player controls and game actions.
 * It provides a unified interface for checking key states and handling input events.
 */

/**
 * Manages keyboard input for the game
 */
export class Input {
    /** @type {Object<string, boolean>} */
    keys = {};
    /** @type {Object<string, boolean>} */
    keyStates = {};
    /** @type {Object<string, boolean>} */
    keyJustPressed = {};
    /** @type {Object<string, boolean>} */
    keyJustReleased = {};

    /**
     * Initialize input handlers
     */
    initialize() {
        // Listen for keydown events
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Listen for keyup events
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        
        // Prevent default for game controls
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(key)) {
            event.preventDefault();
        }
        
        this.keys[key] = true;
        this.keyStates[key] = true;
        this.keyJustPressed[key] = true;
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        
        this.keys[key] = false;
        this.keyJustPressed[key] = false;
        this.keyJustReleased[key] = true;
    }

    /**
     * Update input state (call this every frame)
     */
    update() {
        // Reset just pressed/released states
        Object.keys(this.keyJustPressed).forEach(key => {
            this.keyJustPressed[key] = false;
        });
        
        Object.keys(this.keyJustReleased).forEach(key => {
            this.keyJustReleased[key] = false;
        });
    }

    /**
     * Check if a key is currently pressed
     * @param {string} key - Key to check
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] === true;
    }

    /**
     * Check if a key was just pressed this frame
     * @param {string} key - Key to check
     * @returns {boolean}
     */
    isKeyJustPressed(key) {
        return this.keyJustPressed[key.toLowerCase()] === true;
    }

    /**
     * Check if a key was just released this frame
     * @param {string} key - Key to check
     * @returns {boolean}
     */
    isKeyJustReleased(key) {
        return this.keyJustReleased[key.toLowerCase()] === true;
    }

    /**
     * Get all currently pressed keys
     * @returns {Array<string>}
     */
    getPressedKeys() {
        return Object.keys(this.keys).filter(key => this.keys[key]);
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}
