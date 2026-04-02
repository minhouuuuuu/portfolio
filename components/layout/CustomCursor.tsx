"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type CursorVariant = "default" | "hover" | "view" | "click";

export function CustomCursor() {
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [isMobile, setIsMobile] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Dot follows exactly (no spring)
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  useEffect(() => {
    // Detect touch/mobile
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      dotX.set(e.clientX);
      dotY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-cursor='view']")) {
        setVariant("view");
      } else if (
        target.closest("a") ||
        target.closest("button") ||
        target.closest("[role='button']") ||
        target.closest("[data-cursor='hover']")
      ) {
        setVariant("hover");
      } else {
        setVariant("default");
      }
    };

    const handleMouseDown = () => setVariant("click");
    const handleMouseUp = () => setVariant("default");

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", checkMobile);
    };
  }, [cursorX, cursorY, dotX, dotY]);

  if (isMobile) return null;

  const ringSize =
    variant === "hover" ? 56 : variant === "view" ? 80 : variant === "click" ? 20 : 36;

  const ringColor =
    variant === "hover" || variant === "view"
      ? "var(--accent)"
      : "rgba(240,237,232,0.6)";

  return (
    <>
      {/* Outer ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full border mix-blend-difference"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
          borderColor: ringColor,
        }}
        animate={{
          width: ringSize,
          height: ringSize,
          opacity: 1,
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {variant === "view" && (
          <span
            className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-widest"
            style={{ color: "var(--bg)", fontSize: "9px" }}
          >
            VIEW
          </span>
        )}
      </motion.div>

      {/* Center dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full bg-[var(--accent)]"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: variant === "click" ? 3 : 6,
          height: variant === "click" ? 3 : 6,
          opacity: variant === "view" ? 0 : 1,
        }}
        transition={{ duration: 0.1 }}
      />
    </>
  );
}
