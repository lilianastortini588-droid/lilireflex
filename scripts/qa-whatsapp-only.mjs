import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

function source(path) {
  return readFile(new URL(path, root), "utf8");
}

async function exists(path) {
  try {
    await access(new URL(path, root));
    return true;
  } catch {
    return false;
  }
}

test("the home page is static, WhatsApp-only, and contains the approved journey", async () => {
  const pageSource = await source("src/app/page.tsx");

  assert.doesNotMatch(
    pageSource,
    /BookingProvider|Availability|MobileBookingSheet|getAvailabilitySnapshot|deriveReadiness|force-dynamic/,
  );
  assert.match(pageSource, /<Hero\s*\/>/);
  assert.match(pageSource, /<Introduction\s*\/>/);
  assert.match(pageSource, /<Techniques\s*\/>/);
  assert.match(pageSource, /<TechniqueMap\s*\/>/);
  assert.match(pageSource, /<FootReading\s*\/>/);
  assert.match(pageSource, /<Experience\s*\/>/);
  assert.match(pageSource, /<Questions\s*\/>/);
  assert.match(pageSource, /<FinalCta\s*\/>/);
});

test("one helper owns every contextual WhatsApp URL", async () => {
  const [configSource, whatsappSource] = await Promise.all([
    source("src/lib/config.ts"),
    source("src/lib/whatsapp.ts"),
  ]);

  assert.match(configSource, /fullName:\s*"REFLEXOLOGÍA HOLÍSTICA"/);
  assert.match(configSource, /NEXT_PUBLIC_WHATSAPP_NUMBER\s*\?\?\s*"5491169702403"/);
  assert.match(configSource, /id:\s*"podal"/);
  assert.match(configSource, /id:\s*"manos"/);
  assert.match(configSource, /id:\s*"rostro"/);
  assert.match(configSource, /id:\s*"lectura"/);

  assert.match(whatsappSource, /export function buildWhatsAppUrl/);
  assert.match(whatsappSource, /encodeURIComponent/);
  assert.match(whatsappSource, /noopener noreferrer|wa\.me/);
  assert.doesNotMatch(whatsappSource, /reservation|dateKey|time|formatDateLong/);
});

test("the accepted lotus and pearlescent foot assets are production inputs", async () => {
  assert.equal(await exists("public/brand/lili-lotus-background.jpg"), true);
  assert.equal(await exists("public/brand/pearlescent-foot.png"), true);

  const [fieldSource, cssSource] = await Promise.all([
    source("src/components/brand/ReflexField.tsx"),
    source("src/app/globals.css"),
  ]);

  assert.match(fieldSource, /pearlescent-foot\.png/);
  assert.match(fieldSource, /<image/);
  assert.match(fieldSource, /preserveAspectRatio="xMidYMid meet"/);
  assert.match(cssSource, /lili-lotus-background\.jpg/);
  assert.match(cssSource, /--lili-night:\s*#0b0712/i);
  assert.match(cssSource, /--lili-whatsapp:\s*#25d366/i);
});

test("the global WaterSurface uses one dynamically loaded Three.js renderer", async () => {
  const waterSource = await source("src/components/effects/WaterSurface.tsx");

  assert.match(waterSource, /import\("three"\)/);
  assert.equal((waterSource.match(/new THREE\.WebGLRenderer/g) ?? []).length, 1);
  assert.equal((waterSource.match(/new THREE\.Scene/g) ?? []).length, 2);
  assert.match(waterSource, /new THREE\.OrthographicCamera/);
  assert.match(waterSource, /new THREE\.PlaneGeometry/);
  assert.equal((waterSource.match(/new THREE\.ShaderMaterial/g) ?? []).length, 2);
  assert.doesNotMatch(waterSource, /document\.createElement\("canvas"\)/);
});

test("booking, calendar, readiness, and managed persistence are absent from runtime", async () => {
  const forbidden = [
    "src/app/api/availability/route.ts",
    "src/app/api/book/route.ts",
    "src/app/api/calendar/route.ts",
    "src/app/api/readiness/route.ts",
    "src/app/actions/booking.ts",
    "src/components/providers/BookingProvider.tsx",
    "src/components/layout/MobileBookingSheet.tsx",
  ];

  const results = await Promise.all(forbidden.map((path) => exists(path)));
  assert.deepEqual(
    results,
    forbidden.map(() => false),
    forbidden.filter((_, index) => results[index]).join(", "),
  );
});

test("visible conversion copy never offers booking or an internal agenda", async () => {
  const visibleSources = await Promise.all([
    source("src/app/page.tsx"),
    source("src/components/layout/Header.tsx"),
    source("src/components/layout/StickyCta.tsx"),
    source("src/components/layout/WhatsAppFloat.tsx"),
    source("src/components/sections/Hero.tsx"),
    source("src/components/sections/Promotions.tsx"),
    source("src/components/sections/FinalCta.tsx"),
  ]);

  const combined = visibleSources.join("\n");
  assert.doesNotMatch(
    combined,
    /Reservar turno|Ver turnos|Tomar este horario|agenda de ejemplo|disponibilidad real antes de coordinar/i,
  );
  assert.match(combined, /Coordinar una sesión por WhatsApp/);
  assert.match(combined, /Hablar con Lili por WhatsApp/);
});
