/**
 * Meteor.js - Enemy/obstacle class
 * 
 * This module implements meteor entities that serve as obstacles/enemies
 * in the game. They have physics properties and can collide with the player.
 * Features various shapes, sizes, and behaviors.
 */

import { Entity } from './Entity.js';

/**
 * Meteor shapes for visual variety
 */
const METEOR_SHAPES = ['circle', 'oval', 'irregular', 'jagged', 'crystal'];

/**
 * Meteor colors based on type
 */
const METEOR_COLORS = {
    rock: ['#8B4513', '#A0522D', '#6B4423'],
    ice: ['#87CEEB', '#ADD8E6', '#B0E0E6'],
    fire: ['#FF4500', '#FF6347', '#DC143C'],
    metal: ['#708090', '#778899', '#696969']
};

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
    /** @type {string} */
    shape = 'circle';
    /** @type {string} */
    meteorType = 'rock';
    /** @type {string} */
    color = '#8B4513';
    /** @type {Array} */
    vertices = [];
    /** @type {number} */
    glowIntensity = 0;
    /** @type {boolean} */
    isExploding = false;
    /** @type {number} */
    explosionTimer = 0;

    /**
     * Create a new Meteor
     * @param {Object} [properties] - Meteor properties
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
        this.meteorType = properties.meteorType || this.getRandomType();
        this.shape = properties.shape || METEOR_SHAPES[Math.floor(Math.random() * METEOR_SHAPES.length)];
        
        // Set size-specific properties
        this.setSize(this.size);
        
        // Generate random vertices for irregular shapes
        this.generateVertices();
        
        // Set color based on type
        const colors = METEOR_COLORS[this.meteorType];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Fire meteors glow
        if (this.meteorType === 'fire') {
            this.glowIntensity = 0.5 + Math.random() * 0.5;
        }
    }
    
    /**
     * Get random meteor type
     */
    getRandomType() {
        const types = ['rock', 'rock', 'rock', 'ice', 'fire', 'metal'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    /**
     * Generate vertices for irregular meteor shapes
     */
    generateVertices() {
        this.vertices = [];
        const baseRadius = this.getRadius();
        const numVertices = this.shape === 'jagged' ? 12 : this.shape === 'crystal' ? 6 : 8;
        
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const variance = this.shape === 'jagged' ? 0.4 : 0.2;
            const radius = baseRadius * (0.7 + Math.random() * variance);
            this.vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
    }
    
    /**
     * Get meteor radius based on size
     */
    getRadius() {
        switch (this.size) {
            case 'small': return 15;
            case 'medium': return 25;
            case 'large': return 40;
            case 'huge': return 60;
            default: return 25;
        }
    }

    /**
     * Set the size of the meteor
     * @param {string} size - Size of the meteor
     */
    setSize(size) {
        this.size = size;
        
        switch (size) {
            case 'small':
                this.health = 15;
                this.damage = 10;
                this.physicsBody.mass = 2000;
                this.rotationSpeed = 2.0 + Math.random() * 2;
                break;
            case 'medium':
                this.health = 30;
                this.damage = 20;
                this.physicsBody.mass = 5000;
                this.rotationSpeed = 1.0 + Math.random();
                break;
            case 'large':
                this.health = 60;
                this.damage = 30;
                this.physicsBody.mass = 10000;
                this.rotationSpeed = 0.3 + Math.random() * 0.5;
                break;
            case 'huge':
                this.health = 100;
                this.damage = 50;
                this.physicsBody.mass = 20000;
                this.rotationSpeed = 0.1 + Math.random() * 0.2;
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
                // Score is handled in EarthScene.js with size-based points
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
        
        // Draw glow effect for fire meteors
        if (this.glowIntensity > 0) {
            const gradient = context.createRadialGradient(0, 0, 0, 0, 0, this.getRadius() * 1.5);
            gradient.addColorStop(0, `rgba(255, 100, 0, ${this.glowIntensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(0, 0, this.getRadius() * 1.5, 0, Math.PI * 2);
            context.fill();
        }
        
        // Draw the sprite if loaded, otherwise draw procedural meteor
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            const radius = this.getRadius();
            context.drawImage(
                this.sprite,
                -radius,
                -radius,
                radius * 2,
                radius * 2
            );
        } else {
            // Draw procedural meteor based on shape
            this.drawProceduralMeteor(context);
        }
        
        // Draw damage indicator (cracks) when health is low
        if (this.health < this.getMaxHealth() * 0.5) {
            this.drawDamageCracks(context);
        }
        
        // Restore the context
        context.restore();
    }
    
    /**
     * Get max health based on size
     */
    getMaxHealth() {
        switch (this.size) {
            case 'small': return 15;
            case 'medium': return 30;
            case 'large': return 60;
            case 'huge': return 100;
            default: return 30;
        }
    }
    
    /**
     * Draw procedural meteor shape
     * @param {CanvasRenderingContext2D} context
     */
    drawProceduralMeteor(context) {
        const radius = this.getRadius();
        
        // Create gradient for 3D effect
        const gradient = context.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
        gradient.addColorStop(0, this.lightenColor(this.color, 40));
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color, 40));
        
        context.fillStyle = gradient;
        context.strokeStyle = this.darkenColor(this.color, 60);
        context.lineWidth = 2;
        
        if (this.shape === 'circle') {
            context.beginPath();
            context.arc(0, 0, radius, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        } else if (this.shape === 'oval') {
            context.beginPath();
            context.ellipse(0, 0, radius * 1.3, radius * 0.8, 0, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        } else {
            // Draw irregular shape using vertices
            context.beginPath();
            if (this.vertices.length > 0) {
                context.moveTo(this.vertices[0].x, this.vertices[0].y);
                for (let i = 1; i < this.vertices.length; i++) {
                    context.lineTo(this.vertices[i].x, this.vertices[i].y);
                }
                context.closePath();
            }
            context.fill();
            context.stroke();
        }
        
        // Add surface details (craters)
        this.drawCraters(context, radius);
    }
    
    /**
     * Draw crater details on meteor
     * @param {CanvasRenderingContext2D} context
     * @param {number} radius
     */
    drawCraters(context, radius) {
        context.fillStyle = this.darkenColor(this.color, 30);
        
        // Draw 2-4 small craters
        const numCraters = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numCraters; i++) {
            const craterRadius = radius * (0.1 + Math.random() * 0.15);
            const angle = (i / numCraters) * Math.PI * 2 + this.rotation;
            const dist = radius * 0.4 * Math.random();
            const cx = Math.cos(angle) * dist;
            const cy = Math.sin(angle) * dist;
            
            context.beginPath();
            context.arc(cx, cy, craterRadius, 0, Math.PI * 2);
            context.fill();
        }
    }
    
    /**
     * Draw damage cracks on meteor
     * @param {CanvasRenderingContext2D} context
     */
    drawDamageCracks(context) {
        context.strokeStyle = 'rgba(255, 200, 100, 0.8)';
        context.lineWidth = 1;
        
        const radius = this.getRadius();
        const numCracks = 3;
        
        for (let i = 0; i < numCracks; i++) {
            const startAngle = (i / numCracks) * Math.PI * 2;
            context.beginPath();
            context.moveTo(0, 0);
            
            let x = 0, y = 0;
            for (let j = 0; j < 3; j++) {
                const angle = startAngle + (Math.random() - 0.5) * 0.5;
                const len = radius * 0.3;
                x += Math.cos(angle) * len;
                y += Math.sin(angle) * len;
                context.lineTo(x, y);
            }
            context.stroke();
        }
    }
    
    /**
     * Lighten a color
     * @param {string} color - Hex color
     * @param {number} amount - Amount to lighten
     */
    lightenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
        const b = Math.min(255, (num & 0x0000FF) + amount);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Darken a color
     * @param {string} color - Hex color
     * @param {number} amount - Amount to darken
     */
    darkenColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
        const b = Math.max(0, (num & 0x0000FF) - amount);
        return `rgb(${r}, ${g}, ${b})`;
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
