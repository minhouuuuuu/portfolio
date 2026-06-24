"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointsMaterial } from "three";

const PARTICLE_COUNT = 3000;
const TARGET_OPACITY = 0.7;
const FADE_DURATION = 1.4;

export function ParticleField() {
  const meshRef = useRef<Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Distribute in a sphere
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
      const r = 2.5 + (Math.random() - 0.5) * 1.5;

      pos[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Mostly white, ~8% accent green
      const isAccent = Math.random() < 0.08;
      col[i * 3] = isAccent ? 0.78 : 0.94;
      col[i * 3 + 1] = isAccent ? 1.0 : 0.93;
      col[i * 3 + 2] = isAccent ? 0.0 : 0.91;
    }

    return [pos, col];
  }, []);

  const tRef = useRef(0);

  useFrame(({ mouse: m }, delta) => {
    if (!meshRef.current) return;
    tRef.current += delta;
    const t = tRef.current;

    meshRef.current.rotation.y = t * 0.05;
    meshRef.current.rotation.x = Math.sin(t * 0.03) * 0.15;
    meshRef.current.rotation.z = m.x * 0.1;

    // Gentle fade-in so the starfield doesn't snap in with the geometry.
    const mat = meshRef.current.material as PointsMaterial;
    if (mat.opacity < TARGET_OPACITY) {
      mat.opacity = Math.min(TARGET_OPACITY, (t / FADE_DURATION) * TARGET_OPACITY);
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        vertexColors
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
