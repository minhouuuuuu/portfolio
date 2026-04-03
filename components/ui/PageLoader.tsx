'use client'

import { useEffect, useRef, useState } from 'react'
import { useLoader } from '@/components/providers/LoaderContext'

/* ─── Particle ──────────────────────────────────────────────────────────── */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  opacity: number
  targetOpacity: number
  radius: number
  colorType: 0 | 1 | 2 // 0=distant, 1=medium, 2=accent
}

function makeParticle(cx: number, cy: number, isMobile: boolean): Particle {
  const angle = Math.random() * Math.PI * 2
  const dist = 80 + Math.random() * (isMobile ? 200 : 420)
  const rand = Math.random()
  const colorType: 0 | 1 | 2 = rand < 0.8 ? 0 : rand < 0.95 ? 1 : 2
  return {
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist,
    vx: 0,
    vy: 0,
    opacity: 0,
    targetOpacity:
      colorType === 0
        ? 0.12 + Math.random() * 0.1
        : colorType === 1
          ? 0.45 + Math.random() * 0.2
          : 0.75,
    radius:
      colorType === 0
        ? 0.4 + Math.random() * 0.5
        : colorType === 1
          ? 0.8 + Math.random() * 0.6
          : 1.2 + Math.random() * 0.5,
    colorType,
  }
}

function particleColor(type: 0 | 1 | 2, opacity: number): string {
  if (type === 2) return `rgba(200,255,0,${opacity})`
  return `rgba(255,255,255,${opacity})`
}

/* ─── Timing ────────────────────────────────────────────────────────────── */
const TOTAL_MS = 6000
// phase triggers (ms from start)
const T_NGUYEN = TOTAL_MS * 0.38 // 2280ms — NGUYEN begins
const T_MINH = TOTAL_MS * 0.56 // 3360ms — MINH begins
const T_META = TOTAL_MS * 0.72 // 4320ms — meta text appears
const T_COMPLETE = TOTAL_MS * 0.97 // 5820ms — progress hits 100%

/* ─── Component ─────────────────────────────────────────────────────────── */
export function PageLoader({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const flashDotRef = useRef<HTMLDivElement>(null)
  const whiteRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const isExitingRef = useRef(false)
  const exitStartRef = useRef<number>(0)

  const [showNguyen, setShowNguyen] = useState(false)
  const [showMinh, setShowMinh] = useState(false)
  const [showMeta, setShowMeta] = useState(false)
  const [progressFlash, setProgressFlash] = useState(false)
  const [reducedVisible, setReducedVisible] = useState(true)

  const { setLoaderDone } = useLoader()

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* ── Reduced motion: simple 1s fade ─────────────────────────────── */
    if (reduced) {
      const t = setTimeout(() => {
        setReducedVisible(false)
        setTimeout(() => {
          setLoaderDone(true)
          onComplete()
        }, 600)
      }, 1200)
      return () => clearTimeout(t)
    }

    /* ── Prevent background scroll ─────────────────────────────────── */
    document.body.style.overflow = 'hidden'

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const isMobile = window.innerWidth < 768

    /* ── Canvas size ─────────────────────────────────────────────── */
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    /* ── Particles ───────────────────────────────────────────────── */
    const count = isMobile ? 400 : 800
    const cx0 = canvas.width / 2
    const cy0 = canvas.height / 2
    particlesRef.current = Array.from({ length: count }, () =>
      makeParticle(cx0, cy0, isMobile),
    )

    /* ── Audio ───────────────────────────────────────────────────── */
    let gainNode: GainNode | null = null
    let audioCtx: AudioContext | null = null
    try {
      audioCtx = new AudioContext()
      const osc = audioCtx.createOscillator()
      gainNode = audioCtx.createGain()
      osc.frequency.value = 220
      gainNode.gain.value = 0
      osc.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      osc.start()
      gainNode.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 2.5)
    } catch (_) {
      /* silent fail */
    }

    /* ── Phase triggers ──────────────────────────────────────────── */
    const t1 = setTimeout(() => setShowNguyen(true), T_NGUYEN)
    const t2 = setTimeout(() => setShowMinh(true), T_MINH)
    const t3 = setTimeout(() => setShowMeta(true), T_META)
    const t4 = setTimeout(() => {
      // progress bar snaps to 100% + accent flash
      if (progressBarRef.current) {
        progressBarRef.current.style.width = '100%'
        progressBarRef.current.style.backgroundColor = '#c8ff00'
      }
      setProgressFlash(true)
      setTimeout(() => {
        if (progressBarRef.current) {
          progressBarRef.current.style.backgroundColor = 'rgba(255,255,255,0.3)'
        }
        setProgressFlash(false)
        startExit()
      }, 200)
    }, T_COMPLETE)

    /* ── Exit sequence ────────────────────────────────────────────── */
    function startExit() {
      isExitingRef.current = true
      exitStartRef.current = performance.now()

      // Step 2 (400ms): center flash — bright white burst
      setTimeout(() => {
        const dot = flashDotRef.current
        if (dot) {
          dot.style.transition = 'none'
          dot.style.opacity = '1'
          dot.style.transform = 'translate(-50%, -50%) scale(4)'
        }
      }, 400)
      setTimeout(() => {
        const dot = flashDotRef.current
        if (dot) {
          dot.style.transition = 'opacity 100ms ease, transform 100ms ease'
          dot.style.opacity = '0'
          dot.style.transform = 'translate(-50%, -50%) scale(1)'
        }
      }, 500)

      // Step 3 (500ms): white circle expands from center
      setTimeout(() => {
        const w = whiteRef.current
        if (w) {
          w.style.opacity = '1'
          // Force reflow before starting transition
          void w.offsetWidth
          w.style.transition = 'clip-path 500ms ease-in'
          w.style.clipPath = 'circle(160vmax at 50% 50%)'
        }
      }, 500)

      // Step 4 (1000ms): white fades out, signal hero
      setTimeout(() => {
        setLoaderDone(true) // hero entrance begins
        const w = whiteRef.current
        if (w) {
          w.style.transition = 'opacity 600ms ease-in-out'
          w.style.opacity = '0'
        }
      }, 1000)

      // Step 6 (1700ms): silence audio, unmount
      setTimeout(() => {
        if (gainNode && audioCtx) {
          gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1)
        }
        document.body.style.overflow = ''
        onComplete()
      }, 1700)
    }

    /* ── RAF loop ─────────────────────────────────────────────────── */
    startRef.current = performance.now()
    let lastProgressUpdate = 0

    function tick(timestamp: number) {
      const elapsed = Math.max(0, timestamp - startRef.current)
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2

      ctx.clearRect(0, 0, w, h)

      /* ── Gravitational ripples ─── */
      for (let r = 0; r < 2; r++) {
        const rippleT = (elapsed + r * 4000) % 8000
        const rippleRadius = Math.max(0, (rippleT / 8000) * 280)
        const rippleAlpha = 0.04 * (1 - rippleT / 8000)
        if (Number.isFinite(rippleRadius) && rippleRadius > 0) {
          ctx.beginPath()
          ctx.arc(cx, cy, rippleRadius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255,255,255,${rippleAlpha})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      /* ── Particles ─── */
      const fadeInProgress = Math.min(elapsed / 2200, 1)
      const isCollapsing =
        isExitingRef.current &&
        timestamp - exitStartRef.current < 700

      for (const p of particlesRef.current) {
        if (!isExitingRef.current) {
          // Fade in during phase 1
          const target = p.targetOpacity * fadeInProgress
          p.opacity += (target - p.opacity) * 0.04

          // Slow spiral drift toward center (accretion disk)
          const dx = cx - p.x
          const dy = cy - p.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          // Radial (inward)
          p.vx += (dx / dist) * 0.0003
          p.vy += (dy / dist) * 0.0003
          // Tangential (perpendicular — clockwise spiral)
          p.vx += (-dy / dist) * 0.00035
          p.vy += (dx / dist) * 0.00035
          // Speed cap
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
          const MAX_SPD = 0.08
          if (spd > MAX_SPD) {
            p.vx = (p.vx / spd) * MAX_SPD
            p.vy = (p.vy / spd) * MAX_SPD
          }
        } else if (isCollapsing) {
          // Accelerate toward center (gravitational collapse)
          const t = Math.min((timestamp - exitStartRef.current) / 700, 1)
          const ease = t * t * t // ease-in cubic
          const dx = cx - p.x
          const dy = cy - p.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = ease * 20
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
          p.vx *= 0.75
          p.vy *= 0.75
          p.opacity = p.targetOpacity * (1 - ease)
        }

        p.x += p.vx
        p.y += p.vy

        if (p.opacity > 0.01) {
          const particleRadius = Math.max(0, p.radius)
          if (!(Number.isFinite(particleRadius) && particleRadius > 0)) continue
          ctx.beginPath()
          ctx.arc(p.x, p.y, particleRadius, 0, Math.PI * 2)
          ctx.fillStyle = particleColor(p.colorType, p.opacity)
          ctx.fill()
        }
      }

      /* ── Center dot ─── */
      // Pulse: scale 1→1.4→1, 4s loop
      const pulsePhase = (elapsed / 4000) * Math.PI * 2
      const pulseScale = 1 + 0.4 * Math.max(0, Math.sin(pulsePhase))
      const dotR = 2 * pulseScale

      // Final big pulse at exit start
      let bigPulseExtra = 0
      if (isExitingRef.current) {
        const exitT = Math.min((timestamp - exitStartRef.current) / 500, 1)
        bigPulseExtra = exitT * 3 * (1 - exitT) // rises and falls
      }
      const finalR = Math.max(0, dotR + bigPulseExtra * 4)

      // Glow halo
      const glowRadius = finalR * 8
      if (Number.isFinite(glowRadius) && glowRadius > 0) {
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius)
        glow.addColorStop(0, 'rgba(255,255,255,0.5)')
        glow.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.beginPath()
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
      }

      // Core
      if (Number.isFinite(finalR) && finalR > 0) {
        ctx.beginPath()
        ctx.arc(cx, cy, finalR, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.fill()
      }

      /* ── Progress bar (direct DOM — no React re-render) ─── */
      if (progressBarRef.current && !isExitingRef.current) {
        if (timestamp - lastProgressUpdate > 50) {
          const prog = Math.min(elapsed / TOTAL_MS, 0.97)
          progressBarRef.current.style.width = `${prog * 100}%`
          lastProgressUpdate = timestamp
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      window.removeEventListener('resize', resize)
      document.body.style.overflow = ''
    }
  }, [onComplete, setLoaderDone])

  /* ── Reduced motion fallback ──────────────────────────────────────────── */
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  if (prefersReduced) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9997,
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 600ms ease',
          opacity: reducedVisible ? 1 : 0,
          pointerEvents: reducedVisible ? 'all' : 'none',
        }}
      >
        <span
          style={{
            fontFamily: "'PP Monument Extended', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2rem, 8vw, 6rem)',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.3em',
          }}
        >
          NGUYEN MINH
        </span>
      </div>
    )
  }

  /* ── Full cinematic loader ─────────────────────────────────────────────── */
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9997,
        backgroundColor: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* TIME watermark — subliminal texture (opacity 0.03) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          opacity: 0.03,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {([
          [-12, -15],
          [13, 10],
          [38, -20],
          [63, 15],
          [-5, 50],
          [25, 60],
          [55, 45],
          [80, 55],
        ] as [number, number][]).map(([left, top], i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${left}vw`,
              top: `${top}vh`,
              fontFamily: "'PP Monument Extended', sans-serif",
              fontWeight: 300,
              fontSize: '22vw',
              color: 'white',
              whiteSpace: 'nowrap',
              lineHeight: 1,
              transform: 'rotate(90deg)',
              transformOrigin: 'left top',
            }}
          >
            TIME
          </span>
        ))}
      </div>

      {/* Canvas: particles + ripples + center dot */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 25%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* ── NGUYEN + MINH text ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {/* NGUYEN */}
        <div
          style={{
            fontFamily: "'PP Monument Extended', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.4rem, 6.2vw, 6.2rem)',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.3em',
            lineHeight: 1,
            display: 'flex',
          }}
        >
          {['N', 'G', 'U', 'Y', 'E', 'N'].map((l, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: showNguyen ? 1 : 0,
                filter: showNguyen ? 'blur(0px)' : 'blur(20px)',
                transition: 'opacity 600ms ease, filter 600ms ease',
                transitionDelay: showNguyen ? `${i * 150}ms` : '0ms',
                willChange: 'opacity, filter',
              }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* MINH */}
        <div
          style={{
            fontFamily: "'PP Monument Extended', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2rem, 5.3vw, 5.3rem)',
            color: 'rgba(255,255,255,0.9)',
            letterSpacing: '0.3em',
            lineHeight: 1,
            marginTop: '0.15em',
            display: 'flex',
          }}
        >
          {['M', 'I', 'N', 'H'].map((l, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: showMinh ? 1 : 0,
                filter: showMinh ? 'blur(0px)' : 'blur(20px)',
                transition: 'opacity 600ms ease, filter 600ms ease',
                transitionDelay: showMinh ? `${i * 200}ms` : '0ms',
                willChange: 'opacity, filter',
              }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* ── Meta text ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '10vh',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {(
          [
            ['CREATIVE WEB DEVELOPER', 0],
            ['STRASBOURG — PARIS — HANOI', 500],
            ['2026', 1000],
          ] as [string, number][]
        ).map(([text, delay]) => (
          <span
            key={text}
            style={{
              fontFamily: "'PP Neue Machina', monospace",
              fontWeight: 300,
              fontSize: 'clamp(0.55rem, 1.2vw, 0.75rem)',
              letterSpacing: '0.25em',
              color: 'white',
              opacity: showMeta ? 0.4 : 0,
              transition: 'opacity 1000ms ease',
              transitionDelay: showMeta ? `${delay}ms` : '0ms',
            }}
          >
            {text}
          </span>
        ))}
      </div>

      {/* ── Progress bar (1px film reel) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          ref={progressBarRef}
          style={{
            height: '100%',
            width: '0%',
            backgroundColor: progressFlash
              ? '#c8ff00'
              : 'rgba(255,255,255,0.3)',
            transition: progressFlash
              ? 'background-color 200ms ease'
              : 'none',
          }}
        />
      </div>

      {/* ── Center flash point (for star-ignition) ── */}
      <div
        ref={flashDotRef}
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(1)',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'white',
          boxShadow: '0 0 20px 8px rgba(255,255,255,0.8)',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {/* ── White expansion overlay (stellar collapse flash) ── */}
      <div
        ref={whiteRef}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'white',
          clipPath: 'circle(0px at 50% 50%)',
          opacity: 1,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
