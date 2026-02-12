/**
 * EarthScene.js - Earth chapter with meteor storm gameplay
 *
 * This module implements the Earth chapter (Levels 1-10) with:
 * - Meteor storm system with increasing difficulty
 * - Ground-based player movement (running, jumping)
 * - Emergency alarm system
 * - Rocket discovery and launch sequence
 * - Level progression and save system
 */

import { Scene } from '../core/Scene.js';
import { Player } from '../entities/Player.js';
import { Meteor } from '../entities/Meteor.js';
import { Projectile } from '../entities/Projectile.js';
import { Rocket } from '../entities/Rocket.js';
import { EventBus } from '../core/EventBus.js';
import { PLANET_CONFIGS } from '../data/planets.js';


/**
 * Earth scene implementation
 */
export class EarthScene extends Scene {
    /** @type {Player} */
    player = null;
    /** @type {Rocket | null} */
    rocket = null;
    /** @type {Array<Meteor>} */
    meteors = [];
    /** @type {Array<Projectile>} */
    projectiles = [];
    /** @type {HTMLImageElement | null} */
    background = null;
    /** @type {HTMLImageElement | null} */
    ground = null;
    /** @type {number} */
    meteorSpawnTimer = 0;
    /** @type {number} */
    meteorSpawnInterval = 1.0;
    /** @type {number} */
    levelStartTime = 0;
    /** @type {number} */
    emergencyAlarmTimer = 0;
    /** @type {boolean} */
    isEmergencyActive = false;
    /** @type {boolean} */
    rocketDiscovered = false;
    /** @type {boolean} */
    rocketLaunched = false;
    /** @type {number} */
    meteorDensity = 1.0;
    /** @type {number} */
    meteorSpeedMultiplier = 1.0;
    /** @type {number} */
    gravity = 0.6;
    /** @type {number} */
    groundHeight = 0;
    /** @type {number} */
    groundWidth = 0;
    /** @type {number} */
    playerGroundContact = false;
    /** @type {number} */
    playerJumpTimer = 0;
    /** @type {boolean} */
    playerJumping = false;
    /** @type {number} */
    playerJumpForce = 15;
    /** @type {number} */
    playerRunSpeed = 300;
    /** @type {number} */
    playerState = 'idle'; // idle, run, jump, fall
    /** @type {number} */
    playerAnimationTimer = 0;
    /** @type {number} */
    playerAnimationFrame = 0;
    /** @type {HTMLAudioElement | null} */
    alarmSound = null;
    /** @type {HTMLAudioElement | null} */
    meteorImpactSound = null;
    /** @type {HTMLAudioElement | null} */
    rocketEngineSound = null;
    /** @type {Array<{position: {x: number, y: number}, lifetime: number}>} */
    impactParticles = [];

    /**
     * Initialize the Earth scene
     * @param {LevelConfig} levelConfig - Level configuration
     */
    initialize(levelConfig) {
        super.initialize(levelConfig);
        
        // Load assets
        this.loadAssets();
        
        // Initialize scene based on level
        this.initializeLevel(levelConfig);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Listen for player shooting
        EventBus.on('player_shoot', (data) => {
            this.projectiles.push(data.projectile);
            console.log('[EarthScene] Projectile added, total:', this.projectiles.length);
        });
        
        // Listen for projectile hits
        EventBus.on('projectile_hit', (data) => {
            console.log('[EarthScene] Projectile hit meteor');
            // Remove projectile
            const index = this.projectiles.indexOf(data.projectile);
            if (index > -1) {
                this.projectiles.splice(index, 1);
            }
        });
    }

    /**
     * Load scene assets
     */
    loadAssets() {
        // Load background
        this.background = new Image();
        this.background.src = 'assets/sprites/earth_background.png';
        
        // Load ground
        this.ground = new Image();
        this.ground.src = 'assets/sprites/earth_ground.png';
        
        // Load sounds
        this.alarmSound = new Audio('assets/audio/alarm.mp3');
        this.alarmSound.loop = true;
        this.alarmSound.volume = 0.3;
        
        this.meteorImpactSound = new Audio('assets/audio/meteor_impact.mp3');
        this.meteorImpactSound.volume = 0.5;
        
        this.rocketEngineSound = new Audio('assets/sounds/rocket_engine.mp3');
        this.rocketEngineSound.loop = true;
        this.rocketEngineSound.volume = 0.4;
    }

    /**
     * Initialize level based on configuration
     * @param {LevelConfig} levelConfig - Level configuration
     */
    initializeLevel(levelConfig) {
        // Set ground height based on canvas FIRST
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            this.groundHeight = canvas.height - 100;
            this.groundWidth = canvas.width;
        }
        
        // Set up direct keyboard listeners to bypass Input system
        this.keys = {};
        this.handleKeyDown = (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = true;
            console.log('[EarthScene] Direct keydown:', key, 'event.key:', event.key);
            event.preventDefault();
            event.stopPropagation();
        };
        this.handleKeyUp = (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = false;
            console.log('[EarthScene] Direct keyup:', key, 'event.key:', event.key);
            event.preventDefault();
            event.stopPropagation();
        };
        // Use document with capture mode to ensure events are caught
        document.addEventListener('keydown', this.handleKeyDown, true);
        document.addEventListener('keyup', this.handleKeyUp, true);
        console.log('[EarthScene] Direct keyboard listeners added');
        
        // Set difficulty based on level
        const levelNum = levelConfig.id;
        this.meteorDensity = 1.0 + (levelNum - 1) * 0.3;
        this.meteorSpeedMultiplier = 1.0 + (levelNum - 1) * 0.2;
        this.meteorSpawnInterval = Math.max(0.3, 1.0 - (levelNum - 1) * 0.08);
        
        // Create player AFTER ground height is set
        this.player = new Player({
            health: 100,
            maxHealth: 100,
            mass: 80,
            dragCoefficient: 0.3,
            elasticity: 0.2,
            sprite: 'assets/sprites/player_earth.png'
        });
        
        // Position player on ground
        this.player.setPosition({
            x: 400,
            y: this.groundHeight - 50
        });
        
        // Start level timer
        this.levelStartTime = performance.now();
        
        // Check if rocket should be discovered (level 10)
        if (levelNum === 10) {
            this.rocketDiscovered = true;
            this.createRocket();
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        EventBus.on('player_jump', () => this.handlePlayerJump());
        EventBus.on('rocket_launch', () => this.handleRocketLaunch());
    }

    /**
     * Update the scene
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.player || !this.player.isActive) return;
        
        // Debug: log update running
        if (Math.random() < 0.005) {
            console.log('[EarthScene] Update running, meteors:', this.meteors.length);
        }
        
        // Update player ground contact
        this.updatePlayerGroundContact();
        
        // Update meteors
        this.updateMeteors(deltaTime);
        
        // Update projectiles
        const activeProjectiles = [];
        for (const projectile of this.projectiles) {
            if (!projectile.isActive) continue;
            projectile.update(deltaTime);
            activeProjectiles.push(projectile);
        }
        this.projectiles = activeProjectiles;
        
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update meteor spawning
        this.checkLevelCompletion();
        
        // Update HUD
        this.updateHUD();
    }
    
    /**
     * Update HUD with current game state
     */
    updateHUD() {
        if (this.physicsEngine.game && this.physicsEngine.game.hud && this.physicsEngine.game.gameState && this.player) {
            const timeSinceStart = (performance.now() - this.levelStartTime) / 1000;
            
            // Update game state with current player stats
            this.physicsEngine.game.gameState.playerStats = {
                health: this.player.health,
                maxHealth: 100,
                score: 0
            };
            this.physicsEngine.game.gameState.currentLevel = this.levelConfig.id;
            this.physicsEngine.game.gameState.time = Math.floor(timeSinceStart);
            
            // Update HUD with game state
            this.physicsEngine.game.hud.update(this.physicsEngine.game.gameState);
        }
    }

    /**
     * Update player ground contact
     */
    updatePlayerGroundContact() {
        // Use player's actual position and assume a height of 50 pixels
        const playerBottom = this.player.physicsBody.position.y + 50;
        this.playerGroundContact = playerBottom >= this.groundHeight - 5;
    }

    /**
     * Update player state and movement
     * @param {number} deltaTime - Time since last update in seconds
     */
    updatePlayer(deltaTime) {
        // Apply gravity
        this.player.applyForce({
            magnitude: this.gravity * this.player.physicsBody.mass,
            direction: { x: 0, y: 1 },
            type: 'gravity'
        });
        
        // Handle ground collision
        if (this.playerGroundContact) {
            // Keep player on ground
            this.player.physicsBody.position.y = this.groundHeight - 50;
            this.player.physicsBody.velocity.y = 0;
            this.playerJumping = false;
            
            // Apply drag when on ground
            this.player.physicsBody.dragCoefficient = 0.5;
        } else {
            // Less drag in air
            this.player.physicsBody.dragCoefficient = 0.1;
        }
        
        // Handle input using direct keyboard events
        if (this.keys) {
            const keys = {...this.keys, 'earth_scene': true};
            console.log('[EarthScene] Current this.keys:', this.keys);
            console.log('[EarthScene] Keys passed to player:', Object.keys(keys));
            this.player.handleInput(keys);
        }
        
        // Update animation timer
        this.playerAnimationTimer += deltaTime;
        if (this.playerAnimationTimer > 0.1) {
            this.playerAnimationTimer = 0;
            this.playerAnimationFrame = (this.playerAnimationFrame + 1) % 4;
        }
    }

    /**
     * Handle player jump
     */
    handlePlayerJump() {
        if (this.playerGroundContact && !this.playerJumping) {
            this.playerJumping = true;
            this.player.applyImpulse(this.playerJumpForce, { x: 0, y: -1 });
            this.playerState = 'jump';
        }
    }

    /**
     * Update meteor spawning
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateMeteorSpawning(deltaTime) {
        this.meteorSpawnTimer += deltaTime;
        
        if (this.meteorSpawnTimer >= this.meteorSpawnInterval) {
            this.meteorSpawnTimer = 0;
            this.spawnMeteor();
        }
    }

    /**
     * Spawn a new meteor
     */
    spawnMeteor() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        // Random position at top of screen
        const x = Math.random() * canvas.width;
        const y = -50;
        
        // Random size
        const sizes = ['small', 'medium', 'large'];
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        
        // Create meteor
        const meteor = new Meteor({
            size: size,
            mass: 1000,
            dragCoefficient: 0.1,
            elasticity: 0.5,
            sprite: `assets/sprites/meteor_${size}.png`
        });
        
        meteor.setPosition({ x: x, y: y });
        
        // Set velocity based on difficulty
        const speed = 200 + Math.random() * 200 * this.meteorSpeedMultiplier;
        meteor.setVelocity({
            x: (Math.random() - 0.5) * speed,
            y: speed
        });
        
        this.meteors.push(meteor);
    }

    /**
     * Update all meteors
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateMeteors(deltaTime) {
        const activeMeteors = [];
        
        for (const meteor of this.meteors) {
            if (!meteor.isActive) continue;
            
            meteor.update(deltaTime);
            
            // Apply gravity
            meteor.applyForce({
                magnitude: this.gravity * meteor.physicsBody.mass,
                direction: { x: 0, y: 1 },
                type: 'gravity'
            });
            
            // Check collision with projectiles
            for (const projectile of this.projectiles) {
                if (!projectile.isActive) continue;
                
                if (this.checkCollision(meteor, projectile)) {
                    meteor.onCollision(projectile);
                    projectile.onCollision(meteor);
                }
            }
            
            // Check if meteor is on screen
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                const meteorPos = meteor.physicsBody.position;
                
                // Check collision with ground
                if (meteorPos.y > this.groundHeight) {
                    meteor.isActive = false;
                    this.createImpactParticle(meteorPos.x, this.groundHeight);
                    this.meteorImpactSound.currentTime = 0;
                    this.meteorImpactSound.play();
                    // Remove from physics engine
                    if (meteor.physicsBody) {
                        this.physicsEngine.removeBody(meteor.physicsBody);
                    }
                    continue;
                }
                
                // Check collision with player
                if (this.player && this.player.isActive &&
                    meteor.checkCollision(this.player, 30, 30)) {
                    meteor.onCollision(this.player);
                    this.player.onCollision(meteor);
                    meteor.isActive = false;
                    this.createImpactParticle(meteorPos.x, meteorPos.y);
                    this.meteorImpactSound.currentTime = 0;
                    this.meteorImpactSound.play();
                    // Remove from physics engine
                    if (meteor.physicsBody) {
                        this.physicsEngine.removeBody(meteor.physicsBody);
                    }
                    continue;
                }
                
                // Check if meteor is off screen
                if (meteorPos.y > canvas.height + 100 ||
                    meteorPos.x < -100 ||
                    meteorPos.x > canvas.width + 100) {
                    meteor.isActive = false;
                    // Remove from physics engine
                    if (meteor.physicsBody) {
                        this.physicsEngine.removeBody(meteor.physicsBody);
                    }
                    continue;
                }
            }
            
            activeMeteors.push(meteor);
        }
        
        this.meteors = activeMeteors;
    }

    /**
     * Create impact particle effect
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createImpactParticle(x, y) {
        this.impactParticles.push({
            position: { x: x, y: y },
            lifetime: 0.5
        });
    }

    /**
     * Update particles
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateParticles(deltaTime) {
        const activeParticles = [];
        
        for (const particle of this.impactParticles) {
            particle.lifetime -= deltaTime;
            if (particle.lifetime > 0) {
                activeParticles.push(particle);
            }
        }
        
        this.impactParticles = activeParticles;
    }

    /**
     * Update emergency alarm system
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateEmergencyAlarm(deltaTime) {
        const levelNum = this.levelConfig.id;
        const timeSinceStart = (performance.now() - this.levelStartTime) / 1000;
        
        // Emergency alarm triggers at different times based on level
        const emergencyTriggerTime = 30 - (levelNum - 1) * 2;
        
        if (timeSinceStart >= emergencyTriggerTime && !this.isEmergencyActive) {
            this.isEmergencyActive = true;
            this.alarmSound.play();
            
            // Flash screen red
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                const context = canvas.getContext('2d');
                context.fillStyle = 'rgba(255, 0, 0, 0.3)';
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        
        // Stop alarm when rocket is launched
        if (this.rocketLaunched && this.alarmSound) {
            this.alarmSound.pause();
            this.alarmSound.currentTime = 0;
        }
    }

    /**
     * Create rocket entity
     */
    createRocket() {
        this.rocket = new Rocket({
            mass: 500,
            dragCoefficient: 0.2,
            elasticity: 0.3,
            sprite: 'assets/sprites/rocket.png'
        });
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            this.rocket.setPosition({
                x: canvas.width - 200,
                y: this.groundHeight - 50
            });
        }
    }

    /**
     * Handle rocket launch
     */
    handleRocketLaunch() {
        if (this.rocket && this.rocket.isActive && !this.rocketLaunched) {
            this.rocketLaunched = true;
            this.rocket.startLaunchSequence();
            this.rocketEngineSound.play();
            
            // Stop meteor spawning
            this.meteorSpawnInterval = 1000;
            
            // Clear all meteors
            this.meteors = [];
            
            // Complete level after launch sequence
            setTimeout(() => {
                EventBus.emit('level_complete');
            }, 5000);
        }
    }

    /**
     * Check level completion conditions
     */
    checkLevelCompletion() {
        const levelNum = this.levelConfig.id;
        
        // Level 10 requires rocket launch
        if (levelNum === 10 && this.rocketLaunched) {
            EventBus.emit('level_complete');
        }
        
        // Other levels complete after time or objectives
        if (levelNum < 10) {
            const timeSinceStart = (performance.now() - this.levelStartTime) / 1000;
            const levelDuration = 60 - (levelNum - 1) * 5;
            
            if (timeSinceStart >= levelDuration) {
                EventBus.emit('level_complete');
            }
        }
    }

    /**
     * Render the scene
     */
    render() {
        const context = this.physicsEngine.game.context;
        if (!context) return;
        
        // Draw background
        if (this.background && this.background.complete && this.background.naturalWidth > 0) {
            context.drawImage(this.background, 0, 0, context.canvas.width, context.canvas.height);
        } else {
            // Fallback: draw a sky background
            context.fillStyle = '#87CEEB';
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        }
        
        // Draw ground
        if (this.ground && this.ground.complete && this.ground.naturalWidth > 0) {
            context.drawImage(this.ground, 0, this.groundHeight, context.canvas.width, 100);
        } else {
            // Fallback: draw brown ground
            context.fillStyle = '#8B4513';
            context.fillRect(0, this.groundHeight, context.canvas.width, 100);
        }
        
        // Draw meteors
        for (const meteor of this.meteors) {
            if (meteor.isActive) {
                meteor.render(context);
            }
        }
        
        // Draw rocket
        if (this.rocket && this.rocket.isActive) {
            this.rocket.render(context);
        }
        
        // Draw player
        if (this.player && this.player.isActive) {
            this.player.render(context);
        }
        
        // Draw particles
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const particle of this.impactParticles) {
            context.beginPath();
            context.arc(particle.position.x, particle.position.y, 5 * (1 - particle.lifetime * 2), 0, Math.PI * 2);
            context.fill();
        }
        
        // Draw emergency alarm indicator
        if (this.isEmergencyActive) {
            context.fillStyle = 'rgba(255, 0, 0, 0.5)';
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
            
            context.fillStyle = 'red';
            context.font = '48px Arial';
            context.textAlign = 'center';
            context.fillText('EMERGENCY!', context.canvas.width / 2, 100);
        }
        
        // Draw level info
        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.textAlign = 'left';
        context.fillText(`Level: ${this.levelConfig.id}`, 20, 40);
        
        // Draw player state
        context.fillText(`State: ${this.playerState}`, 20, 80);
        
        // Draw rocket discovery message
        if (this.rocketDiscovered && !this.rocketLaunched) {
            context.fillStyle = 'yellow';
            context.font = '32px Arial';
            context.textAlign = 'center';
            context.fillText('ROCKET DISCOVERED! Press SPACE to launch', context.canvas.width / 2, context.canvas.height - 100);
        }
    }

    /**
     * Resize the scene to match new canvas dimensions
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        // Update ground height based on new canvas size
        this.groundHeight = height - 100;
        this.groundWidth = width;
        
        // Reposition player if it exists
        if (this.player) {
            this.player.setPosition({
                x: Math.min(this.player.physicsBody.position.x, width - 50),
                y: this.groundHeight - 50
            });
        }
        
        // Reposition rocket if it exists
        if (this.rocket) {
            this.rocket.setPosition({
                x: Math.min(width - 200, width - 50),
                y: this.groundHeight - 50
            });
        }
    }

    /**
     * Clean up scene resources
     */
    cleanup() {
        super.cleanup();
        
        if (this.alarmSound) {
            this.alarmSound.pause();
            this.alarmSound.currentTime = 0;
        }
        
        if (this.rocketEngineSound) {
            this.rocketEngineSound.pause();
            this.rocketEngineSound.currentTime = 0;
        }
        
        // Clean up player
        if (this.player) {
            this.player.cleanup();
            this.player = null;
        }
        
        // Clean up rocket
        if (this.rocket) {
            this.rocket.cleanup();
            this.rocket = null;
        }
        
        // Clean up meteors
        this.meteors.forEach(meteor => {
            if (meteor) {
                meteor.cleanup();
                if (meteor.physicsBody) {
                    this.physicsEngine.removeBody(meteor.physicsBody);
                }
            }
        });
        this.meteors = [];
        
        this.impactParticles = [];
    }
}
