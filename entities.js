import Phaser from 'phaser';

// Generic Projectile class
class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, flipX) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setFlipX(flipX);
        this.body.setAllowGravity(false);
        this.speed = 800;
        this.damage = 10;
    }

    update() {
        if (this.x < 0 || this.x > this.scene.scale.width) {
            this.destroy();
        }
    }
}

export class Fighter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, characterId, isFlipped, isAI) {
        // FIX: Provide a valid texture key and then set alpha to 0.
        // The physics body is created, but the parent sprite is invisible.
        // Visuals are handled by the 'spriteBody' container.
        super(scene, x, y, 'book');
        this.setAlpha(0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.characterId = characterId;
        this.isFlipped = isFlipped;
        this.isAI = isAI;

        this.health = 100;
        this.maxHealth = 100;
        this.superMeter = 0;
        this.isStunned = false;
        this.isAttacking = false;
        this.lastAttackTime = 0;
        this.comboCount = 0;

        this.jumpsRemaining = 2;
        this.isGrounded = true;

        this.isCharging = false;
        this.chargeStartTime = 0;

        this.setFighterAttributes();
        this.createSprite();

        this.body.setSize(120, 280);
        this.body.setOffset(this.isFlipped ? 80 : 100, 80);
        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(900);

        this.projectiles = this.scene.physics.add.group({ classType: Projectile, runChildUpdate: true });
        this.createAttackHitbox();
    }

    setFighterAttributes() {
        if (this.characterId === 'roe') {
            this.charName = 'Roe';
            this.moveSpeed = 450;
            this.jumpForce = -700;
            this.doubleJumpForce = -550;
            this.damageNormal = 8;
            this.attackText = ['Objection!', 'Hearsay!', 'Irrelevant!'];
        } else {
            this.charName = 'Wade';
            this.moveSpeed = 420;
            this.jumpForce = -680;
            this.doubleJumpForce = -520;
            this.damageNormal = 10;
            this.attackText = ['Sustained!', 'Overruled!', 'Contempt!'];
        }
    }

    createSprite() {
        this.spriteBody = this.scene.add.container(0, 0);

        if (this.characterId === 'roe') {
            const robe = this.scene.add.graphics();
            robe.fillStyle(0x0e7490, 1);
            robe.fillRoundedRect(-50, -150, 100, 200, 12);
            const head = this.scene.add.graphics();
            head.fillStyle(0xfde047, 1);
            head.fillCircle(0, -160, 32);
            const hair = this.scene.add.graphics();
            hair.fillStyle(0xfef08a, 1);
            hair.fillCircle(0, -175, 25);
            hair.fillCircle(-20, -165, 20);
            hair.fillCircle(20, -165, 20);
            this.spriteBody.add([robe, head, hair]);
        } else {
            const robe = this.scene.add.graphics();
            robe.fillStyle(0xbe123c, 1);
            robe.fillRoundedRect(-50, -150, 100, 200, 12);
            const head = this.scene.add.graphics();
            head.fillStyle(0xfde047, 1);
            head.fillCircle(0, -160, 32);
            const hair = this.scene.add.graphics();
            hair.fillStyle(0x9ca3af, 1);
            hair.fillRoundedRect(-22, -170, 44, 14, 4);
            hair.fillCircle(-20, -148, 8);
            hair.fillCircle(20, -148, 8);
            this.spriteBody.add([robe, head, hair]);
        }

        this.add(this.spriteBody);
        this.setFlipX(this.isFlipped);
    }

    createAttackHitbox() {
        this.attackHitbox = this.scene.add.rectangle(this.isFlipped ? -80 : 80, 0, 140, 80, 0xff0000, 0.0);
        this.scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.setAllowGravity(false);
        this.add(this.attackHitbox);
        this.disableAttackHitbox();
    }

    update(opponent) {
        this.isGrounded = this.body.touching.down;
        if (this.isGrounded) {
            this.jumpsRemaining = 2;
        }

        if (this.isCharging) {
            const chargeDuration = this.scene.time.now - this.chargeStartTime;
            this.chargePower = Math.min(chargeDuration / 1000, 1.0);
        }

        if (!this.isStunned && !this.isAttacking) {
             if (this.x < opponent.x) {
                this.setFlipX(false); this.isFlipped = false;
            } else {
                this.setFlipX(true); this.isFlipped = true;
            }
        }
    }

    move(direction) {
        if (this.isStunned) return;
        this.body.setVelocityX(direction * this.moveSpeed);
    }

    jump() {
        if (this.isStunned) return;
        if (this.isGrounded) {
            this.body.setVelocityY(this.jumpForce);
            this.jumpsRemaining = 1;
        } else if (this.jumpsRemaining > 0) {
            this.body.setVelocityY(this.doubleJumpForce);
            this.jumpsRemaining = 0;
        }
    }
    
    triggerAttack() {
        if (this.isStunned || this.isAttacking) return;
        this.isAttacking = true;
        this.lastAttackTime = this.scene.time.now;
        this.scene.time.delayedCall(100, () => this.enableAttackHitbox(this.damageNormal));
        this.scene.time.delayedCall(300, () => {
            this.disableAttackHitbox();
            this.isAttacking = false;
        });
        this.scene.tweens.add({ targets: this.spriteBody, scaleX: 1.2, scaleY: 0.8, duration: 150, yoyo: true, ease: 'Power1.easeOut' });
    }

    triggerProjectile() {
        if (this.isStunned) return;
        const projectile = this.projectiles.get(this.x, this.y, this.characterId === 'roe' ? 'book' : 'gavel', this.isFlipped);
        if (projectile) {
            projectile.body.setVelocityX(this.isFlipped ? -projectile.speed : projectile.speed);
        }
    }

    triggerGroundPound() {
        if (this.isGrounded || this.isStunned) return;
        this.body.setVelocityY(1200);
        this.scene.time.delayedCall(50, () => {
            if (this.isGrounded) {
                this.enableAttackHitbox(15, 150, 30);
                this.scene.time.delayedCall(100, () => this.disableAttackHitbox());
            }
        });
    }

    startCharging() {
        if (this.isStunned) return;
        this.isCharging = true;
        this.chargeStartTime = this.scene.time.now;
        this.chargePower = 0;
    }

    releaseChargeAttack() {
        if (!this.isCharging) return;
        this.isCharging = false;
        const chargedDamage = 5 + (this.chargePower * 25);
        this.enableAttackHitbox(chargedDamage, 160, 100);
        this.scene.time.delayedCall(300, () => this.disableAttackHitbox());
        this.chargePower = 0;
    }

    takeDamage(amount, attackText) {
        if (this.isStunned) return;
        this.health -= amount;
        this.superMeter += amount / 2;
        if (this.health < 0) this.health = 0;
        this.scene.showPopupText(this.x, this.y - 100, attackText[Math.floor(Math.random() * attackText.length)], '#ef4444');
        this.isStunned = true;
        this.spriteBody.setAlpha(0.5);
        this.scene.time.delayedCall(500, () => {
            this.isStunned = false;
            this.spriteBody.setAlpha(1);
        });
    }

    enableAttackHitbox(damage, width = 140, height = 80) {
        this.attackHitbox.body.enable = true;
        this.attackHitbox.damage = damage;
        this.attackHitbox.body.setSize(width, height);
        this.attackHitbox.x = this.isFlipped ? - (width/2) : (width/2);
    }

    disableAttackHitbox() {
        this.attackHitbox.body.enable = false;
    }

    gainSuperMeter(amount) {
        this.superMeter += amount;
        if (this.superMeter > 100) this.superMeter = 100;
    }
}
