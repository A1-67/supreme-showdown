import Phaser from 'phaser';
import { Fighter } from './entities.js';
import { AudioManager } from './audio.js';
import { createCharacterSelectUI, showFinalVerdictScreen } from './ui.js';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init() {
        // Setup state variables
        this.gameState = 'menu'; // 'menu' | 'character_select' | 'fight' | 'verdict'
        this.fighters = [];
        this.floorY = 920; // 1080p fit floor alignment
        this.comboMeterGain = 12; // Gains 12% super per normal hit
        
        // Timer configurations
        this.roundTimerValue = 99;
        this.timerEvent = null;
    }

    preload() {
        // Setup a beautiful retro court loading progress bar
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

        // Load Background Image (Fixed asset key mismatch)
        this.load.image('courtroom-bg', 'assets/courtroom-bg.png');
        
        // Initialize and preload Audio
        this.audioManager = new AudioManager(this);
        this.audioManager.preload();
    }

    create() {
        // Desktop Scaling setup: Base resolution 1920x1080
        const width = this.scale.width;
        const height = this.scale.height;

        this.audioManager.init();

        // Background stage (Key fixed to match preload)
        this.bg = this.add.image(width / 2, height / 2, 'courtroom-bg');
        this.bg.setDisplaySize(width, height);

        // Draw Interactive Judicial Bench & Pillars (Volumetric sunbeams & ground)
        this.createCourtroomProps();

        // Create the Judicial Gallery (Cheering robed wigged spectators holding tiny gavels)
        this.createJudicialGallery();

        // Title Screen and Lobby UI
        this.createMainMenu();

        // Play loopable BGM on first interaction
        this.input.once('pointerdown', () => {
            this.audioManager.playMusic();
        });

        // Setup sound hotkey (Mute toggle 'M')
        this.input.keyboard.on('keydown-M', () => {
            this.toggleMute();
        });
    }

    createCourtroomProps() {
        const width = this.scale.width;
        const height = this.scale.height;
        
        // Volumetric warm sunbeams filtering down from dome ceiling (adds beautiful classical court aesthetic)
        const sunBeam1 = this.add.graphics();
        sunBeam1.fillStyle(0xfde047, 0.08); // Semi-transparent warm yellow
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

        // Polished marble floor reflection overlay
        const floorReflection = this.add.rectangle(width / 2, this.floorY + 80, width, 160, 0x1e1b4b, 0.12);
        
        // Create invisible ground physics body
        this.ground = this.add.rectangle(width / 2, this.floorY + 15, width, 30, 0x000000, 0);
        this.physics.add.existing(this.ground, true);
    }

    createJudicialGallery() {
        const width = this.scale.width;
        this.galleryJudges = [];

        // Row of wigged judges sitting at judicial bench bobbing and waving tiny wooden gavels
        const benchXStart = width / 2 - 320;
        const judgeCount = 7;

        for (let i = 0; i < judgeCount; i++) {
            const jx = benchXStart + (i * 110);
            const jy = 515;

            const judgeContainer = this.add.container(jx, jy);
            
            // Black judicial robes
            const body = this.add.graphics();
            body.fillStyle(0x111827, 1);
            body.fillRoundedRect(-25, 0, 50, 60, 6);
            
            // Lace collar
            const collar = this.add.graphics();
            collar.fillStyle(0xffffff, 1);
            collar.beginPath();
            collar.moveTo(-10, 0);
            collar.lineTo(0, 15);
            collar.lineTo(10, 0);
            collar.closePath();
            collar.fillPath();

            // Face
            const head = this.add.graphics();
            head.fillStyle(0xfde047, 1);
            head.fillCircle(0, -15, 16);

            // Classic curly judicial wig
            const wig = this.add.graphics();
            wig.fillStyle(0xf9fafb, 1);
            wig.lineStyle(2, 0xe5e7eb, 1);
            wig.fillCircle(-16, -18, 11);
            wig.strokeCircle(-16, -18, 11);
            wig.fillCircle(16, -18, 11);
            wig.strokeCircle(16, -18, 11);
            wig.fillCircle(0, -28, 15);
            wig.strokeCircle(0, -28, 15);

            // Hand waving a tiny gavel (just like robed judges in image!)
            const tinyGavel = this.add.graphics();
            tinyGavel.fillStyle(0x78350f, 1); // Brown shaft
            tinyGavel.fillRect(15, -15, 5, 20); // Handle
            tinyGavel.fillStyle(0x451a03, 1); // Oak mallet
            tinyGavel.fillRect(10, -22, 15, 8);

            judgeContainer.add([body, collar, head, wig, tinyGavel]);
            judgeContainer.tinyGavel = tinyGavel;

            this.add.existing(judgeContainer);
            this.galleryJudges.push(judgeContainer);

            // Back-and-forth idle breathing
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

        // Header Title Banner
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

        // Start Game Button
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

        // Start Game Button Interactions
        startBtn.on('pointerover', () => {
            startBtn.setFillStyle(0x15803d);
            startText.setScale(1.05);
        });
        startBtn.on('pointerout', () => {
            startBtn.setFillStyle(0x16a34a);
            startText.setScale(1.0);
        });
        startBtn.on('pointerdown', () => {
            this.playSFX('gavel-hit');
            this.audioManager.playMusic();
            this.transitionToCharacterSelect();
        });

        // Rules Panel
        const controlPanel = this.add.graphics();
        controlPanel.fillStyle(0x18181b, 0.9);
        controlPanel.fillRoundedRect(-450, 140, 900, 180, 8);
        controlPanel.lineStyle(2.5, 0xeab308, 0.5);
        controlPanel.strokeRoundedRect(-450, 140, 900, 180, 8);
        this.menuContainer.add(controlPanel);

        const p1Label = this.add.text(-220, 165, 'PLAYER 1: ROE (Plaintiff)', { fontFamily: '"Press Start 2P"', fontSize: '11px', fill: '#60a5fa' }).setOrigin(0.5);
        const p1Controls = this.add.text(-220, 240, 'Move: A / D | Jump: W (Double-Jump)\nStandard Combo (3-Hit): J key\nPrivacy Shield (Block): Hold S + J\nSuper Substantive Liberty: SPACEBAR', { fontFamily: 'Arial', fontSize: '14px', fill: '#d1d5db', align: 'center', lineSpacing: 5 }).setOrigin(0.5);
        
        const p2Label = this.add.text(220, 165, 'PLAYER 2: WADE (Defendant)', { fontFamily: '"Press Start 2P"', fontSize: '11px', fill: '#fca5a5' }).setOrigin(0.5);
        const p2Controls = this.add.text(220, 240, 'Move: Left / Right | Jump: UP (Double-Jump)\nStandard Combo (3-Hit): 1 key\nSovereign Wall (Block): Hold DOWN + 1\nSuper Police Power: 0 key', { fontFamily: 'Arial', fontSize: '14px', fill: '#d1d5db', align: 'center', lineSpacing: 5 }).setOrigin(0.5);

        this.menuContainer.add([p1Label, p1Controls, p2Label, p2Controls]);

        // Decorative scales banner
        this.menuScales = this.add.graphics();
        this.menuScales.lineStyle(4, 0xca8a04, 0.6);
        this.menuScales.lineBetween(-200, -80, 200, -80);
        this.menuScales.lineBetween(0, -110, 0, 0);
        this.menuContainer.add(this.menuScales);
    }

    transitionToCharacterSelect() {
        this.gameState = 'character_select';
        
        this.tweens.add({
            targets: this.menuContainer,
            scaleX: 0.8,
            scaleY: 0.8,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                this.menuContainer.destroy();
                createCharacterSelectUI(this, (p1Id, p2Id, isVsAI) => {
