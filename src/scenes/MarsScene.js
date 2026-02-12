/**
 * MarsScene.js - Mars chapter (Levels 66-100)
 * CHAPTER 5: MARS – The Red Apocalypse
 */

import { Scene } from '../core/Scene.js';
import { Rocket } from '../entities/Rocket.js';
import { Meteor } from '../entities/Meteor.js';
import { Projectile } from '../entities/Projectile.js';
import { EventBus } from '../core/EventBus.js';

export class MarsScene extends Scene {
    constructor(physicsEngine, levelManager) {
        super(physicsEngine, levelManager);
        this.rocket = null;
        this.projectiles = [];
        this.enemies = [];
        this.score = 0;
        this.dustStorm = 0;
        this.visibility = 1.0;
    }

    static LEVEL_CONFIGS = {
        66: { targetScore: 500, description: 'Dust Invasion', mechanics: { dust: true } },
        67: { targetScore: 600, description: 'Blind Navigation', mechanics: { dust: true, radar: true } },
        68: { targetScore: 700, description: 'Heat Zones', mechanics: { heat: true } },
        69: { targetScore: 800, description: 'Storm Combat', mechanics: { dust: true, combat: true } },
        70: { targetScore: 1000, description: 'Dust Checkpoint', mechanics: { dust: true, extreme: true } },
        71: { targetScore: 1200, description: 'Machine Cities', mechanics: { ai: true } },
        72: { targetScore: 1400, description: 'AI Armies', mechanics: { ai: true, formations: true } },
        73: { targetScore: 1600, description: 'EMP Traps', mechanics: { emp: true } },
        74: { targetScore: 1800, description: 'Building Collapse', mechanics: { collapse: true } },
        75: { targetScore: 2000, description: 'Machine Checkpoint', mechanics: { ai: true, extreme: true } },
        76: { targetScore: 2200, description: 'Terraform Ruins', mechanics: { toxic: true } },
        77: { targetScore: 2400, description: 'Toxic Floods', mechanics: { toxic: true, rising: true } },
        78: { targetScore: 2600, description: 'Melting Floors', mechanics: { melting: true } },
        79: { targetScore: 2800, description: 'Automated Defense', mechanics: { ai: true, toxic: true } },
        80: { targetScore: 3000, description: 'Terraform Checkpoint', mechanics: { all: true } },
        81: { targetScore: 3200, description: 'Core Tunnels', mechanics: { lava: true } },
        82: { targetScore: 3400, description: 'Rising Magma', mechanics: { lava: true, rising: true } },
        83: { targetScore: 3600, description: 'Gravity Shifts', mechanics: { gravityFlip: true } },
        84: { targetScore: 3800, description: 'Platform Decay', mechanics: { decay: true } },
        85: { targetScore: 4000, description: 'Core Checkpoint', mechanics: { lava: true, extreme: true } },
        86: { targetScore: 4200, description: 'Memory Vault', mechanics: { psychological: true } },
        87: { targetScore: 4400, description: 'Reverse Controls', mechanics: { reverse: true } },
        88: { targetScore: 4600, description: 'Fake Enemies', mechanics: { illusions: true } },
        89: { targetScore: 4800, description: 'Time Loops', mechanics: { timeLoop: true } },
        90: { targetScore: 5000, description: 'Vault Checkpoint', mechanics: { psychological: true, extreme: true } },
        91: { targetScore: 5200, description: 'Planet Collapse', mechanics: { collapse: true, noSaves: true } },
        92: { targetScore: 5400, description: 'Chain Explosions', mechanics: { explosions: true } },
        93: { targetScore: 5600, description: 'Timed Routes', mechanics: { timed: true } },
        94: { targetScore: 5800, description: 'Escape Sequence', mechanics: { escape: true } },
        95: { targetScore: 6000, description: 'Final Descent 1', mechanics: { noHUD: true, extreme: true } },
        96: { targetScore: 6200, description: 'Final Descent 2', mechanics: { noHUD: true, noCheckpoints: true } },
        97: { targetScore: 6400, description: 'Final Descent 3', mechanics: { maxDifficulty: true } },
        98: { targetScore: 6600, description: 'Final Descent 4', mechanics: { allEnemies: true } },
        99: { targetScore: 6800, description: 'Last Hope', mechanics: { ultimate: true } },
        100: { targetScore: 10000, description: 'CORE SINGULARITY', mechanics: { finalBoss: true }, objective: 'boss' }
    };

    initialize(levelConfig) {
        super.initialize(levelConfig);
        this.currentLevel = levelConfig.id;
        this.marsConfig = MarsScene.LEVEL_CONFIGS[levelConfig.id] || MarsScene.LEVEL_CONFIGS[66];
        this.targetScore = this.marsConfig.targetScore;
        this.score = 0;
        this.levelComplete = false;
        
        this.createRocket();
        this.setupControls();
        
        if (this.marsConfig.mechanics?.finalBoss) this.createFinalBoss();
        
        EventBus.on('rocket_shoot', (data) => this.projectiles.push(data.projectile));
        console.log(`[MarsScene] Level ${this.currentLevel}: ${this.marsConfig.description}`);
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

    createFinalBoss() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        this.boss = {
            x: canvas.width / 2,
            y: 150,
            health: 1000,
            maxHealth: 1000,
            active: true,
            phase: 1,
            shootTimer: 0,
            pattern: 0,
            learningData: []
        };
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (!this.rocket || !this.rocket.isActive || this.levelComplete) return;
        
        const m = this.marsConfig.mechanics || {};
        
        // Dust storm
        if (m.dust) {
            this.dustStorm += deltaTime * 0.5;
            this.visibility = 0.3 + Math.sin(this.dustStorm) * 0.3;
        }
        
        this.handleInput(deltaTime, m);
        
        this.rocket.update(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateProjectiles(deltaTime);
        if (this.boss) this.updateFinalBoss(deltaTime);
        
        this.checkObjectives();
    }

    handleInput(deltaTime, mechanics) {
        if (!this.keys) return;
        const canvas = document.getElementById('gameCanvas');
        const speed = 350;
        const pos = this.rocket.getPosition();
        
        // Reverse controls mechanic
        const reverse = mechanics.reverse ? -1 : 1;
        
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.rocket.setPosition({ x: Math.max(40, pos.x - speed * reverse * deltaTime), y: pos.y });
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.rocket.setPosition({ x: Math.min(canvas.width - 40, pos.x + speed * reverse * deltaTime), y: pos.y });
        }
        if (this.keys['w'] || this.keys['arrowup'] || this.keys[' ']) {
            this.rocket.setPosition({ x: pos.x, y: Math.max(40, pos.y - 450 * reverse * deltaTime) });
            this.rocket.isThrusting = true;
        } else {
            this.rocket.isThrusting = false;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.rocket.setPosition({ x: pos.x, y: Math.min(canvas.height - 40, pos.y + 250 * reverse * deltaTime) });
        }
        
        if ((this.keys['x'] || this.keys['enter']) && this.rocket.canShoot) {
            this.shoot();
        }
    }

    shoot() {
        const pos = this.rocket.getPosition();
        const count = 5;
        for (let i = 0; i < count; i++) {
            const angle = -90 - 25 * (count-1)/2 + i * 25;
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
        const spawnRate = this.marsConfig.mechanics?.allEnemies ? 0.05 : 0.02;
        if (Math.random() < spawnRate && this.enemies.length < 20) {
            const canvas = document.getElementById('gameCanvas');
            this.enemies.push({
                x: Math.random() * canvas.width,
                y: -30,
                vx: (Math.random() - 0.5) * 120,
                vy: 180,
                health: 25,
                active: true,
                type: this.marsConfig.mechanics?.ai ? 'ai' : 'normal'
            });
        }
        
        this.enemies = this.enemies.filter(e => {
            if (!e.active) return false;
            e.x += e.vx * deltaTime;
            e.y += e.vy * deltaTime;
            
            const rPos = this.rocket.getPosition();
            const dx = e.x - rPos.x;
            const dy = e.y - rPos.y;
            if (Math.sqrt(dx*dx + dy*dy) < 45) {
                e.active = false;
                this.rocket.fuel = Math.max(0, this.rocket.fuel - 20);
                return false;
            }
            
            return e.y < 900;
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
                        e.health -= 10;
                        if (e.health <= 0) {
                            e.active = false;
                            this.score += 50;
                        }
                        p.isActive = false;
                        return false;
                    }
                }
            }
            
            if (this.boss && this.boss.active) {
                const dx = pos.x - this.boss.x;
                const dy = pos.y - this.boss.y;
                if (Math.sqrt(dx*dx + dy*dy) < 80) {
                    this.boss.health -= 3;
                    this.score += 15;
                    p.isActive = false;
                    if (this.boss.health <= 0) {
                        this.boss.active = false;
                        this.score += 5000;
                        this.showEnding();
                    }
                    return false;
                }
            }
            
            const pPos = p.getPosition();
            return pPos.y > -50 && pPos.y < canvas.height + 50;
        });
    }

    updateFinalBoss(deltaTime) {
        if (!this.boss || !this.boss.active) return;
        
        this.boss.shootTimer += deltaTime;
        
        // Multi-phase behavior
        if (this.boss.health < this.boss.maxHealth * 0.66 && this.boss.phase === 1) {
            this.boss.phase = 2;
            console.log('[MarsScene] Boss Phase 2!');
        }
        if (this.boss.health < this.boss.maxHealth * 0.33 && this.boss.phase === 2) {
            this.boss.phase = 3;
            console.log('[MarsScene] Boss Phase 3 - FINAL!');
        }
        
        // Movement
        const canvas = document.getElementById('gameCanvas');
        this.boss.x += Math.sin(Date.now() / 600) * 200 * deltaTime;
        this.boss.y += Math.cos(Date.now() / 800) * 80 * deltaTime;
        this.boss.x = Math.max(100, Math.min(canvas.width - 100, this.boss.x));
        this.boss.y = Math.max(100, Math.min(300, this.boss.y));
        
        // Attack patterns
        const shootInterval = this.boss.phase === 3 ? 0.5 : this.boss.phase === 2 ? 0.8 : 1.2;
        if (this.boss.shootTimer > shootInterval) {
            this.boss.shootTimer = 0;
            const bulletCount = this.boss.phase * 8;
            for (let i = 0; i < bulletCount; i++) {
                const angle = (i / bulletCount) * Math.PI * 2 + Date.now() / 1000;
                this.enemies.push({
                    x: this.boss.x, y: this.boss.y,
                    vx: Math.cos(angle) * 180,
                    vy: Math.sin(angle) * 180,
                    health: 20, active: true, type: 'boss'
                });
            }
        }
    }

    showEnding() {
        this.levelComplete = true;
        setTimeout(() => {
            const ctx = this.physicsEngine.game.context;
            if (!ctx) return;
            const canvas = ctx.canvas;
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎉 VICTORY! 🎉', canvas.width/2, canvas.height/2 - 100);
            
            ctx.fillStyle = '#FFF';
            ctx.font = '28px Arial';
            ctx.fillText('You completed all 100 levels!', canvas.width/2, canvas.height/2 - 40);
            
            ctx.fillStyle = '#0F0';
            ctx.font = '20px Arial';
            ctx.fillText('Earth → Sky → Space → Moon → Mars', canvas.width/2, canvas.height/2 + 10);
            
            ctx.fillStyle = '#AAA';
            ctx.font = '16px Arial';
            ctx.fillText('The Core Singularity has been defeated.', canvas.width/2, canvas.height/2 + 60);
            ctx.fillText('The solar system is saved!', canvas.width/2, canvas.height/2 + 85);
            
            ctx.fillStyle = '#888';
            ctx.font = '14px Arial';
            ctx.fillText('Press F5 to play again', canvas.width/2, canvas.height/2 + 130);
        }, 3000);
    }

    checkObjectives() {
        if (this.levelComplete) return;
        
        if (this.marsConfig.objective === 'boss') return;
        
        if (this.score >= this.targetScore) {
            this.levelComplete = true;
            setTimeout(() => EventBus.emit('level_complete'), 2000);
        }
    }

    render() {
        const ctx = this.physicsEngine.game.context;
        if (!ctx) return;
        const canvas = ctx.canvas;
        
        const m = this.marsConfig.mechanics || {};
        
        // Background
        ctx.fillStyle = '#4a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dust storm overlay
        if (m.dust) {
            ctx.fillStyle = `rgba(139,69,19,${1 - this.visibility})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Mars surface
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
        
        // Enemies
        for (const e of this.enemies) {
            if (!e.active) continue;
            ctx.fillStyle = e.type === 'ai' ? '#00F' : e.type === 'boss' ? '#F0F' : '#F00';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 18, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Final Boss
        if (this.boss && this.boss.active) {
            const phaseColor = this.boss.phase === 3 ? '#FF0000' : this.boss.phase === 2 ? '#FF8800' : '#AA0000';
            ctx.fillStyle = phaseColor;
            ctx.beginPath();
            ctx.arc(this.boss.x, this.boss.y, 70, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CORE', this.boss.x, this.boss.y - 5);
            ctx.fillText('SINGULARITY', this.boss.x, this.boss.y + 12);
            ctx.font = '12px Arial';
            ctx.fillText(`PHASE ${this.boss.phase}`, this.boss.x, this.boss.y + 30);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.boss.x - 80, this.boss.y - 90, 160, 12);
            ctx.fillStyle = '#0F0';
            ctx.fillRect(this.boss.x - 80, this.boss.y - 90, 160 * (this.boss.health / this.boss.maxHealth), 12);
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
        if (!m.noHUD) this.drawHUD(ctx, canvas);
        
        if (this.levelComplete && !this.boss) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, canvas.height/2 - 60, canvas.width, 120);
            ctx.fillStyle = '#0F0';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE!', canvas.width/2, canvas.height/2);
            ctx.fillStyle = '#FFF';
            ctx.font = '20px Arial';
            ctx.fillText('Advancing...', canvas.width/2, canvas.height/2 + 40);
        }
    }

    drawHUD(ctx, canvas) {
        const pad = 15, w = 230, h = 140;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(pad, pad, w, h);
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 2;
        ctx.strokeRect(pad, pad, w, h);
        
        ctx.fillStyle = '#FF4500';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('CHAPTER 5: MARS', pad + 12, pad + 22);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '13px Arial';
        ctx.fillText(`Level ${this.currentLevel}/100 - ${this.marsConfig.description}`, pad + 12, pad + 40);
        
        ctx.fillStyle = '#FF0';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`SCORE: ${this.score}/${this.targetScore}`, pad + 12, pad + 62);
        
        ctx.fillStyle = '#AAA';
        ctx.font = '12px Arial';
        ctx.fillText(`Visibility: ${Math.floor(this.visibility * 100)}%`, pad + 12, pad + 85);
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
        this.boss = null;
    }
}
