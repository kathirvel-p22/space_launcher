/**
 * SkyScene.js - Sky chapter with rocket flying gameplay (Levels 11-25)
 * 
 * CHAPTER 2: SKY – The Burning Ascent
 * - Rocket-based thrust movement
 * - Fuel management system
 * - Heat system (overheating)
 * - Enemies: Debris, Fireballs, Drones
 * - Progressive difficulty through atmosphere
 */

import { Scene } from '../core/Scene.js';
import { Rocket } from '../entities/Rocket.js';
import { Meteor } from '../entities/Meteor.js';
import { Projectile } from '../entities/Projectile.js';
import { EventBus } from '../core/EventBus.js';

/**
 * Sky scene - Rocket flying through atmosphere
 */
export class SkyScene extends Scene {
    /** @type {Rocket} */
    rocket = null;
    /** @type {Array} */
    meteors = [];
    /** @type {Array} */
    projectiles = [];
    /** @type {Array} */
    drones = [];
    /** @type {Array} */
    fireballs = [];
    /** @type {Array} */
    clouds = [];
    /** @type {Array} */
    stars = [];
    /** @type {number} */
    altitude = 0;
    /** @type {number} */
    heat = 0;
    /** @type {number} */
    maxHeat = 100;
    /** @type {number} */
    score = 0;
    /** @type {number} */
    targetScore = 500;
    /** @type {boolean} */
    levelComplete = false;
    /** @type {number} */
    spawnTimer = 0;
    /** @type {Object} */
    levelConfig = null;
    /** @type {number} */
    windForce = 0;
    /** @type {number} */
    sidewaysDrift = 0;
    /** @type {number} */
    controlLag = 0;
    /** @type {number} */
    inputDelay = 0;
    /** @type {Array} */
    delayedInputs = [];
    /** @type {number} */
    cameraShakeIntensity = 0;
    /** @type {boolean} */
    visualBlur = false;

    // Level configurations for Sky chapter (11-25) - ADVANCED CONCEPTS
    static LEVEL_CONFIGS = {
        // UNSTABLE ASCENT (11-15)
        11: { // Emergency Launch
            targetScore: 200, gravity: 0.3, fuelUnlimited: false, heatEnabled: false,
            enemies: ['debris'], spawnRate: 2.0, objective: 'altitude', targetAltitude: 5000,
            description: 'Emergency Launch',
            mechanics: { windPush: true, fuelDrainUneven: true, controlLag: 0.1, shake: true }
        },
        12: { // Broken Stabilizers
            targetScore: 300, gravity: 0.28, fuelUnlimited: false, heatEnabled: false,
            enemies: ['debris'], spawnRate: 1.8, objective: 'altitude', targetAltitude: 8000,
            description: 'Broken Stabilizers',
            mechanics: { sidewaysDrift: 50, debrisClusters: true }
        },
        13: { // Air Traffic Graveyard
            targetScore: 500, gravity: 0.26, fuelUnlimited: false, heatEnabled: false,
            enemies: ['debris'], spawnRate: 0.8, objective: 'score',
            description: 'Air Traffic Graveyard',
            mechanics: { denseDebris: true, chainCollisions: true, narrowPaths: true }
        },
        14: { // Fuel Crisis
            targetScore: 600, gravity: 0.24, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris'], spawnRate: 1.2, objective: 'score',
            description: 'Fuel Crisis',
            mechanics: { doubleFuelDrain: true, noRefuel: true, minimalThrust: true }
        },
        15: { // Point of No Return - Checkpoint
            targetScore: 800, gravity: 0.22, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris', 'fireball'], spawnRate: 1.0, objective: 'score',
            description: 'Point of No Return',
            mechanics: { continuousAscent: true, overheatingZones: true, noSafeZones: true }
        },
        
        // FIRE CORRIDOR (16-20)
        16: { // Thermal Wall
            targetScore: 900, gravity: 0.20, fuelUnlimited: false, heatEnabled: true,
            enemies: ['fireball'], spawnRate: 1.0, objective: 'score',
            description: 'Thermal Wall',
            mechanics: { flameBarriers: true, heatSpikes: true, slowCooling: true }
        },
        17: { // Burning Winds
            targetScore: 1100, gravity: 0.18, fuelUnlimited: false, heatEnabled: true,
            enemies: ['fireball'], spawnRate: 0.9, windEnabled: true,
            objective: 'score', description: 'Burning Winds',
            mechanics: { diagonalFireballs: true, windReversals: true, visualBlur: true }
        },
        18: { // Drone Interference
            targetScore: 1300, gravity: 0.16, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris', 'fireball', 'drone'], spawnRate: 0.8, droneCount: 2,
            objective: 'score', description: 'Drone Interference',
            mechanics: { trackingEnemies: true, slowMissiles: true, heatCombat: true }
        },
        19: { // Sky Battlefield
            targetScore: 1600, gravity: 0.14, fuelUnlimited: false, heatEnabled: true,
            enemies: ['drone'], spawnRate: 0.7, droneCount: 4,
            objective: 'score', description: 'Sky Battlefield',
            mechanics: { multipleDrones: true, crossfire: true, noFuelPickups: true }
        },
        20: { // Combustion Zone - Checkpoint
            targetScore: 1900, gravity: 0.12, fuelUnlimited: false, heatEnabled: true,
            enemies: ['fireball'], spawnRate: 0.6, objective: 'score',
            description: 'Combustion Zone',
            mechanics: { firestorms: true, explosiveDebris: true, constantOverheat: true }
        },
        
        // BREAKPOINT (21-24)
        21: { // System Glitch
            targetScore: 2100, gravity: 0.10, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris', 'fireball'], spawnRate: 0.5, heatMultiplier: 1.5,
            objective: 'score', description: 'System Glitch',
            mechanics: { delayedInput: 0.15, cameraShake: true, falseWarnings: true }
        },
        22: { // Control Lag
            targetScore: 2400, gravity: 0.08, fuelUnlimited: false, heatEnabled: true,
            enemies: ['drone'], spawnRate: 0.5, droneCount: 5, advancedDrones: true,
            objective: 'score', description: 'Control Lag',
            mechanics: { inputDelay: 0.2, reverseThrust: true, limitedReaction: true }
        },
        23: { // Narrow Corridor
            targetScore: 2700, gravity: 0.06, fuelUnlimited: false, heatEnabled: true,
            enemies: ['fireball'], spawnRate: 0.4, fireWalls: true,
            objective: 'score', description: 'Narrow Corridor',
            mechanics: { pixelPerfect: true, instantDeath: true, noCorrection: true }
        },
        24: { // Overheat Warning
            targetScore: 2900, gravity: 0.04, fuelUnlimited: false, heatEnabled: true,
            enemies: [], spawnRate: 0, extremeHeat: true, heatMultiplier: 2.0,
            objective: 'survive', surviveTime: 30, description: 'Overheat Warning',
            mechanics: { permanentHeatRise: true, movementSlowdown: true, screenDistortion: true }
        },
        25: { // ATMOSPHERE COLLAPSE - Final
            targetScore: 3000, gravity: 0.02, fuelUnlimited: true, heatEnabled: true,
            enemies: [], spawnRate: 0, atmosphericBreak: true,
            objective: 'survive', surviveTime: 20, description: 'Atmosphere Collapse',
            mechanics: { infiniteFire: true, noFuelRegen: false, survivalTimer: true }
        }
    };

    /**
     * Initialize the Sky scene
     * @param {LevelConfig} levelConfig - Level configuration
     */
    initialize(levelConfig) {
        super.initialize(levelConfig);
        
        const levelNum = levelConfig.id;
        this.currentLevel = levelNum;
        this.levelStartTime = performance.now();
        this.score = 0;
        this.heat = 0;
        this.altitude = 0;
        this.levelComplete = false;
        this.surviveTimer = 0;
        
        // Get level-specific config
        this.skyConfig = SkyScene.LEVEL_CONFIGS[levelNum] || SkyScene.LEVEL_CONFIGS[11];
        this.targetScore = this.skyConfig.targetScore;
        this.gravity = this.skyConfig.gravity;
        
        // Initialize advanced mechanics
        const mechanics = this.skyConfig.mechanics || {};
        this.controlLag = mechanics.controlLag || 0;
        this.inputDelay = mechanics.inputDelay || mechanics.delayedInput || 0;
        this.sidewaysDrift = mechanics.sidewaysDrift || 0;
        this.cameraShakeIntensity = mechanics.cameraShake ? 3 : 0;
        this.visualBlur = mechanics.visualBlur || false;
        this.windForce = mechanics.windPush ? 30 : 0;
        
        // Fuel drain modifiers
        if (mechanics.doubleFuelDrain) {
            this.fuelDrainMultiplier = 2.0;
        } else if (mechanics.fuelDrainUneven) {
            this.fuelDrainMultiplier = 1.0 + Math.random() * 0.5;
        } else {
            this.fuelDrainMultiplier = 1.0;
        }
        
        // Create rocket
        this.createRocket();
        
        // Generate clouds and stars
        this.generateEnvironment();
        
        // Setup controls with a small delay to ensure previous scene cleanup is complete
        setTimeout(() => {
            this.setupControls();
        }, 100);
        
        // Setup event listeners
        EventBus.on('rocket_shoot', (data) => this.projectiles.push(data.projectile));
        
        // Show level objective
        if (window.gameState && window.gameState.hud) {
            const objective = {
                type: this.skyConfig.objective || 'score',
                target: this.skyConfig.objective === 'score' ? this.targetScore : 
                       this.skyConfig.objective === 'altitude' ? this.skyConfig.targetAltitude :
                       this.skyConfig.surviveTime,
                description: this.getObjectiveDescription()
            };
            window.gameState.hud.showLevelObjective(objective);
        }
        
        console.log(`[SkyScene] Level ${levelNum}: ${this.skyConfig.description}`);
    }

    createRocket() {
        this.rocket = new Rocket({ mass: 300, fuel: 100, thrustForce: 1500 });
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            this.rocket.setPosition({ x: canvas.width / 2, y: canvas.height - 120 });
        }
        this.rocket.isActive = true;
        this.rocket.canShoot = true;
        
        // Set fuel based on level config
        if (this.skyConfig.fuelUnlimited) {
            this.rocket.fuel = 100;
            this.rocket.maxFuel = 100;
        }
    }

    generateEnvironment() {
        this.clouds = [];
        this.stars = [];
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        // Generate clouds
        for (let i = 0; i < 12; i++) {
            this.clouds.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 60 + Math.random() * 80,
                speed: 30 + Math.random() * 50
            });
        }
        
        // Generate stars
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 1 + Math.random() * 2,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    setupControls() {
        console.log('[SkyScene] Setting up controls...');
        
        // Remove ALL existing event listeners (including EarthScene's)
        const oldKeyDown = this.handleKeyDown;
        const oldKeyUp = this.handleKeyUp;
        
        if (oldKeyDown) {
            document.removeEventListener('keydown', oldKeyDown, true);
            document.removeEventListener('keydown', oldKeyDown, false);
            console.log('[SkyScene] Removed old keydown listener');
        }
        if (oldKeyUp) {
            document.removeEventListener('keyup', oldKeyUp, true);
            document.removeEventListener('keyup', oldKeyUp, false);
            console.log('[SkyScene] Removed old keyup listener');
        }
        
        // Initialize keys object FIRST
        this.keys = {};
        
        // Create new event handlers with proper binding
        this.handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            console.log('[SkyScene] Key DOWN:', key, '| Keys state:', {...this.keys});
            if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','x','enter'].includes(key)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        this.handleKeyUp = (e) => { 
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            console.log('[SkyScene] Key UP:', key);
            if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','x','enter'].includes(key)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // Add new event listeners with capture phase
        document.addEventListener('keydown', this.handleKeyDown, true);
        document.addEventListener('keyup', this.handleKeyUp, true);
        
        console.log('[SkyScene] Controls setup complete. Keys object initialized:', this.keys);
        
        // Test that keys object is accessible
        setTimeout(() => {
            console.log('[SkyScene] Keys object after 1 second:', this.keys);
        }, 1000);
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (!this.rocket || !this.rocket.isActive || this.levelComplete) return;
        
        // Update altitude
        this.altitude += 100 * deltaTime;
        
        // Handle input
        this.handleRocketInput(deltaTime);
        
        // Update rocket
        this.rocket.update(deltaTime);
        
        // Update heat system
        if (this.skyConfig.heatEnabled) {
            this.updateHeat(deltaTime);
        }
        
        // Spawn enemies
        this.spawnEnemies(deltaTime);
        
        // Update all entities
        this.updateMeteors(deltaTime);
        this.updateFireballs(deltaTime);
        this.updateDrones(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateClouds(deltaTime);
        
        // Check objectives
        this.checkObjectives(deltaTime);
        
        // Update HUD
        this.updateHUD();
        
        // Fuel regeneration when not thrusting
        if (!this.rocket.isThrusting && !this.skyConfig.fuelUnlimited) {
            this.rocket.fuel = Math.min(this.rocket.maxFuel, this.rocket.fuel + deltaTime * 3);
        }
    }
    
    /**
     * Update HUD with current game state
     */
    updateHUD() {
        if (this.physicsEngine.game && this.physicsEngine.game.hud && this.physicsEngine.game.gameState && this.rocket) {
            const timeSinceStart = (performance.now() - this.levelStartTime) / 1000;
            
            // Update game state with current stats including SCORE
            this.physicsEngine.game.gameState.score = this.score;  // Sky scene score
            this.physicsEngine.game.gameState.fuel = this.rocket.fuel;
            this.physicsEngine.game.gameState.maxFuel = this.rocket.maxFuel;
            this.physicsEngine.game.gameState.currentLevel = this.currentLevel;
            this.physicsEngine.game.gameState.time = Math.floor(timeSinceStart);
            
            // Also set playerStats for health (using fuel as health indicator)
            this.physicsEngine.game.gameState.playerStats = {
                health: (this.rocket.fuel / this.rocket.maxFuel) * 100,
                maxHealth: 100,
                score: this.score
            };
            
            // Update HUD with game state
            this.physicsEngine.game.hud.update(this.physicsEngine.game.gameState);
        }
    }

    handleRocketInput(deltaTime) {
        if (!this.rocket) {
            console.error('[SkyScene] ERROR: Rocket is null/undefined!');
            return;
        }
        if (!this.keys) {
            console.error('[SkyScene] ERROR: Keys object is null/undefined!');
            this.keys = {}; // Initialize if missing
            return;
        }
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('[SkyScene] ERROR: Canvas not found!');
            return;
        }
        
        // Debug: Log rocket position and keys state periodically
        if (Math.random() < 0.02) { // 2% chance per frame
            const pos = this.rocket.getPosition();
            console.log('[SkyScene] Rocket pos:', pos, '| Keys:', {...this.keys});
        }
        
        const pos = this.rocket.getPosition();
        const speed = 280;
        
        // Apply mechanics modifiers
        const mechanics = this.skyConfig.mechanics || {};
        
        // Movement slowdown (Level 24 - Overheat Warning)
        const speedMultiplier = mechanics.movementSlowdown ? 0.6 : 1.0;
        const adjustedSpeed = speed * speedMultiplier;
        
        // Input delay system (Levels 21-22)
        if (this.inputDelay > 0) {
            // Store inputs with timestamp
            const currentTime = performance.now();
            if (this.keys['a'] === true || this.keys['arrowleft'] === true) {
                this.delayedInputs.push({ key: 'left', time: currentTime + this.inputDelay * 1000 });
            }
            if (this.keys['d'] === true || this.keys['arrowright'] === true) {
                this.delayedInputs.push({ key: 'right', time: currentTime + this.inputDelay * 1000 });
            }
            if (this.keys['w'] === true || this.keys['arrowup'] === true || this.keys[' '] === true) {
                this.delayedInputs.push({ key: 'thrust', time: currentTime + this.inputDelay * 1000 });
            }
            if (this.keys['s'] === true || this.keys['arrowdown'] === true) {
                this.delayedInputs.push({ key: 'down', time: currentTime + this.inputDelay * 1000 });
            }
            
            // Process delayed inputs
            this.delayedInputs = this.delayedInputs.filter(input => {
                if (currentTime >= input.time) {
                    this.processDelayedInput(input.key, deltaTime, adjustedSpeed, canvas);
                    return false;
                }
                return true;
            });
        } else {
            // Normal input processing
            let moved = false;
            const oldPos = { ...pos };
            
            // Horizontal movement - use velocity instead of direct position changes
            let horizontalVelocity = 0;
            if (this.keys['a'] === true || this.keys['arrowleft'] === true) {
                horizontalVelocity = -adjustedSpeed;
                moved = true;
                console.log('[SkyScene] Moving LEFT');
            }
            if (this.keys['d'] === true || this.keys['arrowright'] === true) {
                horizontalVelocity = adjustedSpeed;
                moved = true;
                console.log('[SkyScene] Moving RIGHT');
            }
            
            // Apply horizontal movement
            if (horizontalVelocity !== 0) {
                const newX = Math.max(40, Math.min(canvas.width - 40, pos.x + horizontalVelocity * deltaTime));
                this.rocket.setPosition({ x: newX, y: pos.y });
            }
            
            // Thrust (up)
            const canThrust = this.skyConfig.fuelUnlimited || this.rocket.fuel > 0;
            const thrustPower = mechanics.minimalThrust ? 0.5 : 1.0;
            
            if ((this.keys['w'] === true || this.keys['arrowup'] === true || this.keys[' '] === true) && canThrust) {
                console.log('[SkyScene] THRUSTING UP');
                // Reverse thrust mechanic (Level 22)
                const reverseChance = mechanics.reverseThrust ? 0.1 : 0;
                const isReversed = Math.random() < reverseChance;
                
                if (isReversed) {
                    // Reverse thrust - go down instead
                    this.rocket.setPosition({ x: pos.x, y: Math.min(canvas.height - 80, pos.y + 200 * deltaTime) });
                } else {
                    this.rocket.setPosition({ x: pos.x, y: Math.max(80, pos.y - 350 * thrustPower * deltaTime) });
                }
                
                this.rocket.isThrusting = true;
                if (!this.skyConfig.fuelUnlimited) {
                    const fuelDrain = (15 + this.currentLevel * 0.5) * this.fuelDrainMultiplier;
                    this.rocket.fuel -= deltaTime * fuelDrain;
                }
                // Heat increases when thrusting fast
                if (this.skyConfig.heatEnabled) {
                    this.heat += deltaTime * 5 * (this.skyConfig.heatMultiplier || 1);
                }
            } else {
                this.rocket.isThrusting = false;
            }
            
            // Move down
            if (this.keys['s'] === true || this.keys['arrowdown'] === true) {
                console.log('[SkyScene] Moving DOWN');
                this.rocket.setPosition({ x: pos.x, y: Math.min(canvas.height - 80, pos.y + 180 * deltaTime) });
                moved = true;
            }
        }
        
        // Apply sideways drift (Level 12 - Broken Stabilizers)
        if (this.sidewaysDrift > 0) {
            const driftAmount = this.sidewaysDrift * deltaTime;
            const newX = pos.x + driftAmount;
            this.rocket.setPosition({ x: Math.max(40, Math.min(canvas.width - 40, newX)), y: pos.y });
        }
        
        // Apply wind force (Level 11, 17)
        if (this.windForce > 0 || mechanics.windReversals) {
            const windDirection = mechanics.windReversals ? Math.sin(Date.now() / 1000) : 1;
            const windPush = this.windForce * windDirection * deltaTime;
            const newX = pos.x + windPush;
            this.rocket.setPosition({ x: Math.max(40, Math.min(canvas.width - 40, newX)), y: pos.y });
        }
        
        // Apply gravity
        const newPos = this.rocket.getPosition();
        this.rocket.setPosition({ x: newPos.x, y: Math.min(canvas.height - 80, newPos.y + this.gravity * 200 * deltaTime) });
        
        // Continuous ascent (Level 15)
        if (mechanics.continuousAscent) {
            const ascentForce = 50 * deltaTime;
            this.rocket.setPosition({ x: newPos.x, y: Math.max(80, newPos.y - ascentForce) });
        }
        
        // Shooting
        if ((this.keys['x'] === true || this.keys['enter'] === true) && this.rocket.canShoot) {
            this.shoot();
        }
    }
    
    /**
     * Process delayed input (for input delay mechanic)
     */
    processDelayedInput(key, deltaTime, speed, canvas) {
        const pos = this.rocket.getPosition();
        const mechanics = this.skyConfig.mechanics || {};
        
        switch(key) {
            case 'left':
                this.rocket.setPosition({ x: Math.max(40, pos.x - speed * deltaTime), y: pos.y });
                break;
            case 'right':
                this.rocket.setPosition({ x: Math.min(canvas.width - 40, pos.x + speed * deltaTime), y: pos.y });
                break;
            case 'thrust':
                const canThrust = this.skyConfig.fuelUnlimited || this.rocket.fuel > 0;
                if (canThrust) {
                    const thrustPower = mechanics.minimalThrust ? 0.5 : 1.0;
                    this.rocket.setPosition({ x: pos.x, y: Math.max(80, pos.y - 350 * thrustPower * deltaTime) });
                    this.rocket.isThrusting = true;
                    if (!this.skyConfig.fuelUnlimited) {
                        const fuelDrain = (15 + this.currentLevel * 0.5) * this.fuelDrainMultiplier;
                        this.rocket.fuel -= deltaTime * fuelDrain;
                    }
                }
                break;
            case 'down':
                this.rocket.setPosition({ x: pos.x, y: Math.min(canvas.height - 80, pos.y + 180 * deltaTime) });
                break;
        }
    }

    shoot() {
        const pos = this.rocket.getPosition();
        const bulletCount = this.currentLevel >= 23 ? 5 : this.currentLevel >= 20 ? 4 : 
                           this.currentLevel >= 17 ? 3 : this.currentLevel >= 14 ? 2 : 1;
        const spread = 12;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = bulletCount === 1 ? -90 : -90 - spread * (bulletCount-1)/2 + i * spread;
            const rad = angle * Math.PI / 180;
            const projectile = new Projectile({
                x: pos.x + (i - (bulletCount-1)/2) * 8,
                y: pos.y - 60,
                velocityX: Math.cos(rad) * 700,
                velocityY: Math.sin(rad) * 700,
                owner: this.rocket
            });
            this.projectiles.push(projectile);
        }
        this.rocket.canShoot = false;
        setTimeout(() => { if (this.rocket) this.rocket.canShoot = true; }, 200);
    }

    updateHeat(deltaTime) {
        const multiplier = this.skyConfig.heatMultiplier || 1;
        const mechanics = this.skyConfig.mechanics || {};
        
        // Permanent heat rise (Level 24)
        if (mechanics.permanentHeatRise) {
            this.heat += deltaTime * 3 * multiplier;
        }
        
        // Extreme heat zones
        if (this.skyConfig.extremeHeat) {
            this.heat += deltaTime * 8 * multiplier;
        }
        
        // Constant overheat (Level 20)
        if (mechanics.constantOverheat) {
            this.heat += deltaTime * 4 * multiplier;
        }
        
        // Heat spikes (Level 16)
        if (mechanics.heatSpikes && Math.random() < 0.02) {
            this.heat += 15;
        }
        
        // Atmospheric break effect
        if (this.skyConfig.atmosphericBreak) {
            this.heat = 50 + Math.sin(Date.now() / 500) * 30;
        }
        
        // Slow cooling (Level 16)
        const coolingRate = mechanics.slowCooling ? 5 : 10;
        
        // Cool down when not in danger
        if (!this.rocket.isThrusting && !this.skyConfig.extremeHeat && !mechanics.permanentHeatRise) {
            this.heat = Math.max(0, this.heat - deltaTime * coolingRate);
        }
        
        // Clamp heat
        this.heat = Math.min(this.maxHeat, this.heat);
        
        // Overheat damage
        if (this.heat >= this.maxHeat) {
            this.rocket.fuel -= deltaTime * 20;
        }
    }

    spawnEnemies(deltaTime) {
        if (this.skyConfig.spawnRate <= 0) return;
        
        this.spawnTimer += deltaTime;
        if (this.spawnTimer < this.skyConfig.spawnRate) return;
        this.spawnTimer = 0;
        
        const canvas = document.getElementById('gameCanvas');
        const enemies = this.skyConfig.enemies || [];
        if (enemies.length === 0) return;
        
        const mechanics = this.skyConfig.mechanics || {};
        
        // Dense debris (Level 13) - spawn multiple at once
        const spawnCount = mechanics.denseDebris ? 3 : 1;
        
        for (let i = 0; i < spawnCount; i++) {
            const type = enemies[Math.floor(Math.random() * enemies.length)];
            
            if (type === 'debris') {
                this.spawnDebris(canvas, mechanics);
            } else if (type === 'fireball') {
                this.spawnFireball(canvas, mechanics);
            } else if (type === 'drone' && this.drones.length < (this.skyConfig.droneCount || 1)) {
                this.spawnDrone(canvas, mechanics);
            }
        }
        
        // Debris clusters (Level 12)
        if (mechanics.debrisClusters && Math.random() < 0.3) {
            const clusterX = Math.random() * canvas.width;
            for (let i = 0; i < 4; i++) {
                this.spawnDebrisAt(canvas, clusterX + (Math.random() - 0.5) * 100, -50 - i * 30);
            }
        }
    }

    spawnDebris(canvas, mechanics = {}) {
        const meteor = new Meteor({ 
            size: ['small','medium'][Math.floor(Math.random()*2)], 
            meteorType: 'rock', 
            mass: 300 
        });
        meteor.setPosition({ x: Math.random() * canvas.width, y: -50 });
        
        // Faster debris for certain levels
        const speedMultiplier = mechanics.denseDebris ? 1.3 : 1.0;
        meteor.setVelocity({ 
            x: (Math.random()-0.5) * 80, 
            y: (150 + Math.random() * 100) * speedMultiplier 
        });
        this.meteors.push(meteor);
    }
    
    spawnDebrisAt(canvas, x, y) {
        const meteor = new Meteor({ 
            size: 'small', 
            meteorType: 'rock', 
            mass: 300 
        });
        meteor.setPosition({ x: x, y: y });
        meteor.setVelocity({ 
            x: (Math.random()-0.5) * 60, 
            y: 150 + Math.random() * 80 
        });
        this.meteors.push(meteor);
    }

    spawnFireball(canvas, mechanics = {}) {
        const fireball = {
            x: Math.random() * canvas.width,
            y: -30,
            vx: (Math.random() - 0.5) * 100,
            vy: 180 + Math.random() * 120,
            size: 20 + Math.random() * 25,
            isActive: true
        };
        
        // Diagonal fireballs (Level 17)
        if (mechanics.diagonalFireballs) {
            const angle = (Math.random() - 0.5) * Math.PI / 3; // -60 to +60 degrees
            const speed = 200;
            fireball.vx = Math.sin(angle) * speed;
            fireball.vy = Math.cos(angle) * speed;
        }
        
        // Explosive debris (Level 20)
        if (mechanics.explosiveDebris) {
            fireball.explosive = true;
            fireball.size *= 1.5;
        }
        
        this.fireballs.push(fireball);
    }

    spawnDrone(canvas, mechanics = {}) {
        const drone = {
            x: Math.random() < 0.5 ? -30 : canvas.width + 30,
            y: 100 + Math.random() * 200,
            vx: 0, vy: 0,
            health: 50,
            shootTimer: 0,
            isActive: true,
            advanced: this.skyConfig.advancedDrones || false,
            tracking: mechanics.trackingEnemies || false
        };
        drone.vx = drone.x < 0 ? 80 : -80;
        this.drones.push(drone);
    }

    updateMeteors(deltaTime) {
        const canvas = document.getElementById('gameCanvas');
        this.meteors = this.meteors.filter(m => {
            if (!m.isActive) return false;
            m.update(deltaTime);
            const pos = m.getPosition();
            
            // Check collision with rocket
            if (this.checkCollision(pos, this.rocket.getPosition(), 30, 40)) {
                m.isActive = false;
                this.rocket.fuel = Math.max(0, this.rocket.fuel - 15);
                return false;
            }
            return pos.y < canvas.height + 100;
        });
    }

    updateFireballs(deltaTime) {
        const canvas = document.getElementById('gameCanvas');
        this.fireballs = this.fireballs.filter(f => {
            if (!f.isActive) return false;
            f.x += f.vx * deltaTime;
            f.y += f.vy * deltaTime;
            
            // Check collision with rocket
            if (this.checkCollision({x: f.x, y: f.y}, this.rocket.getPosition(), f.size, 40)) {
                f.isActive = false;
                this.heat += 25;
                return false;
            }
            return f.y < canvas.height + 50;
        });
    }

    updateDrones(deltaTime) {
        const canvas = document.getElementById('gameCanvas');
        const rocketPos = this.rocket.getPosition();
        const mechanics = this.skyConfig.mechanics || {};
        
        this.drones = this.drones.filter(d => {
            if (!d.isActive || d.health <= 0) {
                if (d.health <= 0) this.score += 100;
                return false;
            }
            
            // AI movement
            if (d.advanced) {
                // Zig-zag movement
                d.x += Math.sin(Date.now() / 300 + d.y) * 100 * deltaTime;
                d.y += Math.sin(Date.now() / 500) * 30 * deltaTime;
            }
            
            // Tracking enemies (Level 18)
            if (d.tracking || mechanics.trackingEnemies) {
                const dx = rocketPos.x - d.x;
                const dy = rocketPos.y - d.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 50) {
                    d.vx = (dx / dist) * 60;
                    d.vy = (dy / dist) * 30;
                    d.x += d.vx * deltaTime;
                    d.y += d.vy * deltaTime;
                }
            } else {
                d.x += d.vx * deltaTime;
            }
            
            // Reverse at edges
            if (d.x < 50 || d.x > canvas.width - 50) d.vx *= -1;
            
            // Shooting
            d.shootTimer += deltaTime;
            const shootInterval = mechanics.slowMissiles ? 3.0 : 2.0;
            
            if (d.shootTimer > shootInterval) {
                d.shootTimer = 0;
                // Drone shoots at player
                const dx = rocketPos.x - d.x;
                const dy = rocketPos.y - d.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                const missileSpeed = mechanics.slowMissiles ? 150 : 200;
                
                this.fireballs.push({
                    x: d.x, y: d.y + 20,
                    vx: (dx/dist) * missileSpeed,
                    vy: (dy/dist) * missileSpeed,
                    size: 12, isActive: true, isDroneBullet: true
                });
            }
            
            // Check collision with rocket
            if (this.checkCollision({x: d.x, y: d.y}, rocketPos, 25, 40)) {
                d.isActive = false;
                this.rocket.fuel = Math.max(0, this.rocket.fuel - 25);
                return false;
            }
            return true;
        });
    }

    updateProjectiles(deltaTime) {
        const canvas = document.getElementById('gameCanvas');
        this.projectiles = this.projectiles.filter(p => {
            if (!p.isActive) return false;
            const pos = p.getPosition();
            const vel = p.getVelocity();
            p.setPosition({ x: pos.x + vel.x * deltaTime, y: pos.y + vel.y * deltaTime });
            p.update(deltaTime);
            
            // Check collision with meteors
            for (const m of this.meteors) {
                if (m.isActive && p.checkCollision(m, 10, 20)) {
                    p.isActive = false;
                    m.isActive = false;
                    this.score += 25;
                }
            }
            
            // Check collision with fireballs
            for (const f of this.fireballs) {
                if (f.isActive && !f.isDroneBullet && this.checkCollision(pos, {x:f.x,y:f.y}, 8, f.size)) {
                    p.isActive = false;
                    f.isActive = false;
                    this.score += 15;
                }
            }
            
            // Check collision with drones
            for (const d of this.drones) {
                if (d.isActive && this.checkCollision(pos, {x:d.x,y:d.y}, 8, 25)) {
                    p.isActive = false;
                    d.health -= 25;
                    this.score += 10;
                }
            }
            
            const pPos = p.getPosition();
            return pPos.y > -50 && pPos.y < canvas.height + 50 && pPos.x > -50 && pPos.x < canvas.width + 50;
        });
    }

    updateClouds(deltaTime) {
        const canvas = document.getElementById('gameCanvas');
        const altitudeProgress = Math.min(1, this.altitude / 50000);
        
        for (const cloud of this.clouds) {
            cloud.y += (cloud.speed + 50) * deltaTime;
            if (cloud.y > canvas.height + cloud.size) {
                cloud.y = -cloud.size;
                cloud.x = Math.random() * canvas.width;
            }
        }
        
        // Update stars
        for (const star of this.stars) {
            star.twinkle += deltaTime * 3;
        }
    }

    checkObjectives(deltaTime) {
        if (this.levelComplete) return;
        
        const objective = this.skyConfig.objective;
        
        // Update objective progress
        if (window.gameState && window.gameState.hud) {
            if (objective === 'score') {
                window.gameState.hud.updateObjectiveProgress(this.score, this.targetScore);
            } else if (objective === 'altitude') {
                window.gameState.hud.updateObjectiveProgress(this.altitude, this.skyConfig.targetAltitude);
            } else if (objective === 'survive') {
                window.gameState.hud.updateObjectiveProgress(this.surviveTimer, this.skyConfig.surviveTime);
            }
        }
        
        if (objective === 'score' && this.score >= this.targetScore) {
            this.completeLevel();
        } else if (objective === 'altitude' && this.altitude >= this.skyConfig.targetAltitude) {
            this.completeLevel();
        } else if (objective === 'survive') {
            this.surviveTimer += deltaTime;
            if (this.surviveTimer >= this.skyConfig.surviveTime) {
                this.completeLevel();
            }
        }
        
        // Check game over
        if (this.rocket.fuel <= 0 && !this.skyConfig.fuelUnlimited) {
            // Game over - out of fuel
            EventBus.emit('player_death');
        }
    }

    completeLevel() {
        this.levelComplete = true;
        
        // Show completion animation
        if (window.gameState && window.gameState.hud) {
            const stats = {
                score: this.score,
                time: (performance.now() - this.levelStartTime) / 1000,
                health: (this.rocket.fuel / this.rocket.maxFuel) * 100, // Use fuel as "health"
                accuracy: 80
            };
            
            window.gameState.hud.showLevelComplete(stats, () => {
                console.log('[SkyScene] Level completion animation finished');
            });
        }
        
        setTimeout(() => EventBus.emit('level_complete'), 3000);
    }
    
    /**
     * Get objective description text
     */
    getObjectiveDescription() {
        const objective = this.skyConfig.objective;
        if (objective === 'score') {
            return `Reach ${this.targetScore} points`;
        } else if (objective === 'altitude') {
            return `Reach altitude ${this.skyConfig.targetAltitude}m`;
        } else if (objective === 'survive') {
            return `Survive for ${this.skyConfig.surviveTime} seconds`;
        }
        return 'Complete the level';
    }

    checkCollision(pos1, pos2, r1, r2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx*dx + dy*dy) < r1 + r2;
    }

    render() {
        const ctx = this.physicsEngine.game.context;
        if (!ctx) return;
        const canvas = ctx.canvas;
        
        const mechanics = this.skyConfig.mechanics || {};
        
        // Camera shake (Level 11, 21)
        let shakeX = 0, shakeY = 0;
        if (this.cameraShakeIntensity > 0 || mechanics.shake) {
            const intensity = this.cameraShakeIntensity || 2;
            shakeX = (Math.random() - 0.5) * intensity;
            shakeY = (Math.random() - 0.5) * intensity;
        }
        
        ctx.save();
        ctx.translate(shakeX, shakeY);
        
        // Visual blur (Level 17)
        if (this.visualBlur || mechanics.visualBlur) {
            ctx.filter = 'blur(2px)';
        }
        
        // Screen distortion (Level 24)
        if (mechanics.screenDistortion && this.heat > 50) {
            const distortAmount = ((this.heat - 50) / 50) * 3;
            ctx.filter = `blur(${distortAmount}px) contrast(${1 + distortAmount * 0.1})`;
        }
        
        // Sky gradient based on altitude
        const altProg = Math.min(1, this.altitude / 50000);
        const skyR = Math.floor(135 * (1 - altProg));
        const skyG = Math.floor(206 * (1 - altProg));
        const skyB = Math.floor(235 * (1 - altProg) + 30 * altProg);
        
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, `rgb(${skyR},${skyG},${skyB})`);
        grad.addColorStop(1, `rgb(${Math.min(255,skyR+60)},${Math.min(255,skyG+40)},${Math.min(255,skyB+30)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Stars (visible at high altitude)
        if (altProg > 0.3) {
            const starAlpha = (altProg - 0.3) / 0.7;
            for (const s of this.stars) {
                ctx.fillStyle = `rgba(255,255,255,${starAlpha * (0.5 + Math.sin(s.twinkle) * 0.5)})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Clouds (fade at high altitude)
        if (altProg < 0.7) {
            const cloudAlpha = 1 - altProg / 0.7;
            for (const c of this.clouds) {
                ctx.fillStyle = `rgba(255,255,255,${cloudAlpha * 0.7})`;
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.size * 0.4, 0, Math.PI * 2);
                ctx.arc(c.x + c.size * 0.3, c.y - c.size * 0.1, c.size * 0.35, 0, Math.PI * 2);
                ctx.arc(c.x + c.size * 0.5, c.y, c.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Flame barriers (Level 16)
        if (mechanics.flameBarriers) {
            this.drawFlameBarriers(ctx, canvas);
        }
        
        // Fire walls (Level 23)
        if (mechanics.fireWalls || this.skyConfig.fireWalls) {
            this.drawFireWalls(ctx, canvas);
        }
        
        // Heat overlay
        if (this.heat > 30) {
            ctx.fillStyle = `rgba(255,100,0,${(this.heat - 30) / 140})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Firestorms (Level 20)
        if (mechanics.firestorms) {
            const firestormAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
            ctx.fillStyle = `rgba(255,80,0,${firestormAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Atmospheric break effect
        if (this.skyConfig.atmosphericBreak || mechanics.infiniteFire) {
            const flicker = Math.random() * 0.3;
            ctx.fillStyle = `rgba(255,150,50,${0.2 + flicker})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Reset filter for entities
        ctx.filter = 'none';
        
        // Draw entities
        this.drawMeteors(ctx);
        this.drawFireballs(ctx);
        this.drawDrones(ctx);
        this.drawProjectiles(ctx);
        
        // Draw rocket
        if (this.rocket && this.rocket.isActive) {
            this.rocket.render(ctx);
        }
        
        ctx.restore();
        
        // Draw HUD (no shake/blur)
        this.drawHUD(ctx);
        
        // False warnings (Level 21)
        if (mechanics.falseWarnings && Math.random() < 0.01) {
            this.drawFalseWarning(ctx, canvas);
        }
        
        // Level complete message
        if (this.levelComplete) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, canvas.height/2 - 60, canvas.width, 120);
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE!', canvas.width/2, canvas.height/2);
            ctx.fillStyle = '#FFF';
            ctx.font = '20px Arial';
            ctx.fillText(this.currentLevel < 25 ? 'Advancing...' : 'Entering Space!', canvas.width/2, canvas.height/2 + 40);
        }
    }
    
    /**
     * Draw flame barriers (Level 16)
     */
    drawFlameBarriers(ctx, canvas) {
        const time = Date.now() / 1000;
        const barrierCount = 3;
        
        for (let i = 0; i < barrierCount; i++) {
            const y = (canvas.height / barrierCount) * i + Math.sin(time + i) * 50;
            const grad = ctx.createLinearGradient(0, y, 0, y + 60);
            grad.addColorStop(0, 'rgba(255,100,0,0)');
            grad.addColorStop(0.5, 'rgba(255,150,0,0.6)');
            grad.addColorStop(1, 'rgba(255,100,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, y, canvas.width, 60);
        }
    }
    
    /**
     * Draw fire walls (Level 23)
     */
    drawFireWalls(ctx, canvas) {
        const time = Date.now() / 1000;
        const wallWidth = 80;
        const gapSize = 150;
        
        // Moving vertical fire walls
        const wallX1 = (canvas.width * 0.3) + Math.sin(time * 0.5) * 100;
        const wallX2 = (canvas.width * 0.7) + Math.cos(time * 0.5) * 100;
        
        for (const wallX of [wallX1, wallX2]) {
            const grad = ctx.createLinearGradient(wallX - wallWidth/2, 0, wallX + wallWidth/2, 0);
            grad.addColorStop(0, 'rgba(255,100,0,0)');
            grad.addColorStop(0.5, 'rgba(255,50,0,0.8)');
            grad.addColorStop(1, 'rgba(255,100,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(wallX - wallWidth/2, 0, wallWidth, canvas.height);
        }
    }
    
    /**
     * Draw false warning (Level 21)
     */
    drawFalseWarning(ctx, canvas) {
        const warnings = [
            '⚠ FUEL CRITICAL',
            '⚠ SYSTEM ERROR',
            '⚠ COLLISION ALERT',
            '⚠ OVERHEAT WARNING'
        ];
        const warning = warnings[Math.floor(Math.random() * warnings.length)];
        
        ctx.fillStyle = 'rgba(255,0,0,0.8)';
        ctx.fillRect(canvas.width/2 - 150, 100, 300, 50);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(warning, canvas.width/2, 130);
    }

    drawMeteors(ctx) {
        for (const m of this.meteors) {
            if (m.isActive) m.render(ctx);
        }
    }

    drawFireballs(ctx) {
        for (const f of this.fireballs) {
            if (!f.isActive) continue;
            const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
            grad.addColorStop(0, f.isDroneBullet ? '#FF00FF' : '#FFFF00');
            grad.addColorStop(0.5, f.isDroneBullet ? '#AA00AA' : '#FF6600');
            grad.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawDrones(ctx) {
        for (const d of this.drones) {
            if (!d.isActive) continue;
            // Drone body
            ctx.fillStyle = d.advanced ? '#AA00AA' : '#666';
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, 25, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            // Cockpit
            ctx.fillStyle = '#00FFFF';
            ctx.beginPath();
            ctx.arc(d.x, d.y - 5, 8, 0, Math.PI * 2);
            ctx.fill();
            // Wings
            ctx.fillStyle = d.advanced ? '#FF00FF' : '#888';
            ctx.fillRect(d.x - 35, d.y - 3, 15, 6);
            ctx.fillRect(d.x + 20, d.y - 3, 15, 6);
            // Health bar
            ctx.fillStyle = '#333';
            ctx.fillRect(d.x - 20, d.y - 25, 40, 5);
            ctx.fillStyle = '#0F0';
            ctx.fillRect(d.x - 20, d.y - 25, 40 * (d.health / 50), 5);
        }
    }

    drawProjectiles(ctx) {
        for (const p of this.projectiles) {
            if (p.isActive) p.render(ctx);
        }
    }

    drawHUD(ctx) {
        const canvas = ctx.canvas;
        const pad = 15, w = 230, h = 180;
        
        // Panel
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.beginPath();
        ctx.roundRect(pad, pad, w, h, 10);
        ctx.fill();
        ctx.strokeStyle = '#FF6600';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Title
        ctx.fillStyle = '#FF6600';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('CHAPTER 2: SKY', pad + 12, pad + 22);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '13px Arial';
        ctx.fillText(`Level ${this.currentLevel}/25 - ${this.skyConfig.description}`, pad + 12, pad + 40);
        
        // Score/Objective
        const obj = this.skyConfig.objective;
        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 16px Arial';
        if (obj === 'score') {
            ctx.fillText(`SCORE: ${this.score}/${this.targetScore}`, pad + 12, pad + 62);
        } else if (obj === 'altitude') {
            ctx.fillText(`ALT: ${Math.floor(this.altitude)}/${this.skyConfig.targetAltitude}m`, pad + 12, pad + 62);
        } else if (obj === 'survive') {
            const remaining = Math.max(0, this.skyConfig.surviveTime - this.surviveTimer);
            ctx.fillText(`SURVIVE: ${remaining.toFixed(1)}s`, pad + 12, pad + 62);
        }
        
        // Progress bar
        let progress = 0;
        if (obj === 'score') progress = this.score / this.targetScore;
        else if (obj === 'altitude') progress = this.altitude / this.skyConfig.targetAltitude;
        else if (obj === 'survive') progress = this.surviveTimer / this.skyConfig.surviveTime;
        progress = Math.min(1, progress);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(pad + 12, pad + 70, w - 24, 8);
        ctx.fillStyle = progress >= 1 ? '#0F0' : '#FF0';
        ctx.fillRect(pad + 12, pad + 70, (w - 24) * progress, 8);
        
        // Fuel bar
        ctx.fillStyle = '#AAA';
        ctx.font = '12px Arial';
        ctx.fillText('FUEL:', pad + 12, pad + 95);
        const fuelPct = this.rocket ? this.rocket.fuel / this.rocket.maxFuel : 0;
        ctx.fillStyle = '#333';
        ctx.fillRect(pad + 50, pad + 85, 100, 12);
        ctx.fillStyle = fuelPct > 0.3 ? '#00AAFF' : '#F44';
        ctx.fillRect(pad + 50, pad + 85, 100 * fuelPct, 12);
        ctx.fillStyle = this.skyConfig.fuelUnlimited ? '#0FF' : '#FFF';
        ctx.fillText(this.skyConfig.fuelUnlimited ? '∞' : `${Math.floor(this.rocket?.fuel || 0)}%`, pad + 160, pad + 95);
        
        // Heat bar (if enabled)
        if (this.skyConfig.heatEnabled) {
            ctx.fillStyle = '#AAA';
            ctx.fillText('HEAT:', pad + 12, pad + 115);
            ctx.fillStyle = '#333';
            ctx.fillRect(pad + 50, pad + 105, 100, 12);
            const heatColor = this.heat > 70 ? '#F00' : this.heat > 40 ? '#F80' : '#0A0';
            ctx.fillStyle = heatColor;
            ctx.fillRect(pad + 50, pad + 105, 100 * (this.heat / this.maxHeat), 12);
        }
        
        // Altitude
        ctx.fillStyle = '#AAA';
        ctx.fillText(`Altitude: ${Math.floor(this.altitude)}m`, pad + 12, pad + 135);
        
        // Enemies count
        ctx.fillStyle = '#F80';
        ctx.textAlign = 'right';
        ctx.fillText(`☄${this.meteors.length} 🔥${this.fireballs.length} 🤖${this.drones.length}`, pad + w - 12, pad + 135);
        
        // Bullet count
        const bullets = this.currentLevel >= 23 ? 5 : this.currentLevel >= 20 ? 4 : 
                       this.currentLevel >= 17 ? 3 : this.currentLevel >= 14 ? 2 : 1;
        ctx.fillStyle = '#0FF';
        ctx.fillText(`🚀x${bullets}`, pad + w - 12, pad + 155);
        
        // Controls hint
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
        ctx.fillStyle = '#FFF';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('←→/AD: Move | ↑/W/Space: Thrust | X/Enter: Shoot | ESC: Pause', canvas.width/2, canvas.height - 10);
    }

    cleanup() {
        super.cleanup();
        if (this.handleKeyDown) document.removeEventListener('keydown', this.handleKeyDown, true);
        if (this.handleKeyUp) document.removeEventListener('keyup', this.handleKeyUp, true);
        this.meteors = [];
        this.projectiles = [];
        this.fireballs = [];
        this.drones = [];
    }
}
