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
        
        // Load sprite (fallback to colored rectangle)
        this.loadSprite('assets/sprites/player_earth.png');
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
        
        // Debug: log handleInput being called
        console.log('[Player] handleInput called, keys:', Object.keys(keys));
        
        // For Earth scene, use ground-based movement; otherwise space-based
        // We'll determine this by checking if we have ground contact (passed from EarthScene)
        const isEarthScene = keys['earth_scene'] || false;
        console.log('[Player] isEarthScene:', isEarthScene);
        
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
     * Shoot a projectile
     */
    shoot() {
        if (!this.canShoot) return;
        
        const pos = this.getPosition();
        const projectile = new Projectile({
            x: pos.x,
            y: pos.y - 16, // Shoot from top of player
            velocityX: 0,
            velocityY: -500, // Upward projectile
            owner: this
        });
        
        // Emit event to add projectile to scene
        EventBus.emit('player_shoot', { projectile });
        
        // Start cooldown
        this.canShoot = false;
        this.shootTimer = this.shootCooldown;
        
        console.log('[Player] Shot projectile');
    }
    
    /**
     * Handle ground-based movement (Earth scene)
     * @param {Object} keys - Current key states
     */
    handleGroundMovement(keys) {
        // Debug: log fuel and keys
        console.log('[Player] handleGroundMovement called, fuel:', this.fuel, 'keys:', Object.keys(keys));
        
        // Update shooting cooldown
        if (this.shootTimer > 0) {
            this.shootTimer -= deltaTime;
            if (this.shootTimer <= 0) {
                this.canShoot = true;
                this.shootTimer = 0;
            }
        }
        
        // Shooting (Enter key)
        console.log('[Player] Checking shooting, all keys:', keys);
        console.log('[Player] Enter key check - keys.hasOwnProperty("enter"):', keys.hasOwnProperty('enter'));
        if (keys.hasOwnProperty('enter')) {
            console.log('[Player] Enter key detected, calling shoot()');
            this.shoot();
        }
        
        // Left/Right movement (A/D or ArrowLeft/ArrowRight)
        let horizontalVelocity = 0;
        
        if ((keys['a'] || keys['arrowleft'])) { // && this.fuel > 0) {
            horizontalVelocity = -this.maxSpeed;
            // this.fuel -= 0.3;
            console.log('[Player] Moving left, applying force');
        } else if ((keys['d'] || keys['arrowright'])) { // && this.fuel > 0) {
            horizontalVelocity = this.maxSpeed;
            // this.fuel -= 0.3;
            console.log('[Player] Moving right, applying force');
        }
        
        // Apply horizontal movement
        if (horizontalVelocity !== 0) {
            this.applyForce({
                magnitude: Math.abs(horizontalVelocity),
                direction: { x: horizontalVelocity > 0 ? 1 : -1, y: 0 },
                type: 'thrust'
            });
            console.log('[Player] Force applied, current position:', this.getPosition(), 'velocity:', this.getVelocity());
            
            // Fallback: directly update position if physics isn't working
            const currentPos = this.getPosition();
            const newPos = {
                x: currentPos.x + horizontalVelocity * 0.016, // 60fps timestep
                y: currentPos.y
            };
            this.setPosition(newPos);
            console.log('[Player] Direct position update to:', newPos);
        }
        
        // Jump (W or ArrowUp or Space)
        if ((keys['w'] || keys['arrowup'] || keys['space']) && this.fuel > 0) {
            console.log('[Player] Jump triggered, applying jump force');
            // Apply jump force
            this.applyForce({
                magnitude: 500,
                direction: { x: 0, y: -1 }, // Upward force
                type: 'thrust'
            });
            
            // Fallback: directly update position for jump
            const currentPos = this.getPosition();
            const newPos = {
                x: currentPos.x,
                y: currentPos.y - 15 // Jump up by 15 pixels
            };
            this.setPosition(newPos);
            console.log('[Player] Direct jump position update to:', newPos);
            
            // this.fuel -= 0.5; // Temporarily disabled for testing
        }
        
        // Down movement (S or ArrowDown)
        if ((keys['s'] || keys['arrowdown']) && this.fuel > 0) {
            console.log('[Player] Moving down, applying down force');
            // Apply down force
            this.applyForce({
                magnitude: 300,
                direction: { x: 0, y: 1 }, // Downward force
                type: 'thrust'
            });
            
            // Fallback: directly update position for down movement
            const currentPos = this.getPosition();
            const newPos = {
                x: currentPos.x,
                y: currentPos.y + 10 // Move down by 10 pixels
            };
            this.setPosition(newPos);
            console.log('[Player] Direct down position update to:', newPos);
            
            // this.fuel -= 0.3; // Temporarily disabled for testing
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
     * Shoot a projectile
     */
    shoot() {
        if (!this.isActive) return;
        
        // Create a projectile in the direction the player is facing
        const angle = this.rotation * Math.PI / 180;
        const direction = {
            x: Math.sin(angle),
            y: Math.cos(angle)
        };
        
        // Projectile properties
        const projectile = {
            position: {
                x: this.physicsBody.position.x + direction.x * 50,
                y: this.physicsBody.position.y + direction.y * 50
            },
            velocity: {
                x: this.physicsBody.velocity.x + direction.x * 800,
                y: this.physicsBody.velocity.y + direction.y * 800
            },
            mass: 10,
            sprite: 'projectile.png',
            damage: 20,
            lifetime: 3,
            owner: this
        };
        
        EventBus.emit('create_projectile', projectile);
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
        
        // Rotate based on player's rotation
        context.rotate(this.rotation * Math.PI / 180);
        
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
            // Fallback: draw a colored rectangle
            context.fillStyle = '#00ff00';
            context.fillRect(-20, -20, 40, 40);
        }
        
        // Restore the context
        context.restore();
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
