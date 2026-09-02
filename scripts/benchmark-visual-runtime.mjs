import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const cdpHttpUrl = process.env.QA_CDP_HTTP_URL;
const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000/";
const label = process.env.QA_VISUAL_LABEL ?? "visual-runtime";
const outputPath = process.env.QA_OUTPUT_PATH;
const screenshotPath = process.env.QA_SCREENSHOT_PATH;

assert.ok(cdpHttpUrl, "QA_CDP_HTTP_URL is required");
assert.ok(outputPath, "QA_OUTPUT_PATH is required");

let commandId = 0;
const pendingCommands = new Map();

async function connectToPage() {
  const targets = await (await fetch(`${cdpHttpUrl}/json/list`)).json();
  const target = targets.find((entry) => entry.type === "page");
  assert.ok(target?.webSocketDebuggerUrl, "an isolated page target is required");

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

function percentile(sorted, fraction) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

function summarizeSample(sample) {
  const sorted = [...sample.intervals].sort((a, b) => a - b);
  const durationSeconds = sample.durationMs / 1_000;
  return {
    durationMs: Number(sample.durationMs.toFixed(1)),
    measuredFrames: sorted.length,
    fps: Number((sorted.length / durationSeconds).toFixed(2)),
    meanMs: Number(
      (sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length)).toFixed(2),
    ),
    p95Ms: Number(percentile(sorted, 0.95).toFixed(2)),
    framesOver32Ms: sorted.filter((value) => value > 32).length,
    longTasks: sample.longTasks,
    longTaskDurationMs: Number(sample.longTaskDurationMs.toFixed(2)),
    webglDraws: sample.webglDraws,
    webglState: sample.webglState,
    targetFps: sample.targetFps,
  };
}

function metricMap(result) {
  return Object.fromEntries(result.metrics.map(({ name, value }) => [name, value]));
}

function metricDelta(before, after, name) {
  return Number((((after[name] ?? 0) - (before[name] ?? 0)) * 1_000).toFixed(2));
}

const socket = await connectToPage();
const consoleIssues = [];
const networkFailures = [];

socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === "Runtime.exceptionThrown") {
    consoleIssues.push({
      type: "exception",
      text: message.params.exceptionDetails?.text ?? "Runtime exception",
    });
  }
  if (message.method === "Runtime.consoleAPICalled") {
    const { type, args } = message.params;
    if (!["error", "warning", "assert"].includes(type)) return;
    consoleIssues.push({
      type,
      text: args.map((arg) => arg.value ?? arg.description ?? "").join(" "),
    });
  }
  if (message.method === "Network.loadingFailed") {
    networkFailures.push({
      url: message.params.url,
      errorText: message.params.errorText,
      canceled: message.params.canceled === true,
    });
  }
});

try {
  await send(socket, "Page.enable");
  await send(socket, "Runtime.enable");
  await send(socket, "Network.enable");
  await send(socket, "Performance.enable");
  await send(socket, "Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send(socket, "Page.addScriptToEvaluateOnNewDocument", {
    source: `(() => {
      const state = window.__qaVisual = {
        webglDraws: 0,
        listeners: { add: {}, remove: {} },
      };
      const listenerName = (target) => target === window
        ? "window"
        : target === document
          ? "document"
          : "other";
      const originalAdd = EventTarget.prototype.addEventListener;
      const originalRemove = EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        const key = listenerName(this) + ":" + type;
        state.listeners.add[key] = (state.listeners.add[key] ?? 0) + 1;
        return originalAdd.call(this, type, listener, options);
      };
      EventTarget.prototype.removeEventListener = function(type, listener, options) {
        const key = listenerName(this) + ":" + type;
        state.listeners.remove[key] = (state.listeners.remove[key] ?? 0) + 1;
        return originalRemove.call(this, type, listener, options);
      };
      for (const method of ["drawArrays", "drawElements"]) {
        const originalDraw = WebGL2RenderingContext.prototype[method];
        WebGL2RenderingContext.prototype[method] = function(...args) {
          state.webglDraws += 1;
          return originalDraw.apply(this, args);
        };
      }
    })();`,
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
  await new Promise((resolve) => setTimeout(resolve, 1_500));

  const structural = await evaluate(
    socket,
    `(() => {
      const state = window.__qaVisual;
      const active = (key) =>
        (state.listeners.add[key] ?? 0) - (state.listeners.remove[key] ?? 0);
      const canvas = document.querySelector("canvas");
      return {
        title: document.title,
        nodes: document.querySelectorAll("*").length,
        canvases: document.querySelectorAll("canvas").length,
        webglContexts: canvas?.getContext("webgl2") ? 1 : 0,
        stages: document.querySelectorAll('[data-visual-runtime="shared"]').length,
        rafOwners: document.querySelectorAll('[data-visual-raf-owner="visual-stage"]').length,
        reflexFields: document.querySelectorAll('[data-reflex-field="true"]').length,
        atmosphereFields: document.querySelectorAll(".visual-atmosphere__field").length,
        atmospheres: document.querySelectorAll(".visual-atmosphere").length,
        svgNodes: document.querySelectorAll("svg *").length,
        digitopressureOverlays: document.querySelectorAll(
          '[data-digitopressure-overlay="true"]',
        ).length,
        digitopressureDescendants: document.querySelectorAll(
          '[data-digitopressure-overlay="true"] svg *',
        ).length,
        svgGaussianBlur: document.querySelectorAll("feGaussianBlur").length,
        svgGrainPatterns: document.querySelectorAll('pattern[id*="grain"]').length,
        bodyGrain: getComputedStyle(document.body, "::before").backgroundImage,
        windowScrollListeners: active("window:scroll"),
        windowPointerListeners: active("window:pointermove"),
        horizontalOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        webglState: canvas?.dataset.webglState ?? null,
        webglTargetFps: canvas?.dataset.visualTargetFps ?? null,
        activeSurface: canvas?.dataset.webglSurface ?? null,
        waterField: canvas?.dataset.waterField ?? null,
        waterQuality: canvas?.dataset.waterQuality ?? null,
        waterSimulation: canvas?.dataset.waterSimulation ?? null,
        waterPrecision: canvas?.dataset.waterPrecision ?? null,
        waterInteraction: canvas?.dataset.waterInteraction ?? null,
        waterPointerSamples: Number(canvas?.dataset.waterPointerSamples ?? 0),
        waterGpuMs: canvas?.dataset.waterGpuMs ?? null,
        visualMaterials: Number(canvas?.dataset.visualMaterials ?? 0),
        visualDrawCalls: Number(canvas?.dataset.visualDrawCalls ?? 0),
        visualTextures: Number(canvas?.dataset.visualTextures ?? 0),
        visualRenderTargets: Number(canvas?.dataset.visualRenderTargets ?? 0),
        ambientLightLayers: document.querySelectorAll(
          '[data-ambient-light-layer="true"]',
        ).length,
        ambientLights: document.querySelectorAll('[data-ambient-light="true"]')
          .length,
        initialJsDecodedBytes: performance.getEntriesByType("resource")
          .filter((entry) => new URL(entry.name).pathname.endsWith(".js"))
          .reduce(
            (total, entry) =>
              total + (entry.decodedBodySize || entry.transferSize || 0),
            0,
          ),
        initialCssDecodedBytes: performance.getEntriesByType("resource")
          .filter((entry) => new URL(entry.name).pathname.endsWith(".css"))
          .reduce(
            (total, entry) =>
              total + (entry.decodedBodySize || entry.transferSize || 0),
            0,
          ),
      };
    })()`,
  );

  const beforeMetrics = metricMap(await send(socket, "Performance.getMetrics"));
  const sampleExpression = (mode, durationMs) => `(() => new Promise((resolve) => {
    const mode = ${JSON.stringify(mode)};
    const requestedDuration = ${durationMs};
    const state = window.__qaVisual;
    const canvas = document.querySelector("canvas");
    let startDraws = state.webglDraws;
    const startY = window.scrollY;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    if (mode === "scroll") document.documentElement.style.scrollBehavior = "auto";
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const intervals = [];
    const longTaskEntries = [];
    const observer = typeof PerformanceObserver === "function"
      ? new PerformanceObserver((list) => longTaskEntries.push(...list.getEntries()))
      : null;
    try { observer?.observe({ entryTypes: ["longtask"] }); } catch {}
    let startedAt = 0;
    let previousAt = 0;
    const tick = (now) => {
      if (!startedAt) {
        startedAt = now;
        previousAt = now;
      } else {
        intervals.push(now - previousAt);
        previousAt = now;
      }
      const elapsed = now - startedAt;
      if (mode === "pointer") {
        const phase = elapsed / 380;
        window.dispatchEvent(new PointerEvent("pointermove", {
          clientX: window.innerWidth * (0.5 + Math.sin(phase) * 0.36),
          clientY: window.innerHeight * (0.5 + Math.cos(phase * 0.83) * 0.32),
        }));
      } else if (mode === "scroll") {
        const progress = 0.5 - Math.cos((elapsed / requestedDuration) * Math.PI * 2) * 0.5;
        window.scrollTo(0, maxScroll * progress);
        window.dispatchEvent(new Event("scroll"));
      }
      if (elapsed < requestedDuration) {
        requestAnimationFrame(tick);
        return;
      }
      const endDraws = state.webglDraws;
      observer?.disconnect();
      if (mode === "scroll") {
        window.scrollTo(0, startY);
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      }
      resolve({
        durationMs: elapsed,
        intervals,
        longTasks: longTaskEntries.length,
        longTaskDurationMs: longTaskEntries.reduce((sum, entry) => sum + entry.duration, 0),
        webglDraws: endDraws - startDraws,
        webglState: canvas?.dataset.webglState ?? null,
        targetFps: canvas?.dataset.visualTargetFps ?? null,
      });
    };
    if (mode === "scroll") {
      window.dispatchEvent(new Event("scroll"));
      requestAnimationFrame(() => {
        startDraws = state.webglDraws;
        requestAnimationFrame(tick);
      });
    } else {
      requestAnimationFrame(tick);
    }
  }))()`;

  const idle = summarizeSample(await evaluate(socket, sampleExpression("idle", 3_000)));
  const pointer = summarizeSample(
    await evaluate(socket, sampleExpression("pointer", 2_500)),
  );
  const scroll = summarizeSample(
    await evaluate(socket, sampleExpression("scroll", 3_500)),
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  const afterMetrics = metricMap(await send(socket, "Performance.getMetrics"));

  const headerTimeline = await evaluate(
    socket,
    `(() => new Promise(async (resolve) => {
      const positions = [0, 1, 48, 240, 720, 1400];
      const samples = [];
      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      const read = (position, moment) => {
        const header = document.querySelector("header");
        const style = getComputedStyle(header);
        samples.push({
          position,
          moment,
          className: header.className,
          backgroundColor: style.backgroundColor,
          backdropFilter: style.backdropFilter,
        });
      };
      for (const position of positions) {
        window.scrollTo(0, position);
        read(position, "sync");
        await new Promise((next) => requestAnimationFrame(() => next()));
        read(position, "raf-1");
        await new Promise((next) => requestAnimationFrame(() => next()));
        read(position, "raf-2");
        await new Promise((next) => setTimeout(next, 190));
        read(position, "settled");
      }
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event("scroll"));
      await new Promise((next) => setTimeout(next, 220));
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      resolve(samples);
    }))()`,
  );

  let screenshot = null;
  if (screenshotPath) {
    const capture = await send(socket, "Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    });
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await writeFile(screenshotPath, Buffer.from(capture.data, "base64"));
    screenshot = screenshotPath;
  }

  const report = {
    label,
    capturedAt: new Date().toISOString(),
    environment: {
      url: baseUrl,
      viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
      userAgent: await evaluate(socket, "navigator.userAgent"),
      renderer: await evaluate(
        socket,
        `(() => {
          const canvas = document.querySelector("canvas");
          const gl = canvas?.getContext("webgl2");
          const extension = gl?.getExtension("WEBGL_debug_renderer_info");
          return extension
            ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
            : "unavailable";
        })()`,
      ),
    },
    structural,
    runtime: { idle, pointer, scroll },
    mainThread: {
      taskDurationMs: metricDelta(beforeMetrics, afterMetrics, "TaskDuration"),
      scriptDurationMs: metricDelta(beforeMetrics, afterMetrics, "ScriptDuration"),
      layoutDurationMs: metricDelta(beforeMetrics, afterMetrics, "LayoutDuration"),
      recalcStyleDurationMs: metricDelta(
        beforeMetrics,
        afterMetrics,
        "RecalcStyleDuration",
      ),
    },
    headerTimeline,
    consoleIssues,
    networkFailures: networkFailures.filter(({ canceled }) => !canceled),
    screenshot,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  socket.close();
}
