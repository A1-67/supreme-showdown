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
        this.jumpForce = characterId === 'roe' ? -1000 : -850;
        this.doubleJumpForce = characterId === 'roe' ? -900 : -750;
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

        // Custom stats Setup
        this.setupStats();

        // Build precise character design graphics
        this.createVisuals();

        // Speech bubble variables
        this.speechBubble = null;

        // Register with physics engine
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // Physics settings
        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(2300); // Sharp, rapid combat gravity
        this.body.setDragX(1300); // Quick precise movements
        this.body.setSize(100, 210);
        this.body.setOffset(-50, -150);

        // Attack Hitbox
        this.attackHitbox = this.scene.add.rectangle(0, -75, 170, 110, 0xff0000, 0);
        this.scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.setAllowGravity(false);
        this.attackHitbox.body.setImmovable(true);
        this.disableAttackHitbox();
    }

    setupStats() {
        if (this.characterId === 'roe') {
            this.charName = 'Roe';
            this.color = 0x2563eb; // Royal blue
            this.glowingColor = 0x60a5fa; // Glowing cyan/light-blue
            this.damageNormal = 8;
            
            this.voiceLines = [
                "Precedent, not restriction!",
                "Due Process is absolute!",
                "The individual must be free!",
                "Privacy is a fundamental right!"
            ];
        } else {
            this.characterId = 'wade';
            this.charName = 'Wade';
            this.color = 0xd92626; // Burning red
            this.glowingColor = 0xfca5a5; // Red/orange glow
            this.damageNormal = 13; // Stronger hits
            
            this.voiceLines = [
                "Order must prevail!",
                "The State has authority!",
                "To preserve the union!",
                "The law is absolute!"
            ];
        }
    }

    createVisuals() {
        // Drop Shadow
        this.shadow = this.scene.add.ellipse(0, 0, 120, 20, 0x000000, 0.45);
        this.add(this.shadow);

        // Body flipped container
        this.spriteBody = this.scene.add.container(0, 0);
        this.add(this.spriteBody);

        // Super Ready circular aura overlay
        this.aura = this.scene.add.graphics();
        this.aura.fillStyle(this.glowingColor, 0.15);
        this.aura.fillCircle(0, -90, 110);
        this.aura.lineStyle(3, this.glowingColor, 0.55);
        this.aura.strokeCircle(0, -90, 110);
        this.aura.setVisible(false);
        this.spriteBody.add(this.aura);

        // Character specific graphics
        if (this.characterId === 'roe') {
            // ROE (Plaintiff): Long flowing dark hair, sleek tailored modern blue-indigo outfit, sash waist, flowing navy cloak with Bill of Rights abstract embroidery patterns
            
            // Flowing Navy Cloak (Adorned back layer)
            this.cloak = this.scene.add.graphics();
            this.cloak.fillStyle(0x1e3a8a, 1); // Deep Navy Blue
            this.cloak.lineStyle(2.5, 0x93c5fd, 0.9); // Silver/Cyan lining
            this.cloak.beginPath();
            this.cloak.moveTo(-15, -130);
            this.cloak.lineTo(-75, -25);
            this.cloak.lineTo(-30, -5);
            this.cloak.lineTo(5, -115);
            this.cloak.closePath();
            this.cloak.fillPath();
            this.cloak.strokePath();

            // Glow patterns representing "Bill of Rights"
            this.cloak.fillStyle(0xfde047, 0.85); // Golden emblems
            this.cloak.fillCircle(-45, -75, 4.5);
            this.cloak.fillCircle(-60, -45, 3.5);
            this.cloak.fillCircle(-35, -35, 5);
            this.cloak.fillCircle(-50, -100, 3);
            this.spriteBody.add(this.cloak);

            // Tailored blue-indigo trousers
            this.legs = this.scene.add.graphics();
            this.legs.fillStyle(0x312e81, 1); // Indigo
            this.legs.lineStyle(3, 0x1e1b4b, 1);
            // Left leg (Agile kick ready stance)
            this.legs.fillRoundedRect(-22, -45, 18, 47, 4);
            this.legs.strokeRoundedRect(-22, -45, 18, 47, 4);
            // Right leg
            this.legs.fillRoundedRect(8, -45, 18, 47, 4);
            this.legs.strokeRoundedRect(8, -45, 18, 47, 4);
            this.spriteBody.add(this.legs);

            // Sleek blue wrapped blazer/outfit
            this.blazer = this.scene.add.graphics();
            this.blazer.fillStyle(0x2563eb, 1); // Royal blue
            this.blazer.lineStyle(3.5, 0x1d4ed8, 1);
            this.blazer.beginPath();
            this.blazer.moveTo(-25, -45);
            this.blazer.lineTo(-20, -135);
            this.blazer.lineTo(20, -135);
            this.blazer.lineTo(25, -45);
            this.blazer.closePath();
            this.blazer.fillPath();
            this.blazer.strokePath();
            
            // Belt sash at waist
            this.blazer.fillStyle(0x1d4ed8, 1);
            this.blazer.fillRect(-23, -55, 46, 12);
            this.blazer.lineStyle(1.5, 0x93c5fd, 1);
            this.blazer.strokeRect(-23, -55, 46, 12);
            this.spriteBody.add(this.blazer);

            // Long flowing wavy dark hair (Adorned back and front layers)
            this.backHair = this.scene.add.graphics();
            this.backHair.fillStyle(0x111827, 1); // Dark brown / black
            this.backHair.fillCircle(-18, -145, 20);
            this.backHair.fillCircle(-32, -125, 18);
            this.backHair.fillCircle(-40, -100, 16);
            this.spriteBody.add(this.backHair);

            this.head = this.scene.add.graphics();
            this.head.fillStyle(0xfde047, 1); // Face tone
            this.head.lineStyle(3, 0x1e3a8a, 1);
            this.head.fillCircle(0, -140, 21);
            this.head.strokeCircle(0, -140, 21);
            this.spriteBody.add(this.head);

            this.frontHair = this.scene.add.graphics();
            this.frontHair.fillStyle(0x111827, 1);
            this.frontHair.fillCircle(12, -150, 15);
            this.frontHair.fillCircle(-12, -154, 15);
            this.frontHair.fillRect(-18, -165, 36, 12);
            this.spriteBody.add(this.frontHair);

            // Stance Tweens
            this.scene.tweens.add({
                targets: this.spriteBody,
                scaleY: 1.035,
                scaleX: 0.99,
                y: 4,
                duration: 450,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

        } else {
            // WADE (Defendant): Commanding male in traditional charcoal three-piece suit, red tie, red flowing cape, wielding oak gavel focus
            
            // Red Flowing Cape draped behind
            this.cape = this.scene.add.graphics();
            this.cape.fillStyle(0xb91c1c, 1); // Majestic Crimson Cape
            this.cape.lineStyle(3, 0x7f1d1d, 1);
            this.cape.beginPath();
            this.cape.moveTo(-20, -130);
            this.cape.lineTo(-70, -15);
            this.cape.lineTo(5, -5);
            this.cape.lineTo(20, -120);
            this.cape.closePath();
            this.cape.fillPath();
            this.cape.strokePath();
            this.spriteBody.add(this.cape);

            // Stiff Suit Legs
            this.legs = this.scene.add.graphics();
            this.legs.fillStyle(0x1f2937, 1); // Charcoal Grey
            this.legs.lineStyle(3, 0x111827, 1);
            this.legs.fillRoundedRect(-24, -40, 18, 42, 2);
            this.legs.strokeRoundedRect(-24, -40, 18, 42, 2);
            this.legs.fillRoundedRect(8, -40, 18, 42, 2);
            this.legs.strokeRoundedRect(8, -40, 18, 42, 2);
            this.spriteBody.add(this.legs);

            // Suit Jacket & Vest
            this.suit = this.scene.add.graphics();
            this.suit.fillStyle(0x374151, 1); // Solid charcoal
            this.suit.lineStyle(4, 0x111827, 1);
            this.suit.beginPath();
            this.suit.moveTo(-30, -40);
            this.suit.lineTo(-24, -135);
            this.suit.lineTo(24, -135);
            this.suit.lineTo(30, -40);
            this.suit.closePath();
            this.suit.fillPath();
            this.suit.strokePath();

            // Collar / Shirt V
            this.shirt = this.scene.add.graphics();
            this.shirt.fillStyle(0xffffff, 1);
            this.shirt.fillTriangle(-12, -135, 0, -108, 12, -135);
            
            // Crimson tie
            this.tie = this.scene.add.graphics();
            this.tie.fillStyle(0xef4444, 1);
            this.tie.beginPath();
            this.tie.moveTo(-4, -125);
            this.tie.lineTo(4, -125);
            this.tie.lineTo(5, -85);
            this.tie.lineTo(0, -75);
            this.tie.lineTo(-5, -85);
            this.tie.closePath();
            this.tie.fillPath();
            this.spriteBody.add([this.shirt, this.tie]);

            // Face
            this.head = this.scene.add.graphics();
            this.head.fillStyle(0xfde047, 1);
            this.head.lineStyle(4, 0x111827, 1);
            this.head.fillRoundedRect(-20, -162, 40, 40, 6);
            this.head.strokeRoundedRect(-20, -162, 40, 40, 6);

            // Grey hair
            this.hair = this.scene.add.graphics();
            this.hair.fillStyle(0x9ca3af, 1);
            this.hair.fillRoundedRect(-22, -170, 44, 14, 4);
            this.hair.fillCircle(-20, -148, 8);
            this.hair.fillCircle(20, -148, 8);
            this.spriteBody.add([this.head, this.hair]);

            // Rigid stance idle breathing
            this.scene.tweens.add({
                targets: this.spriteBody,
                scaleY: 1.015,
                scaleX: 1.005,
                y: 1.5,
                duration: 650,
                yoyo: true,
                repeat: -1,
                ease: 'Quad.easeInOut'
            });
        }

        // Eyebrows / stern eyes
        this.eyes = this.scene.add.graphics();
        this.eyes.fillStyle(0x111827, 1);
        this.eyes.fillRect(-8, -144, 4, 4);
        this.eyes.fillRect(4, -144, 4, 4);
        this.eyes.lineStyle(2.5, 0x111827, 1);
        this.eyes.lineBetween(-12, -150, -2, -147);
        this.eyes.lineBetween(2, -147, 12, -150);
        this.spriteBody.add(this.eyes);

        // Weapon container
        this.weaponContainer = this.scene.add.container(0, -65);
        this.spriteBody.add(this.weaponContainer);
        this.drawWeapon();

        // Special Shields
        this.shieldGraphics = this.scene.add.graphics();
        this.shieldGraphics.setVisible(false);
        this.add(this.shieldGraphics);
    }

    drawWeapon() {
        this.weaponGraphics = this.scene.add.graphics();
        this.weaponContainer.add(this.weaponGraphics);

        if (this.characterId === 'roe') {
            // Elegant silver Scales of Justice focus
            this.weaponGraphics.lineStyle(3, 0x93c5fd, 1);
            this.weaponGraphics.lineBetween(0, 10, 40, -10); // extender
            this.weaponGraphics.lineStyle(3.5, 0x60a5fa, 1);
            this.weaponGraphics.lineBetween(20, -25, 60, -25); // crossbar
            
            // Scale balance pans
            this.weaponGraphics.lineStyle(1.5, 0xd1d5db, 1);
            this.weaponGraphics.lineBetween(20, -25, 12, -5);
            this.weaponGraphics.lineBetween(20, -25, 28, -5);
            this.weaponGraphics.lineBetween(60, -25, 52, -5);
            this.weaponGraphics.lineBetween(60, -25, 68, -5);

            this.weaponGraphics.fillStyle(0x93c5fd, 1);
            this.weaponGraphics.fillTriangle(12, -5, 20, 0, 28, -5);
            this.weaponGraphics.fillTriangle(52, -5, 60, 0, 68, -5);
        } else {
            // Wade: Heavy Oak Gavel hammer
            this.weaponGraphics.lineStyle(5.5, 0x78350f, 1);
            this.weaponGraphics.lineBetween(0, 10, 35, -5);
            
            this.weaponGraphics.fillStyle(0x451a03, 1);
            this.weaponGraphics.lineStyle(3.5, 0xeab308, 1);
            this.weaponGraphics.fillRoundedRect(22, -30, 24, 46, 3);
            this.weaponGraphics.strokeRoundedRect(22, -30, 24, 46, 3);
            
            this.weaponGraphics.fillStyle(0xeab308, 1);
            this.weaponGraphics.fillRect(22, -11, 24, 10);
        }
    }

    updateDirection(opponent) {
        if (this.isStunned) return;

        if (opponent) {
            this.facingRight = opponent.x > this.x;
        }

        if (this.facingRight) {
            this.spriteBody.scaleX = Math.abs(this.spriteBody.scaleX);
        } else {
            this.spriteBody.scaleX = -Math.abs(this.spriteBody.scaleX);
        }
    }

    move(dir) {
        if (this.isStunned || this.isAttacking || this.isPrivacyShieldActive || this.isSovereignWallActive) return;

        const opponent = this.scene.fighters.find(f => f !== this);
        const holdsAway = opponent ? (opponent.x > this.x ? dir < 0 : dir > 0) : false;

        this.isBlocking = holdsAway && this.isGrounded;

        this.body.setVelocityX(dir * this.speed);

        if (dir !== 0) {
            this.spriteBody.angle = dir * 6;
        } else {
            this.spriteBody.angle = 0;
        }
    }

    jump() {
        if (this.isStunned || this.isAttacking || this.isPrivacyShieldActive || this.isSovereignWallActive) return;

        if (this.isGrounded) {
            this.body.setVelocityY(this.jumpForce);
            this.jumpsRemaining = 1;
            this.isGrounded = false;
            this.playJumpEffects();
        } else if (this.jumpsRemaining > 0) {
            this.body.setVelocityY(this.doubleJumpForce);
            this.jumpsRemaining = 0;
            this.playJumpEffects(true);
        }
    }

    playJumpEffects(isDouble = false) {
        this.scene.tweens.add({
            targets: this.spriteBody,
            scaleY: isDouble ? 1.25 : 1.15,
            scaleX: isDouble ? 0.75 : 0.85,
            duration: 120,
            yoyo: true,
            ease: 'Quad.easeOut'
        });

        // Dust particle effect
        const dust = this.scene.add.circle(this.x, this.y, isDouble ? 25 : 15, 0xffffff, 0.5);
        this.scene.tweens.add({
            targets: dust,
            scaleX: 2.2,
            scaleY: 0.2,
            y: this.y + 12,
            alpha: 0,
            duration: 180,
            onComplete: () => dust.destroy()
        });
    }

    /**
     * MODULE 2 & 3: Advanced Move-set & Combo Mechanics
     * Triggers dynamic attacks depending on character archetype
     */
    triggerAttack() {
        const now = this.scene.time.now;
        if (this.isStunned || this.isAttacking || this.isPrivacyShieldActive || this.isSovereignWallActive) return;
        if (now - this.lastAttackTime < this.attackCooldown) return;

        // Reset combo step if delay is exceeded
        if (now - this.lastComboHitTime > this.comboResetDelay) {
            this.comboStep = 0;
        }

        this.isAttacking = true;
        this.lastAttackTime = now;
        this.lastComboHitTime = now;

        // Play specific speech voice bubble
        if (Math.random() < 0.4) {
            this.speakLine();
        }

        if (this.characterId === 'roe') {
            // Roe combo: 1. low sweep, 2. roundhouse, 3. flying side-kick (with cyan crescent shockwave projectile!)
            if (this.comboStep === 0) {
                // Low sweep kick
                this.scene.showPopupText(this.x, this.y - 190, 'DUE PROCESS STRIKE!', '#60a5fa');
                this.executeKickSwing(-35, 100);
            } else if (this.comboStep === 1) {
                // Roundhouse kick
                this.scene.showPopupText(this.x, this.y - 190, 'IMPROVEMENT IMPULSE!', '#60a5fa');
                this.executeKickSwing(55, 90);
            } else {
                // High-flying side-kick that launches crescent shockwave! (Exactly as pictured!)
                this.scene.showPopupText(this.x, this.y - 190, 'DUE PROCESS STRIKE! IMPROVEMENT IMPULSE!', '#60a5fa');
                this.body.setVelocityY(-350); // Lunges into the air
                this.body.setVelocityX(this.facingRight ? 400 : -400);

                this.scene.tweens.add({
                    targets: this.spriteBody,
                    angle: this.facingRight ? 35 : -35,
                    duration: 150,
                    yoyo: true,
                    onStart: () => {
                        this.enableAttackHitbox();
                        this.showAttackFlash();
                        this.spawnCrescentProjectile(); // Launches the blue energy wave!
                    },
                    onComplete: () => {
                        this.isAttacking = false;
                        this.disableAttackHitbox();
                    }
                });
            }
        } else {
            // Wade combo: 1. Horizontal swipe, 2. Gavel thrust, 3. Heavy overhead Gavel Strike (breaks guard!)
            if (this.comboStep === 0) {
                this.scene.showPopupText(this.x, this.y - 190, 'STATE AUTHORITY SLAM!', '#ef4444');
                this.executeGavelSwing(60, 110);
            } else if (this.comboStep === 1) {
                this.scene.showPopupText(this.x, this.y - 190, 'JURISDICTIONAL RECOVERY!', '#ef4444');
                this.executeGavelSwing(-80, 85);
            } else {
                // Heavy overhead slam
                this.scene.showPopupText(this.x, this.y - 190, 'STATE INTEREST BLOCK! JURISDICTIONAL RECOVERY!', '#ef4444');
                this.body.setVelocityY(-400); // Heavy lunge
                this.body.setVelocityX(this.facingRight ? 200 : -200);

                this.scene.tweens.add({
                    targets: this.weaponContainer,
                    angle: this.facingRight ? 110 : -110,
                    x: this.facingRight ? 60 : -60,
                    duration: 180,
                    yoyo: true,
                    onStart: () => {
                        this.enableAttackHitbox();
                        this.showAttackFlash();
                    },
                    onComplete: () => {
                        this.isAttacking = false;
                        this.disableAttackHitbox();
                        // Slam splash effect on ground if landed
                        this.scene.cameras.main.shake(150, 0.012);
                    }
                });
            }
        }

        // Progress combo state
        this.comboStep = (this.comboStep + 1) % 3;
    }

    executeKickSwing(angleOffset, duration) {
        this.scene.tweens.add({
            targets: this.spriteBody,
            angle: this.facingRight ? angleOffset : -angleOffset,
            duration: duration,
            yoyo: true,
            onStart: () => {
                this.enableAttackHitbox();
                this.showAttackFlash();
            },
            onComplete: () => {
                this.isAttacking = false;
                this.disableAttackHitbox();
            }
        });
    }

    executeGavelSwing(angleOffset, duration) {
        this.scene.tweens.add({
            targets: this.weaponContainer,
            angle: this.facingRight ? angleOffset : -angleOffset,
            x: this.facingRight ? 40 : -45,
            duration: duration,
            yoyo: true,
            onStart: () => {
                this.enableAttackHitbox();
                this.showAttackFlash();
            },
            onComplete: () => {
                this.isAttacking = false;
                this.disableAttackHitbox();
            }
        });
    }

    /**
     * Launches Roe's elegant blue crescent projectile (Due Process Wave!)
     */
    spawnCrescentProjectile() {
        const pX = this.x + (this.facingRight ? 90 : -90);
        const pY = this.y - 80;

        const projectile = this.scene.add.graphics();
        projectile.lineStyle(4, 0x60a5fa, 1);
        projectile.fillStyle(0x1d4ed8, 0.3);

        // Draw perfect half crescent arc (matching the flying kick effect!)
        projectile.beginPath();
        projectile.arc(0, 0, 45, -Math.PI / 2, Math.PI / 2);
        projectile.lineTo(-10, 35);
        projectile.arc(0, 0, 35, Math.PI / 2, -Math.PI / 2, true);
        projectile.closePath();
        projectile.fillPath();
        projectile.strokePath();

        projectile.x = pX;
        projectile.y = pY;

        // Orient projectile direction
        if (!this.facingRight) {
            projectile.scaleX = -1;
        }

        // Register projectile with arcade physics
        this.scene.physics.add.existing(projectile);
        projectile.body.setAllowGravity(false);
        projectile.body.setVelocityX(this.facingRight ? 850 : -850);

        // Set projectile collision overlap on opponent
        const opponent = this.scene.fighters.find(f => f !== this);
        this.scene.physics.add.overlap(projectile, opponent, () => {
            if (!opponent.isStunned) {
                opponent.takeDamage(10, 'DUE PROCESS STRIKE!');
                this.scene.playSFX('gavel-hit');
                this.scene.cheerSpectators();
            }
            projectile.destroy();
        });

        // Auto destroy projectile offscreen
        this.scene.time.delayedCall(1200, () => {
            if (projectile.active) projectile.destroy();
        });
    }

    /**
     * MODULE 3: Speech Bubble System
     * Spawns an on-hit retro speech balloon displaying voice text on screen
     */
    speakLine(phrase = null) {
        if (this.speechBubble) {
            this.speechBubble.destroy();
        }

        const selectedLine = phrase || Phaser.Utils.Array.GetRandom(this.voiceLines);

        this.speechBubble = this.scene.add.container(0, -220);
        this.add(this.speechBubble);

        // Draw speech bubble background
        const bubbleBg = this.scene.add.graphics();
        bubbleBg.fillStyle(0xffffff, 1);
        bubbleBg.lineStyle(3, 0x111827, 1);
        bubbleBg.fillRoundedRect(-140, -40, 280, 55, 6);
        bubbleBg.strokeRoundedRect(-140, -40, 280, 55, 6);
        
        // Draw little speaking bubble triangle tail pointing down to mouth
        bubbleBg.beginPath();
        bubbleBg.moveTo(-10, 15);
        bubbleBg.lineTo(0, 28);
        bubbleBg.lineTo(10, 15);
        bubbleBg.closePath();
        bubbleBg.fillPath();
        bubbleBg.strokePath();
        this.speechBubble.add(bubbleBg);

        const bubbleText = this.scene.add.text(0, -12, selectedLine, {
            fontFamily: 'Arial',
            fontSize: '15px',
            fontStyle: 'bold',
            fill: '#111827',
            align: 'center',
            wordWrap: { width: 260 }
        }).setOrigin(0.5);
        this.speechBubble.add(bubbleText);

        // Bubble dismiss delay
        this.scene.time.delayedCall(1600, () => {
            if (this.speechBubble && this.speechBubble.active) {
                this.scene.tweens.add({
                    targets: this.speechBubble,
                    alpha: 0,
                    scaleY: 0.2,
                    duration: 200,
                    onComplete: () => {
                        this.speechBubble.destroy();
                        this.speechBubble = null;
                    }
                });
            }
        });
    }

    /**
     * Trigger unique special block shields
     */
    triggerSpecialShield() {
        if (this.isStunned || this.isAttacking || this.isPrivacyShieldActive || this.isSovereignWallActive) return;

        const duration = this.characterId === 'roe' ? 1400 : 1200;

        if (this.characterId === 'roe') {
            this.isPrivacyShieldActive = true;
            this.speakLine("Precedent, not restriction!");
            this.scene.showPopupText(this.x, this.y - 190, 'ZONE OF PRIVACY!', '#60a5fa');
        } else {
            this.isSovereignWallActive = true;
            this.speakLine("Order must prevail!");
            this.scene.showPopupText(this.x, this.y - 190, '10th AMENDMENT DEFENSE!', '#ef4444');
        }

        this.body.setVelocityX(0); // Root
        this.scene.playSFX('super-charge');

        // Draw visual geometric block shields
        this.shieldGraphics.clear();
        this.shieldGraphics.setVisible(true);
        this.shieldGraphics.alpha = 0.95;

        const offset = this.facingRight ? 80 : -80;
        this.shieldGraphics.x = offset;
        this.shieldGraphics.y = -80;

        if (this.characterId === 'roe') {
            // Roe: Glowing Blue panel
            this.shieldGraphics.lineStyle(4, 0x60a5fa, 1);
            this.shieldGraphics.fillStyle(0x1d4ed8, 0.65);
            
            this.shieldGraphics.beginPath();
            this.shieldGraphics.moveTo(0, -65);
            this.shieldGraphics.lineTo(45, -30);
            this.shieldGraphics.lineTo(45, 30);
            this.shieldGraphics.lineTo(0, 65);
            this.shieldGraphics.lineTo(-45, 30);
            this.shieldGraphics.lineTo(-45, -30);
            this.shieldGraphics.closePath();
            this.shieldGraphics.fillPath();
            this.shieldGraphics.strokePath();
        } else {
            // Wade: Spawns Glowing Burning Red Constitution Law Book shield! (Exactly as pictured!)
            this.shieldGraphics.lineStyle(4.5, 0xef4444, 1);
            this.shieldGraphics.fillStyle(0x451a03, 0.9); // Brown pages outline
            
            // Draw book volume
            this.shieldGraphics.fillRoundedRect(-40, -75, 80, 150, 6);
            this.shieldGraphics.strokeRoundedRect(-40, -75, 80, 150, 6);
            
            // Glowing lines representing seal
            this.shieldGraphics.lineStyle(2.5, 0xeab308, 1);
            this.shieldGraphics.strokeCircle(0, 0, 22);
            this.shieldGraphics.lineBetween(-15, 0, 15, 0);
            this.shieldGraphics.lineBetween(0, -15, 0, 15);
            
            // Fire sparks overlay around the book
            this.shieldGraphics.lineStyle(3, 0xef4444, 0.85);
            this.shieldGraphics.lineBetween(-50, -50, -45, -60);
            this.shieldGraphics.lineBetween(50, 50, 45, 60);
        }

        // Timer
        this.scene.time.delayedCall(duration, () => {
            this.isPrivacyShieldActive = false;
            this.isSovereignWallActive = false;
            
            this.scene.tweens.add({
                targets: this.shieldGraphics,
                alpha: 0,
                duration: 120,
                onComplete: () => {
                    this.shieldGraphics.setVisible(false);
                }
            });
        });
    }

    triggerSuperMove() {
        if (this.superMeter < 100 || this.isStunned || this.isSuperActive) return;

        this.superMeter = 0;
        this.isSuperActive = true;
        this.aura.setVisible(true);

        this.scene.playSFX('super-charge');
        this.scene.playSFX('cheer-applause');
        
        this.scene.cameras.main.shake(450, 0.03);

        // Speech voice line pop
        this.speakLine(this.characterId === 'roe' ? "The individual must be free!" : "The law is absolute!");

        // Overlay Super Text pop
        this.scene.showPopupText(this.x, this.y - 230, this.superText, this.characterId === 'roe' ? '#60a5fa' : '#ef4444');

        if (this.characterId === 'roe') {
            // ROE: 'Fundamental Right established' - Radial multi-hit blue energy shockwaves
            const radialGroup = [];
            for (let i = 0; i < 4; i++) {
                const burst = this.scene.add.circle(this.x, this.y - 80, 15, 0x60a5fa, 0.2);
                this.scene.physics.add.existing(burst);
                burst.body.setAllowGravity(false);
                burst.body.setImmovable(true);
                radialGroup.push(burst);

                this.scene.tweens.add({
                    targets: burst,
                    scaleX: 25,
                    scaleY: 25,
                    alpha: 0,
                    delay: i * 200,
                    duration: 1000,
                    onUpdate: () => {
                        const opponent = this.scene.fighters.find(f => f !== this);
                        if (opponent) {
                            const dist = Phaser.Math.Distance.Between(burst.x, burst.y, opponent.x, opponent.y - 80);
                            if (dist < (burst.scaleX * 15) && !opponent.isStunned) {
                                opponent.takeDamage(12, 'SUPER: SUBSTANTIVE LIBERTY!!');
                            }
                        }
                    },
                    onComplete: () => {
                        burst.destroy();
                        if (i === 3) {
                            this.isSuperActive = false;
                            this.aura.setVisible(false);
                        }
                    }
                });
            }
        } else {
            // WADE: 'Statutory Mandate' - Heavy red hammer falls from high above
            const opponent = this.scene.fighters.find(f => f !== this);
            const targetX = opponent ? opponent.x : this.x + (this.facingRight ? 350 : -350);

            const giantGavel = this.scene.add.container(targetX, this.y - 650);
            const gG = this.scene.add.graphics();
            gG.fillStyle(0x7f1d1d, 1);
            gG.lineStyle(7, 0xfca5a5, 1);
            gG.fillRoundedRect(-60, -110, 120, 170, 12);
            gG.strokeRoundedRect(-60, -110, 120, 170, 12);
            
            gG.lineStyle(12, 0x451a03, 1);
            gG.lineBetween(0, -110, 0, -280);
            giantGavel.add(gG);

            this.scene.tweens.add({
                targets: giantGavel,
                y: this.y - 80,
                duration: 500,
                ease: 'Bounce.easeOut',
                onComplete: () => {
                    this.scene.cameras.main.shake(300, 0.03);
                    this.scene.playSFX('gavel-hit');
                    this.scene.cheerSpectators();

                    if (opponent) {
                        const dist = Math.abs(opponent.x - targetX);
                        if (dist < 200) {
                            opponent.takeDamage(45, 'SUPER: POLICE POWER!!');
                        }
                    }

                    this.scene.time.delayedCall(500, () => {
                        giantGavel.destroy();
                        this.isSuperActive = false;
                        this.aura.setVisible(false);
                    });
                }
            });
        }
    }

    takeDamage(amount, reason = null) {
        if (this.health <= 0) return;

        // Custom traditional block mitigation
        if (this.isBlocking && !reason?.startsWith('SUPER')) {
            amount = Math.round(amount * 0.15); // Mitigate 85% normal damage
            this.showBlockEffect();
            if (amount === 0) return;
        }

        // Special Shields Nullification
        if (this.isPrivacyShieldActive || this.isSovereignWallActive) {
            this.showBlockEffect(true);
            return;
        }

        this.health = Math.max(0, this.health - amount);
        
        // Fast recovery hitstun (120ms duration)
        this.isStunned = true;
        this.body.setVelocityX(this.facingRight ? -250 : 250);

        this.scene.tweens.add({
            targets: this.spriteBody,
            alpha: 0.1,
            yoyo: true,
            repeat: 2,
            duration: 40,
            onComplete: () => {
                this.spriteBody.alpha = 1;
                this.isStunned = false; // Instant recovery
            }
        });

        // Boost super meter
        this.gainSuperMeter(amount * 0.4);

        // Hit flashes and text
        this.showDamageText(amount, reason);
    }

    showBlockEffect(isSpecial = false) {
        const popX = this.x + (this.facingRight ? -40 : 40);
        const popY = this.y - 90;
        
        const sparks = this.scene.add.graphics();
        sparks.lineStyle(2.5, isSpecial ? this.glowingColor : 0xffffff, 1);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            sparks.lineBetween(popX, popY, popX + Math.cos(angle) * 35, popY + Math.sin(angle) * 35);
        }
        
        this.scene.tweens.add({
            targets: sparks,
            alpha: 0,
            scaleX: 1.4,
            scaleY: 1.4,
            duration: 180,
            onComplete: () => sparks.destroy()
        });

        // Display popups above
        this.scene.showPopupText(this.x, this.y - 170, isSpecial ? 'JURISDICTIONAL RECOVERY!' : 'BLOCKED!', isSpecial ? '#ef4444' : '#ffffff');
    }

    gainSuperMeter(amount) {
        if (this.superMeter < 100) {
            const oldMeter = this.superMeter;
            this.superMeter = Math.min(100, this.superMeter + amount);
            if (this.superMeter === 100 && oldMeter < 100) {
                this.scene.playSFX('super-charge');
                this.flashSuperReady();
            }
        }
    }

    flashSuperReady() {
        const text = this.scene.add.text(0, -220, 'SUPER READY!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '16px',
            fill: '#fde047',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);
        this.add(text);

        this.scene.tweens.add({
            targets: text,
            scaleX: 1.2,
            scaleY: 1.2,
            yoyo: true,
            repeat: 3,
            duration: 150,
            onComplete: () => text.destroy()
        });
    }

    showDamageText(amount, reason) {
        const popX = this.x + Phaser.Math.Between(-30, 30);
        const popY = this.y - 180;
        
        const style = {
            fontFamily: '"Press Start 2P"',
            fontSize: '18px',
            fill: '#ef4444',
            stroke: '#000000',
            strokeThickness: 4
        };

        const t = this.scene.add.text(popX, popY, `-${amount} HP`, style).setOrigin(0.5);
        
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
        const flashX = this.x + (this.facingRight ? 80 : -80);
        const flashY = this.y - 75;
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
        this.attackHitbox.y = this.y - 75;
        this.attackHitbox.body.enable = true;
    }

    disableAttackHitbox() {
        this.attackHitbox.body.enable = false;
        this.attackHitbox.x = -5000;
        this.attackHitbox.y = -5000;
    }

    update(opponent) {
        this.isGrounded = this.body.blocked.down;
        this.updateDirection(opponent);

        const groundY = this.y;
        if (this.shadow) {
            const distance = Math.max(0, 500 - (groundY - this.y));
            const ratio = distance / 500;
            this.shadow.setScale(ratio);
            this.shadow.alpha = 0.45 * ratio;
            this.shadow.y = -this.y + (this.scene.floorY || 920);
        }
    }
}
