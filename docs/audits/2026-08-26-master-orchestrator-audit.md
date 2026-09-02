# Lili Reflexologia - Master Orchestrator Audit

Date: 2026-08-26  
Workspace: `/Users/agustincastillo/Desktop/LILI REFLEX/web`  
Branch: `main`  
Baseline commit: `3e83657 Initial commit from Create Next App`

## Safety baseline

- The worktree was already extensively modified and untracked before this audit.
- No reset, checkout, clean, rebase, or destructive command was used.
- The local reservation file existed with two records before implementation.
- Personal field values were not copied into this report or command output.
- Baseline reservation SHA-256: `1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad`.
- The initial commit contains only the Create Next App skeleton; almost all product code belongs to the pre-existing dirty worktree and must be preserved.

## Architecture inventory

| Area | Current evidence | Audit state |
| --- | --- | --- |
| Framework | Next.js 16.3.2 App Router, React 19.2.8 | Implemented |
| Styling | Tailwind CSS 4 plus centralized CSS tokens | Implemented |
| Business config | `src/lib/config.ts` plus environment gates | Locally hardened; real commercial data remains external |
| Availability | Typed `AvailabilitySnapshot` and five explicit modes | Implemented fail-closed locally |
| Persistence | JSON and Supabase REST adapters | Local contract implemented; managed Supabase `NOT_VERIFIED` |
| Booking | Server Action, readiness derivation, POST route | Server-enforced; only ready `live` may mutate |
| Calendar | Opaque capability route and persisted lookup | Privacy-safe locally; disabled while duration is unknown |
| WhatsApp | Central contextual generator | Implemented locally; disabled without real number |
| Visual system | Tokens, surfaces, Reflex Field, motion, shared full-page WebGL | Implemented; local rendered QA completed |
| PWA | Manifest, icons, theme color | Partial; no service worker or offline claim |
| SEO | Metadata, canonical, OG image, conditional robots/sitemap | Draft-safe locally; public URL/deploy still external |
| Tests | Isolated production HTTP harness and browser QA | 19 default tests plus adversarial scenarios |
| Deployment | No Vercel project evidence in the checkout | External verification required |

## Master phases - initial classification

| Phase | Initial state | Evidence and gap |
| --- | --- | --- |
| 0 Baseline | Implemented | Git state, source, scripts, lint, typecheck, tests, and build inspected |
| 1 Product foundation | Partial | Main flow exists; integrity, privacy, modes, and readiness incomplete |
| 2 Design foundation | Implemented | Palette, type, spacing, radii, shadows, surfaces, primitives exist |
| 3 Brand and art direction | Implemented | Wordmark, mineral material, Reflex Field, light/dark rhythm exist |
| 4 Hero | Partial | Strong composition; exposes template slots as live-looking actions |
| 5 Content experience | Implemented | About and benefits are interactive and prudently worded |
| 6 Promotion experience | Partial | Selector and calculations exist; recommendation is not commercially verified |
| 7 Availability experience | Partial | Rail, density, states, and transitions exist; no top-level fail-closed modes |
| 8 Booking experience | Partial | Form and Lili Pass exist; confirmation and calendar authority are unsafe |
| 9 Motion and microinteractions | Implemented | Tokens, reveal, morph, magnetic, pointer, shared transitions exist |
| 10 Responsive | Partial | Mobile-specific components exist; fixed-surface overlap needs rendered QA |
| 11 Accessibility | Partial | Semantic controls and reduced motion exist; full flow and associations need QA |
| 12 Performance | Partial | Selective raw WebGL and pauses exist; context loss and measured evidence missing |
| 13 Premium QA | Missing | No retained screenshot, console, accessibility, or performance ledger |

## Confirmed integrity findings

1. `hoursAreTemplate: true` coexists with selectable slots and booking copy.
2. Supabase non-2xx reads return `[]`.
3. Client availability non-2xx reads return `[]`.
4. JSON read or parse errors initialize an empty store.
5. `data/reservations.json` was not ignored at baseline.
6. Calendar query parameters include reservation id, name, date, time, and promotion.
7. Calendar generation defaults an unknown duration to 60 minutes.
8. The SQL migration enables RLS and defines no public policies, but remote application is not verified.
9. The service-role key remains server-only in source.
10. The baseline tests do not cover template denial, read failure, privacy, readiness, RLS, concurrency, UI states, or visual behavior.

## Baseline validation before remediation

```text
lint: PASS
typecheck: PASS
tests: PASS (2 tests; insufficient coverage)
build: PASS
visual QA: NOT_RUN
managed Supabase: NOT_VERIFIED
production deployment: NOT_VERIFIED
```

## External data blockers

- Real WhatsApp number.
- Real location if it is to be published.
- Real session duration.
- Real prices, discounts, and confirmation of any recommended pack.
- Real weekly hours or a confirmed request-only operating model.
- Supabase credentials and proof that the migration is applied in the intended project.
- Public site URL and deployed environment evidence.
- Human commercial and visual approval.

These blockers do not prevent local fail-closed implementation. They do prevent `PRODUCT PASS`, live booking readiness, calendar readiness, and production claims.

## Iteration ledger

| Task | State | Validation |
| --- | --- | --- |
| 1 Baseline, privacy, QA harness | Completed | Git ignore contract, isolated temp store, original reservation hash preserved |
| 2 Typed modes and fail-closed reads | Completed | Explicit snapshots; JSON/Supabase/client failures produce `error` |
| 3 Server integrity and readiness | Completed locally | Template denial, not-ready and read-failure scenarios PASS; remote Supabase `NOT_RUN` |
| 4 Privacy-safe calendar | Completed locally | Token-only URL, unknown-token 404, no default duration, minimal confirmation |
| 5 State-aware UI | Completed locally | Rendered contracts for all five modes; only ready `live` exposes booking controls |
| 6 Reflex Field and WebGL hardening | Completed locally | Static/frozen state tones, context loss, visibility pause, fallback marker, section bridges |
| 7 Responsive and accessibility | Completed locally | 320-1440 matrix, no horizontal overflow, keyboard tabs/menu, reduced motion, semantic tests |
| 8 Performance and final QA | Partial / external gates remain | Production-local browser QA complete; deployed Lighthouse, managed data and human approval pending |

## Remediation outcome

| Initial finding | Current outcome |
| --- | --- |
| Template slots were selectable and reservable | Fixed: disabled snapshot plus server code `template_only`; mutation test proves no write |
| Supabase and client read errors became `[]` | Fixed: typed failures enter `error` and return HTTP 503 where appropriate |
| Invalid JSON store could become empty | Fixed: invalid/read failures block reads and writes |
| Local reservation data was not ignored | Fixed: explicit Git ignore rule and automated `check-ignore` test |
| Calendar carried personal data in its URL | Fixed: only an opaque token is accepted; extra query fields are rejected |
| Calendar invented a 60-minute duration | Fixed: unknown duration returns `duration_unavailable` |
| RLS existed only as unverified SQL intent | Migration hardened with revokes/no public policies; managed application remains `NOT_RUN` |
| Unverified pack was marked recommended | Fixed: no recommendation or commercial value is published without confirmation |
| UI treated non-live states like an empty agenda | Fixed: distinct template, request, unavailable, error and readiness panels |
| WebGL and continuity lacked rendered evidence | Fixed locally: fallback, reduced motion, context loss/visibility behavior and section continuity audited |

## Final local validation evidence

### Default safe configuration

```text
npm run lint: PASS
npm run typecheck: PASS
npm test: PASS (19 total; 13 active PASS, 6 scenario-specific SKIP)
npm run build: PASS
final build restored with default template/draft environment: PASS
```

### Adversarial and lab scenarios

```text
live without managed persistence: PASS -> not_ready, no write
Supabase read/network failure: PASS -> error/read_failed + availability_failed, no write
request rendered state: PASS -> no confirmation
unavailable rendered state: PASS -> no empty-agenda claim
isolated live Supabase fixture: PASS -> one write, second attempt rejected,
  response excludes phone/note, opaque calendar token resolves trusted ICS
managed Supabase verification: NOT_RUN (credentials absent)
```

The live fixture is a local HTTP double created by the QA harness. It proves the
application contract, not a real Supabase project, applied migration, remote RLS
or production persistence.

### Browser and visual QA

Browser path: Chrome through the in-app Browser integration, against both the
existing development server and an owned `next start` process.

```text
page identity and meaningful DOM: PASS
Next/framework error overlay: NONE OBSERVED
application console errors: NONE OBSERVED
keyboard tab interaction: PASS
mobile menu open/Escape/focus return: PASS
reduced motion: PASS (field animation none, transition duration 0.01 ms)
WebGL in template: intentional fallback/static state
horizontal overflow: NONE at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440
desktop first viewport: PASS locally
mobile first viewport: PASS locally
promotions and agenda continuity: PASS after correcting a ReflexField positioning defect
```

Chrome emitted extension-origin warnings and stale extension message-channel
errors. They were not emitted by the site bundles and are not attributed to the
application.

One local production-start CDP observation reported first meaningful paint at
approximately 1.21 seconds after navigation start and DOMContentLoaded at
approximately 0.99 seconds. This is a single-machine lab observation, not a
Lighthouse/Web Vitals or deployed performance certification.

## Final phase classification

| Area | Final status | Remaining gate |
| --- | --- | --- |
| Architecture and integrity | PASS_LOCAL | Managed environment evidence |
| Privacy boundaries | PASS_LOCAL | Production logs/hosting verification |
| Product and booking states | PASS_LOCAL | Real commercial data and managed persistence |
| Hero, content, promotions, agenda | PASS_LOCAL | Human commercial approval |
| Reflex Field, motion, WebGL fallback | PASS_LOCAL | Cross-browser deployed QA |
| Responsive | PASS_LOCAL | Device/browser matrix on deployed build |
| Accessibility | PARTIAL | Semantic/keyboard/reduced-motion PASS; automated axe and human AT test pending |
| Performance | PARTIAL | Local observation only; deployed Lighthouse/Web Vitals pending |
| Supabase/RLS | BLOCKED_EXTERNAL | Credentials, migration application and anon-denial proof |
| Commercial data | BLOCKED_EXTERNAL | WhatsApp, location, duration, hours, promotion terms/prices |
| Deployment/publication | BLOCKED_EXTERNAL | Public URL, hosted build and approval |

## Publication decision

`PRODUCT PASS` is **not declared**.

The repository is locally fail-closed and suitable for continued integration,
but publication remains blocked until the real commercial inputs, managed
Supabase persistence/RLS, deployed visual and accessibility evidence,
responsive validation and human approval are all current and verified.

## Visual Technology 2.0 — full background pass

### Scope implemented

The approved visual prompt was applied without changing architecture, palette,
typography, logo, commercial copy, booking modes, reservation authority, APIs or
persistence. The pass adds three coordinated layers to every major visual
surface:

| Surface | CSS detail | SVG topology | Shared WebGL state |
| --- | --- | --- | --- |
| Header | vein | base, wide crop | inherits active section |
| Hero | strata | open hero field | hero |
| Reflexology | pressure | concentrated field | reflexology |
| Benefits | contour | benefit field plus existing morph | benefits |
| Promotions | dark strata | pack node grouping | promotions |
| Availability | vein | base field | availability |
| Questions | contour | concentrated ambient field | questions |
| Final CTA | convergence | converging field | cta |
| Footer | convergence | final field | footer |

### WebGL architecture and cost control

- One fixed canvas is shared by the complete page; the implementation does not
  allocate one WebGL context per section.
- The fragment shader uses procedural mineral noise, restrained strata and soft
  lighting/pointer influence. It does not use particles, 3D meshes or external
  render libraries.
- Section configuration interpolates on one animation loop. The active surface
  is selected at a viewport focus line; a document-end rule hands the final state
  to the footer.
- Desktop fine-pointer policy is `animated`; touch, mobile and reduced motion
  render a `static` frame; save-data, less than 4 GB reported memory and widths
  below 320 px use the CSS/SVG `fallback`.
- DPR is capped at 1.35 for animated rendering and 1 for static rendering.
- The loop pauses when the document is hidden and handles WebGL context loss and
  restoration.

### Current automated evidence

```text
visual contract unit tests: PASS (6/6)
default isolated suite: PASS (25 total, 19 active PASS, 6 scenario SKIP)
request state: PASS
unavailable state: PASS
live without managed persistence: PASS
read failure and recovery state: PASS
isolated live Supabase fixture: PASS
```

### Current rendered QA evidence

The in-app Browser integration had no connected backend in this pass. Playwright
was not installed and no dependency was added. Because the visual prompt permits
any available browser QA, the fallback used the installed Chrome 151 in headless
mode with a fresh temporary profile and DevTools against an owned production
server at `127.0.0.1:4320`.

```text
page identity / meaningful content: PASS
framework error overlay: NONE
runtime exceptions and console error/warning events: NONE
failed network loads: NONE
WebGL desktop: animated, one canvas, active hero state
WebGL mobile/touch: static frame
reduced motion: static canvas, CSS/SVG transform none, transition 0 s
benefit interaction: selection changed to "Una pausa propia"
section continuity: benefits -> promotions -> footer states verified
mobile menu: open, Escape close and focus return PASS
horizontal overflow: 0 px at 320, 360, 375, 390, 430, 768, 1024,
  1280, 1440 and 1670 px
native baseline viewport comparison: 1670 x 821 inspected directly
```

The Chrome timing observation is a single-machine lab probe, not Lighthouse or
field Web Vitals evidence. Deployed cross-browser QA, axe/assistive-technology
validation, Lighthouse/Web Vitals and human visual approval remain required.
This pass does not change the publication decision: `PRODUCT PASS` remains
**not declared**.

## Visual Technology 2.0 — Reflex Field depth and motion pass

### Implemented delta

- Rebuilt `ReflexField` around deterministic organic geometry: cubic Bézier
  flows, six to eight pressure contours, eight satellites, layered halos and
  flat mineral node cores. The deterministic builder prevents hydration drift,
  `NaN` paths and random layout changes between renders.
- Widened the reflexology and benefits topologies so their fields read as full
  compositions instead of small clusters inside oversized cards.
- Added one-RAF pointer throttling and `IntersectionObserver` activity state.
  Offscreen fields stop their CSS motion; interactive movement remains local to
  the hero graphic and does not alter booking readiness.
- Added a second CSS lattice to all nine visual surfaces. Header and footer now
  carry stronger fields, veins, pressure rings, dots and convergence strata;
  every content block receives a surface-specific mask and continuity bridge.
- Preserved the one-canvas WebGL architecture and its resource policies. The
  pass increases presence through CSS and SVG instead of multiplying contexts
  or adding a 3D library.
- Increased the real wordmark render sizes to 224 x 88 px in desktop header,
  183 x 72 px in mobile header and 285 x 112 px in desktop footer.
- Corrected the header stacking contract exposed by rendered QA. The global
  body stacking rule had overridden Tailwind's `fixed z-40`; `.site-header`
  now explicitly owns fixed layer 40 and `#contenido` reserves
  `var(--header-h)`. The mobile panel is viewport-covering and no longer competes
  with the hero.
- Added a configurable `QA_SERVER_TIMEOUT_MS` to the isolated harness. Its
  default remains 30 seconds; the longer value is only needed when the host is
  severely CPU-contended.

### Test-driven evidence

The geometry work first failed with the geometry module absent, then passed
after implementation. Horizontal-coverage assertions also failed before the
topology correction. The mobile stack test failed before both the explicit
fixed header and main offset were added, then passed after each correction.

```text
lint: PASS
TypeScript: PASS
optimized production build: PASS (11/11 routes generated)
default isolated suite: PASS (29 total; 23 active PASS; 6 conditional SKIP)
request state: PASS (2/2)
unavailable state: PASS (2/2)
live without managed persistence: PASS (2/2)
Supabase read failure and error UI: PASS (3/3)
isolated live Supabase fixture: PASS (2/2)
managed Supabase/RLS verification: NOT_RUN
```

The host reached load averages above 400 during final QA. Two 30-second server
readiness attempts timed out without executing assertions; the same fresh build
and isolated tests passed after using the explicit longer harness timeout.
Next also retried four page-generation workers once under that contention and
then completed all routes. These infrastructure timeouts are retained here and
are not reported as application-test failures or as performance evidence.

### Final production-local rendered evidence

QA ran against an owned `next start` instance at `127.0.0.1:4322` through a
fresh headless Chrome DevTools profile because the in-app Browser runtime
reported zero available browser instances. The existing development server at
`127.0.0.1:3000` was not touched.

```text
meaningful production DOM: PASS
framework error overlay: NONE
runtime issues: 0
network failures: 0
visual surfaces / CSS lattices / WebGL canvases: 9 / 9 / 1
hero field: 8 contours, 22 flow paths, 17 nodes, 8 satellites
pointer response: PASS
benefit field morph: PASS
horizontal overflow: 0 px at 320, 360, 375, 390, 430, 768, 1024,
  1280, 1440 and 1670 px
mobile/touch WebGL policy: static
reduced motion: SVG field, flow and lattice animations none; canvas static
mobile menu: full viewport coverage, 0.96 background alpha, Escape close and
  focus return PASS
```

The reservation file remained ignored, retained two local records and preserved
SHA-256
`1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad`.
No reset, clean, checkout, commit, deployment, managed mutation or reservation
write was performed.

### Remaining publication gates

Real hours, duration, prices/terms, location and contact data remain external.
Managed Supabase migration/RLS/anon-denial and production persistence remain
unverified. Deployed cross-browser/device QA, automated axe plus human
assistive-technology testing, Lighthouse/field Web Vitals and human visual and
commercial approval are still required. `PRODUCT PASS` remains **not declared**.

## Iterative fluidity closure — three gated passes

### Scope and measurement protocol

The approved fluidity work ran as three sequential red/green passes. Each pass
remained closed until its focal test and the relevant global gates passed. The
in-app Browser runtime again exposed zero browser instances, so the approved
fallback used an isolated Chrome DevTools profile on port 9230 and an owned
production server on `127.0.0.1:4340`. The user's development server on port
3000 was preserved.

The probe used the same 4.2-second round-trip scripted scroll, a 2.2-second idle
window, DPR 1 and 1440 x 900 / 390 x 844 viewports before and after. This is
repeatable production-local lab evidence, not Lighthouse, field Web Vitals or
deployed-device certification.

### Pasada 1 — redundant React and scroll work

The red tests proved two absent contracts: identical Reflex Field graphs still
entered a 520 ms morph and independent scroll consumers lacked a shared
single-frame scheduler. The green implementation added structural graph
comparison and a cancellable RAF scheduler used by ambient scroll, visual
surface selection, header, sticky CTA and WhatsApp visibility.

```text
focal tests: PASS (2/2)
mobile initial RAF requests: 51 -> 1
desktop initial RAF requests: 21 -> 16
visual field mutations: 0
lint / TypeScript / build / isolated suite: PASS
```

Desktop scroll remained about 10.3 FPS while mobile static WebGL reached 56.7
FPS, so the next pass was evidence-backed rather than speculative.

### Pasada 2 — adaptive shared WebGL cadence

The red test required animated WebGL to yield during scroll, render at 60 Hz
only during pointer interaction and use a 24 Hz ambient cadence. The green
implementation preserved the single canvas, shader, DPR and spatial quality;
it also moved size reads to `ResizeObserver`, removed per-frame object
allocations and added timer/frame/visibility/context cleanup.

```text
focal test: PASS (1/1)
desktop scroll: 10.32 -> 11.43 FPS
mobile scroll: 56.67 -> 60 FPS
desktop script duration: 0.015864 -> 0.009482 s
runtime issues / failed network loads: 0 / 0
lint / TypeScript / build / isolated suite: PASS
```

The desktop result remained below the 50 FPS and 25 ms p95 working threshold.
Pasada 3 was therefore enabled by measurable evidence.

### Pasada 3 — SVG raster-motion isolation

DevTools ablation separated the remaining cost. Removing WebGL alone left
11.52 FPS; keeping WebGL while hiding only environmental SVG fields reached
58.1 FPS. Further probes showed that preserving the fields and filters but
stopping their continuous descendant animation reached 56.44 FPS. The final
implementation keeps all nine environmental `ReflexField` instances, 13 total
fields, 132 flow paths, filters, nodes and section-specific topology, while
freezing only continuous background-field raster motion. Foreground fields,
WebGL, lattice view motion, reveal transitions and interactive benefit morphs
remain active.

```text
focal test: PASS (1/1)
desktop estimated FPS: 9.85 -> 60.02
desktop mean frame: 101.54 -> 16.662 ms
desktop p95 frame: 117.8 -> 17.6 ms
desktop frames > 32 ms: 42 -> 0
mobile estimated FPS: 58.32 -> 60.00
mobile p95 frame: 18.7 -> 17.6 ms
mobile frames > 32 ms: 3 -> 0
runtime issues / failed network loads / horizontal overflow: 0 / 0 / 0
```

### Final gates and preservation evidence

```text
lint: PASS (exit 0)
TypeScript: PASS (exit 0)
optimized production build: PASS (11/11 routes)
default isolated suite: PASS (33 total; 27 PASS; 6 conditional SKIP)
conditional local fixtures: PASS (live-not-ready 2/2; read failure 3/3;
  request 2/2; unavailable 2/2; isolated live 2/2)
Chrome responsive matrix: PASS at 360, 390, 768, 1024 and 1440 px
mobile menu open / Escape close / focus return: PASS
benefit keyboard ArrowRight selection and focus: PASS
reduced motion: PASS (static canvas and root scroll-behavior auto)
basic accessible-name and image-alt probe: PASS
template state: PASS; no selectable time controls or "turno reservado" claim
readiness: template, canBookLive=false, canPublish=false
managed Supabase and RLS verification: NOT_RUN
```

Two preliminary fixture invocations were discarded because `QA_SCENARIO` was
used only as a test selector without the corresponding `BOOKING_MODE` and
readiness environment. They correctly served the default template build and
therefore could not evidence the requested states. The retained fixture results
above come from scenario-specific builds with explicit local-only state and a
final default template/draft rebuild.

The before/after screenshot inspection retained the hero composition, logos,
palette, typography, density and mobile layout. Header wordmark measured 183 x
72 px on mobile and 224 x 88 px on desktop; footer measured 224 x 88 px and
285 x 112 px respectively. The local reservation store remained Git-ignored,
retained two records and preserved SHA-256
`1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad`.

Chrome for Testing emitted internal GCM deprecation and `SharedImageManager`
messages on its process stderr during capture/shutdown. They were not page
`Runtime`, `Log` or `Network` events, whose retained counters were all zero, so
they are classified as isolated-browser harness diagnostics rather than a site
PASS or FAIL. Deployed cross-browser/device validation remains open.

This closure does not satisfy the external publication gates. Real commercial
data, managed persistence, managed RLS proof, deployed cross-browser/device QA,
automated axe plus human assistive-technology validation, Lighthouse/field Web
Vitals and human visual/commercial approval remain open. `PRODUCT PASS` remains
**not declared**.
