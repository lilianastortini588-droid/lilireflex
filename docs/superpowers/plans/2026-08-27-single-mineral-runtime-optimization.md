# Single Mineral Runtime Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This shared dirty checkout must be executed inline without subagents, worktree migration, commit, reset, clean, or destructive checkout.

**Goal:** Reduce the current visual runtime to one global Mineral canvas, one visual input owner, and one RAF, then conditionally evolve that same shader toward a mineral-water field after measurement.

**Architecture:** `VisualStage` connects a singleton visual runtime; scroll-derived UI subscribes to its snapshot, and `MineralSurface` consumes its frames. Repeated ambient SVG fields and local React morph/pointer loops are removed while the three compositional fields remain.

**Tech Stack:** Next.js 16.3.2 App Router, React 19.2.8, TypeScript 5, Tailwind CSS 4, Node test runner, raw SVG, raw WebGL, isolated Chrome DevTools.

**Spec:** `docs/superpowers/specs/2026-08-27-single-mineral-runtime-optimization-design.md`

## Global Constraints

- Preserve the only existing global `MineralSurface` canvas and WebGL context.
- Do not add `WaterRenderer`, a renderer registry, framebuffer simulation, or a second canvas.
- Preserve booking, data, readiness, palette, logo, typography, layout, and local reservations.
- Use TDD for runtime and component behavior changes.
- Do not commit, push, deploy, reset, clean, or remove unrelated user work.
- Do not declare `PRODUCT PASS`.

---

### Task 1: Baseline evidence

**Files:**
- Create outside repository: isolated Chrome profile and temporary DevTools probe.
- Read: `src/components/effects/VisualStage.tsx`
- Read: `src/components/effects/MineralSurface.tsx`
- Read: `src/components/brand/ReflexField.tsx`
- Read: `src/app/globals.css`

**Interfaces:**
- Consumes: the running site at `http://127.0.0.1:3000/`.
- Produces: baseline DOM counts, event/RAF observations, frame timings, screenshots, console/network health, and reservation hash.

- [ ] Capture the reservation file hash, ignored status, root shape, and record count without printing personal data.
- [ ] Start isolated headless Chrome with a fresh explicit temporary profile and DevTools port.
- [ ] Instrument `EventTarget.addEventListener` and `requestAnimationFrame` before page code loads, then navigate to the local page.
- [ ] Record canvas, Reflex Field, SVG filter/grain, atmosphere, listener, RAF, DOM-node, overflow, and header-glass observations.
- [ ] Run the fixed idle/pointer/scroll trace and retain metrics and screenshots outside the repository.

### Task 2: Shared visual runtime

**Files:**
- Create: `src/lib/visual-runtime.ts`
- Modify: `src/lib/visual-system.ts`
- Modify: `src/components/effects/VisualStage.tsx`
- Modify: `src/components/effects/MineralSurface.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/StickyCta.tsx`
- Modify: `src/components/layout/WhatsAppFloat.tsx`
- Modify: `src/app/page.tsx`
- Test: `scripts/qa-visual-system.mjs`

**Interfaces:**
- Produces: `visualRuntime.connect()`, `visualRuntime.subscribeFrame()`, `visualRuntime.subscribeScroll()`, `visualRuntime.getScrollSnapshot()`, `visualRuntime.setContinuous()`, `visualRuntime.setPointerTracking()`, and `visualRuntime.invalidate()`.
- Consumes: existing `resolveWebGLPolicy`, adaptive FPS controller, active-surface picker, and visual surface definitions.

- [ ] Add a failing runtime test in `scripts/qa-visual-system.mjs` proving multiple subscribers share one RAF and scroll/pointer updates coalesce into it.
- [ ] Run `node --test scripts/qa-visual-system.mjs` and confirm the new assertion fails because the runtime contract is absent.
- [ ] Implement the injected, testable runtime factory in `src/lib/visual-system.ts` and the browser singleton in `src/lib/visual-runtime.ts`.
- [ ] Run the focal test and confirm it passes.
- [ ] Add a failing integration assertion that `VisualStage` owns visual inputs while `MineralSurface` no longer registers window scroll/pointer or a sampling RAF.
- [ ] Refactor `VisualStage` and `MineralSurface` so active-surface selection, ambient CSS writes, adaptive sampling, cadence gating, scroll pause, pointer input, visibility, and resize use the shared runtime.
- [ ] Replace Header, Sticky CTA, and WhatsApp independent scroll subscriptions with the shared scroll snapshot. Remove `AmbientScroll` from the page.
- [ ] Run the focal tests, lint, and TypeScript.

### Task 3: Static compositional Reflex Fields

**Files:**
- Modify: `src/components/brand/ReflexField.tsx`
- Modify: `src/components/effects/VisualAtmosphere.tsx`
- Modify: `src/components/sections/Hero.tsx`
- Modify: `src/components/sections/Benefits.tsx`
- Modify: `src/components/sections/AboutReflexology.tsx`
- Modify: `src/components/sections/FinalCta.tsx`
- Modify: `src/components/sections/Availability.tsx`
- Modify: `src/components/sections/Promotions.tsx`
- Test: `scripts/qa-visual-system.mjs`

**Interfaces:**
- Produces: a pure, direct-geometry `ReflexField` with `className`, `focus`, `intensity`, and `topology` props.
- Consumes: `buildTopology()` and `buildFieldGeometry()`.

- [ ] Add a failing rendered/structural contract that the default page has three compositional fields, no atmosphere field, and no field-owned RAF or pointer handler.
- [ ] Run the focal test and verify the current implementation fails with repeated atmospheric and decorative fields.
- [ ] Remove graph interpolation state, reduced/visibility/pointer state, field RAFs, and unused field props; render target geometry directly.
- [ ] Remove the `ReflexField` child from `VisualAtmosphere`, its topology map, and the unused promotions `sessions` prop.
- [ ] Remove the decorative fields from Final CTA and the confirmation ticket while retaining hero, reflexology, and benefits fields.
- [ ] Make CursorLight and MagneticWrap passive structural enhancement wrappers so the global Mineral shader is the only decorative pointer responder.
- [ ] Run the focal tests, lint, and TypeScript.

### Task 4: Grain and filter reduction

**Files:**
- Modify: `src/components/brand/ReflexField.tsx`
- Modify: `src/app/globals.css`
- Test: `scripts/qa-visual-system.mjs`

**Interfaces:**
- Produces: gradient/layer-based softness without SVG Gaussian blur or turbulence grain.
- Consumes: existing palette variables, field gradients, and layered strokes.

- [ ] Add a failing contract that rendered fields contain no `feGaussianBlur` or grain pattern and the page has no fixed turbulence grain.
- [ ] Run the focal test and verify it fails on the current filters and patterns.
- [ ] Remove the fixed body turbulence layer, SVG grain definition/rect, and `blur`/`soft` filters.
- [ ] Replace filtered strokes and halos with unfiltered gradients and layered opacity while retaining silhouettes and contrast.
- [ ] Remove obsolete `.visual-atmosphere__field` CSS and simplify the remaining CSS/lattice backgrounds without adding animation.
- [ ] Run focal tests, lint, and TypeScript.

### Task 5: Optimized Mineral measurement gate

**Files:**
- Read only: optimized source and local rendered page.
- Write outside repository: DevTools evidence and screenshots.

**Interfaces:**
- Consumes: the exact same DevTools probe and viewport matrix as Task 1.
- Produces: before/after metric table and a decision `WATER_SHADER_ELIGIBLE` or `WATER_SHADER_BLOCKED`.

- [ ] Run the same isolated Chrome trace against optimized Mineral.
- [ ] Compare canvas, context, listeners, RAF, fields, filters, DOM, frame p95, long frames, console, network, overflow, header, and screenshots.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, and a production build from a safe temporary copy so the user's dev server remains untouched.
- [ ] Mark the aquatic shader gate eligible only if all structural and regression checks pass.

### Task 6: Conditional same-shader mineral-water evolution

**Files:**
- Modify only if eligible: `src/components/effects/MineralSurface.tsx`
- Test: rendered DevTools comparison from Tasks 1 and 5.

**Interfaces:**
- Consumes: existing fragment shader uniforms, noise samples, palette, runtime, canvas, and context.
- Produces: one mineral-water fragment shader in the same `MineralSurface`.

- [ ] If blocked, leave the optimized Mineral shader unchanged and record the blocking metric.
- [ ] If eligible, capture the optimized Mineral screenshot/trace as the immediate control.
- [ ] Modify only the existing fragment shader to introduce directional flow and soft caustic modulation by recombining existing samples; add no program, buffer, texture, context, listener, RAF, or renderer.
- [ ] Run the identical trace and screenshots.
- [ ] Keep the mineral-water shader only if all numeric thresholds and visual-protection checks pass; otherwise restore the optimized Mineral shader with a scoped patch.

### Task 7: Final verification and handoff

**Files:**
- Modify: `docs/audits/2026-08-26-master-orchestrator-audit.md` only if recording the new local pass is useful and does not overwrite prior evidence.

**Interfaces:**
- Consumes: complete source diff, fresh global gates, browser evidence, and reservation integrity evidence.
- Produces: final before/after report with explicit local versus external readiness labels.

- [ ] Review the diff and confirm no booking, persistence, URL, commercial-data, palette, typography, or logo changes.
- [ ] Run fresh lint, TypeScript, full tests, safe production build, header-glass QA, responsive QA, reduced-motion QA, and console/network checks.
- [ ] Recalculate reservation hash, ignored status, root shape, and record count without exposing personal data.
- [ ] Report every gate as PASS, FAIL, CONDITIONAL, or NOT_RUN and do not declare `PRODUCT PASS`.
