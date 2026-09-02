"use client";

import { useEffect, useRef, useState } from "react";
import type * as ThreeTypes from "three";
import { cn } from "@/lib/cn";
import {
  createAdaptiveWaterQualityController,
  resolveWaterQuality,
  resolveWaterSimulationSize,
  WATER_SIMULATION_FRAGMENT_SHADER,
  WATER_SURFACE_FRAGMENT_SHADER,
  WATER_VERTEX_SHADER,
  type WaterQualitySnapshot,
} from "@/lib/transparent-water";
import {
  createFrameCadenceGate,
  getVisualSurface,
  resolveWebGLFrameInterval,
  resolveWebGLPolicy,
  type VisualSurfaceDefinition,
  type VisualSurfaceKind,
  type WebGLPolicy,
} from "@/lib/visual-system";
import { visualRuntime } from "@/lib/visual-runtime";

type NavigatorCapabilities = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

type GpuTimerExtension = {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
};

function mix(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

function createWaterTarget(
  THREE: typeof ThreeTypes,
  textureType: ThreeTypes.TextureDataType,
) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: textureType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    generateMipmaps: false,
    depthBuffer: false,
    stencilBuffer: false,
  });
  target.texture.colorSpace = THREE.NoColorSpace;
  target.texture.generateMipmaps = false;
  return target;
}

function createGpuTimer(context: WebGLRenderingContext | WebGL2RenderingContext) {
  if (!("createQuery" in context)) return null;
  const gl = context as WebGL2RenderingContext;
  const extension = gl.getExtension(
    "EXT_disjoint_timer_query_webgl2",
  ) as GpuTimerExtension | null;
  if (!extension) return null;

  let pending: WebGLQuery | null = null;
  let active = false;

  return {
    begin() {
      if (pending || active) return false;
      const query = gl.createQuery();
      if (!query) return false;
      try {
        gl.beginQuery(extension.TIME_ELAPSED_EXT, query);
        pending = query;
        active = true;
        return true;
      } catch {
        gl.deleteQuery(query);
        return false;
      }
    },
    end() {
      if (!active) return;
      try {
        gl.endQuery(extension.TIME_ELAPSED_EXT);
      } finally {
        active = false;
      }
    },
    poll() {
      if (!pending || active) return null;
      const available = gl.getQueryParameter(
        pending,
        gl.QUERY_RESULT_AVAILABLE,
      ) as boolean;
      const disjoint = gl.getParameter(extension.GPU_DISJOINT_EXT) as boolean;
      if (!available) return null;
      const query = pending;
      pending = null;
      const nanoseconds = gl.getQueryParameter(query, gl.QUERY_RESULT) as number;
      gl.deleteQuery(query);
      return disjoint ? null : nanoseconds / 1_000_000;
    },
    dispose() {
      if (active) {
        try {
          gl.endQuery(extension.TIME_ELAPSED_EXT);
        } catch {
          // The context can already be lost during teardown.
        }
        active = false;
      }
      if (pending) gl.deleteQuery(pending);
      pending = null;
    },
  };
}

export function WaterSurface({
  className,
  active = true,
  surface = "hero",
}: {
  className?: string;
  active?: boolean;
  surface?: VisualSurfaceKind;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<VisualSurfaceDefinition>(getVisualSurface(surface));
  const drawOnceRef = useRef<(() => void) | null>(null);
  const [policy, setPolicy] = useState<WebGLPolicy>("fallback");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [contextVersion, setContextVersion] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    let lastViewportWidth = Number.NaN;

    const updatePolicy = (force = false) => {
      const capabilities = navigator as NavigatorCapabilities;
      const viewportWidth = visualRuntime.getScrollSnapshot().viewportWidth;
      const resolvedViewportWidth =
        viewportWidth > 1 ? viewportWidth : window.innerWidth;
      if (!force && resolvedViewportWidth === lastViewportWidth) return;
      lastViewportWidth = resolvedViewportWidth;
      setPolicy(
        resolveWebGLPolicy({
          reducedMotion: reduced.matches,
          coarsePointer: coarse.matches,
          saveData: capabilities.connection?.saveData === true,
          viewportWidth: resolvedViewportWidth,
          deviceMemory: capabilities.deviceMemory,
        }),
      );
    };

    updatePolicy();
    const unsubscribeScroll = visualRuntime.subscribeScroll(() => updatePolicy());
    const onCapabilityChange = () => updatePolicy(true);
    reduced.addEventListener("change", onCapabilityChange);
    coarse.addEventListener("change", onCapabilityChange);

    return () => {
      unsubscribeScroll();
      reduced.removeEventListener("change", onCapabilityChange);
      coarse.removeEventListener("change", onCapabilityChange);
    };
  }, []);

  useEffect(() => {
    surfaceRef.current = getVisualSurface(surface);
    drawOnceRef.current?.();
  }, [surface]);

  useEffect(() => {
    if (!active || policy === "fallback") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    let dispose = () => {};

    void (async () => {
      try {
        const THREE = await import("three");
        if (cancelled) return;
        setFailed(false);

        const renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: false,
          depth: false,
          powerPreference: "high-performance",
          premultipliedAlpha: true,
        });
        renderer.setClearColor(0x000000, 0);

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const geometry = new THREE.PlaneGeometry(2, 2);
        const context = renderer.getContext();
        const supportsHalfFloat =
          "createQuery" in context &&
          renderer.extensions.has("EXT_color_buffer_float");
        const textureType = supportsHalfFloat
          ? THREE.HalfFloatType
          : THREE.UnsignedByteType;
        let readTarget = createWaterTarget(THREE, textureType);
        let writeTarget = createWaterTarget(THREE, textureType);

        const simulationUniforms = {
          uState: { value: readTarget.texture },
          uTexel: { value: new THREE.Vector2(1, 1) },
          uPointer: { value: new THREE.Vector2(0.5, 0.5) },
          uImpulse: { value: 0 },
          uDelta: { value: 1 / 60 },
          uDamping: { value: 0.988 },
        };
        const displayUniforms = {
          uHeightMap: { value: readTarget.texture },
          uTexel: { value: new THREE.Vector2(1, 1) },
          uResolution: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uPhase: { value: surfaceRef.current.shaderPhase },
          uScale: { value: surfaceRef.current.shaderScale },
          uIntensity: { value: surfaceRef.current.webglIntensity },
          uDark: { value: surfaceRef.current.theme === "dark" ? 1 : 0 },
          uNormalStrength: { value: 26 },
        };
        const simulationMaterial = new THREE.ShaderMaterial({
          vertexShader: WATER_VERTEX_SHADER,
          fragmentShader: WATER_SIMULATION_FRAGMENT_SHADER,
          uniforms: simulationUniforms,
          depthTest: false,
          depthWrite: false,
          blending: THREE.NoBlending,
        });
        const displayMaterial = new THREE.ShaderMaterial({
          vertexShader: WATER_VERTEX_SHADER,
          fragmentShader: WATER_SURFACE_FRAGMENT_SHADER,
          uniforms: displayUniforms,
          transparent: true,
          premultipliedAlpha: true,
          depthTest: false,
          depthWrite: false,
        });
        const simulationScene = new THREE.Scene();
        const displayScene = new THREE.Scene();
        const simulationPlane = new THREE.Mesh(geometry, simulationMaterial);
        const displayPlane = new THREE.Mesh(geometry, displayMaterial);
        simulationScene.add(simulationPlane);
        displayScene.add(displayPlane);

        const gpuTimer = createGpuTimer(context);
        const qualityController = createAdaptiveWaterQualityController();
        const cadence = createFrameCadenceGate();
        let qualitySnapshot: WaterQualitySnapshot = qualityController.reset();
        let qualityProfile = resolveWaterQuality({
          policy,
          tier: qualitySnapshot.tier,
        });
        let running = true;
        let staticDrawPending = policy === "static";
        let wasScrolling = false;
        let canvasWidth = 0;
        let canvasHeight = 0;
        let canvasPixelRatio = 0;
        let simulationWidth = 0;
        let simulationHeight = 0;
        let lastFrameAt: number | null = null;
        let lastDrawAt: number | null = null;
        let lastRenderMs: number | null = null;
        let lastGpuMs: number | null = null;
        const current = { ...surfaceRef.current };
        const pointer = {
          targetX: 0.5,
          targetY: 0.5,
          currentX: 0.5,
          currentY: 0.5,
          eventX: 0.5,
          eventY: 0.5,
          eventAt: 0,
          impulse: 0,
        };

        const publishBudget = (scrolling = false) => {
          const paused =
            !running || scrolling || document.hidden || policy !== "animated";
          canvas.dataset.waterQuality = qualityProfile.tier;
          canvas.dataset.waterSimulation = `${simulationWidth}x${simulationHeight}`;
          canvas.dataset.waterPrecision = supportsHalfFloat ? "half-float" : "uint8";
          canvas.dataset.waterInteraction =
            policy === "animated" ? "pointer-wave" : "static";
          canvas.dataset.visualFpsTier = paused
            ? "paused"
            : qualitySnapshot.tier;
          canvas.dataset.visualTargetFps = paused
            ? "0"
            : String(qualitySnapshot.targetFps);
          canvas.dataset.waterGpuMs =
            lastGpuMs == null ? "unavailable" : lastGpuMs.toFixed(2);
        };

        const resetTargets = () => {
          const previousColor = new THREE.Color();
          renderer.getClearColor(previousColor);
          const previousAlpha = renderer.getClearAlpha();
          renderer.setClearColor(new THREE.Color(0.5, 0.5, 0), 1);
          renderer.setRenderTarget(readTarget);
          renderer.clear(true, false, false);
          renderer.setRenderTarget(writeTarget);
          renderer.clear(true, false, false);
          renderer.setRenderTarget(null);
          renderer.setClearColor(previousColor, previousAlpha);
          simulationUniforms.uState.value = readTarget.texture;
          displayUniforms.uHeightMap.value = readTarget.texture;
        };

        const resize = (force = false) => {
          const width = Math.max(1, canvas.clientWidth);
          const height = Math.max(1, canvas.clientHeight);
          const devicePixelRatio =
            Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0
              ? window.devicePixelRatio
              : 1;
          const pixelRatio = Math.min(
            devicePixelRatio,
            qualityProfile.pixelRatioCap,
          );
          const simulationSize = resolveWaterSimulationSize({
            width,
            height,
            longEdge: qualityProfile.simulationLongEdge,
          });
          const unchanged =
            width === canvasWidth &&
            height === canvasHeight &&
            pixelRatio === canvasPixelRatio &&
            simulationSize.width === simulationWidth &&
            simulationSize.height === simulationHeight;
          if (!force && unchanged) return false;

          canvasWidth = width;
          canvasHeight = height;
          canvasPixelRatio = pixelRatio;
          simulationWidth = simulationSize.width;
          simulationHeight = simulationSize.height;
          renderer.setPixelRatio(pixelRatio);
          renderer.setSize(width, height, false);
          readTarget.setSize(simulationWidth, simulationHeight);
          writeTarget.setSize(simulationWidth, simulationHeight);
          simulationUniforms.uTexel.value.set(
            1 / Math.max(1, simulationWidth),
            1 / Math.max(1, simulationHeight),
          );
          displayUniforms.uTexel.value.copy(simulationUniforms.uTexel.value);
          displayUniforms.uResolution.value.set(canvas.width, canvas.height);
          canvas.dataset.webglPixelRatio = String(pixelRatio);
          resetTargets();
          publishBudget();
          return true;
        };

        const applyQuality = (snapshot: WaterQualitySnapshot) => {
          qualitySnapshot = snapshot;
          qualityProfile = resolveWaterQuality({
            policy,
            tier: qualitySnapshot.tier,
          });
          displayUniforms.uNormalStrength.value =
            qualitySnapshot.tier === "ultra"
              ? 30
              : qualitySnapshot.tier === "high"
                ? 27
                : qualitySnapshot.tier === "balanced"
                  ? 24
                  : 21;
          resize(true);
          cadence.requestImmediate();
          publishBudget();
        };

        const onPointerMove = (event: PointerEvent) => {
          if (event.pointerType === "touch") return;
          const now = Number.isFinite(event.timeStamp)
            ? event.timeStamp
            : performance.now();
          const nextX = Math.min(1, Math.max(0, event.clientX / window.innerWidth));
          const nextY = Math.min(
            1,
            Math.max(0, 1 - event.clientY / window.innerHeight),
          );
          const elapsed = Math.min(80, Math.max(8, now - pointer.eventAt)) / 1000;
          const travel = Math.hypot(
            nextX - pointer.eventX,
            nextY - pointer.eventY,
          );
          const speed = travel / elapsed;
          pointer.targetX = nextX;
          pointer.targetY = nextY;
          pointer.eventX = nextX;
          pointer.eventY = nextY;
          pointer.eventAt = now;
          pointer.impulse = Math.max(
            pointer.impulse,
            Math.min(1, 0.1 + speed * 0.075),
          );
          canvas.dataset.waterPointerSamples = String(
            Number(canvas.dataset.waterPointerSamples ?? 0) + 1,
          );
          canvas.dataset.waterPointerX = nextX.toFixed(4);
          canvas.dataset.waterPointerY = nextY.toFixed(4);
        };

        const draw = (time = 0) => {
          if (!running || document.hidden) return null;
          resize();
          const startedAt = performance.now();
          const target = surfaceRef.current;
          const blend = policy === "animated" ? 0.04 : 1;
          current.theme = target.theme;
          current.webglIntensity = mix(
            current.webglIntensity,
            target.webglIntensity,
            blend,
          );
          current.shaderPhase = mix(current.shaderPhase, target.shaderPhase, blend);
          current.shaderScale = mix(current.shaderScale, target.shaderScale, blend);
          displayUniforms.uTime.value = time * 0.001;
          displayUniforms.uPhase.value = current.shaderPhase;
          displayUniforms.uScale.value = current.shaderScale;
          displayUniforms.uIntensity.value = current.webglIntensity;
          displayUniforms.uDark.value = current.theme === "dark" ? 1 : 0;

          const queried = policy === "animated" && gpuTimer?.begin() === true;
          if (policy === "animated") {
            const delta =
              lastDrawAt == null
                ? 1 / 60
                : Math.min(1 / 24, Math.max(1 / 120, (time - lastDrawAt) / 1000));
            const smoothing = 1 - Math.exp(-delta * 20);
            pointer.currentX = mix(pointer.currentX, pointer.targetX, smoothing);
            pointer.currentY = mix(pointer.currentY, pointer.targetY, smoothing);
            simulationUniforms.uPointer.value.set(
              pointer.currentX,
              pointer.currentY,
            );
            simulationUniforms.uImpulse.value = pointer.impulse;
            simulationUniforms.uDelta.value = delta;
            simulationUniforms.uState.value = readTarget.texture;
            renderer.setRenderTarget(writeTarget);
            renderer.render(simulationScene, camera);
            renderer.setRenderTarget(null);
            [readTarget, writeTarget] = [writeTarget, readTarget];
            displayUniforms.uHeightMap.value = readTarget.texture;
            pointer.impulse *= 0.18;
            if (pointer.impulse < 0.002) pointer.impulse = 0;
            lastDrawAt = time;
          }

          renderer.render(displayScene, camera);
          if (queried) gpuTimer?.end();
          const renderMs = performance.now() - startedAt;
          canvas.dataset.visualDrawCalls = policy === "animated" ? "2" : "1";
          return renderMs;
        };

        const scheduleImmediate = () => {
          if (!running || document.hidden) return;
          staticDrawPending = policy === "static";
          cadence.requestImmediate();
          visualRuntime.invalidate();
        };

        const unsubscribeFrame = visualRuntime.subscribeFrame((frame) => {
          if (!running || document.hidden) return;

          const gpuMeasurement = gpuTimer?.poll();
          if (gpuMeasurement != null) {
            lastGpuMs = gpuMeasurement;
            canvas.dataset.waterGpuMs = gpuMeasurement.toFixed(2);
          }

          if (frame.scrolling) {
            if (!wasScrolling) {
              wasScrolling = true;
              cadence.reset();
              publishBudget(true);
            }
            lastFrameAt = frame.time;
            return;
          }

          if (wasScrolling) {
            wasScrolling = false;
            cadence.requestImmediate();
            lastFrameAt = null;
            publishBudget();
          }

          if (policy === "animated") {
            const frameMs =
              lastFrameAt == null
                ? 1000 / 60
                : Math.max(0.1, frame.time - lastFrameAt);
            lastFrameAt = frame.time;
            const nextQuality = qualityController.sample({
              time: frame.time,
              frameMs,
              renderMs: lastRenderMs,
              gpuMs: lastGpuMs,
            });
            if (nextQuality.tier !== qualitySnapshot.tier) {
              applyQuality(nextQuality);
            }
            const interval = resolveWebGLFrameInterval({
              policy,
              scrolling: false,
              targetFps: qualitySnapshot.targetFps,
            });
            if (cadence.shouldDraw(frame.time, interval)) {
              lastRenderMs = draw(frame.time);
            }
          } else if (staticDrawPending) {
            staticDrawPending = false;
            lastRenderMs = draw(surfaceRef.current.shaderPhase * 10_000);
          }
        });

        drawOnceRef.current = scheduleImmediate;
        resize(true);
        lastRenderMs = draw(surfaceRef.current.shaderPhase * 10_000);
        canvas.dataset.visualMaterials = "2";
        canvas.dataset.visualTextures = "2";
        canvas.dataset.visualRenderTargets = "2";
        canvas.dataset.waterField = "heightfield-gpu";
        canvas.dataset.waterPointerSamples = "0";
        setReady(true);
        staticDrawPending = false;
        publishBudget();
        visualRuntime.setContinuous(policy === "animated");

        const resizeObserver = new ResizeObserver(() => {
          if (resize()) scheduleImmediate();
        });
        resizeObserver.observe(canvas);

        if (policy === "animated") {
          window.addEventListener("pointermove", onPointerMove, { passive: true });
        }

        const onContextLost = (event: Event) => {
          event.preventDefault();
          running = false;
          cadence.reset();
          visualRuntime.setContinuous(false);
          setReady(false);
        };
        const onContextRestored = () => {
          setContextVersion((value) => value + 1);
        };
        canvas.addEventListener("webglcontextlost", onContextLost);
        canvas.addEventListener("webglcontextrestored", onContextRestored);

        dispose = () => {
          running = false;
          drawOnceRef.current = null;
          unsubscribeFrame();
          cadence.reset();
          visualRuntime.setContinuous(false);
          resizeObserver.disconnect();
          window.removeEventListener("pointermove", onPointerMove);
          canvas.removeEventListener("webglcontextlost", onContextLost);
          canvas.removeEventListener("webglcontextrestored", onContextRestored);
          gpuTimer?.dispose();
          simulationScene.remove(simulationPlane);
          displayScene.remove(displayPlane);
          readTarget.dispose();
          writeTarget.dispose();
          geometry.dispose();
          simulationMaterial.dispose();
          displayMaterial.dispose();
          renderer.dispose();
        };
      } catch {
        if (!cancelled) {
          setFailed(true);
          setReady(false);
          visualRuntime.setContinuous(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      dispose();
    };
  }, [active, contextVersion, policy]);

  const state =
    !active || policy === "fallback" || failed
      ? "fallback"
      : ready
        ? policy
        : "pending";

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700",
        active && ready && policy !== "fallback" && "opacity-100",
        className,
      )}
      data-webgl-state={state}
      data-webgl-surface={surface}
      data-water-field={state === "fallback" ? "css-fallback" : "heightfield-gpu"}
      data-water-quality={state === "fallback" ? "fallback" : undefined}
      data-water-simulation={state === "fallback" ? "0x0" : undefined}
      data-water-interaction={state === "fallback" ? "none" : undefined}
      data-water-pointer-samples="0"
      data-visual-materials={state === "fallback" ? "0" : undefined}
      data-visual-draw-calls={state === "fallback" ? "0" : undefined}
      data-visual-textures={state === "fallback" ? "0" : undefined}
      data-visual-render-targets={state === "fallback" ? "0" : undefined}
      data-visual-fps-tier={policy === "animated" ? "high" : "paused"}
      data-visual-target-fps={policy === "animated" ? "60" : "0"}
      aria-hidden="true"
    />
  );
}
