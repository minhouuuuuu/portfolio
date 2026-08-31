'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics'

/**
 * Fires `scroll_past_hero` once, the first time the hero section leaves the
 * viewport from the top (i.e. the visitor scrolled past the first screen).
 */
export function ScrollDepthTracker() {
  const firedRef = useRef(false)

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (firedRef.current) return
        // boundingClientRect.top < 0 means the hero has scrolled above the
        // viewport — i.e. the visitor scrolled down past it, not up into it.
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          firedRef.current = true
          track({ name: 'scroll_past_hero' })
          observer.disconnect()
        }
      },
      { threshold: 0 },
    )

    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return null
}
