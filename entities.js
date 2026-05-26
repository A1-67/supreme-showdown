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
        this.characterId = characterId; // Preserves the exact selected character configuration
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
        this.jumpForce = characterId === 'roe' ? -1000 : -850;
        this.doubleJumpForce = characterId === 'roe' ? -900 : -750;
        this.jumpsRemaining = 2; // Double jump enabled
        this.isGrounded = false;
        
        // Combat Timers & Attack State
        this.isAttacking = false;
        this.attackComboStage = 0; // 0, 1, 2 for 3-hit standard combos
        this.lastAttackTime = 0;
        this.isBlocking = false;
        this.superMoveActive = false;

        this.setupStats();
        this.createVisuals();
        this.createHitboxes();
    }

    setupStats() {
        // Safe check initialization using incoming component criteria
        if (this.characterId === 'roe') {
            this.charName = 'Jane Roe';
            this.damageNormal = 7;
            this.damageSuper = 32;
            this.glowingColor = 0x3b82f6; // Blue Justice theme
            this.attackText = 'PRIVACY RIGHT!';
            this.superText = 'SUBSTANTIVE DUE PROCESS!!!';
        } else {
            // FIXED: Removed the forced hardcoded ID overwrite bug
            this.charName = 'Henry Wade';
            this.damageNormal = 11; // Hits harder but moves slower
            this.damageSuper = 40;
            this.glowingColor = 0xef4444; // Red State Power theme
            this.attackText = 'POLICE POWER!';
            this.superText = 'SOVEREIGN INTEREST!!!';
        }
        this.facingRight = !this.isPlayer2;
    }

    createVisuals() {
        // Base Character Block Body (1080p high fidelity alignment)
        this.bodyRect = this.scene.add.rectangle(0, -90, 80, 180, this.glowingColor);
        this.bodyRect.setStrokeStyle(4, 0xffffff);

        // Character Ornate Head Layout
        this.headCircle = this.scene.add.circle(0, -210, 35, 0xfef08a);
        this.headCircle.setStrokeStyle(3, 0xffffff);

        // Gavel / Legal Scales insignia vector branding on chest
        this.insignia = this.scene.add.graphics();
        this.insignia.lineStyle(3, 0xffffff, 0.7);
        this.insignia.lineBetween(-15, -100, 15, -100);
        this.insignia.lineBetween(0, -115, 0, -75);

        // Shield aura layout initialization (hidden by default)
        this.shieldGraphic = this.scene.add.circle(0, -90, 110, 0xffffff, 0);
        this.shieldGraphic.setStrokeStyle(5, this.glowingColor);
        this.shieldGraphic.setVisible(false);

        // Add visual assets into local container coordinates hierarchy
        this.add([this.bodyRect, this.headCircle, this.insignia, this.shieldGraphic]);

        // Name tag indicators attached overhead
        this.nameTag = this.scene.add.text(0, -280, this.charName, {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.add(this.nameTag);
    }

    createHitboxes() {
        // Instantiate invisible physical zone for standard attacks
        this.attackHitbox = this.scene.add.rectangle(-5000, -5000, 110, 90, 0xffffff, 0);
        this.scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.setAllowGravity(false);
        this.attackHitbox.body.enable = false;
    }

    move(direction) {
        if (this.isStunned || this.isAttacking || this.isBlocking || this.superMoveActive) {
            return;
        }

        if (direction !== 0) {
            this.body.setVelocityX(direction * this.speed);
            this.facingRight = direction > 0;
            
            // Flip graphics smoothly depending on travel heading
            this.bodyRect.scaleX = this.facingRight ? 1 : -1;
            this.headCircle.scaleX = this.facingRight ? 1 : -1;
        } else {
            // Fast slide damping for precision combat handling
            this.body.setVelocityX(0);
        }
    }

    jump() {
        if (this.isStunned || this.isBlocking || this.superMoveActive) return;

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
        if (this.isStunned || this.isBlocking || this.isAttacking || this.superMoveActive) return;

        this.isAttacking = true;
        this.lastAttackTime = now;

        // Multi-stage branching combo animation scaling
        this.attackComboStage = (this.attackComboStage + 1) % 3;
        
        // lunge slightly forward on physical lunges
        const lungeVel = this.facingRight ? 250 : -250;
        this.body.setVelocityX(lungeVel);

        this.showAttackFlash();
        this.enableAttackHitbox();

        // Standard short combat execution duration window
        this.scene.time.delayedCall(160, () => {
            this.disableAttackHitbox();
            this.isAttacking = false;
            this.body.setVelocityX(0);
        });
    }

    triggerSpecialShield() {
        if (this.isStunned || this.isAttacking || this.superMoveActive) return;

        this.isBlocking = true;
        this.body.setVelocityX(0);
        this.shieldGraphic.setVisible(true);
        this.shieldGraphic.setAlpha(0.85);

        // Block holds stance lock briefly 
        this.scene.time.delayedCall(300, () => {
            this.shieldGraphic.setVisible(false);
            this.isBlocking = false;
        });
    }

    triggerSuperMove() {
        if (this.isStunned || this.superMoveActive) return;

        this.superMoveActive = true;
        this.superMeter = 0; // Burn the entire super block meter cleanly
        this.body.setVelocity(0, 0);

        this.scene.playSFX('super-charge');

        // Cinematic screen freeze zoom effect representation
        this.scene.cameras.main.flash(400, this.glowingColor & 0xffffff);

        // Huge structural attack projectile simulation dimension boundaries
        const superZone = this.scene.add.rectangle(this.x, this.y - 90, 650, 250, this.glowingColor, 0.35);
        superZone.setStrokeStyle(4, 0xffffff);
        this.scene.physics.add.existing(superZone);
        superZone.body.setAllowGravity(false);

        // Align super attack offset relative to fighter facing aspect direction
        if (!this.facingRight) {
            superZone.x -= 250;
        } else {
            superZone.x += 250;
        }

        this.scene.showPopupText(this.x, this.y - 320, this.superText, '#fde047');

        // Check for immediate super hit registration overlap boundaries against opposing player
        const opponent = this.scene.player1 === this ? this.scene.player2 : this.scene.player1;
        
        this.scene.time.delayedCall(100, () => {
            if (this.scene.physics.overlap(superZone, opponent)) {
                opponent.takeDamage(this.damageSuper, 'CRITICAL VERDICT!');
                this.scene.cheerSpectators();
            }
        });

        this.scene.time.delayedCall(600, () => {
            superZone.destroy();
            this.superMoveActive = false;
        });
    }

    takeDamage(amount, reason = '') {
        if (this.isBlocking) {
            // Mitigate damage heavily if blocking
            amount = Math.floor(amount * 0.15);
            this.scene.showPopupText(this.x, this.y - 280, 'BLOCKED!', '#ffffff');
            return;
        }

        this.health = Math.max(0, this.health - amount);
        this.isStunned = true;

        // Apply brief hitstun backward recoil push mechanics
        const pushDir = this.facingRight ? -300 : 300;
        this.body.setVelocityX(pushDir);

        // Flash Red on Hit
        this.bodyRect.setFillStyle(0xff0000);
        this.scene.time.delayedCall(this.stunDuration, () => {
            this.bodyRect.setFillStyle(this.glowingColor);
            this.isStunned = false;
        });

        // Generate damage popups text inside engine world layer space
        const popX = this.x;
        const popY = this.y - 240;
        const t = this.scene.add.text(popX, popY, `-${amount}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#ef4444',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: t,
            y: popY - 60,
            alpha: 0,
            duration: 600,
            ease: 'Quad.easeOut',
            onComplete: () => t.destroy()
        });

        if (reason) {
            this.scene.showPopupText(popX, popY - 40, reason, this.characterId === 'roe' ? '#60a5fa' : '#ef4444');
        }
    }

    showAttackFlash() {
        const flashX = this.x + (this.facingRight ? 90 : -90);
        const flashY = this.y - 90;
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
        this.attackHitbox.y = this.y - 90;
        this.attackHitbox.body.enable = true;
    }

    disableAttackHitbox() {
        if (this.attackHitbox && this.attackHitbox.body) {
            this.attackHitbox.body.enable = false;
            this.attackHitbox.x = -5000;
            this.attackHitbox.y = -5000;
        }
    }

    gainSuperMeter(amount) {
        this.superMeter = Math.min(100, this.superMeter + amount);
    }

    update(opponent) {
        // Fast dynamic alignment tracking to make sure ground state flags don't lock up
        if (this.body.touching.down || this.body.blocked.down) {
            this.isGrounded = true;
            this.jumpsRemaining = 2; // Reset jump tracking cache loop counter safely
        } else {
            this.isGrounded = false;
        }

        // Auto-orient characters to face each other dynamically when neutral idle
        if (!this.isStunned && !this.isAttacking && !this.isBlocking && !this.superMoveActive && opponent) {
            this.facingRight = this.x < opponent.x;
            this.bodyRect.scaleX = this.facingRight ? 1 : -1;
            this.headCircle.scaleX = this.facingRight ? 1 : -1;
        }
    }

    showJumpParticles() {
        const p = this.scene.add.circle(this.x, this.y, 15, 0xffffff, 0.6);
        this.scene.tweens.add({
            targets: p,
            scaleX: 2.5,
            scaleY: 0.5,
            alpha: 0,
            y: this.y + 10,
            duration: 200,
            onComplete: () => p.destroy()
        });
    }
}
