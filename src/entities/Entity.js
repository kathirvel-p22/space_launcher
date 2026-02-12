/**
 * Entity.js - Base class for all game objects
 * 
 * This module provides the abstract base class that all game entities inherit from.
 * It includes core physics properties and basic update/render functionality.
 */

import { PhysicsBody } from '../physics/PhysicsBody.js';

/**
 * Abstract base class for all game entities
 */
export class Entity {
    /** @type {PhysicsBody} */
    physicsBody;
    /** @type {HTMLImageElement | null} */
    sprite = null;
    /** @type {boolean} */
    isActive = true;
    /** @type {string} */
    name = 'Entity';

    /**
     * Create a new Entity
     * @param {Object} [properties] - Entity properties
     * @param {string} [properties.name='Entity'] - Entity name
     * @param {number} [properties.mass=1] - Mass of the entity
     * @param {boolean} [properties.isStatic=false] - Whether the entity is static
     * @param {number} [properties.dragCoefficient=0] - Drag coefficient
     * @param {number} [properties.elasticity=0.8] - Elasticity (bounciness)
     */
    constructor(properties = {}) {
        this.name = properties.name || 'Entity';
        
        this.physicsBody = new PhysicsBody({
            mass: properties.mass || 1,
            isStatic: properties.isStatic || false,
            dragCoefficient: properties.dragCoefficient || 0,
            elasticity: properties.elasticity || 0.8
        });
        
        // Load sprite if provided
        if (properties.sprite) {
            this.loadSprite(properties.sprite);
        }
    }

    /**
     * Load a sprite image
     * @param {string} src - Image source path
     */
    loadSprite(src) {
        this.sprite = new Image();
        this.sprite.src = src;
    }

    /**
     * Update the entity
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        this.physicsBody.update(deltaTime);
    }

    /**
     * Render the entity
     * @param {CanvasRenderingContext2D} context - Canvas rendering context
     */
    render(context) {
        if (!this.isActive || !this.sprite) return;
        
        // Draw the sprite at the entity's position
        context.drawImage(
            this.sprite,
            this.physicsBody.position.x - this.sprite.width / 2,
            this.physicsBody.position.y - this.sprite.height / 2,
            this.sprite.width,
            this.sprite.height
        );
    }

    /**
     * Apply a force to the entity
     * @param {Object} force - Force to apply
     * @param {number} force.magnitude - Magnitude of the force
     * @param {Object} force.direction - Direction vector
     * @param {string} force.type - Type of force
     */
    applyForce(force) {
        this.physicsBody.applyForce(force);
    }

    /**
     * Apply an impulse (instant force)
     * @param {number} magnitude - Magnitude of the impulse
     * @param {Object} direction - Direction vector
     */
    applyImpulse(magnitude, direction) {
        this.physicsBody.applyImpulse(magnitude, direction);
    }

    /**
     * Check for collision with another entity
     * @param {Entity} other - Other entity
     * @param {number} [radius1=10] - Radius of this entity
     * @param {number} [radius2=10] - Radius of the other entity
     * @returns {boolean}
     */
    checkCollision(other, radius1 = 10, radius2 = 10) {
        return this.physicsBody.checkCollision(other.physicsBody, radius1, radius2);
    }

    /**
     * Handle collision with another entity
     * @param {Entity} other - Other entity
     * @param {number} [radius1=10] - Radius of this entity
     * @param {number} [radius2=10] - Radius of the other entity
     */
    handleCollision(other, radius1 = 10, radius2 = 10) {
        this.physicsBody.handleCollision(other.physicsBody, radius1, radius2);
    }

    /**
     * Get the position of the entity
     * @returns {Object}
     */
    getPosition() {
        return { ...this.physicsBody.position };
    }

    /**
     * Set the position of the entity
     * @param {Object} position - New position
     */
    setPosition(position) {
        this.physicsBody.setPosition(position);
    }

    /**
     * Get the velocity of the entity
     * @returns {Object}
     */
    getVelocity() {
        return { ...this.physicsBody.velocity };
    }

    /**
     * Set the velocity of the entity
     * @param {Object} velocity - New velocity
     */
    setVelocity(velocity) {
        this.physicsBody.setVelocity(velocity);
    }

    /**
     * Get the speed of the entity
     * @returns {number}
     */
    getSpeed() {
        return this.physicsBody.getSpeed();
    }

    /**
     * Get the direction vector (normalized)
     * @returns {Object}
     */
    getDirection() {
        return this.physicsBody.getDirection();
    }

    /**
     * Handle collision with another entity (to be overridden by subclasses)
     * @param {Entity} other - Other entity
     */
    onCollision(other) {
        // To be implemented by subclasses
    }

    /**
     * Clean up entity resources
     */
    cleanup() {
        this.isActive = false;
    }

    /**
     * Clone the entity
     * @returns {Entity}
     */
    clone() {
        const clone = new Entity({
            name: this.name,
            mass: this.physicsBody.mass,
            isStatic: this.physicsBody.isStatic,
            dragCoefficient: this.physicsBody.dragCoefficient,
            elasticity: this.physicsBody.elasticity
        });
        
        clone.physicsBody = this.physicsBody.clone();
        clone.isActive = this.isActive;
        
        if (this.sprite) {
            clone.sprite = this.sprite;
        }
        
        return clone;
    }
}
