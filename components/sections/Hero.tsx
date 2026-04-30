'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { useLoader } from '@/components/providers/LoaderContext'

const Scene = dynamic(
  () => import('@/components/three/Scene').then((m) => m.Scene),
  { ssr: false, loading: () => <div className="canvas-placeholder" /> },
)

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const line1Ref = useRef<HTMLDivElement>(null)
  const line2Ref = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const { loaderDone } = useLoader()

  // Pre-hide all animated elements while loader runs
  useEffect(() => {
    if (!sectionRef.current) return
    import('gsap').then(({ gsap }) => {
      const targets = [
        labelRef.current,
        subtitleRef.current,
        ctaRef.current,
        ...(line1Ref.current ? Array.from(line1Ref.current.querySelectorAll('.hero-letter')) : []),
        ...(line2Ref.current ? Array.from(line2Ref.current.querySelectorAll('.hero-letter')) : []),
      ].filter(Boolean)
      if (targets.length) gsap.set(targets, { autoAlpha: 0 })
    })
  }, [])

  // Entrance animation — fires after loader signals completion
  useEffect(() => {
    if (!loaderDone || !sectionRef.current) return
    let ctx: { revert(): void } | undefined

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger)
        ctx = gsap.context(() => {
          const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

          // Label slides in from left
          tl.fromTo(
            labelRef.current,
            { x: -60, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: 0.8 },
            0.2,
          )

          // NGUYEN letters fall from top
          const nguyenLetters =
            line1Ref.current?.querySelectorAll('.hero-letter')
          if (nguyenLetters) {
            tl.fromTo(
              nguyenLetters,
              { y: -120, autoAlpha: 0, rotateX: 90 },
              { y: 0, autoAlpha: 1, rotateX: 0, stagger: 0.04, duration: 0.9 },
              0.5,
            )
          }

          // MINH letters rise from bottom
          const minhLetters = line2Ref.current?.querySelectorAll('.hero-letter')
          if (minhLetters) {
            tl.fromTo(
              minhLetters,
              { y: 120, autoAlpha: 0, rotateX: -90 },
              { y: 0, autoAlpha: 1, rotateX: 0, stagger: 0.05, duration: 0.9 },
              0.8,
            )
          }

          // Subtitle fade
          tl.fromTo(
            subtitleRef.current,
            { y: 30, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.7 },
            1.2,
          )

          // CTAs slide up
          tl.fromTo(
            ctaRef.current,
            { y: 40, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.7 },
            1.4,
          )

          // Scroll parallax on text
          gsap.to(textRef.current, {
            y: '-25%',
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          })
        }, sectionRef)
      },
    )

    return () => ctx?.revert()
  }, [loaderDone])

  const handleScroll = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative h-[100svh] flex items-center justify-center overflow-hidden bg-[var(--bg)]"
    >
      {/* Three.js 3D background */}
      <Scene />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, transparent 0%, rgba(5,5,5,0.6) 100%)',
        }}
      />

      {/* Hero text */}
      <div
        ref={textRef}
        className="relative z-10 text-center px-6 max-w-6xl mx-auto"
      >
        {/* Label */}
        <div
          ref={labelRef}
          className="flex items-center gap-3 justify-center mb-6"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span
            className="inline-block w-8 h-[1px]"
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <span
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: 'var(--accent)' }}
          >
            Creative Developer
          </span>
        </div>

        {/* NGUYEN */}
        <div
          ref={line1Ref}
          className="overflow-hidden"
          style={{ perspective: '800px' }}
        >
          <h1
            aria-label="NGUYEN"
            className="font-display text-[12vw] sm:text-[9.5vw] md:text-[8vw] font-black leading-none tracking-[-0.02em] uppercase"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text)',
              lineHeight: 0.9,
            }}
          >
            {'NGUYEN'.split('').map((l, i) => (
              <span
                key={i}
                className="hero-letter inline-block"
                style={{ willChange: 'transform, opacity' }}
              >
                {l}
              </span>
            ))}
          </h1>
        </div>

        {/* MINH — with accent stroke variant */}
        <div
          ref={line2Ref}
          className="overflow-hidden"
          style={{ perspective: '800px' }}
        >
          <h1
            aria-label="MINH"
            className="font-display text-[12vw] sm:text-[9.5vw] md:text-[8vw] font-black leading-none tracking-[-0.02em] uppercase"
            style={{
              fontFamily: 'var(--font-display)',
              WebkitTextStroke: '1px var(--text)',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              lineHeight: 0.9,
            }}
          >
            {'MINH'.split('').map((l, i) => (
              <span
                key={i}
                className="hero-letter inline-block"
                style={{ willChange: 'transform, opacity' }}
              >
                {l}
              </span>
            ))}
          </h1>
        </div>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="mt-8 text-base md:text-lg max-w-md mx-auto leading-relaxed"
          style={{
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Crafting immersive web experiences
          <br />
          with code & creativity.
        </p>

        {/* CTAs */}
        <div
          ref={ctaRef}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <MagneticButton>
            <button
              onClick={() => handleScroll('#projects')}
              className="group relative md:px-8 px-6 py-4 font-mono text-sm tracking-widest uppercase overflow-hidden border border-[var(--accent)] text-[var(--bg)] bg-[var(--accent)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="relative z-10">VIEW PROJECTS ↗</span>
              <span
                className="absolute inset-0 bg-transparent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 border border-[var(--accent)]"
                style={{ transformOrigin: 'left' }}
              />
            </button>
          </MagneticButton>

          <MagneticButton>
            <a
              href="/cv.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 font-mono text-sm tracking-widest uppercase border-2 border-white/20 text-[var(--text-muted)] hover:border-[var(--text)] hover:text-[var(--text)] transition-[border-color,color,opacity] duration-300"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              DOWNLOAD CV
            </a>
          </MagneticButton>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          SCROLL
        </span>
        <div
          className="w-px h-12 origin-top"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <div
            className="w-full bg-(--text-muted) origin-top animate-[scaleY_2s_ease-in-out_infinite]"
            style={{ height: '100%' }}
          />
        </div>
      </div>
    </section>
  )
}
