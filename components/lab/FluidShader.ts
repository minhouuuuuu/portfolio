/**
 * FluidShader — raw WebGL fluid simulation (no Three.js).
 *
 * Architecture:
 *  - Two ping-pong framebuffer pairs: one for velocity, one for density/color.
 *  - Per-frame passes: splat → advect velocity → curl force → advect density → render.
 *  - Mouse/touch events inject velocity splats at interaction points.
 *  - HALF_FLOAT textures used when available for better precision at no cost.
 *
 * Color palette: #050505 base · #c8ff00 acid green · #7b61ff electric violet
 */

// ─── GLSL source strings ──────────────────────────────────────────────────────

const VERT_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const ADVECT_FRAG = `
precision highp float;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexelSize;
uniform float uDt;
uniform float uDissipation;
varying vec2 vUv;
void main(){
  vec2 pos = vUv - uDt * uTexelSize * texture2D(uVelocity, vUv).xy;
  gl_FragColor = uDissipation * texture2D(uSource, pos);
}
`

const SPLAT_FRAG = `
precision highp float;
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec2 uVelocity;
uniform float uRadius;
uniform vec4 uColor;
uniform bool uIsVelocity;
uniform vec2 uAspect; // (aspectRatio, 1.0)
varying vec2 vUv;
void main(){
  vec2 p = vUv - uPoint;
  p.x *= uAspect.x;
  float splat = exp(-dot(p, p) / uRadius);
  vec4 base = texture2D(uTarget, vUv);
  if(uIsVelocity){
    gl_FragColor = base + vec4(uVelocity * splat, 0.0, 1.0);
  } else {
    gl_FragColor = base + splat * uColor;
  }
}
`

const CURL_FRAG = `
precision highp float;
uniform sampler2D uVelocity;
uniform vec2 uTexelSize;
varying vec2 vUv;
void main(){
  float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).y;
  float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).y;
  float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).x;
  float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 + 0.5 * vorticity, 0.0, 0.0, 1.0);
}
`

const VORTICITY_FRAG = `
precision highp float;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexelSize;
uniform float uCurlStrength;
uniform float uDt;
varying vec2 vUv;
void main(){
  float L = texture2D(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x;
  float R = texture2D(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x;
  float T = texture2D(uCurl, vUv + vec2(0.0, uTexelSize.y)).x;
  float B = texture2D(uCurl, vUv - vec2(0.0, uTexelSize.y)).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  float len = max(length(force), 0.0001);
  force = force / len * uCurlStrength * C;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  gl_FragColor = vec4(vel + force * uDt, 0.0, 1.0);
}
`

const RENDER_FRAG = `
precision highp float;
uniform sampler2D uDensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorBg;
varying vec2 vUv;
void main(){
  vec4 d = texture2D(uDensity, vUv);
  float brightness = dot(d.rgb, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(uColorBg, mix(uColorA, uColorB, d.b / (d.r + 0.001)), brightness);
  gl_FragColor = vec4(col, 1.0);
}
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  return shader
}

function createProgram(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string) {
  const prog = gl.createProgram()!
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vertSrc))
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fragSrc))
  gl.linkProgram(prog)
  return prog
}

interface FBO {
  texture: WebGLTexture
  fbo: WebGLFramebuffer
  width: number
  height: number
}

interface DoubleFBO {
  read: FBO
  write: FBO
  swap: () => void
}

function createFBO(
  gl: WebGLRenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
): FBO {
  const texture = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null)

  const fbo = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return { texture, fbo, width: w, height: h }
}

function createDoubleFBO(
  gl: WebGLRenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
): DoubleFBO {
  let read = createFBO(gl, w, h, internalFormat, format, type)
  let write = createFBO(gl, w, h, internalFormat, format, type)
  return {
    get read() { return read },
    get write() { return write },
    swap() { [read, write] = [write, read] },
  }
}

// ─── FluidShader class ────────────────────────────────────────────────────────

export class FluidShader {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private raf = 0
  private destroyed = false

  // Programs
  private advectProg!: WebGLProgram
  private splatProg!: WebGLProgram
  private curlProg!: WebGLProgram
  private vorticityProg!: WebGLProgram
  private renderProg!: WebGLProgram

  // Geometry
  private quadVAO!: WebGLBuffer

  // Framebuffers
  private velocity!: DoubleFBO
  private density!: DoubleFBO
  private curlFBO!: FBO

  // Texture params
  private halfFloat!: number
  private simWidth = 0
  private simHeight = 0

  // Interaction state
  private mouse = { x: 0, y: 0, dx: 0, dy: 0, down: false }
  private lastMouse = { x: 0, y: 0 }
  private splatQueue: Array<{ x: number; y: number; dx: number; dy: number }> = []

  // Colors
  private readonly PALETTE = [
    [200 / 255, 255 / 255, 0 / 255],   // acid green
    [123 / 255, 97 / 255, 255 / 255],  // electric violet
    [255 / 255, 107 / 255, 53 / 255],  // accent orange
  ]

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    // Ensure canvas has a valid pixel size before requesting a WebGL context
    if (canvas.width === 0 || canvas.height === 0) {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(Math.round(rect.width * dpr), 2)
      canvas.height = Math.max(Math.round(rect.height * dpr), 2)
    }

    const gl =
      (canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null) ??
      (canvas.getContext('experimental-webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
      }) as WebGLRenderingContext | null)

    if (!gl) {
      // Graceful degradation — paint a static fallback and exit
      this.gl = null as unknown as WebGLRenderingContext
      this.paintFallback()
      return
    }
    this.gl = gl

    this.initGL()
    this.initFBOs()
    this.bindEvents()
    this.loop()
  }

  private paintFallback() {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return
    const { width: w, height: h } = this.canvas
    ctx.fillStyle = '#050505'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(200,255,0,0.15)'
    ctx.font = `${Math.round(h * 0.03)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('WebGL unavailable — try a different browser', w / 2, h / 2)
  }

  private initGL() {
    if (!this.gl) return
    const gl = this.gl

    // Check HALF_FLOAT support
    const ext = gl.getExtension('OES_texture_half_float')
    this.halfFloat = ext ? (ext as OES_texture_half_float).HALF_FLOAT_OES : gl.FLOAT

    // Fullscreen quad
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    this.quadVAO = buf

    // Programs
    this.advectProg = createProgram(gl, VERT_SRC, ADVECT_FRAG)
    this.splatProg = createProgram(gl, VERT_SRC, SPLAT_FRAG)
    this.curlProg = createProgram(gl, VERT_SRC, CURL_FRAG)
    this.vorticityProg = createProgram(gl, VERT_SRC, VORTICITY_FRAG)
    this.renderProg = createProgram(gl, VERT_SRC, RENDER_FRAG)
  }

  private initFBOs() {
    if (!this.gl) return
    const gl = this.gl
    const dpr = Math.min(window.devicePixelRatio, 2)
    const isMobile = window.innerWidth < 768

    // Sim resolution: half canvas size is fine for fluid
    this.simWidth = Math.floor(this.canvas.width / (isMobile ? 4 : 2))
    this.simHeight = Math.floor(this.canvas.height / (isMobile ? 4 : 2))

    const fmt = gl.RGBA
    const type = this.halfFloat

    this.velocity = createDoubleFBO(gl, this.simWidth, this.simHeight, fmt, fmt, type)
    this.density = createDoubleFBO(gl, this.simWidth, this.simHeight, fmt, fmt, type)
    this.curlFBO = createFBO(gl, this.simWidth, this.simHeight, fmt, fmt, type)
  }

  private getAttr(prog: WebGLProgram, name: string) {
    return this.gl.getAttribLocation(prog, name)
  }
  private getUniform(prog: WebGLProgram, name: string) {
    return this.gl.getUniformLocation(prog, name)
  }

  private bindQuad(prog: WebGLProgram) {
    const gl = this.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVAO)
    const loc = this.getAttr(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  }

  private blit(target: WebGLFramebuffer | null, w?: number, h?: number) {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, target)
    gl.viewport(0, 0, w ?? gl.drawingBufferWidth, h ?? gl.drawingBufferHeight)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private bindTexture(unit: number, texture: WebGLTexture) {
    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
  }

  private doSplat(x: number, y: number, dx: number, dy: number) {
    if (!this.gl) return
    const gl = this.gl
    const sw = this.simWidth
    const sh = this.simHeight
    const aspect = this.canvas.width / this.canvas.height
    const radius = 0.004

    // Velocity splat
    gl.useProgram(this.splatProg)
    this.bindQuad(this.splatProg)
    this.bindTexture(0, this.velocity.read.texture)
    gl.uniform1i(this.getUniform(this.splatProg, 'uTarget'), 0)
    gl.uniform1i(this.getUniform(this.splatProg, 'uIsVelocity'), 1)
    gl.uniform2f(this.getUniform(this.splatProg, 'uPoint'), x, y)
    gl.uniform2f(this.getUniform(this.splatProg, 'uVelocity'), dx * 800, dy * 800)
    gl.uniform1f(this.getUniform(this.splatProg, 'uRadius'), radius)
    gl.uniform2f(this.getUniform(this.splatProg, 'uAspect'), aspect, 1.0)
    gl.uniform4f(this.getUniform(this.splatProg, 'uColor'), 0, 0, 0, 0)
    this.blit(this.velocity.write.fbo, sw, sh)
    this.velocity.swap()

    // Color splat
    // Pick color from palette based on position
    const colorIdx = Math.floor((x + y) * this.PALETTE.length) % this.PALETTE.length
    const [r, g, b] = this.PALETTE[colorIdx]
    this.bindTexture(0, this.density.read.texture)
    gl.uniform1i(this.getUniform(this.splatProg, 'uTarget'), 0)
    gl.uniform1i(this.getUniform(this.splatProg, 'uIsVelocity'), 0)
    gl.uniform1f(this.getUniform(this.splatProg, 'uRadius'), radius * 1.5)
    gl.uniform4f(this.getUniform(this.splatProg, 'uColor'), r, g, b, 1.0)
    this.blit(this.density.write.fbo, sw, sh)
    this.density.swap()
  }

  private step(dt: number) {
    if (!this.gl) return
    const gl = this.gl
    const sw = this.simWidth
    const sh = this.simHeight
    const tx = 1 / sw
    const ty = 1 / sh

    // Process splat queue
    for (const s of this.splatQueue) {
      this.doSplat(s.x, s.y, s.dx, s.dy)
    }
    this.splatQueue = []

    // Curl
    gl.useProgram(this.curlProg)
    this.bindQuad(this.curlProg)
    this.bindTexture(0, this.velocity.read.texture)
    gl.uniform1i(this.getUniform(this.curlProg, 'uVelocity'), 0)
    gl.uniform2f(this.getUniform(this.curlProg, 'uTexelSize'), tx, ty)
    this.blit(this.curlFBO.fbo, sw, sh)

    // Vorticity confinement
    gl.useProgram(this.vorticityProg)
    this.bindQuad(this.vorticityProg)
    this.bindTexture(0, this.velocity.read.texture)
    this.bindTexture(1, this.curlFBO.texture)
    gl.uniform1i(this.getUniform(this.vorticityProg, 'uVelocity'), 0)
    gl.uniform1i(this.getUniform(this.vorticityProg, 'uCurl'), 1)
    gl.uniform2f(this.getUniform(this.vorticityProg, 'uTexelSize'), tx, ty)
    gl.uniform1f(this.getUniform(this.vorticityProg, 'uCurlStrength'), 30.0)
    gl.uniform1f(this.getUniform(this.vorticityProg, 'uDt'), dt)
    this.blit(this.velocity.write.fbo, sw, sh)
    this.velocity.swap()

    // Advect velocity
    gl.useProgram(this.advectProg)
    this.bindQuad(this.advectProg)
    this.bindTexture(0, this.velocity.read.texture)
    this.bindTexture(1, this.velocity.read.texture)
    gl.uniform1i(this.getUniform(this.advectProg, 'uVelocity'), 0)
    gl.uniform1i(this.getUniform(this.advectProg, 'uSource'), 1)
    gl.uniform2f(this.getUniform(this.advectProg, 'uTexelSize'), tx, ty)
    gl.uniform1f(this.getUniform(this.advectProg, 'uDt'), dt)
    gl.uniform1f(this.getUniform(this.advectProg, 'uDissipation'), 0.99)
    this.blit(this.velocity.write.fbo, sw, sh)
    this.velocity.swap()

    // Advect density
    this.bindTexture(0, this.velocity.read.texture)
    this.bindTexture(1, this.density.read.texture)
    gl.uniform1i(this.getUniform(this.advectProg, 'uVelocity'), 0)
    gl.uniform1i(this.getUniform(this.advectProg, 'uSource'), 1)
    gl.uniform1f(this.getUniform(this.advectProg, 'uDissipation'), 0.97)
    this.blit(this.density.write.fbo, sw, sh)
    this.density.swap()
  }

  private render() {
    if (!this.gl) return
    const gl = this.gl
    gl.useProgram(this.renderProg)
    this.bindQuad(this.renderProg)
    this.bindTexture(0, this.density.read.texture)
    gl.uniform1i(this.getUniform(this.renderProg, 'uDensity'), 0)
    // bg = #050505
    gl.uniform3f(this.getUniform(this.renderProg, 'uColorBg'), 5 / 255, 5 / 255, 5 / 255)
    // A = acid green, B = violet
    gl.uniform3f(this.getUniform(this.renderProg, 'uColorA'), 200 / 255, 255 / 255, 0)
    gl.uniform3f(this.getUniform(this.renderProg, 'uColorB'), 123 / 255, 97 / 255, 255 / 255)
    this.blit(null, gl.drawingBufferWidth, gl.drawingBufferHeight)
  }

  private lastTime = 0
  private loop = (t = 0) => {
    if (this.destroyed || !this.gl) return
    const dt = Math.min((t - this.lastTime) / 1000, 0.016)
    this.lastTime = t

    // Resize if needed
    const cw = this.canvas.clientWidth * Math.min(window.devicePixelRatio, 2)
    const ch = this.canvas.clientHeight * Math.min(window.devicePixelRatio, 2)
    if (
      Math.abs(this.canvas.width - cw) > 1 ||
      Math.abs(this.canvas.height - ch) > 1
    ) {
      this.canvas.width = cw
      this.canvas.height = ch
      this.initFBOs()
    }

    this.step(dt)
    this.render()
    this.raf = requestAnimationFrame(this.loop)
  }

  // ─── Event handlers ─────────────────────────────────────────────────────────

  private getPos(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / rect.width,
      y: 1 - (clientY - rect.top) / rect.height,
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    const { x, y } = this.getPos(e.clientX, e.clientY)
    const dx = x - this.lastMouse.x
    const dy = y - this.lastMouse.y
    this.lastMouse = { x, y }
    if (Math.abs(dx) + Math.abs(dy) < 0.0001) return
    this.splatQueue.push({ x, y, dx, dy })
  }

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const { x, y } = this.getPos(touch.clientX, touch.clientY)
    const dx = x - this.lastMouse.x
    const dy = y - this.lastMouse.y
    this.lastMouse = { x, y }
    if (Math.abs(dx) + Math.abs(dy) < 0.0001) return
    this.splatQueue.push({ x, y, dx, dy })
  }

  private onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    const { x, y } = this.getPos(touch.clientX, touch.clientY)
    this.lastMouse = { x, y }
    if (typeof navigator.vibrate === 'function') navigator.vibrate(50)
  }

  private onTouchEnd = () => {
    // re-enable scroll
  }

  private bindEvents() {
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: true })
    this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false })
    this.canvas.addEventListener('touchend', this.onTouchEnd)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    this.canvas.removeEventListener('touchstart', this.onTouchStart)
    this.canvas.removeEventListener('touchmove', this.onTouchMove)
    this.canvas.removeEventListener('touchend', this.onTouchEnd)
  }
}
