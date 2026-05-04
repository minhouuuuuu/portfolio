'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PianoCanvas } from '@/components/sections/PianoCanvas'

export default function NotFound() {
  const router = useRouter()
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0c]">
      <PianoCanvas />

      {!playing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[rgba(5,5,8,0.88)] backdrop-blur-sm">
          <p
            className="text-[11px] tracking-[0.3em] uppercase mb-4"
            style={{ color: 'rgba(218,190,150,0.4)', fontFamily: 'PP Neue Machina, monospace' }}
          >
            Erreur 404
          </p>

          <h1
            className="text-4xl md:text-6xl font-light text-center leading-tight mb-3"
            style={{
              color: '#f0e6d3',
              letterSpacing: '0.08em',
              fontFamily: 'PP Monument Extended, Georgia, serif',
              textShadow: '0 0 60px rgba(218,190,150,0.2)',
            }}
          >
            Page introuvable
          </h1>

          <p
            className="text-sm text-center max-w-xs leading-relaxed mb-12"
            style={{ color: 'rgba(218,190,150,0.45)', fontFamily: 'PP Neue Machina, monospace', letterSpacing: '0.05em' }}
          >
            Cette page n&apos;existe pas ou a été déplacée.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer"
              style={{
                color: 'rgba(218,190,150,0.7)',
                border: '1px solid rgba(218,190,150,0.2)',
                fontFamily: 'PP Neue Machina, monospace',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(218,190,150,1)'
                e.currentTarget.style.borderColor = 'rgba(218,190,150,0.5)'
                e.currentTarget.style.background = 'rgba(218,190,150,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(218,190,150,0.7)'
                e.currentTarget.style.borderColor = 'rgba(218,190,150,0.2)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              ← Revenir en arrière
            </button>

            <button
              onClick={() => setPlaying(true)}
              className="px-8 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer"
              style={{
                color: '#0a0a0c',
                background: 'rgba(218,190,150,0.85)',
                border: '1px solid rgba(218,190,150,0.85)',
                fontFamily: 'PP Neue Machina, monospace',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(218,190,150,1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(218,190,150,0.85)'
              }}
            >
              Jouer au piano →
            </button>
          </div>
        </div>
      )}

      {playing && (
        <>
          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 z-10 text-[10px] tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer px-4 py-2"
            style={{
              color: 'rgba(218,190,150,0.4)',
              border: '1px solid rgba(218,190,150,0.15)',
              fontFamily: 'PP Neue Machina, monospace',
              background: 'rgba(5,5,8,0.6)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(218,190,150,0.8)'
              e.currentTarget.style.borderColor = 'rgba(218,190,150,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(218,190,150,0.4)'
              e.currentTarget.style.borderColor = 'rgba(218,190,150,0.15)'
            }}
          >
            ← Quitter
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
            <p
              className="text-[10px] tracking-[0.15em] uppercase leading-relaxed"
              style={{ color: 'rgba(218,190,150,0.3)', fontFamily: 'PP Neue Machina, monospace' }}
            >
              Touches A S D F G H J K L ; &apos; &nbsp;&amp;&nbsp; W E T Y U O P
              <br />
              Drag pour tourner · Scroll pour zoomer · Clic sur les touches
            </p>
          </div>
        </>
      )}
    </div>
  )
}
