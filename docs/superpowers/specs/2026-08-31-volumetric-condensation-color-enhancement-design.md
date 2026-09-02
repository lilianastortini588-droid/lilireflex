# Lili Reflexología: condensación volumétrica y realce cromático

Fecha: 2026-08-31  
Estado: especificación escrita aprobada por el propietario  
Repositorio: `/Users/agustincastillo/Desktop/LILI REFLEX/web`

## 1. Objetivo

Evolucionar el sistema visual aprobado para:

1. aumentar la presencia cromática del fondo mineral y del lotus;
2. hacer más legible la red global de digitopuntura agregada en la pasada anterior;
3. eliminar las tres luces CSS que se atenúan, cambian de posición y vuelven a encenderse aleatoriamente;
4. reemplazarlas por un campo de vapor de condensación volumétrico, renderizado con Three.js/WebGL dentro del único shader y runtime existentes;
5. preservar estructura, copy, conversión exclusiva por WhatsApp, datos locales, accesibilidad y rendimiento.

El resultado debe sentirse como condensación tibia y perlada sobre un vidrio mineral oscuro: profundo, lento y orgánico. No debe parecer humo espeso, niebla de escenario, partículas, fuego, plasma, neón ni un fondo nuevo separado.

## 2. Decisiones aprobadas

- El vapor será volumétrico y tridimensional, calculado mediante ray marching sobre un campo de densidad 3D.
- La implementación usará el `THREE.WebGLRenderer`, `THREE.ShaderMaterial`, canvas, escena, plano fullscreen y propietario de RAF ya existentes en `MineralSurface`.
- No se agregará otro canvas, renderer, escena paralela, material adicional, textura, `Data3DTexture`, framebuffer, render target, postproceso ni segundo pase.
- No habrá partículas, sprites, billboards, instancing ni geometría de humo.
- No habrá `Math.random`, temporizadores de encendido/apagado ni reposicionamiento autónomo por ciclos.
- No habrá reacción al cursor ni listener visual `pointermove`.
- El movimiento será continuo, lento y determinista. La superficie visible seguirá modulando fase e intensidad mediante `activeSurface`.
- Touch y `prefers-reduced-motion` mostrarán una única imagen estática del mismo volumen WebGL.
- Save Data, memoria baja, viewport extremo, fallo de importación de Three.js o fallo WebGL conservarán el fallback CSS estático existente, con el nuevo realce cromático.
- `forced-colors: active` continuará ocultando todo el stage decorativo.
- No se modificará ninguna cadena visible.

## 3. Baseline que debe preservarse

- Una landing con el mismo orden de secciones, navegación y CTAs.
- Un `VisualStage` fijo y compartido.
- Un canvas, un contexto WebGL y un `THREE.WebGLRenderer`.
- Un `THREE.ShaderMaterial`, una geometría fullscreen y un draw call por frame renderizado.
- Un propietario de RAF y un listener global de scroll.
- Cero listeners visuales `pointermove`.
- Tres `ReflexField` deterministas.
- Una red SVG global de digitopuntura con 42 descendientes, 24 puntos, 8 recorridos, 6 anillos y cero filtros.
- WebGL estático en touch y reduced motion; fallback en Save Data, memoria baja y viewport menor a 320 px.
- Pausa efectiva de WebGL durante scroll sostenido.
- Dieciséis enlaces contextuales de WhatsApp.
- Booking, agenda y persistencia gestionada ausentes del runtime público.
- `data/reservations.json` sin cambios y fuera de Git.

## 4. Enfoques considerados

### A. Ray marching volumétrico dentro del shader existente — seleccionado

El fragment shader recorre una profundidad virtual con un número fijo y pequeño de muestras. Cada muestra consulta ruido tridimensional multicapa, calcula densidad, absorción y dispersión, y acumula color/alpha de atrás hacia adelante.

Ventajas:

- volumen 3D real dentro de WebGL;
- un solo renderer, material, plano y draw call;
- profundidad y continuidad sin nodos DOM ni partículas;
- calidad adaptable mediante una cantidad acotada de pasos;
- fallback estático natural;
- elimina por completo el sistema aleatorio anterior.

### B. Sprites o billboards instanciados — rechazado

Agregaría geometría, blending transparente, ordenamiento y una lectura de partículas. El resultado se acercaría a humo o polvo y no a condensación continua.

### C. Volumen multipass con render target — rechazado

Podría aumentar la fidelidad, pero agregaría framebuffers, memoria, pases y complejidad. No es proporcional para un fondo de landing y rompe el principio de un único pase visual liviano.

## 5. Arquitectura final de capas

Dentro de `.visual-webgl-stage`, de atrás hacia adelante:

```text
lotus realzado y protección cromática del stage
canvas Three.js: mineral + condensación volumétrica en un solo shader
atmósfera global CSS existente
red SVG global de digitopuntura realzada
```

`#contenido` permanece por encima de todo el stage. El vapor y la red no pueden interceptar eventos, cubrir controles ni convertirse en contenido semántico.

Se elimina esta capa completa:

```text
AmbientLightLayer
  3 spans de luz radial
  ciclo lit/dim
  2 setTimeout
  Math.random
```

No se reemplaza por un componente nuevo. La responsabilidad pasa al shader existente.

## 6. Campo volumétrico 3D

### 6.1 Coordenadas y cámara

El plano ortográfico fullscreen continúa generando un fragmento por píxel. Para cada fragmento:

- `uv` se transforma al espacio centrado y corrige aspect ratio;
- se define un origen de rayo en `vec3` a partir de `uv` y la fase de superficie;
- se define una dirección con profundidad positiva y una deriva lateral mínima;
- se recorren hasta ocho posiciones dentro de un volumen virtual.

Aunque la salida sea una imagen 2D, el campo consultado y la integración ocurren en coordenadas `vec3`; la apariencia deriva de densidad a distintas profundidades, no de una textura 2D desplazada.

### 6.2 Ruido y densidad

El shader incorporará:

- `hash3` o hash equivalente para ruido tridimensional;
- `noise3(vec3)` interpolado;
- `fbm3(vec3)` con tres octavas como máximo;
- una capa amplia para masas de vapor;
- una capa más fina para filamentos de condensación;
- una máscara espacial que concentre densidad en laterales y tercio inferior;
- un corredor central de menor densidad para conservar la lectura del hero y de los paneles.

La densidad será determinista. `uTime` producirá un desplazamiento lento y continuo, mientras que `uPhase`, `uScale` y `uIntensity` ya existentes variarán la composición por sección.

### 6.3 Integración y color

Cada paso del rayo acumulará:

- absorción suave para dar espesor;
- dispersión orquídea/violeta en profundidad;
- borde perlado en gradientes de densidad;
- transparencia premultiplicada compatible con el renderer actual.

La acumulación terminará anticipadamente cuando el alpha sea suficiente. No habrá blanco opaco ni zonas lechosas encima del texto.

Paleta del vapor:

```text
profundidad: night + deep violet
cuerpo: violet + orchid
borde disperso: lavender + pearl
```

### 6.4 Calidad adaptativa

El loop GLSL tendrá un máximo compilable de ocho pasos:

- tier `smooth`: 8 pasos;
- tier `balanced`: 6 pasos;
- tier `recovery`: 4 pasos;
- política `static`: 6 pasos en una única imagen;
- política `fallback`: sin shader, solamente fondo CSS realzado.

La cantidad efectiva de pasos se expondrá mediante un uniform numérico, con corte dentro del loop fijo. Cambiar de tier no recreará material, escena ni renderer.

## 7. Movimiento

- Velocidad visual objetivo: un desplazamiento completo perceptible en 28–42 segundos.
- Dirección principal: ascenso lento con deriva lateral menor.
- Variación secundaria: torsión suave, sin pulsos de opacidad global.
- No habrá estados `lit`, `dim`, `relight` ni saltos de ubicación.
- El movimiento se detendrá mientras `visualRuntime` publique `scrolling: true`.
- Al terminar el scroll, continuará desde el tiempo global; no habrá flash ni reinicio visible.
- Al volver de `document.hidden`, se reutilizará el runtime actual sin temporizadores independientes.

## 8. Realce cromático

### 8.1 Fondo

Cambios objetivo:

- `.visual-webgl-stage::before`:
  - opacidad `0.64` -> `0.78`;
  - `saturate(0.96)` -> `saturate(1.12)`;
  - `contrast(0.98)` -> `contrast(1.04)`;
  - reducir el primer velo night de `0.42` a `0.32`;
  - reducir el velo medio de `0.20` a `0.15`;
- `body`:
  - halo violeta superior de alpha `0.30` a `0.40`;
- `.visual-global-atmosphere`:
  - opacidad `0.58` a `0.66`;
  - gradiente blush `0.17` a `0.21`;
  - gradiente lavender `0.19` a `0.24`.

La máscara radial y los bordes oscuros permanecen para sostener contraste. No se aplicará un lavado uniforme por encima del lotus.

### 8.2 Red de digitopuntura

Las opacidades objetivo serán:

```text
base de motivos: 0.075
header/footer, convergencia: 0.12
hero/reading, pie: 0.26
introduction/benefits, pie y mano: 0.18
techniques, pie/mano/rostro: 0.20
map, motivo seleccionado: 0.34
experience/cta: 0.21
promotions, convergencia: 0.20
questions, rostro: 0.22
FAQ abierta, anillos: 0.88
```

Además:

- recorrido principal: stroke `0.95`;
- recorrido secundario: stroke `0.68`, opacidad `0.58`;
- anillos: opacidad base `0.56`;
- puntos: relleno pearl, borde orchid y alpha visible sin glow/filtro SVG;
- transiciones existentes de 320 ms solamente en desktop fine-pointer.

El realce debe permitir reconocer el detalle sin competir con el mapa anatómico, el pie principal, el lotus o el texto.

## 9. Estados por superficie

El vapor no tendrá escenas aleatorias. La continuidad por sección se obtiene con los uniforms actuales:

- `hero` y `cta`: densidad media-alta y borde perlado más presente;
- `introduction`, `benefits` y `questions`: densidad baja y corredor central más ancho;
- `techniques` y `map`: filamentos algo más definidos para acompañar recorridos;
- `reading` y `promotions`: masa amplia y lenta;
- `header` y `footer`: densidad mínima.

Estas diferencias se derivarán de `webglIntensity`, `shaderScale` y `shaderPhase`; no se agregará otro estado React ni un nuevo contrato de datos si los valores existentes alcanzan.

## 10. Accesibilidad y fallbacks

- Canvas y SVG siguen con `aria-hidden="true"`.
- Todo el stage mantiene `pointer-events: none`.
- Touch/coarse pointer: WebGL `static`, sin movimiento.
- `prefers-reduced-motion: reduce`: WebGL `static`, sin movimiento.
- Save Data, menos de 4 GB reportados, viewport menor a 320 px o fallo WebGL: `fallback` CSS.
- `forced-colors: active`: stage oculto.
- No se depende del vapor para comunicar estado, técnica, disponibilidad ni acción.

## 11. Cambios de archivos previstos

- Modificar `src/components/effects/MineralSurface.tsx`:
  - ruido 3D, ray marching, densidad, scattering y uniform de calidad;
  - dataset renderizado que identifique `raymarch-3d` y cantidad de pasos;
  - adaptación de pasos a tier sin recrear recursos.
- Modificar `src/components/effects/VisualStage.tsx`:
  - retirar `AmbientLightLayer`;
  - preservar orden lotus/canvas/atmósfera/digitopuntura.
- Eliminar `src/components/effects/AmbientLightLayer.tsx`.
- Eliminar `src/lib/ambient-light.ts`.
- Modificar `src/app/globals.css`:
  - retirar reglas de luces;
  - realzar fondo y digitopuntura;
  - actualizar fallbacks de motion/forced colors.
- Reemplazar `scripts/qa-ambient-light.mjs` por un contrato de vapor volumétrico.
- Actualizar `scripts/run-qa.mjs`, `scripts/qa-visual-system.mjs`, `scripts/qa-responsive-visual.mjs`, `scripts/qa-visual-runtime-rendered.mjs` y `scripts/benchmark-visual-runtime.mjs` según corresponda.

## 12. Estrategia TDD

Antes de modificar producto se escribirán contratos que fallen porque todavía existen luces CSS y no existe el volumen:

1. fuente:
   - `VisualStage` no importa ni renderiza `AmbientLightLayer`;
   - no existen `Math.random`, `setTimeout`, `data-light-phase` ni `data-ambient-light` en el sistema visual;
   - el shader contiene ruido `vec3`, campo de densidad, integración de profundidad y loop acotado;
   - Three.js sigue importándose dinámicamente;
2. DOM renderizado:
   - cero capas y cero nodos de luz ambiental;
   - un canvas, un stage y un propietario de RAF;
   - `data-vapor-field="raymarch-3d"` presente en el canvas;
   - la red SVG sigue siendo una sola capa pasiva;
3. comportamiento:
   - pointermove no altera uniforms ni estado visual;
   - desktop anima dentro del runtime compartido;
   - touch y reduced motion permanecen estáticos;
   - scroll sostenido publica target FPS 0 y no dibuja;
4. visual:
   - screenshots de hero, map, questions y CTA en 1440;
   - hero, technique y CTA en 390/320;
   - reduced motion y forced colors.

Cada contrato se comprobará RED antes de implementar y GREEN después.

## 13. Presupuestos y gates

Se capturará un baseline nuevo contra el estado actual antes de tocar producto.

Gates máximos de esta pasada:

```text
canvases = 1
webglContexts = 1
stages = 1
rafOwners = 1
windowScrollListeners = 1
windowPointerListeners = 0
ambientLightLayers = 0
ambientLights = 0
vaporField = raymarch-3d
materials = 1
renderPassesPerDraw = 1
textures = 0
renderTargets = 0
digitopressureOverlays = 1
digitopressureDescendants = 42
DOM <= baseline actual
SVG <= baseline actual
JS inicial adicional <= 8 KB decodificados contra baseline de esta pasada
CSS inicial no debe crecer: delta <= 0, porque se eliminan las luces
idle/pointer/scroll p95 <= 19.53 ms en Chrome/Metal 1440x900
frames > 32 ms = 0 durante las muestras controladas
long tasks = 0
WebGL draws durante scroll sostenido = 0
console issues = 0
network failures = 0
document horizontal overflow = 0
```

Si ocho pasos no cumplen rendimiento, se reducirá trabajo matemático u octavas antes de bajar calidad. El tier `smooth` no bajará de seis pasos sin nueva aprobación.

## 14. Integridad del producto

- Copy visible, jerarquía, navegación, orden de secciones y CTAs sin cambios.
- Dieciséis hrefs de WhatsApp sin cambios.
- Ningún booking, agenda, formulario o claim médico nuevo.
- `data/reservations.json` hash idéntico antes y después.
- Sin commit, push, deploy ni mutación remota.
- Checkout sucio y archivos no rastreados preservados.

## 15. Validación visual

La implementación se comparará con las capturas aceptadas de la pasada anterior y con capturas nuevas del mismo viewport.

Ledger mínimo de fidelidad:

```text
punto | baseline | render final | corrección o decisión
hero | jerarquía y copy | color, vapor, contraste | resultado
lotus | presencia actual | saturación realzada sin lavado | resultado
digitopuntura | demasiado tenue | detalle reconocible | resultado
glass/texto | legibilidad actual | sin pérdida por vapor | resultado
map/FAQ | estados aprobados | mismo comportamiento y mayor detalle | resultado
mobile | fondo estático | misma composición sin animación | resultado
```

Se usará Browser/IAB primero. Si continúa sin una instancia disponible, se documentará el error exacto y se utilizará Chrome aislado por CDP. `view_image` será obligatorio sobre baseline y render final.

## 16. Criterios de aceptación

La pasada queda localmente aceptada solamente si:

1. las luces aleatorias fueron eliminadas, no ocultadas;
2. el vapor visible proviene del shader volumétrico 3D del único canvas;
3. no existen nuevos timers, listeners, RAF, renderer, material, textura o pase;
4. fondo y digitopuntura son claramente más visibles en comparación directa;
5. copy, layout, glass, controles y contraste permanecen intactos;
6. touch y reduced motion son estáticos;
7. todos los gates funcionales, visuales, responsive y de rendimiento terminan con exit 0;
8. no se realizó commit, push ni deploy.

El resultado es un `LOCAL_RENDERED_PASS`. No implica validación en Safari, Firefox, hardware físico ni dominio desplegado.
