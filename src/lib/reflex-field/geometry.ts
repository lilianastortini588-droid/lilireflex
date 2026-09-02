import type { FieldGraph, FieldTopologyKind } from "./types";

export type FieldShape = {
  d: string;
  depth: number;
  opacity: number;
  width: number;
};

export type FieldSatellite = {
  cx: number;
  cy: number;
  depth: number;
  opacity: number;
  r: number;
};

export type FieldGeometry = {
  contours: FieldShape[];
  flows: FieldShape[];
  satellites: FieldSatellite[];
};

const BEND_BY_TOPOLOGY: Record<FieldTopologyKind, number> = {
  hero: 8.4,
  reflexology: 5.2,
  benefits: 6.4,
  promotions: 4.6,
  cta: 7.2,
  base: 5.8,
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function organicLoop(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  wobble: number,
) {
  const left = round(cx - rx);
  const right = round(cx + rx);
  const top = round(cy - ry);
  const bottom = round(cy + ry);
  const horizontal = round(rx * 0.58);
  const vertical = round(ry * 0.58);

  return [
    `M ${left} ${round(cy + wobble)}`,
    `C ${left} ${round(cy - vertical)} ${round(cx - horizontal)} ${top} ${round(cx + wobble)} ${top}`,
    `C ${round(cx + horizontal)} ${top} ${right} ${round(cy - vertical + wobble)} ${right} ${cy}`,
    `C ${right} ${round(cy + vertical)} ${round(cx + horizontal - wobble)} ${bottom} ${round(cx - wobble)} ${bottom}`,
    `C ${round(cx - horizontal)} ${bottom} ${left} ${round(cy + vertical - wobble)} ${left} ${round(cy + wobble)} Z`,
  ].join(" ");
}

export function buildFieldGeometry(
  graph: FieldGraph,
  topology: FieldTopologyKind,
  focus = 0.5,
): FieldGeometry {
  const safeFocus = Math.max(0, Math.min(1, focus));
  const bendBase = BEND_BY_TOPOLOGY[topology];

  const flows = graph.links.flatMap(([fromIndex, toIndex], index) => {
    const from = graph.nodes[fromIndex];
    const to = graph.nodes[toIndex];
    if (!from || !to) return [];

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / length;
    const normalY = dx / length;
    const direction = index % 2 === 0 ? 1 : -1;
    const focusBias = (safeFocus - 0.5) * (topology === "benefits" ? 6 : 2.4);
    const bend =
      (bendBase + (index % 3) * 1.35 + focusBias) * direction;
    const controlOneX = from.x + dx * 0.3 + normalX * bend;
    const controlOneY = from.y + dy * 0.3 + normalY * bend;
    const controlTwoX = from.x + dx * 0.7 + normalX * bend * 0.62;
    const controlTwoY = from.y + dy * 0.7 + normalY * bend * 0.62;

    return [
      {
        d: `M ${round(from.x)} ${round(from.y)} C ${round(controlOneX)} ${round(controlOneY)} ${round(controlTwoX)} ${round(controlTwoY)} ${round(to.x)} ${round(to.y)}`,
        depth: round((from.depth + to.depth) / 2),
        opacity: round(0.24 + ((from.depth + to.depth) / 2) * 0.38),
        width: round(0.28 + Math.max(from.weight, to.weight) * 0.5),
      },
    ];
  });

  const contourCount = topology === "hero" ? 8 : topology === "cta" ? 7 : 6;
  const zones = graph.pressure.length > 0
    ? graph.pressure
    : [{ cx: 50, cy: 52, rx: 24, ry: 20, opacity: 0.1 }];
  const contours = Array.from({ length: contourCount }, (_, index) => {
    const zone = zones[index % zones.length];
    const tier = Math.floor(index / zones.length);
    const scale = 0.62 + tier * 0.24;
    const direction = index % 2 === 0 ? 1 : -1;
    const drift = (safeFocus - 0.5) * direction * 3.6;
    const depth = 0.16 + (index / Math.max(1, contourCount - 1)) * 0.5;

    return {
      d: organicLoop(
        zone.cx + drift,
        zone.cy - drift * 0.34,
        zone.rx * scale,
        zone.ry * (scale + (index % 3) * 0.035),
        direction * (0.7 + tier * 0.32),
      ),
      depth: round(depth),
      opacity: round(0.13 + depth * 0.26),
      width: round(0.24 + depth * 0.42),
    };
  });

  const satelliteCount = 8;
  const satellites = Array.from({ length: satelliteCount }, (_, index) => {
    const source = graph.nodes[(index * 2) % Math.max(1, graph.nodes.length)] ?? {
      x: 50,
      y: 50,
      depth: 0.5,
    };
    const next = graph.nodes[(index * 2 + 3) % Math.max(1, graph.nodes.length)] ?? source;
    const direction = index % 2 === 0 ? 1 : -1;
    const focusDrift = (safeFocus - 0.5) * direction * (4 + index * 0.35);

    return {
      cx: round(source.x * 0.72 + next.x * 0.28 + focusDrift),
      cy: round(source.y * 0.64 + next.y * 0.36 - focusDrift * 0.42),
      depth: round(0.12 + (index % 4) * 0.11),
      opacity: round(0.16 + (index % 3) * 0.07),
      r: round(0.45 + (index % 4) * 0.18),
    };
  });

  return { contours, flows, satellites };
}
