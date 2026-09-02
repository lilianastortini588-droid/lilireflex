import type { FieldGraph, FieldNode, FieldTopologyKind } from "./types";

const BASE_NODES: FieldNode[] = [
  { x: 42, y: 18, r: 2.2, depth: 0.35, weight: 0.7 },
  { x: 54, y: 16, r: 1.6, depth: 0.2, weight: 0.45 },
  { x: 66, y: 20, r: 2.4, depth: 0.4, weight: 0.75 },
  { x: 34, y: 32, r: 1.8, depth: 0.25, weight: 0.5 },
  { x: 48, y: 30, r: 2.8, depth: 0.55, weight: 1 },
  { x: 62, y: 34, r: 1.7, depth: 0.3, weight: 0.55 },
  { x: 76, y: 36, r: 2.1, depth: 0.38, weight: 0.65 },
  { x: 28, y: 48, r: 2.4, depth: 0.42, weight: 0.7 },
  { x: 44, y: 46, r: 1.9, depth: 0.32, weight: 0.6 },
  { x: 58, y: 50, r: 3.1, depth: 0.72, weight: 1 },
  { x: 72, y: 52, r: 1.8, depth: 0.28, weight: 0.5 },
  { x: 36, y: 64, r: 2, depth: 0.36, weight: 0.62 },
  { x: 52, y: 66, r: 2.6, depth: 0.58, weight: 0.85 },
  { x: 68, y: 68, r: 1.7, depth: 0.3, weight: 0.52 },
  { x: 44, y: 80, r: 2.2, depth: 0.44, weight: 0.68 },
  { x: 60, y: 82, r: 1.9, depth: 0.34, weight: 0.58 },
  { x: 50, y: 94, r: 2.5, depth: 0.48, weight: 0.72 },
];

const BASE_LINKS: FieldGraph["links"] = [
  [0, 4],
  [1, 4],
  [2, 5],
  [4, 9],
  [5, 9],
  [7, 9],
  [9, 12],
  [10, 12],
  [12, 14],
  [12, 15],
  [14, 16],
];

function cloneNodes(nodes: FieldNode[]): FieldNode[] {
  return nodes.map((node) => ({ ...node }));
}

function spreadFromCenter(nodes: FieldNode[], cx: number, cy: number, factor: number): FieldNode[] {
  return nodes.map((node) => ({
    ...node,
    x: cx + (node.x - cx) * factor,
    y: cy + (node.y - cy) * factor,
  }));
}

function pullToCenter(nodes: FieldNode[], cx: number, cy: number, amount: number): FieldNode[] {
  return nodes.map((node) => ({
    ...node,
    x: node.x + (cx - node.x) * amount,
    y: node.y + (cy - node.y) * amount,
  }));
}

function shiftNodes(nodes: FieldNode[], dx: number, dy: number): FieldNode[] {
  return nodes.map((node) => ({ ...node, x: node.x + dx, y: node.y + dy }));
}

export function buildPromoGraph(sessions: number): FieldGraph {
  const count = Math.max(1, Math.min(8, sessions));
  const nodes: FieldNode[] = [];
  const links: FieldGraph["links"] = [];

  const layouts: Record<number, Array<[number, number]>> = {
    1: [[50, 52]],
    4: [
      [38, 42],
      [62, 40],
      [36, 62],
      [64, 64],
    ],
    8: [
      [28, 38],
      [44, 34],
      [56, 36],
      [72, 40],
      [30, 58],
      [46, 62],
      [60, 66],
      [74, 60],
    ],
  };

  const positions = layouts[count] ?? layouts[1];

  positions.forEach(([x, y], index) => {
    nodes.push({
      x,
      y,
      r: count === 1 ? 3.2 : count <= 4 ? 2.4 : 2,
      depth: 0.45 + (index % 3) * 0.12,
      weight: index === 0 ? 1 : 0.72,
    });
  });

  if (count > 1) {
    for (let i = 0; i < nodes.length - 1; i += 1) {
      links.push([i, i + 1]);
    }
    if (count === 4) {
      links.push([0, 2], [1, 3]);
    }
    if (count === 8) {
      links.push([0, 4], [1, 5], [2, 6], [3, 7], [4, 5], [6, 7]);
    }
  }

  return {
    nodes,
    links,
    pressure: [
      { cx: 50, cy: 52, rx: 28, ry: 24, opacity: 0.14 },
    ],
  };
}

export function buildTopology(
  kind: FieldTopologyKind,
  focus = 0.5,
  sessions = 1,
): FieldGraph {
  if (kind === "promotions") {
    return buildPromoGraph(sessions);
  }

  let nodes = cloneNodes(BASE_NODES);
  let pressure: FieldGraph["pressure"] = [
    { cx: 50, cy: 42, rx: 24, ry: 20, opacity: 0.12 },
    { cx: 48, cy: 68, rx: 18, ry: 16, opacity: 0.08 },
  ];

  switch (kind) {
    case "hero":
      nodes = spreadFromCenter(nodes, 50, 52, 1.12);
      nodes = shiftNodes(nodes, 0, -4);
      pressure = [
        { cx: 50, cy: 38, rx: 34, ry: 28, opacity: 0.16 },
        { cx: 62, cy: 58, rx: 22, ry: 18, opacity: 0.1 },
      ];
      break;
    case "reflexology":
      nodes = pullToCenter(nodes, 50, 52, 0.1);
      nodes = spreadFromCenter(nodes, 50, 52, 1.04);
      pressure = [{ cx: 50, cy: 50, rx: 24, ry: 26, opacity: 0.18 }];
      break;
    case "benefits": {
      const spread = 1.04 + (0.5 - focus) * 0.24;
      const converge = focus > 0.72 ? (focus - 0.72) / 0.28 : 0;
      nodes = spreadFromCenter(nodes, 50, 54, spread);
      nodes = pullToCenter(nodes, 50, 54, converge * 0.35);
      if (focus < 0.35) {
        nodes = nodes.map((node) => ({ ...node, r: node.r * 0.96 }));
      }
      if (focus > 0.45 && focus < 0.62) {
        pressure = [
          { cx: 42, cy: 48, rx: 16, ry: 14, opacity: 0.1 },
          { cx: 58, cy: 60, rx: 16, ry: 14, opacity: 0.1 },
        ];
      }
      break;
    }
    case "cta":
      nodes = pullToCenter(nodes, 50, 78, 0.38);
      nodes = spreadFromCenter(nodes, 50, 78, 0.86);
      pressure = [{ cx: 50, cy: 72, rx: 30, ry: 22, opacity: 0.14 }];
      break;
    default:
      break;
  }

  const focusIndex = Math.round(focus * (nodes.length - 1));
  if (kind !== "hero" && kind !== "cta") {
    nodes[focusIndex] = {
      ...nodes[focusIndex],
      r: nodes[focusIndex].r + 0.8,
      weight: 1,
    };
  }

  return { nodes, links: BASE_LINKS, pressure };
}
