import assert from "node:assert/strict";
import test from "node:test";

const cdpHttpUrl = process.env.QA_CDP_HTTP_URL;
const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000/";

if (!cdpHttpUrl) {
  throw new Error("QA_CDP_HTTP_URL is required for rendered wordmark QA");
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

async function navigate(socket, { width, height, mobile = false, reducedMotion = false }) {
  await send(socket, "Page.enable");
  await send(socket, "Runtime.enable");
  await send(socket, "Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  await send(socket, "Emulation.setEmulatedMedia", {
    media: "screen",
    features: [
      { name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" },
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
  await send(socket, "Page.navigate", { url: baseUrl });
  await loaded;
  await evaluate(
    socket,
    `(async () => {
      await document.fonts.ready;
      await Promise.race([
        Promise.all([...document.images].map((image) => image.complete
          ? Promise.resolve()
          : new Promise((resolve) => image.addEventListener('load', resolve, { once: true })))),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);
      await new Promise((resolve) => setTimeout(resolve, 320));
      return true;
    })()`,
  );
}

test("the official Lili logo is substantial and readable in the desktop header and footer", async () => {
  const socket = await connectToPage();
  try {
    await navigate(socket, { width: 1440, height: 900 });
    const observation = await evaluate(
      socket,
      `(async () => {
        const header = document.querySelector('.site-header .brand-wordmark');
        const footer = document.querySelector('.site-footer .brand-wordmark');
        footer?.scrollIntoView({ block: 'center' });
        await Promise.all([...document.querySelectorAll('.brand-wordmark img')].map((image) => image.decode().catch(() => {})));
        await new Promise((resolve) => setTimeout(resolve, 120));
        const images = [...document.querySelectorAll('.brand-wordmark img')];
        const describe = (node) => {
          const rect = node?.getBoundingClientRect();
          return rect ? { width: rect.width, height: rect.height } : null;
        };
        return {
          count: images.length,
          sources: images.map((image) => image.currentSrc || image.src),
          ratios: images.map((image) => image.naturalWidth / image.naturalHeight),
          header: describe(header),
          footer: describe(footer),
          headerHeight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      })()`,
    );

    assert.equal(observation.count, 2, JSON.stringify(observation));
    assert.ok(observation.sources.every((source) => source.includes("logo")), JSON.stringify(observation));
    assert.ok(observation.sources.every((source) => !source.includes("pearlescent-foot")));
    assert.ok(observation.ratios.every((ratio) => Math.abs(ratio - 2001 / 786) < 0.02));
    assert.ok(observation.header.width >= 220 && observation.header.width <= 260, JSON.stringify(observation));
    assert.ok(observation.footer.width >= 400 && observation.footer.width <= 460, JSON.stringify(observation));
    assert.ok(observation.headerHeight >= 92, JSON.stringify(observation));
    assert.equal(observation.overflow, 0);
  } finally {
    socket.close();
  }
});

test("mouse movement changes the logo plane while touch and reduced motion remain static", async () => {
  const socket = await connectToPage();
  try {
    await navigate(socket, { width: 1440, height: 900 });
    const mouse = await evaluate(
      socket,
      `(async () => {
        const wordmark = document.querySelector('.site-header .brand-wordmark');
        const plane = wordmark?.querySelector('.brand-wordmark__plane');
        if (!wordmark || !plane) return null;
        const before = getComputedStyle(plane).transform;
        const rect = wordmark.getBoundingClientRect();
        wordmark.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true,
          pointerType: 'mouse',
          clientX: rect.right - 4,
          clientY: rect.top + 4,
        }));
        await new Promise((resolve) => setTimeout(resolve, 80));
        const after = getComputedStyle(plane).transform;
        wordmark.dispatchEvent(new PointerEvent('pointerout', {
          bubbles: true,
          pointerType: 'mouse',
          relatedTarget: document.body,
        }));
        await new Promise((resolve) => setTimeout(resolve, 520));
        const reset = getComputedStyle(plane).transform;
        return { before, after, reset };
      })()`,
    );

    assert.ok(mouse, "interactive logo plane must render");
    assert.notEqual(mouse.after, mouse.before, JSON.stringify(mouse));
    assert.equal(mouse.reset, mouse.before, JSON.stringify(mouse));

    const touch = await evaluate(
      socket,
      `(async () => {
        const wordmark = document.querySelector('.site-header .brand-wordmark');
        const plane = wordmark.querySelector('.brand-wordmark__plane');
        const before = getComputedStyle(plane).transform;
        const rect = wordmark.getBoundingClientRect();
        wordmark.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true,
          pointerType: 'touch',
          clientX: rect.right - 4,
          clientY: rect.top + 4,
        }));
        await new Promise((resolve) => setTimeout(resolve, 80));
        return { before, after: getComputedStyle(plane).transform };
      })()`,
    );
    assert.equal(touch.after, touch.before, JSON.stringify(touch));

    await navigate(socket, { width: 1440, height: 900, reducedMotion: true });
    const reduced = await evaluate(
      socket,
      `(async () => {
        const wordmark = document.querySelector('.site-header .brand-wordmark');
        const plane = wordmark.querySelector('.brand-wordmark__plane');
        const before = getComputedStyle(plane).transform;
        const rect = wordmark.getBoundingClientRect();
        wordmark.dispatchEvent(new PointerEvent('pointermove', {
          bubbles: true,
          pointerType: 'mouse',
          clientX: rect.right - 4,
          clientY: rect.top + 4,
        }));
        await new Promise((resolve) => setTimeout(resolve, 80));
        return { before, after: getComputedStyle(plane).transform };
      })()`,
    );
    assert.equal(reduced.after, reduced.before, JSON.stringify(reduced));
  } finally {
    socket.close();
  }
});

test("the mobile logos stay large without creating horizontal overflow", async () => {
  const socket = await connectToPage();
  try {
    await navigate(socket, { width: 390, height: 844, mobile: true });
    const observation = await evaluate(
      socket,
      `(async () => {
        const footer = document.querySelector('.site-footer .brand-wordmark');
        footer?.scrollIntoView({ block: 'center' });
        await Promise.race([
          document.querySelector('.site-footer .brand-wordmark img')?.decode().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 1800)),
        ]);
        await new Promise((resolve) => setTimeout(resolve, 120));
        const read = (selector) => {
          const rect = document.querySelector(selector)?.getBoundingClientRect();
          return rect ? { width: rect.width, height: rect.height } : null;
        };
        return {
          header: read('.site-header .brand-wordmark'),
          footer: read('.site-footer .brand-wordmark'),
          headerHeight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      })()`,
    );

    assert.ok(observation.header.width >= 170 && observation.header.width <= 195, JSON.stringify(observation));
    assert.ok(observation.footer.width >= 300 && observation.footer.width <= 340, JSON.stringify(observation));
    assert.ok(observation.headerHeight >= 82, JSON.stringify(observation));
    assert.equal(observation.overflow, 0);
  } finally {
    socket.close();
  }
});
