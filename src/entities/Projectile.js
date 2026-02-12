import { Entity } from './Entity.js';
import { EventBus } from '../core/EventBus.js';

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
            mass: 1
        });
        
        // Set position
        this.setPosition({ x: config.x, y: config.y });
        
        // Set velocity
        this.setVelocity({ 
            x: config.velocityX || 0, 
            y: config.velocityY || -500 
        });
        
        this.damage = 25;
        this.owner = config.owner;
        this.lifetime = 2.0;
        this.age = 0;
        this.trail = [];
        this.maxTrailLength = 8;
        
        // Load sprite (fallback to procedural)
        this.loadSprite('assets/sprites/projectile.png');
    }
    
    /**
     * Update the projectile
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Store position for trail effect
        const pos = this.getPosition();
        this.trail.unshift({ x: pos.x, y: pos.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }
        
        // Age the projectile
        this.age += deltaTime;
        
        // Deactivate after lifetime
        if (this.age >= this.lifetime) {
            this.isActive = false;
        }
        
        // Deactivate if out of bounds
        const canvas = document.getElementById('gameCanvas');
        const maxX = canvas ? canvas.width + 50 : 850;
        const maxY = canvas ? canvas.height + 50 : 650;
        
        if (pos.y < -50 || pos.y > maxY || pos.x < -50 || pos.x > maxX) {
            this.isActive = false;
        }
    }
    
    /**
     * Render the projectile with energy bullet trail effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        if (!this.isActive) return;
        
        const pos = this.getPosition();
        const vel = this.getVelocity();
        
        // Calculate angle based on velocity
        const angle = Math.atan2(vel.y, vel.x);
        const time = Date.now() / 1000;
        
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        
        // === FLAME TRAIL (behind the bullet) ===
        const trailLength = 45 + Math.sin(time * 20) * 5;
        
        // Outer glow trail
        const outerGlow = ctx.createLinearGradient(-trailLength - 20, 0, 10, 0);
        outerGlow.addColorStop(0, 'rgba(0, 100, 255, 0)');
        outerGlow.addColorStop(0.3, 'rgba(0, 150, 255, 0.2)');
        outerGlow.addColorStop(0.7, 'rgba(0, 200, 255, 0.4)');
        outerGlow.addColorStop(1, 'rgba(100, 220, 255, 0.6)');
        
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.moveTo(-trailLength - 15, 0);
        ctx.quadraticCurveTo(-trailLength * 0.5, -12, 0, -6);
        ctx.lineTo(0, 6);
        ctx.quadraticCurveTo(-trailLength * 0.5, 12, -trailLength - 15, 0);
        ctx.closePath();
        ctx.fill();
        
        // Main blue flame trail
        const flameGrad = ctx.createLinearGradient(-trailLength, 0, 5, 0);
        flameGrad.addColorStop(0, 'rgba(0, 50, 150, 0)');
        flameGrad.addColorStop(0.2, 'rgba(0, 100, 255, 0.6)');
        flameGrad.addColorStop(0.5, 'rgba(0, 180, 255, 0.9)');
        flameGrad.addColorStop(0.8, 'rgba(100, 220, 255, 1)');
        flameGrad.addColorStop(1, 'rgba(200, 240, 255, 1)');
        
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-trailLength, 0);
        ctx.quadraticCurveTo(-trailLength * 0.4, -8, 0, -4);
        ctx.lineTo(0, 4);
        ctx.quadraticCurveTo(-trailLength * 0.4, 8, -trailLength, 0);
        ctx.closePath();
        ctx.fill();
        
        // Inner bright core trail
        const coreGrad = ctx.createLinearGradient(-trailLength * 0.6, 0, 5, 0);
        coreGrad.addColorStop(0, 'rgba(150, 220, 255, 0)');
        coreGrad.addColorStop(0.3, 'rgba(200, 240, 255, 0.8)');
        coreGrad.addColorStop(0.7, 'rgba(255, 255, 255, 1)');
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');
        
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.moveTo(-trailLength * 0.5, 0);
        ctx.quadraticCurveTo(-trailLength * 0.2, -3, 0, -2);
        ctx.lineTo(0, 2);
        ctx.quadraticCurveTo(-trailLength * 0.2, 3, -trailLength * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        
        // === BULLET HEAD (metallic) ===
        // Bullet body gradient (silver/chrome)
        const bulletGrad = ctx.createLinearGradient(0, -5, 0, 5);
        bulletGrad.addColorStop(0, '#E8E8E8');
        bulletGrad.addColorStop(0.3, '#FFFFFF');
        bulletGrad.addColorStop(0.5, '#D0D0D0');
        bulletGrad.addColorStop(0.7, '#A0A0A0');
        bulletGrad.addColorStop(1, '#808080');
        
        // Bullet body
        ctx.fillStyle = bulletGrad;
        ctx.beginPath();
        ctx.moveTo(18, 0);  // Pointed tip
        ctx.lineTo(8, -5);
        ctx.lineTo(-2, -5);
        ctx.lineTo(-2, 5);
        ctx.lineTo(8, 5);
        ctx.closePath();
        ctx.fill();
        
        // Bullet tip highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(10, -3);
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.fill();
        
        // Bullet ring (copper/gold band)
        const ringGrad = ctx.createLinearGradient(0, -5, 0, 5);
        ringGrad.addColorStop(0, '#D4A84B');
        ringGrad.addColorStop(0.3, '#FFD700');
        ringGrad.addColorStop(0.5, '#FFC125');
        ringGrad.addColorStop(0.7, '#D4A84B');
        ringGrad.addColorStop(1, '#8B6914');
        
        ctx.fillStyle = ringGrad;
        ctx.fillRect(-2, -5, 4, 10);
        
        // Energy glow around bullet
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(8, -5);
        ctx.lineTo(-2, -5);
        ctx.lineTo(-2, 5);
        ctx.lineTo(8, 5);
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.restore();
        
        // Draw particle sparkles in trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.8 - (i / this.trail.length);
            const sparkle = Math.random() > 0.7;
            
            if (sparkle) {
                ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(
                    this.trail[i].x + (Math.random() - 0.5) * 10,
                    this.trail[i].y + (Math.random() - 0.5) * 10,
                    1 + Math.random() * 2,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
    
    /**
     * Handle collision with another entity
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
