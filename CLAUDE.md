# El Nuevo Amigo

## Idioma
Hablar siempre en español en este proyecto, tanto en las respuestas como en comentarios de código cuando aporten contexto no obvio.

## Qué es
Juego 2D pixelart hecho con Phaser 3. El protagonista quiere entrar a un grupo de amigos y para lograrlo debe superar retos: cada integrante del grupo le propone un minijuego, y según el puntaje obtenido se decide si lo supera o no.

Estado actual: v0.1, el "paseo infinito" (caminar/saltar en un escenario sin fin) más el primer NPC decorativo (Fede). Todavía no hay minijuegos ni lógica de "cruzarse con el NPC" (Fede por ahora solo aparece y desaparece caminando, sin disparar nada).

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
    WalkScene.js             el paseo infinito: piso, nubes, jugador, input, NPCs (Fede)
.claude/
  agents/
    buddy-maker.md           agente que genera assets + cableado de un amigo nuevo a partir
                              de su nombre y una carpeta con sprites crudos (ver más abajo)
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
- **NPC Fede** (primer "amigo", `createFede()`/`spawnFede()` en `WalkScene.js`): decorativo por ahora, sin física ni minijuego — solo aparece, camina en pantalla y desaparece. Reaparece cada `FEDE_SPAWN_DISTANCE` (400px recorridos por Mario), entrando por el borde de pantalla opuesto a la dirección en que Mario avanza, y se mueve junto con el piso (sin parallax, es parte del escenario).
  - **Escala propia, no `PLAYER_SCALE` directo**: el recorte de Fede tiene mucha más resolución que `mario-grown` (87px de alto vs. 32px del frame de Mario), así que usa `FEDE_SCALE = PLAYER_SCALE * 32 / 87` para quedar del mismo tamaño visual que Mario. Cada amigo nuevo va a tener su propia constante de escala calculada igual, midiendo el alto real de su propio recorte (no asumir 87).
  - **`setFlipX(true)` fijo**: el sprite recortado mira originalmente hacia la derecha; se invierte para que quede de frente a Mario en vez de darle la espalda. Confirmado con el usuario tras verlo corriendo — no es algo deducible de las coordenadas, quedó así por inspección visual.
  - **Animación mínima de 2 frames, constante**: alterna `fede-idle`/`fede-walk` cada `FEDE_ANIM_INTERVAL` (300ms) todo el tiempo que Fede está visible, **sin depender de si Mario se mueve o está quieto** (ajustado a pedido explícito del usuario — la primera versión solo animaba mientras Mario avanzaba, y no se veía natural).

## Assets en uso (de `assets/`, ya presente en el repo)
| Uso | Ruta | Notas |
|---|---|---|
| Jugador | `assets/entities/mario-grown.png` | 108×32, frames de 18×32 |
| Piso | `assets/scenery/overworld/floorbricks.png` | 128×32 |
| Nubes | `assets/scenery/overworld/cloud1.png`, `cloud2.png` | 294×143 / 198×142, se escalan a 0.22 |
| NPC Fede | `assets/friends/fede/fede-standing.png` (clave `fede-idle`), `fede-walk.png` (clave `fede-walk`) | 58×87 / 72×87px. Recortados a mano de `assets/friends/fede/sprites-fede.jpeg` (hoja de sprites provista por el usuario) y con el fondo quitado (chroma key). Nota: el archivo se llama `fede-standing.png` pero la clave de Phaser es `fede-idle` — quedó ese desalineo de nombre, no afecta funcionalidad pero puede confundir si se busca el archivo por la clave. |

El resto de `assets/` (bloques, enemigos, tuberías, sonido, HUD, fuentes bitmap, `casa_rosada.jpg`, `showcase/`) todavía no se usa — queda disponible para las próximas features (minijuegos, HUD de puntaje, más amigos). `assets/hud/npc.png` (32×24, placeholder genérico) sigue sin usarse desde que Fede tiene sprite propio, pero se deja disponible para amigos futuros que todavía no tengan sprite real.

**Pendiente de limpieza (no bloqueante):** `assets/showcase/` (~60MB de GIFs de demo) y `assets/scenery/casa_rosada.jpg` (1.1MB) son restos del proyecto de referencia sin uso actual. Confirmar con el usuario antes de borrarlos.

## Agente `buddy-maker`
`.claude/agents/buddy-maker.md` automatiza el proceso de convertir la hoja de sprites cruda de un amigo nuevo en sus assets finales y su cableado en `WalkScene`, replicando exactamente lo que se hizo a mano para Fede (explorar la hoja, recortar pose parada + pose secundaria para la animación, chroma key, calcular escala propia, `setFlipX` según corresponda, cablear `createX()`/`spawnX()`).

Se invoca dándole el **nombre del amigo** y la **carpeta con sus sprites sin procesar**. Instrucciones explícitas para no generalizar de más: replica el patrón repetitivo de Fede tal cual para cada amigo nuevo, y **no** refactoriza `WalkScene` a un sistema genérico de NPCs por su cuenta — eso queda pendiente de decisión hasta que haya varios amigos armados y se vea si vale la pena (ver roadmap).

## Próximos pasos (roadmap)
Cada reto de un integrante del grupo = una escena nueva de Phaser, agregada al array `scene` de `main.js`. `WalkScene` pasa a ser el "hub" que lanza el minijuego correspondiente al cruzarse con el NPC de ese personaje — hoy Fede aparece y desaparece caminando pero no dispara nada; falta la detección de "cruce" con Mario y el enganche al minijuego. Cada minijuego lleva su propio sistema de puntaje y decide si el jugador pasa la prueba.

Para agregar el resto de los amigos, usar el agente `buddy-maker` (ver arriba) en vez de repetir el proceso de recorte/chroma-key/cableado a mano. Cuando haya 2-3 amigos así, evaluar si conviene generalizar el patrón `createFede`/`spawnFede` repetido en `WalkScene` a algo menos duplicado — no adelantar esa decisión antes de tener casos reales.
