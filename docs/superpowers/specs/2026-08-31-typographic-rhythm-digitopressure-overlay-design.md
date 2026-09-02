# Lili Reflexologia: ritmo tipografico y capa de digitopuntura

Fecha: 2026-08-31  
Estado: direccion visual aprobada e implementada localmente; validacion tecnica local PASS  
Repositorio: `/Users/agustincastillo/Desktop/LILI REFLEX/web`

## 1. Objetivo

Ejecutar una segunda pasada incremental sobre la landing aprobada para:

1. normalizar interlineados, alineaciones y distancias entre textos, botones y microcopy;
2. agregar detalles interactivos inspirados en digitopuntura como una capa sutil por encima del fondo ya existente;
3. preservar el lotus, el shader mineral, las luces, el unico `VisualStage`, el unico canvas/contexto/renderer/RAF y la conversion exclusiva por WhatsApp;
4. mantener copy, assets, contenido comercial, datos locales, accesibilidad y rendimiento.

La nueva capa no es un fondo nuevo ni un reemplazo del actual. Es una sobreimpresion decorativa dentro del mismo sistema visual.

## 2. Decisiones aprobadas

- Los detalles de digitopuntura seran reconocibles como puntos de presion, anillos y recorridos de pie, mano y rostro, pero seran abstractos y no clinicos.
- No se representaran ubicaciones terapeuticas exactas, meridianos medicos, beneficios, diagnosticos ni promesas de salud.
- La capa estara por encima del lotus, el shader y las luces existentes, pero por debajo de todo texto, glass, enlace, boton o control.
- No habra otro canvas, contexto WebGL, renderer, runtime, RAF ni listener global.
- No habra reaccion continua al cursor, `pointermove`, spotlight, parallax ni uniformes de puntero.
- La respuesta visual ocurrira solamente por estados semanticos discretos ya existentes: seccion activa, seleccion por click/tap, apertura de FAQ y foco visible de teclado.
- En touch y `prefers-reduced-motion`, la geometria podra cambiar de estado de forma inmediata, pero permanecera estatica y sin transiciones animadas.
- Se conserva alineacion izquierda para texto de lectura. No se aplicara justificacion completa a ambos margenes.
- No se cambia ninguna cadena visible.

## 3. Baseline que debe preservarse

- Una landing y diez secciones en el orden actual.
- Un `VisualStage` fijo y compartido.
- Un canvas, un contexto WebGL y un `THREE.WebGLRenderer`.
- Un propietario de RAF.
- Un listener global de scroll.
- Cero listeners visuales `pointermove`.
- Tres luces ambientales.
- Tres `ReflexField`.
- Cero flores, ornamentos botanicos, particulas o videos.
- Fondo estatico en touch y reduced motion.
- Dieciseis enlaces contextuales de WhatsApp.
- Booking y base de datos ausentes del runtime publico.
- Hash del contenido visible y hash de `data/reservations.json` sin cambios.
- Baseline de scroll a 1440 x 900: p95 18.6 ms, cero long tasks.

## 4. Enfoques considerados

### A. Un SVG global superpuesto dentro de `VisualStage` - seleccionado

Agregar una unica capa conceptual `DigitopressureOverlay` dentro del stage compartido. La implementacion final queda declarada en `VisualStage`: usa markup SVG constante y propiedad del repositorio, recibe la superficie activa existente y cambia opacidad/composicion mediante atributos y CSS. Mantenerla en el mismo modulo evita otro limite de Fast Refresh y permite respetar el presupuesto incremental de 5 KB sin alterar la geometria aprobada.

Ventajas:

- garantiza que los detalles esten arriba del fondo actual sin sustituirlo;
- mantiene una sola arquitectura visual;
- conserva trazos nitidos sin costo de otro renderer;
- permite estados discretos por scroll semantico, click/tap y foco;
- tiene fallback estatico natural;
- puede limitarse con presupuestos exactos de nodos y bytes.

### B. Integrar los puntos en el shader WebGL - rechazado

Implicaria nuevos uniforms, logica de geometria procedural y mayor acoplamiento entre interaccion y renderer. Los puntos perderian precision editorial, reduced motion seria mas dificil de auditar y cualquier respuesta a controles acercaria el shader a una arquitectura de puntero que el producto prohibe.

### C. Agregar un SVG diferente por seccion - rechazado

Duplicaria nodos, fondos y reglas. Tambien volveria a fragmentar la continuidad que la pasada anterior consolido y aumentaria el costo de scroll. La landing debe seguir leyendo como una escena continua, no como diez fondos independientes.

## 5. Arquitectura de capas

Dentro de `.visual-webgl-stage` el orden interno sera:

```text
lotus y proteccion del stage
canvas mineral compartido
atmosfera global
tres luces ambientales
capa SVG de digitopuntura
```

El stage completo conserva su nivel por debajo de `#contenido`. Por lo tanto, aunque `DigitopressureOverlay` sea la capa mas alta del fondo, nunca puede cubrir, desenfocar ni interceptar contenido semantico.

Contrato de la nueva capa:

- `position: absolute; inset: 0` dentro del stage fijo;
- `pointer-events: none`;
- `aria-hidden="true"` y sin rol interactivo;
- un solo elemento `svg` global;
- `preserveAspectRatio="xMidYMid slice"`;
- trazos con `vector-effect="non-scaling-stroke"`;
- ningun `filter`, `feGaussianBlur`, mascara pesada o imagen raster;
- ningun `requestAnimationFrame`, timer, observer o browser listener propio.

## 6. Composicion de digitopuntura

El SVG contendra cuatro grupos visuales reutilizables:

1. `foot`: curva vertical, puntos de apoyo, arcos plantares y anillos de presion;
2. `hand`: abanico radial, cinco terminales y dos recorridos suaves;
3. `face`: contorno parcial y una pequena constelacion craneo-facial;
4. `convergence`: lineas que acercan dos grupos sin simular un meridiano medico.

Presupuesto estructural:

- una raiz SVG nueva;
- hasta 24 puntos visibles;
- hasta 8 recorridos;
- hasta 75 nodos SVG descendientes en total;
- cero filtros SVG;
- cero texto o labels dentro del overlay.

Tratamiento visual:

- trazo base entre 0.5 y 1.25 px;
- opacidad de reposo entre 0.04 y 0.10;
- opacidad de detalle activo entre 0.12 y 0.22;
- puntos activos en perla/lavanda; recorridos en orquidea/violeta;
- anillos de 12 a 42 px, sin glow basado en blur;
- ningun punto debe competir con H1, CTAs, mapa o pie nacarado.

## 7. Estados y flujo de datos

### 7.1 Superficie activa

`VisualStage` ya calcula `activeSurface` con el runtime compartido despues de que termina el scroll. Ese mismo valor se pasara a `DigitopressureOverlay`; no se agregara otro calculo de layout ni otro listener.

Mapa de composicion:

| Superficie | Detalle dominante |
|---|---|
| header / footer | convergencia minima |
| hero | pie y un arco de presion |
| introduccion | pie y mano muy tenues |
| tecnicas | pie, mano y rostro como familia |
| mapa | grupo elegido por click, tap o foco |
| lectura | recorrido de pie |
| beneficios | puntos de apoyo y mano |
| experiencia | mano y convergencia |
| propuestas | tres nodos discretos |
| preguntas | rostro tenue y anillos quietos |
| CTA | convergencia de pie y mano |

Los grupos no se montan y desmontan por seccion. Permanecen en el unico SVG y cambian solamente opacidad y transformacion discreta.

### 7.2 Mapa de tecnicas

El mapa mantiene su comportamiento actual. Se separara el estado visual local que responde a hover del estado que autoriza cambios en el fondo:

- `onMouseEnter` puede seguir cambiando el mapa local, pero no la capa global;
- `onFocus`, teclado, `onClick` y tap actualizan un atributo semantico de la seccion;
- CSS usa ese atributo para mostrar `foot`, `hand` o `face` en el overlay;
- no se agrega comunicacion por eventos globales ni listener de pointer.

Esto conserva la regla aprobada: interaccion por control real sin reaccion del fondo al mero movimiento del cursor.

### 7.3 FAQ y foco

- Una FAQ abierta puede llevar el overlay a un estado de anillos mas calmado mediante `.faq-item.is-open`.
- `:focus-visible` en tabs o FAQ puede elevar brevemente la opacidad del grupo correspondiente.
- Hover generico sobre botones o enlaces no modifica el fondo.
- Los CTAs de WhatsApp mantienen sus microinteracciones locales y no publican estado global.

### 7.4 Fallback

Si el selector relacional `:has()` no esta disponible, la capa sigue respondiendo a `activeSurface` y conserva una composicion valida. La integracion con tabs/FAQ es una mejora progresiva, no un requisito para ver el fondo.

## 8. Movimiento

Desktop con puntero fino:

- transiciones de `opacity`, `transform` y `stroke-dashoffset` entre 220 y 360 ms;
- cambio discreto cuando se asienta una seccion o cambia un control;
- ninguna animacion permanente y ningun pulso en loop;
- no mas de un grupo dominante a la vez, salvo la composicion de tecnicas.

Touch, viewport menor a 900 px o reduced motion:

- `animation: none`;
- `transition: none`;
- `transform: none` cuando sea necesario para legibilidad;
- cambio de seleccion inmediato;
- menos grupos visibles y menor opacidad en mobile.

Forced colors:

- el overlay se oculta completamente para no competir con el contenido y los contornos del sistema.

## 9. Sistema tipografico y espaciado

Se consolidaran tokens semanticos en lugar de seguir agregando margenes aislados:

```css
--leading-display
--leading-title
--leading-subtitle
--leading-body
--leading-secondary
--leading-microcopy
--space-eyebrow-title
--space-title-copy
--space-copy-copy
--space-copy-action
--space-action-action
--space-action-microcopy
```

Rangos de aceptacion:

| Relacion | Desktop | Mobile |
|---|---:|---:|
| H1 / display line-height | 1.00-1.08 | 1.04-1.12 |
| H2 line-height | 1.06-1.14 | 1.08-1.18 |
| H3 line-height | 1.16-1.30 | 1.20-1.34 |
| Body line-height | 1.58-1.72 | 1.60-1.76 |
| Microcopy line-height | 1.45-1.62 | 1.48-1.66 |
| Eyebrow a titulo | 16-24 px | 12-18 px |
| Titulo a primer texto | 20-32 px | 16-24 px |
| Parrafo a parrafo | 12-20 px | 12-18 px |
| Ultimo texto a accion | 24-32 px | 20-28 px |
| Boton a boton | 12-16 px | 12-16 px |
| Accion a microcopy | 12-18 px | 12-16 px |

Reglas editoriales:

- body y microcopy alineados a la izquierda;
- titulos con `text-wrap: balance`;
- parrafos con `text-wrap: pretty` cuando el navegador lo soporte;
- nada de `text-align: justify` para texto de lectura;
- entre 54 y 64 caracteres por linea en copy principal;
- entre 62 y 72 caracteres por linea en secundario editorial;
- CTAs de una o dos lineas, nunca recortados ni con una palabra aislada por accidente;
- `overflow-wrap: anywhere` solamente como salvaguarda;
- reducir gaps antes que tipografia en 1024 y tablet;
- apilar antes de comprimir en mobile.

## 10. Normalizacion por superficie

- Hero: equilibrar eyebrow, H1, lead, nota, dos acciones y microcopy mediante los tokens semanticos.
- Introduccion: reducir diferencias arbitrarias entre titulo, parrafos y cita.
- Tecnicas: alinear eyebrow, H3, descripcion, detalle, lista y CTA aunque el contenido tenga longitudes distintas.
- Mapa: igualar la distancia entre intro, tabs, panel y CTA; no mover el mapa por cambios de fondo.
- Lectura: separar frase editorial, cuerpo, lista, aclaracion y CTA sin crear una columna excesivamente larga.
- Beneficios: mantener ritmo repetible entre numero, H3 y parrafo.
- Experiencia: balancear la columna introductoria con los cuatro pasos y evitar un hueco excesivo antes del CTA.
- Propuestas: conservar `margin-top: auto` para alinear CTAs, pero normalizar el espacio minimo texto-accion.
- Preguntas: dar al intro y al accordion una relacion mas compacta en desktop; dentro del FAQ, estabilizar pregunta-respuesta y alturas de linea mobile.
- CTA final y footer: normalizar titulo, dos parrafos, accion y microcopy; conservar aire final sin parecer contenido faltante.

## 11. Archivos previstos

Crear:

- `src/components/effects/DigitopressureOverlay.tsx`

Modificar:

- `src/components/effects/VisualStage.tsx`
- `src/components/sections/TechniqueMap.tsx`
- `src/app/globals.css`
- `scripts/qa-responsive-visual.mjs`
- `scripts/qa-visual-system.mjs` o la prueba estatica equivalente
- `scripts/benchmark-visual-runtime.mjs` solamente si hace falta exponer el nuevo conteo; no para cambiar el benchmark.

No modificar:

- shader de `MineralSurface`;
- `visual-runtime.ts` salvo que una prueba demuestre una necesidad no prevista; la solucion aprobada no lo requiere;
- copy, datos comerciales, URLs de WhatsApp o reservas;
- assets raster, logo, tipografias o mapa anatomico principal.

## 12. Manejo de errores y degradacion

La capa es decorativa y no puede bloquear producto:

- si no monta, la landing conserva el fondo actual completo;
- si CSS relacional no esta disponible, queda el estado por superficie;
- si WebGL falla, el overlay permanece sobre el lotus y el fallback CSS;
- si JavaScript esta deshabilitado, el markup inicial muestra la composicion hero sin controles falsos;
- no se anuncia ningun error al usuario porque no se pierde contenido ni accion;
- cualquier overflow, error de consola o fallo de red causado por la capa es gate de rechazo.

## 13. Estrategia de pruebas

La implementacion comienza con pruebas rojas.

### 13.1 Contratos estaticos

- un solo `DigitopressureOverlay`;
- una sola raiz SVG nueva y hasta 75 descendientes;
- `aria-hidden="true"` y `pointer-events: none`;
- cero filtros SVG y cero loops propios;
- no `pointermove`, mouse tracking ni nuevos listeners globales;
- no cambios en canvas, contexto, renderer, RAF, luces o `ReflexField`;
- no texto medico ni labels dentro del overlay;
- copy y URLs de WhatsApp intactos.

### 13.2 QA rendered

Viewports:

- 1440 x 900;
- 1024 x 768;
- 768 x 1024 touch;
- 390 x 844;
- 320 x 800;
- 1440 x 900 reduced motion;
- 1440 x 900 forced colors.

Validaciones:

- ratios de line-height dentro de los rangos definidos;
- gaps reales entre eyebrow, titulo, textos, botones y microcopy;
- cero colisiones, clipping, overflow o containment issues;
- seleccion por click/tap/foco cambia el detalle correcto;
- hover sin click ni foco no cambia el overlay global;
- FAQ abierta cambia el estado discreto esperado;
- touch y reduced motion tienen cero animaciones del overlay;
- forced colors oculta la capa;
- todos los controles mantienen nombre, foco y semantica.

### 13.3 Rendimiento y presupuestos

- scroll p95 menor o igual a 19.53 ms, equivalente a no empeorar mas de 5% el baseline de 18.6 ms;
- cero long tasks nuevas;
- DOM total menor o igual a 1125 nodos;
- SVG total menor o igual a 707 nodos, partiendo de 632;
- una sola raiz SVG adicional;
- incremento de JavaScript inicial menor o igual a 5 KB decodificados;
- incremento CSS menor o igual a 5 KB decodificados;
- sin incremento de WebGL draws durante sustained scroll;
- arquitectura 1/1/1/1 para stage/canvas/contexto/RAF.

### 13.4 Gates finales

- `TYPOGRAPHIC_RHYTHM=PASS`
- `TEXT_ALIGNMENT=PASS`
- `TEXT_ACTION_SPACING=PASS`
- `DIGITOPRESSURE_OVERLAY=PASS`
- `OVERLAY_ABOVE_EXISTING_BACKGROUND=PASS`
- `OVERLAY_BELOW_CONTENT=PASS`
- `CURSOR_REACTION=ABSENT`
- `TOUCH_OVERLAY_MOTION=STATIC`
- `REDUCED_MOTION=PASS`
- `FORCED_COLORS=PASS`
- `RUNTIME_ARCHITECTURE_PRESERVED=PASS`
- `COPY_PRESERVED=PASS`
- `RESERVATIONS_HASH=UNCHANGED`

## 14. Evidencia visual

Se capturaran antes y despues para hero, tecnicas, mapa, lectura, beneficios, experiencia, propuestas, preguntas y CTA final, mas viewport mobile 390/320, reduced motion y forced colors.

La aprobacion visual se basara en:

- lectura mas descansada;
- distancias consistentes sin homogeneizar todas las composiciones;
- digitopuntura visible como detalle al mirar, no como protagonista inmediato;
- lotus, shader y pie nacarado aun reconocibles como fondo original;
- ninguna capa que parezca una segunda landing o un fondo separado.

## 15. Autorizacion y limites

Esta especificacion autoriza cambios locales y QA local una vez revisada. No autoriza:

- commit;
- push;
- deploy o publicacion;
- mutaciones remotas;
- cambios comerciales;
- envio de mensajes de WhatsApp;
- afirmaciones medicas;
- reemplazo de assets.

El requisito de la skill de ideacion de commitear la especificacion queda subordinado a la prohibicion explicita de commit del prompt maestro. El documento se crea localmente y permanece sin commit.

## 16. Criterio de cierre local

La pasada se considera localmente terminada cuando la nueva capa se percibe como detalle superpuesto sobre el fondo existente, la jerarquia tipografica y los espacios quedan medidos en todos los viewports, los estados semanticos funcionan sin seguimiento de cursor y todos los gates de arquitectura, accesibilidad, rendimiento, copy e integridad pasan con evidencia actual.
