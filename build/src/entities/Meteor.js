/**
 * Meteor.js - Enemy/obstacle class
 * 
 * This module implements meteor entities that serve as obstacles/enemies
 * in the game. They have physics properties and can collide with the player.
 */

import { Entity } from './Entity.js';

/**
 * Meteor enemy/obstacle class
 */
export class Meteor extends Entity {
    /** @type {string} */
    size = 'medium';
    /** @type {number} */
    health = 50;
    /** @type {number} */
    damage = 20;
    /** @type {number} */
    rotationSpeed = 0.5;
    /** @type {number} */
    rotation = 0;

    /**
     * Create a new Meteor
     * @param {Object} [properties] - Meteor properties
     * @param {string} [properties.size='medium'] - Size of the meteor
     * @param {number} [properties.health=50] - Meteor health
     * @param {number} [properties.damage=20] - Damage dealt on collision
     * @param {number} [properties.mass=5000] - Mass of the meteor
     * @param {string} [properties.sprite] - Sprite image
     */
    constructor(properties = {}) {
        super({
            name: 'Meteor',
            mass: properties.mass || 5000,
            dragCoefficient: properties.dragCoefficient || 0.1,
            elasticity: properties.elasticity || 0.7,
            sprite: properties.sprite || 'meteor_medium.png'
        });
        
        this.size = properties.size || 'medium';
        this.health = properties.health || 50;
        this.damage = properties.damage || 20;
        
        // Set size-specific properties
        this.setSize(this.size);
    }

    /**
     * Set the size of the meteor
     * @param {string} size - Size of the meteor
     */
    setSize(size) {
        this.size = size;
        
        switch (size) {
            case 'small':
                this.health = 30;
                this.damage = 10;
                this.physicsBody.mass = 2000;
                this.rotationSpeed = 1.0;
                break;
            case 'medium':
                this.health = 50;
                this.damage = 20;
                this.physicsBody.mass = 5000;
                this.rotationSpeed = 0.5;
                break;
            case 'large':
                this.health = 100;
                this.damage = 30;
                this.physicsBody.mass = 10000;
                this.rotationSpeed = 0.2;
                break;
        }
        
        // Update sprite based on size
        if (this.sprite) {
            this.sprite.src = `assets/sprites/meteor_${size}.png`;
        }
    }

    /**
     * Update the meteor
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.isActive) return;
        
        // Rotate the meteor
        this.rotation += this.rotationSpeed * deltaTime;
    }

    /**
     * Handle collision with another entity
     * @param {Entity} other - Other entity
     */
    onCollision(other) {
        if (!this.isActive) return;
        
        // If collided with a projectile, take damage
        if (other.name === 'Projectile') {
            this.health -= other.damage;
            
            if (this.health <= 0) {
                this.health = 0;
                this.isActive = false;
                
                // Emit event for score and cleanup
                if (other.owner && other.owner.name === 'Player') {
                    other.owner.addScore(100);
                }
            }
        }
    }

    /**
     * Render the meteor
     * @param {CanvasRenderingContext2D} context - Canvas rendering context
     */
    render(context) {
        if (!this.isActive) return;
        
        // Save the current context state
        context.save();
        
        // Translate to the meteor's position
        context.translate(
            this.physicsBody.position.x,
            this.physicsBody.position.y
        );
        
        // Rotate based on meteor's rotation
        context.rotate(this.rotation);
        
        // Draw the sprite if loaded, otherwise draw a colored rectangle
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            context.drawImage(
                this.sprite,
                -this.sprite.width / 2,
                -this.sprite.height / 2,
                this.sprite.width,
                this.sprite.height
            );
        } else {
            // Fallback: draw a colored rectangle based on size
            const size = this.size === 'small' ? 15 : this.size === 'large' ? 25 : 40;
            context.fillStyle = '#ff0000';
            context.fillRect(-size/2, -size/2, size, size);
        }
        
        // Restore the context
        context.restore();
    }

    /**
     * Clone the meteor
     * @returns {Meteor}
     */
    clone() {
        const clone = new Meteor({
            size: this.size,
            health: this.health,
            damage: this.damage,
            mass: this.physicsBody.mass,
            sprite: this.sprite ? this.sprite.src : undefined
        });
        
        clone.physicsBody = this.physicsBody.clone();
        clone.isActive = this.isActive;
        clone.rotation = this.rotation;
        
        return clone;
    }
}
