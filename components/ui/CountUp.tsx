"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obj = { value: 0 };

    const ctx = gsap.context(() => {
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

    return () => ctx.revert();
  }, [target, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
