/**
 * AsciiFluid — Canvas 2D ASCII heat map simulation.
 * No WebGL required.
 *
 * A grid of ASCII characters reacts to mouse/touch:
 * - Characters heat up under the cursor (denser symbols, accent color)
 * - Heat dissipates outward via Gaussian falloff
 * - Heat cools over time (* 0.95 per frame)
 */

// Light → dense
const CHARS = ['.', ',', '-', '~', ':', ';', '=', '!', '*', '#', '@'] as const

// #c8ff00 — accent hot
const HOT = { r: 200, g: 255, b: 0 }
// rgba(240,237,232,0.15) — default cool
const COOL = { r: 240, g: 237, b: 232, a: 0.15 }

// ─── AsciiFluid ───────────────────────────────────────────────────────────────

export class AsciiFluid {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D

  private raf = 0
  private destroyed = false

  // Grid dimensions (in cells)
  private cols = 0
  private rows = 0
  // Cell size in canvas buffer pixels
  private cellW = 0
  private cellH = 0
  // Heat map [0,1] per cell, row-major
  private heat: Float32Array = new Float32Array(0)

  // Mouse position in canvas buffer pixels (-1 = outside)
  private mouseX = -1
  private mouseY = -1

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.resize()
    this.bindEvents()
    this.loop()
  }

  // ─── Setup ────────────────────────────────────────────────────────────────

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    // CSS font size — scale to buffer pixels
    const cssFontSize = this.canvas.clientWidth < 768 ? 12 : 14
    const fontSize = Math.round(cssFontSize * dpr)

    // Measure true monospace advance width once
    this.ctx.font = `${fontSize}px "JetBrains Mono", monospace`
    const measured = this.ctx.measureText('M').width
    this.cellW = measured > 0 ? measured : fontSize * 0.6
    this.cellH = fontSize * 1.2

    const newCols = Math.max(1, Math.floor(this.canvas.width / this.cellW))
    const newRows = Math.max(1, Math.floor(this.canvas.height / this.cellH))

    if (newCols !== this.cols || newRows !== this.rows) {
      this.cols = newCols
      this.rows = newRows
      this.heat = new Float32Array(this.cols * this.rows)
    }
  }

  // ─── Heat ─────────────────────────────────────────────────────────────────

  /** Add a Gaussian heat blob centered at canvas-buffer coords (bx, by). */
  private addHeat(bx: number, by: number) {
    const cx = bx / this.cellW
    const cy = by / this.cellH
    const radius = 5 // cells
    const sigma2 = (radius * 0.45) ** 2

    const x0 = Math.max(0, Math.floor(cx - radius))
    const x1 = Math.min(this.cols - 1, Math.ceil(cx + radius))
    const y0 = Math.max(0, Math.floor(cy - radius))
    const y1 = Math.min(this.rows - 1, Math.ceil(cy + radius))

    for (let row = y0; row <= y1; row++) {
      for (let col = x0; col <= x1; col++) {
        const dx = col - cx
        const dy = row - cy
        const h = Math.exp(-(dx * dx + dy * dy) / (2 * sigma2))
        const idx = row * this.cols + col
        this.heat[idx] = Math.min(1, this.heat[idx] + h)
      }
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  private draw() {
    const { ctx, canvas, heat, cols, rows, cellW, cellH } = this
    const w = canvas.width
    const h = canvas.height
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const fontSize = Math.round((canvas.clientWidth < 768 ? 12 : 14) * dpr)

    // Background
    ctx.fillStyle = '#050505'
    ctx.fillRect(0, 0, w, h)

    // Cool all cells
    for (let i = 0; i < heat.length; i++) {
      heat[i] *= 0.95
    }

    // Apply mouse heat
    if (this.mouseX >= 0) {
      this.addHeat(this.mouseX, this.mouseY)
    }

    // Draw chars
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`
    ctx.textBaseline = 'top'

    let lastStyle = ''

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const t = heat[row * cols + col]

        // Pick character based on heat density
        const charIdx = Math.min(CHARS.length - 1, Math.floor(t * CHARS.length))
        const char = CHARS[charIdx]

        // Interpolate color: COOL → HOT
        const r = Math.round(COOL.r + t * (HOT.r - COOL.r))
        const g = Math.round(COOL.g + t * (HOT.g - COOL.g))
        const b = Math.round(COOL.b + t * (HOT.b - COOL.b))
        const a = COOL.a + t * (1 - COOL.a)
        const style = `rgba(${r},${g},${b},${a.toFixed(2)})`

        if (style !== lastStyle) {
          ctx.fillStyle = style
          lastStyle = style
        }

        ctx.fillText(char, col * cellW, row * cellH)
      }
    }
  }

  // ─── Loop ─────────────────────────────────────────────────────────────────

  private loop = () => {
    if (this.destroyed) return

    // Resize if canvas dimensions changed
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cw = Math.round(this.canvas.clientWidth * dpr)
    const ch = Math.round(this.canvas.clientHeight * dpr)
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw
      this.canvas.height = ch
      this.resize()
    }

    this.draw()
    this.raf = requestAnimationFrame(this.loop)
  }

  // ─── Coordinates ──────────────────────────────────────────────────────────

  private toBufferCoords(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
    }
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  private onMouseMove = (e: MouseEvent) => {
    const p = this.toBufferCoords(e.clientX, e.clientY)
    this.mouseX = p.x
    this.mouseY = p.y
  }

  private onMouseLeave = () => {
    this.mouseX = -1
    this.mouseY = -1
  }

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]
    const p = this.toBufferCoords(t.clientX, t.clientY)
    this.mouseX = p.x
    this.mouseY = p.y
  }

  private onTouchEnd = () => {
    this.mouseX = -1
    this.mouseY = -1
  }

  private bindEvents() {
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    this.canvas.addEventListener('mouseleave', this.onMouseLeave)
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this.onTouchEnd)
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave)
    this.canvas.removeEventListener('touchmove', this.onTouchMove)
    this.canvas.removeEventListener('touchend', this.onTouchEnd)
  }
}
