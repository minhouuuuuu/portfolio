'use client'

import { useRef, useEffect } from 'react'
import { StaticDottedMap } from '@/components/ui/StaticDottedMap'
import { useLocale } from '@/components/providers/LocaleProvider'

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
