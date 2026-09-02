# Volumetric Condensation and Color Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Realzar el fondo y la red global de digitopuntura de Lili Reflexología, eliminar por completo las luces CSS aleatorias y reemplazarlas por condensación volumétrica 3D determinista dentro del único shader Three.js/WebGL existente.

**Architecture:** `VisualStage` conserva el único stage global y elimina `AmbientLightLayer`. `MineralSurface` sigue siendo dueño del único canvas, renderer, escena, plano fullscreen, material y runtime compartido; importa un shader único que combina la superficie mineral 2D existente con un campo de densidad 3D ray-marched. La calidad del volumen se resuelve con 8, 6 o 4 muestras según política/tier, sin texturas, render targets, partículas, temporizadores ni interacción con el cursor. `globals.css` realza lotus, atmósfera y SVG de digitopuntura sin cambiar layout, copy ni conversión.

**Tech Stack:** Next.js 16.3.2, React 19.2.8, TypeScript 5, Three.js 0.185.1, GLSL ES, CSS global, Node test runner, Chrome DevTools Protocol y QA Browser.

**Spec:** `docs/superpowers/specs/2026-08-31-volumetric-condensation-color-enhancement-design.md`

## Global Constraints

- Trabajar en `/Users/agustincastillo/Desktop/LILI REFLEX/web`; el directorio padre no es el repositorio Git.
- Preservar todo el checkout sucio, archivos no rastreados y `data/reservations.json`; no usar `reset`, `clean`, checkout destructivo ni reescribir trabajo anterior.
- No hacer commit, push, deploy, publicación, mutación remota, reserva ni envío de WhatsApp.
- No cambiar copy, jerarquía de secciones, navegación, CTAs, URLs de WhatsApp, datos comerciales, datos clínicos, assets ni mapas anatómicos.
- Mantener exactamente un `VisualStage`, canvas, contexto WebGL, `THREE.WebGLRenderer`, escena, cámara, geometría fullscreen, `THREE.ShaderMaterial`, propietario de RAF y listener global de scroll.
- Ejecutar exactamente una llamada `renderer.render(scene, camera)` por frame dibujado; no agregar pases, compositor, framebuffer ni render target.
- Mantener cero texturas, `Data3DTexture`, `sampler2D`, `sampler3D`, partículas, sprites, billboards, instancing y filtros SVG.
- Eliminar `AmbientLightLayer`, sus tres spans, `Math.random`, los dos timeouts y todos los estados `lit/dim`.
- Mantener cero listeners visuales `pointermove`/`mousemove` y cero reacción continua al cursor.
- Mantener el SVG global actual sin aumentar sus 42 descendientes, 8 paths, 24 puntos, 6 anillos ni una raíz SVG.
- Desktop fino: vapor animado determinista. Touch y `prefers-reduced-motion`: una única imagen estática. Save Data, memoria menor a 4 GB, viewport menor a 320 px o fallo WebGL: fallback CSS. Forced colors: stage decorativo oculto.
- Mantener un desplazamiento perceptual de 28 a 42 segundos: el avance vertical `time * 0.035` recorre una unidad de ruido en 28.6 s y la deriva lateral `sin(time * 0.15)` completa un ciclo en 41.9 s.
- Mantener la pausa de WebGL durante scroll sostenido y la adaptación existente a 60/45/30 FPS.
- Presupuesto del pase: JS inicial adicional <= 8 KB decodificados, delta CSS <= 0 bytes, p95 de idle/pointer/scroll <= 19.53 ms, cero frames mayores a 32 ms, cero long tasks y cero draws durante scroll sostenido.
- Los checkpoints son locales y sin commit porque la instrucción explícita del propietario prevalece sobre la recomendación genérica de commits de la skill.

---

### Task 1: Congelar integridad, evidencia visual y contratos rojos del volumen

**Files:**
- Create: `scripts/qa-vapor-field.mjs`
- Modify: `scripts/run-qa.mjs:3-7`
- Modify: `scripts/benchmark-visual-runtime.mjs:178-226`
- Read only: `src/components/effects/MineralSurface.tsx`
- Read only: `src/components/effects/VisualStage.tsx`
- Read only: `src/app/globals.css`
- Read only: `data/reservations.json`

**Interfaces:**
- Consumes: `WebGLPolicy` y `AdaptiveFpsTier` de `src/lib/visual-system.ts`.
- Produces: contratos iniciales para `resolveVaporSteps`, `VAPOR_VERTEX_SHADER` y `VAPOR_FRAGMENT_SHADER`, todavía inexistentes al comenzar la tarea.

- [ ] **Step 1: Registrar el checkout y la integridad previa sin modificar producto**

Run:

```bash
git status --short
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
shasum -a 256 data/reservations.json
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
```

Expected:

```text
El status conserva los cambios existentes; branch main; HEAD 3e836571881564aae3fb6fadc286d27531a7c5b4; reservations SHA-256 1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad; HTTP 200.
```

- [ ] **Step 2: Extender el benchmark con los recursos eliminados y el contrato visible del vapor**

Add to the `structural` object in `scripts/benchmark-visual-runtime.mjs` immediately after `activeSurface`:

```js
vaporField: canvas?.dataset.vaporField ?? null,
vaporSteps: Number(canvas?.dataset.vaporSteps ?? 0),
visualMaterials: Number(canvas?.dataset.visualMaterials ?? 0),
visualDrawCalls: Number(canvas?.dataset.visualDrawCalls ?? 0),
visualTextures: Number(canvas?.dataset.visualTextures ?? 0),
visualRenderTargets: Number(canvas?.dataset.visualRenderTargets ?? 0),
ambientLightLayers: document.querySelectorAll(
  '[data-ambient-light-layer="true"]',
).length,
ambientLights: document.querySelectorAll('[data-ambient-light="true"]').length,
```

These keys intentionally return `null`/`0` in the before snapshot and become the comparable structural gate in the after snapshot.

- [ ] **Step 3: Capturar baseline fresco en el servidor actual**

Run:

```bash
lili_vapor_baseline_dir=$(mktemp -d /tmp/lili-vapor-baseline.XXXXXX)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9335 \
  --user-data-dir="$lili_vapor_baseline_dir/chrome" \
  --disable-gpu-sandbox \
  about:blank >"$lili_vapor_baseline_dir/chrome.log" 2>&1 &
lili_vapor_chrome_pid=$!
QA_CDP_HTTP_URL=http://127.0.0.1:9335 \
QA_BASE_URL=http://127.0.0.1:3000/ \
QA_VISUAL_LABEL=vapor-before \
QA_OUTPUT_PATH="$lili_vapor_baseline_dir/benchmark-before.json" \
QA_SCREENSHOT_PATH="$lili_vapor_baseline_dir/benchmark-before.png" \
node scripts/benchmark-visual-runtime.mjs
kill "$lili_vapor_chrome_pid"
```

Expected:

```text
benchmark-before.json y benchmark-before.png existen; el reporte conserva bytes JS/CSS, nodos, SVG, draws, p95, long tasks, listeners, overflow y fallos de consola/red.
```

Record the exact temporary directory in the execution notes. Do not infer the new budget from an older run.

- [ ] **Step 4: Crear dos pruebas unitarias rojas para calidad y volumen real**

Create `scripts/qa-vapor-field.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadVaporField() {
  try {
    return await import("../src/lib/volumetric-vapor.ts");
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
    return null;
  }
}

test("vapor quality is bounded by policy and adaptive FPS tier", async () => {
  const vapor = await loadVaporField();
  assert.ok(vapor, "expected the volumetric vapor module to exist");

  assert.equal(vapor.resolveVaporSteps({ policy: "animated", tier: "smooth" }), 8);
  assert.equal(vapor.resolveVaporSteps({ policy: "animated", tier: "balanced" }), 6);
  assert.equal(vapor.resolveVaporSteps({ policy: "animated", tier: "recovery" }), 4);
  assert.equal(vapor.resolveVaporSteps({ policy: "static", tier: "smooth" }), 6);
  assert.equal(vapor.resolveVaporSteps({ policy: "fallback", tier: "smooth" }), 0);
});

test("the shader ray-marches one bounded 3D density field without resources", async () => {
  const vapor = await loadVaporField();
  assert.ok(vapor, "expected the volumetric vapor module to exist");
  const shader = vapor.VAPOR_FRAGMENT_SHADER ?? "";

  assert.match(shader, /uniform int uVaporSteps/);
  assert.match(shader, /float noise3\s*\(vec3/);
  assert.match(shader, /float vaporDensity\s*\(vec3/);
  assert.match(shader, /for\s*\(int i = 0; i < MAX_VAPOR_STEPS; i\+\+\)/);
  assert.match(shader, /transmittance/);
  assert.match(shader, /time \* 0\.035/);
  assert.match(shader, /time \* 0\.15/);
  assert.doesNotMatch(
    shader,
    /sampler2D|sampler3D|texture2D|texture3D|discard|dFdx|dFdy/,
  );
  assert.doesNotMatch(shader, /while\s*\(/);
});
```

- [ ] **Step 5: Reemplazar el test de luces en el runner, sin borrar todavía la implementación anterior**

Change `scripts/run-qa.mjs` to:

```js
const tests = [
  "scripts/qa-vapor-field.mjs",
  "scripts/qa-whatsapp-only.mjs",
  "scripts/qa-visual-system.mjs",
];
```

- [ ] **Step 6: Ejecutar RED y verificar el motivo exacto**

Run:

```bash
node --test scripts/qa-vapor-field.mjs
```

Expected:

```text
2 tests fail only because src/lib/volumetric-vapor.ts does not exist.
```

- [ ] **Step 7: Registrar checkpoint local sin commit**

Run:

```bash
git diff --check
git status --short -- scripts docs/superpowers data/reservations.json
```

Expected:

```text
git diff --check sin salida; el hash de reservations sigue idéntico; aparecen solo pruebas, benchmark y documentos de esta tarea dentro del alcance mostrado.
```

---

### Task 2: Construir el shader único de condensación volumétrica

**Files:**
- Create: `src/lib/volumetric-vapor.ts`
- Test: `scripts/qa-vapor-field.mjs`

**Interfaces:**
- Produces: `VAPOR_VERTEX_SHADER: string`.
- Produces: `VAPOR_FRAGMENT_SHADER: string` con uniforms `uResolution`, `uTime`, `uPhase`, `uScale`, `uIntensity`, `uDark`, `uVaporSteps`.
- Produces: `resolveVaporSteps({ policy, tier }): 0 | 4 | 6 | 8`.
- Does not own: canvas, renderer, RAF, scene, material, DOM or browser listeners.

- [ ] **Step 1: Implementar el resolver de calidad con tipos cerrados**

Create `src/lib/volumetric-vapor.ts` with this header:

```ts
import type { AdaptiveFpsTier, WebGLPolicy } from "@/lib/visual-system";

export type VaporStepCount = 0 | 4 | 6 | 8;

export function resolveVaporSteps({
  policy,
  tier,
}: {
  policy: WebGLPolicy;
  tier: AdaptiveFpsTier;
}): VaporStepCount {
  if (policy === "fallback") return 0;
  if (policy === "static") return 6;
  if (tier === "recovery") return 4;
  if (tier === "balanced") return 6;
  return 8;
}

export const VAPOR_VERTEX_SHADER = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;
```

- [ ] **Step 2: Añadir el fragment shader completo, conservando mineral y agregando volumen 3D**

Append this implementation to the same file:

```ts
export const VAPOR_FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uPhase;
uniform float uScale;
uniform float uIntensity;
uniform float uDark;
uniform int uVaporSteps;

const int MAX_VAPOR_STEPS = 8;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x),
    mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float mineral(vec2 p) {
  float value = noise2(p);
  value += noise2(p * 2.03 + vec2(1.7, -2.1)) * 0.48;
  value += noise2(p * 4.11 - vec2(3.2, 0.8)) * 0.2;
  return value / 1.68;
}

float hash3(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), u.x),
      mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), u.x),
      u.y
    ),
    mix(
      mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), u.x),
      mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), u.x),
      u.y
    ),
    u.z
  );
}

float vaporDensity(vec3 p, float time) {
  vec3 drift = vec3(
    sin(time * 0.15 + uPhase * 6.2831) * 0.16,
    time * 0.035,
    cos(time * 0.12 + uPhase * 4.7) * 0.12
  );
  vec3 q = p * vec3(1.05, 0.82, 1.18) * (0.72 + uScale * 0.08) + drift;
  float broad = noise3(q);
  float folded = noise3(q * 2.03 + vec3(1.7, -2.4, 0.9));
  float density = smoothstep(0.48, 0.78, broad * 0.72 + folded * 0.38);
  float condensationBand = smoothstep(-0.8, 0.22, p.y) * smoothstep(1.12, 0.08, p.y);
  return density * condensationBand;
}

void main() {
  vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
  vec2 p = uv - 0.5;
  p.x *= uResolution.x / max(uResolution.y, 1.0);

  float driftTime = uTime * 0.019;
  vec2 drift = vec2(
    sin(driftTime + uPhase * 6.2831),
    cos(driftTime * 0.83 + uPhase * 4.2)
  ) * 0.052;
  float baseNoise = mineral((p + drift) * uScale + uPhase * 7.0);
  float fineNoise = noise2((p - drift * 0.4) * (uScale * 3.7) - uPhase * 5.0);
  float caustic = 0.5 + 0.5 * sin(
    p.y * (11.0 + uScale) + p.x * 4.2 + baseNoise * 3.8 + uPhase * 8.0
  );

  vec3 night = vec3(0.043, 0.027, 0.071);
  vec3 violet = vec3(0.215, 0.116, 0.310);
  vec3 orchid = vec3(0.555, 0.367, 0.704);
  vec3 lavender = vec3(0.710, 0.579, 0.828);
  vec3 pearl = vec3(0.969, 0.932, 0.974);

  vec3 color = mix(night, violet, baseNoise * 0.8);
  color = mix(color, orchid, caustic * 0.27 * uIntensity);
  color = mix(color, lavender, fineNoise * 0.13 * uIntensity);

  vec3 rayOrigin = vec3(p * 0.92, -1.18);
  vec3 rayDirection = normalize(vec3(p * 0.12, 1.0));
  float stepLength = 2.2 / max(float(uVaporSteps), 1.0);
  float transmittance = 1.0;
  vec3 scattering = vec3(0.0);

  for (int i = 0; i < MAX_VAPOR_STEPS; i++) {
    if (i >= uVaporSteps) break;
    float depth = 0.2 + (float(i) + 0.5) * stepLength;
    vec3 samplePoint = rayOrigin + rayDirection * depth;
    float density = vaporDensity(samplePoint, uTime);
    float absorption = density * stepLength * (0.24 + uIntensity * 0.12);
    vec3 vaporColor = mix(lavender, pearl, 0.45 + samplePoint.z * 0.12);
    scattering += transmittance * absorption * vaporColor;
    transmittance *= 1.0 - clamp(absorption, 0.0, 0.72);
  }

  float vaporAlpha = (1.0 - transmittance) * (0.45 + uIntensity * 0.28);
  color = mix(color, scattering + pearl * vaporAlpha * 0.18, vaporAlpha);
  float center = exp(-dot(p * vec2(0.72, 1.0), p * vec2(0.72, 1.0)) * 2.35);
  color = mix(color, pearl, center * caustic * 0.13 * uIntensity);
  color = mix(color, night, uDark * 0.07);

  float edge = smoothstep(1.02, 0.08, length(p * vec2(0.72, 1.0)));
  float mineralAlpha = (0.24 + caustic * 0.18 + fineNoise * 0.05) * uIntensity;
  float alpha = clamp(mineralAlpha + vaporAlpha * 0.72, 0.0, 0.86) * edge;
  gl_FragColor = vec4(color, alpha);
}
`;
```

The implementation may be algebraically optimized during Task 6, but it must preserve the public uniforms, true `vec3` density sampling, fixed maximum of eight steps, deterministic drift and single-pass output.

- [ ] **Step 3: Ejecutar las pruebas focales hasta GREEN**

Run:

```bash
node --test scripts/qa-vapor-field.mjs
npm run typecheck
```

Expected:

```text
2/2 vapor tests pass; TypeScript exits 0.
```

- [ ] **Step 4: Confirmar que el módulo no adquirió ownership de runtime**

Run:

```bash
rg -n "WebGLRenderer|ShaderMaterial|requestAnimationFrame|setTimeout|setInterval|Math\.random|addEventListener|sampler|texture" src/lib/volumetric-vapor.ts
```

Expected:

```text
Solo aparecen ShaderMaterial/sampler/texture si forman parte de comentarios o no aparecen; no existe ownership de renderer, RAF, temporizadores, aleatoriedad, listeners ni recursos muestreados.
```

Prefer an empty output by keeping those terms out of comments.

---

### Task 3: Eliminar las luces aleatorias e integrar el volumen al renderer existente

**Files:**
- Modify: `scripts/qa-vapor-field.mjs`
- Modify: `scripts/qa-visual-system.mjs:268-302`
- Modify: `src/components/effects/VisualStage.tsx:3-91`
- Modify: `src/components/effects/MineralSurface.tsx:1-338`
- Delete: `src/components/effects/AmbientLightLayer.tsx`
- Delete: `src/lib/ambient-light.ts`
- Delete: `scripts/qa-ambient-light.mjs`
- Test: `scripts/qa-vapor-field.mjs`
- Test: `scripts/qa-visual-system.mjs`

**Interfaces:**
- `VisualStage` owns one `<MineralSurface surface={activeSurface} />` and one SVG overlay, with no ambient-light component.
- `MineralSurface` consumes `resolveVaporSteps`, `VAPOR_VERTEX_SHADER`, `VAPOR_FRAGMENT_SHADER`.
- Canvas exposes `data-vapor-field`, `data-vapor-steps`, `data-visual-materials`, `data-visual-draw-calls`, `data-visual-textures`, `data-visual-render-targets` strictly for rendered QA.

- [ ] **Step 1: Agregar un contrato rojo de ownership y eliminación total**

Append to `scripts/qa-vapor-field.mjs`:

```js
test("one existing renderer owns vapor and the random ambient subsystem is gone", async () => {
  const [surfaceSource, stageSource] = await Promise.all([
    readFile(
      new URL("../src/components/effects/MineralSurface.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/components/effects/VisualStage.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(surfaceSource, /VAPOR_FRAGMENT_SHADER/);
  assert.match(surfaceSource, /resolveVaporSteps/);
  assert.equal((surfaceSource.match(/new THREE\.WebGLRenderer/g) ?? []).length, 1);
  assert.equal((surfaceSource.match(/new THREE\.Scene/g) ?? []).length, 1);
  assert.equal((surfaceSource.match(/new THREE\.ShaderMaterial/g) ?? []).length, 1);
  assert.equal((surfaceSource.match(/renderer\.render\(scene, camera\)/g) ?? []).length, 1);
  assert.doesNotMatch(surfaceSource, /WebGLRenderTarget|Data3DTexture|TextureLoader/);
  assert.doesNotMatch(stageSource, /AmbientLightLayer|data-ambient-light/);

  for (const relativePath of [
    "../src/components/effects/AmbientLightLayer.tsx",
    "../src/lib/ambient-light.ts",
  ]) {
    await assert.rejects(readFile(new URL(relativePath, import.meta.url), "utf8"), {
      code: "ENOENT",
    });
  }
});
```

- [ ] **Step 2: Ejecutar RED contra la arquitectura anterior**

Run:

```bash
node --test scripts/qa-vapor-field.mjs
```

Expected:

```text
The new ownership test fails because MineralSurface still has inline shaders/two textual render calls and AmbientLightLayer still exists.
```

- [ ] **Step 3: Quitar `AmbientLightLayer` de `VisualStage` sin alterar el SVG**

In `src/components/effects/VisualStage.tsx`:

```diff
-import { AmbientLightLayer } from "@/components/effects/AmbientLightLayer";
 import { MineralSurface } from "@/components/effects/MineralSurface";
@@
       <span className="visual-global-atmosphere" />
       <MineralSurface surface={activeSurface} />
-      <AmbientLightLayer />
       <div
```

Do not edit `DIGITOPRESSURE_HTML`, its path data or the section-selection logic.

- [ ] **Step 4: Importar los shaders y resolver la cantidad de muestras en el mismo material**

At the top of `src/components/effects/MineralSurface.tsx`, remove both inline shader constants and add:

```ts
import {
  resolveVaporSteps,
  VAPOR_FRAGMENT_SHADER,
  VAPOR_VERTEX_SHADER,
} from "@/lib/volumetric-vapor";
```

Change the uniforms/material block to:

```ts
const uniforms = {
  uResolution: { value: new THREE.Vector2(1, 1) },
  uTime: { value: 0 },
  uPhase: { value: surfaceRef.current.shaderPhase },
  uScale: { value: surfaceRef.current.shaderScale },
  uIntensity: { value: surfaceRef.current.webglIntensity },
  uDark: { value: surfaceRef.current.theme === "dark" ? 1 : 0 },
  uVaporSteps: {
    value: resolveVaporSteps({ policy, tier: "smooth" }),
  },
};
const material = new THREE.ShaderMaterial({
  vertexShader: VAPOR_VERTEX_SHADER,
  fragmentShader: VAPOR_FRAGMENT_SHADER,
  uniforms,
  transparent: true,
  depthTest: false,
  depthWrite: false,
});
```

- [ ] **Step 5: Publicar el tier y los límites sin crear otro loop**

Replace `publishFrameBudget` with:

```ts
const publishFrameBudget = (scrolling = false) => {
  const paused =
    !running || scrolling || document.hidden || policy !== "animated";
  const vaporSteps = resolveVaporSteps({
    policy,
    tier: fpsSnapshot.tier,
  });
  uniforms.uVaporSteps.value = vaporSteps;
  canvas.dataset.vaporSteps = String(vaporSteps);
  canvas.dataset.visualFpsTier = paused ? "paused" : fpsSnapshot.tier;
  canvas.dataset.visualTargetFps = paused
    ? "0"
    : String(fpsSnapshot.targetFps);
};
```

Immediately after the first successful `draw(...)`, publish the static resource identity once:

```ts
canvas.dataset.visualMaterials = "1";
canvas.dataset.visualDrawCalls = String(renderer.info.render.calls);
canvas.dataset.visualTextures = String(renderer.info.memory.textures);
canvas.dataset.visualRenderTargets = "0";
```

Do not write these data attributes every frame.

- [ ] **Step 6: Mantener exactamente un render por draw**

The end of `draw` must be exactly:

```ts
uniforms.uIntensity.value = current.webglIntensity;
uniforms.uDark.value = current.theme === "dark" ? 1 : 0;
renderer.render(scene, camera);
```

Remove the duplicated `renderer.render(scene, camera)` currently present. Preserve the shared cadence and scroll-pause logic.

- [ ] **Step 7: Exponer identidad del volumen en el canvas, incluido fallback**

Add these properties to the returned `<canvas>`:

```tsx
data-vapor-field={state === "fallback" ? "css-fallback" : "raymarch-3d"}
data-vapor-steps={state === "fallback" ? "0" : undefined}
data-visual-materials={state === "fallback" ? "0" : undefined}
data-visual-draw-calls={state === "fallback" ? "0" : undefined}
data-visual-textures="0"
data-visual-render-targets="0"
```

For WebGL states, the effect publishes the actual values after the first successful draw. Leaving the non-fallback JSX values `undefined` prevents a later React render caused by `activeSurface` from overwriting an adaptive 6/4-step runtime value with a stale default.

- [ ] **Step 8: Borrar el subsistema anterior completo**

Delete only these exact files with `apply_patch`:

```text
src/components/effects/AmbientLightLayer.tsx
src/lib/ambient-light.ts
scripts/qa-ambient-light.mjs
```

Do not use recursive deletion.

- [ ] **Step 9: Actualizar el contrato estático existente del shader**

In the test `the global mineral shader stays inside the single-engine budget` in `scripts/qa-visual-system.mjs`, read both files and assert:

```js
const [surfaceSource, vaporSource] = await Promise.all([
  readFile(
    new URL("../src/components/effects/MineralSurface.tsx", import.meta.url),
    "utf8",
  ),
  readFile(new URL("../src/lib/volumetric-vapor.ts", import.meta.url), "utf8"),
]);
const shader = vaporSource.match(
  /export const VAPOR_FRAGMENT_SHADER = `([\s\S]*?)`;/,
)?.[1] ?? "";

assert.doesNotMatch(shader, /sampler2D|sampler3D|texture2D|texture3D|while\s*\(/);
assert.match(shader, /for\s*\(int i = 0; i < MAX_VAPOR_STEPS; i\+\+\)/);
assert.match(surfaceSource, /import\("three"\)/);
assert.equal((surfaceSource.match(/new THREE\.WebGLRenderer/g) ?? []).length, 1);
assert.equal((surfaceSource.match(/new THREE\.Scene/g) ?? []).length, 1);
assert.equal((surfaceSource.match(/new THREE\.OrthographicCamera/g) ?? []).length, 1);
assert.equal((surfaceSource.match(/new THREE\.PlaneGeometry/g) ?? []).length, 1);
assert.equal((surfaceSource.match(/new THREE\.ShaderMaterial/g) ?? []).length, 1);
assert.equal((surfaceSource.match(/renderer\.render\(scene, camera\)/g) ?? []).length, 1);
assert.doesNotMatch(surfaceSource, /document\.createElement\(["']canvas/);
assert.doesNotMatch(surfaceSource, /createFramebuffer|WebGLRenderTarget|requestAnimationFrame/);
```

- [ ] **Step 10: Ejecutar focal y suite hasta GREEN**

Run:

```bash
node --test scripts/qa-vapor-field.mjs scripts/qa-visual-system.mjs
npm test
npm run typecheck
```

Expected:

```text
All tests pass; npm test reports 27/27 at this point; typecheck exits 0.
```

The count is 26 previous tests, minus 2 ambient tests, plus 3 vapor tests.

---

### Task 4: Realzar lotus, atmósfera y red de digitopuntura sin alterar layout

**Files:**
- Modify: `scripts/qa-vapor-field.mjs`
- Modify: `src/app/globals.css:82-99,181-435,2302-2346`
- Test: `scripts/qa-vapor-field.mjs`
- Test: `scripts/qa-visual-runtime-rendered.mjs`

**Interfaces:**
- CSS keeps `.visual-webgl-stage`, `.visual-global-atmosphere`, `.dp-overlay`, `.dp-motif`, `.dp-route`, `.dp-ring`.
- CSS removes `.ambient-light-layer`, `.ambient-light` and every media-query reference to them.
- Section states continue to be driven by `data-surface`, `data-background-technique` and real FAQ state.

- [ ] **Step 1: Agregar un contrato rojo de valores cromáticos y ausencia CSS**

Append to `scripts/qa-vapor-field.mjs`:

```js
test("the approved background and digitopressure colors replace ambient CSS lights", async () => {
  const css = await readFile(
    new URL("../src/app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(css, /\.visual-webgl-stage::before\s*\{[^}]*opacity:\s*0\.78/si);
  assert.match(css, /filter:\s*saturate\(1\.12\) contrast\(1\.04\)/);
  assert.match(css, /\.visual-global-atmosphere\s*\{[^}]*opacity:\s*0\.66/si);
  assert.match(css, /\.dp-overlay\s*\{[^}]*--dp-f:\s*0\.075/si);
  assert.match(css, /data-background-technique="podal"[\s\S]*--dp-f:\s*0\.34/);
  assert.match(css, /data-surface="questions"[\s\S]*\.dp-ring\s*\{\s*opacity:\s*0\.88/);
  assert.doesNotMatch(css, /\.ambient-light(?:-layer)?\b|--ambient-|data-light-phase/);
});
```

- [ ] **Step 2: Ejecutar RED y confirmar que falla por los valores viejos**

Run:

```bash
node --test scripts/qa-vapor-field.mjs
```

Expected:

```text
3 prior vapor tests pass; the new color/removal contract fails on lotus opacity 0.64 and ambient-light CSS.
```

- [ ] **Step 3: Aplicar el realce cromático aprobado al fondo existente**

Change only these declarations in `src/app/globals.css`:

```css
body {
  background:
    radial-gradient(circle at 50% 8%, rgb(93 52 126 / 0.4), transparent 45rem),
    var(--lili-night);
}

.visual-webgl-stage::before {
  opacity: 0.78;
  background-image:
    linear-gradient(180deg, rgb(11 7 18 / 0.32), rgb(33 18 48 / 0.15) 46%, rgb(11 7 18 / 0.68)),
    url("/brand/lili-lotus-background.jpg");
  filter: saturate(1.12) contrast(1.04);
}

.visual-global-atmosphere {
  opacity: 0.66;
  background:
    radial-gradient(circle at 28% 36%, rgb(239 214 228 / 0.21), transparent 22%),
    radial-gradient(circle at 72% 62%, rgb(170 137 200 / 0.24), transparent 28%);
}
```

Keep the final 0.68 lower-stage protection and `.visual-webgl-stage::after` unchanged unless rendered contrast fails the existing text/accessibility checks.

- [ ] **Step 4: Aplicar todas las opacidades aprobadas a la red existente**

Update the digitopressure block:

```css
.dp-overlay {
  --dp-f: 0.075;
  --dp-h: 0.075;
  --dp-r: 0.075;
  --dp-c: 0.075;
}

.dp-route { stroke-opacity: 0.95; }
.dp-route--quiet { opacity: 0.58; stroke-opacity: 0.68; }
.dp-ring { opacity: 0.56; }

html:has(.technique-map-section[data-background-technique="podal"])
  .dp-overlay[data-surface="map"] { --dp-f: 0.34; }
html:has(.technique-map-section[data-background-technique="manos"])
  .dp-overlay[data-surface="map"] { --dp-h: 0.34; }
html:has(.technique-map-section[data-background-technique="rostro"])
  .dp-overlay[data-surface="map"] { --dp-r: 0.34; }

.dp-overlay:is([data-surface="header"], [data-surface="footer"]) { --dp-c: 0.12; }
.dp-overlay:is([data-surface="hero"], [data-surface="reading"]) { --dp-f: 0.26; }
.dp-overlay:is([data-surface="introduction"], [data-surface="benefits"]) {
  --dp-f: 0.18;
  --dp-h: 0.18;
}
.dp-overlay[data-surface="techniques"] {
  --dp-f: 0.20;
  --dp-h: 0.20;
  --dp-r: 0.20;
}
.dp-overlay[data-surface="experience"] { --dp-h: 0.21; --dp-c: 0.21; }
.dp-overlay[data-surface="cta"] { --dp-f: 0.21; --dp-h: 0.21; --dp-c: 0.21; }
.dp-overlay[data-surface="promotions"] { --dp-c: 0.20; }
.dp-overlay[data-surface="questions"] { --dp-r: 0.22; }
html:has(.questions-section .faq-item.is-open)
  .dp-overlay[data-surface="questions"]
  .dp-ring { opacity: 0.88; }
```

Preserve the promotions point-selection rule and the exact SVG geometry.

- [ ] **Step 5: Eliminar todo el CSS de las luces y limpiar media queries**

Remove:

```text
.ambient-light-layer
.ambient-light
.ambient-light[data-tone="pearl"]
.ambient-light[data-tone="orchid"]
.ambient-light[data-tone="violet"]
.ambient-light-layer[data-light-phase="dim"] .ambient-light
```

Also remove `.ambient-light-layer`/`.ambient-light` from coarse-pointer, reduced-motion and forced-colors selector lists. Keep `.visual-webgl-stage`, `.visual-global-atmosphere`, `.dp-motif`, `.dp-route` and `.dp-overlay` behavior intact.

- [ ] **Step 6: Ejecutar GREEN y verificar que CSS se redujo**

Run:

```bash
node --test scripts/qa-vapor-field.mjs
rg -n "ambient-light|--ambient-|data-light-phase" src
git diff --numstat -- src/app/globals.css
```

Expected:

```text
4/4 vapor tests pass; rg has no matches; CSS reports fewer removed bytes/lines than added or is later proven <= baseline decoded bytes.
```

---

### Task 5: Migrar QA renderizado de luces aleatorias a volumen determinista

**Files:**
- Modify: `scripts/qa-responsive-visual.mjs:238-332,458-538,592-805`
- Modify: `scripts/qa-visual-runtime-rendered.mjs:80-219,520-585`
- Modify: `scripts/benchmark-visual-runtime.mjs`
- Test: `scripts/qa-responsive-visual.mjs`
- Test: `scripts/qa-visual-runtime-rendered.mjs`

**Interfaces:**
- Rendered canvas states: `data-webgl-state`, `data-vapor-field`, `data-vapor-steps`, `data-visual-fps-tier`, `data-visual-target-fps`.
- Structural budgets: ambient nodes 0; canvas/stage/RAF/listener 1; pointer listeners 0; textures/render targets 0; material/draw call 1.
- Digitopressure map/FAQ still changes only from real interaction state.

- [ ] **Step 1: Reemplazar observaciones de ambient lights por recursos del volumen**

In both rendered scripts, delete `ambientLayer`, ambient pointer/ARIA/motion/cycle/light-style observations. Read the canvas once and return:

```js
const canvas = document.querySelector("canvas");
// inside the returned object
ambientLightLayers: document.querySelectorAll('[data-ambient-light-layer="true"]').length,
ambientLights: document.querySelectorAll('[data-ambient-light="true"]').length,
vaporField: canvas?.dataset.vaporField ?? null,
vaporSteps: Number(canvas?.dataset.vaporSteps ?? 0),
visualMaterials: Number(canvas?.dataset.visualMaterials ?? 0),
visualDrawCalls: Number(canvas?.dataset.visualDrawCalls ?? 0),
visualTextures: Number(canvas?.dataset.visualTextures ?? 0),
visualRenderTargets: Number(canvas?.dataset.visualRenderTargets ?? 0),
canvasZ: canvas ? Number.parseInt(getComputedStyle(canvas).zIndex, 10) : null,
```

Replace the old z-index assertion with:

```js
assert.ok(observation.digitopressureZ > observation.canvasZ);
assert.ok(observation.stageZ < observation.contentZ);
```

- [ ] **Step 2: Reemplazar las expectativas estructurales**

For animated desktop assert:

```js
assert.equal(observation.ambientLightLayers, 0);
assert.equal(observation.ambientLights, 0);
assert.equal(observation.vaporField, "raymarch-3d");
assert.equal(observation.vaporSteps, 8);
assert.equal(observation.visualMaterials, 1);
assert.equal(observation.visualDrawCalls, 1);
assert.equal(observation.visualTextures, 0);
assert.equal(observation.visualRenderTargets, 0);
```

For touch/reduced motion assert `webglState === "static"`, `vaporField === "raymarch-3d"`, `vaporSteps === 6`, and no extra WebGL draws after the initial frame. For true fallback assert `vaporField === "css-fallback"`, `vaporSteps === 0`, materials/draw calls 0.

- [ ] **Step 3: Eliminar la espera autónoma de 8.5 segundos**

In `assertInteractiveDesktop`, replace `readAmbient`, `pointerBefore`, `pointerAfter`, the cycle wait, and `autonomousAfter` with:

```js
const readVapor = () => {
  const canvas = document.querySelector("canvas");
  return {
    field: canvas?.dataset.vaporField ?? null,
    steps: canvas?.dataset.vaporSteps ?? null,
    surface: canvas?.dataset.webglSurface ?? null,
    materials: canvas?.dataset.visualMaterials ?? null,
    textures: canvas?.dataset.visualTextures ?? null,
  };
};
const pointerBefore = readVapor();
window.dispatchEvent(new PointerEvent("pointermove", {
  bubbles: true,
  clientX: innerWidth * 0.92,
  clientY: innerHeight * 0.12,
  pointerType: "mouse",
}));
await new Promise((resolve) => setTimeout(resolve, 120));
const pointerAfter = readVapor();
```

Keep:

```js
assert.deepEqual(result.pointerAfter, result.pointerBefore);
```

Delete every assertion that expects a random cycle or changed light positions. Rename screenshot `desktop-1440-ambient-cycle.png` to `desktop-1440-vapor-map-state.png` and capture it after the real map click.

- [ ] **Step 4: Instrumentar static/reduced draw counts in the runtime script**

Extract the existing `Page.addScriptToEvaluateOnNewDocument` WebGL draw wrapper into an `installVisualProbe(socket)` helper and call it in every test that reads draw counts before navigation. This avoids relying on test order or state left in the shared page target.

In each touch/reduced preference navigation, record `drawsAtReady`, wait 500 ms, then record `drawsAfterWait`. Assert:

```js
assert.ok(touch.drawsAtReady > 0);
assert.equal(touch.drawsAfterWait, touch.drawsAtReady);
assert.ok(reduced.drawsAtReady > 0);
assert.equal(reduced.drawsAfterWait, reduced.drawsAtReady);
```

Do not create a production counter or RAF for this; the counter exists only in the injected CDP test page.

Add a 319 px viewport observation after reduced motion, without asserting normal-layout overflow at this intentionally sub-minimum width:

```js
assert.equal(tinyViewport.webglState, "fallback");
assert.equal(tinyViewport.vaporField, "css-fallback");
assert.equal(tinyViewport.vaporSteps, 0);
assert.equal(tinyViewport.visualMaterials, 0);
assert.equal(tinyViewport.visualDrawCalls, 0);
assert.equal(tinyViewport.lotusOpacity, 0.78);
```

The pure `resolveWebGLPolicy` tests remain responsible for Save Data and low-memory branches; no production capability spoofing is added.

- [ ] **Step 5: Mantener y endurecer los invariantes previos**

Across both scripts retain:

```text
canvas 1
stage 1
RAF owner 1
scroll listener 1
pointer listener 0
ReflexField 3
digitopressure overlay/SVG root 1
digitopressure descendants <= 42
paths <= 8
points <= 24
filters 0
horizontal overflow 0
console issues 0
network failures 0
WhatsApp links 16
bookingCopy false
```

Replace the loose `<= 75` SVG threshold with the approved actual `<= 42`. Do not relax any typography, spacing, containment, accessibility, mobile-menu, map-tab or FAQ assertions.

Keep the short rendered-runtime transition tolerance, because entry/exit invalidations can legitimately produce up to two draws even though the steady-state loop is paused:

```js
assert.ok(
  scrollObservation.draws <= 2,
  `WebGL kept drawing during sustained scroll (${scrollObservation.draws} draws)`,
);
```

The longer benchmark remains the exact steady-state gate and must report `scroll.webglDraws === 0` after its first driven scroll event. Do not weaken that benchmark assertion.

- [ ] **Step 6: Ejecutar static QA and build before browser QA**

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
All commands exit 0; npm test reports 28/28 after the fourth vapor test; no whitespace errors.
```

---

### Task 6: Validar visualmente, medir y optimizar el vapor dentro del presupuesto

**Files:**
- Modify if needed: `src/lib/volumetric-vapor.ts`
- Modify if needed: `src/components/effects/MineralSurface.tsx`
- Modify if needed: `src/app/globals.css`
- Evidence only: temporary benchmark JSON and screenshots outside the repository

**Interfaces:**
- Browser-visible appearance at 1440, 1024, 768 touch, 390 touch, 320 touch, reduced motion and forced colors.
- Performance comparison uses the fresh before snapshot from Task 1 and the same viewport/Chrome mode.

- [ ] **Step 1: Intentar primero QA con Browser integrado**

Use the Browser QA workflow to open `http://127.0.0.1:3000/`, inspect the hero, map, questions and final CTA, and verify:

```text
El lotus tiene más color sin competir con el texto.
La red de pie/mano/rostro se reconoce sobre el fondo ya existente.
El vapor tiene profundidad y continuidad, no lectura de partículas o luces puntuales.
No hay flashes, encendido/apagado, saltos de posición ni reacción al cursor.
Glass, texto y CTAs mantienen contraste y legibilidad.
```

If the integrated Browser again reports `No browser is available`, record the exact error once and continue with the isolated Chrome/CDP commands below. Do not treat source compilation as visual evidence.

- [ ] **Step 2: Ejecutar la matriz responsive en Chrome aislado**

Run:

```bash
lili_vapor_qa_dir=$(mktemp -d /tmp/lili-vapor-qa.XXXXXX)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9336 \
  --user-data-dir="$lili_vapor_qa_dir/chrome" \
  --disable-gpu-sandbox \
  about:blank >"$lili_vapor_qa_dir/chrome.log" 2>&1 &
lili_vapor_qa_chrome_pid=$!
QA_CDP_HTTP_URL=http://127.0.0.1:9336 \
QA_BASE_URL=http://127.0.0.1:3000/ \
QA_SCREENSHOT_DIR="$lili_vapor_qa_dir/screenshots" \
node scripts/qa-responsive-visual.mjs
QA_CDP_HTTP_URL=http://127.0.0.1:9336 \
QA_BASE_URL=http://127.0.0.1:3000/ \
node --test scripts/qa-visual-runtime-rendered.mjs
kill "$lili_vapor_qa_chrome_pid"
```

Expected:

```text
Both commands exit 0; desktop is animated with 8 steps; touch/reduced are static with 6; forced-colors hides the stage; no overflow, console or network errors.
```

- [ ] **Step 3: Inspeccionar imágenes reales, no solo snapshots numéricos**

Open with the image viewer at minimum:

```text
$lili_vapor_baseline_dir/benchmark-before.png
$lili_vapor_qa_dir/screenshots/desktop-1440-viewport.png
$lili_vapor_qa_dir/screenshots/desktop-1440-map.png
$lili_vapor_qa_dir/screenshots/desktop-1440-questions.png
$lili_vapor_qa_dir/screenshots/mobile-390-viewport.png
$lili_vapor_qa_dir/screenshots/reduced-motion-1440-viewport.png
```

Reject the result if the vapor reads as opaque smoke, low-resolution bands, neon blobs, separate spotlights, obvious repeated tiles, a flat 2D mask, or if it obscures body text/buttons. Reject if digitopressure remains imperceptible or becomes dominant decoration.

- [ ] **Step 4: Capturar benchmark posterior comparable**

Start a fresh isolated Chrome on port 9337 and run:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9337 \
  --user-data-dir="$lili_vapor_qa_dir/benchmark-chrome" \
  --disable-gpu-sandbox \
  about:blank >"$lili_vapor_qa_dir/benchmark-chrome.log" 2>&1 &
lili_vapor_benchmark_pid=$!
QA_CDP_HTTP_URL=http://127.0.0.1:9337 \
QA_BASE_URL=http://127.0.0.1:3000/ \
QA_VISUAL_LABEL=vapor-after \
QA_OUTPUT_PATH="$lili_vapor_qa_dir/benchmark-after.json" \
QA_SCREENSHOT_PATH="$lili_vapor_qa_dir/benchmark-after.png" \
node scripts/benchmark-visual-runtime.mjs
kill "$lili_vapor_benchmark_pid"
```

- [ ] **Step 5: Comparar presupuestos con un comando reproducible**

Run, replacing the two literal paths with the recorded directories:

```bash
node -e '
const fs = require("fs");
const before = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const after = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const delta = (key) => after.structural[key] - before.structural[key];
const report = {
  jsDelta: delta("initialJsDecodedBytes"),
  cssDelta: delta("initialCssDecodedBytes"),
  dom: after.structural.nodes,
  svg: after.structural.svgNodes,
  ambientLayers: after.structural.ambientLightLayers,
  ambientLights: after.structural.ambientLights,
  vaporField: after.structural.vaporField,
  vaporSteps: after.structural.vaporSteps,
  materials: after.structural.visualMaterials,
  drawCalls: after.structural.visualDrawCalls,
  textures: after.structural.visualTextures,
  renderTargets: after.structural.visualRenderTargets,
  idle: after.runtime.idle,
  pointer: after.runtime.pointer,
  scroll: after.runtime.scroll,
};
console.log(JSON.stringify(report, null, 2));
if (report.jsDelta > 8192 || report.cssDelta > 0) process.exit(1);
for (const sample of [report.idle, report.pointer, report.scroll]) {
  if (sample.p95Ms > 19.53 || sample.framesOver32Ms !== 0 || sample.longTasks !== 0) process.exit(1);
}
if (report.scroll.webglDraws !== 0) process.exit(1);
if (report.ambientLayers !== 0 || report.ambientLights !== 0) process.exit(1);
if (report.vaporField !== "raymarch-3d" || report.materials !== 1 || report.drawCalls !== 1 || report.textures !== 0 || report.renderTargets !== 0) process.exit(1);
' "$lili_vapor_baseline_dir/benchmark-before.json" "$lili_vapor_qa_dir/benchmark-after.json"
```

Expected: exit 0.

- [ ] **Step 6: Optimizar en orden si algún gate falla**

Apply only the smallest required change, rerunning focal tests and benchmark after each one:

1. Remove redundant algebra/noise calls or precompute repeated values in GLSL.
2. Reduce the second 3D octave contribution/math, preserving two distinct 3D frequencies.
3. Lower vapor alpha/absorption if fill-rate blending or readability is the issue.
4. Verify the duplicated render call is absent and scroll pause remains effective.
5. Keep smooth at 8 samples unless performance still fails after mathematical optimization; never go below 6 smooth samples without new owner approval.

Do not solve a failure with another canvas, reduced pixel ratio below the approved policy, texture lookup, render target, hidden DOM light, or relaxed threshold.

---

### Task 7: Ejecutar gate final en producción local y entregar evidencia exacta

**Files:**
- Verify: all changed files
- Verify: `data/reservations.json`
- Evidence only: isolated production logs/screenshots outside the repository

**Interfaces:**
- Production-local Next.js build at `127.0.0.1:3012`.
- No managed/deployed state is implied by local evidence.

- [ ] **Step 1: Ejecutar el gate estático final desde el checkout actual**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
shasum -a 256 data/reservations.json
rg -n "AmbientLightLayer|ambient-light|Math\.random|setTimeout|setInterval|sampler2D|sampler3D|WebGLRenderTarget|Data3DTexture" \
  src/components/effects src/lib src/app/globals.css
```

Expected:

```text
lint/typecheck/test/build/diff-check exit 0; npm test 28/28; reservations hash unchanged; rg has no matches attributable to the removed visual subsystem or forbidden vapor resources.
```

If unrelated pre-existing uses of a generic timer exist under `src/lib`, classify those exact hits and narrow the check to `src/components/effects`, `src/lib/volumetric-vapor.ts` and `src/app/globals.css` instead of deleting unrelated code. The test file intentionally names forbidden constructs as negative assertions and therefore is not a valid zero-match target.

- [ ] **Step 2: Iniciar una producción local aislada sin tocar el dev server existente**

Run:

```bash
lili_vapor_prod_dir=$(mktemp -d /tmp/lili-vapor-production.XXXXXX)
PORT=3012 npm run start >"$lili_vapor_prod_dir/next.log" 2>&1 &
lili_vapor_prod_pid=$!
for lili_vapor_attempt in {1..60}; do
  curl -fsS http://127.0.0.1:3012/ >/dev/null && break
  sleep 1
done
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3012/
```

Expected: HTTP 200. The original dev server on port 3000 remains running.

- [ ] **Step 3: Ejecutar QA renderizado completo contra producción local**

Run:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9338 \
  --user-data-dir="$lili_vapor_prod_dir/chrome" \
  --disable-gpu-sandbox \
  about:blank >"$lili_vapor_prod_dir/chrome.log" 2>&1 &
lili_vapor_prod_chrome_pid=$!
QA_CDP_HTTP_URL=http://127.0.0.1:9338 \
QA_BASE_URL=http://127.0.0.1:3012/ \
node scripts/qa-header-glass.mjs
QA_CDP_HTTP_URL=http://127.0.0.1:9338 \
QA_BASE_URL=http://127.0.0.1:3012/ \
node --test scripts/qa-visual-runtime-rendered.mjs
QA_CDP_HTTP_URL=http://127.0.0.1:9338 \
QA_BASE_URL=http://127.0.0.1:3012/ \
QA_SCREENSHOT_DIR="$lili_vapor_prod_dir/screenshots" \
node scripts/qa-responsive-visual.mjs
kill "$lili_vapor_prod_chrome_pid"
kill "$lili_vapor_prod_pid"
```

Expected:

```text
Header 4/4; rendered runtime all pass; responsive desktop/touch/reduced/forced matrix exits 0; production processes are stopped by exact PID.
```

- [ ] **Step 4: Inspeccionar las capturas finales de producción local**

Use the image viewer for:

```text
$lili_vapor_prod_dir/screenshots/desktop-1440-viewport.png
$lili_vapor_prod_dir/screenshots/desktop-1440-map.png
$lili_vapor_prod_dir/screenshots/desktop-1440-questions.png
$lili_vapor_prod_dir/screenshots/mobile-390-viewport.png
$lili_vapor_prod_dir/screenshots/reduced-motion-1440-viewport.png
```

Record a visual PASS only if the same acceptance criteria from Task 6 hold in the production build.

- [ ] **Step 5: Reconciliar alcance e integridad antes del handoff**

Run:

```bash
git status --short
git diff --stat
git diff --check
shasum -a 256 data/reservations.json
rg -n "wa\.me|api\.whatsapp\.com" src | wc -l
rg -ni "booking|reservar turno|agenda disponible" src || true
```

Expected:

```text
No hay cambios fuera del alcance atribuibles a esta pasada; reservations conserva 1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad; permanecen 16 enlaces WhatsApp contextuales y no aparece booking público.
```

- [ ] **Step 6: Entregar resultado con límites de evidencia correctos**

The final handoff must state:

```text
- archivos creados/modificados/eliminados;
- luces aleatorias eliminadas y vapor volumétrico integrado en un shader/pase;
- valores/tier de 8/6/4 y comportamiento static/fallback;
- resultados exactos de lint, typecheck, test count, build, header, runtime, responsive y benchmark;
- bytes JS/CSS before/after, p95, frames >32 ms, long tasks and scroll draws;
- capturas inspeccionadas y observación visual concreta;
- hash de reservations, cantidad WhatsApp y booking ausente;
- Browser integrado disponible o error exacto y fallback CDP utilizado;
- no commit, push, deploy ni mutación remota;
- evidencia válida solo para local dev/production local, no para producción desplegada.
```
