# 01 — NPC Fede en WalkScene

**Estado:** Implementado
**Dependencias:** Ninguna (primer spec del proyecto)
**Fecha:** 2026-09-22

**Objetivo:** Agregar a Fede, el primer amigo del grupo, como un NPC estático que reaparece periódicamente en el paseo infinito de `WalkScene` a medida que el jugador camina, sin animación, movimiento propio ni colisión.

## Alcance

**Incluye:**
- Cargar `assets/hud/npc.png` como spritesheet (32×24, 2 frames) en `BootScene`, usado como placeholder visual de Fede.
- En `WalkScene`, un pool de Fede (similar al de nubes) que:
  - Acumula la distancia recorrida por el jugador (en cualquier dirección).
  - Cada `FEDE_SPAWN_DISTANCE = 400` píxeles acumulados, spawnea a Fede fuera de pantalla, en el lado hacia donde el jugador está avanzando.
  - Muestra siempre el frame 0 de `npc.png`, sin animación.
  - Se recicla (se oculta/reposiciona) cuando sale de pantalla por el lado opuesto, igual que las nubes.
  - Se renderiza parado sobre `GROUND_Y`, con `PLAYER_SCALE` (1.4), `setOrigin(0.5, 1)`.
- Sin colisión física: el jugador lo atraviesa visualmente, sin collider ni body.
- Si el jugador no se mueve, no se acumula distancia y no hay nuevos spawns.

**No incluye (queda para specs futuros):**
- Sprite pixelart real de Fede inspirado en la foto (`assets/friends/fede/fede-1.jpg`) — se sigue usando `npc.png` como placeholder hasta que exista ese asset.
- Animaciones de Fede (idle, etc.).
- Movimiento propio de Fede.
- Detección de proximidad / interacción / diálogo con Fede.
- Minijuego o reto asociado a Fede.
- Múltiples NPCs o el resto de los amigos del grupo.

## Modelo de datos

No hay persistencia. Estado nuevo en runtime, dentro de `WalkScene`:

- **Constante** `FEDE_SPAWN_DISTANCE = 400` (píxeles) — junto a las demás constantes de escena (`WALK_SPEED`, `CLOUD_PARALLAX`, etc.).
- **`this.fede`**: un único `Image` (no un array/pool — con 400px de intervalo y 640px de ancho de pantalla alcanza con una instancia, igual que `this.floorBody`). Oculto (`setVisible(false)`) hasta el primer spawn.
- **`this.fedeDistanceAccum`**: acumulador de píxeles recorridos (`Math.abs(direction) * WALK_SPEED * dt`, sumado cada frame en `update()`), se resetea a 0 cada vez que se dispara un spawn.

No se reutiliza `this.clouds` ni su lógica de array — es un caso más simple (una sola entidad, no un pool de N).

## Plan de implementación

1. **`js/scenes/BootScene.js`**: agregar carga del spritesheet de Fede en `preload()`:
   ```js
   this.load.spritesheet('fede', 'assets/hud/npc.png', {
       frameWidth: 32,
       frameHeight: 24
   });
   ```
   (El sistema sigue funcional: solo agrega un asset más a la cola de carga.)

2. **`js/scenes/WalkScene.js`**: declarar `const FEDE_SPAWN_DISTANCE = 400;` junto a las demás constantes top-level del archivo.

3. **`createFede()`** (nuevo método, llamado desde `create()` después de `createPlayer()`): crear `this.fede` como `this.add.image(0, GROUND_Y, 'fede', 0)` (frame 0 fijo), `setOrigin(0.5, 1)`, `setScale(PLAYER_SCALE)`, `setDepth(3)` (misma profundidad que el jugador), `setVisible(false)`. Inicializar `this.fedeDistanceAccum = 0`.

4. **`spawnFede(direction)`** (nuevo método): posiciona a `this.fede` fuera de pantalla en el lado hacia donde avanza el jugador (mismo criterio que `recycleCloud`, adaptado a un `setOrigin(0.5,1)` en vez de centrado): si `direction > 0`, `x = GAME_WIDTH + halfWidth`; si `direction < 0`, `x = -halfWidth`. Lo hace visible (`setVisible(true)`).

5. **`update()`**: después de mover piso y nubes (para reusar la `direction` ya calculada):
   - Si `direction !== 0`: acumular `this.fedeDistanceAccum += Math.abs(direction) * WALK_SPEED * dt`.
   - Si `this.fede.visible`, moverlo con el mismo scroll que el piso: `this.fede.x -= direction * WALK_SPEED * dt` (sin parallax, se mueve al ritmo del piso — es parte del escenario, no del cielo).
   - Si `this.fede.visible` y queda fuera de pantalla por el lado opuesto al de entrada, `setVisible(false)`.
   - Si `this.fedeDistanceAccum >= FEDE_SPAWN_DISTANCE` y `!this.fede.visible`: llamar `spawnFede(direction)` y resetear `this.fedeDistanceAccum = 0`.

   (Sistema queda funcional en cada paso: el paseo sigue andando igual aunque Fede nunca llegue a aparecer.)

6. **Verificación manual** en el navegador (ver sección de criterios de aceptación): levantar un server estático (`python -m http.server 8123`) desde la raíz, abrir `http://localhost:8123`, caminar en ambas direcciones y observar a Fede aparecer/reciclarse.

## Criterios de aceptación

- [ ] `assets/hud/npc.png` se carga como spritesheet `'fede'` (32×24, frameWidth/frameHeight correctos) en `BootScene.preload()`.
- [ ] Al arrancar `WalkScene`, Fede no es visible hasta que el jugador recorre `FEDE_SPAWN_DISTANCE` (400px).
- [ ] Caminando hacia la derecha, Fede aparece desde el borde derecho de la pantalla, parado sobre el piso (`GROUND_Y`), a escala `PLAYER_SCALE` (1.4), mostrando siempre el frame 0 de `npc.png` (sin animación).
- [ ] Caminando hacia la izquierda, Fede aparece desde el borde izquierdo de la pantalla (misma lógica, dirección invertida).
- [ ] Si el jugador se queda quieto, la distancia acumulada no avanza y no aparecen nuevos spawns.
- [ ] El jugador puede atravesar a Fede caminando (sin colisión, sin collider, sin body físico) y también puede saltar sobre/a través de él sin ningún efecto.
- [ ] Fede se mueve junto con el piso (mismo scroll, sin parallax) mientras está visible, y se oculta al salir de pantalla por el lado opuesto al de entrada.
- [ ] Después de ocultarse, Fede vuelve a aparecer tras otros 400px recorridos, repitiendo el ciclo indefinidamente en ambas direcciones (scroll infinito, sin fugas de memoria: se reutiliza la misma instancia, no se crean/destruyen objetos).
- [ ] El resto del comportamiento existente (piso, nubes, salto, animaciones de Mario) sigue funcionando sin cambios.

## Decisiones tomadas y descartadas

- **Placeholder `npc.png` en vez de sprite real de Fede**: no hay herramienta de generación de pixel art en este entorno para producir un sprite a partir de `fede-1.jpg`. Se deja explícitamente pendiente para un spec futuro (o para que el usuario provea el asset). La foto queda en `assets/friends/fede/fede-1.jpg` como referencia de diseño, sin usarse en código todavía.
- **Spawn por distancia recorrida, no por tiempo**: "pasos" se traduce a píxeles acumulados (`Math.abs(direction) * WALK_SPEED * dt`) en vez de un timer, para que sea consistente con que el juego mide progreso por scroll del mundo, no por reloj. Un timer haría aparecer a Fede aunque el jugador esté quieto, lo cual no tiene sentido en un "paseo".
- **Una sola instancia en vez de un pool**: con `FEDE_SPAWN_DISTANCE = 400` y `GAME_WIDTH = 640`, no hace falta más de una instancia visible a la vez (se descarta la siguiente antes de que la anterior vuelva a estar en pantalla). Mantiene memoria constante sin la complejidad de un array como el de nubes.
- **Sin colisión física**: Fede es decorativo en esta primera versión; la detección de proximidad/interacción para lanzar minijuegos se deja para un spec posterior, cuando exista al menos un minijuego al que enlazar.
- **Frame 0 fijo de `npc.png`**: sin animación por pedido explícito del usuario; se usa `this.add.image(..., 'fede', 0)` en vez de un `sprite` con `anims`, ya que no hace falta el sistema de animación de Phaser para un frame estático.
- **Mismo scroll que el piso, sin parallax**: Fede es parte del escenario/terreno (como el piso), no del fondo lejano (como las nubes), por eso se mueve 1:1 con `WALK_SPEED` en vez de aplicar `CLOUD_PARALLAX`.

## Riesgos identificados

- **Desproporción visual**: `npc.png` es un asset pensado originalmente para HUD (32×24), no para un personaje de escenario a tamaño `PLAYER_SCALE`. Al escalarlo 1.4x junto a Mario (18×32 base) puede verse desproporcionado o pixelado. Es esperable como placeholder; se resuelve cuando se reemplace por el sprite real de Fede.
- **Frame 0 poco representativo**: no se verificó visualmente qué contiene cada uno de los 2 frames de `npc.png` antes de elegir el frame 0 fijo. Si al correr el juego se ve mal (por ejemplo, un frame de transición en vez de una pose estática), cambiar a frame 1 es un ajuste de una línea.
- **Cambio de dirección justo al spawnear**: si el jugador invierte la dirección de movimiento en el mismo frame en que se dispara `spawnFede()`, Fede podría aparecer momentáneamente del lado "equivocado". Impacto visual menor y de un solo frame; no se contempla lógica extra para este caso en esta primera versión.
