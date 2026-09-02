import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadWater() {
  try {
    return await import("../src/lib/transparent-water.ts");
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
    return null;
  }
}

function sampleFor(controller, {
  duration,
  frameMs,
  renderMs,
  gpuMs,
  startAt = 0,
}) {
  let snapshot = controller.getSnapshot();
  for (let time = startAt; time <= startAt + duration; time += frameMs) {
    snapshot = controller.sample({ time, frameMs, renderMs, gpuMs });
  }
  return snapshot;
}

test("water quality resolves a crisp four-tier GPU budget", async () => {
  const water = await loadWater();
  assert.ok(water, "expected the transparent water module to exist");

  assert.deepEqual(water.resolveWaterQuality({ policy: "animated", tier: "ultra" }), {
    tier: "ultra",
    targetFps: 60,
    pixelRatioCap: 1.75,
    simulationLongEdge: 512,
  });
  assert.deepEqual(water.resolveWaterQuality({ policy: "animated", tier: "high" }), {
    tier: "high",
    targetFps: 60,
    pixelRatioCap: 1.5,
    simulationLongEdge: 384,
  });
  assert.deepEqual(water.resolveWaterQuality({ policy: "animated", tier: "balanced" }), {
    tier: "balanced",
    targetFps: 45,
    pixelRatioCap: 1.25,
    simulationLongEdge: 320,
  });
  assert.deepEqual(water.resolveWaterQuality({ policy: "animated", tier: "recovery" }), {
    tier: "recovery",
    targetFps: 30,
    pixelRatioCap: 1,
    simulationLongEdge: 224,
  });
  assert.deepEqual(water.resolveWaterQuality({ policy: "static", tier: "ultra" }), {
    tier: "static",
    targetFps: 0,
    pixelRatioCap: 1,
    simulationLongEdge: 224,
  });
  assert.deepEqual(water.resolveWaterQuality({ policy: "fallback", tier: "ultra" }), {
    tier: "fallback",
    targetFps: 0,
    pixelRatioCap: 0,
    simulationLongEdge: 0,
  });

  assert.deepEqual(
    water.resolveWaterSimulationSize({ width: 1440, height: 900, longEdge: 512 }),
    { width: 512, height: 320 },
  );
  assert.deepEqual(
    water.resolveWaterSimulationSize({ width: 390, height: 844, longEdge: 224 }),
    { width: 128, height: 224 },
  );
});

test("adaptive water quality degrades quickly and recovers with hysteresis", async () => {
  const water = await loadWater();
  assert.ok(water, "expected the transparent water module to exist");
  const controller = water.createAdaptiveWaterQualityController();

  assert.deepEqual(controller.getSnapshot(), {
    tier: "high",
    targetFps: 60,
  });

  let at = 0;
  let snapshot = sampleFor(controller, {
    startAt: at,
    duration: 5_000,
    frameMs: 1000 / 60,
    renderMs: 3,
    gpuMs: 6,
  });
  assert.deepEqual(snapshot, { tier: "ultra", targetFps: 60 });

  at += 5_200;
  snapshot = sampleFor(controller, {
    startAt: at,
    duration: 900,
    frameMs: 24,
    renderMs: 17,
    gpuMs: 15,
  });
  assert.deepEqual(snapshot, { tier: "high", targetFps: 60 });

  at += 1_100;
  snapshot = sampleFor(controller, {
    startAt: at,
    duration: 900,
    frameMs: 27,
    renderMs: 20,
    gpuMs: 18,
  });
  assert.deepEqual(snapshot, { tier: "balanced", targetFps: 45 });

  at += 1_100;
  snapshot = sampleFor(controller, {
    startAt: at,
    duration: 900,
    frameMs: 38,
    renderMs: 28,
    gpuMs: 25,
  });
  assert.deepEqual(snapshot, { tier: "recovery", targetFps: 30 });

  controller.reset();
  controller.sample({ time: 0, frameMs: 400, renderMs: 1, gpuMs: null });
  assert.deepEqual(controller.getSnapshot(), { tier: "high", targetFps: 60 });
});

test("the height solver and optical shader produce transparent cursor water", async () => {
  const water = await loadWater();
  assert.ok(water, "expected the transparent water module to exist");
  const simulation = water.WATER_SIMULATION_FRAGMENT_SHADER ?? "";
  const surface = water.WATER_SURFACE_FRAGMENT_SHADER ?? "";

  assert.match(simulation, /uniform sampler2D uState/);
  assert.match(simulation, /uniform vec2 uPointer/);
  assert.match(simulation, /uniform float uImpulse/);
  assert.match(simulation, /laplacian/);
  assert.match(simulation, /velocity/);
  assert.match(simulation, /damping/);
  assert.match(simulation, /gaussian/);
  assert.doesNotMatch(simulation, /random|Math\.random|discard|while\s*\(/);

  assert.match(surface, /precision highp float/);
  assert.match(surface, /uniform sampler2D uHeightMap/);
  assert.match(surface, /waterNormal/);
  assert.match(surface, /fresnel/);
  assert.match(surface, /caustic/);
  assert.match(surface, /specular/);
  assert.match(surface, /gl_FragColor\s*=\s*vec4\([^;]*alpha/);
  assert.doesNotMatch(surface, /opaque|discard|while\s*\(/);
});

test("one shared renderer owns two-pass water and one passive pointer input", async () => {
  const [surfaceSource, stageSource] = await Promise.all([
    readFile(
      new URL("../src/components/effects/WaterSurface.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/components/effects/VisualStage.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(surfaceSource, /WATER_SIMULATION_FRAGMENT_SHADER/);
  assert.match(surfaceSource, /WATER_SURFACE_FRAGMENT_SHADER/);
  assert.equal((surfaceSource.match(/new THREE\.WebGLRenderer/g) ?? []).length, 1);
  assert.equal((surfaceSource.match(/new THREE\.ShaderMaterial/g) ?? []).length, 2);
  assert.equal((surfaceSource.match(/createWaterTarget\(/g) ?? []).length, 3);
  assert.equal(
    (surfaceSource.match(/addEventListener\("pointermove"/g) ?? []).length,
    1,
  );
  assert.equal(
    (surfaceSource.match(/removeEventListener\("pointermove"/g) ?? []).length,
    1,
  );
  assert.match(surfaceSource, /renderer\.render\(simulationScene, camera\)/);
  assert.match(surfaceSource, /renderer\.render\(displayScene, camera\)/);
  assert.doesNotMatch(surfaceSource, /requestAnimationFrame|setAnimationLoop|setInterval|setTimeout/);
  assert.match(stageSource, /import \{ WaterSurface \}/);
  assert.equal((stageSource.match(/<WaterSurface/g) ?? []).length, 1);

  for (const relativePath of [
    "../src/components/effects/MineralSurface.tsx",
    "../src/lib/volumetric-vapor.ts",
  ]) {
    await assert.rejects(readFile(new URL(relativePath, import.meta.url), "utf8"), {
      code: "ENOENT",
    });
  }
});

