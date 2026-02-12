/**
 * MoonScene.js - Moon chapter (Levels 46-65)
 * CHAPTER 4: MOON – Low Gravity Nightmare
 */

import { Scene } from '../core/Scene.js';
import { Rocket } from '../entities/Rocket.js';
import { Meteor } from '../entities/Meteor.js';
import { Projectile } from '../entities/Projectile.js';
import { EventBus } from '../core/EventBus.js';

export class MoonScene extends Scene {
    constructor(physicsEngine, levelManager) {
        super(physicsEngine, levelManager);
        this.rocket = null;
        this.projectiles = [];
        this.enemies = [];
        this.platforms = [];
        this.score = 0;
        this.gravity = 0.15; // Low gravity!
    }

    static LEVEL_CONFIGS = {
        46: { targetScore: 500, description: 'Crater Hell', mechanics: { lowGravity: true, snipers: true } },
        47: { targetScore: 600, description: 'Falling Platforms', mechanics: { collapsing: true } },
        48: { targetScore: 700, description: 'Sniper Nests', mechanics: { snipers: true } },
        49: { targetScore: 800, description: 'Low Gravity Combat', mechanics: { swarm: true } },
        50: { targetScore: 1000, description: 'Crater Checkpoint', mechanics: { endurance: true } },
        51: { targetScore: 1200, description: 'Hive Entry', mechanics: { swarm: true, poison: true } },
        52: { targetScore: 1400, description: 'Swarm Tunnels', mechanics: { endless: true } },
        53: { targetScore: 1600, description: 'Poison Zones', mechanics: { poison: true } },
        54: { targetScore: 1800, description: 'Dark Tunnels', mechanics: { dark: true } },
        55: { targetScore: 2000, description: 'Hive Core', mechanics: { swarm: true, poison: true } },
        56: { targetScore: 2200, description: 'Gravity Ruins', mechanics: { gravityFlip: true } },
        57: { targetScore: 2400, description: 'Time Distortion', mechanics: { slowTime: true } },
        58: { targetScore: 2600, description: 'Laser Puzzles', mechanics: { puzzles: true } },
        59: { targetScore: 2800, description: 'Ancient Tech', mechanics: { gravityFlip: true, puzzles: true } },
        60: { targetScore: 3000, description: 'Ruins Checkpoint', mechanics: { all: true } },
        61: { targetScore: 3200, description: 'Signal Tower 1', mechanics: { defense: true } },
        62: { targetScore: 3400, description: 'Signal Tower 2', mechanics: { defense: true, waves: true } },
        63: { targetScore: 3600, description: 'Signal Tower 3', mechanics: { defense: true, multiDir: true } },
        64: { targetScore: 3800, description: 'Final Defense', mechanics: { defense: true, extreme: true } },
        65: { targetScore: 5000, description: 'LUNAR OVERMIND', mechanics: { boss: true }, objective: 'boss' }
    };

    initialize(levelConfig) {
        super.initialize(levelConfig);
        this.currentLevel = levelConfig.id;
        this.moonConfig = MoonScene.LEVEL_CONFIGS[levelConfig.id] || MoonScene.LEVEL_CONFIGS[46];
        this.targetScore = this.moonConfig.targetScore;
        this.score = 0;
        this.levelComplete = false;
        
        this.createRocket();
        this.setupControls();
        this.createPlatforms();
        
        if (this.moonConfig.mechanics?.boss) this.createBoss();
        
        EventBus.on('rocket_shoot', (data) => this.projectiles.push(data.projectile));
        console.log(`[MoonScene] Level ${this.currentLevel}: ${this.moonConfig.description}`);
    }

    createRocket() {
        this.rocket = new Rocket({ mass: 300, fuel: 100 });
        const canvas = document.getElementById('gameCanvas');
        if (canvas) this.rocket.setPosition({ x: canvas.width / 2, y: canvas.height - 150 });
        this.rocket.isActive = true;
        this.rocket.canShoot = true;
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

    createPlatforms() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        for (let i = 0; i < 5; i++) {
            this.platforms.push({
                x: i * 200 + 50,
                y: canvas.height - 100 - i * 80,
                width: 150,
                height: 20,
                collapsing: this.moonConfig.mechanics?.collapsing || false,
                timer: 0
            });
        }
    }

    createBoss() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        this.boss = {
            x: canvas.width / 2,
            y: 150,
            health: 600,
            maxHealth: 600,
            active: true,
            phase: 1,
            shootTimer: 0
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (!this.rocket || !this.rocket.isActive || this.levelComplete) return;
        
        this.handleInput(deltaTime);
        
        // Low gravity
        const pos = this.rocket.getPosition();
        this.rocket.setPosition({ x: pos.x, y: pos.y + this.gravity * 200 * deltaTime });
        
        this.rocket.update(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updatePlatforms(deltaTime);
        if (this.boss) this.updateBoss(deltaTime);
        
        this.checkObjectives();
    }

    handleInput(deltaTime) {
        if (!this.keys) return;
        const canvas = document.getElementById('gameCanvas');
        const speed = 300;
        const pos = this.rocket.getPosition();
        
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.rocket.setPosition({ x: Math.max(40, pos.x - speed * deltaTime), y: pos.y });
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.rocket.setPosition({ x: Math.min(canvas.width - 40, pos.x + speed * deltaTime), y: pos.y });
        }
        if (this.keys['w'] || this.keys['arrowup'] || this.keys[' ']) {
            this.rocket.setPosition({ x: pos.x, y: Math.max(40, pos.y - 400 * deltaTime) });
            this.rocket.isThrusting = true;
        } else {
            this.rocket.isThrusting = false;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.rocket.setPosition({ x: pos.x, y: Math.min(canvas.height - 40, pos.y + 200 * deltaTime) });
        }
        
        if ((this.keys['x'] || this.keys['enter']) && this.rocket.canShoot) {
            this.shoot();
        }
    }

    shoot() {
        const pos = this.rocket.getPosition();
        const count = 4;
        for (let i = 0; i < count; i++) {
            const angle = -90 - 20 * (count-1)/2 + i * 20;
            const rad = angle * Math.PI / 180;
            this.projectiles.push(new Projectile({
                x: pos.x, y: pos.y - 60,
                velocityX: Math.cos(rad) * 700,
                velocityY: Math.sin(rad) * 700,
                owner: this.rocket
            }));
        }
        this.rocket.canShoot = false;
        setTimeout(() => { if (this.rocket) this.rocket.canShoot = true; }, 200);
    }

    updateEnemies(deltaTime) {
        if (Math.random() < 0.03 && this.enemies.length < 15) {
            const canvas = document.getElementById('gameCanvas');
            this.enemies.push({
                x: Math.random() * canvas.width,
                y: -30,
                vx: (Math.random() - 0.5) * 80,
                vy: 100,
                health: 20,
                active: true,
                type: this.moonConfig.mechanics?.swarm ? 'swarm' : 'normal'
            });
        }
        
        this.enemies = this.enemies.filter(e => {
            if (!e.active) return false;
            e.x += e.vx * deltaTime;
            e.y += e.vy * deltaTime;
            
            const rPos = this.rocket.getPosition();
            const dx = e.x - rPos.x;
            const dy = e.y - rPos.y;
            if (Math.sqrt(dx*dx + dy*dy) < 40) {
                e.active = false;
                this.rocket.fuel = Math.max(0, this.rocket.fuel - 15);
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
                    if (Math.sqrt(dx*dx + dy*dy) < 25) {
                        e.health -= 10;
                        if (e.health <= 0) {
                            e.active = false;
                            this.score += 40;
                        }
                        p.isActive = false;
                        return false;
                    }
                }
            }
            
            if (this.boss && this.boss.active) {
                const dx = pos.x - this.boss.x;
                const dy = pos.y - this.boss.y;
                if (Math.sqrt(dx*dx + dy*dy) < 70) {
                    this.boss.health -= 5;
                    this.score += 10;
                    p.isActive = false;
                    if (this.boss.health <= 0) {
                        this.boss.active = false;
                        this.score += 2000;
                        this.levelComplete = true;
                    }
                    return false;
                }
            }
            
            const pPos = p.getPosition();
            return pPos.y > -50 && pPos.y < canvas.height + 50;
        });
    }

    updatePlatforms(deltaTime) {
        for (const p of this.platforms) {
            if (p.collapsing) {
                p.timer += deltaTime;
                if (p.timer > 3) p.timer = 0;
            }
        }
    }

    updateBoss(deltaTime) {
        if (!this.boss || !this.boss.active) return;
        
        this.boss.shootTimer += deltaTime;
        this.boss.x += Math.sin(Date.now() / 800) * 150 * deltaTime;
        
        const canvas = document.getElementById('gameCanvas');
        this.boss.x = Math.max(100, Math.min(canvas.width - 100, this.boss.x));
        
        if (this.boss.shootTimer > 1.5) {
            this.boss.shootTimer = 0;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                this.enemies.push({
                    x: this.boss.x, y: this.boss.y,
                    vx: Math.cos(angle) * 120,
                    vy: Math.sin(angle) * 120,
                    health: 15, active: true, type: 'boss'
                });
            }
        }
    }

    checkObjectives() {
        if (this.levelComplete) return;
        
        if (this.moonConfig.objective === 'boss') return;
        
        if (this.score >= this.targetScore) {
            this.levelComplete = true;
            setTimeout(() => EventBus.emit('level_complete'), 2000);
        }
    }

    render() {
        const ctx = this.physicsEngine.game.context;
        if (!ctx) return;
        const canvas = ctx.canvas;
        
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Moon surface
        ctx.fillStyle = '#666';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        // Platforms
        for (const p of this.platforms) {
            const alpha = p.collapsing && p.timer > 2 ? 0.3 : 1.0;
            ctx.fillStyle = `rgba(100,100,100,${alpha})`;
            ctx.fillRect(p.x, p.y, p.width, p.height);
        }
        
        // Enemies
        for (const e of this.enemies) {
            if (!e.active) continue;
            ctx.fillStyle = e.type === 'swarm' ? '#0F0' : '#F80';
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.type === 'swarm' ? 10 : 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Boss
        if (this.boss && this.boss.active) {
            ctx.fillStyle = '#800080';
            ctx.beginPath();
            ctx.arc(this.boss.x, this.boss.y, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('OVERMIND', this.boss.x, this.boss.y);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.boss.x - 70, this.boss.y - 80, 140, 10);
            ctx.fillStyle = '#0F0';
            ctx.fillRect(this.boss.x - 70, this.boss.y - 80, 140 * (this.boss.health / this.boss.maxHealth), 10);
        }
        
        // Projectiles
        for (const p of this.projectiles) {
            if (p.isActive) p.render(ctx);
        }
        
        // Rocket
        if (this.rocket && this.rocket.isActive) {
            this.rocket.render(ctx);
        }
        
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
            ctx.fillText(this.currentLevel < 65 ? 'Advancing...' : 'Entering Mars!', canvas.width/2, canvas.height/2 + 40);
        }
    }

    drawHUD(ctx, canvas) {
        const pad = 15, w = 230, h = 140;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(pad, pad, w, h);
        ctx.strokeStyle = '#9370DB';
        ctx.lineWidth = 2;
        ctx.strokeRect(pad, pad, w, h);
        
        ctx.fillStyle = '#9370DB';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('CHAPTER 4: MOON', pad + 12, pad + 22);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '13px Arial';
        ctx.fillText(`Level ${this.currentLevel}/65 - ${this.moonConfig.description}`, pad + 12, pad + 40);
        
        ctx.fillStyle = '#FF0';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`SCORE: ${this.score}/${this.targetScore}`, pad + 12, pad + 62);
        
        ctx.fillStyle = '#AAA';
        ctx.font = '12px Arial';
        ctx.fillText(`Gravity: LOW (${this.gravity}x)`, pad + 12, pad + 85);
        ctx.fillText(`Enemies: ${this.enemies.length}`, pad + 12, pad + 105);
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
        ctx.fillStyle = '#FFF';
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WASD: Move | X: Shoot | ESC: Pause', canvas.width/2, canvas.height - 10);
    }

    cleanup() {
        super.cleanup();
        if (this.handleKeyDown) document.removeEventListener('keydown', this.handleKeyDown, true);
        if (this.handleKeyUp) document.removeEventListener('keyup', this.handleKeyUp, true);
        this.enemies = [];
        this.projectiles = [];
        this.platforms = [];
        this.boss = null;
    }
}
