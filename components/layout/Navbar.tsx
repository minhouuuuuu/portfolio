"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { NAV_LINKS } from "@/lib/constants";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const progress = useScrollProgress();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100]">
      {/* Scroll progress bar */}
      <div
        className="absolute top-0 left-0 h-[2px] bg-[var(--accent)] origin-left transition-transform duration-100"
        style={{ transform: `scaleX(${progress})`, width: "100%" }}
      />

      <motion.nav
        className="flex items-center justify-between px-8 py-5 transition-all duration-500"
        animate={{
          backgroundColor: scrolled
            ? "rgba(5,5,5,0.85)"
            : "rgba(5,5,5,0)",
          backdropFilter: scrolled ? "blur(12px)" : "blur(0px)",
        }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <a
          href="#hero"
          onClick={(e) => handleAnchor(e, "#hero")}
          className="font-display text-xl font-bold tracking-tight select-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          NM
          <span
            className="inline-block w-1.5 h-1.5 rounded-full ml-0.5 mb-2 align-middle"
            style={{ backgroundColor: "var(--accent)" }}
          />
        </a>

        {/* Nav links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => handleAnchor(e, link.href)}
                className="hover-underline font-mono text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text)] transition-colors duration-300"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <MagneticButton>
          <a
            href="#contact"
            onClick={(e) => handleAnchor(e, "#contact")}
            className="relative px-5 py-2 font-mono text-xs tracking-widest uppercase border border-[var(--accent)] text-[var(--accent)] overflow-hidden group"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--bg)]">
              HIRE ME
            </span>
            <span
              className="absolute inset-0 bg-[var(--accent)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
              style={{ transformOrigin: "left" }}
            />
          </a>
        </MagneticButton>
      </motion.nav>
    </header>
  );
}
