import Phaser from 'phaser';

export class Fighter extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {string} characterId - 'roe' | 'wade'
     * @param {boolean} isPlayer2
     * @param {boolean} isAI
     */
    constructor(scene, x, y, characterId, isPlayer2 = false, isAI = false) {
        super(scene, x, y);
        this.scene = scene;
        this.characterId = characterId;
        this.isPlayer2 = isPlayer2;
        this.isAI = isAI;

        // Core Combat Stats & Configuration
        this.maxHealth = 100;
        this.health = 100;
        this.superMeter = 0;
        
        this.isStunned = false;
        this.stunDuration = 120;
        
        this.speed = characterId === 'roe' ? 540 : 420;
        this.jumpForce = characterId === 'roe' ? -1100 : -950;
        this.doubleJumpForce = characterId === 'roe' ? -950 : -800;
        this.jumpsRemaining = 2;
        this.isGrounded = false;
        
        this.isAttacking = false;
        this.isSuperActive = false;
        this.facingRight = !isPlayer2;
        this.lastAttackTime = 0;
        this.attackCooldown = 280;
        this.isBlocking = false;
        
        this.isPrivacyShieldActive = false;
        this.isSovereignWallActive = false;

        this.setupStats();
        this.createAdvancedVisuals();
        this.createHitboxes();

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(2300);
        this.body.setDragX(1300);
        this.body.setSize(100, 220);
        this.body.setOffset(-50, -220);
    }

    setupStats() {
        if (this.characterId === 'roe') {
            this.charName = 'Jane Roe';
            this.colorBase = 0x1e40af;       // Deep Judicial Blue
            this.colorAccent = 0x60a5fa;     // Light Blue Highlights
            this.damageNormal = 8;
        } else {
            this.charName = 'Henry Wade';
            this.colorBase = 0x991b1b;       // Deep State Crimson
            this.colorAccent = 0xfca5a5;     // Pink/Red Highlights
            this.damageNormal = 13;
        }
    }

    createAdvancedVisuals() {
        // --- 1. BASE BODY & JUDICIAL ROBES LAYERING ---
        this.robeShadow = this.scene.add.rectangle(0, -100, 90, 200, 0x111827, 0.4);
        this.robeMain = this.scene.add.rectangle(0, -105, 80, 210, this.colorBase);
        this.robeMain.setStrokeStyle(4, 0xffffff);

        // Robe pleats (Vertical geometric lines for texture)
        this.pleatLeft = this.scene.add.rectangle(-20, -105, 8, 190, 0x111827, 0.25);
        this.pleatRight = this.scene.add.rectangle(20, -105, 8, 190, 0x111827, 0.25);

        // White Jabot / Legal Collar
        this.legalCollar = this.scene.add.graphics();
        this.legalCollar.fillStyle(0xffffff, 1);
        this.legalCollar.beginPath();
        this.legalCollar.moveTo(-15, -200);
        this.legalCollar.lineTo(15, -200);
        this.legalCollar.lineTo(25, -160);
        this.legalCollar.lineTo(0, -145);
        this.legalCollar.lineTo(-25, -160);
        this.legalCollar.closePath();
        this.legalCollar.fillPath();
        this.legalCollar.lineStyle(2, 0xd1d5db, 1);
        this.legalCollar.strokePath();

        // --- 2. ADVANCED CHARACTER HEAD & HAIR MODELS ---
        this.headCircle = this.scene.add.circle(0, -240, 32, 0xfef08a);
        this.headCircle.setStrokeStyle(3, 0x78350f);

        this.hairGraphics = this.scene.add.graphics();
        if (this.characterId === 'roe') {
            // Jane Roe - Flowing Liberty Hair Locks
            this.hairGraphics.fillStyle(0x78350f, 1); // Auburn/Brown
            this.hairGraphics.fillCircle(-25, -235, 16);
            this.hairGraphics.fillCircle(25, -235, 16);
            this.hairGraphics.fillCircle(0, -270, 25);
            // Flowing back curls
            this.hairGraphics.fillRoundedRect(-38, -230, 20, 70, 8);
            this.hairGraphics.fillRoundedRect(18, -230, 20, 70, 8);
        } else {
            // Henry Wade - Formal Powdered Court Wig & Glasses
            this.hairGraphics.fillStyle(0xe5e7eb, 1); // Powder White
            this.hairGraphics.fillCircle(-28, -245, 15);
            this.hairGraphics.fillCircle(-28, -225, 14);
            this.hairGraphics.fillCircle(28, -245, 15);
            this.hairGraphics.fillCircle(28, -225, 14);
            this.hairGraphics.fillCircle(0, -272, 28);
            
            // Wireframe Glasses Overlay
            this.hairGraphics.lineStyle(2.5, 0x1f2937, 1);
            this.hairGraphics.strokeCircle(-12, -242, 8);
            this.hairGraphics.strokeCircle(12, -242, 8);
            this.hairGraphics.lineBetween(-4, -242, 4, -242);
        }

        // --- 3. DYNAMICALLY HELD COMBAT OBJECTS (WEAPONS) ---
        this.weaponContainer = this.scene.add.container(40, -120);
        this.weaponVisual = this.scene.add.graphics();
        
        if (this.characterId === 'roe') {
            // Golden Scales of Justice
            this.weaponVisual.lineStyle(4, 0xf59e0b, 1);
            this.weaponVisual.lineBetween(0, -30, 0, 30); // Center Beam
            this.weaponVisual.lineBetween(-30, -20, 30, -20); // Crossbar
            this.weaponVisual.fillStyle(0xd97706, 1);
            this.weaponVisual.fillCircle(-30, -5, 10); // Left Scale Pan
            this.weaponVisual.fillCircle(30, -5, 10);  // Right Scale Pan
        } else {
            // Heavy Mahogany Executive Gavel
            this.weaponVisual.fillStyle(0x78350f, 1);
            this.weaponVisual.fillRect(-6, -40, 12, 70); // Handle
            this.weaponVisual.fillStyle(0x451a03, 1);
            this.weaponVisual.fillRoundedRect(-25, -50, 50, 24, 4); // Gavel Head
            this.weaponVisual.lineStyle(2, 0xf59e0b, 1);
            this.weaponVisual.strokeRoundedRect(-25, -50, 50, 24, 4);
        }
        this.weaponContainer.add(this.weaponVisual);

        // --- 4. STRUCTURAL SHIELDING EFFECTS ---
        this.shieldAura = this.scene.add.graphics();
        this.shieldAura.lineStyle(6, this.colorAccent, 0.85);
        this.shieldAura.strokeCircle(0, -110, 115);
        this.shieldAura.fillStyle(this.colorAccent, 0.15);
        this.shieldAura.fillCircle(0, -110, 115);
        this.shieldAura.setVisible(false);

        // Add everything to structural hierarchy layout array
        this.add([
            this.robeShadow, this.robeMain, this.pleatLeft, this.pleatRight,
            this.legalCollar, this.hairGraphics, this.headCircle, 
            this.weaponContainer, this.shieldAura
        ]);

        // Overhead Name Tag UI
        this.nameTag = this.scene.add.text(0, -320, this.charName, {
            fontFamily: '"Press Start 2P"',
            fontSize: '13px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.add(this.nameTag);

        // Flip configuration correction adjustment
        if (!this.facingRight) {
            this.flipVisualLayout();
        }
    }

    createHitboxes() {
        this.attackHitbox = this.scene.add.rectangle(0, -110, 190, 120, 0xff0000, 0);
        this.scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.setAllowGravity(false);
        this.attackHitbox.body.setImmovable(true);
        this.disableAttackHitbox();
    }

    flipVisualLayout() {
        const scaleXVal = this.facingRight ? 1 : -1;
        this.robeMain.scaleX = scaleXVal;
        this.headCircle.scaleX = scaleXVal;
        this.hairGraphics.scaleX = scaleXVal;
        this.legalCollar.scaleX = scaleXVal;
        this.pleatLeft.scaleX = scaleXVal;
        this.pleatRight.scaleX = scaleXVal;
        
        // Flip weapon arm orientation smoothly
        this.weaponContainer.x = this.facingRight ? 40 : -40;
        this.weaponContainer.scaleX = scaleXVal;
    }

    move(dir) {
        if (this.isStunned || this.isAttacking || this.isBlocking || this.isSuperActive) {
            this.body.setVelocityX(0);
            return;
        }

        this.body.setVelocityX(dir * this.speed);
        if (dir !== 0) {
            const requestedDirection = dir > 0;
            if (this.facingRight !== requestedDirection) {
                this.facingRight = requestedDirection;
                this.flipVisualLayout();
            }
            
            // Idle bounce simulation effect during active travel velocity
            const bobOffset = Math.sin(this.scene.time.now * 0.015) * 3;
            this.headCircle.y = -240 + bobOffset;
            this.hairGraphics.y = bobOffset;
            this.weaponContainer.y = -120 + (bobOffset * 1.5);
        }
    }

    jump() {
        if (this.isStunned || this.isBlocking || this.isSuperActive) return;

        if (this.isGrounded) {
            this.body.setVelocityY(this.jumpForce);
            this.jumpsRemaining = 1;
            this.isGrounded = false;
        } else if (this.jumpsRemaining > 0) {
            this.body.setVelocityY(this.doubleJumpForce);
            this.jumpsRemaining = 0;
            this.showJumpParticles();
        }
    }

    triggerAttack() {
        const now = this.scene.time.now;
        if (this.isStunned || this.isBlocking || this.isAttacking || now - this.lastAttackTime < this.attackCooldown) return;

        this.isAttacking = true;
        this.lastAttackTime = now;

        // Propel model forward during active physical swing execution loops
        const lunge = this.facingRight ? 350 : -350;
        this.body.setVelocityX(lunge);

        this.enableAttackHitbox();
        this.showAttackFlash();

        // Animate the held legal weapon item using a rapid rotational frame swing
        this.scene.tweens.add({
            targets: this.weaponContainer,
            angle: this.facingRight ? 85 : -85,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 90,
            yoyo: true,
            repeat: 0,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.weaponContainer.angle = 0;
                this.weaponContainer.setScale(1);
                this.disableAttackHitbox();
                this.isAttacking = false;
            }
        });
    }

    triggerSpecialShield() {
        if (this.isStunned || this.isAttacking || this.isSuperActive) return;
        this.isBlocking = true;
        this.body.setVelocityX(0);
        
        this.shieldAura.setVisible(true);

        // Visual pulse feedback during shield lock intervals
        this.shieldAura.alpha = 0.3 + (Math.sin(this.scene.time.now * 0.03) * 0.2);

        this.scene.time.delayedCall(300, () => {
            this.shieldAura.setVisible(false);
            this.isBlocking = false;
        });
    }

    triggerSuperMove() {
        if (this.superMeter < 100 || this.isStunned || this.isSuperActive) return;
        this.superMeter = 0;
        this.isSuperActive = true;
        this.body.setVelocity(0, 0);

        this.scene.playSFX('super-charge');
        this.scene.cameras.main.flash(350, this.colorBase);

        // Huge structural field projection representation bounding boxes
        const superZone = this.scene.add.rectangle(this.x + (this.facingRight ? 320 : -320), this.y - 110, 640, 220, this.colorBase, 0.45);
        superZone.setStrokeStyle(5, 0xffffff);
        this.scene.physics.add.existing(superZone);
        superZone.body.setAllowGravity(false);

        // Intense weapon spinning cinematic translation
        this.scene.tweens.add({
            targets: this.weaponContainer,
            angle: this.facingRight ? 360 : -360,
            scaleX: 2.2,
            scaleY: 2.2,
            duration: 400,
            ease: 'Quad.easeInOut'
        });

        const opponent = this.scene.player1 === this ? this.scene.player2 : this.scene.player1;
        
        this.scene.time.delayedCall(250, () => {
            if (this.scene.physics.overlap(superZone, opponent)) {
                opponent.takeDamage(35, 'CRITICAL VERDICT!');
                this.scene.cheerSpectators();
            }
            this.scene.tweens.add({
                targets: superZone,
                alpha: 0,
                scaleY: 0,
                duration: 150,
                onComplete: () => {
                    superZone.destroy();
                    this.weaponContainer.angle = 0;
                    this.weaponContainer.setScale(1);
                    this.isSuperActive = false;
                }
            });
        });
    }

    takeDamage(amount, reason = '') {
        if (this.isBlocking) {
            amount = Math.floor(amount * 0.15);
            this.scene.showPopupText(this.x, this.y - 280, 'BLOCKED!', '#ffffff');
            return;
        }

        this.health = Math.max(0, this.health - amount);
        this.isStunned = true;

        const pushDir = this.facingRight ? -280 : 280;
        this.body.setVelocityX(pushDir);

        // Flash solid color tint during hitstun processing windows
        this.robeMain.setFillStyle(0xef4444);
        this.scene.time.delayedCall(this.stunDuration, () => {
            this.robeMain.setFillStyle(this.colorBase);
            this.isStunned = false;
        });

        this.scene.showPopupText(this.x, this.y - 240, `-${amount}`, '#ef4444');
        if (reason) {
            this.scene.showPopupText(this.x, this.y - 200, reason, '#fde047');
        }
    }

    showAttackFlash() {
        const flashX = this.x + (this.facingRight ? 95 : -95);
        const flashY = this.y - 110;
        const flash = this.scene.add.circle(flashX, flashY, 45, this.colorAccent, 0.65);
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2.0,
            scaleY: 2.0,
            alpha: 0,
            duration: 140,
            onComplete: () => flash.destroy()
        });
    }

    enableAttackHitbox() {
        const offset = this.facingRight ? 100 : -100;
        this.attackHitbox.x = this.x + offset;
        this.attackHitbox.y = this.y - 110;
        this.attackHitbox.body.enable = true;
    }

    disableAttackHitbox() {
        if (this.attackHitbox && this.attackHitbox.body) {
            this.attackHitbox.body.enable = false;
            this.attackHitbox.x = -5000;
            this.attackHitbox.y = -5000;
        }
    }

    update() {
        if (this.body.blocked.down || this.body.touching.down) {
            this.isGrounded = true;
            this.jumpsRemaining = 2;
        } else {
            this.isGrounded = false;
        }

        // Continually check blocking status to update shield aura positions dynamically
        if (this.isBlocking) {
            this.shieldAura.alpha = 0.4 + (Math.sin(this.scene.time.now * 0.02) * 0.25);
        }
    }

    showJumpParticles() {
        const p = this.scene.add.circle(this.x, this.y, 16, 0xffffff, 0.5);
        this.scene.tweens.add({
            targets: p,
            scaleX: 3.0,
            scaleY: 0.3,
            alpha: 0,
            y: this.y + 12,
            duration: 220,
            onComplete: () => p.destroy()
        });
    }
}
