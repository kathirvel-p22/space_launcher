/**
 * Player.js - Player ship with state management
 * 
 * This module implements the player character with keyboard controls,
 * state management, and interaction with the game world.
 */

import { Entity } from './Entity.js';
import { Projectile } from './Projectile.js';
import { EventBus } from '../core/EventBus.js';

/**
 * Player character class
 */
export class Player extends Entity {
    /** @type {number} */
    health = 100;
    /** @type {number} */
    maxHealth = 100;
    /** @type {number} */
    maxSpeed = 500;
    /** @type {number} */
    thrustForce = 1000;
    /** @type {number} */
    fuel = 100;
    /** @type {number} */
    maxFuel = 100;
    /** @type {number} */
    rotation = 0;
    /** @type {number} */
    rotationSpeed = 3;
    /** @type {number} */
    score = 0;
    /** @type {boolean} */
    isInvulnerable = false;
    /** @type {number} */
    invulnerabilityTimer = 0;

    /**
     * Create a new Player
     * @param {Object} [properties] - Player properties
     */
    constructor(config) {
        super({
            name: 'Player',
            health: config.health || 100,
            maxHealth: config.maxHealth || 100,
            position: config.position || { x: 400, y: 500 },
            velocity: { x: 0, y: 0 },
            size: { width: 32, height: 32 },
            mass: 100
        });
        
        this.maxSpeed = 200;
        this.fuel = 100;
        this.maxFuel = 100;
        this.thrustPower = 150;
        this.isGrounded = false;
        this.facingDirection = 1; // 1 for right, -1 for left
        
        // Shooting properties
        this.canShoot = true;
        this.shootCooldown = 0.3; // 0.3 seconds between shots
        this.shootTimer = 0;
        
        // Multi-bullet system (upgrades with level)
        this.bulletCount = 1;      // Number of bullets per shot
        this.bulletSpread = 15;    // Angle spread between bullets (degrees)
        this.currentLevel = 1;     // Current game level
        
        // Don't load sprite - use procedural astronaut instead
        this.sprite = null;
    }
    
    /**
     * Set the current level and update bullet count
     * @param {number} level - Current level number
     */
    setLevel(level) {
        this.currentLevel = level;
        
        // Upgrade bullet count based on level
        if (level >= 8) {
            this.bulletCount = 5;      // 5 bullets at level 8+
            this.shootCooldown = 0.25;
        } else if (level >= 6) {
            this.bulletCount = 4;      // 4 bullets at level 6-7
            this.shootCooldown = 0.25;
        } else if (level >= 4) {
            this.bulletCount = 3;      // 3 bullets at level 4-5
            this.shootCooldown = 0.28;
        } else if (level >= 2) {
            this.bulletCount = 2;      // 2 bullets at level 2-3
            this.shootCooldown = 0.3;
        } else {
            this.bulletCount = 1;      // 1 bullet at level 1
            this.shootCooldown = 0.3;
        }
    }

    /**
     * Update the player
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.isActive) return;
        
        // Handle invulnerability timer
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
        
        // Regenerate fuel slowly
        if (this.fuel < this.maxFuel) {
            this.fuel = Math.min(this.maxFuel, this.fuel + deltaTime * 10);
        }
    }

    /**
     * Handle keyboard input
     * @param {Object} keys - Current key states
     */
    handleInput(keys) {
        if (!this.isActive) return;
        
        // For Earth scene, use ground-based movement; otherwise space-based
        const isEarthScene = keys['earth_scene'] === true;
        
        if (isEarthScene) {
            // Ground-based movement for Earth scene
            this.handleGroundMovement(keys);
        } else {
            // Space-based movement for other scenes
            this.handleSpaceMovement(keys);
        }
        
        // Limit speed
        const speed = this.getSpeed();
        if (speed > this.maxSpeed) {
            const direction = this.getDirection();
            
            // Reduce velocity to max speed
            this.setVelocity({
                x: direction.x * this.maxSpeed,
                y: direction.y * this.maxSpeed
            });
        }
    }
    
    /**
     * Handle ground-based movement (Earth scene)
     * @param {Object} keys - Current key states
     * @param {number} dt - Delta time (optional, defaults to 0.016)
     */
    handleGroundMovement(keys, dt = 0.016) {
        // Update shooting cooldown
        if (this.shootTimer > 0) {
            this.shootTimer -= dt;
            if (this.shootTimer <= 0) {
                this.canShoot = true;
                this.shootTimer = 0;
            }
        }
        
        // Shooting (Enter key or X key)
        if (keys['enter'] === true || keys['x'] === true) {
            this.shoot();
        }
        
        // Left/Right movement (A/D or ArrowLeft/ArrowRight)
        const leftPressed = keys['a'] === true || keys['arrowleft'] === true;
        const rightPressed = keys['d'] === true || keys['arrowright'] === true;
        // Space bar is stored as ' ' (single space character)
        const upPressed = keys['w'] === true || keys['arrowup'] === true || keys[' '] === true;
        const downPressed = keys['s'] === true || keys['arrowdown'] === true;
        
        let horizontalVelocity = 0;
        
        if (leftPressed) {
            horizontalVelocity = -this.maxSpeed;
            this.facingDirection = -1;
        } else if (rightPressed) {
            horizontalVelocity = this.maxSpeed;
            this.facingDirection = 1;
        }
        
        // Apply horizontal movement directly for responsive controls
        if (horizontalVelocity !== 0) {
            const currentPos = this.getPosition();
            const canvas = document.getElementById('gameCanvas');
            const maxX = canvas ? canvas.width - 50 : 770;
            const newX = Math.max(50, Math.min(maxX, currentPos.x + horizontalVelocity * dt));
            this.setPosition({ x: newX, y: currentPos.y });
        }
        
        // Jump (W or ArrowUp or Space)
        if (upPressed && this.isGrounded) {
            this.isGrounded = false;
            // Apply strong upward impulse for jump
            this.physicsBody.velocity.y = -500;
        }
        
        // Fast fall / crouch (S or ArrowDown)
        if (downPressed) {
            // Apply downward force for faster falling
            this.physicsBody.velocity.y += 15;
        }
    }
    
    /**
     * Handle space-based movement (other scenes)
     * @param {Object} keys - Current key states
     */
    handleSpaceMovement(keys) {
        const thrustVector = { x: 0, y: 0 };
        
        // Forward thrust (W or ArrowUp)
        if ((keys['w'] || keys['arrowup']) && this.fuel > 0) {
            thrustVector.y = -this.thrustForce;
            this.fuel -= 0.5;
        }
        
        // Backward thrust (S or ArrowDown)
        if (keys['s'] || keys['arrowdown']) {
            thrustVector.y = this.thrustForce;
        }
        
        // Left thrust (A or ArrowLeft) - rotate left
        if (keys['a'] || keys['arrowleft']) {
            this.rotation -= this.rotationSpeed;
        }
        
        // Right thrust (D or ArrowRight) - rotate right
        if (keys['d'] || keys['arrowright']) {
            this.rotation += this.rotationSpeed;
        }
        
        // Apply thrust force in the direction the player is facing
        if (thrustVector.y !== 0) {
            // Convert rotation to radians
            const angle = this.rotation * Math.PI / 180;
            
            // Calculate direction vector based on rotation
            const direction = {
                x: Math.sin(angle),
                y: Math.cos(angle)
            };
            
            // Apply force in the direction the player is facing
            const force = {
                magnitude: Math.abs(thrustVector.y),
                direction: direction,
                type: 'thrust'
            };
            
            this.applyForce(force);
        }
    }

    /**
     * Shoot projectiles (multiple based on level)
     */
    shoot() {
        if (!this.isActive || !this.canShoot) return;
        
        const pos = this.getPosition();
        const baseSpeed = 600;
        const baseAngle = -90; // Shooting upward-ish
        
        // Calculate spread angles for multiple bullets
        const totalSpread = this.bulletSpread * (this.bulletCount - 1);
        const startAngle = baseAngle - totalSpread / 2;
        
        for (let i = 0; i < this.bulletCount; i++) {
            // Calculate angle for this bullet
            const angle = this.bulletCount === 1 
                ? baseAngle 
                : startAngle + (i * this.bulletSpread);
            
            // Convert angle to radians
            const radians = angle * Math.PI / 180;
            
            // Calculate velocity components
            const velocityX = Math.cos(radians) * baseSpeed * this.facingDirection;
            const velocityY = Math.sin(radians) * baseSpeed;
            
            // Offset position slightly for each bullet
            const offsetX = (i - (this.bulletCount - 1) / 2) * 8 * this.facingDirection;
            
            const projectile = new Projectile({
                x: pos.x + (this.facingDirection * 20) + offsetX,
                y: pos.y - 10,
                velocityX: velocityX,
                velocityY: velocityY,
                owner: this
            });
            
            // Emit event to add projectile to scene
            EventBus.emit('player_shoot', { projectile });
        }
        
        // Start cooldown
        this.canShoot = false;
        this.shootTimer = this.shootCooldown;
    }

    /**
     * Handle collision with another entity
     * @param {Entity} other - Other entity
     */
    onCollision(other) {
        if (!this.isActive || this.isInvulnerable) return;
        
        // Handle different collision types
        if (other.name === 'Meteor') {
            this.health -= 20;
            
            if (this.health <= 0) {
                this.health = 0;
                this.isActive = false;
                EventBus.emit('player_death');
            } else {
                // Temporary invulnerability after hit
                this.isInvulnerable = true;
                this.invulnerabilityTimer = 1.0; // 1 second
            }
        }
    }

    /**
     * Heal the player
     * @param {number} amount - Amount to heal
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * Refuel the player
     * @param {number} amount - Amount to refuel
     */
    refuel(amount) {
        this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    }

    /**
     * Add to player score
     * @param {number} points - Points to add
     */
    addScore(points) {
        this.score += points;
    }

    /**
     * Render the player
     * @param {CanvasRenderingContext2D} context - Canvas rendering context
     */
    render(context) {
        if (!this.isActive) return;
        
        // Save the current context state
        context.save();
        
        // Translate to the player's position
        context.translate(
            this.physicsBody.position.x,
            this.physicsBody.position.y
        );
        
        // Flash when invulnerable
        if (this.isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            context.globalAlpha = 0.5;
        }
        
        // Scale up the player (1.5x bigger)
        const playerScale = 1.5;
        context.scale(this.facingDirection * playerScale, playerScale);
        
        // Always draw procedural astronaut character
        this.drawProceduralPlayer(context);
        
        // Restore the context
        context.restore();
        
        // Draw health bar above player
        this.drawHealthBar(context);
    }
    
    /**
     * Draw procedural player character (space astronaut)
     * @param {CanvasRenderingContext2D} context
     */
    drawProceduralPlayer(context) {
        // Color palette - white/gray space suit with blue accents
        const suitWhite = '#F0F0F0';
        const suitGray = '#C8C8C8';
        const suitDark = '#888888';
        const accentBlue = '#4A90D9';
        const accentGold = '#FFD700';
        const visorGold = '#D4AF37';
        
        // Animation offset for breathing/idle
        const breathOffset = Math.sin(Date.now() / 500) * 1.5;
        const time = Date.now() / 1000;
        
        // Shadow under character
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.beginPath();
        context.ellipse(0, 44, 20, 7, 0, 0, Math.PI * 2);
        context.fill();
        
        // === JETPACK (behind body) ===
        context.fillStyle = '#555';
        context.beginPath();
        context.roundRect(-10, 0, 20, 22, 4);
        context.fill();
        
        // Jetpack details
        context.fillStyle = '#333';
        context.beginPath();
        context.roundRect(-8, 2, 16, 18, 3);
        context.fill();
        
        // Jetpack tanks
        context.fillStyle = accentBlue;
        context.beginPath();
        context.roundRect(-7, 4, 6, 14, 2);
        context.fill();
        context.beginPath();
        context.roundRect(1, 4, 6, 14, 2);
        context.fill();
        
        // Jetpack thrusters when jumping
        if (!this.isGrounded) {
            const flameHeight = 20 + Math.random() * 12;
            const flicker = Math.sin(time * 30) * 2;
            
            // Main flame gradient
            const flameGrad = context.createLinearGradient(0, 22, 0, 22 + flameHeight);
            flameGrad.addColorStop(0, '#FFFFFF');
            flameGrad.addColorStop(0.15, '#00FFFF');
            flameGrad.addColorStop(0.4, '#0088FF');
            flameGrad.addColorStop(0.7, '#0044AA');
            flameGrad.addColorStop(1, 'rgba(0, 50, 150, 0)');
            
            context.fillStyle = flameGrad;
            
            // Left thruster
            context.beginPath();
            context.moveTo(-8, 22);
            context.quadraticCurveTo(-5 + flicker, 22 + flameHeight * 0.6, -5, 22 + flameHeight);
            context.quadraticCurveTo(-2 - flicker, 22 + flameHeight * 0.6, -2, 22);
            context.closePath();
            context.fill();
            
            // Right thruster
            context.beginPath();
            context.moveTo(2, 22);
            context.quadraticCurveTo(5 + flicker, 22 + flameHeight * 0.6, 5, 22 + flameHeight);
            context.quadraticCurveTo(8 - flicker, 22 + flameHeight * 0.6, 8, 22);
            context.closePath();
            context.fill();
            
            // Inner bright core
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            context.beginPath();
            context.ellipse(-5, 25, 2, 4, 0, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.ellipse(5, 25, 2, 4, 0, 0, Math.PI * 2);
            context.fill();
        }
        
        // === LEGS ===
        // Left leg
        context.fillStyle = suitWhite;
        context.beginPath();
        context.moveTo(-10, 20);
        context.lineTo(-12, 36);
        context.lineTo(-4, 36);
        context.lineTo(-4, 20);
        context.closePath();
        context.fill();
        
        // Left leg stripe
        context.fillStyle = accentBlue;
        context.fillRect(-11, 26, 6, 3);
        
        // Left boot
        context.fillStyle = suitDark;
        context.beginPath();
        context.roundRect(-14, 34, 12, 10, [0, 0, 4, 4]);
        context.fill();
        context.fillStyle = '#444';
        context.fillRect(-13, 38, 10, 3);
        
        // Right leg
        context.fillStyle = suitWhite;
        context.beginPath();
        context.moveTo(4, 20);
        context.lineTo(4, 36);
        context.lineTo(12, 36);
        context.lineTo(10, 20);
        context.closePath();
        context.fill();
        
        // Right leg stripe
        context.fillStyle = accentBlue;
        context.fillRect(5, 26, 6, 3);
        
        // Right boot
        context.fillStyle = suitDark;
        context.beginPath();
        context.roundRect(2, 34, 12, 10, [0, 0, 4, 4]);
        context.fill();
        context.fillStyle = '#444';
        context.fillRect(3, 38, 10, 3);
        
        // === TORSO ===
        // Main body
        context.fillStyle = suitWhite;
        context.beginPath();
        context.moveTo(-14, -2 + breathOffset);
        context.quadraticCurveTo(-18, 8, -14, 22);
        context.lineTo(14, 22);
        context.quadraticCurveTo(18, 8, 14, -2 + breathOffset);
        context.closePath();
        context.fill();
        
        // Body shading
        context.fillStyle = suitGray;
        context.beginPath();
        context.moveTo(6, 0 + breathOffset);
        context.quadraticCurveTo(14, 10, 10, 22);
        context.lineTo(14, 22);
        context.quadraticCurveTo(18, 8, 14, -2 + breathOffset);
        context.closePath();
        context.fill();
        
        // Chest control panel
        context.fillStyle = '#222';
        context.beginPath();
        context.roundRect(-8, 4 + breathOffset, 16, 12, 3);
        context.fill();
        
        // Panel lights
        context.fillStyle = '#00FF00';
        context.beginPath();
        context.arc(-4, 8 + breathOffset, 2, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#FF0000';
        context.beginPath();
        context.arc(0, 8 + breathOffset, 2, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = accentBlue;
        context.beginPath();
        context.arc(4, 8 + breathOffset, 2, 0, Math.PI * 2);
        context.fill();
        
        // Panel display
        context.fillStyle = '#003300';
        context.fillRect(-6, 11 + breathOffset, 12, 3);
        context.fillStyle = '#00FF00';
        const barWidth = 3 + Math.sin(time * 2) * 2;
        context.fillRect(-5, 11.5 + breathOffset, barWidth, 2);
        
        // Belt
        context.fillStyle = suitDark;
        context.fillRect(-14, 18, 28, 4);
        context.fillStyle = accentGold;
        context.beginPath();
        context.roundRect(-3, 17, 6, 6, 2);
        context.fill();
        
        // === ARMS ===
        // Left arm
        context.fillStyle = suitWhite;
        context.save();
        context.translate(-14, 2 + breathOffset);
        context.rotate(-0.4);
        context.beginPath();
        context.roundRect(-5, -2, 10, 24, 5);
        context.fill();
        // Arm stripe
        context.fillStyle = accentBlue;
        context.fillRect(-4, 8, 8, 3);
        // Glove
        context.fillStyle = suitDark;
        context.beginPath();
        context.roundRect(-4, 20, 8, 8, 3);
        context.fill();
        context.restore();
        
        // Right arm (holding weapon)
        context.fillStyle = suitWhite;
        context.save();
        context.translate(14, 2 + breathOffset);
        context.rotate(0.5);
        context.beginPath();
        context.roundRect(-5, -2, 10, 22, 5);
        context.fill();
        // Arm stripe
        context.fillStyle = accentBlue;
        context.fillRect(-4, 8, 8, 3);
        // Glove
        context.fillStyle = suitDark;
        context.beginPath();
        context.roundRect(-4, 18, 8, 8, 3);
        context.fill();
        
        // Laser blaster
        context.fillStyle = '#333';
        context.beginPath();
        context.roundRect(2, 16, 18, 7, 2);
        context.fill();
        context.fillStyle = '#555';
        context.beginPath();
        context.roundRect(4, 18, 8, 3, 1);
        context.fill();
        
        // Blaster energy core
        const pulseSize = 3 + Math.sin(time * 8) * 0.5;
        context.fillStyle = '#00FFFF';
        context.beginPath();
        context.arc(18, 19.5, pulseSize, 0, Math.PI * 2);
        context.fill();
        // Glow effect
        context.fillStyle = 'rgba(0, 255, 255, 0.3)';
        context.beginPath();
        context.arc(18, 19.5, pulseSize + 3, 0, Math.PI * 2);
        context.fill();
        context.restore();
        
        // === HELMET ===
        // Helmet base (white)
        context.fillStyle = suitWhite;
        context.beginPath();
        context.arc(0, -14 + breathOffset, 18, 0, Math.PI * 2);
        context.fill();
        
        // Helmet shading
        context.fillStyle = suitGray;
        context.beginPath();
        context.arc(5, -12 + breathOffset, 14, -0.5, 1.5);
        context.fill();
        
        // Helmet rim
        context.strokeStyle = suitDark;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(0, -14 + breathOffset, 18, 0, Math.PI * 2);
        context.stroke();
        
        // Visor frame
        context.fillStyle = '#444';
        context.beginPath();
        context.ellipse(0, -12 + breathOffset, 13, 11, 0, 0, Math.PI * 2);
        context.fill();
        
        // Visor (golden reflective)
        const visorGradient = context.createLinearGradient(-10, -20 + breathOffset, 10, -4 + breathOffset);
        visorGradient.addColorStop(0, '#8B6914');
        visorGradient.addColorStop(0.3, visorGold);
        visorGradient.addColorStop(0.5, '#FFE55C');
        visorGradient.addColorStop(0.7, visorGold);
        visorGradient.addColorStop(1, '#8B6914');
        context.fillStyle = visorGradient;
        context.beginPath();
        context.ellipse(0, -12 + breathOffset, 11, 9, 0, 0, Math.PI * 2);
        context.fill();
        
        // Visor reflections
        context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        context.beginPath();
        context.ellipse(-5, -17 + breathOffset, 4, 2, -0.4, 0, Math.PI * 2);
        context.fill();
        
        context.fillStyle = 'rgba(255, 255, 255, 0.25)';
        context.beginPath();
        context.ellipse(4, -8 + breathOffset, 3, 1.5, 0.3, 0, Math.PI * 2);
        context.fill();
        
        // Helmet antenna
        context.fillStyle = '#666';
        context.fillRect(-2, -34 + breathOffset, 4, 4);
        context.fillStyle = '#FF0000';
        context.beginPath();
        context.arc(0, -36 + breathOffset, 3, 0, Math.PI * 2);
        context.fill();
        // Antenna blink
        if (Math.sin(time * 4) > 0) {
            context.fillStyle = 'rgba(255, 0, 0, 0.5)';
            context.beginPath();
            context.arc(0, -36 + breathOffset, 5, 0, Math.PI * 2);
            context.fill();
        }
        
        // Oxygen tubes
        context.strokeStyle = '#888';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(-12, -6 + breathOffset);
        context.quadraticCurveTo(-16, 4, -10, 8);
        context.stroke();
        context.beginPath();
        context.moveTo(12, -6 + breathOffset);
        context.quadraticCurveTo(16, 4, 10, 8);
        context.stroke();
    }
    
    /**
     * Draw health bar above player
     * @param {CanvasRenderingContext2D} context
     */
    drawHealthBar(context) {
        const pos = this.getPosition();
        const barWidth = 60;
        const barHeight = 8;
        const x = pos.x - barWidth / 2;
        const y = pos.y - 75; // Higher for bigger player
        
        // Background with rounded corners
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.beginPath();
        context.roundRect(x - 2, y - 2, barWidth + 4, barHeight + 4, 4);
        context.fill();
        
        // Health fill with gradient
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent > 0) {
            const gradient = context.createLinearGradient(x, y, x, y + barHeight);
            if (healthPercent > 0.5) {
                gradient.addColorStop(0, '#4AFF4A');
                gradient.addColorStop(1, '#00CC00');
            } else if (healthPercent > 0.25) {
                gradient.addColorStop(0, '#FFFF4A');
                gradient.addColorStop(1, '#CCAA00');
            } else {
                gradient.addColorStop(0, '#FF4A4A');
                gradient.addColorStop(1, '#CC0000');
            }
            
            context.fillStyle = gradient;
            context.beginPath();
            context.roundRect(x, y, barWidth * healthPercent, barHeight, 2);
            context.fill();
        }
        
        // Border
        context.strokeStyle = '#E8A33C';
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(x, y, barWidth, barHeight, 2);
        context.stroke();
        
        // Health text
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 10px Arial';
        context.textAlign = 'center';
        context.fillText(`${Math.ceil(this.health)}`, pos.x, y - 4);
    }

    /**
     * Clone the player
     * @returns {Player}
     */
    clone() {
        const clone = new Player({
            health: this.health,
            maxSpeed: this.maxSpeed,
            thrustForce: this.thrustForce,
            fuel: this.fuel,
            sprite: this.sprite ? this.sprite.src : undefined
        });
        
        clone.physicsBody = this.physicsBody.clone();
        clone.isActive = this.isActive;
        clone.rotation = this.rotation;
        clone.score = this.score;
        
        return clone;
    }
}
