/**
 * LevelManager.js - Data-driven level loading
 * 
 * This module handles loading level configurations from JSON files
 * and instantiating entities based on the level data.
 */

import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import { Player } from '../entities/Player.js';
import { Meteor } from '../entities/Meteor.js';
import { Planet } from '../entities/Planet.js';
import { Rocket } from '../entities/Rocket.js';

/**
 * Level configuration interface
 * @typedef {Object} LevelConfig
 * @property {number} id - Level ID
 * @property {string} name - Level name
 * @property {string} scene - Scene type
 * @property {Array} gravityWells - Gravity well configurations
 * @property {Array} entities - Entity configurations
 * @property {Array} objectives - Level objectives
 * @property {string} background - Background image
 * @property {string} music - Background music
 * @property {Array} ambientSounds - Ambient sound effects
 * @property {number} difficulty - Difficulty level
 * @property {Array} requiredUnlocks - Required unlocks
 */

/**
 * Gravity well configuration
 * @typedef {Object} GravityWellConfig
 * @property {string} type - Type of gravity well
 * @property {Object} position - Position coordinates
 * @property {number} mass - Mass of the gravity well
 * @property {number} radius - Radius of the gravity well
 * @property {number} [gConstant] - Gravitational constant
 * @property {string} [color] - Color of the gravity well
 * @property {string} [texture] - Texture for the gravity well
 */

/**
 * Entity configuration
 * @typedef {Object} EntityConfig
 * @property {string} type - Type of entity
 * @property {Object} position - Position coordinates
 * @property {Object} properties - Entity properties
 */

/**
 * Level objective
 * @typedef {Object} Objective
 * @property {string} type - Type of objective
 * @property {string} target - Target for the objective
 * @property {string} description - Objective description
 * @property {Function} successCondition - Success condition function
 */

/**
 * Manages level loading and entity instantiation
 */
export class LevelManager {
    /** @type {Array<LevelConfig>} */
    levels = [];

    /**
     * Load a level configuration from JSON or generate dynamically
     * @param {number} levelId - ID of the level to load
     * @returns {Promise<LevelConfig>}
     */
    async loadLevel(levelId) {
        try {
            // Earth levels (1-10) - load from JSON
            if (levelId >= 1 && levelId <= 10) {
                const response = await fetch(`/src/levels/level_data/earth_level_${levelId.toString().padStart(3, '0')}.json`);
                if (response.ok) {
                    return await response.json();
                }
            }
            
            // Sky levels (11-25) - generate dynamically
            if (levelId >= 11 && levelId <= 25) {
                return this.generateSkyLevel(levelId);
            }
            
            // Space levels (26-45) - generate dynamically
            if (levelId >= 26 && levelId <= 45) {
                return this.generateSpaceLevel(levelId);
            }
            
            // Moon levels (46-65) - generate dynamically
            if (levelId >= 46 && levelId <= 65) {
                return this.generateMoonLevel(levelId);
            }
            
            // Mars levels (66-100) - generate dynamically
            if (levelId >= 66 && levelId <= 100) {
                return this.generateMarsLevel(levelId);
            }
            
            // Fallback to regular level format
            const response = await fetch(`/src/levels/level_data/level_${levelId.toString().padStart(3, '0')}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load level ${levelId}: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading level:', error);
            throw error;
        }
    }
    
    /**
     * Generate Sky level configuration (levels 11-25)
     * @param {number} levelId - Level ID
     * @returns {LevelConfig}
     */
    generateSkyLevel(levelId) {
        const skyDescriptions = {
            11: 'Rocket Activation - Learn controls',
            12: 'Fuel Awareness',
            13: 'Falling Debris',
            14: 'Momentum Control',
            15: 'Endurance Ascent (Checkpoint)',
            16: 'Fire Introduction',
            17: 'Wind & Fire',
            18: 'First Drones',
            19: 'Drone Swarm',
            20: 'Mixed Hazard Zone (Checkpoint)',
            21: 'Firestorm Ascent',
            22: 'Drone Formations',
            23: 'Narrow Safe Paths',
            24: 'Pre-Atmosphere Zone',
            25: 'Atmospheric Break - Final'
        };
        
        return {
            id: levelId,
            name: `Sky Level ${levelId}`,
            scene: 'sky',
            description: skyDescriptions[levelId] || `Sky Level ${levelId}`,
            chapter: 2,
            chapterName: 'SKY - The Burning Ascent',
            gravityWells: [],
            entities: [],
            objectives: [{ type: 'complete', description: skyDescriptions[levelId] }],
            background: 'assets/sprites/sky_background.png',
            music: 'assets/audio/space_ambient.mp3',
            ambientSounds: [],
            difficulty: Math.floor((levelId - 10) / 3) + 1,
            requiredUnlocks: [levelId - 1]
        };
    }
    
    /**
     * Generate Space level configuration (levels 26-45)
     * @param {number} levelId - Level ID
     * @returns {LevelConfig}
     */
    generateSpaceLevel(levelId) {
        return {
            id: levelId,
            name: `Space Level ${levelId}`,
            scene: 'space',
            description: `Space Level ${levelId - 25}`,
            chapter: 3,
            chapterName: 'SPACE - The Void',
            gravityWells: [],
            entities: [],
            objectives: [{ type: 'complete', description: `Complete Space Level ${levelId - 25}` }],
            background: 'assets/sprites/space_background.png',
            music: 'assets/audio/space_ambient.mp3',
            ambientSounds: [],
            difficulty: Math.floor((levelId - 25) / 4) + 1,
            requiredUnlocks: [levelId - 1]
        };
    }
    
    /**
     * Generate Moon level configuration (levels 46-65)
     * @param {number} levelId - Level ID
     * @returns {LevelConfig}
     */
    generateMoonLevel(levelId) {
        return {
            id: levelId,
            name: `Moon Level ${levelId}`,
            scene: 'moon',
            description: `Moon Level ${levelId - 45}`,
            chapter: 4,
            chapterName: 'MOON - Lunar Landing',
            gravityWells: [],
            entities: [],
            objectives: [{ type: 'complete', description: `Complete Moon Level ${levelId - 45}` }],
            background: 'assets/sprites/moon_background.png',
            music: 'assets/audio/moon_orbit.mp3',
            ambientSounds: [],
            difficulty: Math.floor((levelId - 45) / 4) + 1,
            requiredUnlocks: [levelId - 1]
        };
    }
    
    /**
     * Generate Mars level configuration (levels 66-100)
     * @param {number} levelId - Level ID
     * @returns {LevelConfig}
     */
    generateMarsLevel(levelId) {
        return {
            id: levelId,
            name: `Mars Level ${levelId}`,
            scene: 'mars',
            description: `Mars Level ${levelId - 65}`,
            chapter: 5,
            chapterName: 'MARS - The Red Planet',
            gravityWells: [],
            entities: [],
            objectives: [{ type: 'complete', description: `Complete Mars Level ${levelId - 65}` }],
            background: 'assets/sprites/mars_background.png',
            music: 'assets/audio/mars_orbit.mp3',
            ambientSounds: [],
            difficulty: Math.floor((levelId - 65) / 5) + 1,
            requiredUnlocks: [levelId - 1]
        };
    }

    /**
     * Instantiate entities from level configuration
     * @param {LevelConfig} levelConfig - Level configuration
     * @param {PhysicsEngine} physicsEngine - Physics engine instance
     * @returns {Array} Array of instantiated entities
     */
    instantiateEntities(levelConfig, physicsEngine) {
        const entities = [];
        
        levelConfig.entities.forEach(entityConfig => {
            try {
                switch (entityConfig.type) {
                    case 'player':
                        const player = new Player(entityConfig.properties);
                        player.position = entityConfig.position;
                        entities.push(player);
                        break;
                    
                    case 'meteor':
                        const meteor = new Meteor(entityConfig.properties);
                        meteor.position = entityConfig.position;
                        entities.push(meteor);
                        break;
                    
                    case 'planet':
                        const planet = new Planet(entityConfig.properties);
                        planet.position = entityConfig.position;
                        entities.push(planet);
                        break;
                    
                    case 'rocket':
                        const rocket = new Rocket(entityConfig.properties);
                        rocket.position = entityConfig.position;
                        entities.push(rocket);
                        break;
                    
                    default:
                        console.warn(`Unknown entity type: ${entityConfig.type}`);
                }
            } catch (error) {
                console.error(`Error instantiating entity ${entityConfig.type}:`, error);
            }
        });
        
        return entities;
    }

    /**
     * Get level configuration by ID
     * @param {number} levelId - Level ID
     * @returns {LevelConfig | undefined}
     */
    getLevelConfig(levelId) {
        return this.levels.find(level => level.id === levelId);
    }

    /**
     * Load all level configurations
     * @returns {Promise<void>}
     */
    async loadAllLevels() {
        for (let i = 1; i <= 100; i++) {
            try {
                const levelConfig = await this.loadLevel(i);
                this.levels.push(levelConfig);
            } catch (error) {
                console.warn(`Could not load level ${i}:`, error.message);
                // Some levels may not exist yet, which is okay
            }
        }
    }

    /**
     * Check if a level is unlocked
     * @param {number} levelId - Level ID to check
     * @param {Array<number>} completedLevels - Array of completed level IDs
     * @returns {boolean}
     */
    isLevelUnlocked(levelId, completedLevels) {
        const levelConfig = this.getLevelConfig(levelId);
        if (!levelConfig) return false;
        
        // Level 1 is always unlocked
        if (levelId === 1) return true;
        
        // Check if all required unlocks are completed
        return levelConfig.requiredUnlocks.every(
            unlockId => completedLevels.includes(unlockId)
        );
    }
}
