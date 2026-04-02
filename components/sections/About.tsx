"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "@/components/ui/SplitText";
import { CountUp } from "@/components/ui/CountUp";
import { PERSONAL_INFO, STATS } from "@/lib/constants";

gsap.registerPlugin(ScrollTrigger);

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        statsRef.current?.children ?? [],
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.8,
          ease: "expo.out",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="section relative overflow-hidden"
      style={{ background: "var(--bg-2)" }}
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(123,97,255,0.06) 0%, transparent 70%)",
          transform: "translate(20%, -20%)",
        }}
      />

      <div className="max-w-4xl mx-auto px-6">
        {/* Label */}
        <div
          className="flex items-center gap-3 mb-8"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span
            className="inline-block w-6 h-[1px]"
            style={{ backgroundColor: "var(--text-muted)" }}
          />
          <span
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            ABOUT ME
          </span>
        </div>

        {/* Headline — word split with GSAP reveal */}
        <SplitText
          text="A developer who thinks like a designer."
          as="h2"
          splitBy="word"
          trigger="scroll"
          stagger={0.06}
          className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-12"
          style={{ fontFamily: "var(--font-display)" }}
        />

        <div className="grid md:grid-cols-2 gap-16 items-end">
          {/* Body */}
          <div>
            <p
              className="text-base leading-relaxed mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Based in {PERSONAL_INFO.location}. Currently crafting
              pixel-perfect experiences at{" "}
              <span style={{ color: "var(--accent)" }}>
                {PERSONAL_INFO.company}
              </span>
              .
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              I live at the intersection of code and creativity, turning complex
              ideas into fluid digital experiences.
            </p>
          </div>

          {/* Stats */}
          <div ref={statsRef} className="flex gap-12">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span
                  className="font-display text-4xl font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--accent)",
                  }}
                >
                  <CountUp
                    target={stat.value}
                    suffix={stat.suffix}
                    duration={2}
                  />
                </span>
                <span
                  className="font-mono text-xs tracking-widest uppercase"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
