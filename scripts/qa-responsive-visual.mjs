import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const cdpHttpUrl = process.env.QA_CDP_HTTP_URL;
const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000/";
const screenshotDir = process.env.QA_SCREENSHOT_DIR ?? "/tmp/lili-reflex-qa";

if (!cdpHttpUrl) {
  throw new Error("QA_CDP_HTTP_URL is required for rendered visual QA");
}

let commandId = 0;
const pendingCommands = new Map();
let socket;
let consoleIssues = [];
let networkFailures = [];

function send(method, params = {}) {
  const id = ++commandId;
  const result = new Promise((resolve, reject) => {
    pendingCommands.set(id, { resolve, reject });
  });
  socket.send(JSON.stringify({ id, method, params }));
  return result;
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  assert.equal(result.exceptionDetails, undefined, result.exceptionDetails?.text);
  return result.result.value;
}

async function connect() {
  const targets = await (await fetch(`${cdpHttpUrl}/json/list`)).json();
  const target = targets.find((entry) => entry.type === "page");
  assert.ok(target?.webSocketDebuggerUrl, "an isolated Chrome page target is required");

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const pending = pendingCommands.get(message.id);
      pendingCommands.delete(message.id);
      if (!pending) return;
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result);
      return;
    }

    if (message.method === "Runtime.consoleAPICalled") {
      const type = message.params.type;
      if (type === "error" || type === "warning") {
        consoleIssues.push({
          type,
          text: message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" "),
        });
      }
    }
    if (message.method === "Runtime.exceptionThrown") {
      consoleIssues.push({
        type: "exception",
        text: message.params.exceptionDetails?.text ?? "runtime exception",
      });
    }
    if (message.method === "Network.loadingFailed" && !message.params.canceled) {
      networkFailures.push({
        errorText: message.params.errorText,
        type: message.params.type,
      });
    }
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
}

async function setViewport({ width, height, mobile = false, touch = false }) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  await send("Emulation.setTouchEmulationEnabled", {
    enabled: touch,
    ...(touch ? { maxTouchPoints: 5 } : {}),
  });
}

async function setMotion(value) {
  await send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value }],
  });
}

async function setForcedColors(value) {
  await send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "forced-colors", value }],
  });
}

async function navigate(url = baseUrl, expectedWebglState = null) {
  consoleIssues = [];
  networkFailures = [];
  const loaded = new Promise((resolve) => {
    const listener = ({ data }) => {
      const message = JSON.parse(data);
      if (message.method !== "Page.loadEventFired") return;
      socket.removeEventListener("message", listener);
      resolve();
    };
    socket.addEventListener("message", listener);
  });
  await send("Page.navigate", { url });
  await loaded;
  await evaluate(`(async () => {
    await document.fonts.ready;
    const expected = ${JSON.stringify(expectedWebglState)};
    const deadline = performance.now() + 8000;
    let resolved = null;
    while (performance.now() < deadline) {
      const state = document.querySelector('canvas')?.dataset.webglState;
      if (state && (expected ? state === expected : state !== 'pending')) {
        resolved = state;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
    return resolved ?? document.querySelector('canvas')?.dataset.webglState ?? null;
  })()`);
}

async function capture(name, fullPage = false) {
  const hideFixedOverlays = await evaluate(`(async () => {
    document.getAnimations().forEach((animation) => animation.pause());
    let style = document.querySelector('#qa-capture-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'qa-capture-style';
      style.textContent = '.qa-capture-section .site-header, .qa-capture-section .whatsapp-float, .qa-capture-section .sticky-whatsapp { visibility: hidden !important; }';
      document.head.append(style);
    }
    const hide = scrollY > 1;
    document.documentElement.classList.toggle('qa-capture-section', hide);
    await new Promise((resolve) => setTimeout(resolve, 120));
    return hide;
  })()`);
  let options = {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: fullPage,
  };
  if (fullPage) {
    const metrics = await send("Page.getLayoutMetrics");
    const size = metrics.cssContentSize;
    options = {
      ...options,
      clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 },
    };
  }
  const { data } = await send("Page.captureScreenshot", options);
  if (hideFixedOverlays) {
    await evaluate(`(() => {
      document.documentElement.classList.remove('qa-capture-section');
      return true;
    })()`);
  }
  const output = path.join(screenshotDir, `${name}.png`);
  await writeFile(output, Buffer.from(data, "base64"));
  return output;
}

async function captureAt(selector, name) {
  await evaluate(`(async () => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!node) throw new Error('Missing capture target: ${selector}');
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const rect = node.getBoundingClientRect();
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const safeTop = headerHeight + 16;
    const availableHeight = Math.max(0, innerHeight - safeTop - 16);
    const offset = rect.height >= availableHeight ? safeTop : safeTop + (availableHeight - rect.height) / 2;
    const top = scrollY + rect.top - offset;
    scrollTo(0, Math.max(0, top));
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    await new Promise((resolve) => setTimeout(resolve, 950));
    return true;
  })()`);
  return capture(name);
}

async function observe() {
  return evaluate(`(() => {
    const css = (selector, pseudo = null) => {
      const node = document.querySelector(selector);
      return node ? getComputedStyle(node, pseudo) : null;
    };
    const rects = (selector) => [...document.querySelectorAll(selector)].map((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        marginTop: Math.round(parseFloat(style.marginTop) || 0),
      };
    });
    const ratio = (selector) => {
      const style = css(selector);
      if (!style) return null;
      return Number((parseFloat(style.lineHeight) / parseFloat(style.fontSize)).toFixed(2));
    };
    const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const portalText = [...document.querySelectorAll("nextjs-portal")]
      .map((portal) => portal.shadowRoot?.textContent ?? portal.textContent ?? "")
      .join(" ");
    const unnamed = [...document.querySelectorAll("a,button")].filter((node) => {
      const name = node.getAttribute("aria-label") || node.textContent?.trim();
      return !name;
    }).length;
    const overlay = document.querySelector('[data-digitopressure-overlay="true"]');
    const overlaySvg = overlay?.querySelector('svg');
    const canvas = document.querySelector('canvas');
    const stage = document.querySelector('.visual-webgl-stage');
    const content = document.querySelector('#contenido');
    return {
      url: location.href,
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim() ?? null,
      h1Count: document.querySelectorAll("h1").length,
      mainCount: document.querySelectorAll("main").length,
      footerCount: document.querySelectorAll("footer").length,
      footerCredit: (() => {
        const link = document.querySelector('.site-footer__credit');
        const image = link?.querySelector('img');
        if (!link || !image) return null;
        const core = link.querySelector('.site-footer__credit-core');
        const logo = link.querySelector('.site-footer__credit-logo');
        const pins = link.querySelector('.site-footer__credit-pins');
        const linkRect = link.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        const coreStyle = core ? getComputedStyle(core) : null;
        const logoStyle = logo ? getComputedStyle(logo) : null;
        const pinsStyle = pins ? getComputedStyle(pins) : null;
        return {
          text: link.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          href: link.href,
          target: link.getAttribute('target'),
          rel: link.getAttribute('rel'),
          ariaLabel: link.getAttribute('aria-label'),
          imageSrc: image.currentSrc || image.getAttribute('src'),
          imageAlt: image.getAttribute('alt'),
          imageWidth: Math.round(imageRect.width),
          imageHeight: Math.round(imageRect.height),
          creditWidth: Math.round(linkRect.width),
          creditHeight: Math.round(linkRect.height),
          insideContact: Boolean(link.closest('.site-footer__contact')),
          creditBeforeCopyright: link.nextElementSibling?.classList.contains('site-footer__copyright') ?? false,
          separateRowCount: document.querySelectorAll('.site-footer__credit-row').length,
          coreTransformStyle: coreStyle?.transformStyle ?? null,
          coreClipPath: coreStyle?.clipPath ?? null,
          coreAnimationName: coreStyle?.animationName ?? null,
          coreAnimationDuration: coreStyle?.animationDuration ?? null,
          logoObjectFit: logoStyle?.objectFit ?? null,
          logoBackgroundColor: logoStyle?.backgroundColor ?? null,
          pinsCount: pins ? 1 : 0,
          pinsBackgroundImage: pinsStyle?.backgroundImage ?? null,
        };
      })(),
      sections: document.querySelectorAll("main section").length,
      canvases: document.querySelectorAll("canvas").length,
      stages: document.querySelectorAll('[data-visual-runtime="shared"]').length,
      fields: document.querySelectorAll('[data-reflex-field="true"]').length,
      fieldImages: [...document.querySelectorAll('[data-reflex-field="true"] .reflex-field__identity')]
        .map((image) => image.getAttribute('href')),
      fieldGroundMedia: [...document.querySelectorAll('[data-reflex-field="true"]')].map((field) => {
        const ground = field.querySelector('.reflex-field__ground');
        const ambientImage = [...(ground?.children ?? [])].find(
          (node) => node.localName === 'image' && !node.classList.contains('reflex-field__identity'),
        );
        return {
          rectCount: ground?.querySelectorAll(':scope > rect').length ?? 0,
          imageCount: ambientImage ? 1 : 0,
          source: ambientImage?.getAttribute('href') ?? null,
          width: ambientImage?.getAttribute('width') ?? null,
          height: ambientImage?.getAttribute('height') ?? null,
          preserveAspectRatio: ambientImage?.getAttribute('preserveAspectRatio') ?? null,
        };
      }),
      glassA: document.querySelectorAll('.glass-a').length,
      glassB: document.querySelectorAll('.glass-b').length,
      glassC: document.querySelectorAll('.glass-c').length,
      glassRadii: {
        a: parseFloat(css('.glass-a')?.borderRadius ?? '0'),
        b: parseFloat(css('.glass-b')?.borderRadius ?? '0'),
        c: parseFloat(css('.glass-c')?.borderRadius ?? '0'),
      },
      lotusOpacity: parseFloat(css('.visual-webgl-stage', '::before')?.opacity ?? '1'),
      techniqueRects: rects('.technique-card'),
      mapTabColumns: [...document.querySelectorAll('.technique-map-tabs button')].map((button) => {
        const eyebrowRect = button.querySelector('span')?.getBoundingClientRect();
        const labelRect = button.querySelector('strong')?.getBoundingClientRect();
        return {
          id: button.id,
          gap: eyebrowRect && labelRect ? labelRect.left - eyebrowRect.right : -1,
        };
      }),
      mapHandsLeadWordLines: (() => {
        const eyebrow = document.querySelector('#map-tab-manos span');
        const text = eyebrow?.firstChild;
        if (!text) return -1;
        const range = document.createRange();
        range.setStart(text, 0);
        range.setEnd(text, 'REFLEXOLOGÍA'.length);
        return new Set([...range.getClientRects()].map(({ top }) => Math.round(top))).size;
      })(),
      techniqueMapMedia: (() => {
        const visual = document.querySelector('.technique-map-visual');
        const image = visual?.querySelector(':scope > img');
        const sourceUrl = image ? new URL(image.getAttribute('src') ?? '', location.href) : null;
        const source = sourceUrl?.pathname === '/_next/image'
          ? sourceUrl.searchParams.get('url')
          : sourceUrl?.pathname ?? null;
        return {
          svgCount: visual?.querySelectorAll(':scope > svg').length ?? 0,
          imageCount: visual?.querySelectorAll(':scope > img').length ?? 0,
          source,
          alt: image?.getAttribute('alt') ?? null,
          width: image?.getAttribute('width') ?? null,
          height: image?.getAttribute('height') ?? null,
        };
      })(),
      proposalRects: rects('.proposal-card'),
      blurElements: [...document.querySelectorAll('body *')].filter((node) => {
        const style = getComputedStyle(node);
        return style.filter.includes('blur') || style.backdropFilter.includes('blur');
      }).length,
      ambientLightLayers: document.querySelectorAll('[data-ambient-light-layer="true"]').length,
      ambientLights: document.querySelectorAll('[data-ambient-light="true"]').length,
      cssWaterLayers: document.querySelectorAll('[data-css-water-layer="true"]').length,
      floralLayers: document.querySelectorAll('[data-floral-water-layer="true"]').length,
      waterFlowers: document.querySelectorAll('[data-water-flower="true"]').length,
      botanicalDecorations: document.querySelectorAll('[data-botanical-decoration="true"]').length,
      decorativeBackgroundAnimations: [...document.getAnimations()].filter((animation) => {
        const target = animation.effect?.target;
        return target?.matches?.('.visual-global-atmosphere, .hero-identity');
      }).length,
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
      digitopressureOverlays: document.querySelectorAll('[data-digitopressure-overlay="true"]').length,
      digitopressureSvgRoots: overlay?.querySelectorAll(':scope > svg').length ?? 0,
      digitopressureDescendants: overlaySvg?.querySelectorAll('*').length ?? 0,
      digitopressurePaths: overlaySvg?.querySelectorAll('path').length ?? 0,
      digitopressurePoints: overlaySvg?.querySelectorAll('[data-p]').length ?? 0,
      digitopressureFilters: overlaySvg?.querySelectorAll('filter, feGaussianBlur').length ?? 0,
      digitopressurePointerEvents: overlay ? getComputedStyle(overlay).pointerEvents : null,
      digitopressureAriaHidden: overlay?.getAttribute('aria-hidden') ?? null,
      digitopressureDisplay: overlay ? getComputedStyle(overlay).display : null,
      digitopressureTransition: document.querySelector('[data-digitopressure-motif="foot"]')
        ? getComputedStyle(document.querySelector('[data-digitopressure-motif="foot"]')).transitionDuration
        : null,
      digitopressureAnimations: document.getAnimations().filter((animation) =>
        animation.effect?.target?.closest?.('[data-digitopressure-overlay="true"]')
      ).length,
      digitopressureZ: overlay ? Number.parseInt(getComputedStyle(overlay).zIndex, 10) : null,
      canvasZ: canvas ? Number.parseInt(getComputedStyle(canvas).zIndex, 10) : null,
      stageZ: stage ? Number.parseInt(getComputedStyle(stage).zIndex, 10) : null,
      contentZ: content ? Number.parseInt(getComputedStyle(content).zIndex, 10) : null,
      domNodes: document.querySelectorAll('*').length,
      svgNodes: document.querySelectorAll('svg *').length,
      lineRatios: {
        h1: ratio('.hero-copy h1'),
        h2: ratio('.introduction-copy h2'),
        h3: ratio('.technique-card h3'),
        body: ratio('.introduction-copy > p:not(.eyebrow)'),
        microcopy: ratio('.hero-microcopy'),
      },
      webglState: canvas?.dataset.webglState ?? null,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      overflowOffenders: [...document.querySelectorAll('body *')].flatMap((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.right <= window.innerWidth + 0.5 && rect.left >= -0.5) return [];
        return [{
          tag: node.tagName,
          className: typeof node.className === 'string' ? node.className : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        }];
      }).slice(0, 12),
      duplicateIds: duplicates,
      unnamedInteractive: unnamed,
      whatsappLinks: document.querySelectorAll('a[href^="https://wa.me/"]').length,
      bookingCopy: /Reservar turno|Ver turnos|agenda de ejemplo|Tomar este horario/i.test(document.body.innerText),
      errorOverlay: /Build Error|Runtime Error|Application error|Unhandled Runtime Error/i.test(portalText),
      heroVisible: document.querySelector("#inicio")?.getBoundingClientRect().height > 300,
      stickyDisplay: css(".sticky-whatsapp")?.display ?? null,
      floatDisplay: css(".whatsapp-float")?.display ?? null,
      backgroundImage: css(".visual-webgl-stage", "::before")?.backgroundImage ?? css(".visual-webgl-stage")?.backgroundImage ?? null,
      headerBlur: css(".site-header")?.backdropFilter ?? null,
    };
  })()`);
}

async function inspectContentContainment() {
  return evaluate(`(async () => {
    const groups = [
      ['.site-header__inner', '.brand-logo-link, .site-nav, .site-header__actions'],
      ['.site-header__actions', ':scope > *'],
      ['.hero-copy', '.eyebrow, h1, .hero-lead, .hero-note, .hero-actions, .hero-microcopy'],
      ['.hero-actions', '.button-base'],
      ['.introduction-copy', '.eyebrow, h2, p, blockquote'],
      ['.section-heading', '.eyebrow, h2, :scope > p:last-child'],
      ['.technique-card', '.technique-card__index, .technique-card__body'],
      ['.technique-map-copy', '.eyebrow, h2, :scope > p, .technique-map-tabs, .map-technique-panel'],
      ['.technique-map-tabs', 'button'],
      ['.technique-map-tabs button', 'span, strong'],
      ['.map-technique-panel', 'h3, p, .button-base'],
      ['.foot-reading-visual', '.foot-reading-image, .reading-label'],
      ['.foot-reading-copy', '.eyebrow, h2, p, ul, .button-base'],
      ['.benefits-list', '.benefit-item'],
      ['.benefit-item', ':scope > span, :scope > div'],
      ['.benefits-identity', ':scope > p'],
      ['.experience-intro', '.eyebrow, h2, p, .button-base'],
      ['.experience-step', ':scope > span, :scope > div'],
      ['.proposal-card', '.eyebrow, .proposal-card__number, h3, p, .button-base'],
      ['.questions-intro', '.eyebrow, h2, p, .button-base'],
      ['.faq-item', 'button, [role="region"]'],
      ['.faq-item button', '.faq-index, :scope > span:nth-child(2), i'],
      ['.final-cta-window', '.final-cta-copy', false],
      ['.final-cta-copy', '.eyebrow, h2, p, .button-base, .final-cta-microcopy'],
      // Descendant chip pins and aura may project inside the footer without
      // changing the grid columns. Validate each column rect explicitly; the
      // document-wide overflow assertion below still catches viewport escape.
      ['.site-footer__grid', ':scope > div', false],
      // The chip intentionally projects decorative neon pins beyond its link box.
      // Keep validating every direct child against the contact column, but do not
      // treat that pseudo-element projection as clipped semantic content.
      ['.site-footer__contact', ':scope > *', false],
      ['.button-base', 'svg'],
      ['.whatsapp-float', 'svg, span'],
      ['.sticky-whatsapp', 'a'],
      ['.sticky-whatsapp a', 'svg'],
    ];
    const issues = [];
    const tolerance = 1.5;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const round = (value) => Math.round(value * 10) / 10;
    const label = (node) => {
      const className = typeof node.className === 'string' && node.className
        ? '.' + node.className.trim().split(/\\s+/).join('.')
        : '';
      return node.tagName.toLowerCase() + className;
    };

    for (const [ownerSelector, childSelector, checkOwnerScroll = true] of groups) {
      const owners = [...document.querySelectorAll(ownerSelector)];
      for (const [ownerIndex, owner] of owners.entries()) {
        owner.scrollIntoView({ block: 'center' });
        await new Promise((resolve) => setTimeout(resolve, 45));

        const ownerRect = owner.getBoundingClientRect();
        const ownerStyle = getComputedStyle(owner);
        const bounds = {
          left: ownerRect.left + parseFloat(ownerStyle.borderLeftWidth) + parseFloat(ownerStyle.paddingLeft),
          right: ownerRect.right - parseFloat(ownerStyle.borderRightWidth) - parseFloat(ownerStyle.paddingRight),
          top: ownerRect.top + parseFloat(ownerStyle.borderTopWidth) + parseFloat(ownerStyle.paddingTop),
          bottom: ownerRect.bottom - parseFloat(ownerStyle.borderBottomWidth) - parseFloat(ownerStyle.paddingBottom),
        };

        const clippedX = owner.scrollWidth - owner.clientWidth;
        const clippedY = owner.scrollHeight - owner.clientHeight;
        if (checkOwnerScroll && (clippedX > tolerance || clippedY > tolerance)) {
          issues.push({
            type: 'owner-clips-content',
            owner: ownerSelector,
            ownerIndex,
            clippedX: round(clippedX),
            clippedY: round(clippedY),
          });
        }

        for (const child of owner.querySelectorAll(childSelector)) {
          const childStyle = getComputedStyle(child);
          if (child.hidden || childStyle.display === 'none') continue;
          const rect = child.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;

          const outside = {
            left: Math.max(0, bounds.left - rect.left),
            right: Math.max(0, rect.right - bounds.right),
            top: Math.max(0, bounds.top - rect.top),
            bottom: Math.max(0, rect.bottom - bounds.bottom),
          };
          if (Object.values(outside).some((value) => value > tolerance)) {
            issues.push({
              type: 'child-outside-owner',
              owner: ownerSelector,
              ownerIndex,
              child: label(child),
              outside: Object.fromEntries(
                Object.entries(outside).map(([side, value]) => [side, round(value)]),
              ),
            });
          }

          const textClippedX = child.scrollWidth - child.clientWidth;
          const textClippedY = child.scrollHeight - child.clientHeight;
          const clipsOverflowX = childStyle.overflowX !== 'visible';
          const clipsOverflowY = childStyle.overflowY !== 'visible';
          if (
            (textClippedX > tolerance && clipsOverflowX) ||
            (textClippedY > tolerance && clipsOverflowY)
          ) {
            issues.push({
              type: 'child-clips-content',
              owner: ownerSelector,
              ownerIndex,
              child: label(child),
              clippedX: round(textClippedX),
              clippedY: round(textClippedY),
            });
          }
        }
      }
    }

    scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 220));
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    return issues;
  })()`);
}

async function inspectFooterCreditPlacement() {
  return evaluate(`(async () => {
    const credit = document.querySelector('.site-footer__credit');
    if (!credit) return null;
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    credit.scrollIntoView({ block: 'center', inline: 'nearest' });
    await new Promise((resolve) => setTimeout(resolve, 120));
    const creditRect = credit.getBoundingClientRect();
    const overlaps = ['.whatsapp-float', '.sticky-whatsapp'].flatMap((selector) => {
      const blocker = document.querySelector(selector);
      if (!blocker) return [];
      const style = getComputedStyle(blocker);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return [];
      }
      const blockerRect = blocker.getBoundingClientRect();
      const width = Math.max(0, Math.min(creditRect.right, blockerRect.right) - Math.max(creditRect.left, blockerRect.left));
      const height = Math.max(0, Math.min(creditRect.bottom, blockerRect.bottom) - Math.max(creditRect.top, blockerRect.top));
      return width > 0 && height > 0
        ? [{ selector, width: Math.round(width), height: Math.round(height) }]
        : [];
    });
    const result = {
      left: Math.round(creditRect.left),
      right: Math.round(creditRect.right),
      top: Math.round(creditRect.top),
      bottom: Math.round(creditRect.bottom),
      overlaps,
    };
    scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 120));
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    return result;
  })()`);
}

async function assertInteractiveDesktop() {
  await evaluate(`(async () => {
    scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
    const deadline = performance.now() + 2500;
    while (
      (document.querySelector('canvas')?.dataset.webglSurface !== 'hero' ||
        document.querySelector('canvas')?.dataset.visualFpsTier === 'paused') &&
      performance.now() < deadline
    ) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    for (const [x, y] of [[0.28, 0.62], [0.5, 0.42], [0.76, 0.3]]) {
      window.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        clientX: innerWidth * x,
        clientY: innerHeight * y,
        pointerType: 'mouse',
      }));
      await new Promise((resolve) => setTimeout(resolve, 34));
    }
    await new Promise((resolve) => setTimeout(resolve, 90));
  })()`);
  screenshots.push(await capture("desktop-1440-water-pointer-state"));

  const result = await evaluate(`(async () => {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
    const heroDeadline = performance.now() + 2500;
    while (
      (document.querySelector('canvas')?.dataset.webglSurface !== 'hero' ||
        document.querySelector('canvas')?.dataset.visualFpsTier === 'paused') &&
      performance.now() < heroDeadline
    ) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const readWater = () => {
      const canvas = document.querySelector('canvas');
      return {
        field: canvas?.dataset.waterField ?? null,
        quality: canvas?.dataset.waterQuality ?? null,
        simulation: canvas?.dataset.waterSimulation ?? null,
        interaction: canvas?.dataset.waterInteraction ?? null,
        samples: Number(canvas?.dataset.waterPointerSamples ?? 0),
        surface: canvas?.dataset.webglSurface ?? null,
        materials: canvas?.dataset.visualMaterials ?? null,
        textures: canvas?.dataset.visualTextures ?? null,
      };
    };
    const pointerBefore = readWater();
    window.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true,
      clientX: innerWidth * 0.92,
      clientY: innerHeight * 0.12,
      pointerType: 'mouse',
    }));
    await new Promise((resolve) => setTimeout(resolve, 120));
    const pointerAfter = readWater();
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('.technique-map-section')?.scrollIntoView({ block: 'center' });
    window.dispatchEvent(new Event('scroll'));
    const mapDeadline = performance.now() + 2500;
    while (
      (document.querySelector('[data-digitopressure-overlay="true"]')?.dataset.surface !== 'map' ||
        document.querySelector('canvas')?.dataset.visualFpsTier === 'paused') &&
      performance.now() < mapDeadline
    ) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const mapTab = document.querySelector('#map-tab-manos');
    mapTab?.click();
    const motifDeadline = performance.now() + 1000;
    while (performance.now() < motifDeadline) {
      const hand = Number.parseFloat(
        getComputedStyle(document.querySelector('[data-digitopressure-motif="hand"]')).opacity,
      );
      const foot = Number.parseFloat(
        getComputedStyle(document.querySelector('[data-digitopressure-motif="foot"]')).opacity,
      );
      if (hand > foot) break;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    const selected = mapTab?.getAttribute('aria-selected');
    const panelText = document.querySelector('#map-technique-panel')?.textContent ?? '';
    const backgroundTechnique = document.querySelector('.technique-map-section')?.dataset.backgroundTechnique ?? null;
    const handOpacity = Number.parseFloat(
      getComputedStyle(document.querySelector('[data-digitopressure-motif="hand"]')).opacity,
    );
    const footOpacity = Number.parseFloat(
      getComputedStyle(document.querySelector('[data-digitopressure-motif="foot"]')).opacity,
    );
    const faq = document.querySelector('#faq-trigger-tecnica');
    faq?.click();
    await new Promise(requestAnimationFrame);
    const faqExpanded = faq?.getAttribute('aria-expanded');
    const faqPanelHidden = document.querySelector('#faq-panel-tecnica')?.hidden;
    scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    return {
      selected, panelText, backgroundTechnique, handOpacity, footOpacity,
      faqExpanded, faqPanelHidden, pointerBefore, pointerAfter,
    };
  })()`);
  assert.equal(result.pointerAfter.field, result.pointerBefore.field);
  assert.equal(result.pointerAfter.interaction, "pointer-wave");
  assert.ok(result.pointerAfter.samples > result.pointerBefore.samples);
  assert.equal(result.selected, "true");
  assert.match(result.panelText, /manos|Acroreflexología/i);
  assert.equal(result.backgroundTechnique, "manos");
  assert.ok(result.handOpacity > result.footOpacity);
  assert.equal(result.faqExpanded, "true");
  assert.equal(result.faqPanelHidden, false);
}

async function assertMobileMenu() {
  const opened = await evaluate(`(async () => {
    const toggle = document.querySelector('.menu-toggle');
    toggle?.click();
    await new Promise(requestAnimationFrame);
    return {
      expanded: toggle?.getAttribute('aria-expanded'),
      dialog: Boolean(document.querySelector('#mobile-nav[role="dialog"]')),
      focused: document.activeElement?.textContent?.trim() ?? '',
    };
  })()`);
  assert.equal(opened.expanded, "true");
  assert.equal(opened.dialog, true);
  assert.match(opened.focused, /Inicio/);

  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await new Promise((resolve) => setTimeout(resolve, 80));
  const closed = await evaluate(`(() => ({
    expanded: document.querySelector('.menu-toggle')?.getAttribute('aria-expanded'),
    dialog: Boolean(document.querySelector('#mobile-nav')),
    focusRestored: document.activeElement?.classList.contains('menu-toggle') ?? false,
  }))()`);
  assert.equal(closed.expanded, "false");
  assert.equal(closed.dialog, false);
  assert.equal(closed.focusRestored, true);
}

await mkdir(screenshotDir, { recursive: true });
await connect();

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900, expectedWebgl: "animated" },
  { name: "desktop-1024", width: 1024, height: 768, expectedWebgl: "animated" },
  { name: "tablet-768", width: 768, height: 1024, mobile: true, touch: true, expectedWebgl: "static" },
  { name: "mobile-390", width: 390, height: 844, mobile: true, touch: true, expectedWebgl: "static" },
  { name: "mobile-320", width: 320, height: 800, mobile: true, touch: true, expectedWebgl: "static" },
];

const observations = [];
const screenshots = [];

try {
  for (const viewport of viewports) {
    await setViewport(viewport);
    await setMotion("no-preference");
    await navigate(`${baseUrl}?qa=${viewport.name}`, viewport.expectedWebgl);
    const observation = await observe();
    const containmentIssues = await inspectContentContainment();
    const footerCreditPlacement = await inspectFooterCreditPlacement();
    observations.push({ viewport, observation, containmentIssues, footerCreditPlacement });

    assert.match(observation.title, /Reflexología Holística/);
    assert.equal(observation.h1, "REFLEXOLOGÍA HOLÍSTICA");
    assert.equal(observation.h1Count, 1);
    assert.equal(observation.mainCount, 1);
    assert.equal(observation.footerCount, 1);
    assert.ok(
      observation.footerCredit,
      JSON.stringify({ viewport: viewport.name, footerCredit: observation.footerCredit }),
    );
    assert.match(observation.footerCredit.text, /Hecho por/i);
    assert.equal(observation.footerCredit.href, "https://capacero.ar/");
    assert.equal(observation.footerCredit.target, "_blank");
    assert.match(observation.footerCredit.rel, /\bnoopener\b/);
    assert.match(observation.footerCredit.rel, /\bnoreferrer\b/);
    assert.match(observation.footerCredit.ariaLabel, /Hecho por Capa Cero/i);
    assert.match(observation.footerCredit.imageSrc, /image2\.png/i);
    assert.equal(observation.footerCredit.imageAlt, "");
    assert.ok(observation.footerCredit.creditWidth >= 160);
    assert.ok(observation.footerCredit.creditWidth <= 230);
    assert.ok(observation.footerCredit.creditHeight >= 52);
    assert.ok(observation.footerCredit.creditHeight <= 72);
    assert.equal(observation.footerCredit.insideContact, true);
    assert.equal(observation.footerCredit.creditBeforeCopyright, true);
    assert.equal(observation.footerCredit.separateRowCount, 0);
    assert.equal(observation.footerCredit.coreTransformStyle, "preserve-3d");
    assert.notEqual(observation.footerCredit.coreClipPath, "none");
    if (viewport.touch) {
      assert.equal(observation.footerCredit.coreAnimationName, "none");
    } else {
      assert.notEqual(observation.footerCredit.coreAnimationName, "none");
      assert.match(observation.footerCredit.coreAnimationDuration, /s$/);
    }
    assert.equal(observation.footerCredit.logoObjectFit, "contain");
    assert.equal(observation.footerCredit.logoBackgroundColor, "rgba(0, 0, 0, 0)");
    assert.equal(observation.footerCredit.pinsCount, 1);
    assert.match(observation.footerCredit.pinsBackgroundImage, /repeating-linear-gradient/);
    assert.ok(footerCreditPlacement);
    assert.deepEqual(
      footerCreditPlacement.overlaps,
      [],
      JSON.stringify({ viewport: viewport.name, footerCreditPlacement }),
    );
    assert.ok(observation.sections >= 10);
    assert.equal(observation.canvases, 1);
    assert.equal(observation.stages, 1);
    assert.equal(observation.fields, 3);
    assert.deepEqual(observation.fieldImages, [
      "/brand/pearlescent-foot.png",
      "/brand/reflexology/IMG_4048.PNG",
      "/brand/pearlescent-foot.png",
    ]);
    assert.deepEqual(observation.fieldGroundMedia, [
      {
        rectCount: 1,
        imageCount: 0,
        source: null,
        width: null,
        height: null,
        preserveAspectRatio: null,
      },
      {
        rectCount: 1,
        imageCount: 0,
        source: null,
        width: null,
        height: null,
        preserveAspectRatio: null,
      },
      {
        rectCount: 0,
        imageCount: 1,
        source: "/brand/reflexology/IMG_4047.PNG",
        width: "100",
        height: "110",
        preserveAspectRatio: "xMidYMid slice",
      },
    ]);
    assert.equal(observation.glassA, 3);
    assert.equal(observation.glassB, 11);
    assert.equal(observation.glassC, 3);
    assert.ok(
      observation.mapTabColumns.every(({ gap }) => gap >= 15),
      JSON.stringify({ viewport: viewport.name, mapTabColumns: observation.mapTabColumns }),
    );
    assert.equal(
      observation.mapHandsLeadWordLines,
      1,
      JSON.stringify({ viewport: viewport.name, mapHandsLeadWordLines: observation.mapHandsLeadWordLines }),
    );
    assert.deepEqual(
      observation.techniqueMapMedia,
      {
        svgCount: 0,
        imageCount: 1,
        source: "/brand/reflexology/technique-map-connection.png",
        alt: "Pie, mano y rostro como puntos de conexión de la reflexología.",
        width: "1254",
        height: "1254",
      },
      JSON.stringify({ viewport: viewport.name, techniqueMapMedia: observation.techniqueMapMedia }),
    );
    if (viewport.name === "desktop-1440") {
      assert.ok(
        observation.glassRadii.a > observation.glassRadii.b &&
          observation.glassRadii.b > observation.glassRadii.c,
        JSON.stringify({ viewport: viewport.name, glassRadii: observation.glassRadii }),
      );
      assert.equal(observation.lotusOpacity, 0.78);
      assert.ok(
        observation.techniqueRects[1].width < observation.techniqueRects[0].width,
        JSON.stringify({ viewport: viewport.name, techniqueRects: observation.techniqueRects }),
      );
      assert.ok(
        observation.proposalRects[1].marginTop >= 12 &&
          observation.proposalRects[3].marginTop >= 12,
        JSON.stringify({ viewport: viewport.name, proposalRects: observation.proposalRects }),
      );
    }
    if (viewport.touch) {
      assert.equal(
        observation.decorativeBackgroundAnimations,
        0,
        JSON.stringify({
          viewport: viewport.name,
          decorativeBackgroundAnimations: observation.decorativeBackgroundAnimations,
        }),
      );
      assert.ok(
        observation.proposalRects.every(({ marginTop }) => marginTop === 0),
        JSON.stringify({ viewport: viewport.name, proposalRects: observation.proposalRects }),
      );
    }
    assert.ok(
      observation.blurElements <= (viewport.width <= 900 ? 8 : 7),
      JSON.stringify({ viewport: viewport.name, blurElements: observation.blurElements }),
    );
    assert.equal(observation.ambientLightLayers, 0);
    assert.equal(observation.ambientLights, 0);
    assert.equal(observation.waterField, "heightfield-gpu");
    assert.equal(
      observation.waterQuality,
      viewport.touch ? "static" : observation.waterQuality,
    );
    if (!viewport.touch) assert.ok(["high", "ultra"].includes(observation.waterQuality));
    assert.match(observation.waterSimulation, /^\d+x\d+$/);
    assert.ok(["half-float", "uint8"].includes(observation.waterPrecision));
    assert.equal(observation.waterInteraction, viewport.touch ? "static" : "pointer-wave");
    assert.equal(observation.waterPointerSamples, 0);
    assert.equal(observation.visualMaterials, 2);
    assert.equal(observation.visualDrawCalls, viewport.touch ? 1 : 2);
    assert.equal(observation.visualTextures, 2);
    assert.equal(observation.visualRenderTargets, 2);
    assert.equal(observation.cssWaterLayers, 0);
    assert.equal(observation.floralLayers, 0);
    assert.equal(observation.waterFlowers, 0);
    assert.equal(observation.botanicalDecorations, 0);
    assert.equal(observation.digitopressureOverlays, 1);
    assert.equal(observation.digitopressureSvgRoots, 1);
    assert.ok(
      observation.digitopressureDescendants <= 42,
      JSON.stringify({ viewport: viewport.name, descendants: observation.digitopressureDescendants }),
    );
    assert.ok(observation.digitopressurePaths <= 8);
    assert.ok(observation.digitopressurePoints <= 24);
    assert.equal(observation.digitopressureFilters, 0);
    assert.equal(observation.digitopressurePointerEvents, "none");
    assert.equal(observation.digitopressureAriaHidden, "true");
    assert.ok(observation.digitopressureZ > observation.canvasZ);
    assert.ok(observation.stageZ < observation.contentZ);
    assert.ok(
      observation.domNodes <= 1125,
      JSON.stringify({ viewport: viewport.name, domNodes: observation.domNodes }),
    );
    assert.ok(
      observation.svgNodes <= 707,
      JSON.stringify({ viewport: viewport.name, svgNodes: observation.svgNodes }),
    );
    if (viewport.touch) {
      assert.equal(observation.digitopressureTransition, "0s");
      assert.equal(observation.digitopressureAnimations, 0);
    }
    const lineRanges = viewport.width <= 600
      ? {
          h1: [1.04, 1.12],
          h2: [1.08, 1.18],
          h3: [1.2, 1.34],
          body: [1.6, 1.76],
          microcopy: [1.48, 1.66],
        }
      : {
          h1: [1, 1.08],
          h2: [1.06, 1.14],
          h3: [1.16, 1.3],
          body: [1.58, 1.72],
          microcopy: [1.45, 1.62],
        };
    for (const [key, value] of Object.entries(observation.lineRatios)) {
      const [minimum, maximum] = lineRanges[key];
      assert.ok(
        value >= minimum && value <= maximum,
        JSON.stringify({ viewport: viewport.name, key, value, minimum, maximum }),
      );
    }
    assert.equal(
      observation.webglState,
      viewport.expectedWebgl,
      JSON.stringify({
        viewport: viewport.name,
        actual: observation.webglState,
        expected: viewport.expectedWebgl,
      }),
    );
    assert.equal(
      observation.overflow,
      0,
      JSON.stringify({ viewport: viewport.name, offenders: observation.overflowOffenders }),
    );
    assert.deepEqual(
      containmentIssues,
      [],
      JSON.stringify({ viewport: viewport.name, containmentIssues }),
    );
    assert.deepEqual(observation.duplicateIds, []);
    assert.equal(observation.unnamedInteractive, 0);
    assert.ok(observation.whatsappLinks >= 12);
    assert.equal(observation.bookingCopy, false);
    assert.equal(observation.errorOverlay, false);
    assert.equal(observation.heroVisible, true);
    assert.deepEqual(consoleIssues, []);
    assert.deepEqual(networkFailures, []);

    screenshots.push(await capture(`${viewport.name}-viewport`));
    if (viewport.name === "desktop-1440") {
      screenshots.push(await captureAt(".introduction-grid", "desktop-1440-introduction"));
      screenshots.push(await captureAt("#tecnicas .section-heading", "desktop-1440-techniques"));
      screenshots.push(await captureAt(".technique-map-grid", "desktop-1440-map"));
      screenshots.push(await captureAt(".foot-reading-grid", "desktop-1440-reading"));
      screenshots.push(await captureAt(".benefits-grid", "desktop-1440-benefits"));
      screenshots.push(await captureAt(".experience-grid", "desktop-1440-experience"));
      screenshots.push(await captureAt(".proposal-grid", "desktop-1440-proposals"));
      screenshots.push(await captureAt(".questions-grid", "desktop-1440-questions"));
      screenshots.push(await captureAt(".final-cta-window", "desktop-1440-contact"));
      await evaluate("scrollTo(0, 0)");
    }
    if (viewport.name === "mobile-390") {
      screenshots.push(await captureAt(".technique-card", "mobile-390-technique"));
      screenshots.push(await captureAt(".foot-reading-grid", "mobile-390-reading"));
      screenshots.push(await captureAt(".proposal-card", "mobile-390-proposal"));
      screenshots.push(await captureAt(".questions-grid", "mobile-390-questions"));
      screenshots.push(await captureAt(".final-cta-window", "mobile-390-contact"));
      await evaluate("scrollTo(0, 0)");
    }

    if (viewport.name === "desktop-1440") {
      await assertInteractiveDesktop();
      screenshots.push(await capture("desktop-1440-water-map-state"));
    }
    if (viewport.name === "mobile-390") await assertMobileMenu();
  }

  await setViewport({ width: 1440, height: 900 });
  await setMotion("reduce");
  await navigate(`${baseUrl}?qa=reduced-motion`, "static");
  const reducedMotion = await evaluate(`(() => ({
    matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    webglState: document.querySelector('canvas')?.dataset.webglState ?? null,
    waterField: document.querySelector('canvas')?.dataset.waterField ?? null,
    waterQuality: document.querySelector('canvas')?.dataset.waterQuality ?? null,
    waterInteraction: document.querySelector('canvas')?.dataset.waterInteraction ?? null,
    runningAnimations: document.getAnimations().filter((animation) => animation.playState === 'running').length,
    overlayAnimations: document.getAnimations().filter((animation) =>
      animation.effect?.target?.closest?.('[data-digitopressure-overlay="true"]')
    ).length,
    overlayTransition: getComputedStyle(
      document.querySelector('[data-digitopressure-motif="foot"]'),
    ).transitionDuration,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))()`);
  assert.equal(reducedMotion.matches, true);
  assert.equal(reducedMotion.webglState, "static");
  assert.equal(reducedMotion.waterField, "heightfield-gpu");
  assert.equal(reducedMotion.waterQuality, "static");
  assert.equal(reducedMotion.waterInteraction, "static");
  assert.equal(reducedMotion.runningAnimations, 0);
  assert.equal(reducedMotion.overlayAnimations, 0);
  assert.equal(reducedMotion.overlayTransition, "0s");
  assert.equal(reducedMotion.overflow, 0);
  assert.deepEqual(consoleIssues, []);
  assert.deepEqual(networkFailures, []);
  screenshots.push(await capture("reduced-motion-1440-viewport"));

  await setViewport({ width: 319, height: 800, mobile: false, touch: false });
  await setMotion("no-preference");
  await navigate(`${baseUrl}?qa=tiny-viewport`, "fallback");
  const tinyViewport = await evaluate(`(() => {
    const canvas = document.querySelector('canvas');
    return {
      webglState: canvas?.dataset.webglState ?? null,
      waterField: canvas?.dataset.waterField ?? null,
      waterQuality: canvas?.dataset.waterQuality ?? null,
      waterInteraction: canvas?.dataset.waterInteraction ?? null,
      visualMaterials: Number(canvas?.dataset.visualMaterials ?? 0),
      visualDrawCalls: Number(canvas?.dataset.visualDrawCalls ?? 0),
      lotusOpacity: Number.parseFloat(
        getComputedStyle(document.querySelector('.visual-webgl-stage'), '::before').opacity,
      ),
    };
  })()`);
  assert.equal(tinyViewport.webglState, "fallback");
  assert.equal(tinyViewport.waterField, "css-fallback");
  assert.equal(tinyViewport.waterQuality, "fallback");
  assert.equal(tinyViewport.waterInteraction, "none");
  assert.equal(tinyViewport.visualMaterials, 0);
  assert.equal(tinyViewport.visualDrawCalls, 0);
  assert.equal(tinyViewport.lotusOpacity, 0.78);
  assert.deepEqual(consoleIssues, []);
  assert.deepEqual(networkFailures, []);

  await setViewport({ width: 1440, height: 900 });
  await setForcedColors("active");
  await navigate(`${baseUrl}?qa=forced-colors`);
  const forcedColors = await evaluate(`(() => ({
    matches: matchMedia('(forced-colors: active)').matches,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    unnamedInteractive: [...document.querySelectorAll('a,button')].filter((node) => {
      const name = node.getAttribute('aria-label') || node.textContent?.trim();
      return !name;
    }).length,
    overlayDisplay: getComputedStyle(
      document.querySelector('[data-digitopressure-overlay="true"]'),
    ).display,
  }))()`);
  assert.equal(forcedColors.matches, true);
  assert.equal(forcedColors.overflow, 0);
  assert.equal(forcedColors.unnamedInteractive, 0);
  assert.equal(forcedColors.overlayDisplay, "none");
  assert.deepEqual(consoleIssues, []);
  assert.deepEqual(networkFailures, []);
  screenshots.push(await capture("forced-colors-1440-viewport"));

  console.log(`RESPONSIVE_OBSERVATIONS=${JSON.stringify({ observations, reducedMotion, tinyViewport, forcedColors })}`);
  console.log(`QA_SCREENSHOTS=${JSON.stringify(screenshots)}`);
} finally {
  socket?.close();
}
