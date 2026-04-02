"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import { ParticleField } from "./ParticleField";
import { FloatingGeometry } from "./FloatingGeometry";

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: false, alpha: true }}
      dpr={[1, 1.5]}
    >
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#c8ff00" />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#7b61ff" />

      <Suspense fallback={null}>
        <ParticleField />
        <FloatingGeometry />
      </Suspense>
    </Canvas>
  );
}
