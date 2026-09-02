# Lili Reflexologia Incremental Visual Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This execution is inline: the approved master pass prohibits commit, push, deploy, remote mutation, destructive checkout operations, and changes outside the existing dirty checkout.

**Goal:** Refine the approved Lili Reflexologia landing so its existing technology reads as one calmer, deeper editorial scene while preserving copy, conversion, architecture, accessibility, responsive containment, and runtime cost.

**Architecture:** Keep the existing single Next.js landing, one shared `VisualStage`, one Three.js renderer/context/RAF owner, three ambient lights, and three `ReflexField` instances. Express the refinement primarily in shared CSS tokens and existing section classes; make the one behavioral correction in `AmbientLightLayer` so touch devices keep ambient light static without adding a scheduler or listener.

**Tech Stack:** Next.js 16.3.2, React 19.2.8, TypeScript 5, Tailwind CSS 4, CSS, Three.js 0.185.1, Node test runner, Chrome 151 CDP QA.

**Spec:** `../Lili_Reflexologia_Prompts/PASADA_MAESTRA_REFINAMIENTO_VISUAL_INCREMENTAL_LILI_REFLEXOLOGIA.md`

## Global Constraints

- Preserve the exact visible narrative, section order, SEO, contextual WhatsApp messages, and wellness disclaimer.
- Keep one canvas, one WebGL context, one `THREE.WebGLRenderer`, one RAF owner, one global scroll listener, zero visual pointer listeners, three ambient lights, and three `ReflexField` instances.
- Add no flowers, botanical ornaments, particles, video, new renderer, new visual runtime, new animation library, or per-section shader.
- Keep touch and reduced-motion background behavior static; keep the tab-hidden and sustained-scroll pauses.
- Do not modify, expose, migrate, or delete `data/reservations.json`; verify its SHA-256 before and after.
- Do not commit, push, deploy, publish, mutate remote systems, or claim production/publication readiness.
- Reuse the existing accepted lotus and pearlescent-foot assets; generate no replacement concept or asset.
- Keep rendered blur elements at or below the recorded baseline: desktop 7 and touch 8.

---

### Task 1: Rendered contracts for material hierarchy, editorial rhythm, and touch stillness

**Files:**
- Modify: `scripts/qa-responsive-visual.mjs`
- Test: `scripts/qa-responsive-visual.mjs`

**Interfaces:**
- Consumes: existing CDP `observe()` snapshot and the five approved viewports.
- Produces: observations for glass radii, lotus opacity, technique widths, proposal offsets, ambient-light motion state, and ambient/background animation count.

- [ ] **Step 1: Extend the rendered observation with independently computed geometry and motion state**

Add values derived from `getComputedStyle()` and `getBoundingClientRect()`:

```js
const rects = (selector) => [...document.querySelectorAll(selector)].map((node) => {
  const rect = node.getBoundingClientRect();
  return { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width) };
});

glassRadii: {
  a: parseFloat(css('.glass-a')?.borderRadius ?? '0'),
  b: parseFloat(css('.glass-b')?.borderRadius ?? '0'),
  c: parseFloat(css('.glass-c')?.borderRadius ?? '0'),
},
lotusOpacity: parseFloat(css('.visual-webgl-stage', '::before')?.opacity ?? '1'),
techniqueRects: rects('.technique-card'),
proposalRects: rects('.proposal-card'),
ambientLightMotion: document.querySelector('.ambient-light-layer')?.dataset.lightMotion ?? null,
ambientBackgroundAnimations: [...document.getAnimations()].filter((animation) => {
  const target = animation.effect?.target;
  return target?.matches?.('.visual-global-atmosphere, .hero-identity, .ambient-light');
}).length,
```

- [ ] **Step 2: Add assertions for observable behavior**

For desktop 1440 require `Glass A > Glass B > Glass C`, lotus opacity no greater than `0.66`, a narrower even technique card, and proposal cards 2/4 vertically offset by at least 12 px from 1/3. For touch viewports require `ambientLightMotion === "static"`, zero ambient/background animations, and no proposal stagger. Keep the existing blur, containment, architecture, interaction, console, and network assertions unchanged.

- [ ] **Step 3: Run the rendered matrix and verify RED**

Run:

```bash
QA_CDP_HTTP_URL=http://127.0.0.1:9341 \
QA_BASE_URL=http://127.0.0.1:4341/ \
QA_SCREENSHOT_DIR=/tmp/lili-reflex-visual-refinement-20260831.kbokKr/red \
node scripts/qa-responsive-visual.mjs
```

Expected: FAIL on at least the desktop material/lotus/proposal assertions and the touch ambient-motion assertion while pre-existing structure, overflow, copy, controls, console, and network checks remain valid.

---

### Task 2: Static ambient light policy on touch

**Files:**
- Modify: `src/components/effects/AmbientLightLayer.tsx`
- Modify: `src/app/globals.css`
- Test: `scripts/qa-responsive-visual.mjs`

**Interfaces:**
- Consumes: `matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse), (hover: none)')`.
- Produces: `data-light-motion="static"` with no light scheduler on reduced-motion or touch/coarse devices; desktop remains `data-light-motion="ambient"` with the existing single timing chain.

- [ ] **Step 1: Make the existing ambient scheduler default-deny for motion-limited devices**

Replace the reduced-motion-only gate in `AmbientLightLayer` with a combined static-motion query. Return before timer creation when it matches; do not add another timer, effect, listener, or state update.

- [ ] **Step 2: Freeze CSS-only background drift on touch**

Add a coarse/touch media rule that removes animation and transition from `.visual-global-atmosphere`, `.hero-identity`, and `.ambient-light`, without hiding them or changing their static composition.

- [ ] **Step 3: Rebuild the isolated production server and verify the touch slice GREEN**

Run the production build, restart only the temporary port `4341` server, and rerun the responsive matrix. Expected: touch static-motion assertions pass; desktop autonomous light interaction still passes.

---

### Task 3: Shared atmosphere, material hierarchy, and typography rhythm

**Files:**
- Modify: `src/app/globals.css`
- Test: `scripts/qa-responsive-visual.mjs`

**Interfaces:**
- Consumes: existing tokens, `glass-a/b/c` classes, section class names, lotus pseudo-element, and unchanged markup.
- Produces: three visibly distinct material tiers, lower lotus competition, section-to-section tonal continuity, and stable reading measures.

- [ ] **Step 1: Consolidate material and continuity tokens**

Add shared tokens for the three material fills/borders, a quieter shadow, and section tint strength. Keep the required gutter/spacing/measure tokens intact.

- [ ] **Step 2: Refine the fixed lotus integration**

Reduce the lotus pseudo-element opacity to `0.64`, soften local contrast/saturation, and strengthen edge/tint fusion in the existing stage overlay. Do not duplicate, animate, replace, or destructively edit the asset.

- [ ] **Step 3: Differentiate Glass A, B, and C**

Keep Glass A at the large editorial radius and deepest protective fill; set Glass B to the medium radius with a quieter shadow and more solid tint; set Glass C to the control radius with no backdrop blur and near-solid contrast. Keep the existing four CSS backdrop-filter declarations and rendered blur ceiling.

- [ ] **Step 4: Add lightweight section continuity tints**

Use existing section pseudo-elements and class groupings for vertical transparent-to-violet/night gradients. The pseudo-elements must be `pointer-events: none`, add no DOM nodes or filters, and keep content above them.

- [ ] **Step 5: Rebalance editorial type and measures**

Preserve both font families and visible copy. Tighten H2 maximum scale/leading where needed, keep balanced headings and pretty paragraphs, and maintain body measures inside the approved character ranges.

---

### Task 4: Scene hierarchy and less repetitive editorial compositions

**Files:**
- Modify: `src/app/globals.css`
- Test: `scripts/qa-responsive-visual.mjs`

**Interfaces:**
- Consumes: existing hero, techniques, map, reading, benefits, experience, proposals, FAQ, CTA, and footer classes.
- Produces: stronger focal hierarchy without JSX/copy/architecture changes.

- [ ] **Step 1: Refine primary scenes**

Tune hero copy/art balance, reading art-to-copy separation, final CTA containment, and footer transition using existing assets and containers. Keep mobile CTA before hero art and labels outside the foot image.

- [ ] **Step 2: Refine techniques and benefits**

Keep the existing technique staircase, but differentiate widths/padding/borders more clearly. Preserve the open benefits list while increasing number/title hierarchy and protecting the identity caption.

- [ ] **Step 3: Refine map, experience, and FAQ controls**

Increase selected/focus clarity with border/fill/stroke changes only; preserve keyboard/tap semantics and do not add loops, SVG filters, or frame-driven state.

- [ ] **Step 4: Break the generic proposal grid rhythm**

At desktop, offset cards 2 and 4 by a fluid 16-28 px and vary internal alignment/border emphasis through `nth-child`; reset all offsets at `max-width: 900px` so tablet/mobile remain a clean single column.

- [ ] **Step 5: Run responsive QA and inspect section captures**

Run the complete matrix against the rebuilt production server. Inspect desktop hero/techniques/map/reading/benefits/experience/proposals/FAQ/CTA plus mobile 390/320 and correct any clipping, washed text, or competing focal point before continuing.

---

### Task 5: Performance cleanup, full closure, and evidence comparison

**Files:**
- Modify only if evidence demands it: `src/app/globals.css`, `src/components/effects/AmbientLightLayer.tsx`, `scripts/qa-responsive-visual.mjs`
- Create outside repo: `/tmp/lili-reflex-visual-refinement-20260831.kbokKr/after-*`

**Interfaces:**
- Consumes: baseline JSON, screenshots, build resources, Git state, and reservation hash.
- Produces: final local evidence and a truthful PASS/FAIL gate ledger.

- [ ] **Step 1: Run focused rendered/runtime checks**

```bash
QA_CDP_HTTP_URL=http://127.0.0.1:9341 QA_BASE_URL=http://127.0.0.1:4341/ node --test scripts/qa-visual-runtime-rendered.mjs
QA_CDP_HTTP_URL=http://127.0.0.1:9341 QA_BASE_URL=http://127.0.0.1:4341/ node --test scripts/qa-header-glass.mjs
```

- [ ] **Step 2: Run the complete quality gate**

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

- [ ] **Step 3: Recreate the isolated production server after the final build**

Start `next start` on a verified-free local port, preserve the pre-existing dev server on `127.0.0.1:3000`, and point Chrome CDP QA only at the temporary production server.

- [ ] **Step 4: Capture after screenshots and metrics**

Run `qa-responsive-visual.mjs` and `benchmark-visual-runtime.mjs` into the existing `/tmp/lili-reflex-visual-refinement-20260831.kbokKr/after` evidence tree. Record route JS/CSS, critical asset sizes, DOM/SVG/blur counts, console/network results, and production resource timing.

- [ ] **Step 5: Compare before/after and apply the rollback rule**

Require no more than 5% p95 regression in the same environment, zero new long tasks, no new overflow/containment/accessibility/interaction failure, no architecture-count change, no copy-body hash change, and unchanged reservation hash. If a specific visual decision causes a regression, remove only that decision and rerun the affected matrix.

- [ ] **Step 6: Inspect accepted baseline and latest render with `view_image`**

Compare at least hero, techniques, map, reading, proposals, FAQ, mobile 390, and mobile 320; write the fidelity ledger and keep correcting while a material mismatch or fixable visual issue remains.

- [ ] **Step 7: Stop only temporary processes and report external gates separately**

Stop the Chrome/profile and production server created by this execution, preserve PID/process state for the existing dev server, verify reservations again, and report visual-owner approval/publication/deploy/physical-device gates as pending rather than production-ready.
