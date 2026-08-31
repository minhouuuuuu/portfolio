'use client'

import { useRef, useEffect, useImperativeHandle, type Ref } from 'react'
import { useRouter } from 'next/navigation'

// ─── Cosmic page transition ───────────────────────────────────────────────────
// Exit: the screen falls to black while stars orbit a dark planet in 3D,
// accelerating and collapsing inward. Navigate at the point of collapse.
// Enter: the same particles detonate outward from the center (big bang) and
// the black veil dissolves to reveal the page.
// Canvas 2D + hand-rolled perspective projection — no WebGL cost, buttery on
// a fade-trail motion blur. Honors prefers-reduced-motion by skipping itself.

export interface CaseStudyTransitionHandle {
  /** Play the orbit-collapse exit, then navigate. Returns false when the
      effect can't run (reduced motion, no canvas) — caller navigates itself. */
  exitTo(href: string): boolean
}

const ACCENT = '#c8ff00'
const STAR = '#f0ede8'
const BLACK = '#050505'

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
const easeInCubic = (t: number) => t * t * t
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

interface OrbitStar {
  theta: number
  phi: number
  shell: number // orbit radius as a multiple of the planet radius
  size: number
  speed: number
  accent: boolean
}

interface BangStar {
  dx: number
  dy: number
  dz: number
  size: number
  accent: boolean
  delay: number // normalized 0–0.25 stagger
  px: number
  py: number
  ps: number
  live: boolean
}

const TILT = -0.45
const ENTER_MS = 1350
const EXIT_FADE_MS = 280
const EXIT_PUSH_MS = 1020

export function CaseStudyTransition({
  ref,
}: {
  ref?: Ref<CaseStudyTransitionHandle>
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  const engineRef = useRef<{
    exitTo(href: string): boolean
  } | null>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reduced || !ctx) {
      // Media query already hides the veil for reduced motion; make sure it
      // never lingers when the canvas is unavailable.
      wrap.style.display = 'none'
      return
    }

    // JS owns the veil now — detach the CSS no-JS fallback animation.
    wrap.style.animation = 'none'

    let raf = 0
    let width = 0
    let height = 0
    let mode: 'enter' | 'exit' | 'idle' = 'enter'
    let modeStart = performance.now()
    let last = modeStart
    let rot = 0
    let pushed = false
    let pendingHref = ''

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Star casts ────────────────────────────────────────────────────────
    const orbitStars: OrbitStar[] = Array.from({ length: 240 }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      shell: 1.35 + Math.random() * 1.5,
      size: 0.5 + Math.random() * 1.3,
      speed: 0.75 + Math.random() * 0.6,
      accent: Math.random() < 0.28,
    }))

    const makeBangStar = (): BangStar => {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      return {
        dx: Math.sin(phi) * Math.cos(theta),
        dy: Math.sin(phi) * Math.sin(theta),
        dz: Math.cos(phi) * 0.9, // some fly toward the camera → long streaks
        size: 0.6 + Math.random() * 1.6,
        accent: Math.random() < 0.3,
        delay: Math.random() * 0.25,
        px: 0,
        py: 0,
        ps: 0,
        live: false,
      }
    }
    const bangStars: BangStar[] = Array.from({ length: 320 }, makeBangStar)

    // ── Projection helpers ───────────────────────────────────────────────
    const focal = () => Math.min(width, height) * 1.1
    const planetR = () => Math.min(width, height) * 0.14

    const project = (x: number, y: number, z: number) => {
      const f = focal()
      const s = f / (f + Math.max(z, -f * 0.85))
      return [width / 2 + x * s, height / 2 + y * s, s] as const
    }

    const drawPlanet = () => {
      const R = planetR()
      const cx = width / 2
      const cy = height / 2
      const g = ctx.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.35,
        R * 0.1,
        cx,
        cy,
        R,
      )
      g.addColorStop(0, '#121212')
      g.addColorStop(1, BLACK)
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
      // Thin fluo atmosphere rim
      ctx.save()
      ctx.strokeStyle = ACCENT
      ctx.globalAlpha = 0.45
      ctx.shadowColor = ACCENT
      ctx.shadowBlur = 22
      ctx.lineWidth = 1.25
      ctx.beginPath()
      ctx.arc(cx, cy, R + 1, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    // ── Frames ───────────────────────────────────────────────────────────
    const orbitFrame = (elapsed: number, dt: number) => {
      // Velocity ramps in, orbits collapse toward the planet at the end.
      const accel = easeInCubic(clamp01(elapsed / 900))
      rot += dt * 0.001 * (0.6 + 2.4 * accel)
      const pull = easeInCubic(clamp01((elapsed - 620) / 400))

      ctx.fillStyle = 'rgba(5,5,5,0.35)' // motion-blur trail fade
      ctx.fillRect(0, 0, width, height)

      const R = planetR()
      const back: [number, number, number, OrbitStar][] = []
      const front: [number, number, number, OrbitStar][] = []

      for (const s of orbitStars) {
        const r = s.shell * (1 - 0.6 * pull) * R
        const a = s.theta + rot * s.speed
        const x = r * Math.sin(s.phi) * Math.cos(a)
        let y = r * Math.cos(s.phi)
        let z = r * Math.sin(s.phi) * Math.sin(a)
        // Tilt the whole system around X for a 3/4 view.
        const y2 = y * Math.cos(TILT) - z * Math.sin(TILT)
        const z2 = y * Math.sin(TILT) + z * Math.cos(TILT)
        y = y2
        z = z2
        const [px, py, sc] = project(x, y, z)
        ;(z > 0 ? back : front).push([px, py, sc, s])
      }

      const paint = (
        list: [number, number, number, OrbitStar][],
        dim: number,
      ) => {
        for (const [px, py, sc, s] of list) {
          ctx.globalAlpha = (0.25 + 0.75 * clamp01(sc)) * dim
          ctx.fillStyle = s.accent ? ACCENT : STAR
          ctx.beginPath()
          ctx.arc(px, py, s.size * sc, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      paint(back, 0.35)
      drawPlanet()
      paint(front, 1)
    }

    const bangFrame = (elapsed: number) => {
      const p = clamp01(elapsed / ENTER_MS)

      ctx.fillStyle = 'rgba(5,5,5,0.22)' // longer trails for the blast
      ctx.fillRect(0, 0, width, height)

      const maxD = Math.hypot(width, height) * 0.75
      for (const s of bangStars) {
        const lp = clamp01((p - s.delay) / (1 - s.delay))
        if (lp <= 0) continue
        const d = easeOutExpo(lp) * maxD
        const [px, py, sc] = project(s.dx * d, s.dy * d, -s.dz * d)
        if (s.live) {
          ctx.strokeStyle = s.accent ? ACCENT : STAR
          ctx.globalAlpha = (1 - lp * 0.55) * clamp01(sc)
          ctx.lineWidth = s.size * sc
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(s.px, s.py)
          ctx.lineTo(px, py)
          ctx.stroke()
        }
        s.px = px
        s.py = py
        s.ps = sc
        s.live = true
      }
      ctx.globalAlpha = 1

      // Dissolve the veil once the blast fills the screen.
      const veil = 1 - easeInOut(clamp01((elapsed - 700) / 600))
      wrap.style.opacity = String(veil)

      if (elapsed >= ENTER_MS + 100) {
        mode = 'idle'
        wrap.style.display = 'none'
      }
    }

    const exitFrame = (elapsed: number, dt: number) => {
      // The veil (page → black) rises first, stars are already in motion
      // underneath it.
      wrap.style.opacity = String(easeInOut(clamp01(elapsed / EXIT_FADE_MS)))
      orbitFrame(elapsed, dt)
      if (!pushed && elapsed >= EXIT_PUSH_MS) {
        pushed = true
        router.push(pendingHref)
      }
    }

    const loop = (now: number) => {
      const dt = Math.min(now - last, 50)
      last = now
      const elapsed = now - modeStart
      if (mode === 'enter') bangFrame(elapsed)
      else if (mode === 'exit') exitFrame(elapsed, dt)
      raf = requestAnimationFrame(loop)
    }

    // Kick off the entrance big bang — the page mounts under an opaque veil.
    ctx.fillStyle = BLACK
    ctx.fillRect(0, 0, width, height)
    raf = requestAnimationFrame(loop)

    engineRef.current = {
      exitTo(href: string) {
        if (mode === 'exit') return true
        pendingHref = href
        pushed = false
        rot = 0
        mode = 'exit'
        modeStart = performance.now()
        wrap.style.display = 'block'
        wrap.style.opacity = '0'
        ctx.clearRect(0, 0, width, height)
        return true
      },
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      engineRef.current = null
    }
  }, [router])

  useImperativeHandle(ref, () => ({
    exitTo(href: string) {
      return engineRef.current?.exitTo(href) ?? false
    },
  }))

  return (
    <div
      ref={wrapRef}
      className="cs-veil fixed inset-0 z-[100] pointer-events-none"
      style={{ background: BLACK }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <style>{`
        /* No-JS fallback: the veil clears on its own so the page is never
           stuck behind black. JS cancels this and drives the veil itself. */
        .cs-veil {
          animation: cs-veil-hide 0.6s ease 1.8s forwards;
        }
        @keyframes cs-veil-hide {
          to { opacity: 0; visibility: hidden; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-veil { display: none; }
        }
      `}</style>
    </div>
  )
}
