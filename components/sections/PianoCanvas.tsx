'use client'

import { useEffect, useRef } from 'react'

export function PianoCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let animFrameId: number

    ;(async () => {
      const THREE = await import('three')

      if (disposed) return

      const canvas = document.createElement('canvas')
      canvas.style.cssText = 'display:block;width:100%;height:100%'
      container.appendChild(canvas)

      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)()

      const NOTE_DATA = [
        { note: 'C4', freq: 261.63, type: 'white', key: 'a' },
        { note: 'C#4', freq: 277.18, type: 'black', key: 'w' },
        { note: 'D4', freq: 293.66, type: 'white', key: 's' },
        { note: 'D#4', freq: 311.13, type: 'black', key: 'e' },
        { note: 'E4', freq: 329.63, type: 'white', key: 'd' },
        { note: 'F4', freq: 349.23, type: 'white', key: 'f' },
        { note: 'F#4', freq: 369.99, type: 'black', key: 't' },
        { note: 'G4', freq: 392.0, type: 'white', key: 'g' },
        { note: 'G#4', freq: 415.3, type: 'black', key: 'y' },
        { note: 'A4', freq: 440.0, type: 'white', key: 'h' },
        { note: 'A#4', freq: 466.16, type: 'black', key: 'u' },
        { note: 'B4', freq: 493.88, type: 'white', key: 'j' },
        { note: 'C5', freq: 523.25, type: 'white', key: 'k' },
        { note: 'C#5', freq: 554.37, type: 'black', key: 'o' },
        { note: 'D5', freq: 587.33, type: 'white', key: 'l' },
        { note: 'D#5', freq: 622.25, type: 'black', key: 'p' },
        { note: 'E5', freq: 659.25, type: 'white', key: ';' },
        { note: 'F5', freq: 698.46, type: 'white', key: "'" },
      ]

      function playPianoNote(freq: number, velocity = 0.7) {
        const now = audioCtx.currentTime
        const dur = 3.5
        const master = audioCtx.createGain()
        master.gain.setValueAtTime(0, now)
        master.gain.linearRampToValueAtTime(velocity * 0.35, now + 0.005)
        master.gain.exponentialRampToValueAtTime(velocity * 0.2, now + 0.08)
        master.gain.exponentialRampToValueAtTime(velocity * 0.12, now + 0.5)
        master.gain.exponentialRampToValueAtTime(0.001, now + dur)
        master.connect(audioCtx.destination)

        const harmonics = [
          { mult: 1, gain: 1.0, decay: 1.0 },
          { mult: 2, gain: 0.4, decay: 0.6 },
          { mult: 3, gain: 0.15, decay: 0.4 },
          { mult: 4, gain: 0.07, decay: 0.25 },
        ]
        harmonics.forEach(({ mult, gain, decay }) => {
          const osc = audioCtx.createOscillator()
          const g = audioCtx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq * mult, now)
          g.gain.setValueAtTime(gain, now)
          if (mult > 1) g.gain.exponentialRampToValueAtTime(0.001, now + dur * decay)
          osc.connect(g)
          g.connect(master)
          osc.start(now)
          osc.stop(now + dur)
        })

        const bufferSize = audioCtx.sampleRate * 0.04
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
        const data = noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5
        const noise = audioCtx.createBufferSource()
        noise.buffer = noiseBuffer
        const nGain = audioCtx.createGain()
        nGain.gain.setValueAtTime(velocity * 0.15, now)
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
        const nFilter = audioCtx.createBiquadFilter()
        nFilter.type = 'bandpass'
        nFilter.frequency.setValueAtTime(freq * 2.5, now)
        nFilter.Q.setValueAtTime(2, now)
        noise.connect(nFilter)
        nFilter.connect(nGain)
        nGain.connect(master)
        noise.start(now)
        noise.stop(now + 0.05)
      }

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(container.clientWidth, container.clientHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0a0a0c)
      scene.fog = new THREE.FogExp2(0x0a0a0c, 0.035)

      const camera = new THREE.PerspectiveCamera(
        40,
        container.clientWidth / container.clientHeight,
        0.1,
        100,
      )
      camera.position.set(0, 5.5, 7.5)
      camera.lookAt(0, 0.5, 0)

      scene.add(new THREE.AmbientLight(0x1a1520, 0.4))

      const mainLight = new THREE.SpotLight(0xffeedd, 1.5, 30, Math.PI / 5, 0.6, 1)
      mainLight.position.set(0, 10, 4)
      mainLight.castShadow = true
      mainLight.shadow.mapSize.set(2048, 2048)
      mainLight.shadow.bias = -0.0001
      scene.add(mainLight)

      const rimLight = new THREE.DirectionalLight(0x4466aa, 0.3)
      rimLight.position.set(-5, 3, -3)
      scene.add(rimLight)

      const warmFill = new THREE.PointLight(0xffaa66, 0.4, 15)
      warmFill.position.set(5, 4, 2)
      scene.add(warmFill)

      scene.add(new THREE.PointLight(0x4488cc, 0.2, 15)).position.set(-5, 3, 5)

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.85, metalness: 0.1 }),
      )
      floor.rotation.x = -Math.PI / 2
      floor.position.y = -0.5
      floor.receiveShadow = true
      scene.add(floor)

      const WW = 0.95, WD = 5.5, WH = 0.7
      const BW = 0.55, BD = 3.3, BH = 0.55
      const GAP = 0.06

      type KeyObj = {
        noteInfo: (typeof NOTE_DATA)[number]
        pivot: InstanceType<typeof THREE.Group>
        mesh: InstanceType<typeof THREE.Group>
        targetRotation: number
        currentRotation: number
        glowIntensity: number
        glowTarget: number
        glowLight: InstanceType<typeof THREE.PointLight>
        pressed: boolean
      }

      const keys3D: KeyObj[] = []
      const keyStates: Record<string, KeyObj> = {}

      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8f5f0, roughness: 0.25, metalness: 0.02 })
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.05 })

      const totalWhite = NOTE_DATA.filter((n) => n.type === 'white').length
      const totalWidth = totalWhite * (WW + GAP) - GAP
      const startX = -totalWidth / 2 + WW / 2
      let whiteIndex = 0

      NOTE_DATA.forEach((noteInfo) => {
        const pivotGroup = new THREE.Group()
        const keyGroup = new THREE.Group()
        let glow: InstanceType<typeof THREE.PointLight>

        if (noteInfo.type === 'white') {
          const body = new THREE.Mesh(new THREE.BoxGeometry(WW, WH, WD), whiteMat.clone())
          body.castShadow = true
          body.receiveShadow = true
          const topSurface = new THREE.Mesh(
            new THREE.BoxGeometry(WW - 0.04, 0.02, WD - 0.04),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 }),
          )
          topSurface.position.y = WH / 2 + 0.01
          keyGroup.add(body, topSurface)

          const x = startX + whiteIndex * (WW + GAP)
          pivotGroup.position.set(x, WH / 2, -WD / 2)
          keyGroup.position.set(0, 0, WD / 2)

          glow = new THREE.PointLight(0xffeebb, 0, 2.5)
          glow.position.set(0, WH / 2 + 0.1, WD * 0.65)
          whiteIndex++
        } else {
          const body = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD), blackMat.clone())
          body.castShadow = true
          const topSurface = new THREE.Mesh(
            new THREE.BoxGeometry(BW - 0.02, 0.04, BD - 0.3),
            new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.1 }),
          )
          topSurface.position.set(0, BH / 2 + 0.02, -0.15)
          keyGroup.add(body, topSurface)

          const x = startX + (whiteIndex - 1) * (WW + GAP) + (WW + GAP) / 2
          pivotGroup.position.set(x, WH + BH / 2, -BD / 2 + 0.1)
          keyGroup.position.set(0, 0, BD / 2 - 0.1)

          glow = new THREE.PointLight(0xddaa55, 0, 2.0)
          glow.position.set(0, BH / 2 + 0.1, BD * 0.5)
        }

        pivotGroup.add(keyGroup, glow)
        scene.add(pivotGroup)

        const keyObj: KeyObj = {
          noteInfo,
          pivot: pivotGroup,
          mesh: keyGroup,
          targetRotation: 0,
          currentRotation: 0,
          glowIntensity: 0,
          glowTarget: 0,
          glowLight: glow,
          pressed: false,
        }
        keys3D.push(keyObj)
        keyStates[noteInfo.key] = keyObj
      })

      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.6, metalness: 0.15 })
      const pianoBody = new THREE.Mesh(
        new THREE.BoxGeometry(totalWidth + 1.2, 0.6, WD + 1.5),
        bodyMat,
      )
      pianoBody.position.set(0, -0.3, -0.25)
      pianoBody.castShadow = true
      pianoBody.receiveShadow = true
      scene.add(pianoBody)

      const backRail = new THREE.Mesh(
        new THREE.BoxGeometry(totalWidth + 1.2, 1.8, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.5, metalness: 0.2 }),
      )
      backRail.position.set(0, 0.6, -WD / 2 - 0.4)
      backRail.castShadow = true
      scene.add(backRail)

      ;[-1, 1].forEach((side) => {
        const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.5, WD + 1.0), bodyMat.clone())
        cheek.position.set(side * (totalWidth / 2 + 0.42), 0.3, 0)
        cheek.castShadow = true
        scene.add(cheek)
      })

      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()

      function getClickedKey(clientX: number, clientY: number): KeyObj | null {
        const rect = canvas.getBoundingClientRect()
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(mouse, camera)

        for (const keyObj of keys3D.filter((k) => k.noteInfo.type === 'black')) {
          if (raycaster.intersectObjects(keyObj.mesh.children, true).length > 0) return keyObj
        }
        for (const keyObj of keys3D.filter((k) => k.noteInfo.type === 'white')) {
          if (raycaster.intersectObjects(keyObj.mesh.children, true).length > 0) return keyObj
        }
        return null
      }

      function pressKey(keyObj: KeyObj) {
        if (keyObj.pressed) return
        keyObj.pressed = true
        keyObj.targetRotation = keyObj.noteInfo.type === 'white' ? 0.04 : 0.05
        keyObj.glowTarget = keyObj.noteInfo.type === 'white' ? 3.0 : 2.0
        playPianoNote(keyObj.noteInfo.freq, 0.7)
      }

      function releaseKey(keyObj: KeyObj) {
        keyObj.pressed = false
        keyObj.targetRotation = 0
        keyObj.glowTarget = 0
      }

      let mouseDownKey: KeyObj | null = null
      const activeKeyboardKeys = new Set<string>()

      const orbitState = {
        spherical: { radius: 9.3, phi: Math.PI / 3.2, theta: 0 },
        target: new THREE.Vector3(0, 0.5, 0),
        isDragging: false,
        isRightDragging: false,
        lastMouse: { x: 0, y: 0 },
        autoRotate: true,
        autoRotateSpeed: 0.08,
        minRadius: 4,
        maxRadius: 22,
        minPhi: 0.15,
        maxPhi: Math.PI / 2 - 0.05,
        damping: { theta: 0, phi: 0 },
      }

      function updateCamera() {
        const s = orbitState.spherical
        s.phi = Math.max(orbitState.minPhi, Math.min(orbitState.maxPhi, s.phi))
        s.radius = Math.max(orbitState.minRadius, Math.min(orbitState.maxRadius, s.radius))
        camera.position.set(
          orbitState.target.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta),
          orbitState.target.y + s.radius * Math.cos(s.phi),
          orbitState.target.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta),
        )
        camera.lookAt(orbitState.target)
      }
      updateCamera()

      function onMouseDown(e: MouseEvent) {
        if (e.button === 2 || e.button === 1) {
          orbitState.isRightDragging = true
          orbitState.lastMouse = { x: e.clientX, y: e.clientY }
          orbitState.autoRotate = false
          e.preventDefault()
          return
        }
        const key = getClickedKey(e.clientX, e.clientY)
        if (key) {
          pressKey(key)
          mouseDownKey = key
        } else {
          orbitState.isDragging = true
          orbitState.lastMouse = { x: e.clientX, y: e.clientY }
          orbitState.autoRotate = false
        }
      }

      function onMouseMove(e: MouseEvent) {
        if (orbitState.isDragging) {
          const dx = e.clientX - orbitState.lastMouse.x
          const dy = e.clientY - orbitState.lastMouse.y
          orbitState.spherical.theta -= dx * 0.005
          orbitState.spherical.phi -= dy * 0.005
          orbitState.damping.theta = -dx * 0.002
          orbitState.damping.phi = -dy * 0.002
          orbitState.lastMouse = { x: e.clientX, y: e.clientY }
          updateCamera()
        }
        if (orbitState.isRightDragging) {
          const dx = e.clientX - orbitState.lastMouse.x
          const dy = e.clientY - orbitState.lastMouse.y
          const panRight = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0)
          const panUp = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1)
          const ps = orbitState.spherical.radius * 0.002
          orbitState.target.addScaledVector(panRight, -dx * ps)
          orbitState.target.addScaledVector(panUp, dy * ps)
          orbitState.lastMouse = { x: e.clientX, y: e.clientY }
          updateCamera()
        }
      }

      function onMouseUp() {
        orbitState.isDragging = false
        orbitState.isRightDragging = false
        if (mouseDownKey) { releaseKey(mouseDownKey); mouseDownKey = null }
      }

      function onWheel(e: WheelEvent) {
        e.preventDefault()
        orbitState.spherical.radius = Math.max(
          orbitState.minRadius,
          Math.min(orbitState.maxRadius, orbitState.spherical.radius * (1 + e.deltaY * 0.001)),
        )
        orbitState.autoRotate = false
        updateCamera()
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.repeat) return
        const key = e.key.toLowerCase()
        if (keyStates[key] && !activeKeyboardKeys.has(key)) {
          activeKeyboardKeys.add(key)
          pressKey(keyStates[key])
        }
      }

      function onKeyUp(e: KeyboardEvent) {
        const key = e.key.toLowerCase()
        if (keyStates[key] && activeKeyboardKeys.has(key)) {
          activeKeyboardKeys.delete(key)
          releaseKey(keyStates[key])
        }
      }

      let lastTouchDist = 0
      let lastTouchCenter = { x: 0, y: 0 }
      let touchMode: 'play' | 'orbit' | 'pinch' | null = null

      function onTouchStart(e: TouchEvent) {
        e.preventDefault()
        if (e.touches.length === 1) {
          const t = e.touches[0]
          const key = getClickedKey(t.clientX, t.clientY)
          if (key) { pressKey(key); mouseDownKey = key; touchMode = 'play' }
          else { touchMode = 'orbit'; orbitState.lastMouse = { x: t.clientX, y: t.clientY }; orbitState.autoRotate = false }
        } else if (e.touches.length === 2) {
          touchMode = 'pinch'
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          lastTouchDist = Math.sqrt(dx * dx + dy * dy)
          lastTouchCenter = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 }
          orbitState.autoRotate = false
          if (mouseDownKey) { releaseKey(mouseDownKey); mouseDownKey = null }
        }
      }

      function onTouchMove(e: TouchEvent) {
        e.preventDefault()
        if (touchMode === 'orbit' && e.touches.length === 1) {
          const t = e.touches[0]
          orbitState.spherical.theta -= (t.clientX - orbitState.lastMouse.x) * 0.005
          orbitState.spherical.phi -= (t.clientY - orbitState.lastMouse.y) * 0.005
          orbitState.lastMouse = { x: t.clientX, y: t.clientY }
          updateCamera()
        }
        if (touchMode === 'pinch' && e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          const dist = Math.sqrt(dx * dx + dy * dy)
          orbitState.spherical.radius = Math.max(orbitState.minRadius, Math.min(orbitState.maxRadius, orbitState.spherical.radius * lastTouchDist / dist))
          lastTouchDist = dist
          const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
          const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
          const panRight = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0)
          const panUp = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1)
          const ps = orbitState.spherical.radius * 0.002
          orbitState.target.addScaledVector(panRight, -(cx - lastTouchCenter.x) * ps)
          orbitState.target.addScaledVector(panUp, (cy - lastTouchCenter.y) * ps)
          lastTouchCenter = { x: cx, y: cy }
          updateCamera()
        }
      }

      function onTouchEnd(e: TouchEvent) {
        e.preventDefault()
        if (mouseDownKey) { releaseKey(mouseDownKey); mouseDownKey = null }
        if (e.touches.length === 0) touchMode = null
      }

      canvas.addEventListener('mousedown', onMouseDown)
      canvas.addEventListener('mousemove', onMouseMove)
      canvas.addEventListener('mouseup', onMouseUp)
      canvas.addEventListener('wheel', onWheel, { passive: false })
      canvas.addEventListener('contextmenu', (e) => e.preventDefault())
      canvas.addEventListener('touchstart', onTouchStart, { passive: false })
      canvas.addEventListener('touchmove', onTouchMove, { passive: false })
      canvas.addEventListener('touchend', onTouchEnd, { passive: false })
      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('keyup', onKeyUp)

      function onResize() {
        if (!container) return
        camera.aspect = container.clientWidth / container.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(container.clientWidth, container.clientHeight)
      }
      window.addEventListener('resize', onResize)

      const clock = new THREE.Clock()

      function animate() {
        if (disposed) return
        animFrameId = requestAnimationFrame(animate)
        const delta = clock.getDelta()
        const time = clock.getElapsedTime()

        if (orbitState.autoRotate) {
          orbitState.spherical.theta += delta * orbitState.autoRotateSpeed * 0.15
          updateCamera()
        } else if (Math.abs(orbitState.damping.theta) > 0.0001) {
          orbitState.spherical.theta += orbitState.damping.theta
          orbitState.damping.theta *= 0.92
          updateCamera()
        }

        keys3D.forEach((k) => {
          k.currentRotation += (k.targetRotation - k.currentRotation) * Math.min(1, delta * (k.pressed ? 18 : 10))
          k.pivot.rotation.x = k.currentRotation
          k.glowIntensity += (k.glowTarget - k.glowIntensity) * Math.min(1, delta * (k.pressed ? 15 : 5))
          k.glowLight.intensity = k.glowIntensity
        })

        mainLight.intensity = 1.5 + Math.sin(time * 0.5) * 0.1
        renderer.render(scene, camera)
      }

      animate()

      return () => {
        canvas.removeEventListener('mousedown', onMouseDown)
        canvas.removeEventListener('mousemove', onMouseMove)
        canvas.removeEventListener('mouseup', onMouseUp)
        canvas.removeEventListener('wheel', onWheel)
        canvas.removeEventListener('touchstart', onTouchStart)
        canvas.removeEventListener('touchmove', onTouchMove)
        canvas.removeEventListener('touchend', onTouchEnd)
        document.removeEventListener('keydown', onKeyDown)
        document.removeEventListener('keyup', onKeyUp)
        window.removeEventListener('resize', onResize)
        cancelAnimationFrame(animFrameId)
        renderer.dispose()
        audioCtx.close()
        container.removeChild(canvas)
      }
    })().then((cleanup) => {
      if (disposed && cleanup) cleanup()
      else if (cleanup) {
        const originalCleanup = cleanup
        Object.assign(containerRef, { _cleanup: originalCleanup })
      }
    })

    return () => {
      disposed = true
      cancelAnimationFrame(animFrameId)
      const cleanup = (containerRef as unknown as { _cleanup?: () => void })._cleanup
      if (cleanup) cleanup()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0" />
}
