// Resolución base del juego. Se declara acá (y no en main.js) porque este archivo
// se carga primero; main.js reutiliza estas mismas constantes del scope global
// compartido por los <script> clásicos.
const GAME_WIDTH = 640;
const GAME_HEIGHT = 360;

const TILE = 16;
const FLOOR_H = TILE * 3;                  // 48px de piso
const GROUND_Y = GAME_HEIGHT - FLOOR_H;    // superficie donde pisa Mario
const WALK_SPEED = 90;                     // px/s de scroll del mundo
const JUMP_V = 520;
const CLOUD_PARALLAX = 0.3;
const PLAYER_X = GAME_WIDTH / 3;
const CLOUD_COUNT = 5;
const PLAYER_SCALE = 1.4; // experimento: Mario más grande que el resto del mundo
const FEDE_SPAWN_DISTANCE = 400; // px recorridos entre apariciones de Fede
// El sprite de Fede viene de un recorte a mayor resolución que mario-grown (87px vs 32px
// de alto), así que se reescala aparte para que quede del mismo tamaño visual que Mario.
const FEDE_SCALE = PLAYER_SCALE * 32 / 87;
const FEDE_ANIM_INTERVAL = 300; // ms entre frames de la animación de caminata de Fede

const PAZ_SPAWN_DISTANCE = 400; // px recorridos entre apariciones de Paz
// Desfase fijo respecto del ciclo de Fede: como ambos acumulan distancia al mismo
// ritmo y con el mismo período, arrancar el contador de Paz "adelantado" mantiene
// ese mismo desfase para siempre, así nunca aparecen juntos ni pegados.
const PAZ_SPAWN_OFFSET = 200;
// Igual que con Fede: el recorte de Paz (pose parada) tiene 78px de alto,
// muy distinto de los 32px del frame de Mario, así que se reescala aparte.
const PAZ_SCALE = PLAYER_SCALE * 32 / 78;
const PAZ_ANIM_INTERVAL = 300; // ms entre frames de la animación de caminata de Paz

class WalkScene extends Phaser.Scene {
    constructor() {
        super('walk');
    }

    create() {
        this.createSky();
        this.createClouds();
        this.createFloor();
        this.createAnimations();
        this.createPlayer();
        this.createFede();
        this.createPaz();
        this.createInput();
    }

    createSky() {
        // El backgroundColor del config ya pinta el cielo; nada más que hacer acá.
    }

    createClouds() {
        this.clouds = [];
        const textures = ['cloud1', 'cloud2'];

        for (let i = 0; i < CLOUD_COUNT; i++) {
            const texture = Phaser.Utils.Array.GetRandom(textures);
            const x = Phaser.Math.Between(0, GAME_WIDTH);
            const y = Phaser.Math.Between(16, GAME_HEIGHT / 3);
            const cloud = this.add.image(x, y, texture).setScale(0.22).setDepth(0);
            this.clouds.push(cloud);
        }
    }

    recycleCloud(cloud, direction) {
        const halfWidth = (cloud.displayWidth || 0) / 2;
        const texture = Phaser.Utils.Array.GetRandom(['cloud1', 'cloud2']);
        cloud.setTexture(texture).setScale(0.22);
        cloud.y = Phaser.Math.Between(16, GAME_HEIGHT / 3);

        if (direction > 0) {
            // El mundo se mueve a la derecha del jugador -> nubes salen por la izquierda
            cloud.x = GAME_WIDTH + halfWidth + Phaser.Math.Between(0, 80);
        } else {
            cloud.x = -halfWidth - Phaser.Math.Between(0, 80);
        }
    }

    createFloor() {
        this.floor = this.add.tileSprite(0, GROUND_Y, GAME_WIDTH, FLOOR_H, 'floorbricks')
            .setOrigin(0, 0)
            .setDepth(2);

        // Cuerpo estático de colisión: no se mueve, el mundo scrollea por textura.
        this.floorBody = this.physics.add.staticImage(GAME_WIDTH / 2, GROUND_Y + FLOOR_H / 2)
            .setVisible(false);
        this.floorBody.body.setSize(GAME_WIDTH, FLOOR_H);
    }

    createAnimations() {
        this.anims.create({
            key: 'mario-idle',
            frames: [{ key: 'mario-grown', frame: 0 }]
        });

        this.anims.create({
            key: 'mario-run',
            frames: this.anims.generateFrameNumbers('mario-grown', { start: 3, end: 1 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'mario-jump',
            frames: [{ key: 'mario-grown', frame: 5 }]
        });
    }

    createPlayer() {
        this.player = this.physics.add.sprite(PLAYER_X, GROUND_Y, 'mario-grown')
            .setOrigin(0.5, 1)
            .setCollideWorldBounds(true)
            .setDepth(3)
            .setScale(PLAYER_SCALE);

        this.player.body.setSize(14, 32).setOffset(2, 0);
        this.player.anims.play('mario-idle');

        this.physics.add.collider(this.player, this.floorBody);
    }

    createFede() {
        // Fede: NPC decorativo, sin física, con animación mínima de caminata (2 frames).
        // El sprite original mira a la derecha; se invierte para que quede de frente
        // a Mario (que camina hacia la izquierda dentro de la escena) y no de espaldas.
        this.fede = this.add.image(0, GROUND_Y, 'fede-idle')
            .setOrigin(0.5, 1)
            .setScale(FEDE_SCALE)
            .setFlipX(true)
            .setDepth(3)
            .setVisible(false);

        this.fedeDistanceAccum = 0;
        this.fedeAnimAccum = 0;
        this.fedeAnimFrame = 0;
    }

    spawnFede(direction) {
        this.fede.setTexture('fede-idle');
        this.fedeAnimAccum = 0;
        this.fedeAnimFrame = 0;

        const halfWidth = this.fede.displayWidth / 2;

        if (direction > 0) {
            // El mundo se mueve a la derecha del jugador -> Fede entra por la derecha
            this.fede.x = GAME_WIDTH + halfWidth;
        } else {
            this.fede.x = -halfWidth;
        }

        this.fede.setVisible(true);
    }

    createPaz() {
        // Paz: mismo patrón que Fede, NPC decorativo sin física y con animación
        // mínima de caminata (2 frames). El sprite original mira a la derecha;
        // se invierte para que quede de frente a Mario y no de espaldas.
        this.paz = this.add.image(0, GROUND_Y, 'paz-idle')
            .setOrigin(0.5, 1)
            .setScale(PAZ_SCALE)
            .setFlipX(false)
            .setDepth(3)
            .setVisible(false);

        this.pazDistanceAccum = -PAZ_SPAWN_OFFSET;
        this.pazAnimAccum = 0;
        this.pazAnimFrame = 0;
    }

    spawnPaz(direction) {
        this.paz.setTexture('paz-idle');
        this.pazAnimAccum = 0;
        this.pazAnimFrame = 0;

        const halfWidth = this.paz.displayWidth / 2;

        if (direction > 0) {
            // El mundo se mueve a la derecha del jugador -> Paz entra por la derecha
            this.paz.x = GAME_WIDTH + halfWidth;
        } else {
            this.paz.x = -halfWidth;
        }

        this.paz.setVisible(true);
    }

    createInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,D,SPACE');
    }

    update(_time, delta) {
        const dt = delta / 1000;
        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;

        const direction = (right ? 1 : 0) - (left ? 1 : 0);

        this.floor.tilePositionX += direction * WALK_SPEED * dt;

        for (const cloud of this.clouds) {
            cloud.x -= direction * WALK_SPEED * CLOUD_PARALLAX * dt;
            const halfWidth = cloud.displayWidth / 2;

            if (cloud.x < -halfWidth) {
                this.recycleCloud(cloud, 1);
            } else if (cloud.x > GAME_WIDTH + halfWidth) {
                this.recycleCloud(cloud, -1);
            }
        }

        if (direction !== 0) {
            this.fedeDistanceAccum += Math.abs(direction) * WALK_SPEED * dt;
        }

        if (this.fede.visible) {
            // Sin parallax: Fede es parte del escenario, se mueve igual que el piso.
            this.fede.x -= direction * WALK_SPEED * dt;

            // Animación mínima constante: alterna parado / con la mochila al hombro
            // todo el tiempo que esté en pantalla, sin depender de que Mario avance.
            this.fedeAnimAccum += delta;

            if (this.fedeAnimAccum >= FEDE_ANIM_INTERVAL) {
                this.fedeAnimAccum = 0;
                this.fedeAnimFrame = 1 - this.fedeAnimFrame;
                this.fede.setTexture(this.fedeAnimFrame === 0 ? 'fede-idle' : 'fede-walk');
            }

            const fedeHalfWidth = this.fede.displayWidth / 2;

            if (this.fede.x < -fedeHalfWidth || this.fede.x > GAME_WIDTH + fedeHalfWidth) {
                this.fede.setVisible(false);
            }
        }

        if (!this.fede.visible && this.fedeDistanceAccum >= FEDE_SPAWN_DISTANCE) {
            this.spawnFede(direction);
            this.fedeDistanceAccum = 0;
        }

        if (direction !== 0) {
            this.pazDistanceAccum += Math.abs(direction) * WALK_SPEED * dt;
        }

        if (this.paz.visible) {
            // Sin parallax: Paz es parte del escenario, se mueve igual que el piso.
            this.paz.x -= direction * WALK_SPEED * dt;

            // Animación mínima constante: alterna parado / caminando todo el tiempo
            // que esté en pantalla, sin depender de que Mario avance.
            this.pazAnimAccum += delta;

            if (this.pazAnimAccum >= PAZ_ANIM_INTERVAL) {
                this.pazAnimAccum = 0;
                this.pazAnimFrame = 1 - this.pazAnimFrame;
                this.paz.setTexture(this.pazAnimFrame === 0 ? 'paz-idle' : 'paz-walk');
            }

            const pazHalfWidth = this.paz.displayWidth / 2;

            if (this.paz.x < -pazHalfWidth || this.paz.x > GAME_WIDTH + pazHalfWidth) {
                this.paz.setVisible(false);
            }
        }

        if (!this.paz.visible && this.pazDistanceAccum >= PAZ_SPAWN_DISTANCE) {
            this.spawnPaz(direction);
            this.pazDistanceAccum = 0;
        }

        const onGround = this.player.body.blocked.down;

        if (jump && onGround) {
            this.player.setVelocityY(-JUMP_V);
        }

        if (!onGround) {
            this.player.anims.play('mario-jump', true);
        } else if (direction !== 0) {
            this.player.anims.play('mario-run', true);
            this.player.setFlipX(direction < 0);
        } else {
            this.player.anims.play('mario-idle', true);
        }
    }
}
