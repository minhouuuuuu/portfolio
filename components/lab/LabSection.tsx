'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { useLabCanvas } from './useLabCanvas'
import { useLocale } from '@/components/providers/LocaleProvider'

type GsapInstance = typeof import('gsap').gsap

// ─── Experiment metadata ──────────────────────────────────────────────────────

const EXPERIMENTS = [
  {
    id: 'fluid',
    label: '01 — ASCII FLUID',
    name: 'ASCII FLUID',
    stack: 'Canvas 2D · ASCII · Heat map',
    hint: { desktop: 'MOVE YOUR CURSOR', mobile: 'TOUCH & DRAG' },
  },
  {
    id: 'physics',
    label: '02 — PHYSICS PARTICLES',
    name: 'PHYSICS PARTICLES',
    stack: 'Matter.js · Canvas 2D · DeviceMotion',
    hint: {
      desktop: 'DRAG · THROW · CLICK TO EXPLODE',
      mobile: 'DRAG TO THROW · TAP TO EXPLODE',
    },
  },
  {
    id: 'flowfield',
    label: '03 — GENERATIVE FLOW FIELD',
    name: 'GENERATIVE FLOW FIELD',
    stack: 'Canvas 2D · Simplex Noise · Web Share API',
    hint: { desktop: 'WATCH IT PAINT ITSELF', mobile: 'LONG PRESS TO SHARE' },
  },
] as const

type ExperimentId = (typeof EXPERIMENTS)[number]['id']

// ─── Types for experiment instances ──────────────────────────────────────────

interface ExperimentInstance {
  destroy: () => void
  pause: () => void
  resume: () => void
  regenerate?: () => void
  enableGyro?: () => void
}

// ─── LabSection ───────────────────────────────────────────────────────────────

export function LabSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const infoNameRef = useRef<HTMLSpanElement>(null)
  const infoStackRef = useRef<HTMLSpanElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  const [activeId, setActiveId] = useState<ExperimentId>('fluid')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [showGyroBtn, setShowGyroBtn] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const instanceRef = useRef<ExperimentInstance | null>(null)
  const gsapRef = useRef<GsapInstance | null>(null)
  const { canvasRef } = useLabCanvas()
  const { t } = useLocale()

  // ─── Detect mobile ────────────────────────────────────────────────────────

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
  }, [])

  // ─── Hint: check localStorage ─────────────────────────────────────────────

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowHint(!localStorage.getItem('lab-visited'))
    }
  }, [])

  const dismissHint = useCallback(() => {
    setShowHint(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lab-visited', '1')
    }
  }, [])

  // ─── Section entrance animation ───────────────────────────────────────────

  useEffect(() => {
    if (!sectionRef.current || !titleRef.current) return
    let ctx: { revert(): void } | undefined

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger)
        gsapRef.current = gsap
        ctx = gsap.context(() => {
          gsap.fromTo(
            Array.from(titleRef.current!.children),
            { y: 60, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.1,
              duration: 0.9,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: titleRef.current,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            },
          )
        }, sectionRef)
      },
    )

    return () => ctx?.revert()
  }, [])

  // ─── Experiment lifecycle ─────────────────────────────────────────────────

  const initExperiment = useCallback(
    async (id: ExperimentId) => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Force canvas pixel size before creating any context.
      // useLabCanvas's ResizeObserver may not have fired yet on first mount.
      if (canvas.width === 0 || canvas.height === 0) {
        const rect = canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.max(Math.round(rect.width * dpr), 2)
        canvas.height = Math.max(Math.round(rect.height * dpr), 2)
      }

      // Ensure GSAP is loaded (first mount races with the GSAP useEffect)
      if (!gsapRef.current) {
        const { gsap: g } = await import('gsap')
        gsapRef.current = g
      }
      const gsap = gsapRef.current

      // Fade out
      await gsap.to(canvas, { opacity: 0, duration: 0.3, ease: 'power2.out' })

      // Destroy current
      instanceRef.current?.destroy()
      instanceRef.current = null

      // Clear canvas before loading next experiment
      const ctx2d = canvas.getContext('2d')
      if (ctx2d) {
        ctx2d.clearRect(0, 0, canvas.width, canvas.height)
      }

      // Check GPU tier for particle count reduction
      let gpuTier = 3
      try {
        const { getGPUTier } = await import('detect-gpu')
        const result = await getGPUTier()
        gpuTier = result.tier
      } catch {
        // ignore — detect-gpu optional
      }

      // Lazy-load and init the experiment
      try {
        switch (id) {
          case 'fluid': {
            const { AsciiFluid } = await import('./AsciiFluid')
            instanceRef.current = new AsciiFluid(canvas)
            break
          }
          case 'physics': {
            const { PhysicsParticles } = await import('./PhysicsParticles')
            const inst = new PhysicsParticles(canvas)
            if (
              isMobile &&
              typeof window !== 'undefined' &&
              window.DeviceMotionEvent
            ) {
              setShowGyroBtn(true)
            }
            instanceRef.current = inst
            break
          }
          case 'flowfield': {
            ;(
              window as Window & { __labParticleMultiplier?: number }
            ).__labParticleMultiplier = gpuTier < 2 ? 0.3 : 1
            const { GenerativeFlowField } =
              await import('./GenerativeFlowField')
            instanceRef.current = new GenerativeFlowField(canvas, dismissHint)
            break
          }
        }
      } catch (err) {
        console.warn('[LabSection] experiment init failed:', err)
      }

      // Fade in
      gsap.to(canvas, { opacity: 1, duration: 0.4, ease: 'power2.out' })

      setIsTransitioning(false)
    },
    [canvasRef, isMobile, dismissHint],
  )

  // Lazily init the first experiment only when the Lab is about to enter the
  // viewport, and pause/resume its render loop as it scrolls in and out of view
  // (and on tab visibility). No GPU work happens while the Lab is off-screen.
  const initedRef = useRef(false)
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const syncVisibility = (onScreen: boolean) => {
      const visible = onScreen && document.visibilityState === 'visible'
      if (visible) {
        if (!initedRef.current) {
          initedRef.current = true
          initExperiment('fluid')
        } else {
          instanceRef.current?.resume()
        }
      } else {
        instanceRef.current?.pause()
      }
    }

    let onScreen = false
    const onVisibility = () => syncVisibility(onScreen)

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        syncVisibility(onScreen)
      },
      // Start a bit before the section reaches the viewport so it's ready.
      { rootMargin: '200px 0px', threshold: 0 },
    )
    io.observe(section)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      instanceRef.current?.destroy()
      instanceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchTab = (id: ExperimentId) => {
    if (id === activeId || isTransitioning) return
    setIsTransitioning(true)
    setActiveId(id)
    setShowGyroBtn(false)

    // Update info strip with crossfade
    if (infoNameRef.current && infoStackRef.current) {
      const exp = EXPERIMENTS.find((e) => e.id === id)!
      const gsap = gsapRef.current
      if (gsap) {
        gsap.to([infoNameRef.current, infoStackRef.current], {
          opacity: 0,
          duration: 0.15,
          onComplete: () => {
            if (infoNameRef.current) infoNameRef.current.textContent = exp.name
            if (infoStackRef.current)
              infoStackRef.current.textContent = exp.stack
            gsap.to([infoNameRef.current, infoStackRef.current], {
              opacity: 1,
              duration: 0.25,
            })
          },
        })
      }
    }

    initExperiment(id)
  }

  // ─── Hint pulse animation ─────────────────────────────────────────────────

  useEffect(() => {
    if (!showHint || !hintRef.current) return
    let tl: ReturnType<GsapInstance['timeline']> | undefined

    import('gsap').then(({ gsap }) => {
      if (!hintRef.current) return
      tl = gsap.timeline({ repeat: -1, yoyo: true })
      tl.to(hintRef.current, {
        opacity: 0.3,
        y: -8,
        duration: 1.2,
        ease: 'sine.inOut',
      })
    })

    return () => {
      tl?.kill()
    }
  }, [showHint])

  // Dismiss hint on first canvas interaction
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !showHint) return
    const handler = () => dismissHint()
    canvas.addEventListener('mousemove', handler, { once: true })
    canvas.addEventListener('touchstart', handler, { once: true })
    return () => {
      canvas.removeEventListener('mousemove', handler)
      canvas.removeEventListener('touchstart', handler)
    }
  }, [canvasRef, showHint, dismissHint])

  const activeExp = EXPERIMENTS.find((e) => e.id === activeId)!

  return (
    <section
      id="lab"
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* ── Background glow ───────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            width: '60vw',
            height: '60vw',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            background:
              'radial-gradient(circle, rgba(200,255,0,0.03) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-0">
        {/* ── Section header ─────────────────────────────────────────────── */}
        <div ref={titleRef}>
          {/* Label */}
          <div
            className="flex items-center gap-3 mb-6"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span
              className="inline-block w-6 h-px"
              style={{ backgroundColor: 'var(--text-muted)' }}
            />
            <span
              className="text-xs tracking-[0.3em] uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.lab.label}
            </span>
          </div>

          {/* Title */}
          <h2
            className="font-display text-5xl md:text-7xl font-black leading-none uppercase mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t.lab.title}
          </h2>

          {/* Subtitle */}
          <p
            className="font-mono text-sm tracking-wider mb-10"
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {t.lab.subtitle}
          </p>

          {/* ── Tab buttons ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 mb-6">
            {EXPERIMENTS.map((exp) => {
              const isActive = exp.id === activeId
              return (
                <button
                  key={exp.id}
                  onClick={() => switchTab(exp.id)}
                  className="font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase px-4 py-2.5 border transition-all duration-300"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    background: isActive
                      ? 'rgba(200,255,0,0.05)'
                      : 'transparent',
                  }}
                >
                  {exp.label}
                </button>
              )
            })}

            {/* Gyro button — physics experiment, mobile only */}
            {showGyroBtn && (
              <button
                onClick={() =>
                  (
                    instanceRef.current as ExperimentInstance & {
                      enableGyro?: () => void
                    }
                  )?.enableGyro?.()
                }
                className="font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase px-4 py-2.5 border transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderColor: 'var(--accent-3)',
                  color: 'var(--accent-3)',
                  background: 'rgba(123,97,255,0.05)',
                }}
              >
                ENABLE GYROSCOPE
              </button>
            )}

            {/* Regenerate — flow field only */}
            {activeId === 'flowfield' && (
              <button
                onClick={() =>
                  (
                    instanceRef.current as ExperimentInstance & {
                      regenerate?: () => void
                    }
                  )?.regenerate?.()
                }
                className="font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase px-4 py-2.5 border transition-all duration-300 ml-auto"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                ↺ REGENERATE
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Canvas wrapper ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div
          ref={canvasWrapRef}
          className="relative w-full"
          style={{
            height: 'clamp(300px, 55vh, 720px)',
            border: '1px solid var(--border)',
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{
              touchAction: 'none',
              background: '#050505',
            }}
          />

          {/* ── Hint overlay ──────────────────────────────────────────────── */}
          {showHint && (
            <div
              ref={hintRef}
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ opacity: 0.7 }}
            >
              <div
                className="flex flex-col items-center gap-4"
                style={{ color: 'var(--text-muted)' }}
              >
                {/* Icon */}
                {isMobile ? (
                  <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
                    <rect
                      x="10"
                      y="2"
                      width="12"
                      height="20"
                      rx="6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M16 24V38"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10 34l6 4 6-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="4" fill="currentColor" />
                    <circle
                      cx="14"
                      cy="14"
                      r="11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M14 3v4M14 21v4M3 14h4M21 14h4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <span
                  className="font-mono text-xs tracking-[0.25em] uppercase"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {isMobile ? activeExp.hint.mobile : activeExp.hint.desktop}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Info strip ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div
          className="px-4 py-4 flex items-center justify-between"
          style={{ border: '1px solid var(--border)', borderTop: 'none' }}
        >
          <span
            ref={infoNameRef}
            className="font-display text-sm font-black uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {activeExp.name}
          </span>
          <span
            ref={infoStackRef}
            className="font-mono text-xs tracking-[0.15em]"
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {activeExp.stack}
          </span>
        </div>
      </div>

      {/* ── Wanna see more? / Performance Test ─────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-4 pt-10 pb-4">
        <MagneticButton>
          <Link
            href="/donut"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative md:px-8 px-6 py-4 font-mono text-sm tracking-widest uppercase overflow-hidden border border-(--accent) text-(--bg) bg-(--accent) inline-block"
            style={{ fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
          >
            <span className="relative z-10">{t.lab.wannaSeeMore}</span>
            <span
              className="absolute inset-0 bg-transparent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 border border-(--accent)"
              style={{ transformOrigin: 'left' }}
            />
          </Link>
        </MagneticButton>
        <MagneticButton>
          <Link
            href="/performancetest"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative md:px-8 px-6 py-4 font-mono text-sm tracking-widest uppercase overflow-hidden border border-(--accent) text-(--accent) bg-transparent inline-block"
            style={{ fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
          >
            <span className="relative z-10 group-hover:text-(--bg) transition-colors duration-300">
              {t.lab.performanceTest}
            </span>
            <span
              className="absolute inset-0 bg-(--accent) origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
              style={{ transformOrigin: 'left' }}
            />
          </Link>
        </MagneticButton>
      </div>

      {/* Bottom spacing */}
      <div className="h-16 md:h-24" />
    </section>
  )
}
