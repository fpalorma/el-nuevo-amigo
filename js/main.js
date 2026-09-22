// GAME_WIDTH / GAME_HEIGHT están declaradas en WalkScene.js (se carga antes que este
// archivo) — los <script> clásicos comparten un único scope global, así que no se
// pueden redeclarar acá.
const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x8585ff, // cielo azul
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1400 },
            debug: false // poner en true para ver hitboxes al tunear
        }
    },
    scene: [BootScene, WalkScene]
};

new Phaser.Game(config);
