'use client'

import { useEffect, useRef, useState } from 'react'
import { useLoader } from '@/components/providers/LoaderContext'

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Star {
  x: number
  y: number
  px: number          // previous x (for warp streaks)
  py: number          // previous y
  vx: number
  vy: number
  opacity: number
  targetOpacity: number
  radius: number
  z: number           // depth 0.05–1.0 (closer = bigger, faster, brighter)
  angle: number       // radial angle from center
  colorType: 0 | 1 | 2
}

type Phase = 'loading' | 'exiting' | 'base' | 'fading'

/* ─── Timing ─────────────────────────────────────────────────────────────── */
const TOTAL_MS   = 5200
const T_NGUYEN   = 1900
const T_MINH     = 3000
const T_META     = 3900
const T_COMPLETE = 5000

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function makeStars(cw: number, ch: number, count: number): Star[] {
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const z = 0.05 + Math.random() * 0.95
    // Stars start close to center and spread outward — depth controls spread
    const maxDist = Math.min(cw, ch) * 0.55
    const dist = 40 + Math.random() * maxDist * (0.3 + z * 0.7)
    const x = cw / 2 + Math.cos(angle) * dist
    const y = ch / 2 + Math.sin(angle) * dist

    const rand = Math.random()
    const colorType: 0 | 1 | 2 = rand < 0.78 ? 0 : rand < 0.95 ? 1 : 2

    const baseRadius = colorType === 0
      ? 0.3 + Math.random() * 0.35
      : colorType === 1
      ? 0.6 + Math.random() * 0.5
      : 1.0 + Math.random() * 0.6

    const baseOpacity = colorType === 0
      ? 0.07 + Math.random() * 0.09
      : colorType === 1
      ? 0.3 + Math.random() * 0.25
      : 0.65 + Math.random() * 0.3

    stars.push({
      x, y, px: x, py: y,
      vx: 0, vy: 0,
      opacity: 0,
      targetOpacity: baseOpacity * (0.4 + z * 0.6),
      radius: baseRadius * (0.5 + z * 0.5),
      z, angle,
      colorType,
    })
  }
  return stars
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export function PageLoader({ onComplete }: { onComplete: () => void }) {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const whiteRef       = useRef<HTMLDivElement>(null)
  const wrapperRef     = useRef<HTMLDivElement>(null)
  const rafRef         = useRef<number>(0)
  const startRef       = useRef<number>(0)
  const starsRef       = useRef<Star[]>([])
  const phaseRef       = useRef<Phase>('loading')
  const exitStartRef   = useRef<number>(0)
  const lastBarUpdate  = useRef<number>(0)

  const [showNguyen,    setShowNguyen]    = useState(false)
  const [showMinh,      setShowMinh]      = useState(false)
  const [showMeta,      setShowMeta]      = useState(false)
  const [progressFlash, setProgressFlash] = useState(false)
  const [isBase,        setIsBase]        = useState(false)
  const [reducedDone,   setReducedDone]   = useState(false)
  // Detect reduced-motion in state to avoid SSR/client mismatch
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    setPrefersReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const { setLoaderDone } = useLoader()

  /* ─── Reduced motion ──────────────────────────────────────────────────── */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduced) return
    const t = setTimeout(() => {
      setReducedDone(true)
      setTimeout(() => { setLoaderDone(true); onComplete() }, 600)
    }, 1200)
    return () => clearTimeout(t)
  }, [onComplete, setLoaderDone])

  /* ─── Main cinematic loop ─────────────────────────────────────────────── */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    document.body.style.overflow = 'hidden'

    const canvas = canvasRef.current!
    const gl     = canvas.getContext('2d')!

    const isMobile = window.innerWidth < 768
    // Mobile: DPR locked to 1 to halve fill area cost
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio ?? 1, 1.5)

    const resize = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      canvas.width  = W * dpr
      canvas.height = H * dpr
      canvas.style.width  = `${W}px`
      canvas.style.height = `${H}px`
      // setTransform instead of scale — prevents accumulation on multiple resize calls
      gl.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const count = isMobile ? 180 : 650
    starsRef.current = makeStars(
      canvas.width / dpr,
      canvas.height / dpr,
      count,
    )

    /* ── Audio ───────────────────────────────────────────────────────── */
    let gainNode: GainNode | null = null
    try {
      const actx = new AudioContext()
      const osc  = actx.createOscillator()
      gainNode   = actx.createGain()
      osc.frequency.value = 220
      gainNode.gain.value = 0
      osc.connect(gainNode)
      gainNode.connect(actx.destination)
      osc.start()
      gainNode.gain.linearRampToValueAtTime(0.018, actx.currentTime + 3)
      // Clean up on exit
      const killAudio = () => {
        gainNode?.gain.linearRampToValueAtTime(0, actx.currentTime + 0.15)
      }
      window._loaderKillAudio = killAudio
    } catch (_) { /* silent fail */ }

    /* ── Phase timeouts ──────────────────────────────────────────────── */
    const t1 = setTimeout(() => setShowNguyen(true), T_NGUYEN)
    const t2 = setTimeout(() => setShowMinh(true),   T_MINH)
    const t3 = setTimeout(() => setShowMeta(true),   T_META)
    const t4 = setTimeout(() => {
      if (progressBarRef.current) {
        progressBarRef.current.style.width = '100%'
        progressBarRef.current.style.backgroundColor = '#c8ff00'
      }
      setProgressFlash(true)
      setTimeout(() => {
        if (progressBarRef.current)
          progressBarRef.current.style.backgroundColor = 'rgba(255,255,255,0.3)'
        setProgressFlash(false)
        startExit()
      }, 200)
    }, T_COMPLETE)

    /* ── Exit sequence ────────────────────────────────────────────────── */
    function startExit() {
      phaseRef.current   = 'exiting'
      exitStartRef.current = performance.now()
      window._loaderKillAudio?.()

      // +700ms: center ignition flash via canvas (handled in RAF)
      // +700ms: white circle explodes
      setTimeout(() => {
        const w = whiteRef.current
        if (!w) return
        w.style.opacity = '1'
        void w.offsetWidth
        w.style.transition = 'clip-path 600ms cubic-bezier(0.16,1,0.3,1)'
        w.style.clipPath = 'circle(160vmax at 50% 50%)'
      }, 700)

      // +1400ms: white fades back to black — reveal base state
      setTimeout(() => {
        const w = whiteRef.current
        if (!w) return
        w.style.transition = 'opacity 450ms ease-out'
        w.style.opacity = '0'
        // Reset clip so it doesn't block pointer events
        setTimeout(() => {
          if (whiteRef.current) whiteRef.current.style.clipPath = 'circle(0px at 50% 50%)'
        }, 500)
        phaseRef.current = 'base'
        setIsBase(true)  // hides text/particles overlay, shows just dot
      }, 1400)

      // +2400ms: hero is ready
      setTimeout(() => {
        setLoaderDone(true)
      }, 2400)

      // +2700ms: loader fades out
      setTimeout(() => {
        phaseRef.current = 'fading'
        if (wrapperRef.current) {
          wrapperRef.current.style.transition = 'opacity 400ms ease-out'
          wrapperRef.current.style.opacity = '0'
        }
      }, 2700)

      // +3100ms: unmount
      setTimeout(() => {
        document.body.style.overflow = ''
        onComplete()
      }, 3100)
    }

    /* ── RAF ──────────────────────────────────────────────────────────── */
    startRef.current = performance.now()

    // Mobile: track frame skip for perf
    let frameCount = 0

    function tick(timestamp: number) {
      const elapsed = Math.max(0, timestamp - startRef.current)
      const W = canvas.width  / dpr
      const H = canvas.height / dpr
      const cx = W / 2
      const cy = H / 2

      // Mobile: skip every other frame for physics only (still draw every frame)
      const doPhysics = !isMobile || (frameCount % 2 === 0)
      frameCount++

      gl.clearRect(0, 0, W, H)

      const phase = phaseRef.current

      /* ── Gravitational ripples (loading phase only) ─── */
      if (phase === 'loading') {
        for (let r = 0; r < 2; r++) {
          const rT = (elapsed + r * 4000) % 8000
          const rR = Math.max(0, (rT / 8000) * 260)
          const rA = 0.035 * (1 - rT / 8000)
          if (rR > 0) {
            gl.beginPath()
            gl.arc(cx, cy, rR, 0, Math.PI * 2)
            gl.strokeStyle = `rgba(255,255,255,${rA})`
            gl.lineWidth = 0.8
            gl.stroke()
          }
        }
      }

      /* ── Stars ─── */
      const fadeIn = Math.min(elapsed / 2400, 1)
      const isExiting = phase === 'exiting'
      const isBaseState = phase === 'base' || phase === 'fading'
      const exitT = isExiting
        ? Math.min((timestamp - exitStartRef.current) / 800, 1)
        : 0

      // Batch by colorType to reduce fillStyle calls
      // Groups: type0[], type1[], type2[]
      if (!isBaseState) {
        const batches: [string, { x: number; y: number; px: number; py: number; r: number; op: number }[]][] = [
          ['rgba(255,255,255,{op})', []],
          ['rgba(255,255,255,{op})', []],
          ['rgba(200,255,0,{op})',   []],
        ]

        for (const s of starsRef.current) {
          if (doPhysics) {
            if (!isExiting) {
              // Normal drift: slow outward parallax by depth
              // Close (z≈1) stars drift faster → depth illusion
              const driftSpeed = 0.004 + s.z * 0.018
              const nx = Math.cos(s.angle) * driftSpeed
              const ny = Math.sin(s.angle) * driftSpeed
              s.vx = s.vx * 0.96 + nx * 0.04
              s.vy = s.vy * 0.96 + ny * 0.04

              const target = s.targetOpacity * fadeIn
              s.opacity += (target - s.opacity) * 0.035
            } else {
              // WARP: accelerate radially outward — cubic ease-in
              const warpEase = exitT * exitT * exitT
              const outSpeed = warpEase * (isMobile ? 6 : 12) * s.z
              s.px = s.x
              s.py = s.y
              s.vx += Math.cos(s.angle) * outSpeed
              s.vy += Math.sin(s.angle) * outSpeed
              s.opacity = s.targetOpacity * (1 - warpEase * 0.9)
            }

            s.x += s.vx
            s.y += s.vy
          }

          if (s.opacity < 0.01) continue

          batches[s.colorType][1].push({
            x: s.x, y: s.y, px: s.px, py: s.py,
            r: Math.max(0.1, s.radius),
            op: s.opacity,
          })
        }

        // Draw each batch
        // Type 0 & 1: white (varying opacity — draw individually but skip fillStyle per-particle via alpha)
        // Type 2: accent

        // On desktop, draw warp streaks
        if (isExiting && !isMobile) {
          for (let t = 0; t < 3; t++) {
            const colorFmt = t === 2 ? 'rgba(200,255,0,{op})' : 'rgba(255,255,255,{op})'
            for (const s of batches[t][1]) {
              const dx = s.x - s.px
              const dy = s.y - s.py
              const len = Math.sqrt(dx * dx + dy * dy)
              if (len > 0.5) {
                gl.beginPath()
                gl.moveTo(s.px, s.py)
                gl.lineTo(s.x, s.y)
                gl.strokeStyle = colorFmt.replace('{op}', String(s.op * 0.7))
                gl.lineWidth = s.r * 1.2
                gl.stroke()
              }
            }
          }
        }

        // Draw star dots
        // Group by approximate opacity bucket to reduce fillStyle changes
        for (let t = 0; t < 3; t++) {
          const colorFmt = t === 2 ? 'rgba(200,255,0,{op})' : 'rgba(255,255,255,{op})'
          // Sort by opacity so we can batch nearby values (optional optimization)
          for (const s of batches[t][1]) {
            gl.beginPath()
            gl.arc(s.x, s.y, s.r, 0, Math.PI * 2)
            gl.fillStyle = colorFmt.replace('{op}', s.op.toFixed(2))
            gl.fill()
          }
        }
      }

      /* ── Center dot ─── */
      const pulsePhase = (elapsed / 4000) * Math.PI * 2
      const pulseScale = 1 + 0.4 * Math.max(0, Math.sin(pulsePhase))
      let dotR = 2.2 * pulseScale

      if (isExiting) {
        // Final implosion then re-expansion before white flash
        const flashT = Math.min((timestamp - exitStartRef.current - 500) / 200, 1)
        if (flashT > 0) dotR += flashT * (1 - flashT) * 4 * 6 // brief mega-pulse
      }

      dotR = Math.max(0.5, dotR)

      // Glow
      const glowR = dotR * 9
      if (glowR > 0) {
        const grd = gl.createRadialGradient(cx, cy, 0, cx, cy, glowR)
        grd.addColorStop(0, 'rgba(255,255,255,0.45)')
        grd.addColorStop(1, 'rgba(255,255,255,0)')
        gl.beginPath()
        gl.arc(cx, cy, glowR, 0, Math.PI * 2)
        gl.fillStyle = grd
        gl.fill()
      }

      // Core dot
      gl.beginPath()
      gl.arc(cx, cy, dotR, 0, Math.PI * 2)
      gl.fillStyle = 'rgba(255,255,255,0.95)'
      gl.fill()

      /* ── Progress bar ─── */
      if (phase === 'loading' && progressBarRef.current) {
        if (timestamp - lastBarUpdate.current > 80) {
          const prog = Math.min(elapsed / TOTAL_MS, 0.97)
          progressBarRef.current.style.width = `${prog * 100}%`
          lastBarUpdate.current = timestamp
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(t1); clearTimeout(t2)
      clearTimeout(t3); clearTimeout(t4)
      window.removeEventListener('resize', resize)
      document.body.style.overflow = ''
      delete window._loaderKillAudio
    }
  }, [onComplete, setLoaderDone])

  /* ─── Reduced motion shortcut ─────────────────────────────────────────── */
  if (prefersReduced) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9997,
        backgroundColor: '#000', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 600ms ease',
        opacity: reducedDone ? 0 : 1,
        pointerEvents: reducedDone ? 'none' : 'all',
      }}>
        <span style={{
          fontFamily: "'PP Monument Extended', sans-serif",
          fontWeight: 900, fontSize: 'clamp(2rem,8vw,5rem)',
          color: 'rgba(255,255,255,0.9)', letterSpacing: '0.3em',
        }}>
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
        position: 'fixed', inset: 0, zIndex: 9997,
        backgroundColor: '#000000', overflow: 'hidden',
      }}
    >
      {/* TIME watermark — subliminal, opacity 0.025 */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        opacity: 0.025, pointerEvents: 'none', userSelect: 'none',
      }}>
        {([
          [-8, -10], [18, 12], [42, -18], [65, 18],
          [0, 52], [28, 64], [58, 48], [82, 58],
        ] as [number, number][]).map(([l, t], i) => (
          <span key={i} style={{
            position: 'absolute', left: `${l}vw`, top: `${t}vh`,
            fontFamily: "'PP Monument Extended', sans-serif",
            fontWeight: 300, fontSize: '21vw', color: 'white',
            whiteSpace: 'nowrap', lineHeight: 1,
            transform: 'rotate(90deg)', transformOrigin: 'left top',
          }}>TIME</span>
        ))}
      </div>

      {/* Canvas — particles + center dot */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />

      {/* Vignette */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* NGUYEN + MINH — hidden in base state */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', userSelect: 'none',
        opacity: isBase ? 0 : 1,
        transition: isBase ? 'opacity 300ms ease-out' : 'none',
      }}>
        {/* NGUYEN */}
        <div style={{
          fontFamily: "'PP Monument Extended', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(2.5rem, 6.5vw, 6.5rem)',
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '0.3em', lineHeight: 1, display: 'flex',
        }}>
          {['N','G','U','Y','E','N'].map((l, i) => (
            <span key={i} style={{
              display: 'inline-block',
              opacity: showNguyen ? 1 : 0,
              filter: showNguyen ? 'blur(0px)' : 'blur(22px)',
              transition: 'opacity 700ms ease, filter 700ms ease',
              transitionDelay: showNguyen ? `${i * 120}ms` : '0ms',
              willChange: 'opacity, filter',
            }}>{l}</span>
          ))}
        </div>

        {/* MINH */}
        <div style={{
          fontFamily: "'PP Monument Extended', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(2rem, 5.5vw, 5.5rem)',
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '0.3em', lineHeight: 1,
          marginTop: '0.12em', display: 'flex',
        }}>
          {['M','I','N','H'].map((l, i) => (
            <span key={i} style={{
              display: 'inline-block',
              opacity: showMinh ? 1 : 0,
              filter: showMinh ? 'blur(0px)' : 'blur(22px)',
              transition: 'opacity 700ms ease, filter 700ms ease',
              transitionDelay: showMinh ? `${i * 180}ms` : '0ms',
              willChange: 'opacity, filter',
            }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Meta text — hidden in base state */}
      <div style={{
        position: 'absolute', bottom: '10vh', left: 0, right: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.55rem',
        pointerEvents: 'none', userSelect: 'none',
        opacity: isBase ? 0 : 1,
        transition: isBase ? 'opacity 300ms ease-out' : 'none',
      }}>
        {([
          ['CREATIVE WEB DEVELOPER', 0],
          ['STRASBOURG — PARIS — HANOI', 500],
          ['2026', 1000],
        ] as [string, number][]).map(([text, delay]) => (
          <span key={text} style={{
            fontFamily: "'PP Neue Machina', monospace",
            fontWeight: 300,
            fontSize: 'clamp(0.5rem, 1.1vw, 0.7rem)',
            letterSpacing: '0.28em', color: 'white',
            opacity: showMeta ? 0.38 : 0,
            transition: 'opacity 1000ms ease',
            transitionDelay: showMeta ? `${delay}ms` : '0ms',
          }}>{text}</span>
        ))}
      </div>

      {/* Progress bar — film reel, hidden in base state */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '1px', backgroundColor: 'rgba(255,255,255,0.05)',
        opacity: isBase ? 0 : 1,
        transition: isBase ? 'opacity 300ms ease-out' : 'none',
      }}>
        <div ref={progressBarRef} style={{
          height: '100%', width: '0%',
          backgroundColor: progressFlash ? '#c8ff00' : 'rgba(255,255,255,0.28)',
          transition: progressFlash ? 'background-color 200ms ease' : 'none',
        }} />
      </div>

      {/* White stellar explosion overlay */}
      <div ref={whiteRef} aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'white',
        clipPath: 'circle(0px at 50% 50%)',
        opacity: 1,
        pointerEvents: 'none',
      }} />
    </div>
  )
}

// Ambient global type for audio cleanup
declare global {
  interface Window { _loaderKillAudio?: () => void }
}
