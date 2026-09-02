"use client";

import { useEffect, useState } from "react";
import { WaterSurface } from "@/components/effects/WaterSurface";
import {
  VISUAL_SURFACE_KINDS,
  pickActiveVisualSurface,
  type VisualSurfaceKind,
} from "@/lib/visual-system";
import { connectVisualRuntime, visualRuntime } from "@/lib/visual-runtime";

const SURFACE_SET = new Set<string>(VISUAL_SURFACE_KINDS);

// Constant, author-owned SVG markup: no user or remote content reaches this sink.
const DIGITOPRESSURE_HTML = {
  __html: `<g class="dp-motif dp-motif--foot" data-digitopressure-motif="foot"><path class="dp-route" d="M1120 760C1048 690 1034 572 1092 486C1154 394 1168 288 1110 166"/><path class="dp-route dp-route--quiet" d="M1088 744C1008 644 1006 548 1058 456C1100 382 1110 296 1074 218"/><circle class="dp-ring" cx="1118" cy="682" r="36"/><circle class="dp-ring" cx="1064" cy="512" r="24"/><circle data-p cx="1118" cy="682" r="4"/><circle data-p cx="1088" cy="612" r="3"/><circle data-p cx="1064" cy="512" r="4"/><circle data-p cx="1098" cy="414" r="3"/><circle data-p cx="1124" cy="322" r="3"/><circle data-p cx="1098" cy="226" r="4"/></g><g class="dp-motif dp-motif--hand" data-digitopressure-motif="hand"><path class="dp-route" d="M220 692C276 620 300 542 284 452C270 372 292 284 364 208"/><path class="dp-route dp-route--quiet" d="M282 474C224 402 202 324 224 240M284 416C326 344 370 282 430 242"/><circle class="dp-ring" cx="284" cy="452" r="30"/><circle class="dp-ring" cx="364" cy="208" r="18"/><circle data-p cx="220" cy="692" r="4"/><circle data-p cx="254" cy="604" r="3"/><circle data-p cx="284" cy="452" r="4"/><circle data-p cx="228" cy="334" r="3"/><circle data-p cx="224" cy="240" r="3"/><circle data-p cx="326" cy="344" r="3"/><circle data-p cx="364" cy="208" r="4"/><circle data-p cx="430" cy="242" r="3"/></g><g class="dp-motif dp-motif--face" data-digitopressure-motif="face"><path class="dp-route" d="M782 172C870 118 978 154 1012 246C1034 306 1008 372 946 410"/><path class="dp-route dp-route--quiet" d="M824 212C872 250 924 266 986 254"/><circle class="dp-ring" cx="872" cy="222" r="22"/><circle class="dp-ring" cx="968" cy="318" r="28"/><circle data-p cx="810" cy="190" r="3"/><circle data-p cx="872" cy="222" r="4"/><circle data-p cx="932" cy="232" r="3"/><circle data-p cx="986" cy="254" r="3"/><circle data-p cx="968" cy="318" r="4"/><circle data-p cx="946" cy="410" r="3"/></g><g class="dp-motif dp-motif--convergence" data-digitopressure-motif="convergence"><path class="dp-route" d="M330 736C528 650 610 504 720 450C842 390 960 482 1110 592"/><path class="dp-route dp-route--quiet" d="M430 160C560 252 628 338 720 450"/><circle data-p cx="430" cy="160" r="3"/><circle data-p cx="610" cy="504" r="3"/><circle data-p cx="720" cy="450" r="5"/><circle data-p cx="842" cy="424" r="3"/></g>`,
};

function isSurfaceKind(value: string | undefined): value is VisualSurfaceKind {
  return value != null && SURFACE_SET.has(value);
}

export function VisualStage() {
  const [activeSurface, setActiveSurface] =
    useState<VisualSurfaceKind>("hero");

  useEffect(() => {
    const updateSurface = () => {
      const snapshot = visualRuntime.getScrollSnapshot();
      if (snapshot.scrolling) return;
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-visual-surface-anchor]"),
      );
      const rects = nodes.flatMap((node) => {
        const kind = node.dataset.visualSurfaceAnchor;
        if (!isSurfaceKind(kind)) return [];
        const rect = node.getBoundingClientRect();
        return [{ kind, top: rect.top, bottom: rect.bottom }];
      });
      const atDocumentEnd =
        snapshot.scrollY + snapshot.viewportHeight >=
        document.documentElement.scrollHeight - 2;
      const nextSurface = pickActiveVisualSurface(
        rects,
        snapshot.viewportHeight,
        atDocumentEnd,
      );
      setActiveSurface((currentSurface) =>
        currentSurface === nextSurface ? currentSurface : nextSurface,
      );
    };
    const unsubscribeScroll = visualRuntime.subscribeScroll(updateSurface);
    const disconnect = connectVisualRuntime();

    return () => {
      unsubscribeScroll();
      disconnect();
    };
  }, []);

  return (
    <div
      className="visual-webgl-stage"
      data-active-surface={activeSurface}
      data-visual-runtime="shared"
      data-visual-raf-owner="visual-stage"
      aria-hidden="true"
    >
      <span className="visual-global-atmosphere" />
      <WaterSurface surface={activeSurface} />
      <div
        className="dp-overlay"
        data-digitopressure-overlay="true"
        data-surface={activeSurface}
        aria-hidden="true"
      >
        <svg
          className="dp-overlay__svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          focusable="false"
          dangerouslySetInnerHTML={DIGITOPRESSURE_HTML}
        />
      </div>
    </div>
  );
}
