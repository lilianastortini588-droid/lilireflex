# Single Mineral Runtime Optimization — QA Evidence

Date: 2026-08-27  
Scope: local architecture, rendering, motion, responsive behavior, accessibility contracts, and booking-integrity regression checks.  
Status: `LOCAL_VISUAL_RUNTIME_PASS`; `PRODUCT_PASS` is not claimed.

## Result

The application keeps the existing `MineralSurface` as its only WebGL engine. There is one canvas, one WebGL context, one visual RAF owner, one global visual scroll listener, and one global decorative pointer listener. No `WaterRenderer`, renderer registry, texture feedback, framebuffer, per-section simulation, or per-card canvas was added.

The conditional mineral-water fragment-shader candidate was built and benchmarked against the optimized Mineral control. It was rejected and removed because the side-by-side static comparison did not demonstrate a clearly superior result and the scroll samples did not improve every stability measure. The final source contains only the optimized original Mineral shader.

## Structural comparison

The original timing probe captured stack traces on every RAF and materially disturbed rendering. Its absolute FPS values are invalid and are intentionally excluded. Its DOM/listener counts remain valid.

| Metric | Before | Final | Result |
| --- | ---: | ---: | --- |
| Global canvas | 1 | 1 | Preserved |
| WebGL context | 1 | 1 | Preserved |
| Continuous visual RAF owners | 2 plus event schedulers | 1 | Unified |
| Active custom window scroll listeners | 6 | 1 | Unified |
| Active custom window pointer listeners | 1 | 1 | Global only |
| DOM nodes | 2653 | 882 | -66.8% |
| `ReflexField` instances | 13 | 3 | Functional compositions only |
| Atmospheric `ReflexField` instances | 9 | 0 | Removed |
| SVG `feGaussianBlur` | 26 | 0 | Removed |
| SVG grain patterns | 13 | 0 | Removed |
| Body turbulence grain | 1 | 0 | Removed |
| Horizontal overflow at 1440 px | 0 | 0 | Preserved |

The three retained fields are the hero composition, the reflexology explanation, and the benefits selection. They render their target geometry directly and no longer own React morph state, pointer state, intersection state, or RAF loops.

## Runtime comparison

Environment: isolated headless Chrome 151, Apple M1 ANGLE Metal renderer, 1440 × 900, DPR 1, production builds, identical scripted idle/pointer/scroll sequence. The table compares the last architecture before threshold-only scroll consumers with the final optimized Mineral control. Browser scheduling still has run-to-run variance, so these are representative local measurements rather than field telemetry.

| Metric | Before final scroll pass | Final Mineral control |
| --- | ---: | ---: |
| Idle FPS | 60.00 | 60.00 |
| Idle p95 | 17.7 ms | 17.7 ms |
| Pointer FPS | 59.97 | 59.99 |
| Pointer p95 | 17.7 ms | 17.7 ms |
| Scripted-scroll FPS | 19.53 | 45.43 |
| Scripted-scroll p95 | 100.8 ms | 32.3 ms |
| Scroll frames over 32 ms | 61 | 8 |
| Scroll long tasks | 9 / 586 ms | 0 / 0 ms |
| WebGL draws during scroll | 1 | 1 |
| Main-thread task duration | 2935.00 ms | 252.05 ms |
| Script duration | 185.00 ms | 51.19 ms |
| Layout duration | 8.23 ms | 3.66 ms |
| Recalculate-style duration | 2172.50 ms | 26.91 ms |

The final runtime stops WebGL during sustained scroll (`data-visual-fps-tier="paused"`, target FPS `0`) and permits at most two entry/exit edge draws in the rendered contract. Active-surface geometry is measured once after scroll quiet instead of on every visual frame. Header, sticky CTA, and WhatsApp consumers react only when their boolean thresholds change. Native CSS scroll timelines own the progress indicator; the shared snapshot provides an imperative fallback only when unsupported.

## Header material

The header now keeps the same `paper 94%` material and `blur(18px) saturate(0.94)` at the top and while elevated. The single global scroll listener also publishes a synchronous protective root state before React receives its next snapshot. QA sampled positions 0, 1, 48, 240, 720, and 1400 px across synchronous, first-RAF, second-RAF, and settled moments; the material alpha remained `0.94` throughout.

## Conditional shader comparison

Four alternating production runs were collected for the Mineral control and the same-canvas mineral-water candidate. Both variants kept 60 FPS and approximately 17.7 ms p95 in idle/pointer, zero idle long tasks, one canvas/context, one RAF owner, and a paused shader during scroll. Median task/script durations did not regress, but median scroll frames over 32 ms were 10.5 for the control and 12.5 for the candidate. More importantly, the static side-by-side did not show a sufficiently clear visual improvement. The candidate therefore failed the complete acceptance rule and was removed.

Evidence files are local temporary artifacts:

- `/tmp/lili-mineral-baseline.V0FB3m/optimized-mineral-final-control.json`
- `/tmp/lili-mineral-baseline.V0FB3m/optimized-mineral-control-2.json`
- `/tmp/lili-mineral-baseline.V0FB3m/optimized-mineral-control-3.json`
- `/tmp/lili-mineral-baseline.V0FB3m/optimized-mineral-control-4.json`
- `/tmp/lili-mineral-baseline.V0FB3m/mineral-water-candidate.json`
- `/tmp/lili-mineral-baseline.V0FB3m/mineral-water-candidate-2.json`
- `/tmp/lili-mineral-baseline.V0FB3m/mineral-water-candidate-3.json`
- `/tmp/lili-mineral-baseline.V0FB3m/mineral-water-candidate-4.json`

## Responsive and accessibility evidence

| Viewport | WebGL policy | Header logo | Footer logo | Overflow |
| --- | --- | ---: | ---: | ---: |
| 360 × 800 | static | 72 px | 88 px | 0 |
| 390 × 844 | static | 72 px | 88 px | 0 |
| 768 × 1024 | static | 80 px | 100 px | 0 |
| 1024 × 768 | animated | 88 px | 112 px | 0 |
| 1440 × 900 | animated | 88 px | 112 px | 0 |

The rendered matrix also found one `h1`, one `main`, at least one `nav`, one `footer`, one skip link, zero duplicate IDs, and zero visible unnamed interactive elements. Reduced-motion at 1440 px produced a static WebGL frame, zero running animations, and zero horizontal overflow. The scroll-linked progress animation is explicitly disabled for reduced motion.

## Verification gates

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `node --test scripts/qa-visual-system.mjs`: PASS, 17/17.
- Isolated `npm run build`: PASS, Next.js 16.3.2, 11 routes generated/validated.
- `QA_SKIP_BUILD=1 npm test` against a local fixture: PASS, 29 passed, 0 failed, 6 scenario-specific skips.
- Directed local state fixtures: PASS — live without managed persistence 2/2, read failure/error 3/3, request 2/2, unavailable 2/2, and isolated live-ready 2/2.
- Rendered single-runtime QA: PASS.
- Header glass QA: PASS, 4/4.
- Responsive/reduced-motion/accessibility rendered QA: PASS.
- Browser console errors/warnings in final rendered matrix: 0.
- Failed route resources in final rendered matrix: 0.

## Integrity preservation

- `data/reservations.json` SHA-256 before and after: `1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad`.
- Reservation root remains `{ "reservations": [...] }` with two existing entries.
- `git check-ignore -v data/reservations.json` resolves to `.gitignore:24:/data/reservations.json`.
- Full booking QA used a generated local fixture; it did not mutate the real reservation file or contact managed Supabase.
- The development server was found stopped during the final preservation check and was restored with the same `next dev --hostname 127.0.0.1 --port 3000` command; final probe returned HTTP 200 on PID 87779.
- No reset, clean, checkout, commit, push, deployment, or managed-system mutation was performed.

## Product boundary

This evidence closes a local visual-runtime pass only. Managed Supabase RLS, production persistence, real commercial availability, production accessibility, deployed responsive behavior, and human stakeholder acceptance remain separate gates. Publication readiness therefore remains fail-closed and `PRODUCT_PASS` is not declared.
