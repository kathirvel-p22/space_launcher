/**
 * SpaceScene.js - Space chapter (Levels 26-45)
 * CHAPTER 3: SPACE – Silent Drift
 */

import { Scene } from '../core/Scene.js';
import { Rocket } from '../entities/Rocket.js';
import { Meteor } from '../entities/Meteor.js';
import { Projectile } from '../entities/Projectile.js';
import { EventBus } from '../core/EventBus.js';

export class SpaceScene extends Scene {
    constructor(physicsEngine, levelManager) {
        super(physicsEngine, levelManager);
        this.rocket = null;
        this.meteors = [];
        this.projectiles = [];
        this.enemies = [];
        this.stars = [];
        this.score = 0;
        this.momentum = { x: 0, y: 0 };
        this.rotation = 0;
        this.laserNets = [];
        this.turrets = [];
        this.boostCharges = 3;
        this.lighting = 1.0;
        this.wallMaze = [];
        this.compressionLevel = 1.0;
        this.boss = null;
    }

    static LEVEL_CONFIGS = {
        26: { targetScore: 500, description: 'First Drift', mechanics: { momentum: true } },
        27: { targetScore: 600, description: 'Spin Field', mechanics: { spin: true } },
        28: { targetScore: 700, description: 'Reverse Pulse', mechanics: { gravityFlip: true } },
        29: { targetScore: 800, description: 'Dead Zone', mechanics: { noThrust: true } },
        30: { targetScore: 1000, description: 'Storm Core', mechanics: { chaos: true } },
        31: { targetScore: 1200, description: 'Laser Net', mechanics: { lasers: true } },
        32: { targetScore: 1400, description: 'Shield Drones', mechanics: { shields: true } },
        33: { targetScore: 1600, description: 'Energy Crisis', mechanics: { limitedBoost: true } },
        34: { targetScore: 1800, description: 'Ambush Field', mechanics: { turrets: true } },
        35: { targetScore: 2000, description: 'Orbital Warzone', mechanics: { combat: true } },
        36: { targetScore: 2200, description: 'Dark Dock', mechanics: { dark: true } },
        37: { targetScore: 2400, description: 'Turret Halls', mechanics: { turrets360: true } },
        38: { targetScore: 2600, description: 'Power Blackout', mechanics: { noHUD: true }, objective: 'survive', surviveTime: 30 },
        39: { targetScore: 2800, description: 'Memory Logs', mechanics: { ghosts: true } },
        40: { targetScore: 3000, description: 'Collapse', mechanics: { explode: true }, objective: 'survive', surviveTime: 45 },
        41: { targetScore: 3200, description: 'Hyperspeed', mechanics: { speed2x: true } },
        42: { targetScore: 3400, description: 'Wall Maze', mechanics: { walls: true } },
        43: { targetScore: 3600, description: 'Compression', mechanics: { shrink: true } },
        44: { targetScore: 3800, description: 'Final Gate', mechanics: { timing: true } },
        45: { targetScore: 5000, description: 'SENTINEL AI', mechanics: { boss: true }, objective: 'boss' }
    };

    initialize(levelConfig) {
        super.initialize(levelConfig);
        this.currentLevel = levelConfig.id;
        this.spaceConfig = SpaceScene.LEVEL_CONFIGS[levelConfig.id] || SpaceScene.LEVEL_CONFIGS[26];
        this.targetScore = this.spaceConfig.targetScore;
        this.score = 0;
        this.levelComplete = false;
        this.surviveTimer = 0;
        
        this.createRocket();
        this.generateStars();
        this.setupControls();
        this.initMechanics();
        
        EventBus.on('rocket_shoot', (data) => this.projectiles.push(data.projectile));
        console.log(`[SpaceScene] Level ${this.currentLevel}: ${this.spaceConfig.description}`);
    }

    createRocket() {
        this.rocket = new Rocket({ mass: 300, fuel: 100 });
        const canvas = document.getElementById('gameCanvas');
        if (canvas) this.rocket.setPosition({ x: canvas.width / 2, y: canvas.height / 2 });
        this.rocket.isActive = true;
        this.rocket.canShoot = true;
    }

    generateStars() {
        this.stars = [];
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 1 + Math.random() * 2,
                brightness: Math.random()
            });
        }
    }

    setupControls() {
        this.keys = {};
        this.handleKeyDown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','x','enter','shift'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };
        this.handleKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
        document.addEventListener('keydown', this.handleKeyDown, true);
        document.addEventListener('keyup', this.handleKeyUp, true);
    }

    initMechanics() {
        const m = this.spaceConfig.mechanics || {};
        this.lighting = m.dark ? 0.1 : 1.0;
        this.speedMult = m.speed2x ? 2.0 : 1.0;
        
        if (m.lasers) this.createLasers();
        if (m.turrets || m.turrets360) this.createTurrets();
        if (m.walls) this.createWalls();
        if (m.boss) this.createBoss();
    }

    createLasers() {
        for (let i = 0; i < 4; i++) {
            this.laserNets.push({
                x1: 0, y1: i * 200, x2: 1000, y2: i * 200,
                active: true, timer: i * 0.5
            });
        }
    }

    createTurrets() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        for (let i = 0; i < 6; i++) {
            this.turrets.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                angle: 0, shootTimer: 0, active: true
            });
        }
    }

    createWalls() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        for (let i = 0; i < 5; i++) {
            this.wallMaze.push({
                x: i * 200, y: 100 + i * 100,
                width: 100, height: 20, moving: true, vx: 50
            });
        }
    }

    createBoss() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        this.boss = {
            x: canvas.width / 2, y: 150,
            health: 500, maxHealth: 500,
            phase: 1, pattern: 0,
            shootTimer: 0, moveTimer: 0,
            active: true, learning: []
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (!this.rocket || !this.rocket.isActive || this.levelComplete) return;
        
        const m = this.spaceConfig.mechanics || {};
        
        this.handleInput(deltaTime);
        
        // Momentum system
        if (m.momentum || m.chaos) {
            const pos = this.rocket.getPosition();
            this.rocket.setPosition({
                x: pos.x + this.momentum.x * deltaTime,
                y: pos.y + this.momentum.y * deltaTime
            });
            this.momentum.x *= 0.98;
            this.momentum.y *= 0.98;
        }
        
        // Spin field
        if (m.spin && Math.random() < 0.01) {
            this.momentum.x += (Math.random() - 0.5) * 200;
            this.momentum.y += (Math.random() - 0.5) * 200;
        }
        
        // Compression
        if (m.shrink) {
            this.compressionLevel = Math.max(0.6, this.compressionLevel - 0.01 * deltaTime);
        }
        
        this.rocket.update(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateLasers(deltaTime);
        this.updateTurrets(deltaTime);
        this.updateWalls(deltaTime);
        if (this.boss) this.updateBoss(deltaTime);
        
        this.checkObjectives(deltaTime);
    }

    handleInput(deltaTime) {
        if (!this.keys) return;
        const canvas = document.getElementById('gameCanvas');
        const thrust = 400 * (this.speedMult || 1);
        
        const boost = this.keys['shift'] && this.boostCharges > 0;
        const mult = boost ? 2 : 1;
        
        if (boost && !this.boostUsed) {
            this.boostCharges--;
            this.boostUsed = true;
        }
        if (!this.keys['shift']) this.boostUsed = false;
        
        if (this.keys['w'] || this.keys['arrowup'] || this.keys[' ']) {
            this.momentum.y -= thrust * mult * deltaTime;
            this.rocket.isThrusting = true;
        } else {
            this.rocket.isThrusting = false;
        }
        
        if (this.keys['s'] || this.keys['arrowdown']) this.momentum.y += thrust * mult * deltaTime;
        if (this.keys['a'] || this.keys['arrowleft']) this.momentum.x -= thrust * mult * deltaTime;
        if (this.keys['d'] || this.keys['arrowright']) this.momentum.x += thrust * mult * deltaTime;
        
        this.momentum.x = Math.max(-500, Math.min(500, this.momentum.x));
        this.momentum.y = Math.max(-500, Math.min(500, this.momentum.y));
        
        const pos = this.rocket.getPosition();
        this.rocket.setPosition({
            x: Math.max(40, Math.min(canvas.width - 40, pos.x)),
            y: Math.max(40, Math.min(canvas.height - 40, pos.y))
        });
        
        if ((this.keys['x'] || this.keys['enter']) && this.rocket.canShoot) {
            this.shoot();
        }
    }

    shoot() {
        const pos = this.rocket.getPosition();
        const count = this.currentLevel >= 40 ? 5 : this.currentLevel >= 35 ? 4 : 3;
        for (let i = 0; i < count; i++) {
            const angle = -90 - 15 * (count-1)/2 + i * 15;
            const rad = angle * Math.PI / 180;
            this.projectiles.push(new Projectile({
                x: pos.x, y: pos.y - 60,
                velocityX: Math.cos(rad) * 800,
                velocityY: Math.sin(rad) * 800,
                owner: this.rocket
            }));
        }
        this.rocket.canShoot = false;
        setTimeout(() => { if (this.rocket) this.rocket.canShoot = true; }, 150);
    }

    updateEnemies(deltaTime) {
        if (Math.random() < 0.02 && this.enemies.length < 10) {
            const canvas = document.getElementById('gameCanvas');
            this.enemies.push({
                x: Math.random() * canvas.width,
                y: -30,
                vx: (Math.random() - 0.5) * 100,
                vy: 150,
                health: 30,
                active: true,
                hasShield: this.spaceConfig.mechanics?.shields
            });
        }
        
        this.enemies = this.enemies.filter(e => {
            if (!e.active) return false;
            e.x += e.vx * deltaTime;
            e.y += e.vy * deltaTime;
            
            const rPos = this.rocket.getPosition();
            const dx = e.x - rPos.x;
            const dy = e.y - rPos.y;
            if (Math.sqrt(dx*dx + dy*dy) < 50) {
                e.active = false;
                this.rocket.fuel = Math.max(0, this.rocket.fuel - 20);
                return false;
            }
            
            return e.y < 800;
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
            
            for (const e of this.enemies) {
                if (e.active) {
                    const dx = pos.x - e.x;
                    const dy = pos.y - e.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 30) {
                        if (!e.hasShield || Math.random() < 0.3) {
                            e.health -= 10;
                            if (e.health <= 0) {
                                e.active = false;
                                this.score += 50;
                            }
                        }
                        p.isActive = false;
                        return false;
                    }
                }
            }
            
            if (this.boss && this.boss.active) {
                const dx = pos.x - this.boss.x;
                const dy = pos.y - this.boss.y;
                if (Math.sqrt(dx*dx + dy*dy) < 60) {
                    this.boss.health -= 5;
                    this.score += 10;
                    p.isActive = false;
                    if (this.boss.health <= 0) {
                        this.boss.active = false;
                        this.score += 1000;
                        this.levelComplete = true;
                    }
                    return false;
                }
            }
            
            const pPos = p.getPosition();
            return pPos.y > -50 && pPos.y < canvas.height + 50;
        });
    }

    updateLasers(deltaTime) {
        for (const laser of this.laserNets) {
            laser.timer += deltaTime;
            laser.active = Math.floor(laser.timer) % 2 === 0;
            laser.y1 = 100 + Math.sin(laser.timer) * 50;
            laser.y2 = laser.y1;
        }
    }

    updateTurrets(deltaTime) {
        const rPos = this.rocket.getPosition();
        for (const t of this.turrets) {
            if (!t.active) continue;
            const dx = rPos.x - t.x;
            const dy = rPos.y - t.y;
            t.angle = Math.atan2(dy, dx);
            
            t.shootTimer += deltaTime;
            if (t.shootTimer > 2) {
                t.shootTimer = 0;
                this.enemies.push({
                    x: t.x, y: t.y,
                    vx: Math.cos(t.angle) * 200,
                    vy: Math.sin(t.angle) * 200,
                    health: 10, active: true
                });
            }
        }
    }

    updateWalls(deltaTime) {
        const canvas = document.getElementById('gameCanvas');
        for (const w of this.wallMaze) {
            if (w.moving) {
                w.x += w.vx * deltaTime;
                if (w.x < 0 || w.x > canvas.width) w.vx *= -1;
            }
        }
    }

    updateBoss(deltaTime) {
        if (!this.boss || !this.boss.active) return;
        
        this.boss.moveTimer += deltaTime;
        this.boss.shootTimer += deltaTime;
        
        // Movement pattern
        if (this.boss.moveTimer > 2) {
            this.boss.moveTimer = 0;
            this.boss.pattern = (this.boss.pattern + 1) % 3;
        }
        
        const canvas = document.getElementById('gameCanvas');
        if (this.boss.pattern === 0) {
            this.boss.x += Math.sin(Date.now() / 500) * 200 * deltaTime;
        } else if (this.boss.pattern === 1) {
            this.boss.y += Math.cos(Date.now() / 600) * 100 * deltaTime;
        }
        
        this.boss.x = Math.max(100, Math.min(canvas.width - 100, this.boss.x));
        this.boss.y = Math.max(100, Math.min(300, this.boss.y));
        
        // Shooting
        if (this.boss.shootTimer > 1) {
            this.boss.shootTimer = 0;
            const rPos = this.rocket.getPosition();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                this.enemies.push({
                    x: this.boss.x, y: this.boss.y,
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150,
                    health: 20, active: true
                });
            }
        }
        
        // Phase changes
        if (this.boss.health < this.boss.maxHealth * 0.66 && this.boss.phase === 1) {
            this.boss.phase = 2;
        }
        if (this.boss.health < this.boss.maxHealth * 0.33 && this.boss.phase === 2) {
            this.boss.phase = 3;
        }
    }

    checkObjectives(deltaTime) {
        if (this.levelComplete) return;
        
        const obj = this.spaceConfig.objective;
        if (obj === 'score' && this.score >= this.targetScore) {
            this.completeLevel();
        } else if (obj === 'survive') {
            this.surviveTimer += deltaTime;
            if (this.surviveTimer >= this.spaceConfig.surviveTime) {
                this.completeLevel();
            }
        }
    }

    completeLevel() {
        this.levelComplete = true;
        setTimeout(() => EventBus.emit('level_complete'), 2000);
    }

    render() {
        const ctx = this.physicsEngine.game.context;
        if (!ctx) return;
        const canvas = ctx.canvas;
        
        const m = this.spaceConfig.mechanics || {};
        
        // Apply compression
        if (m.shrink) {
            ctx.save();
            const scale = this.compressionLevel;
            ctx.translate(canvas.width * (1 - scale) / 2, canvas.height * (1 - scale) / 2);
            ctx.scale(scale, scale);
        }
        
        // Background
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Stars
        const brightness = this.lighting;
        for (const s of this.stars) {
            ctx.fillStyle = `rgba(255,255,255,${s.brightness * brightness})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        
        // Lasers
        for (const l of this.laserNets) {
            if (l.active) {
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(l.x1, l.y1);
                ctx.lineTo(l.x2, l.y2);
                ctx.stroke();
            }
        }
        
        // Walls
        for (const w of this.wallMaze) {
            ctx.fillStyle = '#444';
            ctx.fillRect(w.x, w.y, w.width, w.height);
        }
        
        // Turrets
        for (const t of this.turrets) {
            if (!t.active) continue;
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#F00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(t.x + Math.cos(t.angle) * 30, t.y + Math.sin(t.angle) * 30);
            ctx.stroke();
        }
        
        // Enemies
        for (const e of this.enemies) {
            if (!e.active) continue;
            ctx.fillStyle = '#F80';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
            ctx.fill();
            if (e.hasShield) {
                ctx.strokeStyle = '#0FF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(e.x, e.y, 25, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // Boss
        if (this.boss && this.boss.active) {
            ctx.fillStyle = '#A00';
            ctx.beginPath();
            ctx.arc(this.boss.x, this.boss.y, 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#F00';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SENTINEL', this.boss.x, this.boss.y);
            
            // Health bar
            ctx.fillStyle = '#333';
            ctx.fillRect(this.boss.x - 60, this.boss.y - 70, 120, 10);
            ctx.fillStyle = '#0F0';
            ctx.fillRect(this.boss.x - 60, this.boss.y - 70, 120 * (this.boss.health / this.boss.maxHealth), 10);
        }
        
        // Projectiles
        for (const p of this.projectiles) {
            if (p.isActive) p.render(ctx);
        }
        
        // Rocket
        if (this.rocket && this.rocket.isActive) {
            this.rocket.render(ctx);
        }
        
        if (m.shrink) ctx.restore();
        
        // HUD
        this.drawHUD(ctx, canvas);
        
        if (this.levelComplete) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, canvas.height/2 - 60, canvas.width, 120);
            ctx.fillStyle = '#0F0';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE!', canvas.width/2, canvas.height/2);
            ctx.fillStyle = '#FFF';
            ctx.font = '20px Arial';
            ctx.fillText(this.currentLevel < 45 ? 'Advancing...' : 'Entering Moon!', canvas.width/2, canvas.height/2 + 40);
        }
    }

    drawHUD(ctx, canvas) {
        const m = this.spaceConfig.mechanics || {};
        if (m.noHUD) return;
        
        const pad = 15, w = 230, h = 160;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(pad, pad, w, h);
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(pad, pad, w, h);
        
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('CHAPTER 3: SPACE', pad + 12, pad + 22);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '13px Arial';
        ctx.fillText(`Level ${this.currentLevel}/45 - ${this.spaceConfig.description}`, pad + 12, pad + 40);
        
        ctx.fillStyle = '#FF0';
        ctx.font = 'bold 16px Arial';
        const obj = this.spaceConfig.objective;
        if (obj === 'score') {
            ctx.fillText(`SCORE: ${this.score}/${this.targetScore}`, pad + 12, pad + 62);
        } else if (obj === 'survive') {
            const remaining = Math.max(0, this.spaceConfig.surviveTime - this.surviveTimer);
            ctx.fillText(`SURVIVE: ${remaining.toFixed(1)}s`, pad + 12, pad + 62);
        } else if (obj === 'boss') {
            ctx.fillText(`BOSS BATTLE`, pad + 12, pad + 62);
        }
        
        // Boost charges
        if (m.limitedBoost) {
            ctx.fillStyle = '#AAA';
            ctx.font = '12px Arial';
            ctx.fillText(`BOOST: ${'⚡'.repeat(this.boostCharges)}`, pad + 12, pad + 85);
        }
        
        ctx.fillStyle = '#AAA';
        ctx.fillText(`Enemies: ${this.enemies.length}`, pad + 12, pad + 105);
        ctx.fillText(`Momentum: ${Math.floor(Math.sqrt(this.momentum.x**2 + this.momentum.y**2))}`, pad + 12, pad + 125);
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
        ctx.fillStyle = '#FFF';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WASD: Move | Shift: Boost | X: Shoot | ESC: Pause', canvas.width/2, canvas.height - 10);
    }

    cleanup() {
        super.cleanup();
        if (this.handleKeyDown) document.removeEventListener('keydown', this.handleKeyDown, true);
        if (this.handleKeyUp) document.removeEventListener('keyup', this.handleKeyUp, true);
        this.enemies = [];
        this.projectiles = [];
        this.laserNets = [];
        this.turrets = [];
        this.wallMaze = [];
        this.boss = null;
    }
}
