import { Entity } from './Entity.js';

/**
 * Projectile entity fired by the player
 */
export class Projectile extends Entity {
    /**
     * Create a new projectile
     * @param {Object} config - Projectile configuration
     * @param {number} config.x - X position
     * @param {number} config.y - Y position
     * @param {number} config.velocityX - X velocity
     * @param {number} config.velocityY - Y velocity
     * @param {Entity} config.owner - Entity that fired this projectile
     */
    constructor(config) {
        super({
            name: 'Projectile',
            health: 1,
            maxHealth: 1,
            position: { x: config.x, y: config.y },
            velocity: { x: config.velocityX || 0, y: config.velocityY || -500 },
            size: { width: 8, height: 8 },
            mass: 1
        });
        
        this.damage = 25;
        this.owner = config.owner;
        this.lifetime = 2.0; // 2 seconds lifetime
        this.age = 0;
        
        // Load sprite (fallback to colored rectangle)
        this.loadSprite('assets/sprites/projectile.png');
    }
    
    /**
     * Update the projectile
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.isActive) return;
        
        // Age the projectile
        this.age += deltaTime;
        
        // Deactivate after lifetime
        if (this.age >= this.lifetime) {
            this.isActive = false;
        }
        
        // Deactivate if out of bounds
        const pos = this.getPosition();
        if (pos.y < -50 || pos.y > 850 || pos.x < -50 || pos.x > 850) {
            this.isActive = false;
        }
    }
    
    /**
     * Render the projectile
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        if (!this.isActive) return;
        
        const pos = this.getPosition();
        
        // Fallback rendering: draw yellow circle
        if (!this.sprite || !this.sprite.complete) {
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        
        // Render sprite
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.drawImage(this.sprite, -4, -4, 8, 8);
        ctx.restore();
    }
    
    /**
     * Handle collision with another so.thing
     * @ the meteor
     * @param {Entity} other - Other entity
     */
    onCollision(other) {
        if (!this.isActive) return;
        
        // Deactivate on collision
        this.isActive = false;
        
        // Emit event for score/cleanup
        if (this.owner && this.owner.name === 'Player') {
            EventBus.emit('projectile_hit', {
                projectile: this,
                target: other,
                damage: this.damage
            });
        }
    }
}
