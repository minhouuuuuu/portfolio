'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

type CursorVariant = 'default' | 'hover' | 'view' | 'click'

interface Position {
  x: number
  y: number
}

// Smooth-cursor style spring: heavier damping + restDelta for a fluid, settled
// follow. Borrowed from magicui's SmoothCursor physics.
const FOLLOW_SPRING = {
  damping: 45,
  stiffness: 400,
  mass: 1,
  restDelta: 0.001,
}

const DESKTOP_POINTER_QUERY = '(any-hover: hover) and (any-pointer: fine)'

export function CustomCursor() {
  const [variant, setVariant] = useState<CursorVariant>('default')
  const [isEnabled, setIsEnabled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Velocity tracking (smooth-cursor logic) for the trailing dot stretch.
  const lastPos = useRef<Position>({ x: 0, y: 0 })
  const velocity = useRef<Position>({ x: 0, y: 0 })
  const lastTime = useRef(Date.now())

  // Ring follows with the soft spring; dot is a touch snappier so it leads.
  const ringX = useSpring(-100, FOLLOW_SPRING)
  const ringY = useSpring(-100, FOLLOW_SPRING)
  const dotX = useSpring(-100, { ...FOLLOW_SPRING, stiffness: 1000, damping: 50 })
  const dotY = useSpring(-100, { ...FOLLOW_SPRING, stiffness: 1000, damping: 50 })

  // Velocity-driven squash & rotation on the ring for a sense of momentum.
  const stretch = useSpring(1, { ...FOLLOW_SPRING, stiffness: 500, damping: 35 })
  const angle = useSpring(0, { ...FOLLOW_SPRING, stiffness: 300, damping: 60 })

  // Enable only on real desktop pointers.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_POINTER_QUERY)
    const update = () => {
      setIsEnabled(mq.matches)
      if (!mq.matches) setIsVisible(false)
    }
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!isEnabled) return

    let stretchTimeout: ReturnType<typeof setTimeout> | null = null
    let rafId = 0

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      setIsVisible(true)

      const pos = { x: e.clientX, y: e.clientY }
      const now = Date.now()
      const dt = now - lastTime.current
      if (dt > 0) {
        velocity.current = {
          x: (pos.x - lastPos.current.x) / dt,
          y: (pos.y - lastPos.current.y) / dt,
        }
      }
      lastTime.current = now
      lastPos.current = pos

      ringX.set(pos.x)
      ringY.set(pos.y)
      dotX.set(pos.x)
      dotY.set(pos.y)

      const speed = Math.hypot(velocity.current.x, velocity.current.y)
      if (speed > 0.15) {
        // Point the squash along travel direction, then stretch with speed.
        const deg =
          Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI)
        angle.set(deg)
        stretch.set(Math.min(1 + speed * 0.18, 1.45))
        if (stretchTimeout) clearTimeout(stretchTimeout)
        stretchTimeout = setTimeout(() => stretch.set(1), 120)
      }
    }

    const throttled = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || rafId) return
      rafId = requestAnimationFrame(() => {
        move(e)
        rafId = 0
      })
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-cursor='view']")) setVariant('view')
      else if (
        target.closest('a') ||
        target.closest('button') ||
        target.closest("[role='button']") ||
        target.closest("[data-cursor='hover']")
      )
        setVariant('hover')
      else setVariant('default')
    }
    const onDown = () => setVariant('click')
    const onUp = () => setVariant('default')

    window.addEventListener('pointermove', throttled, { passive: true })
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    return () => {
      window.removeEventListener('pointermove', throttled)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      if (rafId) cancelAnimationFrame(rafId)
      if (stretchTimeout) clearTimeout(stretchTimeout)
    }
  }, [isEnabled, ringX, ringY, dotX, dotY, stretch, angle])

  if (!isEnabled) return null

  const ringSize =
    variant === 'hover'
      ? 56
      : variant === 'view'
        ? 80
        : variant === 'click'
          ? 20
          : 36

  const ringColor =
    variant === 'hover' || variant === 'view'
      ? 'var(--accent)'
      : 'var(--text-muted)'

  return (
    <>
      {/* Outer ring — follows with smooth spring + velocity squash */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full border mix-blend-difference"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          rotate: angle,
          scaleX: stretch,
          borderColor: ringColor,
          opacity: isVisible ? 1 : 0,
          willChange: 'transform',
        }}
        animate={{ width: ringSize, height: ringSize }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {variant === 'view' && (
          <span
            className="absolute inset-0 flex items-center justify-center font-mono tracking-widest"
            style={{ color: 'var(--bg)', fontSize: '9px' }}
          >
            VIEW
          </span>
        )}
      </motion.div>

      {/* Center dot — leads slightly ahead of the ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full bg-[var(--accent)]"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
          opacity: isVisible && variant !== 'view' ? 1 : 0,
          willChange: 'transform',
        }}
        animate={{
          width: variant === 'click' ? 3 : 6,
          height: variant === 'click' ? 3 : 6,
        }}
        transition={{ duration: 0.12 }}
      />
    </>
  )
}
