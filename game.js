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
        this.audioManager = null;

        this.keysP1 = null;
        this.keysP2 = null;
        this.hudGraphics = null;
        this.hudContainer = null;
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

        // Background image files are optional. Use generated visual styling instead.
        this.audioManager = new AudioManager(this);
        this.audioManager.preload();
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.audioManager.init();

        this.createProceduralBackground();
        this.createCourtroomProps();
        this.createJudicialGallery();
        this.createMainMenu();

        this.musicHintText = this.add.text(width / 2, height - 40, 'CLICK ANYWHERE TO ENABLE AUDIO', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#facc15'
        }).setOrigin(0.5).setDepth(20);

        this.input.once('pointerdown', () => {
            this.audioManager.playMusic();
            if (this.musicHintText) {
                this.musicHintText.destroy();
                this.musicHintText = null;
            }
        });

        this.input.keyboard.on('keydown-M', () => {
            this.toggleMute();
        });
    }

    createProceduralBackground() {
        const width = this.scale.width;
        const height = this.scale.height;

        const base = this.add.graphics();
        base.fillStyle(0x101018, 1);
        base.fillRect(0, 0, width, height);

        const glow1 = this.add.graphics();
        glow1.fillStyle(0xf59e0b, 0.08);
        glow1.fillEllipse(width * 0.3, height * 0.18, 520, 220);

        const glow2 = this.add.graphics();
        glow2.fillStyle(0x7c3aed, 0.06);
        glow2.fillEllipse(width * 0.75, height * 0.12, 500, 200);

        const stripe = this.add.graphics();
        stripe.fillStyle(0x273147, 0.15);
        const stripeWidth = 80;
        for (let x = 0; x < width; x += stripeWidth * 2) {
            stripe.fillRect(x, 0, stripeWidth, height);
        }

        const floor = this.add.graphics();
        floor.fillStyle(0x1f2937, 1);
        floor.fillRoundedRect(0, this.floorY + 60, width, height - this.floorY - 60, 28);
    }

    createCourtroomProps() {
        const width = this.scale.width;
        const height = this.scale.height;

        const sunBeam1 = this.add.graphics();
        sunBeam1.fillStyle(0xfde047, 0.08);
        sunBeam1.beginPath();
        sunBeam1.moveTo(width / 2 - 250, 0);
        sunBeam1.lineTo(width / 2 + 250, 0);
        sunBeam1.lineTo(width / 2 + 480, height);
        sunBeam1.lineTo(width / 2 - 480, height);
        sunBeam1.closePath();
        sunBeam1.fillPath();

        const sunBeam2 = this.add.graphics();
        sunBeam2.fillStyle(0xfef08a, 0.04);
        sunBeam2.beginPath();
        sunBeam2.moveTo(width / 4 - 80, 0);
        sunBeam2.lineTo(width / 4 + 120, 0);
        sunBeam2.lineTo(width / 4 + 320, height);
        sunBeam2.lineTo(width / 4 - 180, height);
        sunBeam2.closePath();
        sunBeam2.fillPath();

        this.add.rectangle(width / 2, this.floorY + 80, width, 160, 0x1e1b4b, 0.12);

        this.ground = this.add.rectangle(width / 2, this.floorY + 15, width, 30, 0x000000, 0);
        this.physics.add.existing(this.ground, true);
    }

    createJudicialGallery() {
        const width = this.scale.width;
        this.galleryJudges = [];

        const benchXStart = width / 2 - 320;
        const judgeCount = 7;

        for (let i = 0; i < judgeCount; i++) {
            const jx = benchXStart + (i * 110);
            const jy = 515;

            const judgeContainer = this.add.container(jx, jy);

            const body = this.add.graphics();
            body.fillStyle(0x111827, 1);
            body.fillRoundedRect(-25, 0, 50, 60, 6);

            const collar = this.add.graphics();
            collar.fillStyle(0xffffff, 1);
            collar.beginPath();
            collar.moveTo(-10, 0);
            collar.lineTo(0, 15);
            collar.lineTo(10, 0);
            collar.closePath();
            collar.fillPath();

            const head = this.add.graphics();
            head.fillStyle(0xfde047, 1);
            head.fillCircle(0, -15, 16);

            const wig = this.add.graphics();
            wig.fillStyle(0xf9fafb, 1);
            wig.lineStyle(2, 0xe5e7eb, 1);
            wig.fillCircle(-16, -18, 11);
            wig.strokeCircle(-16, -18, 11);
            wig.fillCircle(16, -18, 11);
            wig.strokeCircle(16, -18, 11);
            wig.fillCircle(0, -28, 15);
            wig.strokeCircle(0, -28, 15);

            const tinyGavel = this.add.graphics();
            tinyGavel.fillStyle(0x78350f, 1);
            tinyGavel.fillRect(15, -15, 5, 20);
            tinyGavel.fillStyle(0x451a03, 1);
            tinyGavel.fillRect(10, -22, 15, 8);

            judgeContainer.add([body, collar, head, wig, tinyGavel]);
            judgeContainer.tinyGavel = tinyGavel;

            this.add.existing(judgeContainer);
            this.galleryJudges.push(judgeContainer);

            this.tweens.add({
                targets: judgeContainer,
                y: jy + 6,
                duration: 900 + i * 150,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createMainMenu() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.menuContainer = this.add.container(width / 2, height / 2);

        const logoBack = this.add.rectangle(0, -220, 950, 150, 0x18181b, 0.9);
        logoBack.setStrokeStyle(6, 0xeab308);

        const titleText = this.add.text(0, -250, 'SUPREME SHOWDOWN', {
            fontFamily: '"Press Start 2P"',
            fontSize: '54px',
            fill: '#fde047',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        const subTitleText = this.add.text(0, -170, 'CONSTITUTIONAL COMBAT', {
            fontFamily: '"Press Start 2P"',
            fontSize: '22px',
            fill: '#ef4444',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        this.menuContainer.add([logoBack, titleText, subTitleText]);

        const startBtn = this.add.rectangle(0, 40, 380, 70, 0x16a34a);
        startBtn.setStrokeStyle(4, 0xffffff);
        startBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 380, 70), Phaser.Geom.Rectangle.Contains);
        startBtn.input.cursor = 'pointer';

        const startText = this.add.text(0, 40, 'START GAME', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.menuContainer.add([startBtn, startText]);

        startBtn.on('pointerover', () => {
            startBtn.setFillStyle(0x15803d);
            startText.setScale(1.05);
        });
        startBtn.on('pointerout', () => {
            startBtn.setFillStyle(0x16a34a);
            startText.setScale(1.0);
        });
        startBtn.on('pointerdown', () => {
            this.gameState = 'character_select';
            this.playSFX('gavel-hit');
            this.audioManager.playMusic();

            this.tweens.add({
                targets: this.menuContainer,
                scaleX: 0.8,
                scaleY: 0.8,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    this.menuContainer.destroy();
                    createCharacterSelectUI(this, (p1Choice, p2Choice, vsAI) => {
                        this.startFight(p1Choice, p2Choice, vsAI);
                    });
                }
            });
        });

        const controlPanel = this.add.graphics();
        controlPanel.fillStyle(0x18181b, 0.9);
        controlPanel.fillRoundedRect(-450, 140, 900, 180, 8);
        controlPanel.lineStyle(2.5, 0xeab308, 0.5);
        controlPanel.strokeRoundedRect(-450, 140, 900, 180, 8);
        this.menuContainer.add(controlPanel);

        const p1Label = this.add.text(-220, 165, 'PLAYER 1: ROE (Plaintiff)', {
            fontFamily: '"Press Start 2P"',
            fontSize: '11px',
            fill: '#60a5fa'
        }).setOrigin(0.5);
        const p1Controls = this.add.text(-220, 240, 'Move: A / D | Jump: W (Double-Jump)\nStandard Combo (3-Hit): J key\nPrivacy Shield (Block): Hold S + J\nSuper Substantive Liberty: SPACEBAR', {
            fontFamily: 'Arial',
            fontSize: '14px',
            fill: '#d1d5db',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);

        const p2Label = this.add.text(220, 165, 'PLAYER 2: WADE (Defendant)', {
            fontFamily: '"Press Start 2P"',
            fontSize: '11px',
            fill: '#fca5a5'
        }).setOrigin(0.5);
        const p2Controls = this.add.text(220, 240, 'Move: Left / Right | Jump: UP (Double-Jump)\nStandard Combo (3-Hit): 1 key\nSovereign Wall (Block): Hold DOWN + 1\nSuper Police Power: 0 key', {
            fontFamily: 'Arial',
            fontSize: '14px',
            fill: '#d1d5db',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5);

        this.menuContainer.add([p1Label, p1Controls, p2Label, p2Controls]);

        this.menuScales = this.add.graphics();
        this.menuScales.lineStyle(4, 0xca8a04, 0.6);
        this.menuScales.lineBetween(-200, -80, 200, -80);
        this.menuScales.lineBetween(0, -110, 0, 0);
        this.menuContainer.add(this.menuScales);
    }

    startFight(p1Id, p2Id, vsAI) {
        this.gameState = 'fight';
        const width = this.scale.width;

        this.player1 = new Fighter(this, width * 0.25, this.floorY, p1Id, false, false);
        this.player2 = new Fighter(this, width * 0.75, this.floorY, p2Id, true, vsAI);

        this.add.existing(this.player1);
        this.add.existing(this.player2);

        [this.player1, this.player2].forEach((player) => {
            if (typeof player.physicsInit !== 'function') {
                player.physicsInit = function (floorY) {
                    if (this.body) {
                        this.body.setCollideWorldBounds(true);
                        this.body.setGravityY(2300);
                        this.body.setSize(100, 210);
                        this.body.setOffset(-50, -150);
                        this.body.setBounce(0, 0);
                        this.body.setAllowGravity(true);
                        this.body.setMaxVelocity(900, 1800);
                        this.body.floorY = floorY;
                    }
                };
            }
            player.physicsInit(this.floorY);
        });

        this.fighters = [this.player1, this.player2];

        this.physics.add.collider(this.player1, this.ground);
        this.physics.add.collider(this.player2, this.ground);
        this.physics.add.collider(this.player1, this.player2);

        this.setupControls();
        this.setupBattleHUD();
        this.announceRoundStart();

        this.roundTimerValue = 99;
        if (this.timerText) {
            this.timerText.setText(this.roundTimerValue.toString());
        }

        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = null;
        }

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.gameState === 'fight' && this.roundTimerValue > 0) {
                    this.roundTimerValue -= 1;
                    if (this.timerText) {
                        this.timerText.setText(this.roundTimerValue.toString());
                    }
                    if (this.roundTimerValue === 0) {
                        this.handleTimeOut();
                    }
                }
            },
            loop: true
        });
    }

    setupControls() {
        const keyboard = this.input.keyboard;

        this.keysP1 = {
            left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            super: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        };

        this.keysP2 = {
            left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            attackNumpad: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),
            super: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO),
            superNumpad: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO)
        };
    }

    announceRoundStart() {
        const width = this.scale.width;
        const height = this.scale.height;

        const banner = this.add.rectangle(width / 2, height / 2, width, 180, 0x18181b, 0.9);
        banner.setStrokeStyle(5, 0xeab308);
        banner.setDepth(15);

        const announcementText = this.add.text(width / 2, height / 2 - 20, 'ORAL ARGUMENT', {
            fontFamily: '"Press Start 2P"',
            fontSize: '52px',
            fill: '#fde047',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(16);

        const callText = this.add.text(width / 2, height / 2 + 40, 'Pleading Begins Now!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(16);

        banner.setScale(0, 1);
        announcementText.setScale(0);
        callText.setScale(0);

        this.tweens.add({
            targets: banner,
            scaleX: 1,
            duration: 350,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: [announcementText, callText],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 250,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        this.time.delayedCall(1000, () => {
                            this.tweens.add({
                                targets: [banner, announcementText, callText],
                                scaleY: 0,
                                alpha: 0,
                                duration: 250,
                                ease: 'Quad.easeIn',
                                onComplete: () => {
                                    banner.destroy();
                                    announcementText.destroy();
                                    callText.destroy();
                                }
                            });
                        });
                    }
                });
            }
        });
    }

    setupBattleHUD() {
        const width = this.scale.width;

        this.hudGraphics = this.add.graphics();
        this.hudContainer = this.add.container(0, 0, [this.hudGraphics]);

        this.hudP1Name = this.add.text(130, 32, 'ROE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: '#60a5fa',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.hudP2Name = this.add.text(width - 130, 32, 'WADE', {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: '#fca5a5',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0);

        this.timerText = this.add.text(width / 2, 30, this.roundTimerValue.toString(), {
            fontFamily: '"Press Start 2P"',
            fontSize: '34px',
            fill: '#fde047',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        this.s1Text = this.add.text(120, 86, 'METER  0%', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#a5b4fc'
        });

        this.s2Text = this.add.text(width - 120, 86, 'METER  0%', {
            fontFamily: '"Press Start 2P"',
            fontSize: '10px',
            fill: '#fbcfe8'
        }).setOrigin(1, 0);

        this.muteButton = this.add.text(width - 40, 150, '🔊 MUTE (M)', {
            fontFamily: '"Press Start 2P"',
            fontSize: '11px',
            fill: '#ffffff',
            backgroundColor: '#18181b',
            padding: { x: 8, y: 6 }
        }).setOrigin(1, 0).setInteractive();
        this.muteButton.on('pointerdown', () => this.toggleMute());

        this.hudContainer.add([this.hudP1Name, this.hudP2Name, this.timerText, this.s1Text, this.s2Text, this.muteButton]);
        this.updateHUDGraphics();
    }

    updateHUDGraphics() {
        if (!this.hudGraphics || !this.player1 || !this.player2) {
            return;
        }

        const width = this.scale.width;
        const zincBox = 0x71717a;
        const emeraldFill = 0x22c55e;
        const healthWidthMax = 594;
        const meterWidthMax = 294;

        const p1HealthWidth = Math.max(0, (this.player1.health / this.player1.maxHealth) * healthWidthMax);
        const p2HealthWidth = Math.max(0, (this.player2.health / this.player2.maxHealth) * healthWidthMax);

        const p1MeterWidth = Math.max(0, (this.player1.superMeter / 100) * meterWidthMax);
        const p2MeterWidth = Math.max(0, (this.player2.superMeter / 100) * meterWidthMax);

        this.hudGraphics.clear();
        this.hudGraphics.fillStyle(zincBox, 0.95);
        this.hudGraphics.fillRoundedRect(40, 20, 840, 104, 18);

        this.hudGraphics.fillStyle(0x111827, 1);
        this.hudGraphics.fillRoundedRect(110, 56, 610, 30, 12);
        this.hudGraphics.fillRoundedRect(width - 720, 56, 610, 30, 12);

        this.hudGraphics.fillStyle(emeraldFill, 1);
        this.hudGraphics.fillRoundedRect(112, 58, p1HealthWidth, 26, 10);
        this.hudGraphics.fillRoundedRect(width - 718 + (610 - p2HealthWidth), 58, p2HealthWidth, 26, 10);

        this.hudGraphics.fillStyle(0x111827, 1);
        this.hudGraphics.fillRoundedRect(110, 90, 300, 16, 8);
        this.hudGraphics.fillRoundedRect(width - 410, 90, 300, 16, 8);

        this.hudGraphics.fillStyle(0x6366f1, 1);
        this.hudGraphics.fillRoundedRect(112, 92, p1MeterWidth, 12, 6);
        this.hudGraphics.fillStyle(0xec4899, 1);
        this.hudGraphics.fillRoundedRect(width - 410 + (300 - p2MeterWidth), 92, p2MeterWidth, 12, 6);

        if (this.timerText) {
            this.timerText.setText(this.roundTimerValue.toString());
        }

        if (this.s1Text) {
            this.s1Text.setText(this.player1.superMeter >= 100 ? 'SUPER READY! [SPACE]' : `METER  ${Math.floor(this.player1.superMeter)}%`);
            this.s1Text.setFill(this.player1.superMeter >= 100 ? '#fde047' : '#a5b4fc');
        }

        if (this.s2Text) {
            this.s2Text.setText(this.player2.superMeter >= 100 ? 'SUPER READY! [0]' : `METER  ${Math.floor(this.player2.superMeter)}%`);
            this.s2Text.setFill(this.player2.superMeter >= 100 ? '#fde047' : '#fbcfe8');
        }
    }

    toggleMute() {
        const muted = this.audioManager.toggleMute();
        if (this.muteButton) {
            this.muteButton.setText(muted ? '🔇 UNMUTE (M)' : '🔊 MUTE (M)');
        }
    }

    update() {
        if (this.gameState !== 'fight') {
            return;
        }

        if (this.player1 && this.player2) {
            this.player1.update(this.player2);
            this.player2.update(this.player1);
        }

        let p1XDir = 0;
        if (this.keysP1.left.isDown) {
            p1XDir = -1;
        } else if (this.keysP1.right.isDown) {
            p1XDir = 1;
        }
        this.player1.move(p1XDir);

        if (Phaser.Input.Keyboard.JustDown(this.keysP1.jump)) {
            this.player1.jump();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keysP1.attack)) {
            if (this.keysP1.down.isDown) {
                this.player1.triggerSpecialShield();
            } else {
                this.player1.triggerAttack();
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keysP1.super)) {
            if (this.player1.superMeter >= 100) {
                this.triggerSuper(this.player1);
            }
        }

        if (this.player2.isAI) {
            this.handleAIBehavior();
        } else {
            let p2XDir = 0;
            if (this.keysP2.left.isDown) {
                p2XDir = -1;
            } else if (this.keysP2.right.isDown) {
                p2XDir = 1;
            }
            this.player2.move(p2XDir);

            if (Phaser.Input.Keyboard.JustDown(this.keysP2.jump)) {
                this.player2.jump();
            }

            const isP2AttackPressed = Phaser.Input.Keyboard.JustDown(this.keysP2.attack) || Phaser.Input.Keyboard.JustDown(this.keysP2.attackNumpad);
            if (isP2AttackPressed) {
                if (this.keysP2.down.isDown) {
                    this.player2.triggerSpecialShield();
                } else {
                    this.player2.triggerAttack();
                }
            }

            const isP2SuperPressed = Phaser.Input.Keyboard.JustDown(this.keysP2.super) || Phaser.Input.Keyboard.JustDown(this.keysP2.superNumpad);
            if (isP2SuperPressed) {
                if (this.player2.superMeter >= 100) {
                    this.triggerSuper(this.player2);
                }
            }
        }

        this.checkAttackOverlaps();
        this.checkVictoryCondition();
        this.updateHUDGraphics();
    }

    handleAIBehavior() {
        if (!this.player1 || !this.player2) {
            return;
        }

        const dist = Phaser.Math.Distance.Between(this.player1.x, this.player1.y, this.player2.x, this.player2.y);
        const now = this.time.now;

        if (this.player2.isStunned) {
            return;
        }

        if (dist > 180) {
            const dir = this.player1.x > this.player2.x ? 1 : -1;
            this.player2.move(dir);
            if (Math.random() < 0.02 && this.player2.isGrounded) {
                this.player2.jump();
            }
        } else {
            this.player2.body.setVelocityX(0);
            if (this.player2.superMeter >= 100) {
                this.triggerSuper(this.player2);
            } else if (this.player1.isAttacking && Math.random() < 0.3) {
                this.player2.triggerSpecialShield();
            } else if (now - this.player2.lastAttackTime > 350) {
                this.player2.triggerAttack();
            }
        }
    }

    checkAttackOverlaps() {
        if (this.player1.isAttacking && this.physics.overlap(this.player1.attackHitbox, this.player2)) {
            if (!this.player2.isStunned) {
                this.player2.takeDamage(this.player1.damageNormal, this.player1.attackText);
                this.player1.gainSuperMeter(this.comboMeterGain);
                this.playSFX('gavel-hit');
                this.cheerSpectators();
                this.player1.disableAttackHitbox();
            }
        }

        if (this.player2.isAttacking && this.physics.overlap(this.player2.attackHitbox, this.player1)) {
            if (!this.player1.isStunned) {
                this.player1.takeDamage(this.player2.damageNormal, this.player2.attackText);
                this.player2.gainSuperMeter(this.comboMeterGain);
                this.playSFX('gavel-hit');
                this.cheerSpectators();
                this.player2.disableAttackHitbox();
            }
        }
    }

    triggerSuper(fighter) {
        fighter.triggerSuperMove();
    }

    cheerSpectators() {
        this.galleryJudges.forEach((judge, idx) => {
            this.tweens.add({
                targets: judge,
                y: 515 - 45,
                duration: 150,
                yoyo: true,
                repeat: 1,
                ease: 'Back.easeOut'
            });

            if (judge.tinyGavel) {
                this.tweens.add({
                    targets: judge.tinyGavel,
                    angle: idx % 2 === 0 ? 35 : -35,
                    duration: 80,
                    yoyo: true,
                    repeat: 3
                });
            }
        });
    }

    playSFX(key) {
        if (this.audioManager) {
            this.audioManager.playSFX(key);
        }
    }

    showPopupText(x, y, text, color) {
        const style = {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        };

        const popup = this.add.text(x, y, text, style).setOrigin(0.5).setDepth(25);
        popup.setScale(0);

        this.tweens.add({
            targets: popup,
            scaleX: 1.1,
            scaleY: 1.1,
            y: y - 55,
            duration: 180,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: popup,
                    alpha: 0,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    y: y - 90,
                    delay: 550,
                    duration: 250,
                    onComplete: () => popup.destroy()
                });
            }
        });
    }

    handleTimeOut() {
        if (this.gameState !== 'fight') {
            return;
        }

        this.gameState = 'verdict';
        this.audioManager.stopMusic();
        this.playSFX('cheer-applause');

        const winner = this.player1.health >= this.player2.health ? this.player1 : this.player2;
        const loser = winner === this.player1 ? this.player2 : this.player1;

        this.fighters.forEach((fighter) => {
            fighter.body.setVelocity(0, 0);
            fighter.body.setAllowGravity(false);
        });

        showFinalVerdictScreen(this,
            { id: winner.characterId, name: winner.charName },
            { id: loser.characterId, name: loser.charName },
            () => {
                this.restartBattle();
            }
        );
    }

    checkVictoryCondition() {
        if (!this.player1 || !this.player2) {
            return;
        }

        if (this.player1.health <= 0 || this.player2.health <= 0) {
            this.gameState = 'verdict';

            const winner = this.player1.health > 0 ? this.player1 : this.player2;
            const loser = winner === this.player1 ? this.player2 : this.player1;

            this.audioManager.stopMusic();
            this.playSFX('cheer-applause');

            this.fighters.forEach((fighter) => {
                fighter.body.setVelocity(0, 0);
                fighter.body.setAllowGravity(false);
            });

            if (this.timerEvent) {
                this.timerEvent.destroy();
                this.timerEvent = null;
            }

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
        if (this.timerEvent) {
            this.timerEvent.destroy();
            this.timerEvent = null;
        }

        if (this.fighters) {
            this.fighters.forEach((fighter) => {
                if (fighter.disableAttackHitbox) {
                    fighter.disableAttackHitbox();
                }
                fighter.destroy();
            });
        }

        if (this.hudContainer) {
            this.hudContainer.destroy();
            this.hudContainer = null;
            this.hudGraphics = null;
        }

        this.scene.restart();
    }
}
