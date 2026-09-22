class BootScene extends Phaser.Scene {
    constructor() {
        super('boot');
    }

    preload() {
        this.drawLoadingBar();

        // Protagonista: Mario grande (placeholder hasta tener al "nuevo amigo")
        // 108x32 -> 6 frames de 18x32
        this.load.spritesheet('mario-grown', 'assets/entities/mario-grown.png', {
            frameWidth: 18,
            frameHeight: 32
        });

        // Piso de ladrillo del bioma overworld (128x32)
        this.load.image('floorbricks', 'assets/scenery/overworld/floorbricks.png');

        // Nubes dinámicas del cielo
        this.load.image('cloud1', 'assets/scenery/overworld/cloud1.png');
        this.load.image('cloud2', 'assets/scenery/overworld/cloud2.png');

        // Fede, primer amigo del grupo: placeholder hasta tener su sprite real
        // (inspirado en assets/friends/fede/fede-1.jpg). 32x24 -> 2 frames, se usa el 0 fijo.
        this.load.spritesheet('fede', 'assets/hud/npc.png', {
            frameWidth: 32,
            frameHeight: 24
        });
    }

    create() {
        this.scene.start('walk');
    }

    drawLoadingBar() {
        const { width, height } = this.scale;
        const box = this.add.graphics();
        const bar = this.add.graphics();

        box.fillStyle(0x222222, 0.8);
        box.fillRect(width / 2 - 82, height / 2 - 12, 164, 24);

        this.load.on('progress', (value) => {
            bar.clear();
            bar.fillStyle(0xffffff, 1);
            bar.fillRect(width / 2 - 72, height / 2 - 2, 144 * value, 4);
        });

        this.load.on('complete', () => {
            bar.destroy();
            box.destroy();
        });
    }
}
