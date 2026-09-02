import type { WebGLPolicy } from "@/lib/visual-system";

export type WaterQualityTier = "ultra" | "high" | "balanced" | "recovery";
export type WaterRenderTier = WaterQualityTier | "static" | "fallback";

export type WaterQualityProfile = {
  tier: WaterRenderTier;
  targetFps: 0 | 30 | 45 | 60;
  pixelRatioCap: number;
  simulationLongEdge: number;
};

export type WaterQualitySnapshot = {
  tier: WaterQualityTier;
  targetFps: 30 | 45 | 60;
};

const WATER_QUALITY_PROFILES: Record<WaterQualityTier, WaterQualityProfile> = {
  ultra: {
    tier: "ultra",
    targetFps: 60,
    pixelRatioCap: 1.75,
    simulationLongEdge: 512,
  },
  high: {
    tier: "high",
    targetFps: 60,
    pixelRatioCap: 1.5,
    simulationLongEdge: 384,
  },
  balanced: {
    tier: "balanced",
    targetFps: 45,
    pixelRatioCap: 1.25,
    simulationLongEdge: 320,
  },
  recovery: {
    tier: "recovery",
    targetFps: 30,
    pixelRatioCap: 1,
    simulationLongEdge: 224,
  },
};

const STATIC_WATER_PROFILE: WaterQualityProfile = {
  tier: "static",
  targetFps: 0,
  pixelRatioCap: 1,
  simulationLongEdge: 224,
};

const FALLBACK_WATER_PROFILE: WaterQualityProfile = {
  tier: "fallback",
  targetFps: 0,
  pixelRatioCap: 0,
  simulationLongEdge: 0,
};

export function resolveWaterQuality({
  policy,
  tier,
}: {
  policy: WebGLPolicy;
  tier: WaterQualityTier;
}): WaterQualityProfile {
  if (policy === "fallback") return { ...FALLBACK_WATER_PROFILE };
  if (policy === "static") return { ...STATIC_WATER_PROFILE };
  return { ...WATER_QUALITY_PROFILES[tier] };
}

export function resolveWaterSimulationSize({
  width,
  height,
  longEdge,
}: {
  width: number;
  height: number;
  longEdge: number;
}) {
  if (longEdge <= 0) return { width: 0, height: 0 };
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const ratio = Math.min(safeWidth, safeHeight) / Math.max(safeWidth, safeHeight);
  const shortEdge = Math.max(128, Math.round(longEdge * ratio));
  return safeWidth >= safeHeight
    ? { width: longEdge, height: shortEdge }
    : { width: shortEdge, height: longEdge };
}

const TARGET_FPS: Record<WaterQualityTier, WaterQualitySnapshot["targetFps"]> = {
  ultra: 60,
  high: 60,
  balanced: 45,
  recovery: 30,
};

function isFiniteMetric(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function createAdaptiveWaterQualityController() {
  let tier: WaterQualityTier = "high";
  let smoothedFrameMs = 1000 / 60;
  let smoothedRenderMs = 0;
  let smoothedGpuMs: number | null = null;
  let pressureSince: number | null = null;
  let recoverySince: number | null = null;
  let transitionedAt = Number.NEGATIVE_INFINITY;

  const getSnapshot = (): WaterQualitySnapshot => ({
    tier,
    targetFps: TARGET_FPS[tier],
  });

  const resetWindows = () => {
    pressureSince = null;
    recoverySince = null;
  };

  const transitionTo = (nextTier: WaterQualityTier, time: number) => {
    tier = nextTier;
    transitionedAt = time;
    resetWindows();
  };

  const sustain = ({
    active,
    time,
    duration,
    direction,
    nextTier,
  }: {
    active: boolean;
    time: number;
    duration: number;
    direction: "pressure" | "recovery";
    nextTier: WaterQualityTier;
  }) => {
    if (!active) {
      if (direction === "pressure") pressureSince = null;
      else recoverySince = null;
      return;
    }
    if (direction === "pressure") {
      recoverySince = null;
      pressureSince ??= time;
      if (time - pressureSince >= duration) transitionTo(nextTier, time);
    } else {
      pressureSince = null;
      recoverySince ??= time;
      if (time - recoverySince >= duration) transitionTo(nextTier, time);
    }
  };

  return {
    sample({
      time,
      frameMs,
      renderMs,
      gpuMs,
    }: {
      time: number;
      frameMs: number;
      renderMs: number | null;
      gpuMs: number | null;
    }) {
      if (!Number.isFinite(time) || frameMs <= 0 || frameMs > 250) {
        smoothedFrameMs = 1000 / 60;
        resetWindows();
        return getSnapshot();
      }

      smoothedFrameMs += (frameMs - smoothedFrameMs) * 0.24;
      if (isFiniteMetric(renderMs)) {
        smoothedRenderMs += (renderMs - smoothedRenderMs) * 0.28;
      }
      if (isFiniteMetric(gpuMs)) {
        smoothedGpuMs ??= gpuMs;
        smoothedGpuMs += (gpuMs - smoothedGpuMs) * 0.24;
      }

      const deliveredFps = 1000 / Math.max(smoothedFrameMs, 0.1);
      const gpu = smoothedGpuMs ?? 0;

      if (time - transitionedAt < 400) return getSnapshot();

      if (tier === "ultra") {
        sustain({
          active: deliveredFps < 56 || smoothedRenderMs > 10 || gpu > 10,
          time,
          duration: 600,
          direction: "pressure",
          nextTier: "high",
        });
      } else if (tier === "high") {
        const pressured = deliveredFps < 52 || smoothedRenderMs > 14 || gpu > 13;
        if (pressured) {
          sustain({
            active: true,
            time,
            duration: 650,
            direction: "pressure",
            nextTier: "balanced",
          });
        } else {
          pressureSince = null;
          sustain({
            active:
              deliveredFps > 57 &&
              smoothedRenderMs < 8 &&
              (smoothedGpuMs == null || gpu < 9),
            time,
            duration: 4_000,
            direction: "recovery",
            nextTier: "ultra",
          });
        }
      } else if (tier === "balanced") {
        const pressured = deliveredFps < 38 || smoothedRenderMs > 23 || gpu > 21;
        if (pressured) {
          sustain({
            active: true,
            time,
            duration: 650,
            direction: "pressure",
            nextTier: "recovery",
          });
        } else {
          pressureSince = null;
          sustain({
            active:
              deliveredFps > 53 &&
              smoothedRenderMs < 12 &&
              (smoothedGpuMs == null || gpu < 11),
            time,
            duration: 3_200,
            direction: "recovery",
            nextTier: "high",
          });
        }
      } else {
        pressureSince = null;
        sustain({
          active:
            deliveredFps > 42 &&
            smoothedRenderMs < 17 &&
            (smoothedGpuMs == null || gpu < 16),
          time,
          duration: 3_200,
          direction: "recovery",
          nextTier: "balanced",
        });
      }

      return getSnapshot();
    },
    reset() {
      tier = "high";
      smoothedFrameMs = 1000 / 60;
      smoothedRenderMs = 0;
      smoothedGpuMs = null;
      transitionedAt = Number.NEGATIVE_INFINITY;
      resetWindows();
      return getSnapshot();
    },
    getSnapshot,
  };
}

export const WATER_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const WATER_SIMULATION_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uPointer;
uniform float uImpulse;
uniform float uDelta;
uniform float uDamping;

vec2 decodeState(vec2 encoded) {
  return encoded * 2.0 - 1.0;
}

vec2 encodeState(vec2 state) {
  return clamp(state * 0.5 + 0.5, 0.0, 1.0);
}

float readHeight(vec2 uv) {
  return decodeState(texture2D(uState, uv).rg).x;
}

void main() {
  vec2 state = decodeState(texture2D(uState, vUv).rg);
  float height = state.x;
  float velocity = state.y;
  float left = readHeight(vUv - vec2(uTexel.x, 0.0));
  float right = readHeight(vUv + vec2(uTexel.x, 0.0));
  float down = readHeight(vUv - vec2(0.0, uTexel.y));
  float up = readHeight(vUv + vec2(0.0, uTexel.y));
  float laplacian = (left + right + down + up) * 0.25 - height;
  float stepScale = clamp(uDelta * 60.0, 0.35, 1.45);
  float damping = pow(clamp(uDamping, 0.8, 0.9995), stepScale);

  velocity += laplacian * 0.39 * stepScale;
  vec2 pointerDelta = vUv - uPointer;
  pointerDelta.x *= uTexel.y / max(uTexel.x, 0.00001);
  float distanceToPointer = length(pointerDelta);
  float gaussian = exp(-distanceToPointer * distanceToPointer * 520.0);
  float negativeRing = exp(-pow(distanceToPointer - 0.042, 2.0) * 2400.0);
  velocity += (gaussian - negativeRing * 0.34) * uImpulse * 0.095;
  velocity *= damping;
  height = clamp(height + velocity * stepScale, -0.96, 0.96);

  gl_FragColor = vec4(encodeState(vec2(height, velocity)), 0.0, 1.0);
}
`;

export const WATER_SURFACE_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;
uniform sampler2D uHeightMap;
uniform vec2 uTexel;
uniform vec2 uResolution;
uniform float uTime;
uniform float uPhase;
uniform float uScale;
uniform float uIntensity;
uniform float uDark;
uniform float uNormalStrength;

float readWaterHeight(vec2 uv) {
  return texture2D(uHeightMap, uv).r * 2.0 - 1.0;
}

vec2 ambientSlope(vec2 uv, float time) {
  vec2 p = uv * vec2(1.0, uResolution.y / max(uResolution.x, 1.0));
  float phaseA = dot(p, vec2(8.4, 5.7)) + time * 0.32 + uPhase * 6.2831;
  float phaseB = dot(p, vec2(-5.2, 10.8)) - time * 0.23 + uPhase * 3.7;
  return vec2(
    cos(phaseA) * 0.010 - cos(phaseB) * 0.008,
    cos(phaseA) * 0.007 + cos(phaseB) * 0.014
  );
}

void main() {
  float centerHeight = readWaterHeight(vUv);
  float left = readWaterHeight(vUv - vec2(uTexel.x, 0.0));
  float right = readWaterHeight(vUv + vec2(uTexel.x, 0.0));
  float down = readWaterHeight(vUv - vec2(0.0, uTexel.y));
  float up = readWaterHeight(vUv + vec2(0.0, uTexel.y));
  vec2 gradient = vec2(right - left, up - down);
  vec2 slope = gradient * uNormalStrength + ambientSlope(vUv, uTime);
  vec3 waterNormal = normalize(vec3(-slope.x, -slope.y, 1.0));

  vec3 lightDirection = normalize(vec3(-0.34, 0.46, 0.82));
  vec3 halfDirection = normalize(lightDirection + vec3(0.0, 0.0, 1.0));
  float fresnel = pow(1.0 - clamp(waterNormal.z, 0.0, 1.0), 2.7);
  float specular = pow(max(dot(waterNormal, halfDirection), 0.0), 86.0);
  float crest = smoothstep(0.018, 0.16, abs(centerHeight)) *
    smoothstep(0.012, 0.12, length(gradient));
  float caustic = pow(
    max(0.0, 0.5 + 0.5 * sin(
      (vUv.x + slope.x * 1.8) * (38.0 + uScale * 2.0) +
      (vUv.y + slope.y * 1.4) * 27.0 +
      uTime * 0.42 + uPhase * 9.0
    )),
    7.0
  ) * (0.25 + length(slope) * 2.4);

  vec3 pearl = vec3(0.969, 0.932, 0.974);
  vec3 lavender = vec3(0.710, 0.579, 0.828);
  vec3 orchid = vec3(0.555, 0.367, 0.704);
  vec3 color = mix(lavender, pearl, 0.64 + fresnel * 0.36);
  color = mix(color, orchid, caustic * 0.18 + uDark * 0.06);
  color += pearl * specular * 0.92;
  color += lavender * crest * 0.22;

  vec2 centered = vUv - 0.5;
  float edge = smoothstep(0.78, 0.12, length(centered * vec2(0.78, 1.0)));
  float opticalEnergy =
    fresnel * 0.24 + specular * 0.34 + crest * 0.16 + caustic * 0.065;
  float alpha = clamp(
    (0.028 + opticalEnergy) * (0.68 + uIntensity * 0.42) * edge,
    0.0,
    0.34
  );
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
