'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { FlowFieldCanvas } from './FlowFieldCanvas'

function getTier(fps: number): { tier: string; color: string } {
  if (fps >= 120) return { tier: 'GOD MODE',  color: '#c8ff00' }
  if (fps >= 90)  return { tier: 'ULTRA',      color: '#00e5a8' }
  if (fps >= 60)  return { tier: 'SMOOTH',     color: '#4488ff' }
  if (fps >= 45)  return { tier: 'DECENT',     color: '#ff9900' }
  if (fps >= 30)  return { tier: 'STRUGGLING', color: '#ff6633' }
  return           { tier: 'PAIN',             color: '#ff3355' }
}

export function PerformanceTestClient() {
  const [currentFps, setCurrentFps] = useState(0)
  const peakFps = useRef(0)

  const handleFpsUpdate = useCallback((fps: number) => {
    setCurrentFps(fps)
    if (fps > peakFps.current) peakFps.current = fps
  }, [])

  const { tier: currentTier, color: tierColor } = getTier(currentFps)

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0318', overflow: 'hidden' }}>
      {/* Canvas */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <FlowFieldCanvas onFpsUpdate={handleFpsUpdate} />
      </div>

      {/* UI Overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>

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
            color: 'rgba(200,180,255,0.45)',
            textDecoration: 'none',
            border: '1px solid rgba(130,100,255,0.2)',
            padding: '8px 16px',
            backdropFilter: 'blur(8px)',
            background: 'rgba(10,3,24,0.6)',
            pointerEvents: 'auto',
          }}
        >
          ← Home
        </Link>

        {/* ── FPS Counter top-right ──────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            fontFamily: 'var(--font-mono)',
            background: 'rgba(10,3,24,0.88)',
            border: '1px solid rgba(130,100,255,0.2)',
            borderRadius: 8,
            padding: '12px 18px',
            backdropFilter: 'blur(10px)',
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'rgba(170,150,255,0.5)', marginBottom: 4, textTransform: 'uppercase' }}>
            Performance
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: tierColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {currentFps}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(170,150,255,0.5)', letterSpacing: '0.1em' }}>FPS</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: tierColor, marginTop: 4, textTransform: 'uppercase', fontWeight: 600 }}>
            {currentFps > 0 ? currentTier : '—'}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(170,150,255,0.35)', marginTop: 6, letterSpacing: '0.12em' }}>
            PEAK: {peakFps.current} FPS
          </div>

          {/* ── Ranking tiers ── */}
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(130,100,255,0.15)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {([
              { min: 120, label: 'GOD MODE', color: '#c8ff00' },
              { min: 90,  label: 'ULTRA',    color: '#00e5a8' },
              { min: 60,  label: 'SMOOTH',   color: '#4488ff' },
              { min: 45,  label: 'DECENT',   color: '#ff9900' },
              { min: 30,  label: 'STRUGGLING', color: '#ff6633' },
              { min: 0,   label: 'PAIN',     color: '#ff3355' },
            ] as { min: number; label: string; color: string }[]).map(({ min, label, color }) => {
              const isActive = currentFps > 0 && getTier(currentFps).tier === label
              return (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: isActive ? 1 : 0.3,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  <span style={{ fontSize: 8, color, fontWeight: 700, letterSpacing: '0.05em', minWidth: 8 }}>
                    {isActive ? '▶' : '·'}
                  </span>
                  <span style={{ fontSize: 8, letterSpacing: '0.15em', color, fontWeight: isActive ? 700 : 400 }}>
                    {label}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 7, color: 'rgba(170,150,255,0.4)', letterSpacing: '0.08em' }}>
                    {min}+
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bottom label ──────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(170,150,255,0.2)',
            textAlign: 'right',
            lineHeight: 2,
          }}
        >
          <div>Flow Field Ribbons</div>
          <div style={{ color: 'rgba(170,150,255,0.1)' }}>Three.js TSL · Curl Noise · WebGPU · Bloom</div>
        </div>
      </div>
    </div>
  )
}
