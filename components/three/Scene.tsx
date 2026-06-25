"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import { ParticleField } from "./ParticleField";
import { FloatingGeometry } from "./FloatingGeometry";

/**
 * Pauses the render loop when the canvas is scrolled out of view or the tab is
 * hidden. The starfield animates continuously, so `frameloop="demand"` would
 * freeze it; instead we flip between "always" (visible) and "never" (offscreen
 * / backgrounded) so the GPU goes fully idle when nothing is on screen.
 */
function useActiveFrameloop(ref: React.RefObject<HTMLDivElement | null>) {
  const [active, setActive] = useState(true);
  const onScreen = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const recompute = () => {
      setActive(onScreen.current && document.visibilityState === "visible");
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting;
        recompute();
      },
      { threshold: 0 },
    );
    io.observe(el);

    document.addEventListener("visibilitychange", recompute);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", recompute);
    };
  }, [ref]);

  return active;
}

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const active = useActiveFrameloop(wrapRef);
  const camera = isMobile
    ? { position: [0, 0.15, 4.6] as [number, number, number], fov: 70 }
    : { position: [0, 0, 5] as [number, number, number], fov: 60 };

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={active ? "always" : "never"}
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
    </div>
  );
}
