"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface MarqueeTextProps {
  text: string;
  direction?: "left" | "right";
  speed?: number;
  className?: string;
}

export function MarqueeText({
  text,
  direction = "left",
  speed = 50,
  className = "",
}: MarqueeTextProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackRef.current) return;

    const track = trackRef.current;
    const firstChild = track.firstElementChild as HTMLElement;
    if (!firstChild) return;

    const textWidth = firstChild.offsetWidth;
    const duration = textWidth / speed;

    // Left: 0 → -textWidth, right: -textWidth → 0
    // At each endpoint the two identical copies perfectly overlap → seamless
    const from = direction === "left" ? 0 : -textWidth;
    const to   = direction === "left" ? -textWidth : 0;

    const animation = gsap.fromTo(
      track,
      { x: from },
      { x: to, duration, ease: "none", repeat: -1 }
    );

    // `animation.kill()` returns the Tween (for chaining), but React expects
    // the effect cleanup to return `void`.
    return () => {
      animation.kill();
    };
  }, [text, direction, speed]);

  const copies = Array(2).fill(text);

  return (
    <div
      className={`overflow-hidden border-y border-(--border) py-4 ${className}`}
    >
      <div 
        ref={trackRef} 
        className="flex whitespace-nowrap will-change-transform"
      >
        {copies.map((copy, i) => (
          <span
            key={i}
            className="shrink-0 font-mono text-xs tracking-[0.3em] text-(--text-muted) uppercase pr-8"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {copy}
          </span>
        ))}
      </div>
    </div>
  );
}
