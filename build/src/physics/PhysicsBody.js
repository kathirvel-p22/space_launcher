/**
 * PhysicsBody.js - Force-based physics engine
 * 
 * This module implements a force-based physics engine using Newtonian physics.
 * It handles force accumulation, acceleration, velocity, and position updates.
 */

/**
 * 2D vector representation
 * @typedef {Object} Vector2
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * Force representation
 * @typedef {Object} Force
 * @property {number} magnitude - Magnitude of the force
 * @property {Vector2} direction - Direction vector
 * @property {string} type - Type of force (thrust, gravity, drag, impulse)
 */

/**
 * Physics body that implements force-based physics
 */
export class PhysicsBody {
    /** @type {Vector2} */
    position = { x: 0, y: 0 };
    /** @type {Vector2} */
    velocity = { x: 0, y: 0 };
    /** @type {Vector2} */
    acceleration = { x: 0, y: 0 };
    /** @type {number} */
    mass = 1;
    /** @type {number} */
    dragCoefficient = 0;
    /** @type {number} */
    elasticity = 0.8;
    /** @type {boolean} */
    isStatic = false;

    /**
     * Create a new PhysicsBody
     * @param {Object} [options] - Physics body options
     * @param {number} [options.mass=1] - Mass of the body
     * @param {number} [options.dragCoefficient=0] - Drag coefficient
     * @param {number} [options.elasticity=0.8] - Elasticity (bounciness)
     * @param {boolean} [options.isStatic=false] - Whether the body is static
     */
    constructor(options = {}) {
        this.mass = options.mass || 1;
        this.dragCoefficient = options.dragCoefficient || 0;
        this.elasticity = options.elasticity || 0.8;
        this.isStatic = options.isStatic || false;
    }

    /**
     * Apply a force to the body
     * @param {Force} force - Force to apply
     */
    applyForce(force) {
        if (this.isStatic) return;
        
        const forceVector = {
            x: force.magnitude * force.direction.x,
            y: force.magnitude * force.direction.y
        };
        
        this.acceleration.x += forceVector.x / this.mass;
        this.acceleration.y += forceVector.y / this.mass;
    }

    /**
     * Apply an impulse (instant force)
     * @param {number} magnitude - Magnitude of the impulse
     * @param {Vector2} direction - Direction of the impulse
     */
    applyImpulse(magnitude, direction) {
        if (this.isStatic) return;
        
        this.velocity.x += (magnitude * direction.x) / this.mass;
        this.velocity.y += (magnitude * direction.y) / this.mass;
    }

    /**
     * Apply drag force based on velocity
     * @param {number} deltaTime - Time since last update
     */
    applyDrag(deltaTime) {
        if (this.isStatic || this.dragCoefficient === 0) return;
        
        const speed = Math.sqrt(
            this.velocity.x * this.velocity.x + 
            this.velocity.y * this.velocity.y
        );
        
        if (speed > 0) {
            const dragMagnitude = 0.5 * this.dragCoefficient * speed * speed;
            const dragVector = {
                x: -this.velocity.x / speed * dragMagnitude,
                y: -this.velocity.y / speed * dragMagnitude
            };
            
            this.applyForce({
                magnitude: dragMagnitude,
                direction: dragVector,
                type: 'drag'
            });
        }
    }

    /**
     * Update the physics body
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (this.isStatic) return;
        
        // Apply drag force
        this.applyDrag(deltaTime);
        
        // Update velocity using acceleration
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        
        // Update position using velocity
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        
        // Reset acceleration for next frame
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    /**
     * Get the speed of the body
     * @returns {number}
     */
    getSpeed() {
        return Math.sqrt(
            this.velocity.x * this.velocity.x + 
            this.velocity.y * this.velocity.y
        );
    }

    /**
     * Get the direction vector (normalized)
     * @returns {Vector2}
     */
    getDirection() {
        const speed = this.getSpeed();
        if (speed === 0) return { x: 0, y: 0 };
        
        return {
            x: this.velocity.x / speed,
            y: this.velocity.y / speed
        };
    }

    /**
     * Check for collision with another physics body
     * @param {PhysicsBody} other - Other physics body
     * @param {number} [radius1=10] - Radius of this body
     * @param {number} [radius2=10] - Radius of the other body
     * @returns {boolean}
     */
    checkCollision(other, radius1 = 10, radius2 = 10) {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (radius1 + radius2);
    }

    /**
     * Handle collision with another physics body
     * @param {PhysicsBody} other - Other physics body
     * @param {number} [radius1=10] - Radius of this body
     * @param {number} [radius2=10] - Radius of the other body
     */
    handleCollision(other, radius1 = 10, radius2 = 10) {
        if (this.isStatic && other.isStatic) return;
        
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate normal vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate relative velocity
        const rvx = this.velocity.x - other.velocity.x;
        const rvy = this.velocity.y - other.velocity.y;
        
        // Calculate relative velocity in terms of the normal direction
        const velocityAlongNormal = rvx * nx + rvy * ny;
        
        // Do not resolve if objects are moving apart
        if (velocityAlongNormal > 0) return;
        
        // Calculate impulse scalar
        const j = -(1 + Math.min(this.elasticity, other.elasticity)) * velocityAlongNormal;
        j /= 1 / this.mass + 1 / other.mass;
        
        // Apply impulse
        const impulseX = j * nx;
        const impulseY = j * ny;
        
        if (!this.isStatic) {
            this.velocity.x -= impulseX / this.mass;
            this.velocity.y -= impulseY / this.mass;
        }
        
        if (!other.isStatic) {
            other.velocity.x += impulseX / other.mass;
            other.velocity.y += impulseY / other.mass;
        }
        
        // Position correction to prevent sticking
        const overlap = (radius1 + radius2) - distance;
        const correctionPercentage = 0.2; // 20% correction
        const correction = overlap * correctionPercentage;
        
        if (!this.isStatic) {
            this.position.x += nx * correction * (radius2 / (radius1 + radius2));
            this.position.y += ny * correction * (radius2 / (radius1 + radius2));
        }
        
        if (!other.isStatic) {
            other.position.x -= nx * correction * (radius1 / (radius1 + radius2));
            other.position.y -= ny * correction * (radius1 / (radius1 + radius2));
        }
    }

    /**
     * Set position
     * @param {Vector2} position - New position
     */
    setPosition(position) {
        this.position = { ...position };
    }

    /**
     * Set velocity
     * @param {Vector2} velocity - New velocity
     */
    setVelocity(velocity) {
        this.velocity = { ...velocity };
    }

    /**
     * Set acceleration
     * @param {Vector2} acceleration - New acceleration
     */
    setAcceleration(acceleration) {
        this.acceleration = { ...acceleration };
    }

    /**
     * Clone the physics body
     * @returns {PhysicsBody}
     */
    clone() {
        const clone = new PhysicsBody({
            mass: this.mass,
            dragCoefficient: this.dragCoefficient,
            elasticity: this.elasticity,
            isStatic: this.isStatic
        });
        
        clone.position = { ...this.position };
        clone.velocity = { ...this.velocity };
        clone.acceleration = { ...this.acceleration };
        
        return clone;
    }
}
