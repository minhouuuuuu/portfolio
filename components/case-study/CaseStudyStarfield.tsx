'use client'

import { useRef, useEffect } from 'react'

interface Star {
  x: number
  y: number
  z: number // depth 0.25 → 1 (far → near)
  r: number
  phase: number
  isAccent: boolean
}

// Lightweight canvas-2D starfield — echoes the spatial Three.js hero without
// paying for a WebGL context on a content page. Drifts slowly upward, twinkles,
// and parallaxes against the pointer by depth. Pauses off-screen / hidden tab
// and renders a single static frame under prefers-reduced-motion.
export function CaseStudyStarfield({ accent }: { accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const textColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--text')
        .trim() || '#f0ede8'

    let raf = 0
    let inView = true
    let pageVisible = !document.hidden
    let width = 0
    let height = 0
    let stars: Star[] = []
    const pointer = { x: 0, y: 0, cx: 0, cy: 0 } // target / current (eased)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.round(
        Math.min(160, Math.max(60, (width * height) / 9000)),
      )
      stars = Array.from({ length: count }, () => {
        const z = 0.25 + Math.random() * 0.75
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          r: 0.4 + z * 1.1,
          phase: Math.random() * Math.PI * 2,
          isAccent: Math.random() < 0.12,
        }
      })
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)
      // Ease pointer for a smooth, weighty parallax.
      pointer.cx += (pointer.x - pointer.cx) * 0.05
      pointer.cy += (pointer.y - pointer.cy) * 0.05

      for (const s of stars) {
        // Slow upward drift, wrapped — deeper stars move slower.
        const drift = (t * 0.006 * s.z) % height
        let y = s.y - drift
        if (y < -4) y += height + 8

        const px = s.x + pointer.cx * 26 * s.z
        const py = y + pointer.cy * 16 * s.z

        const twinkle = 0.65 + 0.35 * Math.sin(t * 0.0011 * s.z + s.phase)
        ctx.globalAlpha = (0.12 + 0.55 * s.z) * twinkle
        ctx.fillStyle = s.isAccent ? accent : textColor
        ctx.beginPath()
        ctx.arc(px, py, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const loop = (t: number) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (!raf && inView && pageVisible && !reduced) {
        raf = requestAnimationFrame(loop)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onVisibility = () => {
      pageVisible = !document.hidden
      if (pageVisible) start()
      else stop()
    }

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) start()
      else stop()
    })

    resize()

    if (reduced) {
      // Single static frame — no motion, no listeners beyond resize.
      draw(0)
    } else {
      io.observe(canvas)
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('visibilitychange', onVisibility)
      start()
    }
    window.addEventListener('resize', resize)

    return () => {
      stop()
      io.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', resize)
    }
  }, [accent])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden
    />
  )
}
