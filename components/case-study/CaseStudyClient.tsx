'use client'

import { useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { useLocale } from '@/components/providers/LocaleProvider'
import { CaseStudyStarfield } from './CaseStudyStarfield'
import {
  CaseStudyTransition,
  type CaseStudyTransitionHandle,
} from './CaseStudyTransition'
import type { CaseStudy } from '@/lib/case-studies'

// ─── Shared label row (line + mono uppercase) — same pattern as the home
//     sections (About / Services / Projects / Contact). ────────────────────────
function SectionLabel({ text, accent }: { text: string; accent?: string }) {
  return (
    <div
      className="flex items-center gap-3 mb-6"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <span
        className="inline-block w-6 h-[1px]"
        style={{ backgroundColor: accent ?? 'var(--text-muted)' }}
      />
      <span
        className="text-xs tracking-[0.3em] uppercase"
        style={{ color: accent ?? 'var(--text-muted)' }}
      >
        {text}
      </span>
    </div>
  )
}

// Word→letter nesting: words stay unbreakable, letters animate individually
// with the same 3D fall as the home hero.
function LetterSplit({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((word, wi) => (
        <span key={wi}>
          {wi > 0 && <span className="inline-block">&nbsp;</span>}
          <span
            className="inline-block whitespace-nowrap"
            style={{ perspective: '800px' }}
          >
            {word.split('').map((letter, i) => (
              <span
                key={i}
                className="cs-letter cs-anim inline-block"
                style={{ willChange: 'transform, opacity' }}
              >
                {letter}
              </span>
            ))}
          </span>
        </span>
      ))}
    </>
  )
}

export function CaseStudyClient({
  caseStudy,
  nextCaseStudy,
}: {
  caseStudy: CaseStudy
  nextCaseStudy: CaseStudy
}) {
  const mainRef = useRef<HTMLElement>(null)
  const topbarRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const line1Ref = useRef<HTMLHeadingElement>(null)
  const line2Ref = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const starsRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const pullBarRef = useRef<HTMLSpanElement>(null)
  const transitionRef = useRef<CaseStudyTransitionHandle>(null)
  const isLeavingRef = useRef(false)

  const router = useRouter()
  const { t, locale } = useLocale()

  useEffect(() => {
    if (!mainRef.current) return
    let ctx: { revert(): void } | undefined
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (!mainRef.current) return
        gsap.registerPlugin(ScrollTrigger)

        ctx = gsap.context(() => {
          const root = mainRef.current!

          if (reduced) {
            // CSS media query reveals .cs-anim and kills the curtain — just
            // flag ready and skip every tween.
            root.setAttribute('data-cs-ready', '')
            return
          }

          const line1Letters = line1Ref.current?.querySelectorAll('.cs-letter')
          const line2Letters = line2Ref.current?.querySelectorAll('.cs-letter')

          // 1. Hide the entrance cast before first reveal, then release the
          //    CSS pre-hide (same handshake as the home Hero).
          const hideTargets = [
            topbarRef.current,
            labelRef.current,
            metaRef.current?.children
              ? Array.from(metaRef.current.children)
              : [],
            starsRef.current,
            ...(line1Letters ? Array.from(line1Letters) : []),
            ...(line2Letters ? Array.from(line2Letters) : []),
          ]
            .flat()
            .filter(Boolean)
          gsap.set(hideTargets, { autoAlpha: 0 })
          root.setAttribute('data-cs-ready', '')

          // ── Entrance — content lands as the big-bang veil dissolves
          //    (opaque until ~0.7s, fully clear at ~1.3s). ──────────────────
          const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })

          tl.fromTo(
            labelRef.current,
            { x: -48, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: 0.8 },
            0.8,
          )

          if (line1Letters?.length) {
            tl.fromTo(
              line1Letters,
              { y: -110, autoAlpha: 0, rotateX: 90 },
              { y: 0, autoAlpha: 1, rotateX: 0, stagger: 0.03, duration: 0.9 },
              0.9,
            )
          }
          if (line2Letters?.length) {
            tl.fromTo(
              line2Letters,
              { y: 110, autoAlpha: 0, rotateX: -90 },
              { y: 0, autoAlpha: 1, rotateX: 0, stagger: 0.025, duration: 0.9 },
              1.1,
            )
          }

          if (metaRef.current) {
            tl.fromTo(
              metaRef.current.children,
              { y: 32, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.7 },
              1.4,
            )
          }

          tl.fromTo(
            topbarRef.current,
            { yPercent: -100, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 0.6 },
            1.55,
          )

          // The starfield fades up last, behind the settled text — the hero
          // sky the big bang leaves behind.
          tl.fromTo(
            starsRef.current,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 1.6, ease: 'power2.out' },
            1.45,
          )

          // ── Reading progress bar ──
          gsap.fromTo(
            progressRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: root,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.3,
              },
            },
          )

          // ── Hero text drifts up as you scroll away (home-hero parallax) ──
          gsap.to(heroContentRef.current, {
            y: '-18%',
            autoAlpha: 0.25,
            ease: 'none',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          })

          // ── Hero image slow vertical drift ──
          if (imageRef.current) {
            gsap.fromTo(
              imageRef.current,
              { yPercent: -6 },
              {
                yPercent: 6,
                ease: 'none',
                scrollTrigger: {
                  trigger: imageRef.current,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            )
          }

          // ── Scroll reveals ────────────────────────────────────────────
          // Curtain wipe on media blocks.
          gsap.utils
            .toArray<HTMLElement>('[data-reveal="clip"]')
            .forEach((el) => {
              const img = el.querySelector<HTMLElement>('.cs-clip-img')
              const delay = parseFloat(el.dataset.delay ?? '0')
              const clipTl = gsap.timeline({
                scrollTrigger: {
                  trigger: el,
                  start: 'top 88%',
                  toggleActions: 'play none none reverse',
                },
              })
              clipTl.fromTo(
                el,
                { clipPath: 'inset(100% 0% 0% 0%)' },
                {
                  clipPath: 'inset(0% 0% 0% 0%)',
                  duration: 1.1,
                  delay,
                  ease: 'power4.inOut',
                },
                0,
              )
              if (img) {
                clipTl.fromTo(
                  img,
                  { scale: 1.35 },
                  { scale: 1.15, duration: 1.5, ease: 'power3.out' },
                  delay + 0.1,
                )
              }
            })

          // Numbered process rows slide in from the left.
          gsap.utils
            .toArray<HTMLElement>('[data-reveal="row"]')
            .forEach((el) => {
              gsap.fromTo(
                el,
                { x: -48, autoAlpha: 0 },
                {
                  x: 0,
                  autoAlpha: 1,
                  duration: 0.8,
                  ease: 'expo.out',
                  scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none reverse',
                  },
                },
              )
            })

          // Grouped children rise with a stagger; .cs-mask-inner spans get a
          // masked line reveal on top (stat values).
          gsap.utils
            .toArray<HTMLElement>('[data-reveal-group]')
            .forEach((group) => {
              const trigger = {
                trigger: group,
                start: 'top 85%',
                toggleActions: 'play none none reverse' as const,
              }
              gsap.fromTo(
                group.children,
                { y: 56, autoAlpha: 0 },
                {
                  y: 0,
                  autoAlpha: 1,
                  stagger: 0.12,
                  duration: 1,
                  ease: 'expo.out',
                  scrollTrigger: trigger,
                },
              )
              const masks = group.querySelectorAll<HTMLElement>(
                '.cs-mask-inner',
              )
              if (masks.length) {
                gsap.fromTo(
                  masks,
                  { yPercent: 120 },
                  {
                    yPercent: 0,
                    stagger: 0.12,
                    duration: 1,
                    ease: 'expo.out',
                    scrollTrigger: trigger,
                  },
                )
              }
            })

          // Everything else: simple fade-up.
          gsap.utils.toArray<HTMLElement>('[data-reveal=""]').forEach((el) => {
            gsap.fromTo(
              el,
              { y: 50, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.9,
                ease: 'expo.out',
                scrollTrigger: {
                  trigger: el,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse',
                },
              },
            )
          })
        }, mainRef)
      },
    )

    return () => ctx?.revert()
  }, [])

  // ── Exit — the cosmic transition takes over (page → black → stars orbiting
  //    the planet → collapse → navigate); the destination page then detonates
  //    its entrance big bang, so both motions read as one continuous sequence.
  //    Falls back to a plain client navigation when the effect can't run. ──────
  const goTo = useCallback(
    (href: string) => {
      if (isLeavingRef.current) return
      isLeavingRef.current = true
      if (!transitionRef.current?.exitTo(href)) router.push(href)
    },
    [router],
  )

  const leaveTo = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      e.preventDefault()
      goTo(href)
    },
    [goTo],
  )

  // ── Scroll past the end → next case study. A wheel/touch accumulator arms
  //    at the very bottom of the page and fills the pull gauge; releasing the
  //    threshold fires the cosmic exit. ────────────────────────────────────────
  const nextHref = `/projects/${nextCaseStudy.slug}`
  useEffect(() => {
    const THRESHOLD = 480
    let acc = 0
    let lastPull = 0

    const setBar = (p: number) => {
      if (pullBarRef.current) {
        pullBarRef.current.style.transform = `scaleX(${p})`
      }
    }
    const atBottom = () => {
      const doc = document.scrollingElement ?? document.documentElement
      return window.innerHeight + window.scrollY >= doc.scrollHeight - 10
    }
    const bump = (delta: number) => {
      if (isLeavingRef.current) return
      if (!atBottom()) {
        if (acc) {
          acc = 0
          setBar(0)
        }
        return
      }
      acc = Math.max(0, acc + delta)
      lastPull = performance.now()
      const p = Math.min(1, acc / THRESHOLD)
      setBar(p)
      if (p >= 1) goTo(nextHref)
    }

    const onWheel = (e: WheelEvent) => bump(e.deltaY)

    let touchY = 0
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY
      bump((touchY - y) * 2.5)
      touchY = y
    }

    // Gauge slowly relaxes when the pull stops short of the threshold.
    const decay = window.setInterval(() => {
      if (acc > 0 && performance.now() - lastPull > 350) {
        acc *= 0.8
        if (acc < 6) acc = 0
        setBar(Math.min(1, acc / THRESHOLD))
      }
    }, 120)

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.clearInterval(decay)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [goTo, nextHref])

  const meta = [
    { label: t.caseStudy.client, value: caseStudy.client[locale] },
    { label: t.caseStudy.role, value: caseStudy.role[locale] },
    { label: t.caseStudy.year, value: caseStudy.year },
    { label: t.caseStudy.stack, value: caseStudy.stack.join(' · ') },
  ]

  return (
    <main ref={mainRef} data-cs-root style={{ background: 'var(--bg)' }}>
      {/* ── Top bar — slim fixed nav + reading progress ────────────────────── */}
      <div
        ref={topbarRef}
        className="cs-anim fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
          backdropFilter: 'blur(10px)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <Link
          href="/#projects"
          onClick={leaveTo('/#projects')}
          className="hover-underline font-mono text-[11px] tracking-[0.2em] uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          ← {t.caseStudy.back}
        </Link>
        {caseStudy.liveUrl && (
          <a
            href={caseStudy.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-underline font-mono text-[11px] tracking-[0.2em] uppercase"
            style={{ color: caseStudy.color }}
          >
            {t.caseStudy.visitSite} ↗
          </a>
        )}
        <span
          ref={progressRef}
          className="absolute bottom-[-1px] left-0 right-0 h-[2px] origin-left"
          style={{ backgroundColor: caseStudy.color, transform: 'scaleX(0)' }}
        />
      </div>

      {/* ── Hero — spatial starfield behind, like the home hero's 3D scene ── */}
      <header ref={headerRef} className="relative overflow-hidden">
        {/* Starfield + radial depth overlay, masked out toward the bottom */}
        <div
          ref={starsRef}
          className="cs-anim absolute inset-0 pointer-events-none"
          style={{
            maskImage:
              'linear-gradient(to bottom, black 0%, black 68%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 0%, black 68%, transparent 100%)',
          }}
        >
          <CaseStudyStarfield accent={caseStudy.color} />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 45%, transparent 0%, rgba(5,5,5,0.5) 100%)',
            }}
          />
        </div>

        <div
          ref={heroContentRef}
          className="relative z-10 pt-36 md:pt-44 pb-12 max-w-6xl mx-auto px-6"
        >
          <div ref={labelRef} className="cs-anim">
            <SectionLabel
              text={`${t.caseStudy.label} — ${caseStudy.year}`}
              accent={caseStudy.color}
            />
          </div>

          <h1
            ref={line1Ref}
            className="overflow-hidden font-display font-black uppercase leading-none tracking-[-0.02em]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 9vw, 7rem)',
              lineHeight: 0.9,
              color: 'var(--text)',
            }}
          >
            <LetterSplit text={caseStudy.title} />
          </h1>
          {/* Stroked second line — solid/stroke pairing used across the site */}
          <div
            ref={line2Ref}
            aria-hidden
            className="overflow-hidden font-display font-black uppercase leading-none tracking-[-0.02em]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 9vw, 7rem)',
              lineHeight: 0.9,
              WebkitTextStroke: '1px var(--text)',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            <LetterSplit text={caseStudy.titleStroke} />
          </div>

          {/* Meta grid */}
          <div
            ref={metaRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 mt-14 pt-8 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            {meta.map(({ label, value }) => (
              <div key={label} className="cs-anim flex flex-col gap-2">
                <span
                  className="font-mono text-[10px] tracking-[0.3em] uppercase"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {label}
                </span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text)' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Hero image — curtain wipe reveal + slow drift ──────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <div
          data-reveal="clip"
          className="relative overflow-hidden border aspect-16/10 md:aspect-video"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{ backgroundColor: caseStudy.color }}
          />
          <div
            ref={imageRef}
            className="cs-clip-img absolute inset-0 will-change-transform"
            style={{ scale: 1.15 }}
          >
            <Image
              src={caseStudy.image}
              alt={caseStudy.title}
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* ── 01 — The problem + who it was for ───────────────────────────────── */}
      <section className="section">
        <div className="max-w-4xl mx-auto px-6">
          <div data-reveal="">
            <SectionLabel text={`01 — ${t.caseStudy.problem}`} />
          </div>
          <div data-reveal-group className="flex flex-col gap-5 max-w-2xl mb-10">
            {caseStudy.problem[locale].map((p, i) => (
              <p
                key={i}
                className="text-base leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                {p}
              </p>
            ))}
          </div>
          <div
            data-reveal=""
            className="border-l-2 pl-6 md:pl-8 max-w-2xl"
            style={{ borderColor: caseStudy.color }}
          >
            <span
              className="font-mono text-[10px] tracking-[0.3em] uppercase block mb-2"
              style={{ color: caseStudy.color, fontFamily: 'var(--font-mono)' }}
            >
              {t.caseStudy.forWho}
            </span>
            <p
              className="text-base md:text-lg leading-relaxed"
              style={{ color: 'var(--text)' }}
            >
              {caseStudy.forWho[locale]}
            </p>
          </div>
        </div>
      </section>

      {/* ── 02 — Decisions made, and why ────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div data-reveal="">
            <SectionLabel text={`02 — ${t.caseStudy.decisions}`} />
          </div>

          <div className="flex flex-col gap-10">
            {caseStudy.decisions.map((d, i) => (
              <div
                key={i}
                data-reveal="row"
                className="flex flex-col gap-3 py-6 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-baseline gap-6">
                  <span
                    className="font-mono text-xs tracking-[0.3em] shrink-0"
                    style={{
                      color: caseStudy.color,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p
                    className="font-display font-bold text-lg md:text-xl leading-snug"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text)',
                    }}
                  >
                    {d.decision[locale]}
                  </p>
                </div>
                <p
                  className="text-sm md:text-base leading-relaxed pl-[3.25rem]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {d.why[locale]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery — main image + up to 2 extra shots; empty slots fall
             back to a placeholder tile ────────────────────────────────────── */}
      <section className="section">
        <div className="max-w-6xl mx-auto px-6">
          <div data-reveal="">
            <SectionLabel text={t.caseStudy.gallery} />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[caseStudy.image, ...(caseStudy.gallery ?? [])]
              .slice(0, 3)
              .map((src, i) => (
                <div
                  key={src}
                  data-reveal="clip"
                  data-delay={i > 0 ? String(0.12 * i) : undefined}
                  className="relative overflow-hidden border aspect-16/10"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--surface)',
                  }}
                >
                  <div className="cs-clip-img absolute inset-0 will-change-transform">
                    <Image
                      src={src}
                      alt={`${caseStudy.title} — ${String(i + 1).padStart(2, '0')}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 560px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            {Array.from({
              length: Math.max(0, 3 - 1 - (caseStudy.gallery?.length ?? 0)),
            }).map((_, i) => {
              const n = 2 + (caseStudy.gallery?.length ?? 0) + i
              return (
                <div
                  key={`placeholder-${n}`}
                  data-reveal="clip"
                  data-delay={String(0.12 * (i + 1))}
                  className="relative overflow-hidden border aspect-16/10 flex items-center justify-center"
                  style={{
                    borderColor: 'var(--border)',
                    background: `linear-gradient(135deg, ${caseStudy.color}22 0%, ${caseStudy.color}08 50%, var(--surface) 100%)`,
                  }}
                >
                  <span
                    className="font-mono text-[10px] tracking-[0.3em] uppercase"
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {String(n).padStart(2, '0')} — {t.caseStudy.placeholder}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 03 — What I chose not to do ─────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div data-reveal="">
            <SectionLabel text={`03 — ${t.caseStudy.notDone}`} />
          </div>
          <div className="flex flex-col gap-8">
            {caseStudy.notDone.map((n, i) => (
              <div
                key={i}
                data-reveal="row"
                className="flex flex-col gap-2 py-6 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <p
                  className="font-display font-bold text-lg md:text-xl leading-snug"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text)',
                  }}
                >
                  {n.choice[locale]}
                </p>
                <p
                  className="text-sm md:text-base leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {n.reason[locale]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 04 — What I'd measure ───────────────────────────────────────────── */}
      <section className="section">
        <div className="max-w-4xl mx-auto px-6">
          <div data-reveal="">
            <SectionLabel text={`04 — ${t.caseStudy.wouldMeasure}`} />
          </div>

          {/* Stat tiles — masked value reveal, same family as the About stats */}
          <div
            data-reveal-group
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10"
          >
            {caseStudy.wouldMeasure.map((stat) => (
              <div
                key={stat.label[locale]}
                className="flex flex-col gap-2 border-t pt-6"
                style={{ borderColor: 'var(--border-strong)' }}
              >
                <span className="block overflow-hidden">
                  <span
                    className="cs-mask-inner inline-block font-display text-4xl md:text-5xl font-black"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: caseStudy.color,
                      willChange: 'transform',
                    }}
                  >
                    {stat.value}
                  </span>
                </span>
                <span
                  className="font-mono text-xs tracking-widest uppercase"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {stat.label[locale]}
                </span>
              </div>
            ))}
          </div>

          <p
            data-reveal=""
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: 'var(--text-muted)' }}
          >
            {caseStudy.wouldMeasureBody[locale]}
          </p>
        </div>
      </section>

      {/* ── 05 — What I'd redo differently ──────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div data-reveal="">
            <SectionLabel text={`05 — ${t.caseStudy.wouldRedo}`} />
          </div>
          <blockquote
            data-reveal=""
            className="border-l-2 pl-6 md:pl-8 max-w-2xl"
            style={{ borderColor: caseStudy.color }}
          >
            <p
              className="text-lg md:text-xl leading-relaxed"
              style={{ color: 'var(--text)' }}
            >
              {caseStudy.wouldRedo[locale]}
            </p>
          </blockquote>
        </div>
      </section>

      {/* ── Next project ──────────────────────────────────────────────────── */}
      <section className="section">
        <div
          data-reveal=""
          className="max-w-6xl mx-auto px-6 text-center flex flex-col items-center gap-10"
        >
          <div
            className="flex items-center gap-3 justify-center"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span
              className="inline-block w-6 h-[1px]"
              style={{ backgroundColor: 'var(--text-muted)' }}
            />
            <span
              className="text-xs tracking-[0.3em] uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.caseStudy.nextProject}
            </span>
            <span
              className="inline-block w-6 h-[1px]"
              style={{ backgroundColor: 'var(--text-muted)' }}
            />
          </div>

          <Link
            href={nextHref}
            onClick={leaveTo(nextHref)}
            className="group block"
          >
            <span
              className="cs-next-title font-display font-black uppercase leading-none tracking-[-0.02em] break-words"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                lineHeight: 0.9,
                WebkitTextStroke: '1px var(--text)',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {nextCaseStudy.title}
            </span>
          </Link>

          {/* Pull gauge — fills when you keep scrolling at the very bottom,
              then fires the cosmic exit to the next case study. */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-40 h-[2px] overflow-hidden"
              style={{ background: 'var(--border-strong)' }}
            >
              <span
                ref={pullBarRef}
                className="block h-full w-full origin-left"
                style={{
                  transform: 'scaleX(0)',
                  background: 'var(--accent)',
                  transition: 'transform 120ms linear',
                }}
              />
            </div>
            <span
              className="font-mono text-[10px] tracking-[0.3em] uppercase"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {t.caseStudy.keepScrolling}
            </span>
          </div>

          <MagneticButton>
            <Link
              href="/"
              onClick={leaveTo('/')}
              className="inline-block px-8 py-4 font-mono text-sm tracking-widest uppercase border-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-[border-color,color] duration-300"
              style={{
                fontFamily: 'var(--font-mono)',
                borderColor: 'var(--border-strong)',
              }}
            >
              {t.caseStudy.backHome}
            </Link>
          </MagneticButton>
        </div>
      </section>

      {/* ── Cosmic page transition — big-bang entrance on mount, orbiting
             collapse on internal exits. ─────────────────────────────────────── */}
      <CaseStudyTransition ref={transitionRef} />

      <style>{`
        /* Pre-hide handshake — identical trick to the home hero. */
        [data-cs-root]:not([data-cs-ready]) .cs-anim {
          opacity: 0;
          visibility: hidden;
        }

        /* Next-project stroked title fills with the project color on hover.
           !important beats the inline stroke/fill declarations. */
        .cs-next-title {
          transition: -webkit-text-fill-color 0.5s ease, -webkit-text-stroke-color 0.5s ease;
        }
        .group:hover .cs-next-title {
          -webkit-text-fill-color: ${nextCaseStudy.color} !important;
          -webkit-text-stroke-color: ${nextCaseStudy.color} !important;
        }

        @media (prefers-reduced-motion: reduce) {
          [data-cs-root]:not([data-cs-ready]) .cs-anim {
            opacity: 1;
            visibility: visible;
          }
        }
      `}</style>
    </main>
  )
}
