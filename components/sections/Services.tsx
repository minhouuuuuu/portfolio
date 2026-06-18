"use client";

import { useRef, useEffect } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";

const SERVICES = [
  {
    id: "01",
    title: "3D & WebGL",
    description:
      "Immersive browser experiences built atom by atom. Particle fields, interactive geometry, custom shaders — the browser as a canvas with no limits.",
    tools: ["Three.js", "React Three Fiber", "GLSL", "Post-processing"],
    accent: "#c8ff00",
  },
  {
    id: "02",
    title: "Motion & Interaction",
    description:
      "Animation that earns its place. Scroll choreography, spring physics, micro-interactions — every state transition deliberate and intentional.",
    tools: ["GSAP", "Framer Motion", "ScrollTrigger", "Lenis"],
    accent: "#7b61ff",
  },
  {
    id: "03",
    title: "Creative Engineering",
    description:
      "Production React applications with a designer's eye. Performance, accessibility, and visual craft — without choosing between them.",
    tools: ["Next.js", "TypeScript", "React", "Tailwind CSS"],
    accent: "#00d4ff",
  },
];

function WebGLVisual({ accent }: { accent: string }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Animated wireframe grid */}
      <div className="absolute inset-0 opacity-25 overflow-hidden">
        <div
          className="absolute"
          style={{
            inset: "-32px",
            backgroundImage: `linear-gradient(${accent}20 1px, transparent 1px), linear-gradient(90deg, ${accent}20 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
            animation: "svc-gridMove 12s linear infinite",
            willChange: "transform",
          }}
        />
      </div>
      {/* Outer orbiting ring */}
      <div
        className="absolute rounded-full"
        style={{
          top: "50%",
          left: "50%",
          width: 160,
          height: 160,
          border: `1px solid ${accent}25`,
          transform: "translate(-50%, -50%)",
          animation: "svc-rotateSlow 10s linear infinite",
        }}
      />
      {/* Inner orbiting ring */}
      <div
        className="absolute rounded-full"
        style={{
          top: "50%",
          left: "50%",
          width: 100,
          height: 100,
          border: `1px solid ${accent}40`,
          transform: "translate(-50%, -50%)",
          animation: "svc-rotateSlow 6s linear infinite reverse",
        }}
      />
      {/* Central glow */}
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}50 0%, transparent 70%)`,
          boxShadow: `0 0 30px ${accent}30, 0 0 60px ${accent}10`,
          transform: "translate(-50%, -50%)",
          animation: "svc-pulseSphere 3s ease-in-out infinite",
        }}
      />
      {/* Accent dots */}
      {[
        { t: "18%", l: "18%" },
        { t: "18%", l: "78%" },
        { t: "78%", l: "18%" },
        { t: "78%", l: "78%" },
      ].map((pos, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            top: pos.t,
            left: pos.l,
            background: accent,
            animation: `svc-dotBlink 2s ease-in-out ${i * 0.5}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function MotionVisual({ accent }: { accent: string }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Floating orbs */}
      {[
        { w: 120, h: 120, x: "5%", y: "15%", delay: "0s", dur: "5s", color: `${accent}18` },
        { w: 80, h: 80, x: "58%", y: "8%", delay: "0.8s", dur: "6.5s", color: `${accent}12` },
        { w: 110, h: 110, x: "48%", y: "52%", delay: "0.3s", dur: "4.5s", color: "#c8ff0015" },
        { w: 55, h: 55, x: "76%", y: "62%", delay: "1.2s", dur: "5.5s", color: `${accent}20` },
      ].map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-2xl"
          style={{
            width: orb.w,
            height: orb.h,
            left: orb.x,
            top: orb.y,
            background: orb.color,
            animation: `svc-orbFloat ${orb.dur} ease-in-out ${orb.delay} infinite alternate`,
          }}
        />
      ))}
      {/* Dashed spring curve */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.15 }}
        preserveAspectRatio="none"
        viewBox="0 0 320 220"
      >
        <path
          d="M 20 110 C 60 30, 120 190, 180 80 S 260 170, 300 60"
          stroke={accent}
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="5 7"
        />
      </svg>
      {/* Tracking dot */}
      <div
        className="absolute w-2 h-2 rounded-full"
        style={{
          background: accent,
          top: "50%",
          left: "50%",
          marginTop: -4,
          marginLeft: -4,
          boxShadow: `0 0 10px ${accent}`,
          animation: "svc-trackX 3s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}

function EngineeringVisual({ accent }: { accent: string }) {
  const lines = [
    { prompt: "$", text: "npx create-next-app@latest", dim: false },
    { prompt: "→", text: "Installing dependencies...", dim: true },
    { prompt: "$", text: "git commit -m 'pixel-perfect'", dim: false },
    { prompt: "✓", text: "Build optimized (98 / 100)", highlight: true },
    { prompt: "$", text: "vercel deploy --prod", dim: false },
    { prompt: ">", text: "Ready at nguyen.dev", highlight: true, cursor: true },
  ];

  return (
    <div
      className="relative w-full h-full flex flex-col justify-center gap-0.5 px-6 pt-8"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {/* Traffic lights */}
      <div className="absolute top-4 left-5 flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,95,87,0.5)" }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,189,46,0.5)" }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(40,201,64,0.5)" }} />
      </div>

      {lines.map((line, i) => (
        <div
          key={i}
          className="flex gap-2 text-[11px] leading-[1.8]"
          style={{
            animation: `svc-fadeInLine 0.4s ease forwards ${0.2 + i * 0.4}s`,
            opacity: 0,
          }}
        >
          <span
            style={{
              color: line.highlight ? accent : "rgba(255,255,255,0.25)",
              minWidth: 12,
            }}
          >
            {line.prompt}
          </span>
          <span
            style={{
              color: line.highlight
                ? accent
                : line.dim
                ? "rgba(255,255,255,0.25)"
                : "rgba(255,255,255,0.65)",
            }}
          >
            {line.text}
          </span>
          {line.cursor && (
            <span
              className="inline-block self-center"
              style={{
                width: 1,
                height: 12,
                background: accent,
                animation: "svc-cursorBlink 1s step-end infinite",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ServiceCard({
  service,
  index,
  title,
  description,
}: {
  service: (typeof SERVICES)[0];
  index: number;
  title: string;
  description: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    let ctx: { revert(): void } | undefined;

    Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]).then(([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.fromTo(
          cardRef.current,
          { y: 70, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: "expo.out",
            delay: index * 0.12,
            scrollTrigger: {
              trigger: cardRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    });

    return () => ctx?.revert();
  }, [index]);

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col overflow-hidden border border-[var(--border)] transition-[border-color] duration-500"
      style={{ background: "var(--surface)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          service.accent + "55";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--border)";
      }}
    >
      {/* Visual area */}
      <div
        className="relative overflow-hidden"
        style={{ height: 224, background: "var(--surface-2)" }}
      >
        {index === 0 && <WebGLVisual accent={service.accent} />}
        {index === 1 && <MotionVisual accent={service.accent} />}
        {index === 2 && <EngineeringVisual accent={service.accent} />}
        {/* Fade bottom edge */}
        <div
          className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, var(--surface), transparent)",
          }}
        />
      </div>

      {/* Text area */}
      <div className="flex flex-col flex-1 p-8 gap-4">
        <div className="flex items-start justify-between">
          <span
            className="font-mono text-[10px] tracking-[0.3em]"
            style={{
              fontFamily: "var(--font-mono)",
              color: service.accent,
            }}
          >
            {service.id}
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            ↗
          </span>
        </div>

        <h3
          className="font-display text-2xl font-black"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>

        <p
          className="text-sm leading-relaxed flex-1"
          style={{ color: "var(--text-muted)" }}
        >
          {description}
        </p>

        {/* Tools */}
        <div
          className="flex flex-wrap gap-2 pt-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {service.tools.map((tool) => (
            <span
              key={tool}
              className="font-mono text-[10px] tracking-wider uppercase px-2 py-1"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                background: "var(--surface-2)",
              }}
            >
              {tool}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

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
          headingRef.current?.children ?? [],
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: {
              trigger: headingRef.current,
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
      id="services"
      ref={sectionRef}
      className="section relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Heading */}
        <div ref={headingRef} className="mb-16">
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
              {t.services.label}
            </span>
          </div>
          <h2
            className="font-display text-5xl md:text-7xl font-black leading-none uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.services.title}
          </h2>
          <h2
            className="font-display text-5xl md:text-7xl font-black leading-none uppercase"
            style={{
              fontFamily: "var(--font-display)",
              WebkitTextStroke: "1px var(--text)",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t.services.titleStroke}
          </h2>
        </div>

        {/* Cards — separated by 1px border using gap + bg trick */}
        <div className="grid md:grid-cols-3 gap-px" style={{ background: "var(--border)" }}>
          {SERVICES.map((service, i) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={i}
              title={t.services.items[i]?.title ?? service.title}
              description={t.services.items[i]?.description ?? service.description}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes svc-gridMove {
          from { transform: translate(0, 0); }
          to { transform: translate(32px, 32px); }
        }
        @keyframes svc-rotateSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes svc-pulseSphere {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
        }
        @keyframes svc-dotBlink {
          from { opacity: 0.15; }
          to { opacity: 0.7; }
        }
        @keyframes svc-orbFloat {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes svc-trackX {
          from { transform: translateX(-40px); }
          to { transform: translateX(40px); }
        }
        @keyframes svc-fadeInLine {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes svc-cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  );
}
