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
    /** @type {boolean} */
    playerNearRocket = false;
    /** @type {boolean} */
    playerInRocket = false;
    /** @type {number} */
    launchCountdown = 0;
    /** @type {number} */
    targetScore = 100;
    /** @type {boolean} */
    levelComplete = false;
    /** @type {number} */
    levelCompleteTimer = 0;
    
    // Target scores for each level (Level 1-10)
    static LEVEL_TARGET_SCORES = {
        1: 100,    // Easy start
        2: 200,
        3: 350,
        4: 500,
        5: 700,
        6: 900,
        7: 1200,
        8: 1500,
        9: 2000,
        10: 2500   // Final level - reach rocket
    };
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
            // Prevent default for game controls
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'x', 'enter'].includes(key)) {
                event.preventDefault();
            }
        };
        this.handleKeyUp = (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = false;
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
        
        // Set target score for this level
        this.targetScore = EarthScene.LEVEL_TARGET_SCORES[levelNum] || 100;
        this.levelComplete = false;
        this.levelCompleteTimer = 0;
        
        // Show level objective
        if (window.gameState && window.gameState.hud) {
            const objective = {
                type: 'score',
                target: this.targetScore,
                description: levelNum === 10 ? 'Reach rocket and launch to Sky!' : `Reach ${this.targetScore} points`
            };
            window.gameState.hud.showLevelObjective(objective);
        }
        
        // Create player AFTER ground height is set
        this.player = new Player({
            health: 100,
            maxHealth: 100,
            mass: 80,
            dragCoefficient: 0.3,
            elasticity: 0.2,
            sprite: 'assets/sprites/player_earth.png'
        });
        
        // Position player on ground (adjusted for 1.5x scale - player is taller)
        this.player.setPosition({
            x: 400,
            y: this.groundHeight - 65
        });
        
        // Player starts on ground
        this.player.isGrounded = true;
        
        // Set player level for multi-bullet upgrades
        this.player.setLevel(levelNum);
        
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
        
        if (!this.player) return;
        
        // Always handle rocket interaction (even when player is in rocket)
        this.checkPlayerNearRocket();
        this.updateRocketInteraction(deltaTime);
        
        // If player is in rocket or launching, skip normal gameplay updates
        if (this.playerInRocket || this.rocketLaunching || this.rocketLaunched) {
            // Still update particles for visual effects
            this.updateParticles(deltaTime);
            this.updateHUD();
            return;
        }
        
        // Normal gameplay updates (only when player is active)
        if (!this.player.isActive) return;
        
        // Update player ground contact
        this.updatePlayerGroundContact();
        
        // Update meteor spawning
        this.updateMeteorSpawning(deltaTime);
        
        // Update meteors
        this.updateMeteors(deltaTime);
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update emergency alarm
        this.updateEmergencyAlarm(deltaTime);
        
        // Check level completion
        this.checkLevelCompletion();
        
        // Update HUD
        this.updateHUD();
    }
    
    /**
     * Check if player is near the rocket
     */
    checkPlayerNearRocket() {
        if (!this.rocket || !this.player || !this.rocketDiscovered) {
            this.playerNearRocket = false;
            return;
        }
        
        const playerPos = this.player.getPosition();
        const rocketPos = this.rocket.getPosition();
        
        const dx = playerPos.x - rocketPos.x;
        const dy = playerPos.y - rocketPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Player is near rocket if within 80 pixels
        this.playerNearRocket = distance < 80;
    }
    
    /**
     * Update rocket interaction (F key to enter/exit)
     * @param {number} deltaTime
     */
    updateRocketInteraction(deltaTime) {
        if (!this.rocket || !this.rocketDiscovered) return;
        
        // Debounce F key press
        if (!this.fKeyPressed && this.keys && this.keys['f'] === true) {
            this.fKeyPressed = true;
            
            if (this.playerNearRocket && !this.playerInRocket && !this.enteringRocket) {
                // Start entering rocket animation
                this.enteringRocket = true;
                this.enterRocketTimer = 0;
                this.playerEnterStartPos = this.player.getPosition();
            } else if (this.playerInRocket && this.launchCountdown > 0.5 && !this.rocketLaunching) {
                // Exit rocket (only if countdown hasn't started seriously)
                this.playerInRocket = false;
                this.player.isActive = true; // Show player again
                this.launchCountdown = 0;
                
                // Position player next to rocket
                const rocketPos = this.rocket.getPosition();
                this.player.setPosition({
                    x: rocketPos.x - 80,
                    y: this.groundHeight - 65
                });
            }
        }
        
        // Reset F key debounce
        if (this.keys && this.keys['f'] !== true) {
            this.fKeyPressed = false;
        }
        
        // Handle entering rocket animation
        if (this.enteringRocket && !this.playerInRocket) {
            this.enterRocketTimer += deltaTime;
            const duration = 1.0; // 1 second to enter
            const progress = Math.min(1, this.enterRocketTimer / duration);
            
            // Move player towards rocket door
            const rocketPos = this.rocket.getPosition();
            const targetX = rocketPos.x;
            const targetY = rocketPos.y - 20; // Rocket door position
            
            const currentX = this.playerEnterStartPos.x + (targetX - this.playerEnterStartPos.x) * progress;
            const currentY = this.playerEnterStartPos.y + (targetY - this.playerEnterStartPos.y) * progress;
            
            this.player.setPosition({ x: currentX, y: currentY });
            
            // Scale down player as they enter
            this.playerEnterScale = 1 - progress * 0.8;
            
            if (progress >= 1) {
                // Finished entering
                this.enteringRocket = false;
                this.playerInRocket = true;
                this.player.isActive = false;
                this.launchCountdown = 3.0;
            }
        }
        
        // Handle launch countdown
        if (this.playerInRocket && !this.rocketLaunched && !this.rocketLaunching) {
            this.launchCountdown -= deltaTime;
            
            if (this.launchCountdown <= 0) {
                // Start launch animation
                this.rocketLaunching = true;
                this.launchTimer = 0;
                this.rocket.isThrusting = true;
            }
        }
        
        // Handle rocket launch animation on Earth
        if (this.rocketLaunching && !this.rocketLaunched) {
            this.launchTimer += deltaTime;
            
            // Shake effect
            this.rocketShake = Math.sin(this.launchTimer * 50) * (3 - this.launchTimer);
            
            // Move rocket up after 1 second
            if (this.launchTimer > 1.0) {
                const rocketPos = this.rocket.getPosition();
                const speed = 200 + (this.launchTimer - 1.0) * 400; // Accelerate
                this.rocket.setPosition({
                    x: rocketPos.x + this.rocketShake,
                    y: rocketPos.y - speed * deltaTime
                });
            }
            
            // Transition to sky after rocket leaves screen
            if (this.launchTimer > 3.0 || this.rocket.getPosition().y < -200) {
                this.rocketLaunched = true;
                this.levelComplete = true;
                EventBus.emit('level_complete');
            }
        }
    }
    
    /**
     * Update all projectiles
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateProjectiles(deltaTime) {
        const activeProjectiles = [];
        for (const projectile of this.projectiles) {
            if (!projectile.isActive) continue;
            
            // Update projectile position based on velocity
            const pos = projectile.getPosition();
            const vel = projectile.getVelocity();
            projectile.setPosition({
                x: pos.x + vel.x * deltaTime,
                y: pos.y + vel.y * deltaTime
            });
            
            projectile.update(deltaTime);
            
            // Check collision with meteors
            for (const meteor of this.meteors) {
                if (!meteor.isActive) continue;
                if (projectile.checkCollision(meteor, 8, 20)) {
                    const wasActive = meteor.isActive;
                    projectile.onCollision(meteor);
                    meteor.onCollision(projectile);
                    // Add score when meteor destroyed
                    if (wasActive && !meteor.isActive && this.player) {
                        // Score based on size and type
                        let points = 10;
                        if (meteor.size === 'small') points = 10;
                        else if (meteor.size === 'medium') points = 25;
                        else if (meteor.size === 'large') points = 50;
                        else if (meteor.size === 'huge') points = 100;
                        
                        // Bonus for special meteor types
                        if (meteor.meteorType === 'fire') points *= 1.5;
                        if (meteor.meteorType === 'metal') points *= 2;
                        
                        this.player.addScore(Math.floor(points));
                        
                        // Create explosion particles
                        this.createImpactParticle(meteor.physicsBody.position.x, meteor.physicsBody.position.y);
                    }
                }
            }
            
            if (projectile.isActive) {
                activeProjectiles.push(projectile);
            }
        }
        this.projectiles = activeProjectiles;
    }
    
    /**
     * Update HUD with current game state
     */
    updateHUD() {
        if (this.physicsEngine.game && this.physicsEngine.game.hud && this.physicsEngine.game.gameState && this.player) {
            const timeSinceStart = (performance.now() - this.levelStartTime) / 1000;
            
            // Update game state with current player stats including SCORE
            this.physicsEngine.game.gameState.playerStats = {
                health: this.player.health,
                maxHealth: 100,
                score: this.player.score  // Use actual player score!
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
        // Player is scaled 1.5x, so height is about 70 pixels from center
        // Check if player's feet are near or below ground level
        const playerBottom = this.player.physicsBody.position.y + 65;
        const nearGround = playerBottom >= this.groundHeight - 10;
        
        // Only set grounded if near ground AND not moving upward (jumping)
        // If player is moving upward (negative velocity), they are jumping
        if (nearGround && this.player.physicsBody.velocity.y >= 0) {
            this.playerGroundContact = true;
            this.player.isGrounded = true;
        } else {
            this.playerGroundContact = false;
            this.player.isGrounded = false;
        }
    }

    /**
     * Update player state and movement
     * @param {number} deltaTime - Time since last update in seconds
     */
    updatePlayer(deltaTime) {
        // Handle input FIRST (so jump velocity is set before ground check)
        if (this.keys) {
            const keys = {...this.keys, 'earth_scene': true};
            this.player.handleInput(keys);
        }
        
        // Re-check ground contact AFTER input (jump may have changed velocity)
        // This ensures we don't snap back to ground if player just jumped
        const playerBottom = this.player.physicsBody.position.y + 65;
        const nearGround = playerBottom >= this.groundHeight - 10;
        const isMovingDown = this.player.physicsBody.velocity.y >= 0;
        const shouldBeGrounded = nearGround && isMovingDown;
        
        // Apply gravity only if not grounded
        if (!shouldBeGrounded) {
            this.player.applyForce({
                magnitude: this.gravity * this.player.physicsBody.mass,
                direction: { x: 0, y: 1 },
                type: 'gravity'
            });
        }
        
        // Update player physics (apply velocity to position)
        const vel = this.player.physicsBody.velocity;
        this.player.physicsBody.position.y += vel.y * deltaTime;
        
        // Handle ground collision AFTER physics update
        if (shouldBeGrounded) {
            // Keep player on ground (adjusted for 1.5x scale)
            this.player.physicsBody.position.y = this.groundHeight - 65;
            this.player.physicsBody.velocity.y = 0;
            this.playerJumping = false;
            this.player.isGrounded = true;
            this.playerGroundContact = true;
            
            // Apply drag when on ground
            this.player.physicsBody.dragCoefficient = 0.5;
        } else {
            // In the air
            this.player.isGrounded = false;
            this.playerGroundContact = false;
            
            // Less drag in air
            this.player.physicsBody.dragCoefficient = 0.1;
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
     * Spawn a new meteor with variety
     */
    spawnMeteor() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        // Random position at top of screen
        const x = Math.random() * canvas.width;
        const y = -50;
        
        // Size distribution based on level difficulty
        const levelNum = this.levelConfig.id;
        let sizes, sizeWeights;
        
        if (levelNum <= 3) {
            sizes = ['small', 'medium'];
            sizeWeights = [0.7, 0.3];
        } else if (levelNum <= 6) {
            sizes = ['small', 'medium', 'large'];
            sizeWeights = [0.4, 0.4, 0.2];
        } else {
            sizes = ['small', 'medium', 'large', 'huge'];
            sizeWeights = [0.3, 0.35, 0.25, 0.1];
        }
        
        // Weighted random selection
        const rand = Math.random();
        let cumulative = 0;
        let size = sizes[0];
        for (let i = 0; i < sizes.length; i++) {
            cumulative += sizeWeights[i];
            if (rand < cumulative) {
                size = sizes[i];
                break;
            }
        }
        
        // Random meteor type
        const types = ['rock', 'rock', 'rock', 'ice', 'fire', 'metal'];
        const meteorType = types[Math.floor(Math.random() * types.length)];
        
        // Create meteor with variety
        const meteor = new Meteor({
            size: size,
            meteorType: meteorType,
            mass: 1000,
            dragCoefficient: 0.1,
            elasticity: 0.5,
            sprite: `assets/sprites/meteor_${size}.png`
        });
        
        meteor.setPosition({ x: x, y: y });
        
        // Set velocity based on difficulty and meteor type
        let baseSpeed = 150 + Math.random() * 100 * this.meteorSpeedMultiplier;
        
        // Fire meteors are faster
        if (meteorType === 'fire') baseSpeed *= 1.3;
        // Metal meteors are slower but tougher
        if (meteorType === 'metal') baseSpeed *= 0.8;
        
        // Add some horizontal movement for variety
        const horizontalSpeed = (Math.random() - 0.5) * baseSpeed * 0.5;
        
        // Aim towards player sometimes (higher levels)
        let targetX = horizontalSpeed;
        if (this.player && Math.random() < 0.3 * (levelNum / 10)) {
            const playerPos = this.player.getPosition();
            const dx = playerPos.x - x;
            targetX = dx * 0.3 + horizontalSpeed * 0.5;
        }
        
        meteor.setVelocity({
            x: targetX,
            y: baseSpeed
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
                
                if (meteor.checkCollision(projectile, 20, 8)) {
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
                    // Play sound safely
                    try {
                        if (this.meteorImpactSound && this.meteorImpactSound.src) {
                            this.meteorImpactSound.currentTime = 0;
                            this.meteorImpactSound.play().catch(() => {});
                        }
                    } catch (e) {}
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
                    // Play sound safely
                    try {
                        if (this.meteorImpactSound && this.meteorImpactSound.src) {
                            this.meteorImpactSound.currentTime = 0;
                            this.meteorImpactSound.play().catch(() => {});
                        }
                    } catch (e) {}
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
     * Update emergency alarm system (disabled)
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateEmergencyAlarm(deltaTime) {
        // Emergency alarm disabled
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
     * Handle rocket launch (called when player enters rocket)
     */
    handleRocketLaunch() {
        if (this.rocket && this.rocket.isActive && !this.rocketLaunched && this.playerInRocket) {
            this.rocketLaunched = true;
            this.rocket.isThrusting = true;
            
            // Play sound safely
            try {
                if (this.rocketEngineSound && this.rocketEngineSound.src) {
                    this.rocketEngineSound.play().catch(() => {});
                }
            } catch (e) {}
            
            // Stop meteor spawning
            this.meteorSpawnInterval = 1000;
            
            // Clear all meteors
            this.meteors = [];
        }
    }

    /**
     * Check level completion conditions
     */
    checkLevelCompletion() {
        if (this.levelComplete) return;
        
        const levelNum = this.levelConfig.id;
        const currentScore = this.player ? this.player.score : 0;
        
        // Update objective progress
        if (window.gameState && window.gameState.hud) {
            window.gameState.hud.updateObjectiveProgress(currentScore, this.targetScore);
        }
        
        // Level 10 requires rocket launch after reaching target score
        if (levelNum === 10) {
            if (currentScore >= this.targetScore && !this.rocketDiscovered) {
                this.rocketDiscovered = true;
                this.createRocket();
            }
            if (this.rocketLaunched) {
                this.levelComplete = true;
                this.showCompletionAnimation();
                EventBus.emit('level_complete');
            }
            return;
        }
        
        // Other levels complete when target score is reached
        if (currentScore >= this.targetScore) {
            this.levelComplete = true;
            this.levelCompleteTimer = 2.0; // 2 second delay before transition
            
            // Show completion animation
            this.showCompletionAnimation();
            
            // Emit level complete after animation
            setTimeout(() => {
                EventBus.emit('level_complete');
            }, 3000); // Wait for animation to finish
        }
    }
    
    /**
     * Show level completion animation
     */
    showCompletionAnimation() {
        if (window.gameState && window.gameState.hud) {
            const stats = {
                score: this.player ? this.player.score : 0,
                time: (performance.now() - this.levelStartTime) / 1000,
                health: this.player ? this.player.health : 100,
                accuracy: 85 // Calculate based on hits/shots if available
            };
            
            window.gameState.hud.showLevelComplete(stats, () => {
                console.log('[EarthScene] Level completion animation finished');
            });
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
        
        // Draw projectiles
        for (const projectile of this.projectiles) {
            if (projectile.isActive) {
                projectile.render(context);
            }
        }
        
        // Draw rocket (with shake during launch)
        if (this.rocket && this.rocket.isActive) {
            if (this.rocketLaunching) {
                context.save();
                context.translate(this.rocketShake || 0, 0);
                this.rocket.render(context);
                context.restore();
                
                // Draw launch smoke/flames at ground level
                this.drawLaunchEffects(context);
            } else {
                this.rocket.render(context);
            }
        }
        
        // Draw player entering rocket animation
        if (this.enteringRocket && this.player) {
            context.save();
            const pos = this.player.getPosition();
            context.translate(pos.x, pos.y);
            context.scale(this.playerEnterScale || 1, this.playerEnterScale || 1);
            context.translate(-pos.x, -pos.y);
            this.player.render(context);
            context.restore();
        } else if (this.player && this.player.isActive) {
            // Draw player normally
            this.player.render(context);
        }
        
        // Draw particles
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const particle of this.impactParticles) {
            context.beginPath();
            context.arc(particle.position.x, particle.position.y, 5 * (1 - particle.lifetime * 2), 0, Math.PI * 2);
            context.fill();
        }
        
        // Draw game info panel
        this.drawGameInfo(context);
        
        // Draw controls hint
        this.drawControlsHint(context);
        
        // Draw rocket interaction messages
        if (this.rocketDiscovered && !this.rocketLaunched) {
            if (this.rocketLaunching) {
                // Rocket is launching!
                context.fillStyle = 'rgba(0, 0, 0, 0.85)';
                context.fillRect(0, context.canvas.height / 2 - 80, context.canvas.width, 160);
                
                context.fillStyle = '#FF4400';
                context.font = 'bold 48px Arial';
                context.textAlign = 'center';
                context.fillText('🚀 LIFTOFF! 🚀', context.canvas.width / 2, context.canvas.height / 2);
                
                context.fillStyle = '#FFFF00';
                context.font = '24px Arial';
                context.fillText('Ascending to the sky...', context.canvas.width / 2, context.canvas.height / 2 + 45);
            } else if (this.enteringRocket) {
                // Player entering rocket animation
                context.fillStyle = 'rgba(0, 0, 0, 0.7)';
                context.fillRect(context.canvas.width / 2 - 180, context.canvas.height / 2 - 40, 360, 80);
                
                context.fillStyle = '#00FFFF';
                context.font = 'bold 28px Arial';
                context.textAlign = 'center';
                context.fillText('Entering rocket...', context.canvas.width / 2, context.canvas.height / 2 + 10);
            } else if (this.playerInRocket) {
                // Launch countdown - player is inside rocket
                context.fillStyle = 'rgba(0, 0, 0, 0.85)';
                context.fillRect(0, context.canvas.height / 2 - 100, context.canvas.width, 200);
                
                context.fillStyle = '#FF6600';
                context.font = 'bold 36px Arial';
                context.textAlign = 'center';
                context.fillText('🚀 LAUNCH SEQUENCE INITIATED', context.canvas.width / 2, context.canvas.height / 2 - 50);
                
                context.fillStyle = '#FFFFFF';
                context.font = 'bold 90px Arial';
                context.fillText(Math.ceil(this.launchCountdown).toString(), context.canvas.width / 2, context.canvas.height / 2 + 45);
                
                context.fillStyle = '#AAAAAA';
                context.font = '16px Arial';
                context.fillText('Press F to abort and exit rocket', context.canvas.width / 2, context.canvas.height / 2 + 85);
            } else if (this.playerNearRocket) {
                // Press F prompt - player is near rocket
                context.fillStyle = 'rgba(0, 0, 0, 0.8)';
                context.fillRect(context.canvas.width / 2 - 220, context.canvas.height - 140, 440, 60);
                
                context.fillStyle = '#00FF00';
                context.font = 'bold 30px Arial';
                context.textAlign = 'center';
                context.fillText('Press F to ENTER ROCKET', context.canvas.width / 2, context.canvas.height - 100);
            } else {
                // Go to rocket message
                context.fillStyle = 'rgba(0, 0, 0, 0.7)';
                context.fillRect(context.canvas.width / 2 - 240, context.canvas.height - 140, 480, 60);
                
                context.fillStyle = '#FFFF00';
                context.font = 'bold 26px Arial';
                context.textAlign = 'center';
                context.fillText('🚀 ROCKET READY! Walk to the rocket →', context.canvas.width / 2, context.canvas.height - 100);
            }
        }
    }
    
    /**
     * Draw launch effects (smoke, flames at ground)
     * @param {CanvasRenderingContext2D} context
     */
    drawLaunchEffects(context) {
        if (!this.rocket || !this.rocketLaunching) return;
        
        const rocketPos = this.rocket.getPosition();
        const time = Date.now() / 100;
        
        // Draw smoke clouds at ground level
        for (let i = 0; i < 8; i++) {
            const offsetX = Math.sin(time + i * 0.8) * (30 + i * 15);
            const offsetY = Math.cos(time + i * 0.5) * 10;
            const size = 40 + i * 20 + Math.sin(time * 2 + i) * 10;
            const alpha = 0.6 - i * 0.06;
            
            context.fillStyle = `rgba(200, 200, 200, ${alpha})`;
            context.beginPath();
            context.arc(rocketPos.x + offsetX, this.groundHeight - 20 + offsetY, size, 0, Math.PI * 2);
            context.fill();
        }
        
        // Draw fire/exhaust at rocket base
        const flameHeight = 60 + Math.random() * 30;
        const gradient = context.createLinearGradient(
            rocketPos.x, rocketPos.y + 70,
            rocketPos.x, rocketPos.y + 70 + flameHeight
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.2, '#FFFF00');
        gradient.addColorStop(0.5, '#FF6600');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        context.fillStyle = gradient;
        context.beginPath();
        context.moveTo(rocketPos.x - 25, rocketPos.y + 70);
        context.quadraticCurveTo(rocketPos.x, rocketPos.y + 70 + flameHeight, rocketPos.x + 25, rocketPos.y + 70);
        context.closePath();
        context.fill();
    }
    
    /**
     * Draw game information panel
     * @param {CanvasRenderingContext2D} context
     */
    drawGameInfo(context) {
        const padding = 15;
        const panelWidth = 220;
        const panelHeight = 140;
        
        // Panel background
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.beginPath();
        context.roundRect(padding, padding, panelWidth, panelHeight, 10);
        context.fill();
        
        // Panel border
        context.strokeStyle = '#E8A33C';
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(padding, padding, panelWidth, panelHeight, 10);
        context.stroke();
        
        // Chapter & Level info
        context.fillStyle = '#E8A33C';
        context.font = 'bold 18px Arial';
        context.textAlign = 'left';
        context.fillText(`CHAPTER 1: EARTH`, padding + 15, padding + 25);
        
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 14px Arial';
        context.fillText(`Level ${this.levelConfig.id} / 10`, padding + 15, padding + 45);
        
        // Score with target
        const score = this.player ? this.player.score : 0;
        const scoreColor = score >= this.targetScore ? '#00FF00' : '#FFFF00';
        context.fillStyle = scoreColor;
        context.font = 'bold 18px Arial';
        context.fillText(`SCORE: ${score} / ${this.targetScore}`, padding + 15, padding + 70);
        
        // Progress bar for score
        const progressWidth = panelWidth - 30;
        const progressHeight = 8;
        const progressX = padding + 15;
        const progressY = padding + 78;
        const progress = Math.min(1, score / this.targetScore);
        
        // Progress background
        context.fillStyle = '#333';
        context.beginPath();
        context.roundRect(progressX, progressY, progressWidth, progressHeight, 3);
        context.fill();
        
        // Progress fill
        const progressGrad = context.createLinearGradient(progressX, progressY, progressX + progressWidth * progress, progressY);
        progressGrad.addColorStop(0, '#00AA00');
        progressGrad.addColorStop(1, score >= this.targetScore ? '#00FF00' : '#FFFF00');
        context.fillStyle = progressGrad;
        context.beginPath();
        context.roundRect(progressX, progressY, progressWidth * progress, progressHeight, 3);
        context.fill();
        
        // Health and Bullets on same line
        context.fillStyle = '#FF6666';
        context.font = '14px Arial';
        const health = this.player ? this.player.health : 0;
        context.fillText(`Health: ${health}%`, padding + 15, padding + 105);
        
        // Bullet count indicator
        const bulletCount = this.player ? this.player.bulletCount : 1;
        context.fillStyle = '#00FFFF';
        context.textAlign = 'right';
        context.fillText(`🔫 x${bulletCount}`, padding + panelWidth - 15, padding + 105);
        
        // Time
        context.textAlign = 'left';
        context.fillStyle = '#AAAAAA';
        const timeSinceStart = Math.floor((performance.now() - this.levelStartTime) / 1000);
        const minutes = Math.floor(timeSinceStart / 60);
        const seconds = timeSinceStart % 60;
        context.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, padding + 15, padding + 125);
        
        // Meteors count on right side
        context.fillStyle = '#FFAA00';
        context.textAlign = 'right';
        context.fillText(`☄ ${this.meteors.length}`, padding + panelWidth - 15, padding + 125);
        
        // Level complete message
        if (this.levelComplete) {
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, context.canvas.height / 2 - 50, context.canvas.width, 100);
            
            context.fillStyle = '#00FF00';
            context.font = 'bold 36px Arial';
            context.textAlign = 'center';
            context.fillText('LEVEL COMPLETE!', context.canvas.width / 2, context.canvas.height / 2);
            
            context.fillStyle = '#FFFFFF';
            context.font = '20px Arial';
            context.fillText('Advancing to next level...', context.canvas.width / 2, context.canvas.height / 2 + 35);
        }
    }
    
    /**
     * Draw controls hint at bottom of screen
     * @param {CanvasRenderingContext2D} context
     */
    drawControlsHint(context) {
        const canvas = context.canvas;
        const y = canvas.height - 30;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, y - 15, canvas.width, 45);
        
        context.fillStyle = '#FFFFFF';
        context.font = '14px Arial';
        context.textAlign = 'center';
        context.fillText('← → or A/D: Move  |  ↑ or W/Space: Jump  |  X or Enter: Shoot  |  ESC: Pause', canvas.width / 2, y + 5);
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
        
        // Remove keyboard event listeners
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown, true);
        }
        if (this.handleKeyUp) {
            document.removeEventListener('keyup', this.handleKeyUp, true);
        }
        
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
        
        // Clean up projectiles
        this.projectiles = [];
        
        this.impactParticles = [];
        
        // Reset state flags
        this.rocketDiscovered = false;
        this.rocketLaunched = false;
        this.rocketLaunching = false;
        this.playerInRocket = false;
        this.enteringRocket = false;
        this.levelComplete = false;
    }
}
