/**
 * EventBus.js - Global event system
 *
 * This module implements a publish-subscribe event system for
 * communication between different parts of the game.
 */

/**
 * Global event bus for game-wide communication
 */
class EventBus {
    /** @type {Object<string, Array<Function>>} */
    static listeners = {};

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function
     */
    static on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Callback function to remove
     */
    static off(eventName, callback) {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = this.listeners[eventName].filter(
                (listener) => listener !== callback
            );
        }
    }

    /**
     * Emit an event
     * @param {string} eventName - Name of the event
     * @param {...any} args - Arguments to pass to callbacks
     */
    static emit(eventName, ...args) {
        if (this.listeners[eventName]) {
            this.listeners[eventName].forEach((callback) => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     * @param {string} eventName - Name of the event
     */
    static clear(eventName) {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
    }

    /**
     * Remove all listeners
     */
    static clearAll() {
        this.listeners = {};
    }
}

/**
 * Export the EventBus class
 * @type {EventBus}
 */
export { EventBus };
