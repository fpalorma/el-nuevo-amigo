# El Nuevo Amigo

## Idioma
Hablar siempre en español en este proyecto, tanto en las respuestas como en comentarios de código cuando aporten contexto no obvio.

## Qué es
Juego 2D pixelart hecho con Phaser 3. El protagonista quiere entrar a un grupo de amigos y para lograrlo debe superar retos: cada integrante del grupo le propone un minijuego, y según el puntaje obtenido se decide si lo supera o no.

Estado actual: v0.1, sólo el "paseo infinito" (caminar/saltar en un escenario sin fin). Todavía no hay NPCs ni minijuegos.

## Stack técnico
- **Phaser 3.55.2** cargado por CDN (jsDelivr) en `index.html`, sin bundler ni npm.
- JS plano con `<script>` clásicos (no ES modules). Todas las clases (`BootScene`, `WalkScene`) y constantes top-level comparten un único scope global del navegador.
  - **Importante:** el orden de los `<script>` en `index.html` importa. Las escenas se cargan antes que `main.js` porque este último las referencia al construir el `config`. Una constante `const` declarada en un archivo que se carga después NO puede volver a declararse en otro archivo (`SyntaxError: already declared`) — por eso `GAME_WIDTH`/`GAME_HEIGHT` viven una sola vez, en `WalkScene.js`, y `main.js` las reutiliza.
- Sin `package.json`, sin proceso de build. Para probar: levantar un server estático desde la raíz (ej. `python -m http.server 8123`) y abrir `http://localhost:8123`. Abrir `index.html` con `file://` rompe la carga de assets por CORS.

## Estructura de archivos
```
index.html                  punto de entrada, orden de <script> importa
assets/                     heredado del proyecto de referencia (ver abajo)
  css/game.css              único CSS propio del juego (NO usar assets/css/style.css)
js/
  main.js                   config de Phaser (resolución, física, escala, lista de escenas)
  scenes/
    BootScene.js             precarga de assets + barra de progreso, arranca 'walk'
    WalkScene.js             el paseo infinito: piso, nubes, jugador, input
```

## Proyecto de referencia
El motor se inspiró en `C:\Users\Usuario\mis-proyectos\Super-Fede-Phaser-main` (un clon de Super Mario Bros en Phaser 3.55.2 con los mismos assets). **No se copió su código**: ese proyecto ata todo el escalado a `window.innerWidth/innerHeight` y genera un mundo finito. Acá se reescribió con resolución fija y mundo scrolleante infinito. Se reutilizaron de esa exploración: la versión de Phaser, las rutas/dimensiones exactas de los assets, y los parámetros de animación de Mario.

## Decisiones de diseño tomadas

- **Resolución base fija: 640×360**, `Phaser.Scale.FIT` + `autoCenter: CENTER_BOTH`, `pixelArt: true`. Todo en píxeles absolutos, no fracciones de pantalla.
  - Centrado: lo maneja **solo Phaser** (vía `autoCenter`, agrega margin inline al canvas). El CSS de `#game` NO debe centrar con flexbox — combinar los dos métodos descentra el canvas (bug ya resuelto).
- **Mundo scrolleante, no cámara que sigue**: el jugador queda fijo en `PLAYER_X = GAME_WIDTH / 3` y lo que se mueve es la textura del piso (`tilePositionX`) y la posición de las nubes. Scroll infinito real en ambas direcciones (adelante y atrás), memoria constante — no se generan ni destruyen tiles.
- **Piso**: `tileSprite` con `assets/scenery/overworld/floorbricks.png` (128×32), altura `FLOOR_H = 48px`. Colisión con un `staticImage` invisible fijo (no se mueve nunca; el mundo se desplaza por textura, no por física).
- **Nubes**: pool fijo de 5 (`CLOUD_COUNT`), texturas `cloud1`/`cloud2`, con parallax (`CLOUD_PARALLAX = 0.3`, se mueven más lento que el piso) y reciclado cuando salen de pantalla por cualquiera de los dos lados.
- **Jugador**: Mario grande (`assets/entities/mario-grown.png`, spritesheet 108×32 → 6 frames de **18×32**, ojo que el frame es de 18px de ancho, no 16). Animaciones `mario-idle` (frame 0), `mario-run` (frames 3→1 invertido, 12fps, loop), `mario-jump` (frame 5). Salto con `JUMP_V = 520` y gravedad global `1400` (en `main.js`).
  - `setOrigin(0.5, 1)`: ancla en los pies, así escalar al personaje no lo despega del piso.
  - **`PLAYER_SCALE = 1.4`** (en `WalkScene.js`): Mario se ve más grande que el resto del escenario a propósito — es una desproporción intencional para que se vean mejor sus detalles pixelart. Confirmado con el usuario, y **aplica a todos los personajes jugables futuros en este escenario** (cualquier "amigo" o variante del protagonista que camine en `WalkScene` debe usar esta misma escala, salvo que se decida lo contrario).
  - La hitbox física (`setSize(14, 32).setOffset(2, 0)`) se sincroniza sola con el `setScale` en Arcade Physics, no hace falta recalcularla a mano.

## Assets en uso (de `assets/`, ya presente en el repo)
| Uso | Ruta | Notas |
|---|---|---|
| Jugador | `assets/entities/mario-grown.png` | 108×32, frames de 18×32 |
| Piso | `assets/scenery/overworld/floorbricks.png` | 128×32 |
| Nubes | `assets/scenery/overworld/cloud1.png`, `cloud2.png` | 294×143 / 198×142, se escalan a 0.22 |

El resto de `assets/` (bloques, enemigos, tuberías, sonido, HUD, fuentes bitmap, `casa_rosada.jpg`, `showcase/`) todavía no se usa — queda disponible para las próximas features (NPCs, minijuegos, HUD de puntaje).

**Pendiente de limpieza (no bloqueante):** `assets/showcase/` (~60MB de GIFs de demo) y `assets/scenery/casa_rosada.jpg` (1.1MB) son restos del proyecto de referencia sin uso actual. Confirmar con el usuario antes de borrarlos.

## Próximos pasos (roadmap)
Cada reto de un integrante del grupo = una escena nueva de Phaser, agregada al array `scene` de `main.js`. `WalkScene` pasa a ser el "hub" que lanza el minijuego correspondiente al cruzarse con el NPC de ese personaje (hay sprite disponible sin usar: `assets/hud/npc.png`, 32×24, 2 frames). Cada minijuego lleva su propio sistema de puntaje y decide si el jugador pasa la prueba.
