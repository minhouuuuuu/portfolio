'use client'

import { useRef, useEffect } from 'react'
import { StaticDottedMap } from '@/components/ui/StaticDottedMap'
import { type Marker } from '@/components/ui/DottedMap'
import { useLocale } from '@/components/providers/LocaleProvider'

// Two pulsing home bases (relocating Strasbourg → Hanoi); the surrounding
// hubs span every inhabited continent to signal "open to remote work
// worldwide" rather than a single region. lat/lng are real — svg-dotted-map
// projects them onto the grid.
const HOMES: Marker[] = [
  { lat: 48.5734, lng: 7.7521, size: 0.9, pulse: true }, // Strasbourg
  { lat: 21.0278, lng: 105.8342, size: 0.9, pulse: true }, // Hanoi
]
const WORLD_HUBS: Marker[] = [
  { lat: 51.5074, lng: -0.1278 }, // London
  { lat: 52.52, lng: 13.405 }, // Berlin
  { lat: 40.4168, lng: -3.7038 }, // Madrid
  { lat: 52.3676, lng: 4.9041 }, // Amsterdam
  { lat: 59.3293, lng: 18.0686 }, // Stockholm
  { lat: 1.3521, lng: 103.8198 }, // Singapore
  { lat: 13.7563, lng: 100.5018 }, // Bangkok
  { lat: 35.6762, lng: 139.6503 }, // Tokyo
  { lat: 22.3193, lng: 114.1694 }, // Hong Kong
  { lat: -33.8688, lng: 151.2093 }, // Sydney
  { lat: 40.7128, lng: -74.006 }, // New York
  { lat: 37.7749, lng: -122.4194 }, // San Francisco
  { lat: -23.5505, lng: -46.6333 }, // São Paulo
]

const MARKERS: Marker[] = [...HOMES, ...WORLD_HUBS.map((m) => ({ ...m, size: 0.45 }))]

export function ContactMap() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const { t } = useLocale()

  // Gentle fade/zoom in on scroll into view.
  useEffect(() => {
    if (!wrapRef.current) return
    let ctx: { revert(): void } | undefined
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger)
        ctx = gsap.context(() => {
          gsap.fromTo(
            wrapRef.current,
            { opacity: 0, scale: 0.96 },
            {
              opacity: 1,
              scale: 1,
              duration: 1.1,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: wrapRef.current,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
            },
          )
        }, wrapRef)
      },
    )
    return () => ctx?.revert()
  }, [])

  return (
    <div className="mb-16">
      {/* Label */}
      <div
        className="flex items-center gap-3 justify-center mb-6"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span
          className="inline-block w-6 h-px"
          style={{ backgroundColor: 'var(--text-muted)' }}
        />
        <span
          className="text-xs tracking-[0.3em] uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          {t.contact.mapLabel}
        </span>
        <span
          className="inline-block w-6 h-px"
          style={{ backgroundColor: 'var(--text-muted)' }}
        />
      </div>

      <div
        ref={wrapRef}
        className="relative mx-auto h-[400px] max-w-3xl w-full overflow-hidden rounded-xl border"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
        }}
      >
        {/* Build-time map (scripts/generate-dotted-map.mjs). Visually
            identical to <DottedMap markers={MARKERS} pulse /> — which is kept
            in components/ui as the reference implementation — but one <path>
            instead of ~1,833 <circle> nodes. */}
        <StaticDottedMap
          dotColor="var(--text-muted)"
          markerColor="var(--accent)"
        />

        {/* Caption strip */}
        <div
          className="absolute bottom-0 inset-x-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3"
          style={{
            borderTop: '1px solid var(--border)',
            background: 'color-mix(in srgb, var(--surface) 80%, transparent)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span
            className="font-mono text-[11px] tracking-[0.15em] uppercase flex items-center gap-2"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
            />
            {t.contact.basedIn}
          </span>
          <span
            className="font-mono text-[10px] tracking-[0.15em] uppercase"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            {t.contact.openTo}
          </span>
        </div>
      </div>
    </div>
  )
}
