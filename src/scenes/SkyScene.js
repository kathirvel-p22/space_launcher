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

    // Level configurations for Sky chapter (11-25)
    static LEVEL_CONFIGS = {
        11: { // ROCKET ACTIVATION - Teach rocket control
            targetScore: 200, gravity: 0.3, fuelUnlimited: true, heatEnabled: false,
            enemies: [], spawnRate: 0, objective: 'altitude', targetAltitude: 5000,
            description: 'Learn rocket controls'
        },
        12: { // FUEL AWARENESS
            targetScore: 300, gravity: 0.28, fuelUnlimited: false, heatEnabled: false,
            enemies: [], spawnRate: 0, objective: 'altitude', targetAltitude: 8000,
            description: 'Manage your fuel'
        },
        13: { // FALLING DEBRIS
            targetScore: 400, gravity: 0.26, fuelUnlimited: false, heatEnabled: false,
            enemies: ['debris'], spawnRate: 1.5, objective: 'score',
            description: 'Avoid falling debris'
        },
        14: { // MOMENTUM CONTROL
            targetScore: 500, gravity: 0.24, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris'], spawnRate: 1.2, objective: 'score',
            description: 'Control your momentum'
        },
        15: { // ENDURANCE ASCENT - Checkpoint
            targetScore: 700, gravity: 0.22, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris'], spawnRate: 1.0, objective: 'score',
            description: 'Endurance climb'
        },
        16: { // FIRE INTRODUCTION
            targetScore: 800, gravity: 0.20, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris', 'fireball'], spawnRate: 1.0, objective: 'score',
            description: 'Fireballs appear!'
        },
        17: { // WIND & FIRE
            targetScore: 1000, gravity: 0.18, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris', 'fireball'], spawnRate: 0.9, windEnabled: true,
            objective: 'score', description: 'Wind and fire'
        },
        18: { // FIRST DRONES
            targetScore: 1200, gravity: 0.16, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris', 'fireball', 'drone'], spawnRate: 0.8, droneCount: 1,
            objective: 'score', description: 'Drones attack!'
        },
        19: { // DRONE SWARM
            targetScore: 1500, gravity: 0.14, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris', 'fireball', 'drone'], spawnRate: 0.7, droneCount: 3,
            objective: 'score', description: 'Drone swarm'
        },
        20: { // MIXED HAZARD ZONE - Checkpoint
            targetScore: 1800, gravity: 0.12, fuelUnlimited: false, heatEnabled: true,
            enemies: ['debris', 'fireball', 'drone'], spawnRate: 0.6, droneCount: 3,
            objective: 'score', description: 'Mixed hazards'
        },
        21: { // FIRESTORM ASCENT
            targetScore: 2000, gravity: 0.10, fuelUnlimited: false, heatEnabled: true,
            enemies: ['fireball'], spawnRate: 0.5, heatMultiplier: 1.5,
            objective: 'score', description: 'Firestorm!'
        },
        22: { // DRONE FORMATIONS
            targetScore: 2300, gravity: 0.08, fuelUnlimited: false, heatEnabled: true,
            enemies: ['drone'], spawnRate: 0.5, droneCount: 4, advancedDrones: true,
            objective: 'score', description: 'Advanced drones'
        },
        23: { // NARROW SAFE PATHS
            targetScore: 2600, gravity: 0.06, fuelUnlimited: false, heatEnabled: true,
            enemies: ['fireball'], spawnRate: 0.4, fireWalls: true,
            objective: 'score', description: 'Navigate fire walls'
        },
        24: { // PRE-ATMOSPHERE ZONE
            targetScore: 2800, gravity: 0.04, fuelUnlimited: false, heatEnabled: true,
            enemies: [], spawnRate: 0, extremeHeat: true, heatMultiplier: 2.0,
            objective: 'survive', surviveTime: 30, description: 'Extreme heat zone'
        },
        25: { // ATMOSPHERIC BREAK - Final
            targetScore: 3000, gravity: 0.02, fuelUnlimited: true, heatEnabled: true,
            enemies: [], spawnRate: 0, atmosphericBreak: true,
            objective: 'survive', surviveTime: 20, description: 'Break atmosphere!'
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
        
        // Create rocket
        this.createRocket();
        
        // Generate clouds and stars
        this.generateEnvironment();
        
        // Setup controls
        this.setupControls();
        
        // Setup event listeners
        EventBus.on('rocket_shoot', (data) => this.projectiles.push(data.projectile));
        
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
        this.keys = {};
        this.handleKeyDown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','x','enter'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };
        this.handleKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
        document.addEventListener('keydown', this.handleKeyDown, true);
        document.addEventListener('keyup', this.handleKeyUp, true);
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
        
        // Fuel regeneration when not thrusting
        if (!this.rocket.isThrusting && !this.skyConfig.fuelUnlimited) {
            this.rocket.fuel = Math.min(this.rocket.maxFuel, this.rocket.fuel + deltaTime * 3);
        }
    }

    handleRocketInput(deltaTime) {
        if (!this.keys) return;
        const canvas = document.getElementById('gameCanvas');
        const pos = this.rocket.getPosition();
        const speed = 280;
        
        // Horizontal movement
        if (this.keys['a'] === true || this.keys['arrowleft'] === true) {
            this.rocket.setPosition({ x: Math.max(40, pos.x - speed * deltaTime), y: pos.y });
        }
        if (this.keys['d'] === true || this.keys['arrowright'] === true) {
            this.rocket.setPosition({ x: Math.min(canvas.width - 40, pos.x + speed * deltaTime), y: pos.y });
        }
        
        // Thrust (up)
        const canThrust = this.skyConfig.fuelUnlimited || this.rocket.fuel > 0;
        if ((this.keys['w'] === true || this.keys['arrowup'] === true || this.keys[' '] === true) && canThrust) {
            this.rocket.setPosition({ x: pos.x, y: Math.max(80, pos.y - 350 * deltaTime) });
            this.rocket.isThrusting = true;
            if (!this.skyConfig.fuelUnlimited) {
                this.rocket.fuel -= deltaTime * (15 + this.currentLevel * 0.5);
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
            this.rocket.setPosition({ x: pos.x, y: Math.min(canvas.height - 80, pos.y + 180 * deltaTime) });
        }
        
        // Apply gravity
        const newPos = this.rocket.getPosition();
        this.rocket.setPosition({ x: newPos.x, y: Math.min(canvas.height - 80, newPos.y + this.gravity * 200 * deltaTime) });
        
        // Shooting
        if ((this.keys['x'] === true || this.keys['enter'] === true) && this.rocket.canShoot) {
            this.shoot();
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
        
        // Extreme heat zones
        if (this.skyConfig.extremeHeat) {
            this.heat += deltaTime * 8 * multiplier;
        }
        
        // Atmospheric break effect
        if (this.skyConfig.atmosphericBreak) {
            this.heat = 50 + Math.sin(Date.now() / 500) * 30;
        }
        
        // Cool down when not in danger
        if (!this.rocket.isThrusting && !this.skyConfig.extremeHeat) {
            this.heat = Math.max(0, this.heat - deltaTime * 10);
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
        
        const type = enemies[Math.floor(Math.random() * enemies.length)];
        
        if (type === 'debris') {
            this.spawnDebris(canvas);
        } else if (type === 'fireball') {
            this.spawnFireball(canvas);
        } else if (type === 'drone' && this.drones.length < (this.skyConfig.droneCount || 1)) {
            this.spawnDrone(canvas);
        }
    }

    spawnDebris(canvas) {
        const meteor = new Meteor({ size: ['small','medium'][Math.floor(Math.random()*2)], meteorType: 'rock', mass: 300 });
        meteor.setPosition({ x: Math.random() * canvas.width, y: -50 });
        meteor.setVelocity({ x: (Math.random()-0.5) * 80, y: 150 + Math.random() * 100 });
        this.meteors.push(meteor);
    }

    spawnFireball(canvas) {
        const fireball = {
            x: Math.random() * canvas.width,
            y: -30,
            vx: (Math.random() - 0.5) * 100,
            vy: 180 + Math.random() * 120,
            size: 20 + Math.random() * 25,
            isActive: true
        };
        this.fireballs.push(fireball);
    }

    spawnDrone(canvas) {
        const drone = {
            x: Math.random() < 0.5 ? -30 : canvas.width + 30,
            y: 100 + Math.random() * 200,
            vx: 0, vy: 0,
            health: 50,
            shootTimer: 0,
            isActive: true,
            advanced: this.skyConfig.advancedDrones || false
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
            d.x += d.vx * deltaTime;
            
            // Reverse at edges
            if (d.x < 50 || d.x > canvas.width - 50) d.vx *= -1;
            
            // Shooting
            d.shootTimer += deltaTime;
            if (d.shootTimer > 2.0) {
                d.shootTimer = 0;
                // Drone shoots at player
                const dx = rocketPos.x - d.x;
                const dy = rocketPos.y - d.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                this.fireballs.push({
                    x: d.x, y: d.y + 20,
                    vx: (dx/dist) * 200,
                    vy: (dy/dist) * 200,
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
        setTimeout(() => EventBus.emit('level_complete'), 2000);
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
        
        // Heat overlay
        if (this.heat > 30) {
            ctx.fillStyle = `rgba(255,100,0,${(this.heat - 30) / 140})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Atmospheric break effect
        if (this.skyConfig.atmosphericBreak) {
            const flicker = Math.random() * 0.3;
            ctx.fillStyle = `rgba(255,150,50,${0.2 + flicker})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw entities
        this.drawMeteors(ctx);
        this.drawFireballs(ctx);
        this.drawDrones(ctx);
        this.drawProjectiles(ctx);
        
        // Draw rocket
        if (this.rocket && this.rocket.isActive) {
            this.rocket.render(ctx);
        }
        
        // Draw HUD
        this.drawHUD(ctx);
        
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
