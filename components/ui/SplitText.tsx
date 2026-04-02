"use client";

import { useRef, useEffect } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  splitBy?: "letter" | "word";
  trigger?: "scroll" | "mount";
  delay?: number;
  stagger?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

export function SplitText({
  text,
  className = "",
  style,
  splitBy = "word",
  trigger = "scroll",
  delay = 0,
  stagger = 0.05,
  as: Tag = "div",
}: SplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  const parts = splitBy === "letter" ? text.split("") : text.split(" ");

  useEffect(() => {
    if (!containerRef.current) return;
    const spans = containerRef.current.querySelectorAll(".split-item");
    let ctx: { revert(): void } | undefined;

    Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        if (trigger === "scroll") {
          gsap.fromTo(
            spans,
            { y: 80, opacity: 0, rotateX: -40 },
            {
              y: 0,
              opacity: 1,
              rotateX: 0,
              stagger,
              delay,
              duration: 0.8,
              ease: "expo.out",
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            }
          );
        } else {
          gsap.fromTo(
            spans,
            { y: 80, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger,
              delay,
              duration: 0.8,
              ease: "expo.out",
            }
          );
        }
      }, containerRef);
    });

    return () => ctx?.revert();
  }, [trigger, delay, stagger]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TagComponent = Tag as any;

  return (
    <TagComponent
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      style={{ perspective: "800px", ...style }}
    >
      {parts.map((part, i) => (
        <span
          key={i}
          className="split-item inline-block"
          style={{
            marginRight: splitBy === "word" ? "0.25em" : undefined,
            willChange: "transform, opacity",
          }}
        >
          {part === " " ? "\u00A0" : part}
        </span>
      ))}
    </TagComponent>
  );
}
