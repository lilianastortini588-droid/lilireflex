# Single Mineral Runtime Optimization Design

## Status

Approved direction. This design replaces the previously proposed renderer registry. It does not authorize a second canvas, a `WaterRenderer`, parallel visual engines, deployment, commits, or changes to booking and persistence.

## Goal

Preserve the existing global `MineralSurface` WebGL canvas while reducing visual runtime duplication. After the optimized Mineral baseline is measured, the existing fragment shader may be evolved into a mineral-water treatment only when the same-canvas implementation passes the regression gates in this document.

## Invariants

- Exactly one global canvas and one WebGL context.
- No canvas, shader, simulation, filter loop, or RAF per section, card, header, CTA, agenda, or footer.
- One global passive scroll listener for visual and scroll-derived UI state.
- One global passive pointer listener for decorative pointer state.
- One shared animation-frame loop for the visual runtime. One-shot functional focus scheduling is outside this visual loop.
- Mobile, coarse pointer, reduced motion, save-data, low-memory, visibility, and context-loss policies remain fail-safe.
- The current palette, wordmarks, typography, layout depth, functional booking behavior, and integrity states remain unchanged.
- The local reservation file remains preserved and Git-ignored.

## Runtime architecture

`VisualStage` remains the one page-level owner. It connects a module-level visual runtime, renders the existing `MineralSurface`, derives the active visual surface, and publishes ambient CSS variables. The runtime owns the only global scroll and pointer listeners and the only visual RAF. `MineralSurface` subscribes to frames from that runtime and never creates its own RAF or window input listeners.

The runtime publishes a scroll snapshot through `useSyncExternalStore`. Header, sticky CTA, WhatsApp expansion, and other scroll-derived React consumers subscribe to that snapshot instead of attaching their own scroll listeners or frame schedulers. Functional section tracking may continue using `IntersectionObserver`.

The existing adaptive FPS controller remains. Its samples are taken from the shared runtime frame instead of a second sampling RAF. A cadence gate decides whether a delivered frame draws WebGL. Scroll pauses drawing and continuous frames; the quiet timer resumes the same loop without catching up missed time.

## Pointer policy

The only decorative pointer response will be the global Mineral shader. `CursorLight`, `MagneticWrap`, and `ReflexField` will not attach pointer handlers or start pointer RAFs. Their structural wrappers may remain where removing them would create unnecessary markup churn, but their local pointer simulation is removed. Functional pointer and click handlers remain untouched.

## Reflex Field policy

Keep only fields whose changing geometry has a specific compositional function:

- Hero primary field.
- Reflexology explanation field.
- Benefits selection field.

Remove repeated atmosphere fields and the purely decorative CTA and confirmation-ticket fields. The retained fields render their target graph directly. React state, 520 ms graph interpolation, pointer state, intersection state, and per-field RAFs are removed. Benefit/reflexology changes remain visible immediately and can rely on lightweight opacity transitions in their surrounding content.

## Grain and SVG filters

Remove the fixed `body::before` turbulence grain, per-field SVG grain patterns, and SVG Gaussian blur filters. Preserve visual softness with existing radial/linear gradients, translucent layered strokes, and the single global Mineral field. CSS backdrop blur remains only where it protects legibility or interaction, particularly the header and mobile navigation; it is not removed merely to satisfy a numeric quota.

## Conditional mineral-water evolution

The aquatic evolution is a modification of the current `FRAGMENT_SHADER` only. It may reuse the existing noise, phase, strata, pointer, palette, uniforms, buffer, context, runtime, FPS policy, and fallback. It must not add a renderer abstraction, framebuffer feedback, textures, per-surface uniforms, or another loop.

The candidate may add low-cost directional flow and soft caustic modulation by recombining existing samples. It is accepted only if visual comparison shows clearer shared continuity and the normalized performance does not regress beyond the thresholds below.

## Measurement gates

The before/after harness uses isolated Chrome DevTools with a fresh temporary profile because the integrated Browser is unavailable. Each comparison uses the same server, viewport, DPR, route, scripted idle, pointer, and scroll sequence.

Required structural assertions:

- One canvas and one WebGL context.
- One visual RAF owner.
- One global visual scroll listener and one global decorative pointer listener.
- Three retained `ReflexField` instances in the default page state.
- Zero SVG `feGaussianBlur`, SVG grain patterns, or body turbulence grain.
- Zero ambient `ReflexField` instances.

Required runtime assertions:

- No application console errors or failed route resources.
- WebGL draws pause during scroll and resume after quiet.
- Static policies do not leave a continuous RAF.
- Header material never dips through a transparent intermediate state.
- No horizontal overflow at 360, 390, 768, 1024, or 1440 px.

Water-candidate acceptance:

- Same canvas/context/listener/RAF counts as optimized Mineral.
- Desktop idle and scripted-scroll p95 frame interval no worse than optimized Mineral by more than 5%.
- Frames over 32 ms and long tasks do not increase.
- Script duration and main-thread work do not regress by more than 5%.
- Screenshots preserve typography, logo, booking controls, dates, times, contrast, and layout.
- Human visual inspection finds the mineral-water continuity superior. If not, the optimized Mineral shader remains.

## Product boundary

This work can close a local visual-runtime gate only. It does not prove managed RLS, production persistence, real commercial data, deployed accessibility, field performance, or `PRODUCT PASS`.
