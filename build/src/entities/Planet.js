/**
 * Planet.js - Planet entity class
 *
 * Represents a planet in the game world
 */

import { Entity } from './Entity.js';
import { PhysicsBody } from '../physics/PhysicsBody.js';

export class Planet extends Entity {
    /**
     * Create a new planet
     * @param {Object} options - Planet options
     * @param {string} options.name - Planet name
     * @param {number} options.x - X position
     * @param {number} options.y - Y position
     * @param {number} options.radius - Planet radius
     * @param {string} options.texture - Texture image path
     * @param {number} [options.mass=1000] - Planet mass
     * @param {number} [options.gravity=0.1] - Gravity strength
     */
    constructor(options) {
        super(options);
        
        this.name = options.name || 'Unknown Planet';
        this.radius = options.radius || 50;
        this.mass = options.mass || 1000;
        this.gravity = options.gravity || 0.1;
        this.texture = options.texture || 'earth_texture.png';
        
        // Create physics body
        this.body = new PhysicsBody({
            x: options.x,
            y: options.y,
            width: this.radius * 2,
            height: this.radius * 2,
            mass: this.mass,
            isStatic: true,
            collisionGroup: 'planet'
        });
        
        // Load texture
        this.textureImage = new Image();
        this.textureImage.src = `assets/sprites/${this.texture}`;
    }

    /**
     * Update planet state
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        // Planets don't move in this simple implementation
        super.update(deltaTime);
    }

    /**
     * Draw the planet
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.save();
        
        // Draw planet as a circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Fill with gradient
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.radius * 0.5,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#689f38');
        gradient.addColorStop(1, '#2e7d32');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add some texture detail
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Calculate gravity effect on another object
     * @param {Entity} target - Target object
     * @returns {Object} - Gravity force vector
     */
    calculateGravity(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.radius) return { x: 0, y: 0 };
        
        const force = (this.gravity * this.mass * target.body.mass) / (distance * distance);
        const directionX = dx / distance;
        const directionY = dy / distance;
        
        return {
            x: directionX * force,
            y: directionY * force
        };
    }
}
