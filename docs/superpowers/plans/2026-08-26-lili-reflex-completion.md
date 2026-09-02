# Lili Reflexologia Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the existing Lili Reflexologia product through integrity-first booking states, privacy-safe persistence, state-aware visual behavior, responsive accessibility, performance, and evidence-backed QA.

**Architecture:** Preserve the current Next.js application and introduce a discriminated operating-state/read-result boundary between persistence and UI. All public booking surfaces consume the same server-derived mode, while the existing CSS/SVG/WebGL visual system is refined only after the integrity gate passes.

**Tech Stack:** Next.js 16.3.2 App Router, React 19.2.8, TypeScript 5.9, Tailwind CSS 4, Node test runner, raw SVG, raw WebGL, Supabase REST.

**Spec:** `docs/superpowers/specs/2026-08-26-lili-reflex-completion-design.md`

## Global Constraints

- Preserve the current stack, palette, Manrope/Fraunces typography, logo, and useful components.
- Preserve all existing work and `data/reservations.json`; no reset, checkout, destructive cleanup, history rewrite, or force push.
- Do not invent prices, discounts, duration, address, hours, availability, phone, WhatsApp, recommendations, credentials, or claims.
- Template hours cannot create reservations or a `Turno reservado` confirmation.
- Availability and persistence failures fail closed and cannot become an empty agenda.
- Personal reservation data stays out of Git, calendar URLs, and logs.
- Production live booking requires managed persistence and verified RLS.
- Each task ends with lint, TypeScript, tests, and build or explicitly records why an external gate cannot run.
- Do not declare `PRODUCT PASS` without real commercial data and complete visual, responsive, accessibility, performance, and managed-production evidence.
- The pre-existing dirty worktree prevents clean task commits; do not stage or commit unrelated/user-authored baseline changes.

---

### Task 1: Baseline, privacy boundary, and executable QA harness

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `scripts/qa-booking.mjs`
- Create: `scripts/run-qa.mjs`
- Create: `docs/audits/2026-08-26-master-orchestrator-audit.md`

**Interfaces:**
- Consumes: existing `npm run lint`, `npm run typecheck`, `npm run build`, and HTTP routes.
- Produces: `npm test` that starts a production server on an isolated port and `QA_BASE_URL` for integration tests.

- [ ] **Step 1: Record the source and data baseline**

Record branch, status, changed paths, reservation count without values, and SHA-256 in the audit. Classify every master phase as `implemented`, `partial`, `missing`, or `external blocker`.

- [ ] **Step 2: Write a failing privacy assertion**

Add a QA test that runs `git check-ignore data/reservations.json` and expects success. It must fail before `.gitignore` changes.

- [ ] **Step 3: Run the privacy assertion and verify RED**

Run `node --test scripts/qa-booking.mjs --test-name-pattern="local reservations"`. Expected: FAIL because the reservation file is not ignored.

- [ ] **Step 4: Ignore local reservation payloads without deleting them**

Add these patterns:

```gitignore
# Local booking data contains personal information.
/data/reservations.json
/data/reservations.*.json
```

- [ ] **Step 5: Make the QA harness self-contained**

Implement `scripts/run-qa.mjs` to spawn `next start` on a configurable local port after a build, poll `/api/readiness` until reachable, run `node --test scripts/qa-booking.mjs`, and terminate only the child process it started. Keep stdout/stderr and exit codes visible.

- [ ] **Step 6: Verify Task 1**

Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm test`. Recompute the reservation file SHA-256 and confirm it is unchanged.

---

### Task 2: Typed operating state and fail-closed reservation reads

**Files:**
- Create: `src/lib/booking-state.ts`
- Modify: `src/lib/config.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/json-store.ts`
- Modify: `src/lib/reservations/supabase-store.ts`
- Modify: `src/lib/reservations/index.ts`
- Modify: `src/lib/store.ts`
- Modify: `src/lib/availability.ts`
- Test: `scripts/qa-booking.mjs`

**Interfaces:**
- Produces: `BookingMode = "template" | "request" | "live" | "unavailable" | "error"`.
- Produces: `ReservationReadResult = { ok: true; reservedKeys: string[]; source: "json" | "supabase" } | { ok: false; code: "configuration" | "read_failed" | "invalid_data"; source: "json" | "supabase" }`.
- Produces: `AvailabilitySnapshot` containing `mode`, `days`, `checkedAt`, and optional public error code.

- [ ] **Step 1: Write failing HTTP tests for the typed contract**

Add tests expecting `/api/availability` to return a top-level mode, `checkedAt`, and no `days` marked available when the configured mode is template. Add a controlled Supabase failure fixture that expects HTTP 503 and mode `error`, not HTTP 200 with all slots open.

- [ ] **Step 2: Run the focused tests and verify RED**

Run the new availability tests against the current server. Expected: FAIL because the route only returns `{ reserved, days }` and Supabase reads return `[]` on failure.

- [ ] **Step 3: Add the domain types and explicit configured mode**

Use an environment-backed mode with a safe default:

```ts
export type BookingMode = "template" | "request" | "live" | "unavailable" | "error";

export function configuredBookingMode(): Exclude<BookingMode, "error"> {
  const value = process.env.BOOKING_MODE?.trim();
  if (value === "request" || value === "live" || value === "unavailable") return value;
  return "template";
}
```

Do not use `NEXT_PUBLIC_` for this authority decision.

- [ ] **Step 4: Make both stores return discriminated read results**

The JSON store validates the parsed root and reservation array. Missing local files may initialize an empty local development store, but malformed/unreadable existing files return `invalid_data` or `read_failed`. Supabase non-2xx, invalid JSON, or invalid rows return a failure result.

- [ ] **Step 5: Build one availability snapshot boundary**

`getAvailabilitySnapshot()` derives the configured mode and store result. Template builds disabled example days; request does not claim live density; unavailable returns verified no-booking UI; live requires a successful managed read; failures return mode `error` with no selectable slots.

- [ ] **Step 6: Verify Task 2**

Run focused red-green tests, then the four global commands. Confirm mutations such as returning `[]` from a failed read make a test fail.

---

### Task 3: Server-enforced booking integrity and publication readiness

**Files:**
- Create: `src/lib/readiness.ts`
- Create: `src/app/api/readiness/route.ts`
- Modify: `src/app/actions/booking.ts`
- Modify: `src/app/api/availability/route.ts`
- Modify: `src/app/api/book/route.ts`
- Modify: `supabase/migrations/20260822120000_reservations.sql`
- Create: `scripts/verify-supabase-readiness.mjs`
- Test: `scripts/qa-booking.mjs`

**Interfaces:**
- Produces: `PublicReadiness` with `mode`, `canPreview`, `canAcceptRequests`, `canBookLive`, and non-secret blocker codes.
- Consumes: `getAvailabilitySnapshot()` from Task 2.

- [ ] **Step 1: Write failing booking-authority tests**

Test that the current template configuration rejects an otherwise valid POST with code `template_only`; a forced read failure rejects with `availability_failed`; and live mode without managed persistence rejects with `not_ready`. Verify no new local reservation is written.

- [ ] **Step 2: Run tests and verify RED**

Expected: the current implementation accepts a valid template slot and writes it locally.

- [ ] **Step 3: Implement derived readiness**

Derive booking authority server-side from configured mode, real-hours marker, managed-store configuration, duration/calendar capability, contact configuration, and privacy-safe settings. Return only public blocker codes such as `commercial_data`, `managed_persistence`, or `availability_unverified`.

- [ ] **Step 4: Enforce authority in every mutation entry point**

Before input validation creates a record, `submitReservation` must resolve readiness and a fresh availability snapshot. Only `live` plus `canBookLive` can reserve. `request` remains non-reservable until a separate durable request store exists.

- [ ] **Step 5: Strengthen Supabase verification**

Keep RLS enabled and no public policies. Add a non-destructive script that, when credentials are present, checks table reachability with the service role and documents that public anon access must be verified from the Supabase project. Missing credentials produce `NOT_RUN`, never PASS.

- [ ] **Step 6: Verify Task 3**

Run template rejection, read failure, not-ready, invalid input, and conflict tests. Run all four global commands. Record remote Supabase verification as `NOT_RUN` when credentials are absent.

---

### Task 4: Privacy-safe calendar and minimal public confirmation

**Files:**
- Modify: `src/lib/reservations/types.ts`
- Modify: `src/lib/reservations/json-store.ts`
- Modify: `src/lib/reservations/supabase-store.ts`
- Modify: `src/app/actions/booking.ts`
- Modify: `src/app/api/calendar/route.ts`
- Modify: `src/lib/calendar.ts`
- Modify: `src/components/sections/Availability.tsx`
- Test: `scripts/qa-booking.mjs`

**Interfaces:**
- Produces: a cryptographically random `calendarToken` stored with a live reservation.
- Produces: `getReservationForCalendar(token)` that returns only event-safe fields.
- Produces: `/api/calendar?token=<opaque>` with no personal or commercial query data.

- [ ] **Step 1: Write failing privacy and duration tests**

Assert that calendar URLs contain only `token`; name, phone, date, time, and promotion do not appear. Assert an unknown token returns 404. Assert calendar generation is unavailable when duration is null rather than defaulting to 60 minutes.

- [ ] **Step 2: Run tests and verify RED**

Expected: current route accepts all reservation details from query parameters and invents a 60-minute duration.

- [ ] **Step 3: Persist and query opaque calendar capabilities**

Add a random token to newly created live reservations and store it. Add a token lookup to both adapters. Keep tokens out of logs and public readiness output.

- [ ] **Step 4: Generate ICS from trusted persisted data**

The route accepts only `token`, loads trusted fields, requires a real duration, and emits a generic event summary without the client's name or phone. Location is included only if configured.

- [ ] **Step 5: Minimize the Server Action return**

Return only the fields the confirmation renders: public reservation id, date, time, promotion id, display name, and calendar capability when available. Never return phone or note to the client after persistence.

- [ ] **Step 6: Verify Task 4**

Run calendar privacy, missing-duration, invalid-token, timezone, and booking confirmation tests, followed by the global commands.

---

### Task 5: State-aware page, hero, promotions, and booking experience

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/providers/BookingProvider.tsx`
- Modify: `src/components/sections/Hero.tsx`
- Modify: `src/components/sections/Promotions.tsx`
- Modify: `src/components/sections/Availability.tsx`
- Modify: `src/components/layout/MobileBookingSheet.tsx`
- Modify: `src/components/layout/StickyCta.tsx`
- Modify: `src/components/layout/WhatsAppFloat.tsx`
- Modify: `src/components/ui/Status.tsx`
- Modify: `src/components/ui/Chip.tsx`
- Test: `scripts/qa-booking.mjs`

**Interfaces:**
- Consumes: `AvailabilitySnapshot` and `PublicReadiness`.
- Produces: state-correct public copy and controls for all five modes.

- [ ] **Step 1: Write failing rendered-state tests**

For template HTML, assert `Agenda de ejemplo` and `Consultar disponibilidad`, with no `Próximo turno`, `Tomar este horario`, `Confirmar turno`, or enabled slot controls. For error HTML, assert retry copy and no agenda-empty claim. For live fixtures, assert booking controls appear only when readiness is true.

- [ ] **Step 2: Run tests and verify RED**

Expected: template currently renders live-looking next slots and reservation controls.

- [ ] **Step 3: Pass one snapshot through page and provider**

Replace bare reserved-key props with a serializable initial snapshot. Provider refresh returns the typed result and preserves the prior verified state until it can atomically replace it; a failed refresh enters `error`, not an empty set.

- [ ] **Step 4: Render each hero and promotion state**

Template uses non-interactive example language. Request uses consultation/request language without confirmation. Live shows verified availability. Unavailable and error replace slot previews with neutral recovery panels. Hide `Recomendado` unless configuration marks it commercially confirmed.

- [ ] **Step 5: Split and render the booking states**

Extract focused internal views from the oversized availability component as needed: status header, day rail, slots, booking form, unavailable panel, error panel, Lili Pass. Template examples are disabled; live density is real; errors expose retry and configured contact only.

- [ ] **Step 6: Enforce mobile fixed-surface priority**

Show at most one bottom conversion surface. Selected booking summary outranks sticky CTA; WhatsApp shifts or compacts when either is active.

- [ ] **Step 7: Verify Task 5**

Run state rendering, keyboard, refresh-failure, and booking-flow tests, then the global commands.

---

### Task 6: Reflex Field continuity, motion restraint, and WebGL fallback

**Files:**
- Modify: `src/lib/reflex-field/types.ts`
- Modify: `src/lib/reflex-field/topologies.ts`
- Modify: `src/components/brand/ReflexField.tsx`
- Modify: `src/components/effects/MineralSurface.tsx`
- Modify: `src/components/effects/AmbientScroll.tsx`
- Modify: `src/components/layout/SectionBridge.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: public booking mode for visual tone only.
- Produces: coherent field scenes and a WebGL canvas that is never required for content.

- [ ] **Step 1: Add behavior tests where observable**

Add rendered assertions that every decorative field/canvas is `aria-hidden`, and that reduced-motion CSS disables field, magnetic, reveal, pass, shimmer, and View Transition animation. Do not add source-text change-detector tests for purely visual constants.

- [ ] **Step 2: Verify any new behavioral test fails for the intended missing behavior**

Expected failing examples include missing WebGL fallback status or incomplete reduced-motion coverage, not arbitrary CSS-value mismatches.

- [ ] **Step 3: Refine field scenes without a new visual stack**

Keep the current node graph and add state tone/topology only where it changes semantic restraint: template static, live gentle pulse, unavailable settled, error frozen. Reuse existing section topologies and promotion grouping.

- [ ] **Step 4: Connect sections with existing bridges and ambient variables**

Insert lightweight bridges between hero/reflexology, benefits/promotions, and promotions/availability. Preserve native scroll and ensure static composition remains complete.

- [ ] **Step 5: Harden WebGL**

Handle context loss, pause on document visibility change, retain DPR cap 1.5, skip coarse/reduced/small contexts, and leave the SVG visible before and after canvas failure.

- [ ] **Step 6: Verify Task 6**

Run global commands and rendered visual smoke tests with WebGL enabled, disabled, and reduced motion.

---

### Task 7: Content, responsive, and accessibility pass

**Files:**
- Modify: `src/lib/config.ts`
- Modify: `src/components/sections/AboutReflexology.tsx`
- Modify: `src/components/sections/Benefits.tsx`
- Modify: `src/components/sections/Questions.tsx`
- Modify: `src/components/sections/FinalCta.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Skeleton.tsx`
- Modify: `src/app/globals.css`
- Test: `scripts/qa-booking.mjs`

**Interfaces:**
- Consumes: existing approved content and public booking mode.
- Produces: keyboard-complete and mode-correct content experience from 320 px through large desktop.

- [ ] **Step 1: Write failing semantic tests**

Assert one page-level `main`, ordered headings, a working skip link target, explicit loading status, correctly associated input error descriptions, and no unanswered FAQ that invents duration or location.

- [ ] **Step 2: Run tests and verify RED**

Expected failures must correspond to real missing associations or state semantics.

- [ ] **Step 3: Correct accessibility behavior**

Add `aria-describedby` for field errors, a non-visual loading announcement, roving focus or tab semantics where required, reliable focus return for the mobile menu, and non-color status labels.

- [ ] **Step 4: Correct responsive fixed and overflow behavior**

Audit widths 320, 360, 375, 390, 430, 768, 1024, 1280, and 1440+. Fix text wrapping, rails, form stacking, safe areas, and overlapping fixed controls without altering brand tokens.

- [ ] **Step 5: Preserve approved content and suppress unverified claims**

Keep prudent benefits and approved copy. Hide or rephrase only operational claims that require live data; do not add commercial facts.

- [ ] **Step 6: Verify Task 7**

Run keyboard, reduced-motion, zoom, semantic, and responsive smoke tests plus the four global commands.

---

### Task 8: Performance, visual QA, deployment evidence, and final audit

**Files:**
- Modify: `scripts/qa-booking.mjs`
- Create: `scripts/qa-visual.mjs` if browser automation is available without a heavy production dependency
- Modify: `README.md`
- Modify: `env.example`
- Modify: `docs/audits/2026-08-26-master-orchestrator-audit.md`

**Interfaces:**
- Consumes: the completed local product and all prior evidence.
- Produces: a reproducible validation ledger with explicit local, managed, visual, and external statuses.

- [ ] **Step 1: Add production-readiness documentation**

Document `BOOKING_MODE`, explicit local JSON development mode, Supabase server variables, required commercial fields, calendar capability, and the difference between preview, request, live, and product pass.

- [ ] **Step 2: Run production-server interaction QA**

Exercise invalid input, template denial, availability failure, conflict, retry, calendar privacy, WhatsApp encoding when configured, anchors, and refresh behavior against `next start`.

- [ ] **Step 3: Run visual and accessibility QA**

Capture or inspect mobile, tablet, desktop, and large desktop for template, unavailable, and error locally. Live screenshots require an authorized real or isolated managed fixture and cannot be inferred from template data. Check keyboard, reduced motion, console, and accessible names.

- [ ] **Step 4: Inspect performance**

Record route build output, client/server boundaries, public asset sizes, canvas behavior, layout shift observations, and any available lab metrics. Mark unmeasured Core Web Vitals as `NOT_RUN`, not PASS.

- [ ] **Step 5: Run final fresh verification**

Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` from a clean process state. Recheck Git status, ignored local reservations, reservation SHA-256, absence of PII in generated URLs, and zero introduced console errors.

- [ ] **Step 6: Reconcile every master-orchestrator phase**

Update the audit with `PASS`, `PARTIAL`, `NOT_RUN`, or `BLOCKED_EXTERNAL` for product, UX, UI, brand, interaction, responsive, accessibility, performance, visual, managed persistence, and commercial data. Declare `PRODUCT PASS` only if every required item has current evidence.
