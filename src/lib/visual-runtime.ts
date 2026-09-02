"use client";

import { useCallback, useSyncExternalStore } from "react";
import { createVisualRuntime } from "@/lib/visual-system";

export const visualRuntime = createVisualRuntime();

let connections = 0;
let disconnectBrowser: (() => void) | null = null;

function readScroll(scrolling: boolean) {
  if (window.scrollY > 0) {
    document.documentElement.dataset.visualScrolled = "true";
  } else {
    delete document.documentElement.dataset.visualScrolled;
  }
  visualRuntime.updateScroll({
    scrollY: window.scrollY,
    scrollHeight: document.documentElement.scrollHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    scrolling,
  });
}

export function connectVisualRuntime() {
  connections += 1;
  if (connections > 1 && disconnectBrowser) {
    return () => {
      connections = Math.max(0, connections - 1);
    };
  }

  let scrollResumeTimer = 0;

  const onScroll = () => {
    readScroll(true);
    window.clearTimeout(scrollResumeTimer);
    scrollResumeTimer = window.setTimeout(() => {
      scrollResumeTimer = 0;
      readScroll(false);
    }, 160);
  };

  const onResize = () => readScroll(false);
  const onVisibilityChange = () => {
    visualRuntime.setHidden(document.hidden);
    if (!document.hidden) readScroll(false);
  };

  readScroll(false);
  visualRuntime.setHidden(document.hidden);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);

  disconnectBrowser = () => {
    window.clearTimeout(scrollResumeTimer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    visualRuntime.setContinuous(false);
    disconnectBrowser = null;
  };

  return () => {
    connections = Math.max(0, connections - 1);
    if (connections === 0) disconnectBrowser?.();
  };
}

export function useVisualScrollThreshold(threshold: number) {
  const subscribe = useCallback(
    (notify: () => void) => {
      let matched = visualRuntime.getScrollSnapshot().scrollY > threshold;
      return visualRuntime.subscribeScroll(() => {
        const nextMatched =
          visualRuntime.getScrollSnapshot().scrollY > threshold;
        if (nextMatched === matched) return;
        matched = nextMatched;
        notify();
      });
    },
    [threshold],
  );
  const getSnapshot = useCallback(
    () => visualRuntime.getScrollSnapshot().scrollY > threshold,
    [threshold],
  );

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  );
}
