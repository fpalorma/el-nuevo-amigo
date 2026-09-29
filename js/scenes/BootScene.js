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

        // Fede, primer amigo del grupo: 2 poses recortadas de assets/friends/fede/sprites-fede.jpeg
        // (fondo original removido a mano) para una animación mínima de caminata.
        this.load.image('fede-idle', 'assets/friends/fede/fede-standing.png');
        this.load.image('fede-walk', 'assets/friends/fede/fede-walk.png');

        // Paz, segundo amigo del grupo: 2 poses recortadas de assets/friends/paz/sprites-paz.jpeg
        // (fondo original removido a mano) para una animación mínima de caminata.
        this.load.image('paz-idle', 'assets/friends/paz/paz-standing.png');
        this.load.image('paz-walk', 'assets/friends/paz/paz-walk.png');

        // Osva: 2 poses recortadas de assets/friends/osva/sprites-osva.png
        this.load.image('osva-idle', 'assets/friends/osva/osva-standing.png');
        this.load.image('osva-walk', 'assets/friends/osva/osva-walk.png');

        // Agu: 2 poses recortadas de assets/friends/agu/sprites-agu.png
        this.load.image('agu-idle', 'assets/friends/agu/agu-standing.png');
        this.load.image('agu-walk', 'assets/friends/agu/agu-walk.png');

        // Emi: 2 poses recortadas de assets/friends/emi/sprites-emi.png
        this.load.image('emi-idle', 'assets/friends/emi/emi-standing.png');
        this.load.image('emi-walk', 'assets/friends/emi/emi-walk.png');
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
