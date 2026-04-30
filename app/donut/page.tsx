import type { Metadata } from 'next'
import Link from 'next/link'
import { CrystalCanvas } from './CrystalCanvas'

export const metadata: Metadata = {
  title: 'Crystal Morphing',
  description:
    'WebGPU crystal morphing experiment — Voronoi displacement, TSL shaders, dissolve animation.',
}

export default function DonutPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050510', overflow: 'hidden' }}>
      {/* Canvas — explicit z-index 0 so overlay sits above it */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <CrystalCanvas />
      </div>

      {/* UI overlay — pointer-events none globally, re-enabled per element */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* ── Back ──────────────────────────────────────────────────────── */}
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 16px',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto',
          }}
        >
          ← Home
        </Link>

        {/* ── Label ───────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.18)',
            textAlign: 'right',
            lineHeight: 2,
          }}
        >
          <div>Crystal Morphing</div>
          <div style={{ color: 'rgba(255,255,255,0.08)' }}>
            Three.js TSL · Voronoi · Dissolve
          </div>
        </div>
      </div>
    </div>
  )
}
