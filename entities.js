import Phaser from 'phaser';
import { Fighter } from './entities.js';
import { AudioManager } from './audio.js';
import { createCharacterSelectUI, showFinalVerdictScreen } from './ui.js';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init() {
        this.gameState = 'menu'; 
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

        this.load.image('courtroom-bg', 'assets/courtroom-bg.webp');
        this.audioManager = new AudioManager(this);
        this.audioManager.preload();
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.audioManager.init();

        this.bg = this.add.image(width / 2, height / 2, 'courtroom-bg');
        this.bg.setDisplaySize(width, height);

        this.createCourtroomProps();
        this.createJudicialGallery();
        this.createMainMenu();

        this.input.once('pointerdown', () => {
            this.audioManager.playMusic();
        });

        this.input.keyboard.on('keydown-M', () => {
            this.toggleMute();
        });
    }

    createCourtroomProps() {
        const width = this.scale.width;
        
        // Polished marble floor reflection overlay
        this.add.rectangle(width / 2, this.floorY + 80, width, 160, 0x1e1b4b, 0.12);
        
        // Static ground physics line 
        this.ground = this.add.rectangle(width / 2, this.floorY + 15, width, 30, 0x000000, 0);
        this.physics.add.existing(this.ground, true);
    }

    createJudicialGallery() {
        const width = this.scale.width;
        this.galleryJudges = [];
        const benchXStart = width / 2 - 320;

        for (let i = 0; i < 7; i++) {
            const jx = benchXStart + (i * 110);
            const jy = 515;
            const judgeContainer = this.add.container(jx, jy);
            
            const body = this.add.graphics().fillStyle(0x111827, 1).fillRoundedRect(-25, 0, 50, 60, 6);
            const head = this.add.graphics().fillStyle(0xfde047, 1).fillCircle(0, -15, 16);
            judgeContainer.add([body, head]);

            this.add.existing(judgeContainer);
            this.galleryJudges.push(judgeContainer);
        }
    }

    createMainMenu() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.menuContainer = this.add.container(width / 2, height / 2);

        const logoBack = this.add.rectangle(0, -220, 950, 150, 0x18181b, 0.9).setStrokeStyle(6, 0xeab308);
        const titleText = this.add.text(0, -250, 'SUPREME SHOWDOWN', {
            fontFamily: '"Press Start 2P"', fontSize: '54px', fill: '#fde047', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);

        this.menuContainer.add([logoBack, titleText]);

        const startBtn = this.add.rectangle(0, 40, 380, 70, 0x16a34a).setStrokeStyle(4, 0xffffff).setInteractive();
        const startText = this.add.text(0, 40, 'START GAME', {
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#ffffff'
        }).setOrigin(0.5);
        this.menuContainer.add([startBtn, startText]);

        startBtn.on('pointerdown', () => {
            this.playSFX('gavel-hit');
            this.transitionToCharacterSelect();
        });
    }

    transitionToCharacterSelect() {
        this.menuContainer.destroy();
        this.gameState = 'character_select';
        
        createCharacterSelectUI(this, (p1Id, p2Id, vsAI) => {
            this.startFight(p1Id, p2Id, vsAI);
        });
    }

    startFight(p1Id, p2Id, vsAI) {
        const width = this.scale.width;
        this.gameState = 'fight';

        // Instantiate both Fighters safely inside screen boundaries
        this.player1 = new Fighter(this, width * 0.25, this.floorY, p1Id, false, false);
        this.player2 = new Fighter(this, width * 0.75, this.floorY, p2Id, true, vsAI);
        
        this.fighters = [this.player1, this.player2];

        // ADD PHYSICS COLLIDERS TO PREVENT FALLING THROUGH FLOOR
        this.physics.add.collider(this.player1, this.ground);
        this.physics.add.collider(this.player2, this.ground);
        this.physics.add.collider(this.player1, this.player2);

        this.setupControls();
        this.createHUD();
        this.announceRoundStart();
    }

    setupControls() {
        const keyboard = this.input.keyboard;
        this.keysP1 = {
            left: keyboard.addKey('A'), right: keyboard.addKey('D'),
            down: keyboard.addKey('S'), jump: keyboard.addKey('W'),
            attack: keyboard.addKey('J'), super: keyboard.addKey('SPACE')
        };
        this.keysP2 = {
            left: keyboard.addKey('LEFT'), right: keyboard.addKey('RIGHT'),
            down: keyboard.addKey('DOWN'), jump: keyboard.addKey('UP'),
            attack: keyboard.addKey('ONE'), super: keyboard.addKey('ZERO')
        };
    }

    createHUD() {
        const width = this.scale.width;
        this.hudContainer = this.add.container(0, 0);

        // Player 1 Health background bar
        this.add.rectangle(138, 43, 600, 34, 0x18181b).setOrigin(0, 0);
        this.h1Bar = this.add.rectangle(141, 46, 594, 28, 0x22c55e).setOrigin(0, 0);

        // Player 2 Health background bar
        this.add.rectangle(width - 738, 43, 600, 34, 0x18181b).setOrigin(0, 0);
        this.h2Bar = this.add.rectangle(width - 735, 46, 594, 28, 0x22c55e).setOrigin(0, 0);

        // Timer text layout
        this.timerText = this.add.text(width / 2, 60, '99', {
            fontFamily: '"Press Start 2P"', fontSize: '40px', fill: '#ffffff'
        }).setOrigin(0.5);

        this.hudContainer.add([this.h1Bar, this.h2Bar, this.timerText]);

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.roundTimerValue > 0 && this.gameState === 'fight') {
                    this.roundTimerValue--;
                    this.timerText.setText(this.roundTimerValue.toString());
                    if (this.roundTimerValue === 0) this.checkVictoryCondition();
                }
            },
            loop: true
        });
    }

    announceRoundStart() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        const text = this.add.text(width / 2, height / 2, 'ROUND 1... FIGHT!', {
            fontFamily: '"Press Start 2P"', fontSize: '48px', fill: '#ef4444'
        }).setOrigin(0.5);

        this.time.delayedCall(1500, () => text.destroy());
    }

    showPopupText(x, y, text, color) {
        const popup = this.add.text(x, y, text, {
            fontFamily: '"Press Start 2P"', fontSize: '18px', fill: color, stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: popup, y: y - 50, alpha: 0, duration: 800, onComplete: () => popup.destroy()
        });
    }

    playSFX(key) {
        this.audioManager.sounds[key]?.play();
    }

    cheerSpectators() {
        this.playSFX('cheer-applause');
    }

    toggleMute() {
        this.audioManager.toggleMute();
    }

    update() {
        if (this.gameState !== 'fight') return;

        this.player1.update();
        this.player2.update();

        // Player 1 Movement handling
        if (this.keysP1.left.isDown) this.player1.move(-1);
        else if (this.keysP1.right.isDown) this.player1.move(1);
        else this.player1.move(0);

        if (Phaser.Input.Keyboard.JustDown(this.keysP1.jump)) this.player1.jump();
        if (Phaser.Input.Keyboard.JustDown(this.keysP1.attack)) this.player1.triggerAttack();
        if (this.keysP1.down.isDown) this.player1.triggerSpecialShield();
        if (Phaser.Input.Keyboard.JustDown(this.keysP1.super)) this.player1.triggerSuperMove();

        // Player 2 Movement handling (or simple AI simulation)
        if (this.player2.isAI) {
            this.handleAI();
        } else {
            if (this.keysP2.left.isDown) this.player2.move(-1);
            else if (this.keysP2.right.isDown) this.player2.move(1);
            else this.player2.move(0);

            if (Phaser.Input.Keyboard.JustDown(this.keysP2.jump)) this.player2.jump();
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.attack)) this.player2.triggerAttack();
            if (this.keysP2.down.isDown) this.player2.triggerSpecialShield();
            if (Phaser.Input.Keyboard.JustDown(this.keysP2.super)) this.player2.triggerSuperMove();
        }

        this.checkAttackOverlaps();
        this.updateHUD();
    }

    handleAI() {
        const dist = Math.abs(this.player1.x - this.player2.x);
        if (dist > 150) {
            const dir = this.player1.x < this.player2.x ? -1 : 1;
            this.player2.move(dir);
        } else {
            this.player2.move(0);
            if (Math.random() < 0.05) this.player2.triggerAttack();
        }
    }

    checkAttackOverlaps() {
        if (this.player1.isAttacking && this.physics.overlap(this.player1.attackHitbox, this.player2)) {
            this.player2.takeDamage(this.player1.damageNormal);
            this.player1.superMeter = Math.min(100, this.player1.superMeter + this.comboMeterGain);
            this.player1.disableAttackHitbox();
        }
        if (this.player2.isAttacking && this.physics.overlap(this.player2.attackHitbox, this.player1)) {
            this.player1.takeDamage(this.player2.damageNormal);
            this.player2.superMeter = Math.min(100, this.player2.superMeter + this.comboMeterGain);
            this.player2.disableAttackHitbox();
        }
    }

    updateHUD() {
        const width = this.scale.width;
        const p1HWidth = (this.player1.health / this.player1.maxHealth) * 594;
        this.h1Bar.width = p1HWidth;

        const p2HWidth = (this.player2.health / this.player2.maxHealth) * 594;
        this.h2Bar.width = p2HWidth;
        this.h2Bar.x = width - 138 - p2HWidth;
        
        if (this.player1.health <= 0 || this.player2.health <= 0) {
            this.checkVictoryCondition();
        }
    }

    checkVictoryCondition() {
        this.gameState = 'verdict';
        const winner = this.player1.health > 0 ? this.player1 : this.player2;
        const loser = winner === this.player1 ? this.player2 : this.player1;

        this.time.delayedCall(1000, () => {
            showFinalVerdictScreen(this, 
                { id: winner.characterId, name: winner.charName },
                { id: loser.characterId, name: loser.charName },
                () => this.restartBattle()
            );
        });
    }

    restartBattle() {
        this.scene.restart();
    }
}
