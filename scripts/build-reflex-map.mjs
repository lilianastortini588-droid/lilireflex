/**
 * Mapa de reflexología podal — Lili Reflexología
 * SVG vectorial + PNG/JPG de alta resolución.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { Resvg } from "@resvg/resvg-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "maps");

const W = 3000;
const H = 2000;

const C = {
  bg0: "#1A1520",
  bg1: "#261F2E",
  ivory: "#F6F1F8",
  paper: "#FCF8FD",
  taupe: "#B8A8C4",
  olive: "#8B6FA3",
  oliveSoft: "#B9A3CC",
  oliveDark: "#5C4A6E",
  bronze: "#9B7BB5",
  bronzeSoft: "#D4C2E4",
  liver: "#8A5A78",
  lung: "#7D6B8E",
  gold: "#C4A8D4",
  mute: "#A39AAD",
};

const FOOT = `
  M 60 5.2
  C 64.2 0.6 72.4 0.4 75.8 7.6
  C 78.6 2.4 86.2 2.6 88.4 9.8
  C 91.2 4.8 97.6 6.2 98.4 13.8
  C 101.8 10.2 107.2 13.6 105.6 20.8
  C 109.6 20.4 111.4 27.6 107.2 32.2
  C 110.4 36.4 109.2 44.8 104.4 48.6
  L 101.6 77.4
  C 102.2 86.8 98.4 94.6 90.2 98.4
  C 80.6 102.8 67.2 103.2 58.4 98.8
  C 50.2 94.8 46.4 86.6 46.8 78.2
  L 45.6 50.6
  C 37.2 49.4 31.6 43.2 33.4 36.2
  C 29.4 32.2 30.8 24.4 37.6 22.2
  C 35.2 16.2 39.8 9.6 47.6 8.8
  C 49.8 4.8 54.6 2.4 60 5.2
  Z
`.replace(/\s+/g, " ").trim();

function world(lx, ly, cx, cy, sx, sy) {
  return {
    x: cx + (lx - 70) * sx,
    y: cy + (ly - 52) * sy,
  };
}

function label(text, x, y, anchor, size, fill) {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" fill="${fill}"
    font-size="${size}" font-family="Helvetica Neue, Arial, sans-serif"
    font-weight="500" letter-spacing="0.04em">${text}</text>`;
}

function line(x1, y1, x2, y2) {
  return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}"
    stroke="${C.bronzeSoft}" stroke-opacity="0.32" stroke-width="1" fill="none" />`;
}

function renderFoot(cx, cy, sx, sy, side) {
  const title = side === "right" ? "Planta derecha" : "Planta izquierda";
  const clip = `clip-${side}`;
  const transform = `translate(${cx} ${cy}) scale(${sx} ${sy}) translate(-70 -52)`;

  const organs =
    side === "right"
      ? [
          ["Cerebro", 68, 6],
          ["Pituitaria", 64, 13],
          ["Tiroides", 62, 22],
          ["Pulmón", 82, 29],
          ["Hígado", 88, 40],
          ["Vesícula", 90, 48],
          ["Estómago", 70, 46],
          ["Páncreas", 74, 54],
          ["Riñón", 80, 61],
          ["Colon", 72, 70],
          ["Intestino", 68, 78],
          ["Vejiga", 62, 88],
          ["Pelvis", 70, 96],
        ]
      : [
          ["Cerebro", 68, 6],
          ["Pituitaria", 64, 13],
          ["Tiroides", 62, 22],
          ["Pulmón", 82, 29],
          ["Corazón", 88, 40],
          ["Bazo", 90, 48],
          ["Estómago", 70, 46],
          ["Páncreas", 74, 54],
          ["Riñón", 80, 61],
          ["Colon", 72, 70],
          ["Intestino", 68, 78],
          ["Vejiga", 62, 88],
          ["Pelvis", 70, 96],
        ];

  const laterals = [
    ["Senos", 54, 8],
    ["Ojo", 50, 16],
    ["Oído", 47, 24],
    ["Cuello", 44, 33],
    ["Hombro", 108, 36],
    ["Codo", 108, 52],
    ["Rodilla", 106, 70],
    ["Cadera", 100, 86],
    ["Cervicales", 40, 30],
    ["Dorsales", 39, 48],
    ["Lumbares", 40, 66],
    ["Sacro", 44, 82],
  ];

  const organLabels = organs
    .map(([text, lx, ly]) => {
      const p = world(lx, ly, cx, cy, sx, sy);
      return label(text, p.x, p.y, "middle", 15, C.ivory);
    })
    .join("");

  const lateralLabels = laterals
    .map(([text, lx, ly]) => {
      const p = world(lx, ly, cx, cy, sx, sy);
      const towardCenter = side === "right" ? lx < 55 : lx < 55;
      const anchor = (sx > 0 && towardCenter) || (sx < 0 && towardCenter) ? "end" : "start";
      const outward = sx > 0 ? (lx < 55 ? -18 : 18) : lx < 55 ? 18 : -18;
      const q = { x: p.x + outward, y: p.y };
      return (
        line(p.x, p.y, q.x, q.y) +
        label(text, q.x + (outward > 0 ? 8 : -8), q.y + 4, anchor, 14, C.mute)
      );
    })
    .join("");

  return `
    <g>
      <g transform="${transform}">
        <g filter="url(#soft)">
          <path d="${FOOT}" fill="${C.paper}" fill-opacity="0.07" />
        </g>
        <clipPath id="${clip}">
          <path d="${FOOT}" />
        </clipPath>
        <g clip-path="url(#${clip})">
          <path d="${FOOT}" fill="#262823" />
          <path d="M 60 6 C 64 2 72 2 76 8 C 72 14 64 15 58 13 Z" fill="${C.oliveSoft}" fill-opacity="0.95" />
          <path d="M 77 8 C 80 4 86 4 88 10 C 85 16 80 16 77 13 Z" fill="${C.olive}" fill-opacity="0.9" />
          <path d="M 89 10 C 92 6 97 7 98 14 C 95 18 90 18 89 14 Z" fill="${C.oliveSoft}" fill-opacity="0.88" />
          <path d="M 99 14 C 102 11 107 14 105 21 C 102 23 99 21 99 14 Z" fill="${C.olive}" fill-opacity="0.82" />
          <path d="M 56 14 C 66 16 74 17 77 24 C 70 31 58 30 53 24 Z" fill="${C.gold}" fill-opacity="0.78" />
          <path d="M 77 17 C 88 18 98 22 100 30 C 94 37 80 36 76 28 Z" fill="${C.lung}" fill-opacity="0.8" />
          <path d="M 52 26 C 64 28 76 30 80 38 C 72 45 58 44 50 38 Z" fill="${C.bronze}" fill-opacity="0.5" />
          <path d="M 78 30 C 92 32 102 38 101 48 C 93 54 78 52 76 42 Z" fill="${C.liver}" fill-opacity="0.7" />
          <path d="M 50 40 C 64 42 78 46 82 56 C 72 64 56 62 49 52 Z" fill="${C.bronzeSoft}" fill-opacity="0.38" />
          <path d="M 80 50 C 94 52 102 60 100 70 C 90 76 78 72 76 62 Z" fill="${C.gold}" fill-opacity="0.34" />
          <path d="M 50 56 C 66 58 82 64 84 76 C 74 84 56 80 50 70 Z" fill="${C.liver}" fill-opacity="0.46" />
          <path d="M 52 84 C 68 86 86 91 86 97 C 74 102 56 100 52 93 Z" fill="${C.gold}" fill-opacity="0.52" />
          <path d="M 47 28 C 50 46 50 68 52 82 C 49 82 48 60 47.4 40 Z" fill="${C.oliveDark}" fill-opacity="0.5" />
          <path d="M 104 36 C 108 46 107 64 103 78 C 100 76 101 50 104 36 Z" fill="${C.olive}" fill-opacity="0.38" />
          <path d="${FOOT}" fill="url(#sheen)" />
        </g>
        <path d="${FOOT}" fill="none" stroke="${C.oliveSoft}" stroke-width="1.05" stroke-linejoin="round" />
      </g>
      ${organLabels}
      ${lateralLabels}
      ${label(title.toUpperCase(), cx, cy + sy * 56, "middle", 20, C.bronzeSoft)}
    </g>
  `;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.bg0}" />
      <stop offset="60%" stop-color="${C.bg1}" />
      <stop offset="100%" stop-color="#171815" />
    </linearGradient>
    <radialGradient id="glowL" cx="33%" cy="44%" r="36%">
      <stop offset="0%" stop-color="${C.olive}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${C.olive}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowR" cx="67%" cy="44%" r="36%">
      <stop offset="0%" stop-color="${C.bronze}" stop-opacity="0.13" />
      <stop offset="100%" stop-color="${C.bronze}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.ivory}" stop-opacity="0.09" />
      <stop offset="50%" stop-color="${C.ivory}" stop-opacity="0" />
      <stop offset="100%" stop-color="${C.bronze}" stop-opacity="0.06" />
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.05" />
      </feComponentTransfer>
    </filter>
    <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="16" />
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect width="${W}" height="${H}" fill="url(#glowL)" />
  <rect width="${W}" height="${H}" fill="url(#glowR)" />
  <rect width="${W}" height="${H}" filter="url(#grain)" />

  <text x="160" y="118" fill="${C.bronzeSoft}" font-size="18"
    font-family="Helvetica Neue, Arial, sans-serif" font-weight="600" letter-spacing="0.34em">LILI REFLEXOLOGÍA</text>
  <text x="160" y="176" fill="${C.ivory}" font-size="44"
    font-family="Georgia, Times New Roman, serif" font-style="italic">Mapa de reflexología podal</text>
  <path d="M 160 198 H 448" stroke="${C.olive}" stroke-width="1.5" fill="none" />

  ${renderFoot(980, 1000, 11.6, 15.8, "right")}
  ${renderFoot(2020, 1000, -11.6, 15.8, "left")}

  <text x="${W / 2}" y="${H - 60}" text-anchor="middle" fill="${C.mute}" font-size="16"
    font-family="Helvetica Neue, Arial, sans-serif" letter-spacing="0.06em">
    Correspondencias tradicionales de la planta del pie · uso educativo, no diagnóstico clínico
  </text>
</svg>`;

const svgPath = join(outDir, "reflexologia-podal.svg");
const pngPath = join(outDir, "reflexologia-podal.png");
const jpgPath = join(outDir, "reflexologia-podal.jpg");

writeFileSync(svgPath, svg);

const png = new Resvg(svg, {
  fitTo: { mode: "width", value: 3000 },
  font: { loadSystemFonts: true },
  background: C.bg0,
}).render().asPng();

writeFileSync(pngPath, png);
execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "90", pngPath, "--out", jpgPath]);

console.log(svgPath);
console.log(pngPath);
console.log(jpgPath);
