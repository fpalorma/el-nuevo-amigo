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
// Igual que con Fede: el recorte de Paz (pose parada) tiene 199px de alto,
// muy distinto de los 32px del frame de Mario, así que se reescala aparte.
const PAZ_SCALE = PLAYER_SCALE * 32 / 199;
const PAZ_ANIM_INTERVAL = 300; // ms entre frames de la animación de caminata de Paz

const OSVA_SPAWN_DISTANCE = 400; // px recorridos entre apariciones de Osva
// Desfase fijo distinto al de Paz (200) para que no coincida con Fede ni con Paz.
const OSVA_SPAWN_OFFSET = 100;
// El recorte de Osva (pose parada) tiene 92px de alto: se reescala aparte para igualar a Mario.
const OSVA_SCALE = PLAYER_SCALE * 32 / 92;
const OSVA_ANIM_INTERVAL = 300; // ms entre frames de la animación de caminata de Osva
const AGU_SPAWN_DISTANCE = 400; // px recorridos entre apariciones de Agu
// Desfase fijo distinto al de Paz (200) y Osva (100) para que no coincida con ninguno.
const AGU_SPAWN_OFFSET = 300;
// El recorte de Agu (pose parada) tiene 102px de alto: se reescala aparte para igualar a Mario.
const AGU_SCALE = PLAYER_SCALE * 32 / 102;
const AGU_ANIM_INTERVAL = 300; // ms entre frames de la animación de caminata de Agu

const EMI_SPAWN_DISTANCE = 400; // px recorridos entre apariciones de Emi
// Desfase fijo distinto al de Paz (200), Osva (100) y Agu (300) para que no coincida con ninguno.
const EMI_SPAWN_OFFSET = 350;
// El recorte de Emi (ambas poses) tiene 78px de alto: se reescala aparte para igualar a Mario.
const EMI_SCALE = PLAYER_SCALE * 32 / 78;
const EMI_ANIM_INTERVAL = 300; // ms entre frames de la animación de caminata de Emi

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
        this.createOsva();
        this.createAgu();
        this.createEmi();
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
            .setFlipX(true)
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

    createOsva() {
        // Osva: mismo patrón que Fede/Paz. El sprite original mira a la derecha;
        // se invierte como Fede (verificar a ojo en pantalla).
        this.osva = this.add.image(0, GROUND_Y, 'osva-idle')
            .setOrigin(0.5, 1)
            .setScale(OSVA_SCALE)
            .setFlipX(true)
            .setDepth(3)
            .setVisible(false);

        this.osvaDistanceAccum = -OSVA_SPAWN_OFFSET;
        this.osvaAnimAccum = 0;
        this.osvaAnimFrame = 0;
    }

    spawnOsva(direction) {
        this.osva.setTexture('osva-idle');
        this.osvaAnimAccum = 0;
        this.osvaAnimFrame = 0;

        const halfWidth = this.osva.displayWidth / 2;
        this.osva.x = direction > 0 ? GAME_WIDTH + halfWidth : -halfWidth;
        this.osva.setVisible(true);
    }

    createAgu() {
        // Agu: mismo patrón que Fede/Paz/Osva. El sprite original mira a la derecha;
        // se invierte como Fede (verificar a ojo en pantalla).
        this.agu = this.add.image(0, GROUND_Y, 'agu-idle')
            .setOrigin(0.5, 1)
            .setScale(AGU_SCALE)
            .setFlipX(true)
            .setDepth(3)
            .setVisible(false);

        this.aguDistanceAccum = -AGU_SPAWN_OFFSET;
        this.aguAnimAccum = 0;
        this.aguAnimFrame = 0;
    }

    spawnAgu(direction) {
        this.agu.setTexture('agu-idle');
        this.aguAnimAccum = 0;
        this.aguAnimFrame = 0;

        const halfWidth = this.agu.displayWidth / 2;
        this.agu.x = direction > 0 ? GAME_WIDTH + halfWidth : -halfWidth;
        this.agu.setVisible(true);
    }

    createEmi() {
        // Emi: mismo patrón que Fede/Paz/Osva/Agu. Aunque en el recorte aislado parecía
        // mirar a la izquierda, en pantalla queda de espaldas a Mario, así que se invierte.
        this.emi = this.add.image(0, GROUND_Y, 'emi-idle')
            .setOrigin(0.5, 1)
            .setScale(EMI_SCALE)
            .setFlipX(true)
            .setDepth(3)
            .setVisible(false);

        this.emiDistanceAccum = -EMI_SPAWN_OFFSET;
        this.emiAnimAccum = 0;
        this.emiAnimFrame = 0;
    }

    spawnEmi(direction) {
        this.emi.setTexture('emi-idle');
        this.emiAnimAccum = 0;
        this.emiAnimFrame = 0;

        const halfWidth = this.emi.displayWidth / 2;
        this.emi.x = direction > 0 ? GAME_WIDTH + halfWidth : -halfWidth;
        this.emi.setVisible(true);
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

        if (direction !== 0) {
            this.osvaDistanceAccum += Math.abs(direction) * WALK_SPEED * dt;
        }

        if (this.osva.visible) {
            this.osva.x -= direction * WALK_SPEED * dt;

            this.osvaAnimAccum += delta;

            if (this.osvaAnimAccum >= OSVA_ANIM_INTERVAL) {
                this.osvaAnimAccum = 0;
                this.osvaAnimFrame = 1 - this.osvaAnimFrame;
                this.osva.setTexture(this.osvaAnimFrame === 0 ? 'osva-idle' : 'osva-walk');
            }

            const osvaHalfWidth = this.osva.displayWidth / 2;

            if (this.osva.x < -osvaHalfWidth || this.osva.x > GAME_WIDTH + osvaHalfWidth) {
                this.osva.setVisible(false);
            }
        }

        if (!this.osva.visible && this.osvaDistanceAccum >= OSVA_SPAWN_DISTANCE) {
            this.spawnOsva(direction);
            this.osvaDistanceAccum = 0;
        }

        if (direction !== 0) {
            this.aguDistanceAccum += Math.abs(direction) * WALK_SPEED * dt;
        }

        if (this.agu.visible) {
            this.agu.x -= direction * WALK_SPEED * dt;

            this.aguAnimAccum += delta;

            if (this.aguAnimAccum >= AGU_ANIM_INTERVAL) {
                this.aguAnimAccum = 0;
                this.aguAnimFrame = 1 - this.aguAnimFrame;
                this.agu.setTexture(this.aguAnimFrame === 0 ? 'agu-idle' : 'agu-walk');
            }

            const aguHalfWidth = this.agu.displayWidth / 2;

            if (this.agu.x < -aguHalfWidth || this.agu.x > GAME_WIDTH + aguHalfWidth) {
                this.agu.setVisible(false);
            }
        }

        if (!this.agu.visible && this.aguDistanceAccum >= AGU_SPAWN_DISTANCE) {
            this.spawnAgu(direction);
            this.aguDistanceAccum = 0;
        }

        if (direction !== 0) {
            this.emiDistanceAccum += Math.abs(direction) * WALK_SPEED * dt;
        }

        if (this.emi.visible) {
            this.emi.x -= direction * WALK_SPEED * dt;

            this.emiAnimAccum += delta;

            if (this.emiAnimAccum >= EMI_ANIM_INTERVAL) {
                this.emiAnimAccum = 0;
                this.emiAnimFrame = 1 - this.emiAnimFrame;
                this.emi.setTexture(this.emiAnimFrame === 0 ? 'emi-idle' : 'emi-walk');
            }

            const emiHalfWidth = this.emi.displayWidth / 2;

            if (this.emi.x < -emiHalfWidth || this.emi.x > GAME_WIDTH + emiHalfWidth) {
                this.emi.setVisible(false);
            }
        }

        if (!this.emi.visible && this.emiDistanceAccum >= EMI_SPAWN_DISTANCE) {
            this.spawnEmi(direction);
            this.emiDistanceAccum = 0;
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
