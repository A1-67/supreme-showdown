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
        this.superMeter = 0; // 0 to 100
        
        // Fast Recovery Mechanics (low stun)
        this.isStunned = false;
        this.stunDuration = 120; // 120ms Fast recovery
        
        // Archetype Physics Configs
        this.speed = characterId === 'roe' ? 540 : 420; // Roe is agile, Wade is slow/heavy
        this.jumpForce = characterId === 'roe' ? -1100 : -950;
        this.doubleJumpForce = characterId === 'roe' ? -950 : -800;
        this.jumpsRemaining = 2; // Double jump enabled
        this.isGrounded = false;
        
        // Combat states
        this.isAttacking = false;
        this.isSuperActive = false;
        this.facingRight = !isPlayer2;
        this.lastAttackTime = 0;
        this.attackCooldown = 280; // Fast trades
        this.isBlocking = false;
        
        // Combo systems
        this.comboStep = 0;
        this.lastComboHitTime = 0;
        this.comboResetDelay = 800; // ms

        // Special shielding states
        this.isPrivacyShieldActive = false;
        this.isSovereignWallActive = false;

        // Setup internal character naming and damage limits
        this.setupStats();

        // Build precise character design graphics
        this.createVisuals();

        // Speech bubble variables
        this.speechBubble = null;

        // Register with physics engine
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // Rigid Body Physics setup
        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(2300); // Sharp, rapid combat gravity
        this.body.setDragX(1300); // Quick precise movements
        this.body.setSize(100, 210);
        this.body.setOffset(-50, -210); // Offset adjusted to accurately register ground hits

        // Attack Hitbox attached locally to scene physics mapping
        this.attackHitbox = this.scene.add.rectangle(0, -90, 170, 110, 0xff0000, 0);
        this.scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.setAllowGravity(false);
        this.attackHitbox.body.setImmovable(true);
        this.disableAttackHitbox();
    }

    setupStats() {
        if (this.characterId === 'roe') {
            this.charName = 'Jane Roe';
            this.color = 0x2563eb; 
            this.glowingColor = 0x60a5fa; 
            this.damageNormal = 8;
            this.voiceLines = [
                "Precedent, not restriction!",
                "Due Process is absolute!",
                "Privacy is a fundamental right!"
            ];
        } else {
            this.charName = 'Henry Wade';
            this.color = 0xd92626; 
            this.glowingColor = 0xfca5a5; 
            this.damageNormal = 13; 
            this.voiceLines = [
                "Order must prevail!",
                "The State has authority!",
                "The law is absolute!"
            ];
        }
    }

    createVisuals() {
        // Character Body Shape
        this.bodyRect = this.scene.add.rectangle(0, -105, 80, 210, this.color);
        this.bodyRect.setStrokeStyle(4, 0xffffff);

        // Head Layout
        this.headCircle = this.scene.add.circle(0, -240, 35, 0xfef08a);
        this.headCircle.setStrokeStyle(3, 0xffffff);

        // Add elements into container hierarchy
        this.add([this.bodyRect, this.headCircle]);

        // Name tag indicators attached overhead
        this.nameTag = this.scene.add.text(0, -310, this.charName, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.add(this.nameTag);
    }

    move(dir) {
        if (this.isStunned || this.isAttacking || this.isPrivacyShieldActive || this.isSovereignWallActive) {
            this.body.setVelocityX(0);
            return;
        }

        this.body.setVelocityX(dir * this.speed);
        if (dir !== 0) {
            this.facingRight = dir > 0;
            this.bodyRect.scaleX = this.facingRight ? 1 : -1;
            this.headCircle.scaleX = this.facingRight ? 1 : -1;
        }
    }

    jump() {
        if (this.isStunned || this.isPrivacyShieldActive || this.isSovereignWallActive) return;

        if (this.isGrounded) {
            this.body.setVelocityY(this.jumpForce);
            this.jumpsRemaining = 1;
            this.isGrounded = false;
        } else if (this.jumpsRemaining > 0) {
            this.body.setVelocityY(this.doubleJumpForce);
            this.jumpsRemaining = 0;
        }
    }

    triggerAttack() {
        const now = this.scene.time.now;
        if (this.isStunned || this.isAttacking || now - this.lastAttackTime < this.attackCooldown) return;

        this.isAttacking = true;
        this.lastAttackTime = now;

        // Apply slight lunge physics momentum forward on basic checks
        const lunge = this.facingRight ? 300 : -300;
        this.body.setVelocityX(lunge);

        this.enableAttackHitbox();
        this.showAttackFlash();

        this.scene.time.delayedCall(150, () => {
            this.disableAttackHitbox();
            this.isAttacking = false;
        });
    }

    triggerSpecialShield() {
        if (this.isStunned || this.isAttacking) return;
        this.isBlocking = true;
        this.body.setVelocityX(0);
        
        if (this.characterId === 'roe') {
            this.isPrivacyShieldActive = true;
        } else {
            this.isSovereignWallActive = true;
        }

        this.bodyRect.setAlpha(0.5);

        this.scene.time.delayedCall(300, () => {
            this.isPrivacyShieldActive = false;
            this.isSovereignWallActive = false;
            this.isBlocking = false;
            this.bodyRect.setAlpha(1);
        });
    }

    triggerSuperMove() {
        if (this.superMeter < 100 || this.isStunned || this.isSuperActive) return;
        this.superMeter = 0;
        this.isSuperActive = true;
        this.body.setVelocity(0, 0);

        this.scene.playSFX('super-charge');
        this.scene.cameras.main.flash(300, this.color);

        // Huge structural attack projectile simulation 
        const superZone = this.scene.add.rectangle(this.x + (this.facingRight ? 300 : -300), this.y - 100, 600, 200, this.color, 0.4);
        this.scene.physics.add.existing(superZone);
        superZone.body.setAllowGravity(false);

        const opponent = this.scene.player1 === this ? this.scene.player2 : this.scene.player1;
        
        this.scene.time.delayedCall(150, () => {
            if (this.scene.physics.overlap(superZone, opponent)) {
                opponent.takeDamage(35, 'CRITICAL VERDICT!');
                this.scene.cheerSpectators();
            }
            superZone.destroy();
            this.isSuperActive = false;
        });
    }

    takeDamage(amount, reason = '') {
        if (this.isBlocking) {
            amount = Math.floor(amount * 0.15);
            this.scene.showPopupText(this.x, this.y - 280, 'BLOCKED!', '#ffffff');
        }

        this.health = Math.max(0, this.health - amount);
        this.isStunned = true;

        // Apply brief hitstun recoil
        const pushDir = this.facingRight ? -250 : 250;
        this.body.setVelocityX(pushDir);

        this.bodyRect.setFillStyle(0xff0000);
        this.scene.time.delayedCall(this.stunDuration, () => {
            this.bodyRect.setFillStyle(this.color);
            this.isStunned = false;
        });

        // Generate damage popups
        this.scene.showPopupText(this.x, this.y - 240, `-${amount}`, '#ef4444');
        if (reason) {
            this.scene.showPopupText(this.x, this.y - 200, reason, '#fde047');
        }
    }

    showAttackFlash() {
        const flashX = this.x + (this.facingRight ? 90 : -90);
        const flashY = this.y - 105;
        const flash = this.scene.add.circle(flashX, flashY, 40, this.glowingColor, 0.7);
        this.scene.tweens.add({
            targets: flash,
            scaleX: 1.8,
            scaleY: 1.8,
            alpha: 0,
            duration: 120,
            onComplete: () => flash.destroy()
        });
    }

    enableAttackHitbox() {
        const offset = this.facingRight ? 90 : -90;
        this.attackHitbox.x = this.x + offset;
        this.attackHitbox.y = this.y - 105;
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
        // Fast dynamic alignment tracking to manage floor check boundaries safely
        if (this.body.blocked.down || this.body.touching.down) {
            this.isGrounded = true;
            this.jumpsRemaining = 2;
        } else {
            this.isGrounded = false;
        }
    }
}
