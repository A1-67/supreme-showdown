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

        this.setupStats();
        this.createImportedModelVisuals();
        this.createHitboxes();

        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(2300);
        this.body.setDragX(1300);
        
        // Match physics box boundaries to the sprite size
        this.body.setSize(120, 240);
        this.body.setOffset(-60, -240);
    }

    setupStats() {
        if (this.characterId === 'roe') {
            this.charName = 'Jane Roe';
            this.colorAccent = 0x60a5fa;
            this.damageNormal = 8;
            this.modelKey = 'char-roe';
        } else {
            this.charName = 'Henry Wade';
            this.colorAccent = 0xfca5a5;
            this.damageNormal = 13;
            this.modelKey = 'char-wade';
        }
    }

    createImportedModelVisuals() {
        // --- ADD THE LOADED CHARACTER SPRITE/MODEL TO CONTAINER ---
        this.spriteModel = this.scene.add.sprite(0, 0, this.modelKey);
        this.spriteModel.setOrigin(0.5, 1); // Ground origin alignment

        // Adjust dimensions to fit the gameplay grid scale perfectly
        this.spriteModel.setDisplaySize(160, 250);

        // Blocking/Shield FX layer
        this.shieldAura = this.scene.add.graphics();
        this.shieldAura.lineStyle(6, this.colorAccent, 0.85);
        this.shieldAura.strokeCircle(0, -120, 120);
        this.shieldAura.fillStyle(this.colorAccent, 0.15);
        this.shieldAura.fillCircle(0, -120, 120);
        this.shieldAura.setVisible(false);

        // Pack elements into container layout
        this.add([this.spriteModel, this.shieldAura]);

        // Overhead UI tag
        this.nameTag = this.scene.add.text(0, -280, this.charName, {
            fontFamily: '"Press Start 2P"',
            fontSize: '13px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.add(this.nameTag);

        this.updateVisualFacing();
    }

    createHitboxes() {
        this.attackHitbox = this.scene.add.rectangle(0, -120, 200, 120, 0xff0000, 0);
        this.scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.setAllowGravity(false);
        this.attackHitbox.body.setImmovable(true);
        this.disableAttackHitbox();
    }

    updateVisualFacing() {
        // Flip the loaded 2D model sprite depending on player position tracking
        this.spriteModel.scaleX = this.facingRight ? 1 : -1;
    }

    move(dir) {
        if (this.isStunned || this.isAttacking || this.isBlocking || this.isSuperActive) {
            this.body.setVelocityX(0);
            return;
        }

        this.body.setVelocityX(dir * this.speed);
        if (dir !== 0) {
            const requestedFacing = dir > 0;
            if (this.facingRight !== requestedFacing) {
                this.facingRight = requestedFacing;
                this.updateVisualFacing();
            }
            
            // Walking tilt effect
            this.spriteModel.angle = Math.sin(this.scene.time.now * 0.02) * 4;
        } else {
            this.spriteModel.angle = 0; // Reset idle angle
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

        const lunge = this.facingRight ? 350 : -350;
        this.body.setVelocityX(lunge);

        this.enableAttackHitbox();
        this.showAttackFlash();

        // High speed forward attack punch scaling lunge tween
        this.scene.tweens.add({
            targets: this.spriteModel,
            scaleX: this.facingRight ? 1.3 : -1.3,
            scaleY: 1.1,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.updateVisualFacing();
                this.spriteModel.scaleY = 1;
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
        this.scene.cameras.main.flash(350, this.colorAccent);

        const superZone = this.scene.add.rectangle(this.x + (this.facingRight ? 320 : -320), this.y - 120, 640, 240, this.colorAccent, 0.4);
        superZone.setStrokeStyle(5, 0xffffff);
        this.scene.physics.add.existing(superZone);
        superZone.body.setAllowGravity(false);

        // Spin model texture during ultimate activation frame
        this.scene.tweens.add({
            targets: this.spriteModel,
            angle: this.facingRight ? 360 : -360,
            duration: 400
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
                duration: 150,
                onComplete: () => {
                    superZone.destroy();
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

        this.spriteModel.setTint(0xef4444); // Flash imported texture red on hit
        this.scene.time.delayedCall(this.stunDuration, () => {
            this.spriteModel.clearTint();
            this.isStunned = false;
        });

        this.scene.showPopupText(this.x, this.y - 240, `-${amount}`, '#ef4444');
        if (reason) {
            this.scene.showPopupText(this.x, this.y - 200, reason, '#fde047');
        }
    }

    showAttackFlash() {
        const flashX = this.x + (this.facingRight ? 95 : -95);
        const flashY = this.y - 120;
        const flash = this.scene.add.circle(flashX, flashY, 45, this.colorAccent, 0.65);
        this.scene.tweens.add({
            targets: flash, scaleX: 2, scaleY: 2, alpha: 0, duration: 140, onComplete: () => flash.destroy()
        });
    }

    enableAttackHitbox() {
        const offset = this.facingRight ? 100 : -100;
        this.attackHitbox.x = this.x + offset;
        this.attackHitbox.y = this.y - 120;
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

        if (this.isBlocking) {
            this.shieldAura.alpha = 0.4 + (Math.sin(this.scene.time.now * 0.02) * 0.25);
        }
    }

    showJumpParticles() {
        const p = this.scene.add.circle(this.x, this.y, 16, 0xffffff, 0.5);
        this.scene.tweens.add({
            targets: p, scaleX: 3, scaleY: 0.3, alpha: 0, y: this.y + 12, duration: 220, onComplete: () => p.destroy()
        });
    }
}
