/**
 * planets.js - Planet configuration with gravity and physics
 * 
 * This module contains configuration data for all planets in the game,
 * including their gravitational properties and physics parameters.
 */

/**
 * Planet configuration interface
 * @typedef {Object} PlanetConfig
 * @property {string} name - Name of the planet
 * @property {number} mass - Mass of the planet in kg
 * @property {number} radius - Radius of the planet in meters
 * @property {number} gConstant - Gravitational constant
 * @property {number} surfaceGravity - Surface gravity in m/s²
 * @property {string} color - Color of the planet
 * @property {string} texture - Texture image path
 * @property {number} [atmosphereDensity=0] - Atmosphere density for drag
 * @property {string} [background] - Background image for this planet
 */

/**
 * Planet configurations for all environments
 */
export const PLANET_CONFIGS = {
    /**
     * Earth configuration
     */
    earth: {
        name: 'Earth',
        mass: 5.972e24,      // kg
        radius: 6.371e6,     // meters
        gConstant: 6.67430e-11,
        surfaceGravity: 9.81, // m/s²
        color: '#1da1f2',
        texture: 'earth_texture.png',
        atmosphereDensity: 1.225, // kg/m³ at sea level
        background: 'earth_background.png'
    },
    
    /**
     * Moon configuration
     */
    moon: {
        name: 'Moon',
        mass: 7.342e22,      // kg
        radius: 1.737e6,     // meters
        gConstant: 6.67430e-11,
        surfaceGravity: 1.62, // m/s²
        color: '#f5f5dc',
        texture: 'moon_texture.png',
        atmosphereDensity: 0, // No atmosphere
        background: 'moon_background.png'
    },
    
    /**
     * Mars configuration
     */
    mars: {
        name: 'Mars',
        mass: 6.39e23,       // kg
        radius: 3.389e6,     // meters
        gConstant: 6.67430e-11,
        surfaceGravity: 3.71, // m/s²
        color: '#c1440e',
        texture: 'mars_texture.png',
        atmosphereDensity: 0.02, // Very thin atmosphere
        background: 'mars_background.png'
    },
    
    /**
     * Sky environment (Earth atmosphere)
     */
    sky: {
        name: 'Sky',
        mass: 5.972e24,      // Same as Earth
        radius: 6.371e6 + 100000, // Earth + 100km atmosphere
        gConstant: 6.67430e-11,
        surfaceGravity: 9.81,
        color: '#87ceeb',
        texture: 'sky_texture.png',
        atmosphereDensity: 1.225,
        background: 'sky_background.png'
    },
    
    /**
     * Space environment (no significant gravity)
     */
    space: {
        name: 'Space',
        mass: 0,             // No significant gravity
        radius: 0,
        gConstant: 6.67430e-11,
        surfaceGravity: 0,
        color: '#000000',
        texture: 'space_texture.png',
        atmosphereDensity: 0,
        background: 'space_background.png'
    }
};

/**
 * Get planet configuration by name
 * @param {string} name - Name of the planet
 * @returns {PlanetConfig | undefined}
 */
export function getPlanetConfig(name) {
    return PLANET_CONFIGS[name.toLowerCase()] || undefined;
}

/**
 * Calculate gravity force between two objects
 * @param {Object} object1 - First object
 * @param {number} object1.mass - Mass of first object
 * @param {Object} object1.position - Position of first object
 * @param {Object} object2 - Second object
 * @param {number} object2.mass - Mass of second object
 * @param {Object} object2.position - Position of second object
 * @param {number} [gConstant=6.67430e-11] - Gravitational constant
 * @returns {Object} Force vector
 */
export function calculateGravityForce(object1, object2, gConstant = 6.67430e-11) {
    const dx = object2.position.x - object1.position.x;
    const dy = object2.position.y - object1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Avoid division by zero
    if (distance < 0.1) return { x: 0, y: 0 };
    
    // Inverse-square law: F = G * (m1 * m2) / r²
    const forceMagnitude = (gConstant * object1.mass * object2.mass) / (distance * distance);
    
    // Normalize direction vector
    const direction = {
        x: dx / distance,
        y: dy / distance
    };
    
    return {
        x: forceMagnitude * direction.x,
        y: forceMagnitude * direction.y
    };
}

/**
 * Calculate atmospheric drag force
 * @param {Object} object - Object moving through atmosphere
 * @param {number} object.velocity - Velocity magnitude
 * @param {number} object.area - Cross-sectional area
 * @param {number} atmosphereDensity - Atmosphere density
 * @param {number} dragCoefficient - Drag coefficient
 * @returns {Object} Drag force vector
 */
export function calculateDragForce(object, atmosphereDensity, dragCoefficient = 0.47) {
    const speed = object.velocity;
    const dragMagnitude = 0.5 * atmosphereDensity * speed * speed * dragCoefficient * object.area;
    
    // Drag force opposes velocity
    const direction = {
        x: -object.velocityDirection.x,
        y: -object.velocityDirection.y
    };
    
    return {
        x: dragMagnitude * direction.x,
        y: dragMagnitude * direction.y
    };
}
