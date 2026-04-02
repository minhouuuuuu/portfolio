"use client";

import { useRef, useEffect } from "react";
import { SKILLS } from "@/lib/constants";

interface SkillBarProps {
  name: string;
  level: number;
  index: number;
}

function SkillBar({ name, level, index }: SkillBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;
    let ctx: { revert(): void } | undefined;

    Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.fromTo(
          barRef.current,
          { scaleX: 0 },
          {
            scaleX: level / 100,
            duration: 1.2,
            ease: "expo.out",
            delay: index * 0.05,
            scrollTrigger: {
              trigger: barRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    });

    return () => ctx?.revert();
  }, [level, index]);

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span
          className="font-mono text-xs tracking-wider uppercase"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}
        >
          {name}
        </span>
        <span
          className="font-mono text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
        >
          {level}%
        </span>
      </div>
      <div
        className="h-[2px] w-full"
        style={{ backgroundColor: "var(--surface-2)" }}
      >
        <div
          ref={barRef}
          className="h-full origin-left"
          style={{
            backgroundColor: "var(--accent)",
            transform: "scaleX(0)",
            boxShadow: "0 0 8px var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

interface CategoryProps {
  title: string;
  skills: { name: string; level: number }[];
  accent?: string;
  startIndex?: number;
}

function SkillCategory({ title, skills, accent = "#c8ff00", startIndex = 0 }: CategoryProps) {
  return (
    <div className="mb-10">
      <h4
        className="font-mono text-[10px] tracking-[0.3em] uppercase mb-5"
        style={{
          fontFamily: "var(--font-mono)",
          color: accent,
        }}
      >
        {title}
      </h4>
      {skills.map((skill, i) => (
        <SkillBar
          key={skill.name}
          name={skill.name}
          level={skill.level}
          index={startIndex + i}
        />
      ))}
    </div>
  );
}

export function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    let ctx: { revert(): void } | undefined;

    Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.fromTo(
          titleRef.current?.children ?? [],
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: {
              trigger: titleRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }, sectionRef);
    });

    return () => ctx?.revert();
  }, []);

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="section relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Subtle grid bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section title */}
        <div ref={titleRef} className="mb-16">
          <div
            className="flex items-center gap-3 mb-6"
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
              EXPERTISE
            </span>
          </div>
          <h2
            className="font-display text-5xl md:text-7xl font-black leading-none uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TECHNICAL
          </h2>
          <h2
            className="font-display text-5xl md:text-7xl font-black leading-none uppercase"
            style={{
              fontFamily: "var(--font-display)",
              WebkitTextStroke: "1px var(--text)",
              WebkitTextFillColor: "transparent",
            }}
          >
            EXPERTISE
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Left — skill bars */}
          <div>
            <SkillCategory
              title="Front-End"
              skills={SKILLS.frontend}
              accent="#c8ff00"
              startIndex={0}
            />
            <SkillCategory
              title="Animation"
              skills={SKILLS.animation}
              accent="#7b61ff"
              startIndex={5}
            />
            <SkillCategory
              title="Back-End"
              skills={SKILLS.backend}
              accent="#ff6b35"
              startIndex={9}
            />
            <SkillCategory
              title="Design"
              skills={SKILLS.design}
              accent="#00d4ff"
              startIndex={12}
            />
          </div>

          {/* Right — decorative 3D-style tech cloud */}
          <div className="relative flex items-center justify-center min-h-[400px]">
            <TechCloud />
          </div>
        </div>
      </div>
    </section>
  );
}

function TechCloud() {
  const items = [
    { label: "React", x: "50%", y: "10%", size: "lg", color: "#61dafb" },
    { label: "Next.js", x: "20%", y: "25%", size: "md", color: "#fff" },
    { label: "TypeScript", x: "75%", y: "20%", size: "md", color: "#3178c6" },
    { label: "GSAP", x: "15%", y: "55%", size: "md", color: "#c8ff00" },
    { label: "Three.js", x: "60%", y: "45%", size: "lg", color: "#fff" },
    { label: "Framer", x: "35%", y: "70%", size: "sm", color: "#7b61ff" },
    { label: "Tailwind", x: "80%", y: "65%", size: "sm", color: "#38bdf8" },
    { label: "Lenis", x: "45%", y: "88%", size: "sm", color: "#ff6b35" },
    { label: "Figma", x: "10%", y: "80%", size: "sm", color: "#a259ff" },
    { label: "Supabase", x: "70%", y: "85%", size: "sm", color: "#3ecf8e" },
  ];

  const sizeMap = { sm: "text-xs", md: "text-sm", lg: "text-base" };

  return (
    <div className="relative w-full h-[400px]">
      {/* Center circle */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-[var(--border)] flex items-center justify-center"
        style={{ boxShadow: "0 0 40px rgba(200,255,0,0.1)" }}
      >
        <span
          className="font-display text-xl font-black"
          style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
        >
          NM
        </span>
      </div>

      {/* Tech labels */}
      {items.map((item, i) => (
        <div
          key={item.label}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 font-mono tracking-wider uppercase px-3 py-1.5 border border-[var(--border)] bg-[var(--surface)] hover:border-current transition-colors duration-300"
          style={{
            left: item.x,
            top: item.y,
            fontFamily: "var(--font-mono)",
            color: item.color,
            fontSize: "10px",
            animation: `techFloat ${3 + (i % 4) * 0.8}s ease-in-out ${(i % 5) * 0.3}s infinite alternate`,
          }}
        >
          {item.label}
        </div>
      ))}

      <style>{`
        @keyframes techFloat {
          from { transform: translate(-50%, -50%) translateY(0px); }
          to { transform: translate(-50%, -50%) translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
