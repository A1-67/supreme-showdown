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

        this.load.image('courtroom-bg', 'assets/courtroom-bg.png');
        this.audioManager = new AudioManager(this);
        this.audioManager.preload();
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.bg = this.add.image(width / 2, height / 2, 'courtroom-bg');
        this.bg.setDisplaySize(width, height);

        this.audioManager.init();
        this.audioManager.playMusic();

        const bookGraphics = this.add.graphics();
        bookGraphics.fillStyle(0x0000ff);
        bookGraphics.fillRect(0, 0, 20, 30);
        bookGraphics.generateTexture('book', 20, 30);
        bookGraphics.destroy();

        const gavelGraphics = this.add.graphics();
        gavelGraphics.fillStyle(0x8B4513);
        gavelGraphics.fillRect(0, 0, 10, 30);
        gavelGraphics.fillRect(-5, 0, 20, 10);
        gavelGraphics.generateTexture('gavel', 20, 30);
        gavelGraphics.destroy();

        this.createCourtroomProps();
        this.createJudicialGallery();
        this.createMainMenu();

        this.input.keyboard.on('keydown-M', () => {
            this.toggleMute();
        });
    }

    createMainMenu() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.menuContainer = this.add.container(width / 2, 0);

        const title = this.add.text(0, 150, 'SUPREME SHOWDOWN', {
            fontFamily: '"Press Start 2P"',
            fontSize: '64px',
            fill: '#fde047',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);

        const subtitle = this.add.text(0, 220, 'CONSTITUTIONAL COMBAT', {
            fontFamily: '"Press Start 2P"',
            fontSize: '28px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.menuContainer.add([title, subtitle]);

        const startBtn = this.createButton(0, height / 2, 'START GAME', () => {
            this.transitionToCharacterSelect();
        });

        const controlsBtn = this.createButton(0, height / 2 + 80, 'CONTROLS', () => {
            this.controlsContainer.setVisible(true);
        });

        this.menuContainer.add([startBtn, controlsBtn]);

        this.controlsContainer = this.add.container(width / 2, height / 2);
        this.controlsContainer.setVisible(false);
        
        const controlsBg = this.add.rectangle(0, 0, width * 0.8, height * 0.7, 0x000000, 0.9);
        controlsBg.setStrokeStyle(4, 0xeab308);

        const controlsTitle = this.add.text(0, -height * 0.3, 'CONTROLS', {
            fontFamily: '"Press Start 2P"',
            fontSize: '32px',
            fill: '#fde047'
        }).setOrigin(0.5);

        const p1Controls = 'Move: A/D\nJump: W\nAttack: J\nProjectile: K\nGround Pound: L\nCharge: O';
        const p2Controls = 'Move: Left/Right\nJump: UP\nAttack: 1\nProjectile: 2\nGround Pound: 3\nCharge: 9';

        const p1Title = this.add.text(-width * 0.2, -150, 'PLAYER 1', { fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#60a5fa' }).setOrigin(0.5);
        const p1Text = this.add.text(-width * 0.2, 0, p1Controls, { fontFamily: 'Arial', fontSize: '16px', fill: '#fff', align: 'left', lineSpacing: 8 }).setOrigin(0.5);

        const p2Title = this.add.text(width * 0.2, -150, 'PLAYER 2', { fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#fca5a5' }).setOrigin(0.5);
        const p2Text = this.add.text(width * 0.2, 0, p2Controls, { fontFamily: 'Arial', fontSize: '16px', fill: '#fff', align: 'left', lineSpacing: 8 }).setOrigin(0.5);

        const backBtn = this.createButton(0, height * 0.3, 'BACK', () => {
            this.controlsContainer.setVisible(false);
        });

        this.controlsContainer.add([controlsBg, controlsTitle, p1Title, p1Text, p2Title, p2Text, backBtn]);
    }

    createButton(x, y, text, callback) {
        const btnContainer = this.add.container(x, y);
        const textObj = this.add.text(0, 0, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#fff'
        }).setOrigin(0.5);

        const btnWidth = textObj.width + 40;
        const btnHeight = textObj.height + 20;

        const btnBox = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x18181b, 0.8).setOrigin(0.5);
        btnBox.setStrokeStyle(3, 0xeab308);

        btnContainer.add([btnBox, textObj]);
        btnContainer.setSize(btnWidth, btnHeight);
        btnContainer.setInteractive({ useHandCursor: true });

        btnContainer.on('pointerover', () => {
            btnBox.setFillStyle(0x334155, 0.8);
            textObj.setFill('#fde047');
        });
        btnContainer.on('pointerout', () => {
            btnBox.setFillStyle(0x18181b, 0.8);
            textObj.setFill('#fff');
        });
        btnContainer.on('pointerdown', () => {
            this.playSFX('gavel-hit');
            callback();
        });

        return btnContainer;
    }

    setupControls() {
        const keyboard = this.input.keyboard;

        this.keysP1 = {
            left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            projectile: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
            groundPound: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
            charge: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
            super: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        };

        this.keysP2 = {
            left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            projectile: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
            groundPound: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
            charge: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE),
            super: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO),
        };
    }

    startFight(p1Id, p2Id, isVsAI) {
        this.gameState = 'fight';

        this.player1 = new Fighter(this, 400, this.floorY, p1Id, false, false);
        this.player2 = new Fighter(this, 1520, this.floorY, p2Id, true, isVsAI);
        this.fighters = [this.player1, this.player2];

        this.physics.add.collider(this.player1, this.ground);
        this.physics.add.collider(this.player2, this.ground);
        
        this.physics.add.overlap(this.player1.projectiles, this.player2, this.handleProjectileHit, null, this);
        this.physics.add.overlap(this.player2.projectiles, this.player1, this.handleProjectileHit, null, this);

        this.setupControls();
        this.createHUD();
        this.announceRoundStart();
        
        this.roundTimerValue = 99;
        this.timerText.setText(this.roundTimerValue.toString());
        
        if (this.timerEvent) this.timerEvent.destroy();
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.gameState === 'fight' && this.roundTimerValue > 0) {
                    this.roundTimerValue--;
                    this.timerText.setText(this.roundTimerValue.toString());
                    
                    if (this.roundTimerValue === 0) {
                        this.handleTimeOut();
                    }
                }
            },
            loop: true
        });
    }

    update() {
        if (this.gameState !== 'fight') return;

        this.player1.update(this.player2);
        this.player2.update(this.player1);

        this.handlePlayerInput(this.player1, this.keysP1);

        if (this.player2.isAI) {
            this.handleAIBehavior();
        } else {
            this.handlePlayerInput(this.player2, this.keysP2);
        }

        this.checkAttackOverlaps();
        this.checkVictoryCondition();
        this.updateHUD();
    }

    handlePlayerInput(player, keys) {
        let direction = 0;
        if (keys.left.isDown) direction = -1;
        else if (keys.right.isDown) direction = 1;
        player.move(direction);

        if (Phaser.Input.Keyboard.JustDown(keys.jump)) {
            player.jump();
        }

        if (Phaser.Input.Keyboard.JustDown(keys.attack)) {
            player.triggerAttack();
        }

        if (Phaser.Input.Keyboard.JustDown(keys.projectile)) {
            player.triggerProjectile();
        }

        if (Phaser.Input.Keyboard.JustDown(keys.groundPound)) {
            player.triggerGroundPound();
        }

        if (keys.charge.isDown) {
            player.startCharging();
        }
        if (Phaser.Input.Keyboard.JustUp(keys.charge)) {
            player.releaseChargeAttack();
        }
        
        if (Phaser.Input.Keyboard.JustDown(keys.super)) {
            if (player.superMeter >= 100) {
                this.triggerSuper(player);
            }
        }
    }

    handleProjectileHit(player, projectile) {
        if (!player.isStunned) {
            player.takeDamage(projectile.damage, player.attackText);
            projectile.destroy();
        }
    }

    checkAttackOverlaps() {
        if (this.player1.isAttacking && this.physics.overlap(this.player1.attackHitbox, this.player2)) {
            if (!this.player2.isStunned) {
                this.player2.takeDamage(this.player1.attackHitbox.damage, this.player1.attackText);
                this.player1.gainSuperMeter(this.comboMeterGain);
                this.playSFX('gavel-hit');
                this.cheerSpectators();
                this.player1.disableAttackHitbox();
            }
        }

        if (this.player2.isAttacking && this.physics.overlap(this.player2.attackHitbox, this.player1)) {
            if (!this.player1.isStunned) {
                this.player1.takeDamage(this.player2.attackHitbox.damage, this.player2.attackText);
                this.player2.gainSuperMeter(this.comboMeterGain);
                this.playSFX('gavel-hit');
                this.cheerSpectators();
                this.player2.disableAttackHitbox();
            }
        }
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
        this.ground.body.setImmovable(true);
        this.ground.body.allowGravity = false;
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
            
            const body = this.add.graphics({ fillStyle: { color: 0x111827 } });
            body.fillRoundedRect(-25, 0, 50, 60, 6);
            
            const collar = this.add.graphics({ fillStyle: { color: 0xffffff } });
            collar.beginPath();
            collar.moveTo(-10, 0);
            collar.lineTo(0, 15);
            collar.lineTo(10, 0);
            collar.closePath();
            collar.fillPath();

            const head = this.add.graphics({ fillStyle: { color: 0xfde047 } });
            head.fillCircle(0, -15, 16);

            const wig = this.add.graphics({ fillStyle: { color: 0xf9fafb }, lineStyle: { width: 2, color: 0xe5e7eb } });
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

    transitionToCharacterSelect() {
        this.gameState = 'character_select';
        
        this.tweens.add({
            targets: this.menuContainer,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                this.menuContainer.destroy();
                this.controlsContainer.destroy();
                createCharacterSelectUI(this, (p1Id, p2Id, isVsAI) => {
                    this.startFight(p1Id, p2Id, isVsAI);
                });
            }
        });
    }
    
    announceRoundStart() {
        const width = this.scale.width;
        const height = this.scale.height;
        const banner = this.add.rectangle(width / 2, height / 2, width, 180, 0x18181b, 0.9).setDepth(15);
        banner.setStrokeStyle(5, 0xeab308);

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

        [banner, announcementText, callText].forEach(el => el.setScale(0));
        banner.setScale(0, 1);

        this.tweens.add({
            targets: banner,
            scaleX: 1,
            duration: 350,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: [announcementText, callText],
                    scale: 1,
                    duration: 250,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        this.time.delayedCall(1000, () => {
                            this.tweens.add({
                                targets: [banner, announcementText, callText],
                                alpha: 0,
                                duration: 250,
                                ease: 'Quad.easeIn',
                                onComplete: () => {
                                    [banner, announcementText, callText].forEach(el => el.destroy());
                                }
                            });
                        });
                    }
                });
            }
        });
    }

    createHUD() {
        const width = this.scale.width;
        this.hudContainer = this.add.container(0, 0);
        this.hudContainer.add(this.add.rectangle(width / 2, 50, width, 100, 0x111827, 0.4));

        const p1Circle = this.add.circle(65, 65, 45, 0x1e3a8a).setStrokeStyle(4, 0x60a5fa);
        const p1CircleScales = this.add.graphics({ lineStyle: { width: 2.5, color: 0x60a5fa } });
        p1CircleScales.lineBetween(45, 65, 85, 65);
        p1CircleScales.lineBetween(65, 45, 65, 85);
        p1CircleScales.strokeCircle(45, 75, 6);
        p1CircleScales.strokeCircle(85, 75, 6);
        this.hudP1Name = this.add.text(125, 25, 'ROE', { fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#60a5fa', stroke: '#000', strokeThickness: 3 });
        const h1Bg = this.add.rectangle(435, 60, 600, 30, 0x1f2937).setStrokeStyle(3.5, 0xeab308);
        this.h1Bar = this.add.rectangle(138, 48, 594, 24, 0x22c55e).setOrigin(0, 0);
        const s1Bg = this.add.rectangle(290, 93, 300, 14, 0x111827).setStrokeStyle(2, 0x4b5563);
        this.s1Bar = this.add.rectangle(142, 88, 0, 10, 0x6366f1).setOrigin(0, 0);
        this.s1Text = this.add.text(450, 88, 'METER  0%', { fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#a5b4fc' });
        this.hudContainer.add([p1Circle, p1CircleScales, this.hudP1Name, h1Bg, this.h1Bar, s1Bg, this.s1Bar, this.s1Text]);

        const p2Circle = this.add.circle(width - 65, 65, 45, 0x7f1d1d).setStrokeStyle(4, 0xef4444);
        const p2CircleGavel = this.add.graphics({ lineStyle: { width: 3, color: 0xfca5a5 }, fillStyle: { color: 0xef4444 } });
        p2CircleGavel.lineBetween(width - 78, 78, width - 52, 52);
        p2CircleGavel.fillCircle(width - 52, 52, 10);
        this.hudP2Name = this.add.text(width - 125, 25, 'WADE', { fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#fca5a5', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0);
        const h2Bg = this.add.rectangle(width - 435, 60, 600, 30, 0x1f2937).setStrokeStyle(3.5, 0xeab308);
        this.h2Bar = this.add.rectangle(width - 138 - 594, 48, 594, 24, 0xf97316).setOrigin(0, 0);
        const s2Bg = this.add.rectangle(width - 290, 93, 300, 14, 0x111827).setStrokeStyle(2, 0x4b5563);
        this.s2Bar = this.add.rectangle(width - 142 - 294, 88, 0, 10, 0xec4899).setOrigin(0, 0);
        this.s2Text = this.add.text(width - 450, 88, 'METER  0%', { fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#fbcfe8' }).setOrigin(1, 0);
        this.hudContainer.add([p2Circle, p2CircleGavel, this.hudP2Name, h2Bg, this.h2Bar, s2Bg, this.s2Bar, this.s2Text]);

        const timerBgCircle = this.add.circle(width / 2, 60, 48, 0x1c1917).setStrokeStyle(5, 0xeab308);
        this.timerText = this.add.text(width / 2, 58, '99', { fontFamily: '"Press Start 2P"', fontSize: '34px', fill: '#fde047', fontStyle: 'bold' }).setOrigin(0.5);
        const roundCapsule = this.add.graphics({ fillStyle: { color: 0x27272a, alpha: 0.95 }, lineStyle: { width: 2, color: 0xeab308, alpha: 0.85 } });
        roundCapsule.fillRoundedRect(width / 2 - 70, 112, 140, 30, 4);
        roundCapsule.strokeRoundedRect(width / 2 - 70, 112, 140, 30, 4);
        const roundLabel = this.add.text(width / 2, 127, 'ROUND 1', { fontFamily: '"Press Start 2P"', fontSize: '11px', fill: '#ffffff' }).setOrigin(0.5);
        this.hudContainer.add([timerBgCircle, this.timerText, roundCapsule, roundLabel]);

        this.muteButton = this.add.text(width - 40, 150, '🔊 MUTE (M)', { fontFamily: '"Press Start 2P"', fontSize: '11px', fill: '#ffffff', backgroundColor: '#18181b', padding: { x: 8, y: 6 } }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        this.muteButton.on('pointerdown', () => this.toggleMute());
    }

    toggleMute() {
        const muted = this.audioManager.toggleMute();
        this.muteButton.setText(muted ? '🔇 UNMUTE (M)' : '🔊 MUTE (M)');
    }

    updateHUD() {
        const width = this.scale.width;

        this.tweens.add({ targets: this.h1Bar, width: (this.player1.health / this.player1.maxHealth) * 594, duration: 50, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: this.h2Bar, x: width - 138 - (this.player2.health / this.player2.maxHealth) * 594, width: (this.player2.health / this.player2.maxHealth) * 594, duration: 50, ease: 'Quad.easeOut' });

        this.h1Bar.setFillStyle(this.player1.health < 30 ? 0xef4444 : (this.player1.health < 60 ? 0xeab308 : 0x22c55e));
        this.h2Bar.setFillStyle(this.player2.health < 30 ? 0xef4444 : (this.player2.health < 60 ? 0xeab308 : 0xf97316));

        this.s1Bar.width = (this.player1.superMeter / 100) * 294;
        this.s1Text.setText(`METER  ${Math.floor(this.player1.superMeter)}%`);
        if (this.player1.superMeter >= 100) {
            this.s1Text.setText('SUPER READY! [SPACE]').setFill('#fde047');
        } else {
            this.s1Text.setFill('#a5b4fc');
        }

        this.s2Bar.width = (this.player2.superMeter / 100) * 294;
        this.s2Bar.x = width - 142 - this.s2Bar.width;
        this.s2Text.setText(`METER  ${Math.floor(this.player2.superMeter)}%`);
        if (this.player2.superMeter >= 100) {
            this.s2Text.setText('SUPER READY! [0]').setFill('#fde047');
        } else {
            this.s2Text.setFill('#fbcfe8');
        }
    }

    handleAIBehavior() {
        const dist = Phaser.Math.Distance.Between(this.player1.x, this.player1.y, this.player2.x, this.player2.y);
        const now = this.time.now;

        if (this.player2.isStunned) return;

        if (dist > 250 && Math.random() > 0.95) {
            this.player2.triggerProjectile();
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
                // AI Block logic can be added here
            } else if (now - this.player2.lastAttackTime > 350) {
                this.player2.triggerAttack();
            }
        }
    }

    triggerSuper(fighter) {
        // Super move logic placeholder
    }

    cheerSpectators() {
        this.galleryJudges.forEach((judge, idx) => {
            this.tweens.add({ targets: judge, y: 515 - 45, duration: 150, yoyo: true, repeat: 1, ease: 'Back.easeOut' });
            if (judge.tinyGavel) {
                this.tweens.add({ targets: judge.tinyGavel, angle: idx % 2 === 0 ? 35 : -35, duration: 80, yoyo: true, repeat: 3 });
            }
        });
    }

    playSFX(key) {
        this.audioManager.playSFX(key);
    }

    showPopupText(x, y, text, color) {
        const t = this.add.text(x, y, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5).setDepth(25).setScale(0);
        
        this.tweens.add({
            targets: t,
            scale: 1.1,
            y: y - 55,
            duration: 180,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(550, () => {
                    this.tweens.add({
                        targets: t,
                        alpha: 0,
                        scale: 0.8,
                        y: y - 90,
                        duration: 250,
                        onComplete: () => t.destroy()
                    });
                });
            }
        });
    }

    endFight(winner, loser) {
        this.gameState = 'verdict';
        this.audioManager.stopMusic();
        this.playSFX('cheer-applause');

        this.fighters.forEach(f => {
            f.body.setVelocity(0, 0).setAllowGravity(false);
        });

        if (this.timerEvent) this.timerEvent.destroy();

        this.time.delayedCall(1200, () => {
            showFinalVerdictScreen(this, 
                { id: winner.characterId, name: winner.charName },
                { id: loser.characterId, name: loser.charName },
                () => this.restartBattle()
            );
        });
    }

    handleTimeOut() {
        const winner = this.player1.health >= this.player2.health ? this.player1 : this.player2;
        const loser = winner === this.player1 ? this.player2 : this.player1;
        this.endFight(winner, loser);
    }

    checkVictoryCondition() {
        if (this.player1.health <= 0) {
            this.endFight(this.player2, this.player1);
        } else if (this.player2.health <= 0) {
            this.endFight(this.player1, this.player2);
        }
    }

    restartBattle() {
        if (this.timerEvent) this.timerEvent.destroy();
        
        this.fighters.forEach(f => f.destroy());
        if (this.hudContainer) this.hudContainer.destroy();

        this.scene.restart();
    }
}
