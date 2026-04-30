'use client'

import { useEffect, useRef } from 'react'

export function CrystalCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let cleanupFn: (() => void) | null = null

    ;(async () => {
      if (typeof navigator === 'undefined' || !navigator.gpu) {
        container.innerHTML =
          '<div style="color:rgba(255,255,255,0.3);font-family:monospace;font-size:11px;letter-spacing:0.1em;padding:32px;text-align:center;text-transform:uppercase">WebGPU not supported.<br/>Try Chrome 113+ or Edge 113+.</div>'
        return
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const THREE = (await import('three/webgpu')) as any
        const { OrbitControls } = await import(
          'three/examples/jsm/controls/OrbitControls.js'
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tsl = (await import('three/tsl')) as any
        const {
          uniform,
          vec3,
          vec4,
          float,
          fract,
          floor,
          dot,
          mix,
          smoothstep,
          pow,
          sqrt,
          normalize,
          cross,
          abs,
          step,
          sin,
          positionLocal,
          normalLocal,
          Fn,
          If,
          modelWorldMatrix,
        } = tsl

        if (disposed) return

        const w = container.clientWidth
        const h = container.clientHeight

        // ── Scene ─────────────────────────────────────────────────────────
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x050510)

        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
        camera.position.set(0, 0, 5)

        const renderer = new THREE.WebGPURenderer({ antialias: true })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        container.appendChild(renderer.domElement)
        await renderer.init()

        if (disposed) {
          renderer.dispose()
          if (container.contains(renderer.domElement))
            container.removeChild(renderer.domElement)
          return
        }

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05

        // ── Uniforms ──────────────────────────────────────────────────────
        const uTime = uniform(0.0)
        const uVoronoiScale = uniform(7.3)
        const uDisplacementStrength = uniform(0.26)
        const uEdgeSharpness = uniform(8.0)
        const uCellJitter = uniform(0.69)
        const uRoughness = uniform(0.3)
        const uInnerGlow = uniform(0.4)
        const uColorWhite = uniform(new THREE.Color('#000000'))
        const uColorBlue = uniform(new THREE.Color('#1c52f2'))
        const uColorDeep = uniform(new THREE.Color('#010d0e'))
        const uDissolveProgress = uniform(0.0)
        const uDissolveNoiseScale = uniform(6.3)
        const uDissolveEdgeWidth = uniform(0.26)
        const uDissolveEdgeColor = uniform(new THREE.Color('#000000'))
        const uDissolveEdgeIntensity = uniform(4.5)
        const uDissolveBandWidth = uniform(0.5)
        const uStoneNoiseScale = uniform(11.4)
        const uStoneRoughness = uniform(0.9)
        const uStoneColor1 = uniform(new THREE.Color('#b5b5b5'))
        const uStoneColor2 = uniform(new THREE.Color('#6b6b6b'))
        const uStoneColor3 = uniform(new THREE.Color('#000000'))
        const uBandAngle = uniform(0.35)
        const uBandWarp = uniform(0.12)
        const uMorphOffset = uniform(0.0)
        const uMorphWidth = uniform(0.1)
        const uStoneDispStrength = uniform(0.042)
        const uStoneCrystalDispStrength = uniform(0.14)

        // ── TSL: hash ─────────────────────────────────────────────────────
        const hash3 = Fn(([p_immutable]: [unknown]) => {
          const p = vec3(p_immutable).toVar()
          const px = dot(p, vec3(127.1, 311.7, 74.7))
          const py = dot(p, vec3(269.5, 183.3, 246.1))
          const pz = dot(p, vec3(113.5, 271.9, 124.6))
          const h = vec3(px, py, pz)
          return fract(sin(h).mul(43758.5453123)).mul(2.0).sub(1.0)
        })

        // ── TSL: voronoi ──────────────────────────────────────────────────
        const voronoi = Fn(([x_immutable, jitter_immutable]: [unknown, unknown]) => {
          const x = vec3(x_immutable).toVar()
          const jitter = float(jitter_immutable).toVar()
          const p = floor(x).toVar()
          const f = fract(x).toVar()
          const minDist = float(100.0).toVar()
          const secondMin = float(100.0).toVar()

          for (let k = -1; k <= 1; k++) {
            for (let j = -1; j <= 1; j++) {
              for (let i = -1; i <= 1; i++) {
                const b = vec3(float(i), float(j), float(k))
                const r = b.sub(f).add(hash3(p.add(b)).mul(jitter))
                const d = dot(r, r)
                If(d.lessThan(minDist), () => {
                  secondMin.assign(minDist)
                  minDist.assign(d)
                }).Else(() => {
                  If(d.lessThan(secondMin), () => {
                    secondMin.assign(d)
                  })
                })
              }
            }
          }

          return vec4(sqrt(minDist), sqrt(secondMin).sub(sqrt(minDist)), float(0), float(0))
        })

        // ── TSL: noise ────────────────────────────────────────────────────
        const noise3D = Fn(([p_immutable]: [unknown]) => {
          const p = vec3(p_immutable).toVar()
          const i = floor(p).toVar()
          const f = fract(p).toVar()
          const u = f.mul(f).mul(float(3.0).sub(f.mul(2.0)))
          const n = dot(i, vec3(1.0, 57.0, 113.0))
          const a = fract(sin(n).mul(43758.5453))
          const b = fract(sin(n.add(1.0)).mul(43758.5453))
          const c = fract(sin(n.add(57.0)).mul(43758.5453))
          const d = fract(sin(n.add(58.0)).mul(43758.5453))
          const e = fract(sin(n.add(113.0)).mul(43758.5453))
          const ff = fract(sin(n.add(114.0)).mul(43758.5453))
          const g = fract(sin(n.add(170.0)).mul(43758.5453))
          const hh = fract(sin(n.add(171.0)).mul(43758.5453))
          return mix(
            mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
            mix(mix(e, ff, u.x), mix(g, hh, u.x), u.y),
            u.z,
          )
        })

        // ── Crystal displacement nodes ────────────────────────────────────
        const samplePos = positionLocal.mul(uVoronoiScale).add(uTime.mul(0.15))
        const vor = voronoi(samplePos, uCellJitter)
        const edgeDist = vor.y

        const _worldPos = modelWorldMatrix.mul(vec4(positionLocal, 1.0)).xyz
        const _dissolveX = _worldPos.x.add(1.4).div(2.8)

        const _dissolveNoisePos = positionLocal.mul(uDissolveNoiseScale)
        const _dissolveNoise = noise3D(_dissolveNoisePos)
          .mul(0.6)
          .add(noise3D(_dissolveNoisePos.mul(2.3).add(vec3(7.8, 3.1, 5.4))).mul(0.3))
          .add(noise3D(_dissolveNoisePos.mul(5.1).add(vec3(13.2, 8.7, 2.9))).mul(0.1))

        const halfBand = uDissolveBandWidth.mul(0.5)
        const noiseOffset = _dissolveNoise.sub(0.5).mul(0.15)

        const _bandWarpNoise = noise3D(positionLocal.mul(3.2).add(vec3(42.1, 17.3, 8.6)))
        const bandWarpOffset = _bandWarpNoise.sub(0.5).mul(uBandWarp)
        const bandX = float(1.0)
          .sub(_dissolveX)
          .add(noiseOffset)
          .add(_worldPos.y.mul(uBandAngle).div(2.8))
          .add(bandWarpOffset)

        const distFromBand = abs(bandX.sub(uDissolveProgress))
        const _dissolveDiff = distFromBand.sub(halfBand)

        const dissolveProximityLinear = smoothstep(float(0.0), float(0.3), abs(_dissolveDiff))
        const dissolveProximity = pow(dissolveProximityLinear, float(0.35))
        const displacement = edgeDist.mul(uDisplacementStrength).mul(dissolveProximity)

        const eps = float(0.25)
        const rawNormal = normalLocal.toVar()
        const tangent1 = normalize(cross(rawNormal, vec3(0.0, 1.0, 0.0)))
        const tangent2 = normalize(cross(rawNormal, tangent1))

        const posA = positionLocal.add(tangent1.mul(eps))
        const vA = voronoi(posA.mul(uVoronoiScale).add(uTime.mul(0.15)), uCellJitter)
        const displacedA = posA.add(rawNormal.mul(vA.y.mul(uDisplacementStrength)))

        const posB = positionLocal.add(tangent2.mul(eps))
        const vB = voronoi(posB.mul(uVoronoiScale).add(uTime.mul(0.15)), uCellJitter)
        const displacedB = posB.add(rawNormal.mul(vB.y.mul(uDisplacementStrength)))

        const displacedPos = positionLocal.add(rawNormal.mul(displacement))
        const displacedNormal = normalize(
          cross(displacedA.sub(displacedPos), displacedB.sub(displacedPos)),
        )

        // ── Crystal material ──────────────────────────────────────────────
        const material = new THREE.MeshStandardNodeMaterial()
        material.positionNode = displacedPos
        material.normalNode = displacedNormal

        const colorNode = Fn(() => {
          const v = voronoi(samplePos.toVar(), uCellJitter)
          const cellDist = v.x
          const eDist = v.y
          const edgeWidth = float(0.82).div(uEdgeSharpness)
          const edge = float(1.0).sub(smoothstep(float(0.0), edgeWidth, eDist))
          const cellColor = mix(uColorDeep, uColorBlue, cellDist.mul(1.5))
          const color = cellColor.toVar()
          const edgeColor = mix(uColorBlue.mul(1.5), uColorWhite, edge.mul(0.7))
          color.assign(mix(color, edgeColor, edge.mul(0.9)))
          const glow = smoothstep(float(0.0), float(0.3), displacement).mul(uInnerGlow)
          color.addAssign(uColorBlue.mul(glow.mul(0.6)))
          const ao = smoothstep(float(0.0), float(0.5), cellDist)
          color.mulAssign(mix(float(0.6), float(1.0), ao))
          return color
        })

        const edgeMask = smoothstep(float(0.0), uDissolveEdgeWidth, _dissolveDiff.negate())
          .oneMinus()
          .mul(step(float(0.0), _dissolveDiff.negate()))
        const shadowDarken = mix(
          float(0.0),
          float(1.0),
          smoothstep(float(0.0), float(0.35), abs(_dissolveDiff)),
        )

        const dissolveColorNode = Fn(() => {
          const baseColor = colorNode().toVar()
          baseColor.mulAssign(shadowDarken)
          baseColor.addAssign(
            uDissolveEdgeColor.mul(uDissolveEdgeIntensity).mul(edgeMask).mul(0.3),
          )
          return baseColor
        })

        material.colorNode = dissolveColorNode()
        material.roughnessNode = uRoughness
        material.metalnessNode = float(0.1)
        material.emissiveNode = uDissolveEdgeColor
          .mul(edgeMask)
          .mul(uDissolveEdgeIntensity)
          .mul(0.15)
        material.opacityNode = step(float(0.0), _dissolveDiff).oneMinus()
        material.transparent = true
        material.alphaTest = 0.5

        // ── Stone material ────────────────────────────────────────────────
        const stoneMaterial = new THREE.MeshStandardNodeMaterial()

        const stoneNoisePos = positionLocal.mul(uStoneNoiseScale)
        const stoneDisplaceNoise = noise3D(stoneNoisePos)
          .add(noise3D(stoneNoisePos.mul(2.3).add(vec3(5.2, 8.1, 3.7))).mul(0.5))
          .add(noise3D(stoneNoisePos.mul(6.1).add(vec3(12.4, 2.9, 9.3))).mul(0.2))

        const _stoneWorldPos = modelWorldMatrix.mul(vec4(positionLocal, 1.0)).xyz
        const _stoneDissolveX = _stoneWorldPos.x.add(1.4).div(2.8)
        const _stoneNoisePos = positionLocal.mul(uDissolveNoiseScale)
        const _stoneDissolveNoise = noise3D(_stoneNoisePos)
          .mul(0.6)
          .add(noise3D(_stoneNoisePos.mul(2.3).add(vec3(7.8, 3.1, 5.4))).mul(0.3))
          .add(noise3D(_stoneNoisePos.mul(5.1).add(vec3(13.2, 8.7, 2.9))).mul(0.1))
        const stoneNoiseOffset = _stoneDissolveNoise.sub(0.5).mul(0.15)
        const stoneBandWarpOffset = noise3D(
          positionLocal.mul(3.2).add(vec3(42.1, 17.3, 8.6)),
        )
          .sub(0.5)
          .mul(uBandWarp)
        const stoneBandX = float(1.0)
          .sub(_stoneDissolveX)
          .add(stoneNoiseOffset)
          .add(_stoneWorldPos.y.mul(uBandAngle).div(2.8))
          .add(stoneBandWarpOffset)

        const stoneDissolveDiff = abs(stoneBandX.sub(uDissolveProgress.add(uMorphOffset))).sub(
          halfBand,
        )
        const morphFactor = smoothstep(uMorphWidth, float(0.0), stoneDissolveDiff).mul(
          smoothstep(float(-0.5), float(0.0), stoneDissolveDiff),
        )

        const stoneCrystalVor = voronoi(
          positionLocal.mul(uVoronoiScale).add(uTime.mul(0.15)),
          uCellJitter,
        )
        const stoneBlendedDisp = mix(
          stoneDisplaceNoise.mul(uStoneDispStrength),
          stoneCrystalVor.y.mul(uStoneCrystalDispStrength),
          morphFactor,
        )
        const stoneDisplacedPos = positionLocal.add(normalLocal.mul(stoneBlendedDisp))

        const stoneEps = float(0.001)
        const stoneTan1 = normalize(cross(normalLocal, vec3(0.0, 1.0, 0.0)))
        const stoneTan2 = normalize(cross(normalLocal, stoneTan1))

        const stonePosA = positionLocal.add(stoneTan1.mul(stoneEps))
        const stoneNA = mix(
          noise3D(stonePosA.mul(uStoneNoiseScale))
            .add(noise3D(stonePosA.mul(uStoneNoiseScale).mul(2.3).add(vec3(5.2, 8.1, 3.7))).mul(0.5))
            .add(noise3D(stonePosA.mul(uStoneNoiseScale).mul(6.1).add(vec3(12.4, 2.9, 9.3))).mul(0.2))
            .mul(uStoneDispStrength),
          voronoi(stonePosA.mul(uVoronoiScale).add(uTime.mul(0.15)), uCellJitter).y.mul(
            uStoneCrystalDispStrength,
          ),
          morphFactor,
        )
        const stoneDisplacedA = stonePosA.add(normalLocal.mul(stoneNA))

        const stonePosB = positionLocal.add(stoneTan2.mul(stoneEps))
        const stoneNB = mix(
          noise3D(stonePosB.mul(uStoneNoiseScale))
            .add(noise3D(stonePosB.mul(uStoneNoiseScale).mul(2.3).add(vec3(5.2, 8.1, 3.7))).mul(0.5))
            .add(noise3D(stonePosB.mul(uStoneNoiseScale).mul(6.1).add(vec3(12.4, 2.9, 9.3))).mul(0.2))
            .mul(uStoneDispStrength),
          voronoi(stonePosB.mul(uVoronoiScale).add(uTime.mul(0.15)), uCellJitter).y.mul(
            uStoneCrystalDispStrength,
          ),
          morphFactor,
        )
        const stoneDisplacedB = stonePosB.add(normalLocal.mul(stoneNB))

        stoneMaterial.positionNode = stoneDisplacedPos
        stoneMaterial.normalNode = normalize(
          cross(stoneDisplacedA.sub(stoneDisplacedPos), stoneDisplacedB.sub(stoneDisplacedPos)),
        )

        const stoneColorNode = Fn(() => {
          const p = positionLocal.mul(uStoneNoiseScale).toVar()
          const n1 = noise3D(p)
          const n2 = noise3D(p.mul(3.2).add(vec3(10.0, 20.0, 30.0)))
          const n3 = noise3D(p.mul(8.5).add(vec3(50.0, 40.0, 60.0)))
          const base = mix(uStoneColor1, uStoneColor2, n1).toVar()
          base.assign(mix(base, uStoneColor3, n2.mul(0.5)))
          const grain = n3.mul(0.08).sub(0.04)
          base.addAssign(vec3(grain, grain, grain))
          base.mulAssign(
            mix(float(0.65), float(1.0), smoothstep(float(0.2), float(0.7), stoneDisplaceNoise)),
          )
          return base
        })

        stoneMaterial.colorNode = stoneColorNode()
        stoneMaterial.roughnessNode = uStoneRoughness
        stoneMaterial.metalnessNode = float(0.05)

        // ── Geometry (Torus) ──────────────────────────────────────────────
        const geometry = new THREE.TorusGeometry(0.9, 0.4, 128, 256)
        const crystal = new THREE.Mesh(geometry, material)
        scene.add(crystal)

        const stone = new THREE.Mesh(geometry, stoneMaterial)
        stone.scale.setScalar(0.96)
        scene.add(stone)

        // ── Lights ────────────────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0x334466, 0.5))

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5)
        dirLight1.position.set(1, 1, 1)
        scene.add(dirLight1)

        const dirLight2 = new THREE.DirectionalLight(0x4466ff, 0.8)
        dirLight2.position.set(-1, 0.5, -0.5)
        scene.add(dirLight2)

        const spotLight = new THREE.SpotLight(0xddeeff, 4.0, 20, Math.PI * 0.25, 0.6, 1.2)
        spotLight.position.set(-4, 5, 3)
        spotLight.target.position.set(0, 0, 0)
        scene.add(spotLight)
        scene.add(spotLight.target)

        const accentLight = new THREE.PointLight(0x8eaaff, 1.5, 10, 1.8)
        accentLight.position.set(-2.5, 3, 2)
        scene.add(accentLight)

        // ── Animation ─────────────────────────────────────────────────────
        const timer = new THREE.Timer()
        let dissolveTime = 0

        renderer.setAnimationLoop((timestamp: number) => {
          timer.update(timestamp)
          const delta = timer.getDelta()
          const elapsed = timer.getElapsed()
          uTime.value = elapsed * 0.85

          dissolveTime += delta * 0.18
          const pingPong = Math.abs(((dissolveTime % 2.0) + 2.0) % 2.0 - 1.0)
          uDissolveProgress.value = -0.2 + pingPong * 1.4

          crystal.rotation.y = elapsed * 0.08
          stone.rotation.y = elapsed * 0.08

          controls.update()
          renderer.render(scene, camera)
        })

        // ── Resize ────────────────────────────────────────────────────────
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
          material.dispose()
          stoneMaterial.dispose()
          renderer.dispose()
          if (container.contains(renderer.domElement))
            container.removeChild(renderer.domElement)
        }
      } catch (err) {
        console.warn('[CrystalCanvas] init failed:', err)
      }
    })()

    return () => {
      disposed = true
      cleanupFn?.()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#050510' }} />
}
