/**
 * Rocket.js - Rocket entity with thrust and fuel mechanics
 *
 * This module implements the rocket that the player can launch at the end of
 * the Earth chapter (Level 10). It includes thrust-based movement, fuel
 * management, and launch sequence with visual effects.
 */

import { Entity } from './Entity.js';
import { EventBus } from '../core/EventBus.js';

/**
 * Rocket entity class
 */
export class Rocket extends Entity {
    /** @type {number} */
    fuel = 100;
    /** @type {number} */
    maxFuel = 100;
    /** @type {number} */
    thrustForce = 2000;
    /** @type {number} */
    rotation = 0;
    /** @type {number} */
    rotationSpeed = 2;
    /** @type {boolean} */
    isLaunching = false;
    /** @type {number} */
    launchTimer = 0;
    /** @type {number} */
    flameAnimationTimer = 0;
    /** @type {number} */
    flameAnimationFrame = 0;
    /** @type {boolean} */
    isThrusting = false;
    /** @type {Array<{position: {x: number, y: number}, velocity: {x: number, y: number}, lifetime: number}>} */
    smokeParticles = [];

    /**
     * Create a new Rocket
     * @param {Object} [properties] - Rocket properties
     * @param {number} [properties.mass=500] - Mass of the rocket
     * @param {number} [properties.fuel=100] - Initial fuel
     * @param {number} [properties.thrustForce=2000] - Thrust force
     * @param {string} [properties.sprite='rocket.png'] - Sprite image
     */
    constructor(properties = {}) {
        super({
            name: 'Rocket',
            mass: properties.mass || 500,
            dragCoefficient: properties.dragCoefficient || 0.2,
            elasticity: properties.elasticity || 0.3,
            sprite: properties.sprite || 'assets/sprites/rocket.png'
        });
        
        this.fuel = properties.fuel || 100;
        this.maxFuel = properties.fuel || 100;
        this.thrustForce = properties.thrustForce || 2000;
    }

    /**
     * Update the rocket
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.isActive) return;
        
        // Update flame animation
        this.flameAnimationTimer += deltaTime;
        if (this.flameAnimationTimer > 0.1) {
            this.flameAnimationTimer = 0;
            this.flameAnimationFrame = (this.flameAnimationFrame + 1) % 3;
        }
        
        // Update smoke particles
        this.updateSmokeParticles(deltaTime);
        
        // Handle launch sequence
        if (this.isLaunching) {
            this.updateLaunchSequence(deltaTime);
        }
        
        // Regenerate fuel slowly when not thrusting
        if (!this.isThrusting && this.fuel < this.maxFuel) {
            this.fuel = Math.min(this.maxFuel, this.fuel + deltaTime * 5);
        }
    }

    /**
     * Update smoke particles
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateSmokeParticles(deltaTime) {
        const activeParticles = [];
        
        for (const particle of this.smokeParticles) {
            particle.lifetime -= deltaTime;
            
            if (particle.lifetime > 0) {
                // Update particle position
                particle.position.x += particle.velocity.x * deltaTime;
                particle.position.y += particle.velocity.y * deltaTime;
                
                activeParticles.push(particle);
            }
        }
        
        this.smokeParticles = activeParticles;
    }

    /**
     * Update launch sequence
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateLaunchSequence(deltaTime) {
        this.launchTimer += deltaTime;
        
        // Apply thrust during launch
        if (this.launchTimer < 3.0) {
            this.isThrusting = true;
            
            // Apply thrust force upward
            this.applyForce({
                magnitude: this.thrustForce,
                direction: { x: 0, y: -1 },
                type: 'thrust'
            });
            
            // Consume fuel
            this.fuel = Math.max(0, this.fuel - deltaTime * 20);
            
            // Create smoke particles
            if (Math.random() < 0.3) {
                this.createSmokeParticle();
            }
        } else {
            this.isThrusting = false;
        }
        
        // Stop thrusting when fuel runs out
        if (this.fuel <= 0) {
            this.isThrusting = false;
        }
    }

    /**
     * Create smoke particle effect
     */
    createSmokeParticle() {
        const rocketPos = this.physicsBody.position;
        
        this.smokeParticles.push({
            position: {
                x: rocketPos.x + (Math.random() - 0.5) * 20,
                y: rocketPos.y + 30
            },
            velocity: {
                x: (Math.random() - 0.5) * 50,
                y: -Math.random() * 30
            },
            lifetime: 1.0 + Math.random() * 1.0
        });
    }

    /**
     * Start the rocket launch sequence
     */
    startLaunchSequence() {
        this.isLaunching = true;
        this.launchTimer = 0;
        
        // Emit event for HUD
        EventBus.emit('rocket_launch_started');
    }

    /**
     * Handle keyboard input
     * @param {Object} keys - Current key states
     */
    handleInput(keys) {
        if (!this.isActive) return;
        
        // Rotation controls
        if (keys['a'] || keys['arrowleft']) {
            this.rotation -= this.rotationSpeed;
        }
        
        if (keys['d'] || keys['arrowright']) {
            this.rotation += this.rotationSpeed;
        }
        
        // Thrust control
        if ((keys['w'] || keys['arrowup'] || keys['space']) && this.fuel > 0 && !this.isLaunching) {
            this.isThrusting = true;
            
            // Apply thrust in the direction the rocket is facing
            const angle = this.rotation * Math.PI / 180;
            const direction = {
                x: Math.sin(angle),
                y: Math.cos(angle)
            };
            
            this.applyForce({
                magnitude: this.thrustForce,
                direction: direction,
                type: 'thrust'
            });
            
            // Consume fuel
            this.fuel -= 0.5;
            
            // Create smoke particles
            if (Math.random() < 0.2) {
                this.createSmokeParticle();
            }
        } else {
            this.isThrusting = false;
        }
    }

    /**
     * Render the rocket
     * @param {CanvasRenderingContext2D} context - Canvas rendering context
     */
    render(context) {
        if (!this.isActive || !this.sprite) return;
        
        // Save the current context state
        context.save();
        
        // Translate to the rocket's position
        context.translate(
            this.physicsBody.position.x,
            this.physicsBody.position.y
        );
        
        // Rotate based on rocket's rotation
        context.rotate(this.rotation * Math.PI / 180);
        
        // Draw the rocket sprite centered
        context.drawImage(
            this.sprite,
            -this.sprite.width / 2,
            -this.sprite.height / 2,
            this.sprite.width,
            this.sprite.height
        );
        
        // Draw flame when thrusting
        if (this.isThrusting) {
            context.fillStyle = 'rgba(255, 100, 0, 0.8)';
            
            // Flame animation - pulse effect
            const pulseScale = 0.8 + Math.sin(this.flameAnimationFrame * 2) * 0.2;
            
            context.beginPath();
            context.moveTo(0, this.sprite.height / 2 + 5);
            context.lineTo(-15 * pulseScale, this.sprite.height / 2 + 20);
            context.lineTo(0, this.sprite.height / 2 + 30);
            context.lineTo(15 * pulseScale, this.sprite.height / 2 + 20);
            context.closePath();
            context.fill();
        }
        
        // Draw smoke particles
        context.fillStyle = 'rgba(200, 200, 200, 0.6)';
        for (const particle of this.smokeParticles) {
            const alpha = particle.lifetime / 1.0;
            context.globalAlpha = alpha;
            context.beginPath();
            context.arc(
                particle.position.x - this.physicsBody.position.x,
                particle.position.y - this.physicsBody.position.y,
                3 * (1 - particle.lifetime * 0.5),
                0,
                Math.PI * 2
            );
            context.fill();
        }
        context.globalAlpha = 1.0;
        
        // Restore the context
        context.restore();
    }

    /**
     * Clone the rocket
     * @returns {Rocket}
     */
    clone() {
        const clone = new Rocket({
            mass: this.physicsBody.mass,
            fuel: this.fuel,
            thrustForce: this.thrustForce,
            sprite: this.sprite ? this.sprite.src : undefined
        });
        
        clone.physicsBody = this.physicsBody.clone();
        clone.isActive = this.isActive;
        clone.rotation = this.rotation;
        clone.isLaunching = this.isLaunching;
        clone.launchTimer = this.launchTimer;
        
        return clone;
    }
}
