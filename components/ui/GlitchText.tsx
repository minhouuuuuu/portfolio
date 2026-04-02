"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: "subtle" | "medium" | "intense";
}

export function GlitchText({
  text,
  className,
  intensity = "medium",
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  const animDuration =
    intensity === "subtle" ? "1.2s" : intensity === "intense" ? "0.4s" : "0.8s";

  return (
    <span
      className={cn("relative inline-block select-none", className)}
      data-text={text}
      onMouseEnter={() => setIsGlitching(true)}
      onMouseLeave={() => setIsGlitching(false)}
      style={
        isGlitching
          ? ({
              "--glitch-duration": animDuration,
            } as React.CSSProperties)
          : undefined
      }
    >
      {text}
      {isGlitching && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 text-[#ff0040]"
            style={{
              clipPath: "inset(20% 0 60% 0)",
              transform: "translateX(-3px)",
              animation: `glitch-r ${animDuration} infinite linear alternate-reverse`,
            }}
          >
            {text}
          </span>
          <span
            aria-hidden
            className="absolute inset-0 text-[#0040ff]"
            style={{
              clipPath: "inset(60% 0 10% 0)",
              transform: "translateX(3px)",
              animation: `glitch-b ${animDuration} infinite linear alternate-reverse`,
            }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}
