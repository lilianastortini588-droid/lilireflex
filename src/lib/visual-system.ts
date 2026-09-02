export const VISUAL_SURFACE_KINDS = [
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
] as const;

export type VisualSurfaceKind = (typeof VISUAL_SURFACE_KINDS)[number];
export type WebGLPolicy = "animated" | "static" | "fallback";
export type VisualTheme = "light" | "dark";
export type AdaptiveFpsTier = "smooth" | "balanced" | "recovery";

export type AdaptiveFpsSnapshot = {
  tier: AdaptiveFpsTier;
  targetFps: 60 | 45 | 30;
};

export type VisualSurfaceDefinition = {
  kind: VisualSurfaceKind;
  theme: VisualTheme;
  cssDetail: "contour" | "strata" | "pressure" | "vein" | "convergence";
  webglIntensity: number;
  shaderPhase: number;
  shaderScale: number;
};

const SURFACES: Record<VisualSurfaceKind, VisualSurfaceDefinition> = {
  header: {
    kind: "header",
    theme: "dark",
    cssDetail: "vein",
    webglIntensity: 0.52,
    shaderPhase: 0.08,
    shaderScale: 4.4,
  },
  hero: {
    kind: "hero",
    theme: "dark",
    cssDetail: "strata",
    webglIntensity: 0.82,
    shaderPhase: 0.16,
    shaderScale: 2.8,
  },
  introduction: {
    kind: "introduction",
    theme: "dark",
    cssDetail: "pressure",
    webglIntensity: 0.48,
    shaderPhase: 0.29,
    shaderScale: 3.7,
  },
  techniques: {
    kind: "techniques",
    theme: "dark",
    cssDetail: "vein",
    webglIntensity: 0.56,
    shaderPhase: 0.35,
    shaderScale: 3.5,
  },
  map: {
    kind: "map",
    theme: "dark",
    cssDetail: "convergence",
    webglIntensity: 0.62,
    shaderPhase: 0.43,
    shaderScale: 3.05,
  },
  reading: {
    kind: "reading",
    theme: "dark",
    cssDetail: "strata",
    webglIntensity: 0.7,
    shaderPhase: 0.52,
    shaderScale: 2.9,
  },
  benefits: {
    kind: "benefits",
    theme: "dark",
    cssDetail: "contour",
    webglIntensity: 0.52,
    shaderPhase: 0.61,
    shaderScale: 3.25,
  },
  experience: {
    kind: "experience",
    theme: "dark",
    cssDetail: "vein",
    webglIntensity: 0.5,
    shaderPhase: 0.7,
    shaderScale: 3.8,
  },
  promotions: {
    kind: "promotions",
    theme: "dark",
    cssDetail: "strata",
    webglIntensity: 0.68,
    shaderPhase: 0.78,
    shaderScale: 3.1,
  },
  questions: {
    kind: "questions",
    theme: "dark",
    cssDetail: "contour",
    webglIntensity: 0.4,
    shaderPhase: 0.86,
    shaderScale: 4.6,
  },
  cta: {
    kind: "cta",
    theme: "dark",
    cssDetail: "convergence",
    webglIntensity: 0.72,
    shaderPhase: 0.9,
    shaderScale: 2.9,
  },
  footer: {
    kind: "footer",
    theme: "dark",
    cssDetail: "convergence",
    webglIntensity: 0.5,
    shaderPhase: 1,
    shaderScale: 4.2,
  },
};

export function getVisualSurface(kind: VisualSurfaceKind) {
  return SURFACES[kind];
}

export function resolveWebGLPolicy({
  reducedMotion,
  coarsePointer,
  saveData,
  viewportWidth,
  deviceMemory,
}: {
  reducedMotion: boolean;
  coarsePointer: boolean;
  saveData: boolean;
  viewportWidth: number;
  deviceMemory?: number;
}): WebGLPolicy {
  if (saveData || viewportWidth < 320 || (deviceMemory != null && deviceMemory < 4)) {
    return "fallback";
  }

  if (reducedMotion || coarsePointer || viewportWidth < 900) {
    return "static";
  }

  return "animated";
}

export function resolveWebGLFrameInterval({
  policy,
  scrolling,
  targetFps,
}: {
  policy: WebGLPolicy;
  scrolling: boolean;
  targetFps: number;
}): number | null {
  if (policy !== "animated" || scrolling) return null;
  return 1000 / Math.min(60, Math.max(1, targetFps));
}

export function resolveWebGLPixelRatio({
  policy,
  devicePixelRatio,
}: {
  policy: WebGLPolicy;
  devicePixelRatio: number;
}) {
  const safeDevicePixelRatio =
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
      ? devicePixelRatio
      : 1;
  return Math.min(safeDevicePixelRatio, policy === "animated" ? 1.35 : 1);
}

const FPS_BY_TIER: Record<AdaptiveFpsTier, AdaptiveFpsSnapshot["targetFps"]> = {
  smooth: 60,
  balanced: 45,
  recovery: 30,
};

export function createAdaptiveFpsController() {
  let tier: AdaptiveFpsTier = "smooth";
  let lastFrameAt: number | null = null;
  let smoothedFrameMs = 1000 / 60;
  let pressureSince: number | null = null;
  let recoverySince: number | null = null;

  const getSnapshot = (): AdaptiveFpsSnapshot => ({
    tier,
    targetFps: FPS_BY_TIER[tier],
  });

  const transitionTo = (nextTier: AdaptiveFpsTier) => {
    tier = nextTier;
    pressureSince = null;
    recoverySince = null;
  };

  const trackPressure = (time: number, duration: number, nextTier: AdaptiveFpsTier) => {
    pressureSince ??= time;
    if (time - pressureSince >= duration) transitionTo(nextTier);
  };

  const trackRecovery = (time: number, nextTier: AdaptiveFpsTier) => {
    recoverySince ??= time;
    if (time - recoverySince >= 1_800) transitionTo(nextTier);
  };

  return {
    sample(time: number) {
      if (lastFrameAt == null) {
        lastFrameAt = time;
        return getSnapshot();
      }

      const frameMs = time - lastFrameAt;
      lastFrameAt = time;
      if (frameMs <= 0 || frameMs > 250) {
        smoothedFrameMs = 1000 / 60;
        pressureSince = null;
        recoverySince = null;
        return getSnapshot();
      }

      smoothedFrameMs += (frameMs - smoothedFrameMs) * 0.3;
      const measuredFps = 1000 / smoothedFrameMs;

      if (tier === "smooth") {
        recoverySince = null;
        if (measuredFps < 52) {
          trackPressure(time, 600, "balanced");
        } else {
          pressureSince = null;
        }
      } else if (tier === "balanced") {
        if (measuredFps < 38) {
          recoverySince = null;
          trackPressure(time, 600, "recovery");
        } else if (measuredFps > 55) {
          pressureSince = null;
          trackRecovery(time, "smooth");
        } else {
          pressureSince = null;
          recoverySince = null;
        }
      } else {
        pressureSince = null;
        if (measuredFps > 43) {
          trackRecovery(time, "balanced");
        } else {
          recoverySince = null;
        }
      }

      return getSnapshot();
    },
    reset(time?: number) {
      lastFrameAt = time ?? null;
      smoothedFrameMs = 1000 / 60;
      pressureSince = null;
      recoverySince = null;
      return getSnapshot();
    },
    getSnapshot,
  };
}

export type VisualSurfaceRect = {
  kind: VisualSurfaceKind;
  top: number;
  bottom: number;
};

type RequestFrame = (callback: FrameRequestCallback) => number;
type CancelFrame = (handle: number) => void;

export type VisualScrollSnapshot = {
  scrollY: number;
  progress: number;
  viewportWidth: number;
  viewportHeight: number;
  scrolling: boolean;
};

export type VisualRuntimeFrame = VisualScrollSnapshot & {
  time: number;
};

export function createVisualRuntime({
  requestFrame = (callback) => window.requestAnimationFrame(callback),
  cancelFrame = (handle) => window.cancelAnimationFrame(handle),
}: {
  requestFrame?: RequestFrame;
  cancelFrame?: CancelFrame;
} = {}) {
  const frameSubscribers = new Set<(frame: VisualRuntimeFrame) => void>();
  const scrollSubscribers = new Set<() => void>();
  let frameHandle = 0;
  let continuous = false;
  let hidden = false;
  let disposed = false;
  let scrollHeight = 1;
  let pendingScroll: VisualScrollSnapshot = {
    scrollY: 0,
    progress: 0,
    viewportWidth: 1,
    viewportHeight: 1,
    scrolling: false,
  };
  let publishedScroll = pendingScroll;

  const scrollChanged = () =>
    pendingScroll.scrollY !== publishedScroll.scrollY ||
    pendingScroll.progress !== publishedScroll.progress ||
    pendingScroll.viewportWidth !== publishedScroll.viewportWidth ||
    pendingScroll.viewportHeight !== publishedScroll.viewportHeight ||
    pendingScroll.scrolling !== publishedScroll.scrolling;

  const schedule = () => {
    if (disposed || hidden || frameHandle) return;
    frameHandle = requestFrame(tick);
  };

  const tick = (time: number) => {
    frameHandle = 0;
    if (disposed || hidden) return;

    if (scrollChanged()) {
      publishedScroll = pendingScroll;
      scrollSubscribers.forEach((subscriber) => subscriber());
    }

    const frame: VisualRuntimeFrame = {
      ...publishedScroll,
      time,
    };
    frameSubscribers.forEach((subscriber) => subscriber(frame));

    if (continuous && !publishedScroll.scrolling) schedule();
  };

  return {
    subscribeFrame(subscriber: (frame: VisualRuntimeFrame) => void) {
      frameSubscribers.add(subscriber);
      return () => frameSubscribers.delete(subscriber);
    },
    subscribeScroll(subscriber: () => void) {
      scrollSubscribers.add(subscriber);
      return () => scrollSubscribers.delete(subscriber);
    },
    getScrollSnapshot() {
      return publishedScroll;
    },
    updateScroll({
      scrollY,
      scrollHeight: nextScrollHeight,
      viewportWidth,
      viewportHeight,
      scrolling,
    }: {
      scrollY: number;
      scrollHeight: number;
      viewportWidth: number;
      viewportHeight: number;
      scrolling: boolean;
    }) {
      scrollHeight = Math.max(viewportHeight, nextScrollHeight);
      const maxScroll = Math.max(0, scrollHeight - viewportHeight);
      const safeScrollY = Math.min(maxScroll, Math.max(0, scrollY));
      pendingScroll = {
        scrollY: safeScrollY,
        progress: maxScroll === 0 ? 0 : safeScrollY / maxScroll,
        viewportWidth: Math.max(1, viewportWidth),
        viewportHeight: Math.max(1, viewportHeight),
        scrolling,
      };
      schedule();
    },
    setContinuous(nextContinuous: boolean) {
      continuous = nextContinuous;
      if (continuous) schedule();
    },
    setHidden(nextHidden: boolean) {
      hidden = nextHidden;
      if (hidden && frameHandle) {
        cancelFrame(frameHandle);
        frameHandle = 0;
      } else if (!hidden && continuous) {
        schedule();
      }
    },
    invalidate() {
      schedule();
    },
    dispose() {
      disposed = true;
      continuous = false;
      frameSubscribers.clear();
      scrollSubscribers.clear();
      if (!frameHandle) return;
      cancelFrame(frameHandle);
      frameHandle = 0;
    },
  };
}

export function createFrameCadenceGate() {
  let lastFrameAt: number | null = null;
  let elapsedBudget = 0;
  let forceNext = true;

  return {
    shouldDraw(time: number, interval: number | null) {
      const frameElapsed =
        lastFrameAt == null ? 0 : Math.max(0, time - lastFrameAt);
      lastFrameAt = time;
      elapsedBudget += frameElapsed;
      if (interval == null) return false;
      if (!forceNext && elapsedBudget + 0.5 < interval) return false;

      forceNext = false;
      elapsedBudget %= interval;
      return true;
    },
    requestImmediate() {
      forceNext = true;
      elapsedBudget = 0;
    },
    reset() {
      lastFrameAt = null;
      elapsedBudget = 0;
      forceNext = true;
    },
  };
}

export function pickActiveVisualSurface(
  rects: VisualSurfaceRect[],
  viewportHeight: number,
  atDocumentEnd: boolean,
): VisualSurfaceKind {
  const safeHeight = Math.max(1, viewportHeight);

  if (atDocumentEnd) {
    const footer = rects.find(
      (rect) =>
        rect.kind === "footer" && rect.bottom > 0 && rect.top < safeHeight,
    );
    if (footer) return "footer";
  }

  const focusLine = safeHeight * 0.5;
  const containing = rects.filter(
    (rect) => rect.top <= focusLine && rect.bottom >= focusLine,
  );
  const candidates = containing.length > 0 ? containing : rects;

  let selected = candidates[0];
  let selectedDistance = Number.POSITIVE_INFINITY;

  for (const rect of candidates) {
    const distance =
      focusLine < rect.top
        ? rect.top - focusLine
        : focusLine > rect.bottom
          ? focusLine - rect.bottom
          : Math.abs((rect.top + rect.bottom) / 2 - focusLine);
    if (distance < selectedDistance) {
      selected = rect;
      selectedDistance = distance;
    }
  }

  return selected?.kind ?? "hero";
}
