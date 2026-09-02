# Reflexología Holística WhatsApp-only y WaterSurface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This checkout must be edited in place because the approved work exists as uncommitted files on `main`; do not create a worktree from the initial commit, commit, stash, reset, push, or publish.

**Goal:** Transformar la landing existente en la experiencia continua `REFLEXOLOGÍA HOLÍSTICA`, con un único WaterSurface global, identidad de pie nacarado y WhatsApp como único canal de conversión.

**Architecture:** `page.tsx` vuelve a ser un Server Component estático que compone secciones semánticas; sólo navegación, acordeones, mapa de técnicas y runtime visual permanecen como Client Components. Un único `VisualStage` fijo carga Three.js dinámicamente, monta un solo `WebGLRenderer`/canvas y conserva fallback CSS estático. Toda URL de WhatsApp nace de `buildWhatsAppUrl`, sin provider, APIs ni estado de reservas.

**Tech Stack:** Next.js 16.3.2 App Router, React 19.2.8, TypeScript 5, Tailwind CSS 4, Three.js, SVG accesible, `next/image`, Node test runner y Chrome/CDP para QA renderizada.

**Spec:** `../Lili_Reflexologia_Prompts/Prompt maestro — Reflexología Holística_ landing inmersiva, WaterSurface global y conversión por WhatsApp.md`

## Global Constraints

- Preservar el checkout sucio y `data/reservations.json`; SHA-256 inicial: `1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad`.
- Título visible exacto: `REFLEXOLOGÍA HOLÍSTICA`.
- WhatsApp es el único canal; número configurado existente prevalece y el fallback aprobado es `5491169702403`.
- Un solo canvas, contexto, renderer, escena, cámara, plano fullscreen, scheduler de RAF, listener de pointer y listener de scroll.
- El fondo fijo usa `docs/360_F_1795791701_X5nS6eeh6M5YWG1Ph0CN9oNHJh1uSyJi.jpg`; la geometría usa `docs/Imagen de Codex 27 ago 2026, 10_19_52 p.m..png`; la paleta se deriva de `docs/WhatsApp Image 2026-08-30 at 18.14.51.jpeg`.
- Mobile/touch y reduced motion conservan la misma profundidad cromática con frame estático o fallback CSS.
- No inventar precios, horarios, duración, dirección, testimonios, certificaciones ni claims médicos.
- No publicar, desplegar, mutar Supabase, imprimir secretos, borrar la reserva histórica, hacer commit o push.

---

### Task 1: Contrato rojo WhatsApp-only

**Files:**
- Create: `scripts/qa-whatsapp-only.mjs`
- Modify: `scripts/run-qa.mjs`
- Test: `scripts/qa-whatsapp-only.mjs`

**Interfaces:**
- Consumes: árbol actual y prompt maestro aprobado.
- Produces: pruebas fuente/estructura que exigen `buildWhatsAppUrl`, secciones técnicas, assets públicos, ausencia de booking y Three.js dinámico.

- [ ] **Step 1: Escribir las pruebas fallantes**

Crear tests con `node:test`, `readFile`, `access` y `assert` que comprueben:

```js
assert.match(pageSource, /<Techniques\s*\/>/);
assert.doesNotMatch(pageSource, /BookingProvider|Availability|MobileBookingSheet/);
assert.match(whatsappSource, /export function buildWhatsAppUrl/);
assert.match(reflexFieldSource, /pearlescent-foot\.png/);
assert.match(mineralSource, /import\("three"\)/);
assert.match(cssSource, /lili-lotus-background\.jpg/);
```

Comprobar además que `src/app/api/{availability,book,calendar,readiness}/route.ts`, `src/app/actions/booking.ts` y `src/components/providers/BookingProvider.tsx` estén ausentes.

- [ ] **Step 2: Verificar RED**

Run: `node --test scripts/qa-whatsapp-only.mjs`

Expected: FAIL porque booking sigue montado, los nuevos componentes no existen y el renderer todavía no usa Three.js.

- [ ] **Step 3: Integrar la suite sin borrar todavía las pruebas viejas**

Agregar el nuevo test a `scripts/run-qa.mjs` y mantener las verificaciones de runtime visual reutilizables.

### Task 2: Fuente de verdad comercial y WhatsApp

**Files:**
- Modify: `src/lib/config.ts`
- Modify: `src/lib/whatsapp.ts`
- Modify: `src/lib/types.ts`
- Test: `scripts/qa-whatsapp-only.mjs`

**Interfaces:**
- Produces: `buildWhatsAppUrl({ source, technique, promotion, message }): string`, `hasWhatsApp(): boolean`, `techniques`, `benefits`, `experienceSteps`, `faqs` y `nav` estáticos.
- Consumes: `NEXT_PUBLIC_WHATSAPP_NUMBER` con fallback `5491169702403`.

- [ ] **Step 1: Ejecutar el test focal y confirmar RED**

Run: `node --test scripts/qa-whatsapp-only.mjs`

- [ ] **Step 2: Reemplazar configuración de booking por contenido aprobado**

Definir las cuatro técnicas (`podal`, `manos`, `rostro`, `lectura`) y mensajes contextuales exactos del prompt, sin campos de calendario o duración inventada.

- [ ] **Step 3: Implementar el helper único**

```ts
export type WhatsAppRequest = {
  source: string;
  technique?: TechniqueId;
  promotion?: string;
  message?: string;
};

export function buildWhatsAppUrl(request: WhatsAppRequest): string {
  const text = request.message ?? messageFor(request);
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}`;
}
```

- [ ] **Step 4: Verificar el helper**

Run: `node --test scripts/qa-whatsapp-only.mjs`

Expected: los tests de configuración y enlaces pasan; los de UI/booking todavía fallan.

### Task 3: Assets, pie nacarado y sistema cromático

**Files:**
- Create: `public/brand/lili-lotus-background.jpg`
- Create: `public/brand/pearlescent-foot.png`
- Modify: `src/components/brand/ReflexField.tsx`
- Modify: `src/app/globals.css`
- Test: `scripts/qa-whatsapp-only.mjs`

**Interfaces:**
- Produces: un asset de fondo fijo, un asset de identidad y tres instancias de `ReflexField` que usan el mismo pie con encuadre por topología.
- Consumes: `topology: "hero" | "reflexology" | "benefits"` y paleta lavanda/rosa/nácar.

- [ ] **Step 1: Copiar los binarios sin transformar el original**

Run: `cp docs/360_F_1795791701_X5nS6eeh6M5YWG1Ph0CN9oNHJh1uSyJi.jpg public/brand/lili-lotus-background.jpg`

Run: `cp 'docs/Imagen de Codex 27 ago 2026, 10_19_52 p.m..png' public/brand/pearlescent-foot.png`

- [ ] **Step 2: Sustituir el fondo SVG señalado por el pie**

Usar `<image href="/brand/pearlescent-foot.png" ... preserveAspectRatio="xMidYMid meet" />` dentro de `reflex-field__ground`, con mezcla `screen`, ambientación detrás y overlays geométricos delante.

- [ ] **Step 3: Implementar tokens del flyer y fondo global**

Definir `--lili-night`, `--lili-deep-violet`, `--lili-orchid`, `--lili-lavender`, `--lili-pearl`, `--lili-blush`, `--lili-ivory` y `--lili-whatsapp`; usar el loto una sola vez en la capa fija global.

- [ ] **Step 4: Verificar assets y contrato**

Run: `node --test scripts/qa-whatsapp-only.mjs`

### Task 4: Landing semántica WhatsApp-only

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/layout/StickyCta.tsx`
- Modify: `src/components/layout/WhatsAppFloat.tsx`
- Modify: `src/components/sections/Hero.tsx`
- Create: `src/components/sections/Introduction.tsx`
- Create: `src/components/sections/Techniques.tsx`
- Create: `src/components/sections/TechniqueMap.tsx`
- Create: `src/components/sections/FootReading.tsx`
- Modify: `src/components/sections/Benefits.tsx`
- Create: `src/components/sections/Experience.tsx`
- Modify: `src/components/sections/Promotions.tsx`
- Modify: `src/components/sections/Questions.tsx`
- Modify: `src/components/sections/FinalCta.tsx`
- Test: `scripts/qa-whatsapp-only.mjs`

**Interfaces:**
- Produces: IDs `inicio`, `tecnicas`, `lectura-de-pies`, `experiencia`, `beneficios`, `promociones`, `preguntas`, `contacto`.
- Consumes: `site`, `buildWhatsAppUrl`, `ReflexField`, `next/image` y primitives existentes.

- [ ] **Step 1: Rehacer la composición como Server Component**

Quitar `force-dynamic`, fetch de disponibilidad y `BookingProvider`; montar el contenido estático y conservar `VisualStage` como único runtime global.

- [ ] **Step 2: Implementar hero e introducción**

Usar el copy exacto aprobado, una sola `h1`, CTA principal WhatsApp, CTA secundario a técnicas, fondo visible y pie protagonista.

- [ ] **Step 3: Implementar técnicas, mapa y lectura**

Los hotspots `Pies`, `Manos` y `Rostro` deben responder a hover, foco y tap; cada CTA genera un mensaje contextual con el helper.

- [ ] **Step 4: Implementar beneficios, experiencia y promociones prudentes**

Mostrar seis beneficios, cuatro pasos y, al no haber promociones comercialmente confirmadas, sustituir packs por las cuatro técnicas con `Consultar por WhatsApp`.

- [ ] **Step 5: Implementar FAQ, CTA, footer y chrome fijo**

Mantener acordeones accesibles, un CTA sticky mobile, un flotante sólo desktop y la leyenda complementaria de bienestar.

- [ ] **Step 6: Verificar GREEN estructural**

Run: `node --test scripts/qa-whatsapp-only.mjs`

Expected: PASS para estructura, copy, WhatsApp, assets y ausencia de booking visible.

### Task 5: Three.js global y retiro de booking

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/components/effects/MineralSurface.tsx`
- Modify: `src/lib/visual-system.ts`
- Modify: `scripts/qa-visual-system.mjs`
- Delete: `src/app/api/availability/route.ts`
- Delete: `src/app/api/book/route.ts`
- Delete: `src/app/api/calendar/route.ts`
- Delete: `src/app/api/readiness/route.ts`
- Delete: `src/app/actions/booking.ts`
- Delete: `src/components/providers/BookingProvider.tsx`
- Delete: `src/components/layout/MobileBookingSheet.tsx`
- Delete: booking-only libraries and tests after confirming zero consumers.
- Test: `scripts/qa-whatsapp-only.mjs`, `scripts/qa-visual-system.mjs`

**Interfaces:**
- Produces: un `THREE.WebGLRenderer`, `Scene`, `OrthographicCamera`, `PlaneGeometry` y `ShaderMaterial`, creados una vez y eliminados en cleanup.
- Consumes: `visualRuntime`, `resolveWebGLPolicy`, `surface` y uniforms de puntero/tiempo/resolución.

- [ ] **Step 1: Instalar Three.js**

Run: `npm install three`

- [ ] **Step 2: Reemplazar el WebGL manual por importación dinámica**

Dentro del efecto cliente ejecutar `const THREE = await import("three")`, crear el plano fullscreen y conservar las políticas `animated`, `static` y `fallback`.

- [ ] **Step 3: Actualizar tests del presupuesto visual**

Exigir un solo renderer/escena/plano y prohibir canvas/RAF por sección; mantener la cadencia 60/45/30, pausa en scroll y cleanup.

- [ ] **Step 4: Retirar booking sólo después de confirmar consumidores**

Run: `rg -n 'BookingProvider|availability|booking|reservations|supabase|calendar' src package.json env.example README.md`

Eliminar código runtime huérfano; conservar `data/reservations.json` intacto y fuera de Git.

- [ ] **Step 5: Ejecutar tests focales**

Run: `node --test scripts/qa-whatsapp-only.mjs scripts/qa-visual-system.mjs`

Expected: PASS.

### Task 6: Metadata, documentación y cierre verificable

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/manifest.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/opengraph-image.tsx`
- Modify: `README.md`
- Modify: `env.example`
- Modify: `scripts/qa-responsive-visual.mjs`
- Modify: `scripts/run-qa.mjs`

**Interfaces:**
- Produces: metadata aprobada, documentación WhatsApp-only y evidencia desktop/mobile/reduced-motion.

- [ ] **Step 1: Actualizar SEO y manifest**

Usar title `Reflexología Holística | Podal, manos, cráneo-facial y lectura de pies` y description aprobada; no inventar schema comercial.

- [ ] **Step 2: Limpiar documentación y ambiente**

Eliminar instrucciones activas de Supabase/booking y documentar assets, fallback, número configurable y gates de publicación.

- [ ] **Step 3: Ejecutar cierre técnico completo**

Run: `npm run lint`

Run: `npm run typecheck`

Run: `npm test`

Run: `npm run build`

- [ ] **Step 4: Ejecutar QA renderizada**

Usar Chrome aislado/CDP porque el Browser integrado devolvió cero instancias. Verificar 1440×900, 1024×768, 768×1024, 390×844, reduced motion, teclado, menú, FAQ, CTA y consola/red.

- [ ] **Step 5: Comparar referencias y capturas**

Abrir con `view_image` las tres referencias y las capturas finales; registrar cinco puntos de fidelidad: fondo, paleta, geometría/pie, glass/legibilidad y responsive.

- [ ] **Step 6: Verificar integridad histórica y estado final**

Run: `shasum -a 256 data/reservations.json`

Expected: `1c3d2f8aae85f14e893f4257441a21e7a5c8ddcf7c081e086d6cb888b477c5ad`.

Run: `git status --short --branch`

Reportar local QA por separado de autorización de assets, validación comercial, despliegue y aprobación de publicación.
