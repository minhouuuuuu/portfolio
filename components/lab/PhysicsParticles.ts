/**
 * PhysicsParticles — Matter.js physics + Canvas 2D rendering.
 *
 * World coordinates = CSS pixels (canvas.clientWidth / clientHeight).
 * The canvas 2D context is scaled by DPR before every draw so everything
 * maps 1:1. This decouples the physics world from the canvas buffer size,
 * which means ResizeObserver changes (address bar show/hide on mobile, etc.)
 * can never strand particles in mid-air.
 *
 * Drag to grab & throw particles. Click/tap on empty space to explode.
 * On mobile: DeviceMotionEvent maps device tilt to gravity direction.
 */

import type * as MatterNS from 'matter-js'

// ─── Constants ────────────────────────────────────────────────────────────────

const TECH_LABELS = [
  'REACT', 'NEXT.JS', 'GSAP', 'THREE.JS', 'TYPESCRIPT', 'TAILWIND',
  'FRAMER', 'LENIS', 'SUPABASE', 'NESTJS', 'FIGMA', 'WEBGL',
  'NODE.JS', 'VITE', 'PRISMA', 'ZUSTAND', 'RADIX', 'FRAMER',
]

const BODY_COLORS = ['#c8ff00', '#7b61ff', '#ff6b35']

interface DeviceMotionEventIOS extends EventTarget {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

// ─── PhysicsParticles class ───────────────────────────────────────────────────

export class PhysicsParticles {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine!: MatterNS.Engine
  private runner!: MatterNS.Runner
  private raf = 0
  private destroyed = false
  private paused = false
  private bodies: MatterNS.Body[] = []
  private bodyMeta: Map<MatterNS.Body, { label: string; color: string }> = new Map()
  private motionListener: ((e: DeviceMotionEvent) => void) | null = null
  private MatterLib: typeof MatterNS | null = null

  // Wall body refs for live repositioning on resize
  private wallFloor!: MatterNS.Body
  private wallLeft!: MatterNS.Body
  private wallRight!: MatterNS.Body

  // ─── Last known canvas dimensions (for draw-loop wall sync) ─────────────────
  private lastCssW = 0
  private lastCssH = 0

  // ─── Drag state (in CSS pixels) ─────────────────────────────────────────────
  private dragBody: MatterNS.Body | null = null
  private dragVelX = 0
  private dragVelY = 0
  private dragPrevX = 0
  private dragPrevY = 0
  private wasDragging = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.init()
  }

  // ─── CSS pixel helpers ────────────────────────────────────────────────────

  private get cssW() { return this.canvas.clientWidth || this.canvas.width }
  private get cssH() { return this.canvas.clientHeight || this.canvas.height }

  // ─── Convert client coords → CSS pixel world coords ──────────────────────

  private toWorld(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  // ─── Find body under point (CSS pixels) ──────────────────────────────────

  private bodyAt(px: number, py: number): MatterNS.Body | null {
    for (const body of this.bodies) {
      if (body.isStatic) continue
      const dx = body.position.x - px
      const dy = body.position.y - py
      const r = (body as MatterNS.Body & { circleRadius: number }).circleRadius
      if (dx * dx + dy * dy <= r * r) return body
    }
    return null
  }

  // ─── Drag helpers (CSS pixels) ────────────────────────────────────────────

  private startDrag(px: number, py: number) {
    const body = this.bodyAt(px, py)
    if (!body || !this.MatterLib) return
    this.dragBody = body
    this.dragVelX = 0
    this.dragVelY = 0
    this.dragPrevX = px
    this.dragPrevY = py
    this.wasDragging = false
    this.MatterLib.Body.setStatic(body, true)
    this.MatterLib.Body.setVelocity(body, { x: 0, y: 0 })
  }

  private moveDrag(px: number, py: number) {
    if (!this.dragBody || !this.MatterLib) return
    const alpha = 0.6
    this.dragVelX = alpha * (px - this.dragPrevX) + (1 - alpha) * this.dragVelX
    this.dragVelY = alpha * (py - this.dragPrevY) + (1 - alpha) * this.dragVelY
    this.dragPrevX = px
    this.dragPrevY = py
    this.wasDragging = true
    this.MatterLib.Body.setPosition(this.dragBody, { x: px, y: py })
  }

  private endDrag() {
    if (!this.dragBody || !this.MatterLib) return
    const body = this.dragBody
    this.dragBody = null
    this.MatterLib.Body.setStatic(body, false)
    this.MatterLib.Body.setVelocity(body, {
      x: this.dragVelX * 0.65,
      y: this.dragVelY * 0.65,
    })
  }

  // ─── Explosion (CSS pixels) ───────────────────────────────────────────────

  private explode(px: number, py: number) {
    const M = this.MatterLib
    if (!M) return
    const radius = 150
    for (const body of this.bodies) {
      if (body.isStatic) continue
      const dx = body.position.x - px
      const dy = body.position.y - py
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < radius) {
        const strength = (1 - dist / radius) * 0.06
        const dir = M.Vector.normalise({ x: dx, y: dy })
        M.Body.applyForce(body, body.position, {
          x: dir.x * strength + (Math.random() - 0.5) * 0.01,
          y: dir.y * strength + (Math.random() - 0.5) * 0.01,
        })
      }
    }
  }

  // ─── Resize walls to current CSS dimensions ───────────────────────────────

  private updateWalls() {
    const M = this.MatterLib
    if (!M || !this.wallFloor) return
    const w = this.cssW
    const h = this.cssH
    // Extra margin so particles don't escape during address-bar animations
    M.Body.setPosition(this.wallFloor, { x: w / 2, y: h + 30 })
    M.Body.setPosition(this.wallLeft,  { x: -30,   y: h / 2 })
    M.Body.setPosition(this.wallRight, { x: w + 30, y: h / 2 })
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  private async init() {
    const Matter = await import('matter-js')
    this.MatterLib = Matter

    const { Engine, Runner, Bodies, World } = Matter

    const w = this.cssW
    const h = this.cssH

    const isMobileGravity = window.innerWidth < 768
    this.engine = Engine.create({ gravity: { x: 0, y: isMobileGravity ? 3 : 1.2 } })
    this.runner = Runner.create()

    // Walls — thick enough that fast bodies don't tunnel through
    this.wallFloor = Bodies.rectangle(w / 2, h + 30, w + 200, 60, { isStatic: true })
    this.wallLeft  = Bodies.rectangle(-30,   h / 2, 60, h * 4, { isStatic: true })
    this.wallRight = Bodies.rectangle(w + 30, h / 2, 60, h * 4, { isStatic: true })
    World.add(this.engine.world, [this.wallFloor, this.wallLeft, this.wallRight])

    // Particle bodies
    const isMobile = window.innerWidth < 768
    const minR = isMobile ? 18 : 24
    const maxR = isMobile ? 30 : 40
    const count = isMobile ? 40 : 80

    for (let i = 0; i < count; i++) {
      const radius = minR + Math.random() * (maxR - minR)
      const x = 60 + Math.random() * (w - 120)
      const y = -50 - Math.random() * h * 1.5
      const body = Bodies.circle(x, y, radius, {
        restitution: 0.4,
        friction: 0.1,
        frictionAir: 0.01,
        density: 0.002,
      })
      this.bodyMeta.set(body, {
        label: TECH_LABELS[i % TECH_LABELS.length],
        color: BODY_COLORS[i % BODY_COLORS.length],
      })
      this.bodies.push(body)
    }
    World.add(this.engine.world, this.bodies)

    this.bindEvents()
    this.setupDeviceMotion()
    Runner.run(this.runner, this.engine)
    this.drawLoop()

    if (this.destroyed) {
      Runner.stop(this.runner)
      Engine.clear(this.engine)
    }
  }

  // ─── Event binding ────────────────────────────────────────────────────────

  private bindEvents() {
    this.canvas.addEventListener('mousedown', this.onMouseDown)
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
    this.canvas.addEventListener('click', this.onClick)

    this.canvas.addEventListener('touchstart',  this.onTouchStart,  { passive: false })
    this.canvas.addEventListener('touchmove',   this.onTouchMove,   { passive: false })
    this.canvas.addEventListener('touchend',    this.onTouchEnd)
    this.canvas.addEventListener('touchcancel', this.onTouchEnd)

    // Keep walls in sync when the canvas is resized
    this.resizeObserver = new ResizeObserver(this.onCanvasResize)
    this.resizeObserver.observe(this.canvas)
  }

  private resizeObserver!: ResizeObserver

  private onCanvasResize = () => {
    this.updateWalls()
  }

  private unbindEvents() {
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
    this.canvas.removeEventListener('click', this.onClick)

    this.canvas.removeEventListener('touchstart',  this.onTouchStart)
    this.canvas.removeEventListener('touchmove',   this.onTouchMove)
    this.canvas.removeEventListener('touchend',    this.onTouchEnd)
    this.canvas.removeEventListener('touchcancel', this.onTouchEnd)

    this.resizeObserver?.disconnect()
  }

  // ─── Mouse handlers ───────────────────────────────────────────────────────

  private onMouseDown = (e: MouseEvent) => {
    const p = this.toWorld(e.clientX, e.clientY)
    this.wasDragging = false
    this.startDrag(p.x, p.y)
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragBody) return
    const p = this.toWorld(e.clientX, e.clientY)
    this.moveDrag(p.x, p.y)
  }

  private onMouseUp = () => { this.endDrag() }

  private onClick = (e: MouseEvent) => {
    if (this.wasDragging) return
    const p = this.toWorld(e.clientX, e.clientY)
    if (!this.bodyAt(p.x, p.y)) this.explode(p.x, p.y)
  }

  // ─── Touch handlers ───────────────────────────────────────────────────────

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]
    const p = this.toWorld(t.clientX, t.clientY)
    this.wasDragging = false
    if (this.bodyAt(p.x, p.y)) {
      this.startDrag(p.x, p.y)
    } else {
      this.explode(p.x, p.y)
      if (typeof navigator.vibrate === 'function') navigator.vibrate(50)
    }
  }

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    if (!this.dragBody) return
    const t = e.touches[0]
    const p = this.toWorld(t.clientX, t.clientY)
    this.moveDrag(p.x, p.y)
  }

  private onTouchEnd = () => { this.endDrag() }

  // ─── Device motion ────────────────────────────────────────────────────────

  private setupDeviceMotion() {
    if (typeof window === 'undefined') return
    if (!/Mobi|Android/i.test(navigator.userAgent) || !window.DeviceMotionEvent) return

    const applyMotion = (e: DeviceMotionEvent) => {
      if (!e.accelerationIncludingGravity) return
      const gx = (e.accelerationIncludingGravity.x ?? 0) * 0.1
      const gy = (e.accelerationIncludingGravity.y ?? 0) * -0.1
      this.engine.gravity.x = Math.max(-3, Math.min(3, gx))
      this.engine.gravity.y = Math.max(-3, Math.min(3, gy))
    }

    const DME = DeviceMotionEvent as unknown as DeviceMotionEventIOS
    if (typeof DME.requestPermission === 'function') {
      this.motionListener = applyMotion
    } else {
      window.addEventListener('devicemotion', applyMotion)
      this.motionListener = applyMotion
    }
  }

  async enableGyro() {
    if (!this.motionListener) return
    const DME = DeviceMotionEvent as unknown as DeviceMotionEventIOS
    if (typeof DME.requestPermission === 'function') {
      const permission = await DME.requestPermission!()
      if (permission === 'granted') {
        window.addEventListener('devicemotion', this.motionListener)
      }
    }
  }

  // ─── Draw loop ────────────────────────────────────────────────────────────

  private drawLoop = () => {
    if (this.destroyed || this.paused) return
    this.raf = requestAnimationFrame(this.drawLoop)
    this.draw()
  }

  // ─── Pause / resume (off-screen idling) ──────────────────────────────────
  // Stops both the draw RAF and the Matter physics runner so nothing steps
  // while the Lab is scrolled out of view.

  pause() {
    if (this.paused) return
    this.paused = true
    cancelAnimationFrame(this.raf)
    if (this.MatterLib && this.runner) {
      this.MatterLib.Runner.stop(this.runner)
    }
  }

  resume() {
    if (!this.paused || this.destroyed) return
    this.paused = false
    if (this.MatterLib && this.runner && this.engine) {
      this.MatterLib.Runner.run(this.runner, this.engine)
    }
    this.raf = requestAnimationFrame(this.drawLoop)
  }

  private draw() {
    const ctx = this.ctx
    const dpr = window.devicePixelRatio || 1

    // Sync walls every frame — guards against ResizeObserver timing issues on
    // mobile (address-bar transitions, viewport unit recalculations, etc.)
    const cssW = this.cssW
    const cssH = this.cssH
    if (cssW !== this.lastCssW || cssH !== this.lastCssH) {
      this.lastCssW = cssW
      this.lastCssH = cssH
      this.updateWalls()
    }

    // Fill buffer
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.fillStyle = '#050505'
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Scale once — draw everything in CSS pixel (world) coordinates
    ctx.save()
    ctx.scale(dpr, dpr)

    const fontSize = 10
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`

    for (const body of this.bodies) {
      const meta = this.bodyMeta.get(body)
      if (!meta) continue
      const { x, y } = body.position
      const r = (body as MatterNS.Body & { circleRadius: number }).circleRadius
      const isDragged = body === this.dragBody

      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = meta.color + (isDragged ? '40' : '26')
      ctx.fill()

      ctx.strokeStyle = meta.color + (isDragged ? 'cc' : '66')
      ctx.lineWidth = isDragged ? 2 : 1.5
      ctx.stroke()

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(body.angle)
      ctx.fillStyle = '#f0ede8'
      const maxW = r * 1.6
      const textW = ctx.measureText(meta.label).width
      if (textW > maxW) ctx.scale(maxW / textW, maxW / textW)
      ctx.fillText(meta.label, 0, 0)
      ctx.restore()
    }

    // Drag tether
    if (this.dragBody) {
      const { x, y } = this.dragBody.position
      ctx.beginPath()
      ctx.moveTo(this.dragPrevX, this.dragPrevY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = 'rgba(200,255,0,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    ctx.restore()
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.unbindEvents()

    if (this.motionListener) {
      window.removeEventListener('devicemotion', this.motionListener)
    }

    if (this.MatterLib && this.runner && this.engine) {
      this.MatterLib.Runner.stop(this.runner)
      this.MatterLib.Engine.clear(this.engine)
      this.MatterLib.World.clear(this.engine.world, false)
    }
  }
}
