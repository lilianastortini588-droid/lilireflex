import assert from "node:assert/strict";
import test from "node:test";

const cdpHttpUrl = process.env.QA_CDP_HTTP_URL;
const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000/";

if (!cdpHttpUrl) {
  throw new Error("QA_CDP_HTTP_URL is required for rendered visual runtime QA");
}

let commandId = 0;
const pendingCommands = new Map();

async function connectToPage() {
  const targets = await (await fetch(`${cdpHttpUrl}/json/list`)).json();
  const target = targets.find((entry) => entry.type === "page");
  assert.ok(target?.webSocketDebuggerUrl, "an isolated Chrome page target is required");

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const pending = pendingCommands.get(message.id);
    pendingCommands.delete(message.id);
    if (!pending) return;
    if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
    else pending.resolve(message.result);
  });
  return socket;
}

function send(socket, method, params = {}) {
  const id = ++commandId;
  const result = new Promise((resolve, reject) => {
    pendingCommands.set(id, { resolve, reject });
  });
  socket.send(JSON.stringify({ id, method, params }));
  return result;
}

async function evaluate(socket, expression) {
  const result = await send(socket, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  assert.equal(result.exceptionDetails, undefined, result.exceptionDetails?.text);
  return result.result.value;
}

async function installVisualProbe(socket) {
  await send(socket, "Page.addScriptToEvaluateOnNewDocument", {
    source: `(() => {
      if (window.__visualProbeInstalled) return;
      window.__visualProbeInstalled = true;
      const counts = window.__visualListenerCounts = { add: {}, remove: {}, webglDraws: 0 };
      const name = (target) => target === window ? "window" : target === document ? "document" : "other";
      const originalAdd = EventTarget.prototype.addEventListener;
      const originalRemove = EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        const key = name(this) + ":" + type;
        counts.add[key] = (counts.add[key] ?? 0) + 1;
        return originalAdd.call(this, type, listener, options);
      };
      EventTarget.prototype.removeEventListener = function(type, listener, options) {
        const key = name(this) + ":" + type;
        counts.remove[key] = (counts.remove[key] ?? 0) + 1;
        return originalRemove.call(this, type, listener, options);
      };
      for (const method of ["drawArrays", "drawElements"]) {
        const originalDraw = WebGL2RenderingContext.prototype[method];
        WebGL2RenderingContext.prototype[method] = function(...args) {
          counts.webglDraws += 1;
          return originalDraw.apply(this, args);
        };
      }
    })();`,
  });
}

test("the rendered page uses one global visual runtime and three compositional fields", async () => {
  const socket = await connectToPage();
  try {
    await send(socket, "Page.enable");
    await send(socket, "Runtime.enable");
    await installVisualProbe(socket);
    await send(socket, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const loaded = new Promise((resolve) => {
      const listener = ({ data }) => {
        const message = JSON.parse(data);
        if (message.method !== "Page.loadEventFired") return;
        socket.removeEventListener("message", listener);
        resolve();
      };
      socket.addEventListener("message", listener);
    });
    await send(socket, "Page.navigate", { url: baseUrl });
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 1_200));

    const observation = await evaluate(
      socket,
      `(() => {
        const counts = window.__visualListenerCounts;
        const active = (key) => (counts.add[key] ?? 0) - (counts.remove[key] ?? 0);
        const overlay = document.querySelector('[data-digitopressure-overlay="true"]');
        const overlaySvg = overlay?.querySelector('svg');
        const stage = document.querySelector('.visual-webgl-stage');
        const canvas = document.querySelector('canvas');
        const content = document.querySelector('#contenido');
        return {
          canvases: document.querySelectorAll("canvas").length,
          stages: document.querySelectorAll('[data-visual-runtime="shared"]').length,
          rafOwners: document.querySelectorAll('[data-visual-raf-owner="visual-stage"]').length,
          fields: document.querySelectorAll('[data-reflex-field="true"]').length,
          ambientLightLayers: document.querySelectorAll('[data-ambient-light-layer="true"]').length,
          ambientLights: document.querySelectorAll('[data-ambient-light="true"]').length,
          waterField: canvas?.dataset.waterField ?? null,
          waterQuality: canvas?.dataset.waterQuality ?? null,
          waterSimulation: canvas?.dataset.waterSimulation ?? null,
          waterPrecision: canvas?.dataset.waterPrecision ?? null,
          waterInteraction: canvas?.dataset.waterInteraction ?? null,
          waterPointerSamples: Number(canvas?.dataset.waterPointerSamples ?? 0),
          visualMaterials: Number(canvas?.dataset.visualMaterials ?? 0),
          visualDrawCalls: Number(canvas?.dataset.visualDrawCalls ?? 0),
          visualTextures: Number(canvas?.dataset.visualTextures ?? 0),
          visualRenderTargets: Number(canvas?.dataset.visualRenderTargets ?? 0),
          atmosphereFields: document.querySelectorAll(".visual-atmosphere__field").length,
          gaussianBlur: document.querySelectorAll("feGaussianBlur").length,
          grainPatterns: document.querySelectorAll('pattern[id*="grain"]').length,
          bodyGrain: getComputedStyle(document.body, "::before").backgroundImage,
          webglDraws: counts.webglDraws,
          windowScrollListeners: active("window:scroll"),
          windowPointerListeners: active("window:pointermove"),
          horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          digitopressureOverlays: document.querySelectorAll('[data-digitopressure-overlay="true"]').length,
          digitopressureSvgRoots: overlay?.querySelectorAll(':scope > svg').length ?? 0,
          digitopressureDescendants: overlaySvg?.querySelectorAll('*').length ?? 0,
          digitopressurePaths: overlaySvg?.querySelectorAll('path').length ?? 0,
          digitopressurePoints: overlaySvg?.querySelectorAll('[data-p]').length ?? 0,
          digitopressureFilters: overlaySvg?.querySelectorAll('filter, feGaussianBlur').length ?? 0,
          digitopressurePointerEvents: overlay ? getComputedStyle(overlay).pointerEvents : null,
          digitopressureAriaHidden: overlay?.getAttribute('aria-hidden') ?? null,
          digitopressureZ: overlay ? Number.parseInt(getComputedStyle(overlay).zIndex, 10) : null,
          canvasZ: canvas ? Number.parseInt(getComputedStyle(canvas).zIndex, 10) : null,
          stageZ: stage ? Number.parseInt(getComputedStyle(stage).zIndex, 10) : null,
          contentZ: content ? Number.parseInt(getComputedStyle(content).zIndex, 10) : null,
        };
      })()`,
    );

    assert.equal(observation.canvases, 1);
    assert.equal(observation.stages, 1);
    assert.equal(observation.rafOwners, 1);
    assert.equal(
      observation.windowScrollListeners,
      1,
      JSON.stringify(observation),
    );
    assert.equal(observation.windowPointerListeners, 1);
    assert.equal(observation.digitopressureOverlays, 1);
    assert.equal(observation.digitopressureSvgRoots, 1);
    assert.ok(observation.digitopressureDescendants <= 42);
    assert.ok(observation.digitopressurePaths <= 8);
    assert.ok(observation.digitopressurePoints <= 24);
    assert.equal(observation.digitopressureFilters, 0);
    assert.equal(observation.digitopressurePointerEvents, "none");
    assert.equal(observation.digitopressureAriaHidden, "true");
    assert.ok(observation.digitopressureZ > observation.canvasZ);
    assert.ok(observation.stageZ < observation.contentZ);
    assert.equal(observation.fields, 3);
    assert.equal(observation.ambientLightLayers, 0);
    assert.equal(observation.ambientLights, 0);
    assert.equal(observation.waterField, "heightfield-gpu");
    assert.ok(["high", "ultra"].includes(observation.waterQuality));
    assert.ok(["384x240", "512x320"].includes(observation.waterSimulation));
    assert.ok(["half-float", "uint8"].includes(observation.waterPrecision));
    assert.equal(observation.waterInteraction, "pointer-wave");
    assert.equal(observation.waterPointerSamples, 0);
    assert.equal(observation.visualMaterials, 2);
    assert.equal(observation.visualDrawCalls, 2);
    assert.equal(observation.visualTextures, 2);
    assert.equal(observation.visualRenderTargets, 2);
    assert.equal(observation.atmosphereFields, 0);
    assert.equal(observation.gaussianBlur, 0);
    assert.equal(observation.grainPatterns, 0);
    assert.notEqual(
      observation.bodyGrain,
      "none",
      "the one approved global body grain must remain rendered",
    );
    assert.ok(
      observation.webglDraws > 0,
      `the animated WebGL surface must draw before measurement (${observation.webglDraws})`,
    );
    assert.equal(observation.horizontalOverflow, 0);

    const pointerObservation = await evaluate(
      socket,
      `(() => new Promise((resolve) => {
        const canvas = document.querySelector('canvas');
        const counts = window.__visualListenerCounts;
        const beforeSamples = Number(canvas?.dataset.waterPointerSamples ?? 0);
        const beforeDraws = counts.webglDraws;
        for (const [x, y] of [[280, 240], [640, 380], [1120, 610]]) {
          window.dispatchEvent(new PointerEvent('pointermove', {
            bubbles: true,
            clientX: x,
            clientY: y,
            pointerType: 'mouse',
          }));
        }
        setTimeout(() => resolve({
          beforeSamples,
          afterSamples: Number(canvas?.dataset.waterPointerSamples ?? 0),
          pointerX: Number(canvas?.dataset.waterPointerX ?? -1),
          pointerY: Number(canvas?.dataset.waterPointerY ?? -1),
          draws: counts.webglDraws - beforeDraws,
        }), 180);
      }))()`,
    );
    assert.ok(pointerObservation.afterSamples >= pointerObservation.beforeSamples + 3);
    assert.ok(pointerObservation.pointerX > 0 && pointerObservation.pointerX < 1);
    assert.ok(pointerObservation.pointerY > 0 && pointerObservation.pointerY < 1);
    assert.ok(pointerObservation.draws >= 2, JSON.stringify(pointerObservation));

    const scrollObservation = await evaluate(
      socket,
      `(() => new Promise((resolve) => {
        document.documentElement.style.scrollBehavior = "auto";
        const counts = window.__visualListenerCounts;
        const maxScroll = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        let step = 0;
        const driveScroll = () => {
          step += 1;
          window.scrollTo(0, (step % 2 === 0 ? 0.72 : 0.28) * maxScroll);
          window.dispatchEvent(new Event("scroll"));
        };
        driveScroll();
        const startDraws = counts.webglDraws;
        const scrollTimer = setInterval(driveScroll, 40);
        setTimeout(() => {
          clearInterval(scrollTimer);
          const canvas = document.querySelector("canvas");
          resolve({
            draws: counts.webglDraws - startDraws,
            fpsTier: canvas?.dataset.visualFpsTier ?? null,
            targetFps: canvas?.dataset.visualTargetFps ?? null,
          });
        }, 640);
      }))()`,
    );

    assert.ok(
      scrollObservation.draws <= 2,
      `WebGL kept drawing during sustained scroll (${scrollObservation.draws} draws)`,
    );
    assert.equal(scrollObservation.fpsTier, "paused");
    assert.equal(scrollObservation.targetFps, "0");
  } finally {
    socket.close();
  }
});

test("map hover stays local while click and focus select the background motif", async () => {
  const socket = await connectToPage();
  try {
    await send(socket, "Page.enable");
    await send(socket, "Runtime.enable");
    await send(socket, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const loaded = new Promise((resolve) => {
      const listener = ({ data }) => {
        const message = JSON.parse(data);
        if (message.method !== "Page.loadEventFired") return;
        socket.removeEventListener("message", listener);
        resolve();
      };
      socket.addEventListener("message", listener);
    });
    await send(socket, "Page.navigate", { url: baseUrl });
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 1_200));

    const result = await evaluate(
      socket,
      `(() => new Promise(async (resolve) => {
        const section = document.querySelector('.technique-map-section');
        const handTab = document.querySelector('#map-tab-manos');
        const previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        const waitFor = async (condition, description, timeoutMs = 2500) => {
          const deadline = performance.now() + timeoutMs;
          while (performance.now() < deadline) {
            const value = condition();
            if (value) return true;
            await new Promise((next) => setTimeout(next, 20));
          }
          return false;
        };
        const readOpacity = (motif) => Number.parseFloat(
          getComputedStyle(
            document.querySelector('[data-digitopressure-motif="' + motif + '"]'),
          ).opacity,
        );
        const read = () => ({
          surface: document.querySelector('[data-digitopressure-overlay="true"]')?.dataset.surface ?? null,
          backgroundTechnique: section?.dataset.backgroundTechnique ?? null,
          foot: readOpacity('foot'),
          hand: readOpacity('hand'),
          face: readOpacity('face'),
        });

        section?.scrollIntoView({ block: 'center' });
        window.dispatchEvent(new Event('scroll'));
        const mapSettled = await waitFor(
          () =>
            document.querySelector('[data-digitopressure-overlay="true"]')?.dataset.surface === 'map' &&
            document.querySelector('canvas')?.dataset.visualFpsTier !== 'paused',
          'the map surface to settle',
        );
        if (!mapSettled) throw new Error('Timeout waiting for the map surface to settle');
        const beforeHover = read();

        handTab?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        await waitFor(
          () => handTab?.getAttribute('aria-selected') === 'true',
          'the hand tab hover state',
        );
        const afterHover = read();
        const hoverSelected = handTab?.getAttribute('aria-selected') ?? null;

        handTab?.click();
        await waitFor(
          () =>
            section?.dataset.backgroundTechnique === 'manos' &&
            readOpacity('hand') > readOpacity('foot'),
          'the hand motif after click',
        );
        const afterClick = read();

        handTab?.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          code: 'ArrowDown',
          bubbles: true,
        }));
        await waitFor(
          () =>
            section?.dataset.backgroundTechnique === 'rostro' &&
            readOpacity('face') > readOpacity('hand'),
          'the face motif after focus',
        );
        const afterFocus = read();
        const focusedId = document.activeElement?.id ?? null;

        document.documentElement.style.scrollBehavior = previousScrollBehavior;
        resolve({ beforeHover, afterHover, afterClick, afterFocus, hoverSelected, focusedId });
      }))()`,
    );

    assert.equal(result.beforeHover.surface, "map");
    assert.equal(result.beforeHover.backgroundTechnique, "podal");
    assert.equal(result.hoverSelected, "true");
    assert.equal(
      result.afterHover.backgroundTechnique,
      result.beforeHover.backgroundTechnique,
    );
    assert.equal(result.afterHover.hand, result.beforeHover.hand);
    assert.equal(result.afterClick.backgroundTechnique, "manos");
    assert.ok(result.afterClick.hand > result.afterClick.foot);
    assert.equal(
      result.afterFocus.backgroundTechnique,
      "rostro",
      JSON.stringify({ afterFocus: result.afterFocus, focusedId: result.focusedId }),
    );
    assert.equal(result.focusedId, "map-tab-rostro");
    assert.ok(result.afterFocus.face > result.afterFocus.hand);
  } finally {
    socket.close();
  }
});

test("visible sections and FAQ state select the approved pressure composition", async () => {
  const socket = await connectToPage();
  try {
    await send(socket, "Page.enable");
    await send(socket, "Runtime.enable");
    await send(socket, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const loaded = new Promise((resolve) => {
      const listener = ({ data }) => {
        const message = JSON.parse(data);
        if (message.method !== "Page.loadEventFired") return;
        socket.removeEventListener("message", listener);
        resolve();
      };
      socket.addEventListener("message", listener);
    });
    await send(socket, "Page.navigate", { url: baseUrl });
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 1_200));

    const result = await evaluate(
      socket,
      `(() => new Promise(async (resolve) => {
        const previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        const waitFor = async (condition, timeoutMs = 2500) => {
          const deadline = performance.now() + timeoutMs;
          while (performance.now() < deadline) {
            if (condition()) return true;
            await new Promise((next) => setTimeout(next, 20));
          }
          return false;
        };
        const read = () => {
          const opacity = (motif) => Number.parseFloat(
            getComputedStyle(
              document.querySelector('[data-digitopressure-motif="' + motif + '"]'),
            ).opacity,
          );
          return {
            surface: document.querySelector('[data-digitopressure-overlay="true"]')?.dataset.surface ?? null,
            foot: opacity('foot'),
            hand: opacity('hand'),
            face: opacity('face'),
            convergence: opacity('convergence'),
          };
        };
        const visit = async (selector, surface) => {
          document.querySelector(selector)?.scrollIntoView({ block: 'center' });
          window.dispatchEvent(new Event('scroll'));
          const settled = await waitFor(() =>
            document.querySelector('[data-digitopressure-overlay="true"]')?.dataset.surface === surface &&
            document.querySelector('canvas')?.dataset.visualFpsTier !== 'paused'
          );
          if (!settled) throw new Error('Timeout waiting for surface ' + surface);
          read();
          await new Promise(requestAnimationFrame);
          const transitionSettled = await waitFor(() =>
            !document.getAnimations().some((animation) =>
              animation.playState === 'running' &&
              animation.effect?.target?.closest?.('[data-digitopressure-overlay="true"]')
            )
          );
          if (!transitionSettled) {
            throw new Error('Timeout waiting for overlay transition on ' + surface);
          }
          return read();
        };

        const hero = read();
        const introduction = await visit('.introduction-section', 'introduction');
        const techniques = await visit('.techniques-section', 'techniques');
        const reading = await visit('.foot-reading-section', 'reading');
        const benefits = await visit('.benefits-section', 'benefits');
        const experience = await visit('.experience-section', 'experience');
        const promotions = await visit('.proposals-section', 'promotions');
        const questions = await visit('.questions-section', 'questions');

        const firstExpanded = document.querySelector('.faq-item button[aria-expanded="true"]');
        const openRingOpacity = Number.parseFloat(
          getComputedStyle(document.querySelector('.dp-ring')).opacity,
        );
        firstExpanded?.click();
        await waitFor(() => !document.querySelector('.faq-item.is-open'));
        const closedRingOpacity = Number.parseFloat(
          getComputedStyle(document.querySelector('.dp-ring')).opacity,
        );
        document.querySelector('#faq-trigger-tecnica')?.click();
        await waitFor(() =>
          document.querySelector('#faq-trigger-tecnica')?.getAttribute('aria-expanded') === 'true'
        );
        const reopenedRingOpacity = Number.parseFloat(
          getComputedStyle(document.querySelector('.dp-ring')).opacity,
        );

        const cta = await visit('.final-cta-section', 'cta');
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
        resolve({
          hero, introduction, techniques, reading, benefits, experience,
          promotions, questions, cta, openRingOpacity, closedRingOpacity,
          reopenedRingOpacity,
        });
      }))()`,
    );

    assert.ok(result.hero.foot > result.hero.hand);
    assert.equal(result.introduction.foot, result.introduction.hand);
    assert.ok(result.introduction.foot > result.introduction.face);
    assert.equal(result.techniques.foot, result.techniques.hand);
    assert.equal(result.techniques.hand, result.techniques.face);
    assert.ok(result.techniques.face > result.techniques.convergence);
    assert.ok(result.reading.foot > result.reading.hand);
    assert.equal(result.benefits.foot, result.benefits.hand);
    assert.ok(result.benefits.hand > result.benefits.face);
    assert.equal(result.experience.hand, result.experience.convergence);
    assert.ok(result.experience.hand > result.experience.foot);
    assert.ok(result.promotions.convergence > result.promotions.face);
    assert.ok(result.questions.face > result.questions.hand);
    assert.ok(result.openRingOpacity > result.closedRingOpacity);
    assert.ok(result.reopenedRingOpacity > result.closedRingOpacity);
    assert.equal(result.cta.foot, result.cta.hand);
    assert.equal(result.cta.hand, result.cta.convergence);
    assert.ok(result.cta.convergence > result.cta.face);
  } finally {
    socket.close();
  }
});

test("touch, reduced motion, and forced colors keep the overlay non-animated", async () => {
  const socket = await connectToPage();
  try {
    await send(socket, "Page.enable");
    await send(socket, "Runtime.enable");
    await installVisualProbe(socket);

    const navigateAndWait = async (url, expectedWebglState) => {
      const loaded = new Promise((resolve) => {
        const listener = ({ data }) => {
          const message = JSON.parse(data);
          if (message.method !== "Page.loadEventFired") return;
          socket.removeEventListener("message", listener);
          resolve();
        };
        socket.addEventListener("message", listener);
      });
      await send(socket, "Page.navigate", { url });
      await loaded;
      await evaluate(
        socket,
        `(() => new Promise(async (resolve) => {
          const deadline = performance.now() + 5000;
          while (performance.now() < deadline) {
            const canvas = document.querySelector('canvas');
            const state = canvas?.dataset.webglState;
            if (
              state === ${JSON.stringify(expectedWebglState)} &&
              (state === 'fallback' ||
                canvas?.dataset.visualDrawCalls === (state === 'animated' ? '2' : '1'))
            ) break;
            await new Promise((next) => setTimeout(next, 20));
          }
          await document.fonts.ready;
          resolve(true);
        }))()`,
      );
    };

    const observePreference = () =>
      evaluate(
        socket,
        `(() => new Promise(async (resolve) => {
          const overlay = document.querySelector('[data-digitopressure-overlay="true"]');
          const motif = document.querySelector('[data-digitopressure-motif="foot"]');
          const canvas = document.querySelector('canvas');
          const counts = window.__visualListenerCounts;
          const drawsAtReady = counts.webglDraws;
          await new Promise((next) => setTimeout(next, 500));
          resolve({
            display: overlay ? getComputedStyle(overlay).display : null,
            transitionDuration: motif ? getComputedStyle(motif).transitionDuration : null,
            animations: document.getAnimations().filter((animation) =>
              animation.effect?.target?.closest?.('[data-digitopressure-overlay="true"]')
            ).length,
            webglState: canvas?.dataset.webglState ?? null,
            waterField: canvas?.dataset.waterField ?? null,
            waterQuality: canvas?.dataset.waterQuality ?? null,
            waterSimulation: canvas?.dataset.waterSimulation ?? null,
            waterInteraction: canvas?.dataset.waterInteraction ?? null,
            waterPointerSamples: Number(canvas?.dataset.waterPointerSamples ?? 0),
            windowPointerListeners:
              (counts.add['window:pointermove'] ?? 0) -
              (counts.remove['window:pointermove'] ?? 0),
            visualMaterials: Number(canvas?.dataset.visualMaterials ?? 0),
            visualDrawCalls: Number(canvas?.dataset.visualDrawCalls ?? 0),
            drawsAtReady,
            drawsAfterWait: counts.webglDraws,
            innerWidth,
            clientWidth: document.documentElement.clientWidth,
            lotusOpacity: Number.parseFloat(
              getComputedStyle(document.querySelector('.visual-webgl-stage'), '::before').opacity,
            ),
          });
        }))()`,
      );

    await send(socket, "Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await send(socket, "Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    });
    await send(socket, "Emulation.setEmulatedMedia", {
      media: "screen",
      features: [
        { name: "prefers-reduced-motion", value: "no-preference" },
        { name: "forced-colors", value: "none" },
      ],
    });
    await navigateAndWait(`${baseUrl}?qa=overlay-touch`, "static");
    const touch = await observePreference();

    await send(socket, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send(socket, "Emulation.setTouchEmulationEnabled", { enabled: false });
    await send(socket, "Emulation.setEmulatedMedia", {
      media: "screen",
      features: [
        { name: "prefers-reduced-motion", value: "reduce" },
        { name: "forced-colors", value: "none" },
      ],
    });
    await navigateAndWait(`${baseUrl}?qa=overlay-reduced`, "static");
    const reduced = await observePreference();

    await send(socket, "Emulation.setDeviceMetricsOverride", {
      width: 319,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send(socket, "Emulation.setTouchEmulationEnabled", { enabled: false });
    await send(socket, "Emulation.setEmulatedMedia", {
      media: "screen",
      features: [
        { name: "prefers-reduced-motion", value: "no-preference" },
        { name: "forced-colors", value: "none" },
      ],
    });
    await navigateAndWait(`${baseUrl}?qa=overlay-tiny`, "fallback");
    const tinyViewport = await observePreference();

    await send(socket, "Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send(socket, "Emulation.setEmulatedMedia", {
      media: "screen",
      features: [
        { name: "prefers-reduced-motion", value: "no-preference" },
        { name: "forced-colors", value: "active" },
      ],
    });
    await navigateAndWait(`${baseUrl}?qa=overlay-forced-colors`, "animated");
    const forcedColors = await observePreference();

    assert.equal(touch.webglState, "static");
    assert.equal(touch.waterField, "heightfield-gpu");
    assert.equal(touch.waterQuality, "static");
    assert.equal(touch.waterInteraction, "static");
    assert.equal(touch.waterPointerSamples, 0);
    assert.equal(touch.windowPointerListeners, 0);
    assert.equal(touch.visualMaterials, 2);
    assert.equal(touch.visualDrawCalls, 1);
    assert.ok(touch.drawsAtReady > 0, JSON.stringify(touch));
    assert.equal(touch.drawsAfterWait, touch.drawsAtReady);
    assert.equal(touch.transitionDuration, "0s");
    assert.equal(touch.animations, 0);
    assert.equal(reduced.webglState, "static");
    assert.equal(reduced.waterField, "heightfield-gpu");
    assert.equal(reduced.waterQuality, "static");
    assert.equal(reduced.waterInteraction, "static");
    assert.equal(reduced.waterPointerSamples, 0);
    assert.equal(reduced.windowPointerListeners, 0);
    assert.equal(reduced.visualMaterials, 2);
    assert.equal(reduced.visualDrawCalls, 1);
    assert.ok(reduced.drawsAtReady > 0, JSON.stringify(reduced));
    assert.equal(reduced.drawsAfterWait, reduced.drawsAtReady);
    assert.equal(reduced.transitionDuration, "0s");
    assert.equal(reduced.animations, 0);
    assert.equal(tinyViewport.webglState, "fallback", JSON.stringify(tinyViewport));
    assert.equal(tinyViewport.waterField, "css-fallback");
    assert.equal(tinyViewport.waterQuality, "fallback");
    assert.equal(tinyViewport.waterInteraction, "none");
    assert.equal(tinyViewport.waterPointerSamples, 0);
    assert.equal(tinyViewport.windowPointerListeners, 0);
    assert.equal(tinyViewport.visualMaterials, 0);
    assert.equal(tinyViewport.visualDrawCalls, 0);
    assert.equal(tinyViewport.lotusOpacity, 0.78);
    assert.equal(forcedColors.display, "none");
  } finally {
    socket.close();
  }
});

test("rendered typography keeps approved line-height and text-action rhythm", async () => {
  const socket = await connectToPage();
  try {
    await send(socket, "Page.enable");
    await send(socket, "Runtime.enable");

    const navigateAndObserve = async ({ width, height, mobile }) => {
      await send(socket, "Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile,
      });
      await send(socket, "Emulation.setTouchEmulationEnabled", {
        enabled: mobile,
        ...(mobile ? { maxTouchPoints: 5 } : {}),
      });
      await send(socket, "Emulation.setEmulatedMedia", {
        media: "screen",
        features: [
          { name: "prefers-reduced-motion", value: "no-preference" },
          { name: "forced-colors", value: "none" },
        ],
      });

      const loaded = new Promise((resolve) => {
        const listener = ({ data }) => {
          const message = JSON.parse(data);
          if (message.method !== "Page.loadEventFired") return;
          socket.removeEventListener("message", listener);
          resolve();
        };
        socket.addEventListener("message", listener);
      });
      await send(socket, "Page.navigate", {
        url: `${baseUrl}?qa=typography-${width}`,
      });
      await loaded;

      return evaluate(
        socket,
        `(() => new Promise(async (resolve) => {
          await document.fonts.ready;
          document.querySelectorAll('.section').forEach((section) => {
            section.style.contentVisibility = 'visible';
          });
          await new Promise(requestAnimationFrame);
          const style = (selector) => {
            const node = document.querySelector(selector);
            return node ? getComputedStyle(node) : null;
          };
          const ratio = (selector) => {
            const computed = style(selector);
            return computed
              ? Number((parseFloat(computed.lineHeight) / parseFloat(computed.fontSize)).toFixed(2))
              : null;
          };
          const gap = (firstSelector, secondSelector) => {
            const first = document.querySelector(firstSelector)?.getBoundingClientRect();
            const second = document.querySelector(secondSelector)?.getBoundingClientRect();
            return first && second ? Number((second.top - first.bottom).toFixed(1)) : null;
          };
          resolve({
            lineRatios: {
              h1: ratio('.hero-copy h1'),
              h2: ratio('.introduction-copy h2'),
              h3: ratio('.technique-card h3'),
              body: ratio('.introduction-copy > p:not(.eyebrow)'),
              microcopy: ratio('.hero-microcopy'),
            },
            alignments: {
              body: style('.introduction-copy > p:not(.eyebrow)')?.textAlign ?? null,
              headingBody: style('.section-heading > p:last-child')?.textAlign ?? null,
              microcopy: style('.hero-microcopy')?.textAlign ?? null,
            },
            spacing: {
              heroEyebrowTitle: gap('.hero-copy .eyebrow', '.hero-copy h1'),
              heroTitleLead: gap('.hero-copy h1', '.hero-lead'),
              heroTextAction: gap('.hero-note', '.hero-actions'),
              heroActionMicrocopy: gap('.hero-actions', '.hero-microcopy'),
              introParagraphs: gap('.introduction-copy > p:nth-of-type(2)', '.introduction-copy > p:nth-of-type(3)'),
              techniqueAction: gap('.technique-card:first-child ul', '.technique-card:first-child .button-base'),
              readingAction: gap('.reading-clarification', '.foot-reading-copy .button-base'),
              experienceAction: gap('.experience-intro > p:not(.eyebrow)', '.experience-intro .button-base'),
              proposalAction: gap('.proposal-card:first-child > p:not(.eyebrow)', '.proposal-card:first-child .button-base'),
              questionsAction: gap('.questions-intro > p:not(.eyebrow)', '.questions-intro .button-base'),
              finalTitleText: gap('.final-cta-copy h2', '.final-cta-copy > p:not(.eyebrow)'),
              finalActionMicrocopy: gap('.final-cta-copy .button-base', '.final-cta-microcopy'),
            },
          });
        }))()`,
      );
    };

    const desktop = await navigateAndObserve({ width: 1440, height: 900, mobile: false });
    const mobile = await navigateAndObserve({ width: 390, height: 844, mobile: true });

    const assertRange = (value, minimum, maximum, label) => {
      assert.ok(
        value >= minimum && value <= maximum,
        `${label}: ${value} is outside ${minimum}-${maximum}`,
      );
    };
    const lineRanges = {
      desktop: {
        h1: [1, 1.08], h2: [1.06, 1.14], h3: [1.16, 1.3],
        body: [1.58, 1.72], microcopy: [1.45, 1.62],
      },
      mobile: {
        h1: [1.04, 1.12], h2: [1.08, 1.18], h3: [1.2, 1.34],
        body: [1.6, 1.76], microcopy: [1.48, 1.66],
      },
    };
    for (const [mode, observation] of Object.entries({ desktop, mobile })) {
      for (const [key, value] of Object.entries(observation.lineRatios)) {
        const [minimum, maximum] = lineRanges[mode][key];
        assertRange(value, minimum, maximum, `${mode}.${key}`);
      }
      assert.equal(observation.alignments.body, "left");
      assert.equal(observation.alignments.headingBody, "left");
      assert.equal(observation.alignments.microcopy, "left");
    }

    const desktopSpacing = {
      heroEyebrowTitle: [16, 24], heroTitleLead: [20, 32], heroTextAction: [24, 32],
      heroActionMicrocopy: [12, 18], introParagraphs: [12, 20], techniqueAction: [20, 32],
      readingAction: [24, 32], experienceAction: [24, 32], questionsAction: [24, 32],
      finalTitleText: [20, 32], finalActionMicrocopy: [12, 18],
    };
    const mobileSpacing = {
      heroEyebrowTitle: [12, 18], heroTitleLead: [16, 24], heroTextAction: [20, 28],
      heroActionMicrocopy: [12, 16], introParagraphs: [12, 18], techniqueAction: [18, 28],
      readingAction: [20, 28], experienceAction: [20, 28], questionsAction: [20, 28],
      finalTitleText: [16, 24], finalActionMicrocopy: [12, 16],
    };
    for (const [key, range] of Object.entries(desktopSpacing)) {
      assertRange(desktop.spacing[key], range[0], range[1], `desktop.${key}`);
    }
    for (const [key, range] of Object.entries(mobileSpacing)) {
      assertRange(mobile.spacing[key], range[0], range[1], `mobile.${key}`);
    }
    assert.ok(desktop.spacing.proposalAction >= 24);
    assert.ok(mobile.spacing.proposalAction >= 20);
  } finally {
    socket.close();
  }
});
