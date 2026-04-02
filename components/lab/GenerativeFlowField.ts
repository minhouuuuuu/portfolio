/**
 * GenerativeFlowField — Canvas 2D flow field using simplex noise.
 *
 * 3000 particles follow noise-guided vector field, leaving thin trails.
 * Result: organic, painterly lines accumulating over time.
 *
 * Mobile bonus: long press (500ms) → Web Share API (PNG) or direct download.
 */

interface Particle {
  x: number
  y: number
  speed: number
  life: number
  maxLife: number
}

// ─── GenerativeFlowField class ────────────────────────────────────────────────

export class GenerativeFlowField {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private raf = 0
  private destroyed = false

  private particles: Particle[] = []
  private noiseSeed = Math.random() * 10000
  private noiseTime = 0

  private simplex!: { noise3D: (x: number, y: number, z: number) => number }

  // Long-press
  private longPressTimer: ReturnType<typeof setTimeout> | null = null

  // Callbacks
  private onFirstInteraction?: () => void
  private hasInteracted = false

  constructor(canvas: HTMLCanvasElement, onFirstInteraction?: () => void) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.onFirstInteraction = onFirstInteraction
    this.init()
  }

  private async init() {
    // Dynamic import — only loaded on demand
    const { createNoise3D } = await import('simplex-noise')
    this.simplex = { noise3D: createNoise3D(() => this.noiseSeed) }

    if (this.destroyed) return

    this.spawnParticles()
    this.clearCanvas()
    this.bindEvents()
    this.loop()
  }

  private spawnParticles() {
    const isMobile = window.innerWidth < 768
    // detect-gpu particle reduction is handled in LabSection before init
    const count = isMobile ? 1800 : 3000
    this.particles = Array.from({ length: count }, () => this.makeParticle())
  }

  private makeParticle(): Particle {
    const w = this.canvas.width
    const h = this.canvas.height
    const maxLife = 120 + Math.random() * 200
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 0.8 + Math.random() * 1.4,
      life: Math.random() * maxLife,
      maxLife,
    }
  }

  private clearCanvas() {
    this.ctx.fillStyle = '#050505'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private loop = () => {
    if (this.destroyed) return
    this.raf = requestAnimationFrame(this.loop)
    this.tick()
  }

  private tick() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height

    // Thin dark veil each frame creates trail fade-out
    ctx.fillStyle = 'rgba(5, 5, 5, 0.015)'
    ctx.fillRect(0, 0, w, h)

    this.noiseTime += 0.0004

    ctx.strokeStyle = 'rgba(240, 237, 232, 0.45)'
    ctx.lineWidth = 0.9

    for (const p of this.particles) {
      // Noise angle at particle position
      const nx = p.x / w * 3
      const ny = p.y / h * 3
      const angle =
        this.simplex.noise3D(nx + this.noiseSeed, ny, this.noiseTime) * Math.PI * 2

      const vx = Math.cos(angle) * p.speed
      const vy = Math.sin(angle) * p.speed

      const nx2 = p.x + vx
      const ny2 = p.y + vy

      // Alpha fades at end of life
      const lifeFrac = p.life / p.maxLife
      const alpha = Math.sin(lifeFrac * Math.PI) * 0.45

      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(nx2, ny2)
      ctx.globalAlpha = alpha
      ctx.stroke()
      ctx.globalAlpha = 1

      p.x = nx2
      p.y = ny2
      p.life++

      // Reset particle when it dies or leaves canvas
      if (
        p.life >= p.maxLife ||
        p.x < 0 || p.x > w ||
        p.y < 0 || p.y > h
      ) {
        const fresh = this.makeParticle()
        p.x = fresh.x
        p.y = fresh.y
        p.life = 0
        p.maxLife = fresh.maxLife
        p.speed = fresh.speed
      }
    }
  }

  regenerate() {
    this.noiseSeed = Math.random() * 10000
    this.noiseTime = 0
    if (this.simplex) {
      import('simplex-noise').then(({ createNoise3D }) => {
        this.simplex = { noise3D: createNoise3D(() => this.noiseSeed) }
      })
    }
    this.clearCanvas()
    this.spawnParticles()
    this.triggerInteraction()
  }

  private triggerInteraction() {
    if (!this.hasInteracted) {
      this.hasInteracted = true
      this.onFirstInteraction?.()
    }
  }

  private async shareOrDownload() {
    const timestamp = Date.now()
    const filename = `artwork-${timestamp}.png`

    this.canvas.toBlob(async (blob) => {
      if (!blob) return

      if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename, { type: 'image/png' })] })) {
        const file = new File([blob], filename, { type: 'image/png' })
        try {
          await navigator.share({ files: [file], title: 'Generative Artwork' })
          return
        } catch {
          // Fall through to download
        }
      }

      // Fallback: direct download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  private bindEvents() {
    const canvas = this.canvas

    // Mouse move — trigger hint dismissal
    canvas.addEventListener('mousemove', this.onInteract, { once: true })
    canvas.addEventListener('touchstart', this.onInteract, { once: true })

    // Long press for share (mobile)
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: true })
    canvas.addEventListener('touchend', this.onTouchEnd)
    canvas.addEventListener('touchcancel', this.onTouchEnd)
  }

  private onInteract = () => {
    this.triggerInteraction()
  }

  private onTouchStart = () => {
    this.longPressTimer = setTimeout(() => {
      this.shareOrDownload()
    }, 500)
  }

  private onTouchEnd = () => {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.canvas.removeEventListener('mousemove', this.onInteract)
    this.canvas.removeEventListener('touchstart', this.onInteract)
    this.canvas.removeEventListener('touchstart', this.onTouchStart)
    this.canvas.removeEventListener('touchend', this.onTouchEnd)
    this.canvas.removeEventListener('touchcancel', this.onTouchEnd)
    if (this.longPressTimer !== null) clearTimeout(this.longPressTimer)
  }
}
