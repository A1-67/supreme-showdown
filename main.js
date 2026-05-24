import Phaser from 'phaser';
import BattleScene from './game.js';

// Configuration for Supreme Showdown
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BattleScene],
    backgroundColor: '#09090b'
};

// Bootstrap Phaser
const game = new Phaser.Game(config);
export default game;
