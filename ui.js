import Phaser from 'phaser';

export function createCharacterSelectUI(scene, onCompleteCallback) {
    const width = scene.scale.width;
    const height = scene.scale.height;

    const selectContainer = scene.add.container(0, 0);

    const title = scene.add.text(width / 2, 100, 'CHOOSE YOUR ADVOCATE', {
        fontFamily: '"Press Start 2P"', fontSize: '36px', fill: '#fde047'
    }).setOrigin(0.5);
    selectContainer.add(title);

    // Available character selections mapping list
    const options = [
        { id: 'roe', name: 'Jane Roe' },
        { id: 'wade', name: 'Henry Wade' },
        { id: 'cityman', name: 'City Man 3' }
    ];

    let selectedP1 = 'roe';
    let selectedP2 = 'wade';
    let isVsAI = true;

    options.forEach((opt, idx) => {
        const cardX = width / 2 - 300 + (idx * 300);
        const cardY = height / 2 - 50;

        const bgCard = scene.add.rectangle(cardX, cardY, 240, 320, 0x1f2937).setStrokeStyle(4, 0x4b5563).setInteractive();
        const lbl = scene.add.text(cardX, cardY, opt.name, {
            fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#ffffff'
        }).setOrigin(0.5);

        selectContainer.add([bgCard, lbl]);

        bgCard.on('pointerdown', () => {
            scene.playSFX('gavel-hit');
            selectedP1 = opt.id;
            // Cycle partner assignment configurations
            if (selectedP1 === 'cityman') selectedP2 = 'wade';
            else selectedP2 = 'cityman';
        });
    });

    const startBtn = scene.add.rectangle(width / 2, height - 150, 400, 70, 0xeab308).setInteractive();
    const startText = scene.add.text(width / 2, height - 150, 'CONFIRM SELECTION', {
        fontFamily: '"Press Start 2P"', fontSize: '18px', fill: '#000000'
    }).setOrigin(0.5);
    selectContainer.add([startBtn, startText]);

    startBtn.on('pointerdown', () => {
        scene.playSFX('gavel-hit');
        selectContainer.destroy();
        onCompleteCallback(selectedP1, selectedP2, isVsAI);
    });
}

export function showFinalVerdictScreen(scene, winnerData, loserData, onRestart) {
    const width = scene.scale.width;
    const height = scene.scale.height;

    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    const text = scene.add.text(width / 2, height / 2 - 50, `${winnerData.name} WINS THE CASE!`, {
        fontFamily: '"Press Start 2P"', fontSize: '32px', fill: '#22c55e'
    }).setOrigin(0.5);

    const btn = scene.add.rectangle(width / 2, height / 2 + 100, 300, 60, 0xd92626).setInteractive();
    const btnTxt = scene.add.text(width / 2, height / 2 + 100, 'RETRY CASE', {
        fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerdown', () => {
        overlay.destroy();
        text.destroy();
        btn.destroy();
        btnTxt.destroy();
        onRestart();
    });
}
