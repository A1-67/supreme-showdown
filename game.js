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
        
        const loadingText = this.add.text(width / 2, height / 2 - 60, 'LOADING COMBAT CONTEXT...', {
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

        // Background
        this.load.image('courtroom-bg', 'assets/courtroom-bg.webp');

        // Traditional legacy characters
        this.load.image('char-roe', 'https://labs.phaser.io/assets/sprites/asuna_by_poncho-d7bocju.png');
        this.load.image('char-wade', 'https://labs.phaser.io/assets/sprites/buckyball.png');
        
        // --- PRELOADING CITY MAN 3 ANIMATED SPRITESHEETS ---
        // Adjust frameWidth and frameHeight to match the pixel dimensions of one block in your PNGs
        const frameConfig = { frameWidth: 128, frameHeight: 128 };
        this.load.spritesheet('cityman-idle', 'City_men_3/Idle.png', frameConfig);
        this.load.spritesheet('cityman-walk', 'City_men_3/Walk.png', frameConfig);
        this.load.spritesheet('cityman-attack', 'City_men_3/Attack.png', frameConfig);
        this.load.spritesheet('cityman-hurt', 'City_men_3/Hurt.png', frameConfig);
        this.load.spritesheet('cityman-dead', 'City_men_3/Dead.png', frameConfig);

        this.audioManager = new AudioManager(this);
        this.audioManager.preload();
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        this.audioManager.init();

        this.bg = this.add.image(width / 2, height / 2, 'courtroom-bg');
        this.bg.setDisplaySize(width, height);

        // --- DEFINE GLOBAL ANIMATIONS FOR CITY MAN 3 ---
        this.createCityManAnimations();

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

    createCityManAnimations() {
        // Automatically reads all frames available inside the preloaded horizontal spritesheet
        this.anims.create({
            key: 'cityman_idle',
            frames: this.anims.generateFrameNumbers('cityman-idle'),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'cityman_walk',
            frames: this.anims.generateFrameNumbers('cityman-walk'),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'cityman_attack',
            frames: this.anims.generateFrameNumbers('cityman-attack'),
            frameRate: 16,
            repeat: 0
        });

        this.anims.create({
            key: 'cityman_hurt',
            frames: this.anims.generateFrameNumbers('cityman-hurt'),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'cityman_dead',
            frames: this.anims.generateFrameNumbers('cityman-dead'),
            frameRate: 6,
            repeat: 0
        });
    }

    createCourtroomProps() {
        const width = this.scale.width;
        this.add.rectangle(width / 2, this.floorY + 80, width, 160, 0x1e1b4b, 0.12);
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

        this.player1 = new Fighter(this, width * 0.25, this.floorY, p1Id, false, false);
        this.player2 = new Fighter(this, width * 0.75, this.floorY, p2Id, true, vsAI);
        this.fighters = [this.player1, this.player2];

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

        this.add.rectangle(138, 43, 600, 34, 0x18181b).setOrigin(0, 0);
        this.h1Bar = this.add.rectangle(141, 46, 594, 28, 0x22c55e).setOrigin(0, 0);

        this.add.rectangle(width - 738, 43, 600, 34, 0x18181b).setOrigin(0, 0);
        this.h2Bar = this.
