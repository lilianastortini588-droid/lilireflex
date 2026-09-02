# Typographic Rhythm and Digitopressure Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar interlineados, alineaciones y espacios de toda la landing, y sumar una unica red SVG de digitopuntura por encima del fondo existente que responda solamente a superficies y controles semanticos.

**Architecture:** `VisualStage` conserva el unico runtime, canvas, contexto, renderer, RAF y suscripcion de scroll. La capa conceptual `DigitopressureOverlay` se declara en el mismo modulo como markup SVG constante y propiedad del repositorio, y recibe solamente `activeSurface`; los estados de mapa y FAQ se exponen con atributos DOM y CSS relacional, sin eventos globales ni seguimiento del puntero. Los tokens tipograficos se centralizan en `globals.css` y se validan por mediciones renderizadas en la matriz responsive existente.

**Tech Stack:** Next.js 16.3.2, React 19.2.8, TypeScript 5, CSS global, SVG declarativo, Node test runner, Chrome DevTools Protocol y QA Browser.

**Spec:** `docs/superpowers/specs/2026-08-31-typographic-rhythm-digitopressure-overlay-design.md`

## Global Constraints

- Trabajar en `/Users/agustincastillo/Desktop/LILI REFLEX/web`; el directorio padre no es el repositorio Git.
- Preservar el checkout sucio, todos los archivos no rastreados y `data/reservations.json`; no usar reset, clean ni checkout destructivo.
- No hacer commit, push, deploy, publicacion, mutacion remota ni envio de WhatsApp.
- Mantener exactamente un `VisualStage`, canvas, contexto WebGL, `THREE.WebGLRenderer`, propietario de RAF y listener global de scroll.
- Mantener cero listeners globales `pointermove` y no agregar reaccion visual continua al cursor.
- Mantener tres luces ambientales, tres `ReflexField`, dieciseis enlaces de WhatsApp y cero booking en el runtime publico.
- No cambiar copy, datos comerciales, URLs de WhatsApp, assets, logo, tipografias ni mapa anatomico principal.
- La nueva capa debe estar por encima de lotus, canvas, atmosfera y luces existentes, pero por debajo de `#contenido`.
- La nueva capa admite una raiz SVG, hasta 24 puntos, hasta 8 recorridos, hasta 75 descendientes SVG, cero filtros y cero labels.
- Touch, viewport menor o igual a 900 px y `prefers-reduced-motion: reduce` deben mantener la capa sin animaciones ni transiciones.
- `forced-colors: active` debe ocultar la capa decorativa.
- Presupuesto final: DOM <= 1125, SVG <= 707, JS inicial adicional <= 5 KB decodificados, CSS adicional <= 5 KB, scroll p95 <= 19.53 ms y cero long tasks.
- Los checkpoints de este plan son locales y sin commit, porque la prohibicion explicita del prompt maestro prevalece sobre la recomendacion generica de commits de la skill.

---

## Execution Record

- Opcion ejecutada: implementacion inline aprobada por el propietario sobre el checkout actual, sin commit, push ni deploy.
- TDD final: el contrato se implemento como cinco pruebas renderizadas en `qa-visual-runtime-rendered.mjs`; se prefirio evidencia DOM/computed-style/interaccion real frente a inspeccion fragil de texto fuente.
- Optimizacion de presupuesto: el SVG constante se integro en `VisualStage` para conservar los 42 descendientes aprobados con incrementos de JS de 4601 bytes y CSS de 4984 bytes.
- Runtime final: DOM 1109, SVG 647, un overlay, un canvas, un RAF, un listener de scroll, cero listeners de puntero, scroll p95 17.6 ms, cero long tasks y cero draws WebGL durante scroll.
- Matriz de produccion local: 1440, 1024, 768 touch, 390 touch, 320 touch, reduced motion y forced colors terminaron con exit 0; 16 enlaces de WhatsApp y booking ausente.
- Browser integrado: `No browser is available` y `agent.browsers.list() = []`; se uso el fallback autorizado de Chrome aislado por CDP.

---

### Task 1: Congelar integridad y escribir los contratos rojos del overlay

**Files:**
- Modify: `scripts/qa-visual-system.mjs:160-267`
- Modify: `scripts/benchmark-visual-runtime.mjs:177-205`
- Read only: `src/components/effects/VisualStage.tsx`
- Read only: `src/components/sections/TechniqueMap.tsx`
- Read only: `src/components/sections/Questions.tsx`
- Read only: `src/lib/visual-runtime.ts`
- Read only: `data/reservations.json`

**Interfaces:**
- Consumes: arquitectura actual marcada por `data-visual-runtime="shared"` y `data-visual-raf-owner="visual-stage"`.
- Produces: un contrato estatico que exige `DigitopressureOverlay`, sus limites estructurales, los atributos semanticos del mapa y los tokens tipograficos.

- [ ] **Step 1: Registrar el estado y los hashes previos sin modificar archivos de producto**

Run:

```bash
git status --short
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
shasum -a 256 data/reservations.json
curl -fsS http://127.0.0.1:3000/ >/dev/null
```

Expected:

```text
El status conserva el trabajo existente; branch main; HEAD 3e836571881564aae3fb6fadc286d27531a7c5b4; reservations SHA-256 1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad; HTTP 200.
```

- [ ] **Step 2: Exponer bytes decodificados de JS y CSS antes de cambiar producto**

Add to the `structural` result in `scripts/benchmark-visual-runtime.mjs`:

```js
initialJsDecodedBytes: performance.getEntriesByType('resource')
  .filter((entry) => new URL(entry.name).pathname.endsWith('.js'))
  .reduce((total, entry) => total + (entry.decodedBodySize || entry.transferSize || 0), 0),
initialCssDecodedBytes: performance.getEntriesByType('resource')
  .filter((entry) => new URL(entry.name).pathname.endsWith('.css'))
  .reduce((total, entry) => total + (entry.decodedBodySize || entry.transferSize || 0), 0),
```

This instrumentation changes only local QA output and makes the before/after byte budget comparable on the same development server.

- [ ] **Step 3: Capturar el benchmark anterior contra el servidor actual**

Run:

```bash
baseline_dir=$(mktemp -d /tmp/lili-digitopressure-baseline.XXXXXX)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9225 \
  --user-data-dir="$baseline_dir/chrome" \
  --disable-gpu-sandbox \
  about:blank >"$baseline_dir/chrome.log" 2>&1 &
baseline_chrome_pid=$!
QA_CDP_HTTP_URL=http://127.0.0.1:9225 \
QA_BASE_URL=http://127.0.0.1:3000/ \
QA_VISUAL_LABEL=digitopressure-before \
QA_OUTPUT_PATH="$baseline_dir/benchmark-before.json" \
QA_SCREENSHOT_PATH="$baseline_dir/benchmark-before.png" \
node scripts/benchmark-visual-runtime.mjs
kill "$baseline_chrome_pid"
```

Expected:

```text
benchmark-before.json conserva nodes, SVG, p95, long tasks, WebGL draws, initialJsDecodedBytes e initialCssDecodedBytes; scroll p95 de referencia 18.6 ms y cero long tasks.
```

Keep the exact `baseline_dir` path in the execution notes for Task 5.

- [ ] **Step 4: Agregar una prueba estatica que describa la capa todavia inexistente**

Append to `scripts/qa-visual-system.mjs`:

```js
test("the digitopressure overlay is one passive semantic layer", async () => {
  const [overlaySource, stageSource, mapSource, questionsSource, cssSource] =
    await Promise.all([
      readFile(
        new URL("../src/components/effects/DigitopressureOverlay.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../src/components/effects/VisualStage.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../src/components/sections/TechniqueMap.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../src/components/sections/Questions.tsx", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    ]);

  assert.equal((overlaySource.match(/<svg\b/g) ?? []).length, 1);
  assert.ok((overlaySource.match(/<path\b/g) ?? []).length <= 8);
  assert.ok((overlaySource.match(/data-pressure-point=/g) ?? []).length <= 24);
  assert.equal((overlaySource.match(/<filter\b|feGaussianBlur/g) ?? []).length, 0);
  assert.match(overlaySource, /aria-hidden="true"/);
  assert.match(overlaySource, /data-digitopressure-overlay="true"/);
  assert.doesNotMatch(
    overlaySource,
    /requestAnimationFrame|setInterval|setTimeout|addEventListener|pointermove|mousemove|useEffect|useLayoutEffect/,
  );

  assert.match(stageSource, /<DigitopressureOverlay surface=\{activeSurface\} \/>/);
  assert.equal((stageSource.match(/<MineralSurface\b/g) ?? []).length, 1);
  assert.equal((stageSource.match(/<AmbientLightLayer\b/g) ?? []).length, 1);
  assert.match(mapSource, /data-background-technique=\{backgroundTechniqueId\}/);
  assert.match(mapSource, /onMouseEnter=\{\(\) => setActiveId\(technique\.id\)\}/);
  assert.match(questionsSource, /faq-item.*is-open/s);

  for (const token of [
    "--leading-display",
    "--leading-title",
    "--leading-subtitle",
    "--leading-body",
    "--leading-secondary",
    "--leading-microcopy",
    "--space-eyebrow-title",
    "--space-title-copy",
    "--space-copy-copy",
    "--space-copy-action",
    "--space-action-action",
    "--space-action-microcopy",
  ]) {
    assert.match(
      cssSource,
      new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*[^;]+;`),
      `missing ${token}`,
    );
  }
  assert.doesNotMatch(cssSource, /text-align:\s*justify/);
});
```

- [ ] **Step 5: Ejecutar la prueba para verificar que falla por la ausencia del componente**

Run:

```bash
node --test scripts/qa-visual-system.mjs
```

Expected:

```text
FAIL: ENOENT ... src/components/effects/DigitopressureOverlay.tsx
```

- [ ] **Step 6: Confirmar que el fallo nuevo no oculta regresiones anteriores**

Run:

```bash
npm test
```

Expected:

```text
El unico fallo nuevo pertenece al contrato de DigitopressureOverlay; los 26 checks previos continúan pasando.
```

- [ ] **Step 7: Registrar checkpoint local sin commit**

Run:

```bash
git diff --check
git status --short -- scripts/qa-visual-system.mjs docs/superpowers/specs docs/superpowers/plans
```

Expected:

```text
git diff --check sin salida; la prueba roja y los documentos aparecen como cambios locales.
```

---

### Task 2: Implementar el SVG global y los estados semanticos discretos

**Files:**
- Create: `src/components/effects/DigitopressureOverlay.tsx`
- Modify: `src/components/effects/VisualStage.tsx:3-71`
- Modify: `src/components/sections/TechniqueMap.tsx:14-80`
- Modify: `src/app/globals.css:169-285`
- Test: `scripts/qa-visual-system.mjs`

**Interfaces:**
- Consumes: `VisualSurfaceKind` de `src/lib/visual-system.ts` y `activeSurface` de `VisualStage`.
- Produces: `DigitopressureOverlay({ surface }: { surface: VisualSurfaceKind })`, `[data-digitopressure-overlay="true"]`, `[data-digitopressure-motif]` y `data-background-technique`.

- [ ] **Step 1: Crear el componente con geometria estatica y coordenadas de una cifra decimal como maximo**

Create `src/components/effects/DigitopressureOverlay.tsx`:

```tsx
import type { VisualSurfaceKind } from "@/lib/visual-system";

type DigitopressureOverlayProps = {
  surface: VisualSurfaceKind;
};

const digitopressureArtwork = (
  <svg
    className="digitopressure-overlay__svg"
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <g className="digitopressure-motif digitopressure-motif--foot" data-digitopressure-motif="foot">
      <path className="digitopressure-route" d="M1120 760 C1048 690 1034 572 1092 486 C1154 394 1168 288 1110 166" />
      <path className="digitopressure-route digitopressure-route--quiet" d="M1088 744 C1008 644 1006 548 1058 456 C1100 382 1110 296 1074 218" />
      <circle className="digitopressure-ring" cx="1118" cy="682" r="36" />
      <circle className="digitopressure-ring" cx="1064" cy="512" r="24" />
      <circle data-pressure-point="true" cx="1118" cy="682" r="4" />
      <circle data-pressure-point="true" cx="1088" cy="612" r="3" />
      <circle data-pressure-point="true" cx="1064" cy="512" r="4" />
      <circle data-pressure-point="true" cx="1098" cy="414" r="3" />
      <circle data-pressure-point="true" cx="1124" cy="322" r="3" />
      <circle data-pressure-point="true" cx="1098" cy="226" r="4" />
    </g>

    <g className="digitopressure-motif digitopressure-motif--hand" data-digitopressure-motif="hand">
      <path className="digitopressure-route" d="M220 692 C276 620 300 542 284 452 C270 372 292 284 364 208" />
      <path className="digitopressure-route digitopressure-route--quiet" d="M282 474 C224 402 202 324 224 240 M284 416 C326 344 370 282 430 242" />
      <circle className="digitopressure-ring" cx="284" cy="452" r="30" />
      <circle className="digitopressure-ring" cx="364" cy="208" r="18" />
      <circle data-pressure-point="true" cx="220" cy="692" r="4" />
      <circle data-pressure-point="true" cx="254" cy="604" r="3" />
      <circle data-pressure-point="true" cx="284" cy="452" r="4" />
      <circle data-pressure-point="true" cx="228" cy="334" r="3" />
      <circle data-pressure-point="true" cx="224" cy="240" r="3" />
      <circle data-pressure-point="true" cx="326" cy="344" r="3" />
      <circle data-pressure-point="true" cx="364" cy="208" r="4" />
      <circle data-pressure-point="true" cx="430" cy="242" r="3" />
    </g>

    <g className="digitopressure-motif digitopressure-motif--face" data-digitopressure-motif="face">
      <path className="digitopressure-route" d="M782 172 C870 118 978 154 1012 246 C1034 306 1008 372 946 410" />
      <path className="digitopressure-route digitopressure-route--quiet" d="M824 212 C872 250 924 266 986 254" />
      <circle className="digitopressure-ring" cx="872" cy="222" r="22" />
      <circle className="digitopressure-ring" cx="968" cy="318" r="28" />
      <circle data-pressure-point="true" cx="810" cy="190" r="3" />
      <circle data-pressure-point="true" cx="872" cy="222" r="4" />
      <circle data-pressure-point="true" cx="932" cy="232" r="3" />
      <circle data-pressure-point="true" cx="986" cy="254" r="3" />
      <circle data-pressure-point="true" cx="968" cy="318" r="4" />
      <circle data-pressure-point="true" cx="946" cy="410" r="3" />
    </g>

    <g className="digitopressure-motif digitopressure-motif--convergence" data-digitopressure-motif="convergence">
      <path className="digitopressure-route" d="M330 736 C528 650 610 504 720 450 C842 390 960 482 1110 592" />
      <path className="digitopressure-route digitopressure-route--quiet" d="M430 160 C560 252 628 338 720 450" />
      <circle data-pressure-point="true" cx="430" cy="160" r="3" />
      <circle data-pressure-point="true" cx="610" cy="504" r="3" />
      <circle data-pressure-point="true" cx="720" cy="450" r="5" />
      <circle data-pressure-point="true" cx="842" cy="424" r="3" />
    </g>
  </svg>
);

export function DigitopressureOverlay({ surface }: DigitopressureOverlayProps) {
  return (
    <div
      className="digitopressure-overlay"
      data-digitopressure-overlay="true"
      data-surface={surface}
      aria-hidden="true"
    >
      {digitopressureArtwork}
    </div>
  );
}
```

The JSX stays module-level so surface updates reuse the large static subtree. There are 24 pressure points, 6 rings, 8 paths, 4 groups and no SVG filter.

- [ ] **Step 2: Insertar la capa despues de las luces sin crear otro runtime**

Modify `src/components/effects/VisualStage.tsx` imports and return:

```tsx
import { AmbientLightLayer } from "@/components/effects/AmbientLightLayer";
import { DigitopressureOverlay } from "@/components/effects/DigitopressureOverlay";
import { MineralSurface } from "@/components/effects/MineralSurface";
```

```tsx
<span className="visual-global-atmosphere" />
<MineralSurface surface={activeSurface} />
<AmbientLightLayer />
<DigitopressureOverlay surface={activeSurface} />
```

Do not add a hook, listener, timer or derived state to `VisualStage`.

- [ ] **Step 3: Separar hover local de seleccion autorizada en el mapa**

Modify `src/components/sections/TechniqueMap.tsx`:

```tsx
const [activeId, setActiveId] = useState<TechniqueId>("podal");
const [backgroundTechniqueId, setBackgroundTechniqueId] =
  useState<TechniqueId>("podal");
```

Add the semantic attribute to the section:

```tsx
data-background-technique={backgroundTechniqueId}
```

Use these handlers on every tab:

```tsx
data-overlay-technique={technique.id}
onMouseEnter={() => setActiveId(technique.id)}
onFocus={() => {
  setActiveId(technique.id);
  setBackgroundTechniqueId(technique.id);
}}
onClick={() => {
  setActiveId(technique.id);
  setBackgroundTechniqueId(technique.id);
}}
onKeyDown={(event) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const currentIndex = mapTechniques.findIndex((item) => item.id === activeId);
  const delta = event.key === "ArrowDown" ? 1 : -1;
  const next = mapTechniques[
    (currentIndex + delta + mapTechniques.length) % mapTechniques.length
  ];
  setActiveId(next.id);
  setBackgroundTechniqueId(next.id);
  requestAnimationFrame(() =>
    document.getElementById(`map-tab-${next.id}`)?.focus(),
  );
}}
```

The existing one-shot `requestAnimationFrame` only restores tab focus after an arrow key; this task adds no RAF owner or continuous loop.

- [ ] **Step 4: Establecer el apilado, color y mapa de superficies en CSS**

Add after `.ambient-light-layer` in `src/app/globals.css`:

```css
.digitopressure-overlay {
  position: absolute;
  z-index: 4;
  inset: 0;
  overflow: hidden;
  opacity: 1;
  pointer-events: none;
  contain: layout paint style;
}

.digitopressure-overlay__svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.digitopressure-motif {
  opacity: 0.045;
  color: var(--lili-lavender);
  transition: opacity 320ms var(--ease-standard);
}

.digitopressure-route,
.digitopressure-ring {
  fill: none;
  stroke: currentColor;
  stroke-width: 0.85;
  vector-effect: non-scaling-stroke;
}

.digitopressure-route {
  stroke-dasharray: 5 11;
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 320ms var(--ease-standard);
}

.digitopressure-route--quiet {
  opacity: 0.52;
  stroke-width: 0.6;
}

.digitopressure-ring {
  opacity: 0.42;
  stroke: var(--lili-orchid);
}

[data-pressure-point="true"] {
  fill: var(--lili-pearl);
  stroke: var(--lili-orchid);
  stroke-width: 0.75;
  vector-effect: non-scaling-stroke;
}

.digitopressure-overlay[data-surface="header"] .digitopressure-motif--convergence,
.digitopressure-overlay[data-surface="footer"] .digitopressure-motif--convergence {
  opacity: 0.08;
}

.digitopressure-overlay[data-surface="hero"] .digitopressure-motif--foot,
.digitopressure-overlay[data-surface="reading"] .digitopressure-motif--foot {
  opacity: 0.18;
}

.digitopressure-overlay[data-surface="introduction"] .digitopressure-motif--foot,
.digitopressure-overlay[data-surface="introduction"] .digitopressure-motif--hand,
.digitopressure-overlay[data-surface="benefits"] .digitopressure-motif--foot,
.digitopressure-overlay[data-surface="benefits"] .digitopressure-motif--hand {
  opacity: 0.115;
}

.digitopressure-overlay[data-surface="techniques"] .digitopressure-motif--foot,
.digitopressure-overlay[data-surface="techniques"] .digitopressure-motif--hand,
.digitopressure-overlay[data-surface="techniques"] .digitopressure-motif--face {
  opacity: 0.13;
}

.digitopressure-overlay[data-surface="map"] .digitopressure-motif--foot,
.digitopressure-overlay[data-surface="map"] .digitopressure-motif--hand,
.digitopressure-overlay[data-surface="map"] .digitopressure-motif--face {
  opacity: 0.045;
}

html:has(.technique-map-section[data-background-technique="podal"])
  .digitopressure-overlay[data-surface="map"]
  .digitopressure-motif--foot,
html:has(.technique-map-section[data-background-technique="manos"])
  .digitopressure-overlay[data-surface="map"]
  .digitopressure-motif--hand,
html:has(.technique-map-section[data-background-technique="rostro"])
  .digitopressure-overlay[data-surface="map"]
  .digitopressure-motif--face {
  opacity: 0.22;
}

.digitopressure-overlay[data-surface="experience"] .digitopressure-motif--hand,
.digitopressure-overlay[data-surface="experience"] .digitopressure-motif--convergence,
.digitopressure-overlay[data-surface="cta"] .digitopressure-motif--foot,
.digitopressure-overlay[data-surface="cta"] .digitopressure-motif--hand,
.digitopressure-overlay[data-surface="cta"] .digitopressure-motif--convergence {
  opacity: 0.135;
}

.digitopressure-overlay[data-surface="promotions"] [data-pressure-point="true"] {
  opacity: 0.72;
}

.digitopressure-overlay[data-surface="questions"] .digitopressure-motif--face {
  opacity: 0.14;
}

html:has(.questions-section .faq-item.is-open)
  .digitopressure-overlay[data-surface="questions"]
  .digitopressure-ring {
  opacity: 0.72;
}
```

- [ ] **Step 5: Agregar las degradaciones estaticas y forced colors**

Extend the existing media rules in `src/app/globals.css`:

```css
@media (max-width: 900px) {
  .digitopressure-overlay {
    opacity: 0.72;
  }

  .digitopressure-motif--face,
  .digitopressure-motif--convergence {
    opacity: 0.035;
  }
}

@media (hover: none), (pointer: coarse) {
  .digitopressure-motif,
  .digitopressure-route {
    animation: none;
    transform: none;
    transition: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .digitopressure-motif,
  .digitopressure-route {
    animation: none !important;
    transform: none !important;
    transition: none !important;
  }
}

@media (forced-colors: active) {
  .digitopressure-overlay {
    display: none;
  }
}
```

- [ ] **Step 6: Ejecutar el contrato y verificar que pasa**

Run:

```bash
node --test scripts/qa-visual-system.mjs
npm run typecheck
```

Expected:

```text
All visual-system tests PASS; TypeScript exits 0.
```

- [ ] **Step 7: Revisar especificamente practicas React y arquitectura**

Run:

```bash
rg -n "useEffect|useLayoutEffect|requestAnimationFrame|setInterval|setTimeout|addEventListener|pointermove|mousemove" src/components/effects/DigitopressureOverlay.tsx
rg -n "DigitopressureOverlay|MineralSurface|AmbientLightLayer" src/components/effects/VisualStage.tsx
```

Expected:

```text
La primera busqueda no devuelve coincidencias; la segunda devuelve una instancia de cada capa y el overlay aparece despues de AmbientLightLayer.
```

- [ ] **Step 8: Registrar checkpoint local sin commit**

Run:

```bash
git diff --check
git status --short -- src/components/effects src/components/sections/TechniqueMap.tsx src/app/globals.css scripts/qa-visual-system.mjs
```

Expected:

```text
Sin errores de whitespace; sólo cambios locales esperados y trabajo previo preservado.
```

---

### Task 3: Centralizar el ritmo tipografico y las distancias texto-accion

**Files:**
- Modify: `src/app/globals.css:3-50`
- Modify: `src/app/globals.css:62-75`
- Modify: `src/app/globals.css:367-458`
- Modify: `src/app/globals.css:719-1555`
- Modify: `src/app/globals.css:1751-2084`
- Test: `scripts/qa-visual-system.mjs`

**Interfaces:**
- Consumes: los doce tokens exigidos por Task 1.
- Produces: valores desktop y mobile concretos usados por todos los bloques editoriales y acciones.

- [ ] **Step 1: Ejecutar el contrato antes de agregar los tokens**

Run:

```bash
node --test --test-name-pattern="digitopressure overlay" scripts/qa-visual-system.mjs
```

Expected:

```text
FAIL con missing --leading-display, porque el overlay ya existe pero los tokens aun no.
```

- [ ] **Step 2: Agregar valores desktop al bloque `:root`**

Add to `:root` in `src/app/globals.css`:

```css
--leading-display: 1.04;
--leading-title: 1.1;
--leading-subtitle: 1.24;
--leading-body: 1.68;
--leading-secondary: 1.62;
--leading-microcopy: 1.54;
--space-eyebrow-title: clamp(1rem, 1.5vw, 1.35rem);
--space-title-copy: clamp(1.25rem, 2vw, 1.75rem);
--space-copy-copy: clamp(0.75rem, 1.2vw, 1rem);
--space-copy-action: clamp(1.5rem, 2.2vw, 1.9rem);
--space-action-action: 0.75rem;
--space-action-microcopy: 0.9rem;
```

- [ ] **Step 3: Conectar los tokens a la tipografia base sin cambiar fuentes ni tamaños**

Update the shared rules:

```css
body {
  line-height: var(--leading-body);
}

h1 {
  line-height: var(--leading-display);
}

h2 {
  margin-bottom: var(--space-title-copy);
  line-height: var(--leading-title);
}

h3 {
  line-height: var(--leading-subtitle);
}

p,
li {
  line-height: var(--leading-body);
  text-align: left;
}

.eyebrow,
.footer-label {
  line-height: var(--leading-microcopy);
  text-align: left;
}

.section-heading h2 {
  margin-block: var(--space-eyebrow-title) var(--space-title-copy);
}

.section-heading > p:last-child {
  line-height: var(--leading-secondary);
  text-align: left;
}

.button-base {
  line-height: 1.24;
}
```

Keep `.section-heading` centered as a bounded layout and allow its title/eyebrow alignment to retain the current composition, but always align the reading paragraph and all long-form body/microcopy to the left. Do not add `text-align: justify`.

- [ ] **Step 4: Normalizar hero, introduction y section headings**

Replace isolated margins with:

```css
.hero-copy h1 {
  margin-block: var(--space-eyebrow-title) var(--space-title-copy);
  line-height: var(--leading-display);
}

.hero-lead {
  margin-bottom: var(--space-copy-copy);
  line-height: var(--leading-secondary);
}

.hero-note {
  margin-bottom: var(--space-copy-action);
  line-height: var(--leading-body);
}

.hero-actions {
  gap: var(--space-action-action);
}

.hero-microcopy {
  margin: var(--space-action-microcopy) 0 0;
  line-height: var(--leading-microcopy);
}

.introduction-copy h2,
.foot-reading-copy h2,
.experience-intro h2,
.questions-intro h2,
.technique-map-copy h2 {
  margin-block: var(--space-eyebrow-title) var(--space-title-copy);
}

.introduction-copy > p:not(.eyebrow):not(.editorial-note) + p,
.foot-reading-copy > p:not(.eyebrow) + p:not(.eyebrow),
.final-cta-copy > p:not(.eyebrow) + p:not(.eyebrow) {
  margin-top: var(--space-copy-copy);
}

.introduction-copy blockquote {
  margin-block: var(--space-copy-action) var(--space-copy-copy);
  line-height: 1.12;
}

.editorial-note {
  line-height: var(--leading-microcopy);
}
```

- [ ] **Step 5: Normalizar tecnicas, mapa y lectura**

Apply:

```css
.technique-card h3 {
  margin-block: var(--space-eyebrow-title) var(--space-copy-copy);
}

.technique-card__body > p:not(.eyebrow) {
  line-height: var(--leading-secondary);
}

.technique-card__detail {
  margin-top: var(--space-copy-copy);
}

.technique-card ul {
  margin: var(--space-copy-action) 0;
  gap: 0.55rem;
}

.technique-map-copy > p:not(.eyebrow),
.experience-intro > p:not(.eyebrow),
.questions-intro > p:not(.eyebrow) {
  line-height: var(--leading-secondary);
}

.technique-map-tabs {
  margin-block: var(--space-copy-action);
}

.map-technique-panel p {
  margin-bottom: var(--space-copy-action);
  line-height: var(--leading-secondary);
}

.reading-lead {
  margin-bottom: var(--space-copy-copy);
  line-height: 1.2;
}

.reading-observations {
  margin-block: var(--space-copy-action);
  gap: 0.65rem;
}

.reading-observations li,
.reading-clarification {
  line-height: var(--leading-secondary);
}

.reading-clarification {
  margin-bottom: var(--space-copy-action);
}
```

- [ ] **Step 6: Normalizar beneficios, experiencia, propuestas, FAQ y CTA final**

Apply:

```css
.benefit-item h3,
.experience-step h3 {
  margin: 0 0 var(--space-copy-copy);
}

.benefit-item p,
.experience-step p,
.proposal-card > p:not(.eyebrow),
.faq-item [role="region"] p,
.final-cta-copy > p:not(.eyebrow) {
  line-height: var(--leading-secondary);
}

.experience-intro .button-base,
.questions-intro .button-base {
  margin-top: var(--space-copy-action);
}

.proposal-card h3 {
  margin-block: var(--space-eyebrow-title) var(--space-copy-copy);
}

.proposal-card > p:not(.eyebrow) {
  margin-bottom: var(--space-copy-action);
}

.faq-item button {
  line-height: var(--leading-subtitle);
}

.faq-item [role="region"] p {
  padding-bottom: var(--space-copy-action);
}

.final-cta-copy h2 {
  margin-block: var(--space-eyebrow-title) var(--space-title-copy);
}

.final-cta-secondary {
  margin-bottom: var(--space-copy-action);
}

.final-cta-microcopy {
  margin-top: var(--space-action-microcopy);
  line-height: var(--leading-microcopy);
}
```

Keep `.proposal-card .button-base { margin-top: auto; }` so cards remain aligned; the paragraph margin establishes the minimum text-action space.

- [ ] **Step 7: Definir valores mobile y apilar antes de comprimir**

Add to `@media (max-width: 600px)`:

```css
:root {
  --leading-display: 1.08;
  --leading-title: 1.12;
  --leading-subtitle: 1.28;
  --leading-body: 1.7;
  --leading-secondary: 1.66;
  --leading-microcopy: 1.58;
  --space-eyebrow-title: 0.875rem;
  --space-title-copy: 1.125rem;
  --space-copy-copy: 0.75rem;
  --space-copy-action: 1.375rem;
  --space-action-action: 0.75rem;
  --space-action-microcopy: 0.75rem;
}

.hero-copy h1 {
  line-height: var(--leading-display);
}

.hero-actions {
  gap: var(--space-action-action);
}

.section-heading,
.section-heading > p:last-child {
  text-align: left;
}

.faq-item button > span:nth-child(2) {
  line-height: var(--leading-subtitle);
}
```

- [ ] **Step 8: Ejecutar pruebas estaticas y compilacion**

Run:

```bash
node --test scripts/qa-visual-system.mjs
npm run lint
npm run typecheck
```

Expected:

```text
Todas las pruebas pasan; ESLint y TypeScript terminan con exit 0.
```

- [ ] **Step 9: Verificar que no se alteraron strings visibles**

Run:

```bash
git diff -- src/components/sections ':!src/components/sections/TechniqueMap.tsx'
rg -n "text-align:\s*justify" src/app/globals.css
```

Expected:

```text
No hay diff en las secciones fuera de TechniqueMap y no existe text-align: justify.
```

- [ ] **Step 10: Registrar checkpoint local sin commit**

Run:

```bash
git diff --check
git status --short -- src/app/globals.css src/components/effects src/components/sections/TechniqueMap.tsx scripts/qa-visual-system.mjs
```

Expected:

```text
Sin errores de whitespace; los cambios locales corresponden al alcance aprobado.
```

---

### Task 4: Medir ritmo, apilado e interaccion en la matriz renderizada

**Files:**
- Modify: `scripts/qa-responsive-visual.mjs:207-676`
- Modify: `scripts/qa-visual-runtime-rendered.mjs:106-154`
- Modify: `scripts/benchmark-visual-runtime.mjs:177-205`
- Test: `scripts/qa-responsive-visual.mjs`
- Test: `scripts/qa-visual-runtime-rendered.mjs`

**Interfaces:**
- Consumes: selectores `data-digitopressure-overlay`, `data-digitopressure-motif`, `data-background-technique` y tokens de Task 3.
- Produces: observaciones renderizadas de estructura SVG, apilado, movimiento, interlineados, gaps, estados semanticos, DOM, SVG y bytes JS.

- [ ] **Step 1: Extender `observe()` con metricas de overlay y tipografia**

Add helpers inside the evaluated function in `scripts/qa-responsive-visual.mjs`:

```js
const ratio = (selector) => {
  const style = css(selector);
  if (!style) return null;
  return Number((parseFloat(style.lineHeight) / parseFloat(style.fontSize)).toFixed(2));
};
const gap = (firstSelector, secondSelector) => {
  const first = document.querySelector(firstSelector)?.getBoundingClientRect();
  const second = document.querySelector(secondSelector)?.getBoundingClientRect();
  if (!first || !second) return null;
  return Number((second.top - first.bottom).toFixed(1));
};
const overlay = document.querySelector('[data-digitopressure-overlay="true"]');
const overlaySvg = overlay?.querySelector('svg');
```

Add these returned properties:

```js
digitopressureOverlays: document.querySelectorAll('[data-digitopressure-overlay="true"]').length,
digitopressureSvgRoots: overlay?.querySelectorAll(':scope > svg').length ?? 0,
digitopressureDescendants: overlaySvg?.querySelectorAll('*').length ?? 0,
digitopressurePaths: overlaySvg?.querySelectorAll('path').length ?? 0,
digitopressurePoints: overlaySvg?.querySelectorAll('[data-pressure-point="true"]').length ?? 0,
digitopressureFilters: overlaySvg?.querySelectorAll('filter, feGaussianBlur').length ?? 0,
digitopressurePointerEvents: overlay ? getComputedStyle(overlay).pointerEvents : null,
digitopressureAriaHidden: overlay?.getAttribute('aria-hidden') ?? null,
digitopressureDisplay: overlay ? getComputedStyle(overlay).display : null,
digitopressureZ: Number.parseInt(getComputedStyle(overlay).zIndex, 10),
ambientZ: Number.parseInt(getComputedStyle(document.querySelector('.ambient-light-layer')).zIndex, 10),
stageZ: Number.parseInt(getComputedStyle(document.querySelector('.visual-webgl-stage')).zIndex, 10),
contentZ: Number.parseInt(getComputedStyle(document.querySelector('#contenido')).zIndex, 10),
domNodes: document.querySelectorAll('*').length,
svgNodes: document.querySelectorAll('svg *').length,
lineRatios: {
  h1: ratio('.hero-copy h1'),
  h2: ratio('.introduction-copy h2'),
  h3: ratio('.technique-card h3'),
  body: ratio('.introduction-copy > p:not(.eyebrow)'),
  microcopy: ratio('.hero-microcopy'),
},
spacing: {
  heroEyebrowTitle: gap('.hero-copy .eyebrow', '.hero-copy h1'),
  heroTitleLead: gap('.hero-copy h1', '.hero-lead'),
  heroTextAction: gap('.hero-note', '.hero-actions'),
  heroActionMicrocopy: gap('.hero-actions', '.hero-microcopy'),
  introParagraphs: gap('.introduction-copy > p:nth-of-type(2)', '.introduction-copy > p:nth-of-type(3)'),
  finalTitleText: gap('.final-cta-copy h2', '.final-cta-copy > p:not(.eyebrow)'),
  finalActionMicrocopy: gap('.final-cta-copy .button-base', '.final-cta-microcopy'),
},
overlayAnimations: document.getAnimations().filter((animation) => {
  const target = animation.effect?.target;
  return target?.closest?.('[data-digitopressure-overlay="true"]');
}).length,
```

- [ ] **Step 2: Agregar assertions estructurales y de rangos por viewport**

After the current glass/ambient assertions, add:

```js
assert.equal(observation.digitopressureOverlays, 1);
assert.equal(observation.digitopressureSvgRoots, 1);
assert.ok(observation.digitopressureDescendants <= 75);
assert.ok(observation.digitopressurePaths <= 8);
assert.ok(observation.digitopressurePoints <= 24);
assert.equal(observation.digitopressureFilters, 0);
assert.equal(observation.digitopressurePointerEvents, "none");
assert.equal(observation.digitopressureAriaHidden, "true");
assert.ok(observation.digitopressureZ > observation.ambientZ);
assert.ok(observation.stageZ < observation.contentZ);
assert.ok(observation.domNodes <= 1125);
assert.ok(observation.svgNodes <= 707);

const ranges = viewport.width <= 600
  ? { h1: [1.04, 1.12], h2: [1.08, 1.18], h3: [1.2, 1.34], body: [1.6, 1.76], microcopy: [1.48, 1.66] }
  : { h1: [1, 1.08], h2: [1.06, 1.14], h3: [1.16, 1.3], body: [1.58, 1.72], microcopy: [1.45, 1.62] };
for (const [key, value] of Object.entries(observation.lineRatios)) {
  const [minimum, maximum] = ranges[key];
  assert.ok(value >= minimum && value <= maximum, JSON.stringify({ viewport: viewport.name, key, value, minimum, maximum }));
}

const spacingRanges = viewport.width <= 600
  ? {
      heroEyebrowTitle: [12, 18], heroTitleLead: [16, 24], heroTextAction: [20, 28],
      heroActionMicrocopy: [12, 16], introParagraphs: [12, 18], finalTitleText: [16, 24],
      finalActionMicrocopy: [12, 16],
    }
  : {
      heroEyebrowTitle: [16, 24], heroTitleLead: [20, 32], heroTextAction: [24, 32],
      heroActionMicrocopy: [12, 18], introParagraphs: [12, 20], finalTitleText: [20, 32],
      finalActionMicrocopy: [12, 18],
    };
for (const [key, value] of Object.entries(observation.spacing)) {
  const [minimum, maximum] = spacingRanges[key];
  assert.ok(value >= minimum && value <= maximum, JSON.stringify({ viewport: viewport.name, key, value, minimum, maximum }));
}
```

If a rendered font metric produces a value outside the specification by less than 1 px, adjust the CSS token rather than widening the acceptance range beyond the approved table.

- [ ] **Step 3: Probar que hover no cambia el fondo y click/foco si lo cambian**

Extend `assertInteractiveDesktop()` before the FAQ click:

```js
const mapSection = document.querySelector('.technique-map-section');
mapSection?.scrollIntoView({ block: 'center' });
await new Promise((resolve) => setTimeout(resolve, 950));
const readOverlay = () => {
  const readOpacity = (motif) => Number.parseFloat(
    getComputedStyle(document.querySelector(`[data-digitopressure-motif="${motif}"]`)).opacity,
  );
  return {
    surface: document.querySelector('[data-digitopressure-overlay="true"]')?.dataset.surface,
    backgroundTechnique: mapSection?.dataset.backgroundTechnique,
    foot: readOpacity('foot'),
    hand: readOpacity('hand'),
    face: readOpacity('face'),
  };
};
const overlayBeforeHover = readOverlay();
const handTab = document.querySelector('#map-tab-manos');
handTab?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
await new Promise(requestAnimationFrame);
const overlayAfterHover = readOverlay();
handTab?.click();
await new Promise((resolve) => setTimeout(resolve, 380));
const overlayAfterClick = readOverlay();
const faceTab = document.querySelector('#map-tab-rostro');
faceTab?.focus();
await new Promise((resolve) => setTimeout(resolve, 380));
const overlayAfterFocus = readOverlay();
```

Return the four observations and assert outside `evaluate()`:

```js
assert.equal(result.overlayBeforeHover.surface, "map");
assert.equal(result.overlayAfterHover.backgroundTechnique, result.overlayBeforeHover.backgroundTechnique);
assert.equal(result.overlayAfterHover.hand, result.overlayBeforeHover.hand);
assert.equal(result.overlayAfterClick.backgroundTechnique, "manos");
assert.ok(result.overlayAfterClick.hand > result.overlayAfterClick.foot);
assert.equal(result.overlayAfterFocus.backgroundTechnique, "rostro");
assert.ok(result.overlayAfterFocus.face > result.overlayAfterFocus.hand);
```

- [ ] **Step 4: Probar FAQ, touch, reduced motion y forced colors**

In the desktop interaction function, scroll `.questions-section` into view and wait for the shared surface to settle. Because the first FAQ is initially open, click the currently expanded trigger to close it, wait one frame, read `.digitopressure-ring` opacity as `closedRingOpacity`, then open `#faq-trigger-tecnica`, wait 380 ms and read `openRingOpacity`. Assert `openRingOpacity > closedRingOpacity`, `aria-expanded="true"` and the controlled panel is visible.

Add to touch assertions:

```js
assert.equal(observation.overlayAnimations, 0);
```

Add to the reduced-motion observation:

```js
overlayAnimations: document.getAnimations().filter((animation) =>
  animation.effect?.target?.closest?.('[data-digitopressure-overlay="true"]'),
).length,
overlayTransition: getComputedStyle(
  document.querySelector('[data-digitopressure-motif="foot"]'),
).transitionDuration,
```

Assert:

```js
assert.equal(reducedMotion.overlayAnimations, 0);
assert.match(reducedMotion.overlayTransition, /^(0s|0\.001ms)(, (0s|0\.001ms))*$/);
```

Add to forced colors:

```js
overlayDisplay: getComputedStyle(
  document.querySelector('[data-digitopressure-overlay="true"]'),
).display,
```

Assert:

```js
assert.equal(forcedColors.overlayDisplay, "none");
```

- [ ] **Step 5: Extender el contrato de runtime con los conteos nuevos**

In `scripts/qa-visual-runtime-rendered.mjs`, add to `observation`:

```js
digitopressureOverlays: document.querySelectorAll('[data-digitopressure-overlay="true"]').length,
digitopressureSvgRoots: document.querySelectorAll('[data-digitopressure-overlay="true"] > svg').length,
digitopressureDescendants: document.querySelector('[data-digitopressure-overlay="true"] svg')?.querySelectorAll('*').length ?? 0,
```

Assert:

```js
assert.equal(observation.digitopressureOverlays, 1);
assert.equal(observation.digitopressureSvgRoots, 1);
assert.ok(observation.digitopressureDescendants <= 75);
```

Keep the existing assertions of one canvas, one stage, one RAF owner, one scroll listener, zero pointer listeners and at most two WebGL draws during sustained scroll.

- [ ] **Step 6: Exponer presupuesto DOM, SVG y JS en el benchmark sin alterar su flujo**

Add to `structural` in `scripts/benchmark-visual-runtime.mjs`:

```js
svgNodes: document.querySelectorAll('svg *').length,
digitopressureOverlays: document.querySelectorAll('[data-digitopressure-overlay="true"]').length,
digitopressureDescendants: document.querySelector('[data-digitopressure-overlay="true"] svg')?.querySelectorAll('*').length ?? 0,
```

Keep the `initialJsDecodedBytes` and `initialCssDecodedBytes` metrics added before implementation in Task 1. Task 5 compares both values against `benchmark-before.json`; each increase must be <= 5120 bytes.

- [ ] **Step 7: Ejecutar la prueba estatica y la matriz renderizada en Chrome aislado**

The Browser plugin is available and must be used first for the visual interaction loop. Before browser actions, read `browser:control-in-app-browser`, name a session, navigate to `http://127.0.0.1:3000/`, confirm title/DOM/console, exercise the map and FAQ, and capture desktop plus mobile screenshots.

Then run the deterministic repository matrix against an isolated Chrome CDP target:

```bash
qa_dir=$(mktemp -d /tmp/lili-digitopressure-qa.XXXXXX)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9226 \
  --user-data-dir="$qa_dir/chrome" \
  --disable-gpu-sandbox \
  about:blank >"$qa_dir/chrome.log" 2>&1 &
QA_CDP_HTTP_URL=http://127.0.0.1:9226 \
QA_BASE_URL=http://127.0.0.1:3000/ \
QA_SCREENSHOT_DIR="$qa_dir/screenshots" \
node scripts/qa-responsive-visual.mjs
QA_CDP_HTTP_URL=http://127.0.0.1:9226 \
QA_BASE_URL=http://127.0.0.1:3000/ \
node --test scripts/qa-visual-runtime-rendered.mjs
```

Expected:

```text
La matriz 1440/1024/768-touch/390-touch/320-touch, reduced motion y forced colors termina con exit 0; el runtime rendered termina PASS.
```

- [ ] **Step 8: Inspeccionar las capturas y corregir solamente diferencias observadas**

Inspect hero, introduction, techniques, map, reading, benefits, experience, proposals, questions, final CTA, mobile 390/320, reduced motion and forced colors. Maintain this mismatch ledger in the execution notes:

```text
surface | issue visible | measured selector/value | CSS correction | recheck result
```

Every row must contain a concrete observation. If there is no mismatch, record `none observed` for the surface; do not change CSS without rendered evidence.

- [ ] **Step 9: Registrar checkpoint local sin commit**

Run:

```bash
git diff --check
git status --short -- scripts/qa-responsive-visual.mjs scripts/qa-visual-runtime-rendered.mjs scripts/benchmark-visual-runtime.mjs
```

Expected:

```text
Sin errores de whitespace; los scripts de QA quedan como cambios locales y no se agregan screenshots al repositorio.
```

---

### Task 5: Ejecutar gates completos, rendimiento e integridad final

**Files:**
- Verify: `src/components/effects/DigitopressureOverlay.tsx`
- Verify: `src/components/effects/VisualStage.tsx`
- Verify: `src/components/sections/TechniqueMap.tsx`
- Verify: `src/app/globals.css`
- Verify: `scripts/qa-visual-system.mjs`
- Verify: `scripts/qa-responsive-visual.mjs`
- Verify: `scripts/qa-visual-runtime-rendered.mjs`
- Verify: `scripts/benchmark-visual-runtime.mjs`
- Read only: `data/reservations.json`

**Interfaces:**
- Consumes: todos los contratos y observaciones de Tasks 1-4.
- Produces: evidencia local actual para arquitectura, responsive, accesibilidad, rendimiento, copy, WhatsApp e integridad de reservas.

- [ ] **Step 1: Ejecutar gates fuente y build de produccion**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Expected:

```text
Cada comando termina con exit 0; build genera las rutas estaticas sin error; git diff --check no imprime errores.
```

- [ ] **Step 2: Ejecutar QA de header, responsive y runtime sobre un servidor limpio**

Run from an exact temporary environment without touching real reservations:

```bash
qa_final_dir=$(mktemp -d /tmp/lili-digitopressure-final.XXXXXX)
PORT=3012 npm run start >"$qa_final_dir/server.log" 2>&1 &
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9227 \
  --user-data-dir="$qa_final_dir/chrome" \
  --disable-gpu-sandbox \
  http://127.0.0.1:3012/ >"$qa_final_dir/chrome.log" 2>&1 &
QA_CDP_HTTP_URL=http://127.0.0.1:9227 QA_BASE_URL=http://127.0.0.1:3012/ node scripts/qa-header-glass.mjs
QA_CDP_HTTP_URL=http://127.0.0.1:9227 QA_BASE_URL=http://127.0.0.1:3012/ QA_SCREENSHOT_DIR="$qa_final_dir/screenshots" node scripts/qa-responsive-visual.mjs
QA_CDP_HTTP_URL=http://127.0.0.1:9227 QA_BASE_URL=http://127.0.0.1:3012/ node --test scripts/qa-visual-runtime-rendered.mjs
```

Expected:

```text
Header, responsive y runtime rendered terminan con exit 0; no hay errores de consola, red, overflow, clipping ni containment.
```

- [ ] **Step 3: Ejecutar benchmark final y evaluar presupuestos**

Run:

```bash
QA_CDP_HTTP_URL=http://127.0.0.1:9227 \
QA_BASE_URL=http://127.0.0.1:3000/ \
QA_VISUAL_LABEL=digitopressure-final \
QA_OUTPUT_PATH="$qa_final_dir/benchmark-final.json" \
QA_SCREENSHOT_PATH="$qa_final_dir/benchmark-final.png" \
node scripts/benchmark-visual-runtime.mjs
```

Use port 3000 here intentionally: `benchmark-before.json` was captured from the same development server, so decoded resource deltas and scroll timing compare like with like. The production server on port 3012 is validated separately in Step 2.

Accept only if the JSON proves:

```text
structural.nodes <= 1125
structural.svgNodes <= 707
structural.canvases = 1
structural.webglContexts = 1
structural.stages = 1
structural.rafOwners = 1
structural.windowScrollListeners = 1
structural.windowPointerListeners = 0
structural.digitopressureOverlays = 1
structural.digitopressureDescendants <= 75
scroll.p95Ms <= 19.53
scroll.longTasks = 0
```

Also compare final `initialJsDecodedBytes` and `initialCssDecodedBytes` with the values in Task 1 `benchmark-before.json`; require each delta to be <= 5120 bytes.

- [ ] **Step 4: Verificar copy, WhatsApp y reserva real**

Run:

```bash
node --test scripts/qa-whatsapp-only.mjs
rg -o 'href="https://wa.me/' .next/server/app/index.html | wc -l
shasum -a 256 data/reservations.json
git check-ignore -v data/reservations.json
```

Expected:

```text
WhatsApp-only PASS; 16 enlaces; reservations SHA-256 1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad; archivo ignorado por Git.
```

- [ ] **Step 5: Hacer la revision Browser final requerida**

Use the same in-app Browser tab and run:

```text
http://127.0.0.1:3012/ -> hero visible -> scroll through every surface -> hover map tab without global change -> click hand tab -> hand motif active -> keyboard focus face tab -> face motif active -> open FAQ -> ring state changes -> WhatsApp href remains contextual
```

Collect:

```text
page URL and title; meaningful DOM snapshot; no framework overlay; error/warn console log; desktop screenshot; mobile screenshot; map-click screenshot; FAQ-open screenshot.
```

Do not write Browser screenshots or temporary reports into the repository.

- [ ] **Step 6: Revisar el diff final y confirmar limites**

Run:

```bash
git diff -- src/components/effects/DigitopressureOverlay.tsx src/components/effects/VisualStage.tsx src/components/sections/TechniqueMap.tsx src/app/globals.css scripts/qa-visual-system.mjs scripts/qa-responsive-visual.mjs scripts/qa-visual-runtime-rendered.mjs scripts/benchmark-visual-runtime.mjs
git status --short
```

Verify:

```text
No shader changes; no visual-runtime changes; no section copy changes outside TechniqueMap handlers/attributes; no asset changes; no generated screenshots; no commit; no push; no deploy.
```

- [ ] **Step 7: Emitir el cierre local con estados exactos**

Report these gates individually and only mark PASS with the evidence generated in this task:

```text
TYPOGRAPHIC_RHYTHM
TEXT_ALIGNMENT
TEXT_ACTION_SPACING
DIGITOPRESSURE_OVERLAY
OVERLAY_ABOVE_EXISTING_BACKGROUND
OVERLAY_BELOW_CONTENT
CURSOR_REACTION
TOUCH_OVERLAY_MOTION
REDUCED_MOTION
FORCED_COLORS
RUNTIME_ARCHITECTURE_PRESERVED
COPY_PRESERVED
WHATSAPP_ONLY
RESERVATIONS_HASH
PERFORMANCE_BUDGET
LOCAL_VISUAL_RUNTIME
PRODUCT_PASS
```

`PRODUCT_PASS` remains `UNVERIFIED` because no deployment, managed system or owner publication gate is authorized by this plan.
