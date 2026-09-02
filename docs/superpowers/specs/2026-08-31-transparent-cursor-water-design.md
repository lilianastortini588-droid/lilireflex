# Lili Reflexología: agua transparente reactiva y adaptativa

Fecha: 2026-08-31  
Estado: especificación aprobada por el propietario — opción A  
Repositorio: `/Users/agustincastillo/Desktop/LILI REFLEX/web`

## 1. Objetivo

Reemplazar el vapor volumétrico restaurado por una superficie de agua transparente que responda al movimiento del cursor con ondas físicamente continuas, alta nitidez y calidad gráfica autonivelada según la capacidad real del equipo.

El agua debe sentirse como una película líquida limpia sobre el fondo mineral existente. No debe verse como humo, gel, una mancha que persigue al cursor, una pecera azul, una nueva imagen de fondo ni una capa que compita con el texto.

## 2. Decisión aprobada

Se implementará una simulación de altura GPU `ping-pong` dentro del único runtime Three.js existente.

- Un canvas, un contexto WebGL, un `THREE.WebGLRenderer` y un propietario de RAF.
- Dos render targets internos que alternan lectura y escritura.
- Un pase de simulación por frame dibujado: propagación, velocidad, amortiguación e impulso del cursor.
- Un pase de presentación por frame dibujado: normales, Fresnel, especular, crestas, cáusticas y alpha.
- Dos materiales fullscreen y dos llamadas de render por frame dibujado.
- Un listener pasivo `pointermove`; el evento solamente actualiza el próximo impulso. El RAF compartido consume el estado.
- Sin otro canvas, renderer, RAF, temporizador, partículas, sprites, postprocesador ni librería adicional.

Esta decisión reemplaza de forma explícita el límite anterior de cero render targets y un draw call. Se preservan el único canvas, renderer y runtime compartido.

## 3. Capas

De atrás hacia adelante:

```text
fondo y lotus actuales
agua transparente WebGL
atmósfera cromática existente
red SVG global de digitopuntura
contenido y controles
```

El agua y la red mantienen `pointer-events: none` y `aria-hidden="true"`. El listener vive en `window`, no en el canvas decorativo.

## 4. Simulación

Cada texel del render target codifica:

- canal R: altura;
- canal G: velocidad vertical;
- canales B/A: reserva y alpha estable.

El shader de simulación consulta los cuatro vecinos ortogonales, calcula el laplaciano, integra velocidad y altura y aplica amortiguación. El cursor agrega un impulso gaussiano con un borde opuesto menor para producir una onda y no una elevación permanente.

Los eventos del puntero se acumulan solamente como posición, velocidad y fuerza pendiente. La posición consumida se suaviza críticamente y la fuerza queda acotada. No se crea trabajo gráfico desde el handler.

## 5. Presentación óptica

El shader final deriva normales mediante diferencias centrales sobre el campo de altura y suma una ondulación ambiental analítica muy leve. Sobre esa normal calcula:

- Fresnel pearl/lavender en ángulos rasantes;
- reflejo especular de alta frecuencia;
- crestas finas en cambios de altura;
- cáusticas violet/orchid de baja opacidad;
- sombra óptica compensada para reforzar volumen sin oscurecer el fondo;
- máscara radial y alpha acotado para proteger texto y controles.

La salida sigue siendo transparente y no reemplaza el lotus ni captura el DOM. El agua crea volumen mediante luz y normales; el fondo real permanece debajo sin duplicarse.

## 6. Calidad adaptativa

El sistema comienza en `high` y usa cuatro niveles:

| Tier | FPS objetivo | DPR máximo | Eje mayor de simulación |
|---|---:|---:|---:|
| `ultra` | 60 | 1.75 | 512 px |
| `high` | 60 | 1.50 | 384 px |
| `balanced` | 45 | 1.25 | 320 px |
| `recovery` | 30 | 1.00 | 224 px |

La decisión combina:

- cadencia entregada por RAF;
- tiempo de CPU alrededor de los dos pases;
- tiempo GPU mediante `EXT_disjoint_timer_query_webgl2` cuando exista;
- fallback a métricas CPU/RAF cuando la extensión no esté disponible.

La degradación requiere presión sostenida; la recuperación exige una ventana estable más larga. `ultra` solamente se activa después de estabilidad comprobada. La histéresis evita oscilaciones. Un cambio de tier puede redimensionar los targets y el DPR, pero nunca crea otro runtime.

## 7. Políticas y accesibilidad

- Desktop con puntero fino: agua animada y reactiva.
- Touch o puntero grueso: una imagen WebGL estática, sin listener.
- `prefers-reduced-motion`: una imagen WebGL estática, sin listener.
- Save Data, memoria reportada menor a 4 GB, viewport menor a 320 px o fallo WebGL: fallback CSS existente.
- `forced-colors: active`: stage decorativo oculto.
- Scroll sostenido: cero draws hasta que finalice el scroll.
- Pestaña oculta: runtime pausado y queries GPU descartadas al desmontar.

## 8. Contratos que se preservan

- Orden, copy y jerarquía de la landing.
- Conversión exclusiva por WhatsApp.
- Dieciséis enlaces de WhatsApp y ausencia de booking interno.
- Fondo, lotus, pie perlado, mapas anatómicos y red SVG de digitopuntura.
- Un listener global de scroll, un propietario de RAF y un canvas.
- `data/reservations.json` sin cambios.
- Sin commit, push, deploy, envío ni mutación remota.

## 9. Verificación requerida

- Pruebas unitarias de configuración, simulación, shaders, controlador adaptativo y arquitectura.
- Typecheck, lint, build y suite local completa.
- QA renderizada desktop, mobile, touch, reduced motion, viewport extremo y forced colors.
- Movimiento de puntero real durante QA para comprobar impulso, propagación y ausencia de listeners duplicados.
- Benchmark idle, pointer y scroll con métricas estructurales, consola/red y captura visual.
- Comparación de copy, secciones, enlaces WhatsApp y hash de reservas.

