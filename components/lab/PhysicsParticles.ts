/**
 * PhysicsParticles — Matter.js physics + Canvas 2D rendering.
 *
 * 80 circular bodies labeled with tech names rain from the top, stack naturally.
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

// iOS 13+ DeviceMotionEvent with requestPermission
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
  private bodies: MatterNS.Body[] = []
  private bodyMeta: Map<MatterNS.Body, { label: string; color: string }> = new Map()
  private motionListener: ((e: DeviceMotionEvent) => void) | null = null
  private MatterLib: typeof MatterNS | null = null

  // ─── Drag state ─────────────────────────────────────────────────────────────
  private dragBody: MatterNS.Body | null = null
  // Velocity of the drag in canvas-buffer-pixel/frame (smoothed)
  private dragVelX = 0
  private dragVelY = 0
  // Previous drag position (buffer pixels)
  private dragPrevX = 0
  private dragPrevY = 0
  // Flag: did the pointer move significantly during this press?
  private wasDragging = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.init()
  }

  // ─── Convert client coords → canvas buffer coords ────────────────────────

  private toCanvas(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
    }
  }

  // ─── Find body under point (buffer coords) ───────────────────────────────

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

  // ─── Drag helpers ─────────────────────────────────────────────────────────

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
    // Smooth velocity with EMA
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
    // Throw — convert buffer-pixel velocity to physics velocity
    // Matter.js velocity is in pixels per physics step (~1/60 s)
    const scale = 0.65
    this.MatterLib.Body.setVelocity(body, {
      x: this.dragVelX * scale,
      y: this.dragVelY * scale,
    })
  }

  // ─── Explosion ────────────────────────────────────────────────────────────

  private explode(px: number, py: number) {
    const M = this.MatterLib
    if (!M) return
    const radius = 200
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

  // ─── Init ─────────────────────────────────────────────────────────────────

  private async init() {
    const Matter = await import('matter-js')
    this.MatterLib = Matter

    const { Engine, Runner, Bodies, World } = Matter

    const w = this.canvas.width
    const h = this.canvas.height

    this.engine = Engine.create({ gravity: { x: 0, y: 1.2 } })
    this.runner = Runner.create()

    // Walls
    const walls = [
      Bodies.rectangle(w / 2, h + 25, w + 100, 50, { isStatic: true }),
      Bodies.rectangle(-25, h / 2, 50, h * 2, { isStatic: true }),
      Bodies.rectangle(w + 25, h / 2, 50, h * 2, { isStatic: true }),
    ]
    World.add(this.engine.world, walls)

    // Bodies
    const count = 80
    const isMobile = window.innerWidth < 768
    const minR = isMobile ? 22 : 28
    const maxR = isMobile ? 38 : 48

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
    // ── Mouse ──────────────────────────────────────────────────────────────
    this.canvas.addEventListener('mousedown', this.onMouseDown)
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
    this.canvas.addEventListener('click', this.onClick)

    // ── Touch ──────────────────────────────────────────────────────────────
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false })
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this.onTouchEnd)
  }

  private unbindEvents() {
    this.canvas.removeEventListener('mousedown', this.onMouseDown)
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
    this.canvas.removeEventListener('click', this.onClick)
    this.canvas.removeEventListener('touchstart', this.onTouchStart)
    this.canvas.removeEventListener('touchmove', this.onTouchMove)
    this.canvas.removeEventListener('touchend', this.onTouchEnd)
  }

  // ─── Mouse handlers ───────────────────────────────────────────────────────

  private onMouseDown = (e: MouseEvent) => {
    const p = this.toCanvas(e.clientX, e.clientY)
    this.wasDragging = false
    this.startDrag(p.x, p.y)
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragBody) return
    const p = this.toCanvas(e.clientX, e.clientY)
    this.moveDrag(p.x, p.y)
  }

  private onMouseUp = () => {
    this.endDrag()
  }

  private onClick = (e: MouseEvent) => {
    // Only explode if this was a genuine tap (no significant drag)
    if (this.wasDragging) return
    const p = this.toCanvas(e.clientX, e.clientY)
    // Only explode if no body was grabbed (click on empty space)
    if (!this.bodyAt(p.x, p.y)) {
      this.explode(p.x, p.y)
    }
  }

  // ─── Touch handlers ───────────────────────────────────────────────────────

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]
    const p = this.toCanvas(t.clientX, t.clientY)
    this.wasDragging = false
    if (this.bodyAt(p.x, p.y)) {
      this.startDrag(p.x, p.y)
    } else {
      // Tap on empty space → explode
      this.explode(p.x, p.y)
      if (typeof navigator.vibrate === 'function') navigator.vibrate(50)
    }
  }

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    if (!this.dragBody) return
    const t = e.touches[0]
    const p = this.toCanvas(t.clientX, t.clientY)
    this.moveDrag(p.x, p.y)
  }

  private onTouchEnd = () => {
    this.endDrag()
  }

  // ─── Device motion ────────────────────────────────────────────────────────

  private setupDeviceMotion() {
    if (typeof window === 'undefined') return
    const isMobile = /Mobi|Android/i.test(navigator.userAgent)
    if (!isMobile || !window.DeviceMotionEvent) return

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
    if (this.destroyed) return
    this.raf = requestAnimationFrame(this.drawLoop)
    this.draw()
  }

  private draw() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    const dpr = window.devicePixelRatio || 1

    ctx.fillStyle = '#050505'
    ctx.fillRect(0, 0, w, h)

    const fontSize = Math.round(10 * dpr)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`

    for (const body of this.bodies) {
      if (body.isStatic && !this.bodyMeta.has(body)) continue
      const meta = this.bodyMeta.get(body)
      if (!meta) continue
      const { x, y } = body.position
      const r = (body as MatterNS.Body & { circleRadius: number }).circleRadius

      const isDragged = body === this.dragBody

      // Circle fill
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = meta.color + (isDragged ? '40' : '26')
      ctx.fill()

      // Circle stroke — brighter when dragged
      ctx.strokeStyle = meta.color + (isDragged ? 'cc' : '66')
      ctx.lineWidth = isDragged ? 2.5 : 1.5
      ctx.stroke()

      // Label
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

    // Draw drag indicator: line from grab center to particle center
    if (this.dragBody) {
      const { x, y } = this.dragBody.position
      ctx.beginPath()
      ctx.moveTo(this.dragPrevX, this.dragPrevY)
      ctx.lineTo(x, y)
      ctx.strokeStyle = 'rgba(200,255,0,0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
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
