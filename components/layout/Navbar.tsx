"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useActiveSection } from "@/hooks/useActiveSection";
import { NAV_LINKS } from "@/lib/constants";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const progress = useScrollProgress();
  
  const sectionIds = useMemo(() => 
    ["#hero", ...NAV_LINKS.map((link) => link.href)],
    []
  );
  const activeSection = useActiveSection(sectionIds);

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
      {/* Scroll progress bar - neon green with glow */}
      <div
        className="fixed top-0 left-0 h-[3px] z-[110] pointer-events-none"
        style={{
          width: `${progress * 100}%`,
          background: "var(--accent)",
          boxShadow: "0 0 10px var(--accent), 0 0 20px var(--accent), 0 0 30px rgba(200, 255, 0, 0.5)",
        }}
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
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href;
            return (
              <li key={link.href} className="relative">
                <a
                  href={link.href}
                  onClick={(e) => handleAnchor(e, link.href)}
                  className={`font-mono text-xs tracking-[0.2em] uppercase transition-colors duration-300 ${
                    isActive
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {link.label}
                </a>
                {/* Active indicator */}
                <motion.span
                  className="absolute -bottom-1 left-0 h-[2px] bg-[var(--accent)]"
                  initial={false}
                  animate={{
                    width: isActive ? "100%" : "0%",
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{
                    boxShadow: isActive
                      ? "0 0 8px var(--accent), 0 0 12px rgba(200, 255, 0, 0.5)"
                      : "none",
                  }}
                />
              </li>
            );
          })}
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
