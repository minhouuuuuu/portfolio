"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGSAP(
  callback: (gsapInstance: typeof gsap) => gsap.core.Timeline | gsap.core.Tween | void,
  deps: React.DependencyList = []
) {
  const ctx = useRef<gsap.Context | null>(null);

  useEffect(() => {
    ctx.current = gsap.context(() => {
      callback(gsap);
    });

    return () => {
      ctx.current?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
