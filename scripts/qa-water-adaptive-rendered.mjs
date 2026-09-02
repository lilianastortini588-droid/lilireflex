import assert from "node:assert/strict";
import test from "node:test";

const cdpHttpUrl = process.env.QA_CDP_HTTP_URL;
const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000/";

if (!cdpHttpUrl) {
  throw new Error("QA_CDP_HTTP_URL is required for adaptive water QA");
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

async function navigate(socket, url) {
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
}

const readWater = (socket) =>
  evaluate(
    socket,
    `(() => {
      const canvas = document.querySelector('canvas');
      return {
        state: canvas?.dataset.webglState ?? null,
        tier: canvas?.dataset.waterQuality ?? null,
        targetFps: Number(canvas?.dataset.visualTargetFps ?? 0),
        simulation: canvas?.dataset.waterSimulation ?? null,
        gpuMs: canvas?.dataset.waterGpuMs ?? null,
      };
    })()`,
  );

test("rendered water degrades under measured pressure and returns to ultra", async () => {
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
    await send(socket, "Emulation.setTouchEmulationEnabled", { enabled: false });
    await send(socket, "Emulation.setEmulatedMedia", {
      media: "screen",
      features: [
        { name: "prefers-reduced-motion", value: "no-preference" },
        { name: "forced-colors", value: "none" },
      ],
    });
    await navigate(socket, `${baseUrl}?qa=water-autolevel`);
    await evaluate(
      socket,
      `(() => new Promise(async (resolve) => {
        const deadline = performance.now() + 5000;
        while (performance.now() < deadline) {
          const canvas = document.querySelector('canvas');
          if (canvas?.dataset.webglState === 'animated' && canvas.dataset.waterQuality === 'high') {
            resolve(true);
            return;
          }
          await new Promise((next) => setTimeout(next, 20));
        }
        resolve(false);
      }))()`,
    );
    const initial = await readWater(socket);
    assert.equal(initial.state, "animated");
    assert.equal(initial.tier, "high");
    assert.equal(initial.simulation, "384x240");

    await evaluate(
      socket,
      `(() => new Promise((resolve) => {
        const startedAt = performance.now();
        const burn = () => {
          const frameStartedAt = performance.now();
          while (performance.now() - frameStartedAt < 32) {
            Math.sqrt((performance.now() - frameStartedAt + 1) * 17.3);
          }
          if (performance.now() - startedAt < 2600) requestAnimationFrame(burn);
          else resolve(true);
        };
        requestAnimationFrame(burn);
      }))()`,
    );
    const degraded = await readWater(socket);
    assert.ok(["balanced", "recovery"].includes(degraded.tier), JSON.stringify(degraded));
    assert.ok([30, 45].includes(degraded.targetFps), JSON.stringify(degraded));
    assert.ok(["320x200", "224x140"].includes(degraded.simulation), JSON.stringify(degraded));

    await evaluate(
      socket,
      `(() => new Promise((resolve) => setTimeout(resolve, 11500)))()`,
    );
    const recovered = await readWater(socket);
    assert.equal(recovered.tier, "ultra", JSON.stringify(recovered));
    assert.equal(recovered.targetFps, 60);
    assert.equal(recovered.simulation, "512x320");
  } finally {
    socket.close();
  }
});

