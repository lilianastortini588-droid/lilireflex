# Lili Reflexologia Completion Design

**Status:** Approved in conversation on 2026-08-26.  
**Source specifications:** `Lili_Reflexologia_Prompts/01_PRODUCTO_FUNCIONALIDAD.md`, `02_UI_UX_TECNOLOGIA_GRAFICA.md`, `03_DESIGN_SYSTEM_DIRECCION_ARTE.md`, `04_MASTER_ORCHESTRATOR.md`, and `PROMPT_VISUAL_TECHNOLOGY_2.0.MD`.  
**Product direction:** Wellness mineral plus silent technology, with integrity before visual refinement.

## Objective

Complete the existing Lili Reflexologia landing page without replacing its stack, palette, typography, logo, or useful component architecture. The public experience must explain reflexology prudently, present verified promotions, show availability, reserve or request a slot according to the real operating mode, and provide contextual WhatsApp contact.

The system must never turn missing, stale, or failed availability into an empty reservation set, and must never allow template hours to create a reservation or a confirmation that says a slot was reserved.

## Non-negotiable constraints

- Preserve the current Next.js, React, Tailwind CSS, raw SVG, and selective raw WebGL stack.
- Preserve existing work and local reservation records; no reset, checkout, history rewrite, or destructive cleanup.
- Do not invent prices, discounts, duration, address, business hours, availability, credentials, claims, or commercial recommendations.
- Keep personal reservation data out of Git and out of calendar URLs.
- Keep Supabase service-role credentials server-only and verify RLS before calling production persistence ready.
- Fail closed on availability and persistence errors.
- Run lint, TypeScript, tests, and production build after every implementation pass.
- Do not declare `PRODUCT PASS` without real commercial data, managed production persistence, visual QA, accessibility QA, and responsive validation.

## Current architecture to preserve

- Editable business and copy data live in `src/lib/config.ts`.
- Availability calculation lives in `src/lib/availability.ts`.
- Persistence adapters live in `src/lib/reservations/`.
- The booking Server Action lives in `src/app/actions/booking.ts`.
- Client selection state lives in `src/components/providers/BookingProvider.tsx`.
- The public flow is composed in `src/app/page.tsx` from focused section components.
- Visual tokens are centralized in `src/app/globals.css`.
- `ReflexField` and `MineralSurface` already provide SVG and selective WebGL foundations.

The implementation may split the oversized availability component into focused views, but must not introduce a second booking system or a parallel source of truth.

## Operating-state contract

The availability domain exposes one of these states:

### `template`

The schedule is illustrative. Hours may be shown only as disabled examples. The interface may offer a real configured consultation channel, but it cannot submit a reservation, calculate real density, label a next slot, or show a Lili Pass.

### `request`

The business accepts a preferred date or time as a request, not an instant reservation. A durable request may end in `Solicitud recibida`, explicitly stating that Lili still needs to confirm it. This state is not enabled until request persistence exists; otherwise the interface only offers the configured external contact channel.

### `live`

The schedule came from a successful real availability read and production persistence is ready. Slots can be selected and reserved. `Turno reservado` is allowed only after server revalidation and a durable unique write.

### `unavailable`

The availability source responded successfully but no slots are currently publishable, or booking is deliberately disabled. The interface shows a neutral unavailable panel, never a fake empty calendar.

### `error`

Availability, persistence, configuration, or readiness could not be verified. The interface removes booking actions, presents retry or a configured contact channel, and never substitutes an empty reservation list.

`loading`, `selected`, `occupied`, `past`, `conflict`, and `submitting` are subordinate UI states and cannot override the operating-state contract.

## Readiness model

Readiness is derived from facts rather than a manually asserted verification flag:

- `commercial`: confirmed operating mode, real hours for live booking, and any displayed duration, location, price, discount, or recommendation.
- `privacy`: local reservations ignored by Git, no personal data in URLs, and no personal payload logging.
- `persistence`: managed store configured, RLS deployed, no public policies, unique slot constraint present, read and write probes fail closed.
- `availability`: a typed read result distinguishes data, a verified empty result, and failure.
- `calendar`: only a persisted live reservation can generate an ICS; the URL uses an opaque capability token and the event does not invent duration or location.
- `experience`: responsive, keyboard, reduced-motion, accessibility, visual, console, and performance evidence.

The server derives `canPreview`, `canAcceptRequests`, `canBookLive`, and `productPassEligible`. The browser receives the semantic mode and public-safe status only; it does not receive secrets or infrastructure diagnostics.

## Persistence and privacy design

`ReservationStore.listReservedKeys` returns a discriminated result rather than a bare array. A read failure can never be confused with zero reservations. Store selection is environment-aware:

- Production requires Supabase for live booking.
- Development may use the JSON store only when explicitly enabled as a local mode.
- A malformed or unreadable local file is an error, not an empty store.
- A failed Supabase request is an error with a safe public code.

The existing RLS migration remains default-deny and receives verification comments or a non-destructive verification script. No public insert policy is added because writes use a server-side service role.

The calendar route accepts a non-personal opaque token. It reads the persisted reservation server-side and produces an ICS only when enough real event data exists. If session duration is unknown, the calendar action is not shown. No name, phone, note, date, time, or promotion is accepted from query parameters.

## Booking flow

1. Resolve readiness and availability on the server.
2. Render the correct operating state.
3. Allow local, reversible selection only in `live`, or preference selection in a future ready `request` mode.
4. Submit untrusted input to the Server Action.
5. Re-resolve operating state and re-read availability on the server.
6. Reject template, unavailable, error, stale, invalid, or occupied slots.
7. Persist through the configured managed store.
8. Return a minimal public confirmation shape.
9. Show `Turno reservado` only for a durable live reservation.

## Visual system

The existing lila mineral palette, Manrope/Fraunces pairing, wordmark, surface hierarchy, and motion tokens remain unchanged unless contrast evidence requires a minimal adjustment.

`ReflexField` becomes the continuous brand grammar:

- hero: open topology and broad curves;
- reflexology: concentrated topology;
- benefits: semantic morph per selected benefit;
- promotions: organic groups for confirmed session counts;
- availability: precise and calm, with live pulse only for verified data;
- final CTA: slow convergence.

CSS and SVG are the mandatory base. WebGL remains a hero-only enhancement with SVG/CSS fallback, capped DPR, visibility pause, reduced-motion disablement, and context-loss handling.

Section continuity uses the existing ambient CSS variables and `SectionBridge`. There is no scroll hijacking and no global canvas.

## State-aware visual behavior

- Hero copy and CTAs derive from the operating state; template hours never look clickable.
- Promotion math animates only real numeric values. Unknown values remain `Consultar` and do not animate from zero.
- A `Recomendado` badge is displayed only if that recommendation is confirmed commercial data.
- Live day density comes only from verified slots.
- Skeletons exist only while a read is pending; `error` and `unavailable` replace them explicitly.
- `Lili Pass` belongs only to live reservations.
- A request confirmation uses distinct language and iconography.
- Fixed mobile surfaces follow one priority: menu/dialog, selected-booking summary, general sticky CTA, then WhatsApp.

## Accessibility

- Target WCAG 2.2 AA for the published flow.
- Every control has visible focus, a real label, and a minimum comfortable touch target.
- Selection, occupied, unavailable, and error do not depend on color alone.
- Decorative SVG and canvas remain `aria-hidden` and unfocusable.
- Status announcements are concise and do not repeat on decorative transitions.
- Error messages are associated with their inputs.
- Focus moves to conflict or confirmation headings without losing context.
- Keyboard, touch, 200 percent zoom, forced colors, and reduced motion are verified.

## Performance

- Add no motion dependency while CSS and the existing code suffice.
- Prefer transforms and opacity.
- Keep one persistent animation loop at most: the visible hero canvas.
- Stop morph loops after their transition.
- Limit WebGL DPR to 1.5 and pause outside the viewport or hidden tab.
- Avoid animated large-area blur.
- Measure bundle and route output before and after.
- Laboratory goals: LCP at or below 2.5 seconds, INP at or below 200 ms, CLS at or below 0.1 under the recorded profile.

## Validation and closure

Every pass runs:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

Additional evidence includes template POST rejection, fail-closed read tests, concurrent conflict tests, URL privacy tests, RLS verification, state screenshots, keyboard flow, reduced motion, accessibility automation, console inspection, responsive screenshots, WebGL fallback, and performance measurements.

Local implementation can close independently of these external blockers:

- real prices and discounts;
- real duration;
- real location;
- real operating hours;
- real WhatsApp number;
- Supabase project credentials and deployed-state verification;
- human visual and commercial approval.

Until those are supplied and verified, `PRODUCT PASS`, managed persistence, and production booking remain not verified.
