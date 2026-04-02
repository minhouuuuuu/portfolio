"use client";

import Lenis from "lenis";
import { useEffect } from "react";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenis: Lenis | null = null;
    let gsapInstance: { ticker: { add(fn: (t: number) => void): void; remove(fn: (t: number) => void): void; lagSmoothing(v: number): void }; config(opts: object): void } | null = null;
    let rafCallback: ((time: number) => void) | null = null;

    const init = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.config({ force3D: true, nullTargetWarn: false });
      gsap.registerPlugin(ScrollTrigger);
      gsapInstance = gsap;

      lenis = new Lenis({
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        smoothWheel: true,
      });

      lenis.on("scroll", ScrollTrigger.update);
      rafCallback = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(rafCallback);
      gsap.ticker.lagSmoothing(0);
    };

    init();

    return () => {
      lenis?.destroy();
      if (gsapInstance && rafCallback) {
        gsapInstance.ticker.remove(rafCallback);
      }
    };
  }, []);

  return <>{children}</>;
}
