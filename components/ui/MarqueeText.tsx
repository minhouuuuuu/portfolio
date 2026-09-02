"use client";

import { useEffect, useRef } from "react";

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

  // gsap is loaded dynamically: this marquee sits below the hero and the
  // static import was forcing gsap into the entry chunk on every page load.
  useEffect(() => {
    if (!trackRef.current) return;

    const track = trackRef.current;
    const firstChild = track.firstElementChild as HTMLElement;
    if (!firstChild) return;

    const textWidth = firstChild.offsetWidth;
    const duration = textWidth / speed;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    import("gsap").then(({ gsap }) => {
      if (cancelled) return;

      // Left: 0 → -textWidth, right: -textWidth → 0
      // At each endpoint the two identical copies perfectly overlap → seamless
      const from = direction === "left" ? 0 : -textWidth;
      const to = direction === "left" ? -textWidth : 0;

      const animation = gsap.fromTo(
        track,
        { x: from },
        { x: to, duration, ease: "none", repeat: -1 }
      );

      // Respect reduced-motion: settle to the start and don't run the loop.
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReduced) {
        animation.progress(0).pause();
        cleanup = () => {
          animation.kill();
        };
        return;
      }

      // Pause the loop while the marquee is scrolled out of view so it isn't
      // repainting dozens of off-screen DOM nodes every frame.
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) animation.play();
          else animation.pause();
        },
        { threshold: 0 }
      );
      io.observe(track);

      // `animation.kill()` returns the Tween (for chaining), but React expects
      // the effect cleanup to return `void`.
      cleanup = () => {
        io.disconnect();
        animation.kill();
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
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
