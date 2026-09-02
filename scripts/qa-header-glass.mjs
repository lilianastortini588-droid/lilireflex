import assert from "node:assert/strict";
import test from "node:test";

const cdpHttpUrl = process.env.QA_CDP_HTTP_URL;
const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000/";

if (!cdpHttpUrl) {
  throw new Error("QA_CDP_HTTP_URL is required for rendered header glass QA");
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

    if (message.error) {
      pending.reject(new Error(JSON.stringify(message.error)));
    } else {
      pending.resolve(message.result);
    }
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

test("the header glass is opaque from its first elevated frame", async () => {
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

    const observation = await evaluate(
      socket,
      `(async () => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 320));

        const header = document.querySelector(".site-header");
        if (!header) throw new Error("site header not found");

        const materialAlpha = () => {
          const color = getComputedStyle(header).backgroundColor;
          if (color === "transparent") return 0;

          const slashAlpha = color.match(/\\/\\s*([\\d.]+)\\s*\\)/);
          if (slashAlpha) return Number(slashAlpha[1]);

          const rgbaAlpha = color.match(/^rgba\\([^,]+,[^,]+,[^,]+,\\s*([\\d.]+)\\)$/);
          if (rgbaAlpha) return Number(rgbaAlpha[1]);

          return color.startsWith("rgb(") || color.startsWith("color(") ? 1 : 0;
        };

        window.scrollTo(0, 20);
        const waitStart = performance.now();
        let firstElevatedAlpha = null;
        while (performance.now() - waitStart < 2000) {
          await new Promise(requestAnimationFrame);
          if (header.classList.contains("site-header--elevated")) {
            firstElevatedAlpha = materialAlpha();
            break;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 420));

        return {
          elevated: firstElevatedAlpha !== null,
          firstElevatedAlpha: firstElevatedAlpha ?? 0,
          settledAlpha: materialAlpha(),
        };
      })()`,
    );

    assert.equal(observation.elevated, true, "the elevated state must render");
    assert.ok(
      observation.settledAlpha >= 0.8,
      `settled glass alpha must stay substantial; got ${observation.settledAlpha}`,
    );
    assert.ok(
      observation.firstElevatedAlpha >= observation.settledAlpha - 0.03,
      `glass alpha dipped from ${observation.settledAlpha} to ${observation.firstElevatedAlpha}`,
    );
  } finally {
    socket.close();
  }
});

test("the first positive wheel offset activates the protective header material", async () => {
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
    await evaluate(
      socket,
      `(async () => {
        window.scrollTo(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 320));
        return true;
      })()`,
    );

    await send(socket, "Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: 720,
      y: 450,
      deltaX: 0,
      deltaY: 80,
    });
    await new Promise((resolve) => setTimeout(resolve, 120));

    const observation = await evaluate(
      socket,
      `(() => {
        const header = document.querySelector(".site-header");
        if (!header) throw new Error("site header not found");
        const color = getComputedStyle(header).backgroundColor;
        const slashAlpha = color.match(/\\/\\s*([\\d.]+)\\s*\\)/);
        const rgbaAlpha = color.match(/^rgba\\([^,]+,[^,]+,[^,]+,\\s*([\\d.]+)\\)$/);
        return {
          scrollY: window.scrollY,
          elevated: header.classList.contains("site-header--elevated"),
          materialAlpha: slashAlpha
            ? Number(slashAlpha[1])
            : rgbaAlpha
              ? Number(rgbaAlpha[1])
              : color.startsWith("rgb(") || color.startsWith("color(")
                ? 1
                : 0,
        };
      })()`,
    );

    assert.ok(observation.scrollY > 0, "the wheel interaction must move the page");
    assert.equal(
      observation.elevated,
      true,
      `header stayed transparent at scrollY ${observation.scrollY}`,
    );
    assert.ok(
      observation.materialAlpha >= 0.92,
      `header material alpha is only ${observation.materialAlpha}`,
    );
  } finally {
    socket.close();
  }
});

test("the shared scroll listener protects the header before React publishes a frame", async () => {
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
    await evaluate(
      socket,
      `(async () => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 320));
        return true;
      })()`,
    );

    const observation = await evaluate(
      socket,
      `(() => {
        window.scrollTo(0, 3);
        window.dispatchEvent(new Event("scroll"));
        const header = document.querySelector(".site-header");
        if (!header) throw new Error("site header not found");
        const color = getComputedStyle(header).backgroundColor;
        const slashAlpha = color.match(/\\/\\s*([\\d.]+)\\s*\\)/);
        const rgbaAlpha = color.match(/^rgba\\([^,]+,[^,]+,[^,]+,\\s*([\\d.]+)\\)$/);
        return {
          scrollY: window.scrollY,
          synchronousGuard:
            document.documentElement.dataset.visualScrolled === "true",
          materialAlpha: slashAlpha
            ? Number(slashAlpha[1])
            : rgbaAlpha
              ? Number(rgbaAlpha[1])
              : color.startsWith("rgb(") || color.startsWith("color(")
                ? 1
                : 0,
        };
      })()`,
    );

    assert.ok(observation.scrollY > 0, "the wheel interaction must move the page");
    assert.equal(
      observation.synchronousGuard,
      true,
      "the shared listener must publish the protective material synchronously",
    );
    assert.ok(
      observation.materialAlpha >= 0.92,
      `the pre-React material alpha is only ${observation.materialAlpha}`,
    );
  } finally {
    socket.close();
  }
});

test("the elevated header keeps an effective blur over high-contrast content", async () => {
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

    const observation = await evaluate(
      socket,
      `(async () => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 320));
        window.scrollTo(0, 95);
        window.dispatchEvent(new Event("scroll"));
        await new Promise((resolve) => setTimeout(resolve, 420));
        const header = document.querySelector(".site-header");
        if (!header) throw new Error("site header not found");
        const style = getComputedStyle(header);
        return {
          elevated: header.classList.contains("site-header--elevated"),
          protected:
            header.classList.contains("site-header--elevated") ||
            document.documentElement.dataset.visualScrolled === "true",
          backdropFilter: style.backdropFilter,
        };
      })()`,
    );

    assert.equal(
      observation.protected,
      true,
      "the high-contrast scroll state must protect the header",
    );
    assert.match(
      observation.backdropFilter,
      /blur\(18px\)/,
      `effective header blur is ${observation.backdropFilter}`,
    );
  } finally {
    socket.close();
  }
});
