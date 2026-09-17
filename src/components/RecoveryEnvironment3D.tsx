"use client";
/**
 * RecoveryEnvironment3D.tsx — G-R3
 *
 * Calm natural 3D sanctuary scene for the Mind & Focus Recovery Center.
 * Uses Three.js + React Three Fiber + @react-three/drei (already in the project).
 *
 * Exposed API (for G-R4+):
 *   <RecoveryEnvironment3D breathingState="idle" | "inhale" | "exhale" | "hold" />
 *
 * The breathing orb idle animation runs autonomously; future phases can drive
 * inhale/exhale/hold states via the prop without re-architecting the component.
 */

import { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  MeshDistortMaterial,
  Float,
  Environment,
  Preload,
} from "@react-three/drei";
import * as THREE from "three";

/* ─── Breathing state type — forward-compatible API ─────────────────── */
export type BreathingState = "idle" | "inhale" | "exhale" | "hold";

/* ─── Palette constants — Dark Natural Sanctuary ─────────────────── */
const SAGE_DARK        = new THREE.Color("#16281C");
const SLATE_DARK       = new THREE.Color("#141E16");
const WARM_KEY_LIGHT   = new THREE.Color("#FFDCA8");
const FOREST_FILL_LIGHT = new THREE.Color("#355E3D");
const AMBIENT_DARK     = new THREE.Color("#101913");
const WARM_AMBER       = new THREE.Color("#E6A756");

/* ═══════════════════════════════════════════════════════════════════════
   Breathing Orb — central focal element (large dark reflective orb)
════════════════════════════════════════════════════════════════════════ */
interface OrbProps {
  state: BreathingState;
  reduced: boolean;
}

function BreathingOrb({ state, reduced }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  // Track a smooth internal phase for the idle breathing loop
  const phaseRef = useRef(0);
  const targetScale = useRef(1);

  useFrame((_, delta) => {
    if (reduced || !meshRef.current) return;

    // Idle: slow sine wave breathing (period ~6 s)
    if (state === "idle") {
      phaseRef.current += delta * (Math.PI * 2) / 6;
      const s = 1 + Math.sin(phaseRef.current) * 0.06;
      meshRef.current.scale.setScalar(s);
    } else {
      // Driven by external state (G-R4+)
      const target =
        state === "inhale" ? 1.08 :
        state === "exhale" ? 0.94 : 1.0;
      targetScale.current = THREE.MathUtils.lerp(targetScale.current, target, delta * 1.3);
      meshRef.current.scale.setScalar(targetScale.current);
    }

    // Very slow ambient rotation
    meshRef.current.rotation.y += delta * 0.035;
    meshRef.current.rotation.z += delta * 0.012;
  });

  return (
    <Float speed={reduced ? 0 : 0.4} rotationIntensity={reduced ? 0 : 0.05} floatIntensity={reduced ? 0 : 0.15}>
      <mesh ref={meshRef} position={[0, 0.06, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1.22, 64, 64]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          thickness={0.55}
          roughness={0.025}
          transmission={0.82}
          chromaticAberration={0.028}
          anisotropicBlur={0.08}
          temporalDistortion={0.03}
          distortionScale={0.12}
          color={new THREE.Color("#0A160F")}
          attenuationColor={new THREE.Color("#040C06")}
          attenuationDistance={1.6}
          ior={1.52}
        />
      </mesh>
    </Float>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Breathing Ring — subtle glowing circular ring expanding around the orb
════════════════════════════════════════════════════════════════════════ */
function BreathingRing({ state, reduced }: { state: BreathingState; reduced: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    if (reduced || !ringRef.current) return;

    let target = 1.0;
    if (state === "inhale") {
      target = 1.15;
    } else if (state === "exhale") {
      target = 0.93;
    } else if (state === "hold") {
      target = 1.15;
    } else {
      phaseRef.current += delta * (Math.PI * 2) / 6;
      target = 1.0 + Math.sin(phaseRef.current) * 0.06;
    }

    ringRef.current.scale.lerp(new THREE.Vector3(target, target, 1), delta * 1.5);
    if (haloRef.current) {
      haloRef.current.scale.lerp(new THREE.Vector3(target * 1.06, target * 1.06, 1), delta * 1.5);
    }
  });

  return (
    <group position={[0, 0.06, -0.15]}>
      {/* Subtle glowing primary breathing ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[1.32, 1.345, 96]} />
        <meshBasicMaterial
          color={new THREE.Color("#6BA876")}
          transparent
          opacity={0.42}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Soft outer atmospheric halo */}
      <mesh ref={haloRef}>
        <ringGeometry args={[1.30, 1.39, 96]} />
        <meshBasicMaterial
          color={new THREE.Color("#84BD90")}
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Altar Platform — dark stone circular altar with glowing amber ring
   and subtle water ripples directly beneath the breathing orb
════════════════════════════════════════════════════════════════════════ */
function AltarPlatform({ reduced }: { reduced: boolean }) {
  const rippleRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (reduced || !rippleRef.current) return;
    const t = clock.getElapsedTime() * 0.35;
    rippleRef.current.children.forEach((child, i) => {
      const s = 1 + ((t + i * 0.32) % 1) * 0.22;
      child.scale.set(s, s, 1);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.22 * (1 - ((t + i * 0.32) % 1));
      }
    });
  });

  return (
    <group position={[0, -0.92, 0]}>
      {/* Dark wet river stone circular altar pedestal */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.52, 1.62, 0.26, 48]} />
        <meshStandardMaterial
          color={new THREE.Color("#101712")}
          roughness={0.72}
          metalness={0.15}
        />
      </mesh>

      {/* Top stone lip highlight */}
      <mesh position={[0, 0.131, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.20, 1.52, 48]} />
        <meshStandardMaterial
          color={new THREE.Color("#152118")}
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>

      {/* Primary Glowing Amber Light Ring on top of the stone altar */}
      <mesh position={[0, 0.134, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.24, 1.32, 64]} />
        <meshBasicMaterial
          color={new THREE.Color("#FFAE42")}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Soft outer amber glow halo on stone rim */}
      <mesh position={[0, 0.133, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.16, 1.40, 64]} />
        <meshBasicMaterial
          color={new THREE.Color("#E6A756")}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Water ripple concentric rings spreading around the platform */}
      <group ref={rippleRef} position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {[1.75, 2.1, 2.5].map((r, i) => (
          <mesh key={i}>
            <ringGeometry args={[r, r + 0.04, 48]} />
            <meshBasicMaterial
              color={new THREE.Color("#5E966A")}
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Smooth stones — low organic dark river stones in the mid-ground
════════════════════════════════════════════════════════════════════════ */
function Stone({
  position,
  scale,
  color,
  distort,
  reduced,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: THREE.Color;
  distort: number;
  reduced: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const speedRef = useRef(Math.random() * 0.15 + 0.04);

  useFrame((_, delta) => {
    if (reduced || !meshRef.current) return;
    meshRef.current.rotation.y += delta * speedRef.current;
  });

  return (
    <Float
      speed={reduced ? 0 : 0.28}
      rotationIntensity={reduced ? 0 : 0.05}
      floatIntensity={reduced ? 0 : 0.10}
    >
      <mesh ref={meshRef} position={position} scale={scale} receiveShadow castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          distort={reduced ? 0 : distort}
          speed={0.6}
          roughness={0.82}
          metalness={0.06}
        />
      </mesh>
    </Float>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Ambient particles — substantially reduced to very faint, sparse dust
════════════════════════════════════════════════════════════════════════ */
function AmbientParticles({ count = 12, reduced }: { count?: number; reduced: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 3 - 0.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.08 + Math.random() * 0.08,
      amp: 0.15 + Math.random() * 0.2,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (reduced || !meshRef.current) return;
    const t = clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(p.x, p.y + Math.sin(t * p.speed + p.phase) * p.amp, p.z);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.012, 4, 4]} />
      <meshStandardMaterial
        color={WARM_AMBER}
        transparent
        opacity={0.16}
        roughness={1}
      />
    </instancedMesh>
  );
}


/* ═══════════════════════════════════════════════════════════════════════
   Scene — composes all 3D elements in the dark natural sanctuary
════════════════════════════════════════════════════════════════════════ */
function Scene({ state, reduced }: { state: BreathingState; reduced: boolean }) {
  const sceneGroupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced]);

  useFrame((_, delta) => {
    if (reduced || !sceneGroupRef.current) return;
    sceneGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      sceneGroupRef.current.rotation.y,
      mouse.current.x * 0.06,
      delta * 1.5
    );
    sceneGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      sceneGroupRef.current.rotation.x,
      mouse.current.y * 0.04,
      delta * 1.5
    );
  });

  // Stone definitions — dark organic river stones grounding the base matching reference image
  const stones = useMemo<Array<{
    position: [number, number, number];
    scale: [number, number, number];
    color: THREE.Color;
    distort: number;
  }>>(() => [
    { position: [-1.48, -0.72, 0.45], scale: [0.54, 0.34, 0.46], color: new THREE.Color("#131C15"), distort: 0.08 },
    { position: [-0.60, -0.85, 0.58], scale: [0.35, 0.22, 0.30], color: new THREE.Color("#162219"), distort: 0.06 },
    { position: [ 0.72, -0.78, 0.50], scale: [0.27, 0.18, 0.24], color: new THREE.Color("#18251C"), distort: 0.06 },
    { position: [ 1.32, -0.74, 0.38], scale: [0.50, 0.32, 0.42], color: new THREE.Color("#121A14"), distort: 0.08 },
  ], []);

  return (
    <group ref={sceneGroupRef}>
      {/* Cinematic dark natural sanctuary lighting */}
      <ambientLight intensity={0.42} color={AMBIENT_DARK} />
      {/* Warm amber key light */}
      <directionalLight
        position={[4, 7, 4]}
        intensity={1.15}
        color={WARM_KEY_LIGHT}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      {/* Deep forest cool rim light */}
      <directionalLight
        position={[-5, 3, -3]}
        intensity={0.55}
        color={FOREST_FILL_LIGHT}
      />
      {/* Warm ambient backlight beneath & behind the orb — illuminating the platform & lower orb */}
      <pointLight
        position={[0, -0.74, 0.05]}
        intensity={2.4}
        distance={3.6}
        color={new THREE.Color("#FFAE42")}
      />
      {/* Subtle warm amber ground bounce */}
      <pointLight position={[0, -1.8, 2.2]} intensity={0.3} color={WARM_AMBER} />

      {/* Forest environment preset for realistic tree reflections across the orb surface */}
      <Environment preset="forest" background={false} />

      {/* Stone altar platform with glowing amber ring & water ripples beneath the orb */}
      <AltarPlatform reduced={reduced} />

      {/* Subtle glowing circular breathing ring around the orb */}
      <BreathingRing state={state} reduced={reduced} />

      {/* Primary focal point: large reflective dark breathing orb */}
      <BreathingOrb state={state} reduced={reduced} />

      {/* Grounding dark river stones positioned as in the reference image */}
      {stones.map((s, i) => (
        <Stone key={i} {...s} reduced={reduced} />
      ))}

      {/* Substantially reduced ambient dust motes */}
      <AmbientParticles count={reduced ? 0 : 10} reduced={reduced} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   WebGL availability check
════════════════════════════════════════════════════════════════════════ */
function checkWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   Graceful fallback — shown when WebGL is unavailable
════════════════════════════════════════════════════════════════════════ */
function SanctuaryFallback() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      aria-label="Natural sanctuary visual (2D fallback)"
      style={{
        background: "linear-gradient(160deg, #0B130E 0%, #101B14 50%, #080D0A 100%)",
      }}
    >
      {/* 2D dark reflective orb stand-in */}
      <div
        className="relative"
        style={{
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 35%, #1D3323 0%, #0D1911 50%, #050A07 100%)",
          border: "1px solid rgba(132, 189, 144, 0.28)",
          boxShadow: "0 16px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(107, 168, 118, 0.15)",
          animation: "rc-pulse 5s ease-in-out infinite",
        }}
      >
        <div
          className="absolute -inset-3 rounded-full border border-[rgba(107,168,118,0.3)] animate-ping opacity-25"
          style={{ animationDuration: "5s" }}
        />
      </div>
      {/* Dark organic river stone blobs positioned to match reference */}
      {[
        { left: "26%", bottom: "22%", w: 68, h: 44, color: "rgba(19, 28, 21, 0.85)" },
        { left: "38%", bottom: "16%", w: 46, h: 30, color: "rgba(22, 34, 25, 0.85)" },
        { right: "36%", bottom: "18%", w: 40, h: 26, color: "rgba(24, 37, 28, 0.85)" },
        { right: "26%", bottom: "20%", w: 64, h: 42, color: "rgba(18, 26, 20, 0.85)" },
      ].map((blob, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: blob.left,
            right: (blob as { right?: string }).right,
            bottom: blob.bottom,
            width: blob.w,
            height: blob.h,
            background: blob.color,
            filter: "blur(3px)",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Loading fallback (Suspense boundary)
════════════════════════════════════════════════════════════════════════ */
function SceneLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="rounded-full"
        style={{
          width: 180,
          height: 180,
          background:
            "radial-gradient(circle, rgba(94, 150, 106, 0.22) 0%, transparent 70%)",
          animation: "rc-pulse 2s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Public API — RecoveryEnvironment3D
════════════════════════════════════════════════════════════════════════ */
export interface RecoveryEnvironment3DProps {
  breathingState?: BreathingState;
  /** Height of the canvas container. Default: "340px" */
  height?: string;
  className?: string;
}

export default function RecoveryEnvironment3D({
  breathingState = "idle",
  height = "340px",
  className = "",
}: RecoveryEnvironment3DProps) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setWebglOk(checkWebGL());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // SSR or not yet determined
  if (webglOk === null) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{
        height,
        background:
          "linear-gradient(165deg, #050B07 0%, #09130C 50%, #030604 100%)",
        border: "1px solid rgba(132, 189, 144, 0.16)",
        boxShadow: "0 24px 64px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
      }}
      aria-label="3D natural sanctuary scene"
    >
      {webglOk ? (
        <Suspense fallback={<SceneLoader />}>
          <Canvas
            camera={{ position: [0, 0, 5.5], fov: 40, near: 0.1, far: 60 }}
            shadows
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "default",
              preserveDrawingBuffer: false,
            }}
            style={{ background: "transparent" }}
            aria-hidden="true"
          >
            <Scene state={breathingState} reduced={reduced} />
            <Preload all />
          </Canvas>
        </Suspense>
      ) : (
        <SanctuaryFallback />
      )}

      {/* Overlay vignette — soft atmospheric depth */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 45%, rgba(7, 11, 9, 0.88) 100%)",
        }}
      />
    </div>
  );
}
