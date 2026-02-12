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
    /** @type {boolean} */
    canShoot = true;
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
        if (!this.isActive) return;
        
        // Save the current context state
        context.save();
        
        // Translate to the rocket's position
        context.translate(
            this.physicsBody.position.x,
            this.physicsBody.position.y
        );
        
        // Rotate based on rocket's rotation
        context.rotate(this.rotation * Math.PI / 180);
        
        // Draw the rocket sprite or fallback
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            context.drawImage(
                this.sprite,
                -this.sprite.width / 2,
                -this.sprite.height / 2,
                this.sprite.width,
                this.sprite.height
            );
        } else {
            // Fallback: draw procedural rocket
            this.drawProceduralRocket(context);
        }
        
        // Draw flame when thrusting
        if (this.isThrusting) {
            this.drawFlame(context);
        }
        
        // Draw smoke particles
        this.drawSmokeParticles(context);
        
        // Restore the context
        context.restore();
    }
    
    /**
     * Draw procedural rocket - colorful cartoon style
     * @param {CanvasRenderingContext2D} context
     */
    drawProceduralRocket(context) {
        const time = Date.now() / 1000;
        
        // === MAIN BODY ===
        // Body gradient (white with blue tint)
        const bodyGrad = context.createLinearGradient(-22, 0, 22, 0);
        bodyGrad.addColorStop(0, '#E8E8F0');
        bodyGrad.addColorStop(0.3, '#FFFFFF');
        bodyGrad.addColorStop(0.7, '#FFFFFF');
        bodyGrad.addColorStop(1, '#D0D0E0');
        
        context.fillStyle = bodyGrad;
        context.beginPath();
        context.moveTo(-22, 45);
        context.lineTo(-22, -30);
        context.quadraticCurveTo(-22, -50, 0, -70);
        context.quadraticCurveTo(22, -50, 22, -30);
        context.lineTo(22, 45);
        context.closePath();
        context.fill();
        
        // Body outline
        context.strokeStyle = '#AAAACC';
        context.lineWidth = 2;
        context.stroke();
        
        // === NOSE CONE (Red) ===
        const noseGrad = context.createLinearGradient(-15, -70, 15, -70);
        noseGrad.addColorStop(0, '#CC3333');
        noseGrad.addColorStop(0.5, '#FF4444');
        noseGrad.addColorStop(1, '#AA2222');
        
        context.fillStyle = noseGrad;
        context.beginPath();
        context.moveTo(0, -95);
        context.quadraticCurveTo(-18, -75, -18, -55);
        context.lineTo(18, -55);
        context.quadraticCurveTo(18, -75, 0, -95);
        context.closePath();
        context.fill();
        
        // Nose highlight
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.beginPath();
        context.ellipse(-6, -78, 4, 8, -0.3, 0, Math.PI * 2);
        context.fill();
        
        // === WINDOW (Porthole) ===
        // Window frame
        context.fillStyle = '#4A90D9';
        context.beginPath();
        context.arc(0, -25, 16, 0, Math.PI * 2);
        context.fill();
        
        // Window glass gradient
        const windowGrad = context.createRadialGradient(-4, -28, 0, 0, -25, 14);
        windowGrad.addColorStop(0, '#AADDFF');
        windowGrad.addColorStop(0.5, '#6699CC');
        windowGrad.addColorStop(1, '#334466');
        
        context.fillStyle = windowGrad;
        context.beginPath();
        context.arc(0, -25, 12, 0, Math.PI * 2);
        context.fill();
        
        // Window reflection
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        context.beginPath();
        context.ellipse(-4, -30, 5, 3, -0.5, 0, Math.PI * 2);
        context.fill();
        
        // Window frame ring
        context.strokeStyle = '#2A5A9A';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(0, -25, 14, 0, Math.PI * 2);
        context.stroke();
        
        // === BODY STRIPES ===
        // Red stripe
        context.fillStyle = '#FF4444';
        context.fillRect(-22, 5, 44, 8);
        
        // Blue stripe
        context.fillStyle = '#4A90D9';
        context.fillRect(-22, 18, 44, 6);
        
        // === FINS ===
        // Left fin
        const finGrad = context.createLinearGradient(-40, 30, -20, 30);
        finGrad.addColorStop(0, '#CC3333');
        finGrad.addColorStop(1, '#FF4444');
        
        context.fillStyle = finGrad;
        context.beginPath();
        context.moveTo(-22, 20);
        context.lineTo(-40, 55);
        context.quadraticCurveTo(-42, 60, -38, 60);
        context.lineTo(-22, 50);
        context.closePath();
        context.fill();
        
        // Right fin
        const finGrad2 = context.createLinearGradient(20, 30, 40, 30);
        finGrad2.addColorStop(0, '#FF4444');
        finGrad2.addColorStop(1, '#CC3333');
        
        context.fillStyle = finGrad2;
        context.beginPath();
        context.moveTo(22, 20);
        context.lineTo(40, 55);
        context.quadraticCurveTo(42, 60, 38, 60);
        context.lineTo(22, 50);
        context.closePath();
        context.fill();
        
        // === ENGINE SECTION ===
        // Engine base
        context.fillStyle = '#555566';
        context.beginPath();
        context.moveTo(-18, 45);
        context.lineTo(-22, 60);
        context.lineTo(22, 60);
        context.lineTo(18, 45);
        context.closePath();
        context.fill();
        
        // Engine nozzle
        context.fillStyle = '#333344';
        context.beginPath();
        context.moveTo(-15, 60);
        context.lineTo(-18, 70);
        context.lineTo(18, 70);
        context.lineTo(15, 60);
        context.closePath();
        context.fill();
        
        // Nozzle inner
        context.fillStyle = '#222233';
        context.beginPath();
        context.ellipse(0, 70, 12, 4, 0, 0, Math.PI * 2);
        context.fill();
        
        // === RIVETS/DETAILS ===
        context.fillStyle = '#AAAACC';
        for (let i = 0; i < 3; i++) {
            context.beginPath();
            context.arc(-15, -45 + i * 25, 2, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.arc(15, -45 + i * 25, 2, 0, Math.PI * 2);
            context.fill();
        }
    }
    
    /**
     * Draw flame effect
     * @param {CanvasRenderingContext2D} context
     */
    drawFlame(context) {
        const pulseScale = 0.8 + Math.sin(Date.now() / 50) * 0.3;
        const flameHeight = 40 * pulseScale;
        
        // Outer flame (orange)
        const gradient = context.createLinearGradient(0, 55, 0, 55 + flameHeight);
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.3, '#FF6600');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        context.fillStyle = gradient;
        context.beginPath();
        context.moveTo(-18, 55);
        context.quadraticCurveTo(-10, 55 + flameHeight * 0.7, 0, 55 + flameHeight);
        context.quadraticCurveTo(10, 55 + flameHeight * 0.7, 18, 55);
        context.closePath();
        context.fill();
        
        // Inner flame (white/yellow)
        const innerGradient = context.createLinearGradient(0, 55, 0, 55 + flameHeight * 0.6);
        innerGradient.addColorStop(0, '#FFFFFF');
        innerGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        context.fillStyle = innerGradient;
        context.beginPath();
        context.moveTo(-8, 55);
        context.quadraticCurveTo(-4, 55 + flameHeight * 0.4, 0, 55 + flameHeight * 0.6);
        context.quadraticCurveTo(4, 55 + flameHeight * 0.4, 8, 55);
        context.closePath();
        context.fill();
    }
    
    /**
     * Draw smoke particles
     * @param {CanvasRenderingContext2D} context
     */
    drawSmokeParticles(context) {
        for (const particle of this.smokeParticles) {
            const alpha = particle.lifetime / 2.0;
            const size = 5 * (2 - particle.lifetime);
            
            context.fillStyle = `rgba(180, 180, 180, ${alpha})`;
            context.beginPath();
            context.arc(
                particle.position.x - this.physicsBody.position.x,
                particle.position.y - this.physicsBody.position.y,
                size,
                0,
                Math.PI * 2
            );
            context.fill();
        }
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
