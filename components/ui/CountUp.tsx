"use client";

import { useRef, useEffect, useState } from "react";

interface CountUpProps {
  target: number;
  suffix?: string;
  className?: string;
  duration?: number;
}

export function CountUp({
  target,
  suffix = "",
  className = "",
  duration = 2,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  // gsap is imported dynamically here, as it is everywhere else in the app.
  // The static import used to run `gsap.registerPlugin(ScrollTrigger)` at
  // module scope, which pulled gsap + ScrollTrigger into the entry chunk for
  // a counter that only animates once it is scrolled into view.
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obj = { value: 0 };
    let ctx: { revert(): void } | undefined;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            once: true,
            onEnter: () => {
              gsap.to(obj, {
                value: target,
                duration,
                ease: "power2.out",
                onUpdate: () => {
                  if (el) el.textContent = Math.round(obj.value) + suffix;
                },
              });
            },
          });
        });
      },
    );

    return () => ctx?.revert();
  }, [target, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
