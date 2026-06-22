'use client'

import { useEffect, useRef, useState } from 'react'
import { useLoader } from '@/components/providers/LoaderContext'

/* ─── Flow-field particle ─────────────────────────────────────────────────── */
interface Particle {
  x: number
  y: number
  speed: number
  life: number
  maxLife: number
}

/* ─── Timing (short & punchy) ─────────────────────────────────────────────── */
const T_NAME = 280 // name reveal starts
const T_META = 650 // meta line fades in
const T_COMPLETE = 1500 // progress hits 100%
const T_FADE = 1750 // wrapper starts fading
const T_DONE = 2150 // unmount

/* ─── Component ───────────────────────────────────────────────────────────── */
export function PageLoader({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  const [showName, setShowName] = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const [reducedDone, setReducedDone] = useState(false)
  const [prefersReduced, setPrefersReduced] = useState(false)

  const { setLoaderDone } = useLoader()

  /* ─── Detect reduced motion (client-only, avoids SSR mismatch) ─────────── */
  useEffect(() => {
    setPrefersReduced(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
  }, [])

  /* ─── Reduced-motion shortcut ─────────────────────────────────────────── */
  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (!reduced) return
    const t = setTimeout(() => {
      setReducedDone(true)
      setTimeout(() => {
        setLoaderDone(true)
        onComplete()
      }, 500)
    }, 900)
    return () => clearTimeout(t)
  }, [onComplete, setLoaderDone])

  /* ─── Generative flow field — the signature ────────────────────────────── */
  useEffect(() => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduced) return

    document.body.style.overflow = 'hidden'

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d', { alpha: false })!

    const isMobile = window.innerWidth < 768
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio ?? 1, 1.5)

    let W = 0
    let H = 0
    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Re-paint base so a resize mid-loader doesn't flash
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, W, H)
    }
    resize()
    window.addEventListener('resize', resize)

    let simplex: { noise3D: (x: number, y: number, z: number) => number } | null =
      null
    let particles: Particle[] = []
    let noiseTime = 0
    const noiseSeed = Math.random() * 10000
    let cancelled = false

    const makeParticle = (): Particle => {
      const maxLife = 90 + Math.random() * 160
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        speed: 0.9 + Math.random() * 1.6,
        life: Math.random() * maxLife,
        maxLife,
      }
    }

    const makeSeededPrng = (seed: number): (() => number) => {
      let s = seed
      return () => {
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646
      }
    }

    function tick(timestamp: number) {
      if (cancelled) return
      rafRef.current = requestAnimationFrame(tick)
      if (!simplex) return

      const elapsed = Math.max(0, timestamp - startRef.current)

      // Thin dark veil → trail fade
      ctx.fillStyle = 'rgba(5, 5, 5, 0.018)'
      ctx.fillRect(0, 0, W, H)

      noiseTime += 0.0006

      // Accent line colour — the portfolio's signature lime, with a few warm whites
      ctx.lineWidth = isMobile ? 0.8 : 1

      for (const p of particles) {
        const nx = (p.x / W) * 3
        const ny = (p.y / H) * 3
        const angle =
          simplex.noise3D(nx + noiseSeed, ny, noiseTime) * Math.PI * 2

        const vx = Math.cos(angle) * p.speed
        const vy = Math.sin(angle) * p.speed
        const nx2 = p.x + vx
        const ny2 = p.y + vy

        const lifeFrac = p.life / p.maxLife
        const alpha = Math.sin(lifeFrac * Math.PI) * 0.5

        // ~20% of strokes in lime accent, rest warm white — painterly mix
        ctx.strokeStyle =
          (p.maxLife * 1000) % 5 < 1
            ? `rgba(200, 255, 0, ${alpha})`
            : `rgba(240, 237, 232, ${alpha * 0.7})`

        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(nx2, ny2)
        ctx.stroke()

        p.x = nx2
        p.y = ny2
        p.life++

        if (p.life >= p.maxLife || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          const fresh = makeParticle()
          p.x = fresh.x
          p.y = fresh.y
          p.life = 0
          p.maxLife = fresh.maxLife
          p.speed = fresh.speed
        }
      }

      // Progress bar — driven by elapsed time
      if (progressBarRef.current) {
        const prog = Math.min(elapsed / T_COMPLETE, 1)
        progressBarRef.current.style.width = `${prog * 100}%`
      }
    }

    // Dynamic import of simplex-noise (same dep the Lab uses)
    import('simplex-noise').then(({ createNoise3D }) => {
      if (cancelled) return
      simplex = { noise3D: createNoise3D(makeSeededPrng(noiseSeed)) }
      const count = isMobile ? 1400 : 2600
      particles = Array.from({ length: count }, makeParticle)
      startRef.current = performance.now()
      rafRef.current = requestAnimationFrame(tick)
    })

    /* ── Sequence ──────────────────────────────────────────────────────── */
    const t1 = setTimeout(() => setShowName(true), T_NAME)
    const t2 = setTimeout(() => setShowMeta(true), T_META)
    const t3 = setTimeout(() => {
      if (progressBarRef.current) {
        progressBarRef.current.style.width = '100%'
        progressBarRef.current.style.backgroundColor = '#c8ff00'
      }
    }, T_COMPLETE)
    const t4 = setTimeout(() => setLoaderDone(true), T_FADE - 150)
    const t5 = setTimeout(() => {
      if (wrapperRef.current) {
        wrapperRef.current.style.transition = 'opacity 400ms ease-out'
        wrapperRef.current.style.opacity = '0'
      }
    }, T_FADE)
    const t6 = setTimeout(() => {
      document.body.style.overflow = ''
      onComplete()
    }, T_DONE)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      clearTimeout(t6)
      window.removeEventListener('resize', resize)
      document.body.style.overflow = ''
    }
  }, [onComplete, setLoaderDone])

  /* ─── Reduced-motion render ───────────────────────────────────────────── */
  if (prefersReduced) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9997,
          backgroundColor: '#050505',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 500ms ease',
          opacity: reducedDone ? 0 : 1,
          pointerEvents: reducedDone ? 'none' : 'all',
        }}
      >
        <span
          style={{
            fontFamily: "'PP Monument Extended', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2rem,8vw,5rem)',
            color: 'rgba(240,237,232,0.92)',
            letterSpacing: '0.25em',
          }}
        >
          NGUYEN MINH
        </span>
      </div>
    )
  }

  /* ─── Full render ─────────────────────────────────────────────────────── */
  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9997,
        backgroundColor: '#050505',
        overflow: 'hidden',
      }}
    >
      {/* Generative flow field */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      />

      {/* Vignette to focus the centre */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 25%, rgba(5,5,5,0.78) 100%)',
        }}
      />

      {/* Name + meta */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.2rem',
          pointerEvents: 'none',
          userSelect: 'none',
          padding: '0 6vw',
          textAlign: 'center',
        }}
      >
        <h1
          aria-label="NGUYEN MINH"
          style={{
            margin: 0,
            fontFamily: "'PP Monument Extended', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.2rem, 8vw, 6rem)',
            color: 'rgba(240,237,232,0.95)',
            letterSpacing: '0.18em',
            lineHeight: 0.95,
            opacity: showName ? 1 : 0,
            transform: showName ? 'translateY(0)' : 'translateY(14px)',
            filter: showName ? 'blur(0px)' : 'blur(14px)',
            transition:
              'opacity 800ms cubic-bezier(0.16,1,0.3,1), transform 800ms cubic-bezier(0.16,1,0.3,1), filter 800ms cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          NGUYEN MINH
        </h1>

        <span
          style={{
            fontFamily: "'PP Neue Machina', monospace",
            fontWeight: 300,
            fontSize: 'clamp(0.55rem, 1.2vw, 0.72rem)',
            letterSpacing: '0.32em',
            color: 'rgba(200,255,0,0.85)',
            textTransform: 'uppercase',
            opacity: showMeta ? 1 : 0,
            transition: 'opacity 700ms ease',
          }}
        >
          Creative Web Developer
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: 'rgba(240,237,232,0.06)',
        }}
      >
        <div
          ref={progressBarRef}
          style={{
            height: '100%',
            width: '0%',
            backgroundColor: 'rgba(240,237,232,0.35)',
            transition: 'background-color 200ms ease',
          }}
        />
      </div>
    </div>
  )
}
