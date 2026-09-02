export type FieldNode = {
  x: number;
  y: number;
  r: number;
  depth: number;
  weight: number;
};

export type FieldPressure = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity: number;
};

export type FieldLink = [number, number];

export type FieldTopologyKind =
  | "hero"
  | "reflexology"
  | "benefits"
  | "promotions"
  | "cta"
  | "base";

export type FieldTheme = "light" | "dark";
export type FieldMotion = "pulse" | "static" | "settled" | "frozen";

export type FieldGraph = {
  nodes: FieldNode[];
  links: FieldLink[];
  pressure: FieldPressure[];
};
