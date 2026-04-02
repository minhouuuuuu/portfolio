"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import { ParticleField } from "./ParticleField";
import { FloatingGeometry } from "./FloatingGeometry";

function useIsMobile(maxWidth = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsMobile(mq.matches);
    update();

    // Safari fallback for older matchMedia objects.
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }

    mq.addListener(update);
    return () => mq.removeListener(update);
  }, [maxWidth]);

  return isMobile;
}

export function Scene() {
  const isMobile = useIsMobile(640);
  const camera = isMobile
    ? { position: [0, 0.15, 4.6] as [number, number, number], fov: 70 }
    : { position: [0, 0, 5] as [number, number, number], fov: 60 };

  return (
    <Canvas
      camera={camera}
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
        <FloatingGeometry isMobile={isMobile} />
      </Suspense>
    </Canvas>
  );
}
