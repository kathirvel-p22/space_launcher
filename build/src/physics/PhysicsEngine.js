/**
 * PhysicsEngine.js - Main physics engine
 *
 * This module implements the main physics engine that manages
 * physics bodies, collisions, and updates.
 */

import { PhysicsBody } from './PhysicsBody.js';

/**
 * Main physics engine class
 */
export class PhysicsEngine {
    /** @type {Array<PhysicsBody>} */
    bodies = [];
    /** @type {number} */
    gravity = 0;
    /** @type {Object} */
    game = null;

    /**
     * Create a new PhysicsEngine instance
     * @param {Object} [game] - Game instance reference
     */
    constructor(game = null) {
        this.game = game;
    }

    /**
     * Set the game reference
     * @param {Object} game - Game instance
     */
    setGame(game) {
        this.game = game;
    }

    /**
     * Set gravity
     * @param {number} gravity - Gravity value
     */
    setGravity(gravity) {
        this.gravity = gravity;
    }

    /**
     * Add a physics body
     * @param {PhysicsBody} body - Physics body to add
     */
    addBody(body) {
        this.bodies.push(body);
    }

    /**
     * Remove a physics body
     * @param {PhysicsBody} body - Physics body to remove
     */
    removeBody(body) {
        this.bodies = this.bodies.filter(b => b !== body);
    }

    /**
     * Clear all physics bodies
     */
    clear() {
        this.bodies = [];
    }

    /**
     * Update all physics bodies
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        // Apply gravity to all bodies
        if (this.gravity !== 0) {
            this.bodies.forEach(body => {
                if (!body.isStatic) {
                    body.applyForce({
                        magnitude: this.gravity * body.mass,
                        direction: { x: 0, y: 1 },
                        type: 'gravity'
                    });
                }
            });
        }

        // Update all bodies
        this.bodies.forEach(body => {
            body.update(deltaTime);
        });

        // Check for collisions
        this.checkCollisions();
    }

    /**
     * Check for collisions between all bodies
     */
    checkCollisions() {
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const body1 = this.bodies[i];
                const body2 = this.bodies[j];

                if (body1.checkCollision(body2, body1.radius || 10, body2.radius || 10)) {
                    body1.handleCollision(body2, body1.radius || 10, body2.radius || 10);
                }
            }
        }
    }

    /**
     * Get all physics bodies
     * @returns {Array<PhysicsBody>}
     */
    getBodies() {
        return this.bodies;
    }

    /**
     * Get physics body by name
     * @param {string} name - Body name
     * @returns {PhysicsBody|null}
     */
    getBodyByName(name) {
        return this.bodies.find(body => body.name === name) || null;
    }

    /**
     * Clone the physics engine
     * @returns {PhysicsEngine}
     */
    clone() {
        const clone = new PhysicsEngine(this.game);
        clone.gravity = this.gravity;
        clone.bodies = this.bodies.map(body => body.clone());
        return clone;
    }
}
