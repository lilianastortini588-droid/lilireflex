import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as visualSystem from "../src/lib/visual-system.ts";
import { buildFieldGeometry } from "../src/lib/reflex-field/geometry.ts";
import * as fieldTopologies from "../src/lib/reflex-field/topologies.ts";

const {
  VISUAL_SURFACE_KINDS,
  getVisualSurface,
  pickActiveVisualSurface,
  resolveWebGLPolicy,
} = visualSystem;
const { buildTopology } = fieldTopologies;

const REQUIRED_SURFACES = [
  "header",
  "hero",
  "introduction",
  "techniques",
  "map",
  "reading",
  "benefits",
  "experience",
  "promotions",
  "questions",
  "cta",
  "footer",
];

test("every major page block has coordinated CSS and shared WebGL layers", () => {
  assert.deepEqual(VISUAL_SURFACE_KINDS, REQUIRED_SURFACES);

  for (const kind of REQUIRED_SURFACES) {
    const surface = getVisualSurface(kind);
    assert.equal(surface.kind, kind);
    assert.ok(surface.cssDetail.length > 0, `${kind} needs a CSS detail`);
    assert.ok(surface.webglIntensity > 0, `${kind} needs WebGL`);
  }
});

test("desktop fine-pointer devices receive the animated water shader", () => {
  assert.equal(
    resolveWebGLPolicy({
      reducedMotion: false,
      coarsePointer: false,
      saveData: false,
      viewportWidth: 1440,
      deviceMemory: 8,
    }),
    "animated",
  );
});

test("reduced motion and touch keep a static WebGL frame", () => {
  assert.equal(
    resolveWebGLPolicy({
      reducedMotion: true,
      coarsePointer: false,
      saveData: false,
      viewportWidth: 1440,
      deviceMemory: 8,
    }),
    "static",
  );
  assert.equal(
    resolveWebGLPolicy({
      reducedMotion: false,
      coarsePointer: true,
      saveData: false,
      viewportWidth: 390,
      deviceMemory: 8,
    }),
    "static",
  );
});

test("data saving, low memory, and tiny viewports fall back to CSS and SVG", () => {
  const base = {
    reducedMotion: false,
    coarsePointer: false,
    saveData: false,
    viewportWidth: 1440,
    deviceMemory: 8,
  };

  assert.equal(resolveWebGLPolicy({ ...base, saveData: true }), "fallback");
  assert.equal(resolveWebGLPolicy({ ...base, deviceMemory: 2 }), "fallback");
  assert.equal(resolveWebGLPolicy({ ...base, viewportWidth: 319 }), "fallback");
});

test("the surface crossing the viewport focus line controls the shared shader", () => {
  assert.equal(
    pickActiveVisualSurface(
      [
        { kind: "benefits", top: -420, bottom: 210 },
        { kind: "promotions", top: 210, bottom: 794 },
        { kind: "questions", top: 794, bottom: 1430 },
      ],
      900,
      false,
    ),
    "promotions",
  );
});

test("a visible footer owns the shader at the document end", () => {
  assert.equal(
    pickActiveVisualSurface(
      [
        { kind: "cta", top: 80, bottom: 720 },
        { kind: "footer", top: 720, bottom: 900 },
      ],
      900,
      true,
    ),
    "footer",
  );
});

test("the hero field produces layered organic geometry instead of a flat node graph", () => {
  const graph = buildTopology("hero", 0.5, 1);
  const geometry = buildFieldGeometry(graph, "hero", 0.5);

  assert.equal(geometry.flows.length, graph.links.length);
  assert.ok(geometry.contours.length >= 6, "hero needs several pressure contours");
  assert.ok(geometry.satellites.length >= 8, "hero needs a distant node layer");

  for (const shape of [...geometry.flows, ...geometry.contours]) {
    assert.match(shape.d, /C/);
    assert.doesNotMatch(shape.d, /NaN|undefined/);
    assert.ok(shape.opacity > 0 && shape.opacity <= 1);
  }
});

test("benefit focus changes field geometry while keeping its visual grammar", () => {
  const calmGraph = buildTopology("benefits", 0.12, 1);
  const groundedGraph = buildTopology("benefits", 0.9, 1);
  const calm = buildFieldGeometry(calmGraph, "benefits", 0.12);
  const grounded = buildFieldGeometry(groundedGraph, "benefits", 0.9);

  assert.equal(calm.flows.length, grounded.flows.length);
  assert.equal(calm.contours.length, grounded.contours.length);
  assert.notEqual(calm.flows[0]?.d, grounded.flows[0]?.d);
  assert.notDeepEqual(calm.satellites, grounded.satellites);
});

test("focused fields keep enough horizontal coverage to read as compositions", () => {
  const coverage = (kind, focus) => {
    const graph = buildTopology(kind, focus, 1);
    const xs = graph.nodes.map((node) => node.x);
    return Math.max(...xs) - Math.min(...xs);
  };

  assert.ok(coverage("reflexology", 0.5) >= 40);
  assert.ok(coverage("benefits", 0.5) >= 46);
});

test("the mobile navigation stays above the document stacking context", async () => {
  const [headerSource, cssSource] = await Promise.all([
    readFile(new URL("../src/components/layout/Header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(headerSource, /site-header/);
  assert.match(cssSource, /\.site-header\s*\{[^}]*position:\s*fixed/si);
  assert.match(cssSource, /\.site-header\s*\{[^}]*z-index:\s*40/si);
  assert.match(cssSource, /#contenido\s*\{[^}]*padding-top:\s*var\(--header-h\)/si);
});

test("the visual refinement exposes one fluid rhythm and three material tiers", async () => {
  const [cssSource, heroSource, introductionSource, techniquesSource, mapSource,
    readingSource, benefitsSource, experienceSource, proposalsSource, questionsSource,
    ctaSource] = await Promise.all([
    readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/Hero.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/Introduction.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/Techniques.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/TechniqueMap.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/FootReading.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/Benefits.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/Experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/Promotions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/Questions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/sections/FinalCta.tsx", import.meta.url), "utf8"),
  ]);

  for (const token of [
    "--page-gutter",
    "--section-space",
    "--section-space-compact",
    "--content-gap",
    "--card-gap",
    "--header-offset",
    "--reading-measure",
    "--content-max",
  ]) {
    assert.match(
      cssSource,
      new RegExp(`${token.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&")}\\s*:\\s*[^;]+;`),
      `missing a concrete value for ${token}`,
    );
  }

  for (const tier of ["glass-a", "glass-b", "glass-c"]) {
    assert.match(cssSource, new RegExp(`\\.${tier}\\s*\\{`));
  }

  assert.match(heroSource, /glass-a/);
  assert.match(readingSource, /glass-a/);
  assert.match(ctaSource, /glass-a/);

  for (const source of [
    introductionSource,
    techniquesSource,
    mapSource,
    benefitsSource,
    experienceSource,
    proposalsSource,
  ]) {
    assert.match(source, /glass-b/);
  }

  assert.match(mapSource, /glass-c/);
  assert.match(questionsSource, /glass-c/);
  assert.equal(
    (cssSource.match(/backdrop-filter:/g) ?? []).length,
    4,
    "the refinement must not increase the existing blur declarations",
  );
});

test("scroll consumers only react to thresholds and surface changes", async () => {
  const [stageSource, headerSource, stickySource, whatsappSource, runtimeSource] =
    await Promise.all([
      readFile(
        new URL("../src/components/effects/VisualStage.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../src/components/layout/Header.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../src/components/layout/StickyCta.tsx", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../src/components/layout/WhatsAppFloat.tsx", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../src/lib/visual-runtime.ts", import.meta.url), "utf8"),
    ]);

  assert.match(runtimeSource, /useVisualScrollThreshold/);
  assert.match(headerSource, /useVisualScrollThreshold\(0\)/);
  assert.match(stickySource, /useVisualScrollThreshold\(420\)/);
  assert.match(whatsappSource, /useVisualScrollThreshold\(280\)/);
  assert.doesNotMatch(headerSource, /useVisualScrollSnapshot/);
  assert.doesNotMatch(stickySource, /useVisualScrollSnapshot/);
  assert.doesNotMatch(whatsappSource, /useVisualScrollSnapshot/);
  assert.match(stageSource, /subscribeScroll/);
  assert.match(stageSource, /snapshot\.scrolling/);
  assert.doesNotMatch(stageSource, /subscribeFrame/);
  assert.doesNotMatch(stageSource, /style\.setProperty/);
});

test("the global water solver stays inside the approved two-pass engine budget", async () => {
  const [surfaceSource, waterSource] = await Promise.all([
    readFile(
      new URL(
        "../src/components/effects/WaterSurface.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../src/lib/transparent-water.ts", import.meta.url), "utf8"),
  ]);
  const simulation =
    waterSource.match(
      /export const WATER_SIMULATION_FRAGMENT_SHADER = `([\s\S]*?)`;/,
    )?.[1] ?? "";
  const surface =
    waterSource.match(
      /export const WATER_SURFACE_FRAGMENT_SHADER = `([\s\S]*?)`;/,
    )?.[1] ?? "";

  assert.match(simulation, /sampler2D uState/);
  assert.match(surface, /sampler2D uHeightMap/);
  assert.doesNotMatch(`${simulation}\n${surface}`, /while\s*\(/);
  assert.match(surfaceSource, /import\("three"\)/);
  assert.equal((surfaceSource.match(/new THREE\.WebGLRenderer/g) ?? []).length, 1);
  assert.equal((surfaceSource.match(/new THREE\.Scene/g) ?? []).length, 2);
  assert.equal(
    (surfaceSource.match(/new THREE\.OrthographicCamera/g) ?? []).length,
    1,
  );
  assert.equal((surfaceSource.match(/new THREE\.PlaneGeometry/g) ?? []).length, 1);
  assert.equal((surfaceSource.match(/new THREE\.ShaderMaterial/g) ?? []).length, 2);
  assert.equal(
    (surfaceSource.match(/renderer\.render\([^,]+, camera\)/g) ?? []).length,
    2,
  );
  assert.equal((surfaceSource.match(/createWaterTarget\(/g) ?? []).length, 3);
  assert.doesNotMatch(surfaceSource, /document\.createElement\(["']canvas/);
  assert.doesNotMatch(surfaceSource, /createFramebuffer|requestAnimationFrame/);
});

test("one visual runtime coalesces every frame subscriber and scroll update", () => {
  assert.equal(typeof visualSystem.createVisualRuntime, "function");

  let queuedFrame;
  let requested = 0;
  let cancelled = 0;
  const runtime = visualSystem.createVisualRuntime?.({
    requestFrame(callback) {
      requested += 1;
      queuedFrame = callback;
      return requested;
    },
    cancelFrame() {
      cancelled += 1;
      queuedFrame = undefined;
    },
  });
  assert.ok(runtime);

  const observed = [];
  const first = runtime.subscribeFrame((frame) => observed.push(["first", frame]));
  const second = runtime.subscribeFrame((frame) => observed.push(["second", frame]));
  let scrollNotifications = 0;
  const scroll = runtime.subscribeScroll(() => {
    scrollNotifications += 1;
  });

  runtime.setContinuous(true);
  runtime.updateScroll({
    scrollY: 320,
    scrollHeight: 2_000,
    viewportWidth: 1_440,
    viewportHeight: 900,
    scrolling: false,
  });
  assert.equal(requested, 1, "all invalidations must share the queued frame");

  const firstFrame = queuedFrame;
  queuedFrame = undefined;
  firstFrame?.(16);
  assert.equal(observed.length, 2, "both consumers receive the same frame");
  assert.equal(observed[0][1], observed[1][1]);
  assert.deepEqual(runtime.getScrollSnapshot(), {
    scrollY: 320,
    progress: 320 / 1_100,
    viewportWidth: 1_440,
    viewportHeight: 900,
    scrolling: false,
  });
  assert.equal(scrollNotifications, 1);
  assert.equal(requested, 2, "continuous mode queues exactly one next frame");

  runtime.updateScroll({
    scrollY: 420,
    scrollHeight: 2_000,
    viewportWidth: 1_440,
    viewportHeight: 900,
    scrolling: true,
  });
  const scrollFrame = queuedFrame;
  queuedFrame = undefined;
  scrollFrame?.(32);
  assert.equal(requested, 2, "scrolling pauses the continuous visual loop");
  assert.equal(scrollNotifications, 2);

  runtime.updateScroll({
    scrollY: 420,
    scrollHeight: 2_000,
    viewportWidth: 1_440,
    viewportHeight: 900,
    scrolling: false,
  });
  assert.equal(requested, 3, "quiet scroll state resumes the same loop");

  first();
  second();
  scroll();
  runtime.dispose();
  assert.equal(cancelled, 1);
});

test("the shared RAF uses a cadence gate without scheduling another frame", () => {
  assert.equal(typeof visualSystem.createFrameCadenceGate, "function");
  const gate = visualSystem.createFrameCadenceGate?.();
  assert.ok(gate);

  assert.equal(gate.shouldDraw(0, 1000 / 30), true);
  assert.equal(gate.shouldDraw(16, 1000 / 30), false);
  assert.equal(gate.shouldDraw(34, 1000 / 30), true);
  gate.requestImmediate();
  assert.equal(gate.shouldDraw(35, 1000 / 30), true);
  gate.reset();
  assert.equal(gate.shouldDraw(80, null), false);
  assert.equal(gate.shouldDraw(96, 1000 / 60), true);
});

test("animated WebGL yields to scrolling and uses an adaptive cadence", () => {
  assert.equal(typeof visualSystem.resolveWebGLFrameInterval, "function");

  assert.equal(
    visualSystem.resolveWebGLFrameInterval?.({
      policy: "animated",
      scrolling: true,
      targetFps: 60,
    }),
    null,
  );
  assert.equal(
    visualSystem.resolveWebGLFrameInterval?.({
      policy: "animated",
      scrolling: false,
      targetFps: 60,
    }),
    1000 / 60,
  );
  assert.equal(
    visualSystem.resolveWebGLFrameInterval?.({
      policy: "animated",
      scrolling: false,
      targetFps: 45,
    }),
    1000 / 45,
  );
  assert.equal(
    visualSystem.resolveWebGLFrameInterval?.({
      policy: "animated",
      scrolling: false,
      targetFps: 30,
    }),
    1000 / 30,
  );
  assert.equal(
    visualSystem.resolveWebGLFrameInterval?.({
      policy: "static",
      scrolling: false,
      targetFps: 60,
    }),
    null,
  );
});

test("sustained measured FPS changes cadence gradually and recovers with hysteresis", () => {
  assert.equal(typeof visualSystem.createAdaptiveFpsController, "function");
  const controller = visualSystem.createAdaptiveFpsController();
  let time = 0;

  const sampleFor = (fps, durationMs) => {
    const frameMs = 1000 / fps;
    const end = time + durationMs;
    while (time < end) {
      time += frameMs;
      controller.sample(time);
    }
    return controller.getSnapshot();
  };

  assert.deepEqual(sampleFor(60, 1_000), {
    tier: "smooth",
    targetFps: 60,
  });
  assert.deepEqual(sampleFor(42, 500), {
    tier: "smooth",
    targetFps: 60,
  });
  assert.deepEqual(sampleFor(42, 1_200), {
    tier: "balanced",
    targetFps: 45,
  });
  assert.deepEqual(sampleFor(28, 1_500), {
    tier: "recovery",
    targetFps: 30,
  });
  assert.deepEqual(sampleFor(60, 1_900), {
    tier: "balanced",
    targetFps: 45,
  });
  assert.deepEqual(sampleFor(60, 1_900), {
    tier: "smooth",
    targetFps: 60,
  });
});

test("measurement gaps reset FPS pressure without reducing canvas quality", () => {
  assert.equal(typeof visualSystem.createAdaptiveFpsController, "function");
  assert.equal(typeof visualSystem.resolveWebGLPixelRatio, "function");
  const controller = visualSystem.createAdaptiveFpsController();

  controller.sample(0);
  controller.sample(1_000);
  assert.deepEqual(controller.getSnapshot(), {
    tier: "smooth",
    targetFps: 60,
  });

  assert.equal(
    visualSystem.resolveWebGLPixelRatio({
      policy: "animated",
      devicePixelRatio: 2,
    }),
    1.35,
  );
  assert.equal(
    visualSystem.resolveWebGLPixelRatio({
      policy: "static",
      devicePixelRatio: 2,
    }),
    1,
  );
});
