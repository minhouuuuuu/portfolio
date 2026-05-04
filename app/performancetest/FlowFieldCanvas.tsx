'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface FpsEntry {
  fps: number
  timestamp: number
  label: string
}

interface Props {
  onFpsUpdate: (fps: number) => void
}

export function FlowFieldCanvas({ onFpsUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let cleanupFn: (() => void) | null = null

    ;(async () => {
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        container.innerHTML =
          '<div style="color:rgba(200,180,255,0.4);font-family:monospace;font-size:11px;letter-spacing:0.15em;padding:32px;text-align:center;text-transform:uppercase">WebGPU not supported.<br/>Try Chrome 113+ or Edge 113+.</div>'
        return
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const THREE = (await import('three/webgpu')) as any
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tsl = (await import('three/tsl')) as any
        const {
          Fn, compute, instanceIndex, instancedArray, uniform, float, int,
          vec3, vec4, sin, cos, abs, floor, fract, mix, step, smoothstep,
          dot, normalize, hash, storage, If, attribute, Loop,
          pass, mrt, output, emissive,
        } = tsl
        const { bloom } = await import('three/addons/tsl/display/BloomNode.js' as string)

        if (disposed) return

        // ── Config ─────────────────────────────────────────────────────────
        const LINE_COUNT = 3072
        const TRAIL_LENGTH = 80
        const TOTAL_POINTS = LINE_COUNT * TRAIL_LENGTH
        const BOUNDS = 7.5

        // ── Scene ──────────────────────────────────────────────────────────
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0318)

        const w = container.clientWidth
        const h = container.clientHeight

        const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 250)
        camera.position.set(0, 8, 22)

        const renderer = new THREE.WebGPURenderer({ antialias: true })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.appendChild(renderer.domElement)
        await renderer.init()

        if (disposed) {
          renderer.dispose()
          if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
          return
        }

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.06

        // ── GPU Buffers ────────────────────────────────────────────────────
        const particlePos = instancedArray(LINE_COUNT, 'vec3')
        const particleLife = instancedArray(LINE_COUNT, 'vec4')
        const trailPositions = instancedArray(TOTAL_POINTS, 'vec4')

        // ── Uniforms ───────────────────────────────────────────────────────
        const uBounds = uniform(float(BOUNDS))
        const uTrailLength = uniform(float(TRAIL_LENGTH))
        const uNoiseScale = uniform(float(0.12))
        const uTimeSpeed = uniform(float(0.35))
        const uParticleSpeed = uniform(float(3.5))
        const uBrightness = uniform(float(1.4))
        const uCurlOctaves = uniform(float(3.0))
        const uSpawnRadius = uniform(float(0.7))
        const uTipIntensity = uniform(float(0.85))
        const uTime = uniform(float(0.0))
        const uDeltaTime = uniform(float(1.0 / 60.0))

        // ── Color Palettes ─────────────────────────────────────────────────
        const uPalALo = uniform(vec3(0.08, 0.02, 0.25))
        const uPalAHi = uniform(vec3(0.5, 0.12, 0.35))
        const uPalBLo = uniform(vec3(0.05, 0.15, 0.22))
        const uPalBHi = uniform(vec3(0.28, 0.3, 0.55))
        const uPalCLo = uniform(vec3(0.06, 0.18, 0.28))
        const uPalCHi = uniform(vec3(0.55, 0.2, 0.12))

        // ── Per-line color scheme ──────────────────────────────────────────
        const NUM_SCHEMES = 6
        const lineSchemeData = new Float32Array(LINE_COUNT)
        for (let i = 0; i < LINE_COUNT; i++) lineSchemeData[i] = Math.floor(Math.random() * NUM_SCHEMES)
        // lineSchemeAttr used as a geometry attribute below
        const lineSchemeAttr = new THREE.StorageBufferAttribute(lineSchemeData, 1)
        void lineSchemeAttr

        // ── TSL: noise helpers ─────────────────────────────────────────────
        const hash3 = Fn(([p_immutable]: [unknown]) => {
          const p = vec3(p_immutable).toVar()
          const px = fract(sin(dot(p, vec3(131.3, 307.9, 78.5))).mul(41237.6721))
          const py = fract(sin(dot(p, vec3(263.7, 179.1, 251.3))).mul(24891.3287))
          const pz = fract(sin(dot(p, vec3(109.3, 277.5, 131.2))).mul(33194.5617))
          return vec3(px, py, pz).mul(2.0).sub(1.0)
        })

        const quintic = Fn(([t_immutable]: [unknown]) => {
          const t = vec3(t_immutable).toVar()
          return t.mul(t).mul(t).mul(t.mul(t.mul(6.0).sub(15.0)).add(10.0))
        })

        const smoothNoise3 = Fn(([p_immutable]: [unknown]) => {
          const p = vec3(p_immutable).toVar()
          const i = floor(p).toVar()
          const f = fract(p).toVar()
          const u = quintic(f)
          const c000 = hash3(i)
          const c100 = hash3(i.add(vec3(1, 0, 0)))
          const c010 = hash3(i.add(vec3(0, 1, 0)))
          const c110 = hash3(i.add(vec3(1, 1, 0)))
          const c001 = hash3(i.add(vec3(0, 0, 1)))
          const c101 = hash3(i.add(vec3(1, 0, 1)))
          const c011 = hash3(i.add(vec3(0, 1, 1)))
          const c111 = hash3(i.add(vec3(1, 1, 1)))
          const x0 = mix(c000, c100, u.x)
          const x1 = mix(c010, c110, u.x)
          const x2 = mix(c001, c101, u.x)
          const x3 = mix(c011, c111, u.x)
          const y0 = mix(x0, x1, u.y)
          const y1 = mix(x2, x3, u.y)
          return mix(y0, y1, u.z)
        })

        const curlNoise = Fn(([p_immutable]: [unknown]) => {
          const p = vec3(p_immutable).toVar()
          const e = float(0.06)
          const dxp = smoothNoise3(p.add(vec3(e, 0, 0)))
          const dxn = smoothNoise3(p.sub(vec3(e, 0, 0)))
          const dyp = smoothNoise3(p.add(vec3(0, e, 0)))
          const dyn = smoothNoise3(p.sub(vec3(0, e, 0)))
          const dzp = smoothNoise3(p.add(vec3(0, 0, e)))
          const dzn = smoothNoise3(p.sub(vec3(0, 0, e)))
          const inv = float(1.0).div(e.mul(2.0))
          const x = dyp.z.sub(dyn.z).sub(dzp.y.sub(dzn.y)).mul(inv)
          const y = dzp.x.sub(dzn.x).sub(dxp.z.sub(dxn.z)).mul(inv)
          const z = dxp.y.sub(dxn.y).sub(dyp.x.sub(dyn.x)).mul(inv)
          const curl = vec3(x, y, z).toVar()
          const len = curl.length().max(0.0001)
          return curl.div(len)
        })

        // ── Compute: Init ──────────────────────────────────────────────────
        const initCompute = Fn(() => {
          const i = instanceIndex
          const fi = float(i)
          const s1 = fract(sin(fi.mul(131.3)).mul(41237.6721))
          const s2 = fract(sin(fi.mul(263.7)).mul(24891.3287))
          const s3 = fract(sin(fi.mul(423.8)).mul(33194.5617))
          const theta = s1.mul(6.283185)
          const phi = s2.mul(2.0).sub(1.0).acos()
          const r = s3.pow(float(1.0 / 3.0)).mul(uBounds.mul(uSpawnRadius))
          const sinPhi = sin(phi)
          const pos = vec3(r.mul(sinPhi).mul(cos(theta)), r.mul(sinPhi).mul(sin(theta)), r.mul(cos(phi)))
          particlePos.element(i).assign(pos)
          const phase = fract(sin(fi.mul(637.3)).mul(8214.5678)).mul(6.283)
          const speed = mix(float(0.4), float(1.8), fract(sin(fi.mul(351.9)).mul(17621.4523)))
          particleLife.element(i).assign(vec4(phase, speed, float(0.0), float(0.0)))
        })().compute(LINE_COUNT)

        const initTrails = Fn(() => {
          const idx = instanceIndex
          const lineIdx = int(floor(float(idx).div(uTrailLength)))
          const pos = particlePos.element(lineIdx)
          trailPositions.element(idx).assign(vec4(pos, float(0.0)))
        })().compute(TOTAL_POINTS)

        const shiftTrails = Fn(() => {
          const lineIdx = instanceIndex
          const tl = int(uTrailLength)
          const baseIdx = lineIdx.mul(tl)
          Loop({ start: tl.sub(1), end: int(0), type: 'int', condition: '>' }, ({ i }: { i: unknown }) => {
            const dst = (baseIdx as any).add(i)
            const src = (baseIdx as any).add((i as any).sub(1))
            trailPositions.element(dst).assign(trailPositions.element(src))
          })
        })().compute(LINE_COUNT)

        const updateParticles = Fn(() => {
          const i = instanceIndex
          const pos = particlePos.element(i).toVar()
          const lifeData = particleLife.element(i).toVar()
          const phase = lifeData.x
          const speed = lifeData.y
          const timeOffset = uTime.mul(uTimeSpeed).add(phase)
          const samplePos = pos.mul(uNoiseScale).add(vec3(timeOffset, float(0.0), timeOffset.mul(0.65)))
          const totalCurl = vec3(0.0, 0.0, 0.0).toVar()
          const amplitude = float(1.0).toVar()
          const freq = float(1.0).toVar()
          const ampSum = float(0.0).toVar()
          const octaves = int(uCurlOctaves)
          Loop({ start: int(0), end: octaves, type: 'int' }, () => {
            totalCurl.addAssign(curlNoise(samplePos.mul(freq)).mul(amplitude))
            ampSum.addAssign(amplitude)
            freq.mulAssign(2.3)
            amplitude.mulAssign(0.4)
          })
          totalCurl.divAssign(ampSum)
          const vel = totalCurl.mul(uParticleSpeed).mul(speed).mul(uDeltaTime)
          const newPos = pos.add(vel).toVar()
          const s3Rand = fract(sin(float(i).mul(423.8).add(uTime.mul(0.1))).mul(33194.5617))
          const bounds = uBounds
          const dist = newPos.length()
          const escaped = step(bounds.mul(1.15), dist)
          const respawnR = s3Rand.pow(float(1.0 / 3.0)).mul(uBounds.mul(uSpawnRadius))
          const respawnPos = normalize(newPos).mul(respawnR)
          newPos.assign(mix(newPos, respawnPos, escaped))
          const pushStrength = smoothstep(bounds.mul(0.55), bounds, dist).mul(uDeltaTime).mul(12.0)
          const pushDir = newPos.normalize().negate()
          newPos.addAssign(pushDir.mul(pushStrength))
          particlePos.element(i).assign(newPos)
          const baseIdx = i.mul(int(uTrailLength))
          trailPositions.element(baseIdx).assign(vec4(newPos, float(1.0)))
        })().compute(LINE_COUNT)

        // ── Geometry ───────────────────────────────────────────────────────
        const posArray = new Float32Array(TOTAL_POINTS * 3)
        const alphaArray = new Float32Array(TOTAL_POINTS)
        const posAttr = new THREE.StorageBufferAttribute(posArray, 3)
        const alphaAttr = new THREE.StorageBufferAttribute(alphaArray, 1)

        const indices: number[] = []
        for (let l = 0; l < LINE_COUNT; l++) {
          const base = l * TRAIL_LENGTH
          for (let p = 0; p < TRAIL_LENGTH - 1; p++) indices.push(base + p, base + p + 1)
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', posAttr)
        geometry.setAttribute('aAlpha', alphaAttr)
        geometry.setIndex(indices)

        const posStorage = storage(posAttr, 'vec3', TOTAL_POINTS)
        const alphaStorage = storage(alphaAttr, 'float', TOTAL_POINTS)

        const writeToGeometry = Fn(() => {
          const idx = instanceIndex
          const data = trailPositions.element(idx)
          posStorage.element(idx).assign(data.xyz)
          const lineIdx = int(floor(float(idx).div(uTrailLength)))
          const localIdx = idx.sub(lineIdx.mul(int(uTrailLength)))
          const trailFade = float(1.0).sub(float(localIdx).div(uTrailLength.sub(1.0)))
          alphaStorage.element(idx).assign(data.w.mul(trailFade))
        })().compute(TOTAL_POINTS)

        // ── Init & pre-warm ────────────────────────────────────────────────
        await renderer.computeAsync(initCompute)
        await renderer.computeAsync(initTrails)

        const PREWARM_STEPS = 400
        const PREWARM_DT = 1.0 / 60.0
        uDeltaTime.value = PREWARM_DT
        for (let i = 0; i < PREWARM_STEPS; i++) {
          uTime.value = i * PREWARM_DT
          await renderer.computeAsync(shiftTrails)
          await renderer.computeAsync(updateParticles)
        }
        await renderer.computeAsync(writeToGeometry)

        if (disposed) {
          renderer.dispose()
          if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
          return
        }

        // ── Material ───────────────────────────────────────────────────────
        const uLineWidth = uniform(float(2.5))
        const lineMaterial = new THREE.LineBasicNodeMaterial({ transparent: true, depthWrite: false })
        lineMaterial.linewidthNode = uLineWidth

        const lineIndexArray = new Float32Array(TOTAL_POINTS)
        for (let l = 0; l < LINE_COUNT; l++) {
          const base = l * TRAIL_LENGTH
          for (let p = 0; p < TRAIL_LENGTH; p++) lineIndexArray[base + p] = l
        }
        const lineIndexAttr = new THREE.StorageBufferAttribute(lineIndexArray, 1)
        geometry.setAttribute('aLineIdx', lineIndexAttr)

        const trailColor = Fn(() => {
          const a = attribute('aAlpha', 'float')
          const lineIdx = attribute('aLineIdx', 'float')
          const t = a.pow(0.55)
          const colA = mix(uPalALo, uPalAHi, t)
          const colB = mix(uPalBLo, uPalBHi, t)
          const colC = mix(uPalCLo, uPalCHi, t)
          const baseCol = colA.mul(0.35).add(colB.mul(0.4)).add(colC.mul(0.25))
          const schemeHash = fract(sin(lineIdx.mul(131.3)).mul(41237.6721))
          const schemeId = floor(schemeHash.mul(float(NUM_SCHEMES)))
          const hueShift = fract(sin(lineIdx.mul(307.9)).mul(24891.3287)).mul(0.35).sub(0.175)
          const r = baseCol.x.toVar()
          const g = baseCol.y.toVar()
          const b = baseCol.z.toVar()
          const isWarm = step(0.5, schemeId).mul(step(schemeId, float(1.5)))
          r.addAssign(isWarm.mul(0.14)); g.addAssign(isWarm.mul(0.05)); b.mulAssign(mix(float(1.0), float(0.45), isWarm))
          const isCool = step(1.5, schemeId).mul(step(schemeId, float(2.5)))
          r.mulAssign(mix(float(1.0), float(0.5), isCool)); g.addAssign(isCool.mul(0.06)); b.addAssign(isCool.mul(0.18))
          const isAmber = step(2.5, schemeId).mul(step(schemeId, float(3.5)))
          r.addAssign(isAmber.mul(0.18)); g.addAssign(isAmber.mul(0.12)); b.mulAssign(mix(float(1.0), float(0.3), isAmber))
          const isMint = step(3.5, schemeId).mul(step(schemeId, float(4.5)))
          r.mulAssign(mix(float(1.0), float(0.35), isMint)); g.addAssign(isMint.mul(0.14)); b.addAssign(isMint.mul(0.1))
          const isRose = step(4.5, schemeId).mul(step(schemeId, float(5.5)))
          r.addAssign(isRose.mul(0.1)); g.mulAssign(mix(float(1.0), float(0.6), isRose)); b.addAssign(isRose.mul(0.12))
          r.addAssign(hueShift.mul(0.12)); g.addAssign(hueShift.mul(0.06))
          const variedCol = vec3(r, g, b).max(vec3(0.0))
          const tipBoost = a.pow(0.35).mul(uTipIntensity).add(0.15)
          return variedCol.mul(a).mul(uBrightness).mul(tipBoost)
        })

        lineMaterial.colorNode = trailColor()
        lineMaterial.emissiveNode = trailColor().mul(0.85)
        lineMaterial.opacityNode = attribute('aAlpha', 'float')

        const linesMesh = new THREE.LineSegments(geometry, lineMaterial)
        linesMesh.frustumCulled = false
        scene.add(linesMesh)

        scene.fog = new THREE.FogExp2(0x0a0318, 0.015)

        // ── Post-processing ────────────────────────────────────────────────
        const postProcessing = new THREE.RenderPipeline(renderer)
        const scenePass = pass(scene, camera)
        scenePass.setMRT(mrt({ output, emissive }))
        const scenePassColor = scenePass.getTextureNode('output')
        const scenePassEmissive = scenePass.getTextureNode('emissive')
        const bloomPass = bloom(scenePassEmissive, 2.5, 0.8, 0.12)
        postProcessing.outputNode = scenePassColor.add(bloomPass)

        // ── Animate ────────────────────────────────────────────────────────
        const clock = new THREE.Timer()
        let fpsFrames = 0
        let fpsTime = performance.now()

        function animate() {
          clock.update()
          const dt = clock.getDelta()
          uTime.value += dt
          uDeltaTime.value = dt
          controls.update()

          fpsFrames++
          const now = performance.now()
          if (now - fpsTime >= 500) {
            const fps = Math.round(fpsFrames / ((now - fpsTime) / 1000))
            onFpsUpdate(fps)
            fpsFrames = 0
            fpsTime = now
          }

          renderer.compute(shiftTrails)
          renderer.compute(updateParticles)
          renderer.compute(writeToGeometry)
          postProcessing.render()
        }
        renderer.setAnimationLoop(animate)

        // ── Resize ─────────────────────────────────────────────────────────
        const onResize = () => {
          if (!container || disposed) return
          const cw = container.clientWidth
          const ch = container.clientHeight
          camera.aspect = cw / ch
          camera.updateProjectionMatrix()
          renderer.setSize(cw, ch)
        }
        window.addEventListener('resize', onResize)

        cleanupFn = () => {
          window.removeEventListener('resize', onResize)
          renderer.setAnimationLoop(null)
          controls.dispose()
          geometry.dispose()
          lineMaterial.dispose()
          renderer.dispose()
          if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        }
      } catch (err) {
        console.warn('[FlowFieldCanvas] init failed:', err)
      }
    })()

    return () => {
      disposed = true
      cleanupFn?.()
    }
  }, [onFpsUpdate])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#0a0318' }} />
}
