"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/cn";
import { buildFieldGeometry } from "@/lib/reflex-field/geometry";
import { buildTopology } from "@/lib/reflex-field/topologies";
import type { FieldTopologyKind } from "@/lib/reflex-field/types";

const PALETTE = {
  node: "#321A48",
  nodeActive: "#AA89C8",
  curve: "#8355A8",
  curveActive: "#CBB5DD",
  halo: ["#EFD6E4", "#AA89C8", "#FFF8FB"],
  pointer: "#F2E8F4",
  pressure: "#8355A8",
} as const;

export function ReflexField({
  className,
  focus = 0.5,
  topology = "base",
  identitySrc = "/brand/pearlescent-foot.png",
  ambientSrc,
}: {
  className?: string;
  focus?: number;
  topology?: FieldTopologyKind;
  identitySrc?: string;
  ambientSrc?: string;
}) {
  const id = useId();
  const graph = useMemo(
    () => buildTopology(topology, focus, 1),
    [topology, focus],
  );
  const geometry = useMemo(
    () => buildFieldGeometry(graph, topology, focus),
    [graph, topology, focus],
  );
  const focusIndex = Math.round(
    focus * Math.max(graph.nodes.length - 1, 0),
  );
  const sortedNodes = useMemo(
    () =>
      [...graph.nodes]
        .map((node, index) => ({ node, index }))
        .sort((a, b) => a.node.depth - b.node.depth),
    [graph.nodes],
  );
  return (
    <div
      className={cn("reflex-field overflow-hidden", className)}
      data-reflex-field="true"
      data-field-motion="static"
      data-field-active="true"
      data-field-theme="dark"
      aria-hidden="true"
    >
      <div className="reflex-field__motion h-full w-full">
        <svg
          viewBox="0 0 100 110"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          focusable="false"
        >
          <defs>
            <radialGradient id={`${id}-ambient`} cx="50%" cy="42%" r="66%">
              <stop offset="0%" stopColor={PALETTE.halo[0]} stopOpacity="0.3" />
              <stop offset="42%" stopColor={PALETTE.halo[1]} stopOpacity="0.13" />
              <stop offset="74%" stopColor={PALETTE.halo[2]} stopOpacity="0.05" />
              <stop offset="100%" stopColor={PALETTE.halo[2]} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${id}-pressure`} cx="38%" cy="34%" r="72%">
              <stop offset="0%" stopColor={PALETTE.pointer} stopOpacity="0.58" />
              <stop offset="54%" stopColor={PALETTE.pressure} stopOpacity="0.2" />
              <stop offset="100%" stopColor={PALETTE.pressure} stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`${id}-node`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={PALETTE.curveActive} stopOpacity="0.98" />
              <stop offset="52%" stopColor={PALETTE.node} stopOpacity="0.96" />
              <stop offset="100%" stopColor={PALETTE.curve} stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={PALETTE.nodeActive} stopOpacity="0.42" />
              <stop offset="55%" stopColor={PALETTE.pointer} stopOpacity="0.12" />
              <stop offset="100%" stopColor={PALETTE.pointer} stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id={`${id}-flow`}
              x1="0"
              y1="0"
              x2="100"
              y2="110"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={PALETTE.curve} stopOpacity="0.34" />
              <stop offset="48%" stopColor={PALETTE.curveActive} stopOpacity="0.92" />
              <stop offset="100%" stopColor={PALETTE.pointer} stopOpacity="0.3" />
            </linearGradient>
          </defs>

          <g className="reflex-field__ground">
            <image
              href={identitySrc}
              x="-5"
              y="-2"
              width="110"
              height="114"
              preserveAspectRatio="xMidYMid meet"
              className="reflex-field__identity"
              opacity={topology === "hero" ? 0.92 : 0.76}
              style={{ mixBlendMode: "screen" }}
            />
            {ambientSrc ? (
              <image
                href={ambientSrc}
                x="0"
                y="0"
                width="100"
                height="110"
                preserveAspectRatio="xMidYMid slice"
                className="reflex-field__ambient-image"
              />
            ) : (
              <rect
                width="100"
                height="110"
                fill={`url(#${id}-ambient)`}
                opacity="0.72"
              />
            )}
            <path
              d="M -8 83 C 18 62 31 72 48 56 C 66 38 82 46 110 18"
              fill="none"
              stroke={PALETTE.pointer}
              strokeWidth="11"
              strokeLinecap="round"
              opacity="0.065"
            />
          </g>

          <g className="reflex-field__pressure">
            {graph.pressure.map((zone, index) => (
              <ellipse
                key={`pressure-${index}`}
                className="reflex-field__pressure-zone"
                cx={zone.cx}
                cy={zone.cy}
                rx={zone.rx}
                ry={zone.ry}
                fill={`url(#${id}-pressure)`}
                opacity={zone.opacity * 3.2}
              />
            ))}
          </g>

          <g className="reflex-field__contours">
            {geometry.contours.map((shape, index) => (
              <path
                key={`contour-${index}`}
                d={shape.d}
                fill="none"
                stroke={index % 2 === 0 ? PALETTE.curve : PALETTE.pointer}
                strokeWidth={shape.width}
                strokeDasharray={index % 3 === 0 ? "1.2 2.8" : undefined}
                opacity={shape.opacity * 0.9}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          <g className="reflex-field__satellites">
            {geometry.satellites.map((satellite, index) => (
              <g key={`satellite-${index}`}>
                <circle
                  cx={satellite.cx}
                  cy={satellite.cy}
                  r={satellite.r + 1.6}
                  fill={`url(#${id}-halo)`}
                  opacity={satellite.opacity * 0.7}
                />
                <circle
                  cx={satellite.cx}
                  cy={satellite.cy}
                  r={satellite.r}
                  fill={index % 3 === 0 ? PALETTE.nodeActive : PALETTE.node}
                  opacity={satellite.opacity + satellite.depth * 0.36}
                />
              </g>
            ))}
          </g>

          <g className="reflex-field__flows">
            {geometry.flows.map((shape, index) => {
              const [a, b] = graph.links[index] ?? [];
              const active = a === focusIndex || b === focusIndex;
              return (
                <g key={`flow-${index}`}>
                  <path
                    d={shape.d}
                    fill="none"
                    stroke={active ? PALETTE.curveActive : PALETTE.pointer}
                    strokeWidth={shape.width + 1.4}
                    strokeLinecap="round"
                    opacity={active ? 0.12 : 0.045}
                  />
                  <path
                    className="reflex-field__flow-line"
                    d={shape.d}
                    fill="none"
                    stroke={`url(#${id}-flow)`}
                    strokeWidth={active ? shape.width + 0.24 : shape.width}
                    strokeLinecap="round"
                    strokeDasharray={active ? "2.4 1.6" : "1.2 1.8"}
                    opacity={active ? 0.92 : shape.opacity}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </g>

          <g className="reflex-field__nodes">
            {sortedNodes.map(({ node, index }) => {
              const active = index === focusIndex;
              const radius = active ? node.r + 1.2 : node.r;
              return (
                <g key={`node-${index}`}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + (active ? 8.5 : 5.5)}
                    fill={`url(#${id}-halo)`}
                    opacity={active ? 0.82 : 0.34 + node.depth * 0.2}
                  />
                  {node.weight > 0.68 ? (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius + 2.35}
                      fill="none"
                      stroke={active ? PALETTE.curveActive : PALETTE.curve}
                      strokeWidth={active ? 0.52 : 0.28}
                      strokeDasharray={active ? "1.4 1" : "0.8 1.8"}
                      opacity={active ? 0.76 : 0.32}
                    />
                  ) : null}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={active ? PALETTE.nodeActive : `url(#${id}-node)`}
                    stroke={PALETTE.halo[2]}
                    strokeWidth={active ? 0.42 : 0.24}
                    opacity={active ? 1 : 0.52 + node.depth * 0.44}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={Math.max(0.18, radius * 0.18)}
                    fill={PALETTE.pointer}
                    opacity={active ? 0.78 : 0.5}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
