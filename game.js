import Phaser from 'phaser';
import { Fighter } from './entities.js';
import { AudioManager } from './audio.js';
import { createCharacterSelectUI, showFinalVerdictScreen } from './ui.js';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init() {
        this.gameState = 'menu'; // 'menu' | 'character_select' | 'fight' | 'verdict'
        this.fighters = [];
        this.floorY = 920; 
        this.comboMeterGain = 12; 
        this.roundTimerValue = 99;
        this.timerEvent = null;
    }

    preload() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        const loadingText = this.add.text(width / 2, height / 2 - 60, 'LOADING CONSTITUTIONAL EVIDENCE...', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#fde047'
        }).setOrigin(0.5);

        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x18181b, 0.8);
        progressBox.lineStyle(4, 0xeab308, 1);
        progressBox.fillRoundedRect(width / 2 - 400, height / 2 - 25, 800, 50, 6);
        progressBox.strokeRoundedRect(width / 2 - 400, height / 2 - 25, 800, 50, 6);

        const progressBar = this.add.graphics();
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xeab308, 1);
            progressBar.fillRoundedRect(width / 2 - 390, height / 2 - 15, 780 * value, 30, 4);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // Fixed Local Asset Directories
        this.load.image('courtroom-bg', 'assets/courtroom-bg.png');

        this.audioManager = new AudioManager(this);
        this.audioManager.preload();
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Draw the background
        this.background = this.add.image(width / 2, height / 2, 'courtroom-bg');
        this.background.setDisplaySize(width, height);

        // 2. Setup audio systems
        this.audioManager.init();

        // 3. Setup global physics bounds for fighters
        this.physics.world.setBounds(0, 0, width, this.floorY);

        // 4. Initialize the Main Menu UI layout
        this.createMainMenu();
    }

    createMainMenu() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.menuContainer = this.add.container(0, 0);

        const titleText = this.add.text(width / 2, height / 3, 'SUPREME SHOWDOWN\nCONSTITUTIONAL COMBAT', {
            fontFamily: '"Press Start 2P"',
            fontSize: '48px',
            fill: '#eab308',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);
        this.menuContainer.add(titleText);

        const startBtn = this.add.rectangle(width / 2, height / 2 + 100, 400, 80, 0xeab308).setInteractive({ useHandCursor: true });
        const startText = this.add.text(width / 2, height / 2 + 100, 'START MATCH', {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#18181b'
        }).setOrigin(0.5);
        
        this.menuContainer.add(startBtn);
        this.menuContainer.add(startText);

        startBtn.on('pointerover', () => startBtn.setFillStyle(0xf59e0b));
        startBtn.on('pointerout', () => startBtn.setFillStyle(0xeab308));
        
        startBtn.on('pointerdown', () => {
            this.playSFX('gavel-hit');
            this.menuContainer.destroy();
            this.gameState = 'character_select';
            
            createCharacterSelectUI(this, (p1Choice, p2Choice, vsAI) => {
                this.startFight(p1Choice, p2Choice, vsAI);
            });
        });
    }

    startFight(p1Id, p2Id, vsAI) {
        const width = this.scale.width;
        this.gameState = 'fight';

        // Instantiate Fighters
        this.player1 = new Fighter(this, width * 0.25, this.floorY, p1Id, false, false);
        this.player2 = new Fighter(this, width * 0.75, this.floorY, p2Id, true, vsAI);

        this.fighters = [this.player1, this.player2];
        this.add.existing(this.player1);
        this.add.existing(this.player2);

        // Turn on physics gravity mapping
        this.player1.physicsInit(this.floorY);
        this.player2.physicsInit(this.floorY);

        // UI HUD Setup
        this.setupBattleHUD();

        // Music Start
        this.audioManager.playMusic();

        // Round Timer Clock Setup
        this.roundTimerValue = 99;
        if (this.timerEvent) this.timerEvent.destroy();
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateRoundTimer,
            callbackScope: this,
            loop: true
        });
    }

    setupBattleHUD() {
        const width = this.scale.width;
        this.hudContainer = this.add.container(0, 0);

        // Timer Panel
        this.timerText = this.add.text(width / 2, 70, '99', {
            fontFamily: '"Press Start 2P"',
            fontSize: '42px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.hudContainer.add(this.timerText);

        // Name plates
        const p1Name = this.add.text(100, 50, this.player1.charName.toUpperCase(), { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#60a5fa' });
        const p2Name = this.add.text(width - 100, 50, this.player2.charName.toUpperCase(), { fontFamily: '"Press Start 2P"', fontSize: '24px', fill: '#ef4444' }).setOrigin(1, 0);
        
        this.hudContainer.add([p1Name, p2Name]);

        // Health Bars & Meters Draw Vectors
        this.hudGraphics = this.add.graphics();
        this.hudContainer.add(this.hudGraphics);
        this.updateHUDGraphics();
    }

    updateHUDGraphics() {
        if (!this.hudGraphics || this.gameState !== 'fight') return;
        this.hudGraphics.clear();
        const width = this.scale.width;

        // Player 1 Health Bar (Left)
        this.hudGraphics.fillStyle(0x3f3f46, 1);
        this.hudGraphics.fillRect(100, 90, 600, 35);
        const p1HealthWidth = 600 * (Math.max(0, this.player1.health) / this.player1.maxHealth);
        this.hudGraphics.fillStyle(0x22c55e, 1);
        this.hudGraphics.fillRect(100, 90, p1HealthWidth, 35);

        // Player 1 Super Meter
        this.hudGraphics.fillStyle(0x3f3f46, 1);
        this.hudGraphics.fillRect(100, 135, 400, 15);
        const p1MeterWidth = 400 * (this.player1.superMeter / 100);
        this.hudGraphics.fillStyle(0x3b82f6, 1);
        this.hudGraphics.fillRect(100, 135, p1MeterWidth, 15);

        // Player 2 Health Bar (Right)
        this.hudGraphics.fillStyle(0x3f3f46, 1);
        this.hudGraphics.fillRect(width - 700, 90, 600, 35);
        const p2HealthWidth = 600 * (Math.max(0, this.player2.health) / this.player2.maxHealth);
        this.hudGraphics.fillStyle(0x22c55e, 1);
        this.hudGraphics.fillRect(width - 700 + (600 - p2HealthWidth), 90, p2HealthWidth, 35);

        // Player 2 Super Meter
        this.hudGraphics.fillStyle(0x3f3f46, 1);
        this.hudGraphics.fillRect(width - 500, 135, 400, 15);
        const p2MeterWidth = 400 * (this.player2.superMeter / 100);
        this.hudGraphics.fillStyle(0xef4444, 1);
        this.hudGraphics.fillRect(width - 500 + (400 - p2MeterWidth), 135, p2MeterWidth, 15);
    }

    updateRoundTimer() {
        if (this.gameState !== 'fight') return;
        this.roundTimerValue--;
        if (this.timerText) this.timerText.setText(this.roundTimerValue.toString());

        if (this.roundTimerValue <= 0) {
            this.roundTimerValue = 0;
            // Force judgment criteria if timer hits zero
            if (this.player1.health === this.player2.health) {
                this.player1.health = 0; 
            } else if (this.player1.health < this.player2.health) {
                this.player1.health = 0;
            } else {
                this.player2.health = 0;
            }
            this.checkVictoryCondition();
        }
    }

    playSFX(key) {
        this.audioManager.playSFX(key);
    }

    showPopupText(x, y, message, color) {
        const txt = this.add.text(x, y, message, {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 120,
            alpha: 0,
            duration: 1000,
            onComplete: () => txt.destroy()
        });
    }

    checkVictoryCondition() {
        if (this.player1.health <= 0 || this.player2.health <= 0) {
            this.gameState = 'verdict';

            const winner = this.player1.health > 0 ? this.player1 : this.player2;
            const loser = winner === this.player1 ? this.player2 : this.player1;

            this.audioManager.stopMusic();
            this.playSFX('cheer-applause');

            this.fighters.forEach(f => {
                if (f.body) {
                    f.body.setVelocity(0, 0);
                    f.body.setAllowGravity(false);
                }
            });

            if (this.timerEvent) this.timerEvent.destroy();

            this.time.delayedCall(1200, () => {
                showFinalVerdictScreen(this, 
                    { id: winner.characterId, name: winner.charName },
                    { id: loser.characterId, name: loser.charName },
                    () => {
                        this.restartBattle();
                    }
                );
            });
        }
    }

    restartBattle() {
        if (this.timerEvent) this.timerEvent.destroy();
        
        this.fighters.forEach(f => {
            f.disableAttackHitbox();
            f.destroy();
        });
        
        if (this.hudContainer) this.hudContainer.destroy();
        this.fighters = [];
        this.init();
        this.createMainMenu();
    }

    update() {
        if (this.gameState !== 'fight') return;

        // Perform combat positioning and state calculations
        this.player1.update(this.player2);
        this.player2.update(this.player1);

        // Real-time hitbox overlap intersections
        if (this.player1.attackHitbox && this.player1.attackHitbox.body.enabled) {
            this.physics.overlap(this.player1.attackHitbox, this.player2, () => {
                this.player2.takeDamage(10, this.player1.attackHitboxReason);
                this.player1.disableAttackHitbox();
                this.player1.superMeter = Math.min(100, this.player1.superMeter + this.comboMeterGain);
                this.updateHUDGraphics();
                this.checkVictoryCondition();
            });
        }

        if (this.player2.attackHitbox && this.player2.attackHitbox.body.enabled) {
            this.physics.overlap(this.player2.attackHitbox, this.player1, () => {
                this.player1.takeDamage(10, this.player2.attackHitboxReason);
                this.player2.disableAttackHitbox();
                this.player2.superMeter = Math.min(100, this.player2.superMeter + this.comboMeterGain);
                this.updateHUDGraphics();
                this.checkVictoryCondition();
            });
        }

        this.updateHUDGraphics();
    }
}
