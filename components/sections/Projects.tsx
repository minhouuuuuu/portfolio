'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { TiltCard } from '@/components/ui/TiltCard'
import { PERSONAL_INFO, PROJECTS } from '@/lib/constants'
import { useLocale } from '@/components/providers/LocaleProvider'

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const { t, locale } = useLocale()

  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return
    let ctx: { revert(): void } | undefined

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger)
        ctx = gsap.context(() => {
          // Title reveal
          gsap.fromTo(
            titleRef.current?.children ?? [],
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.08,
              duration: 0.8,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            },
          )

          // Horizontal scroll — pin the section for exactly the scroll distance
          // needed to traverse the track. Both x and end recalculate on refresh.
          const track = trackRef.current!

          gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth),
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 10%',
              end: () => `+=${track.scrollWidth - window.innerWidth}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })

          // Per-card image parallax — the image drifts opposite to the track
          // motion so each card feels like it has depth as it scrolls past.
          const images = track.querySelectorAll<HTMLElement>(
            '[data-parallax-img]',
          )
          images.forEach((img) => {
            gsap.fromTo(
              img,
              { xPercent: -8 },
              {
                xPercent: 8,
                ease: 'none',
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: 'top 10%',
                  end: () => `+=${track.scrollWidth - window.innerWidth}`,
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              },
            )
          })
        }, sectionRef)
      },
    )

    return () => ctx?.revert()
  }, [])

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative"
      style={{ background: 'var(--bg-2)', height: '100vh', overflow: 'hidden' }}
    >
      {/* Title — absolute so it doesn't add to the section's scroll height */}
      <div
        ref={titleRef}
        className="absolute top-0 left-0 right-0 max-w-6xl mx-auto px-6 pt-10 md:pt-16 z-10 pointer-events-none"
      >
        <div
          className="flex items-center gap-3 mb-4"
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
            {t.projects.label}
          </span>
        </div>
        <h2
          className="font-display text-4xl md:text-6xl lg:text-7xl font-black leading-none uppercase"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t.projects.title}
        </h2>
      </div>

      {/* Horizontal scroll track — pushed below the pinned title so tall cards
          on short screens never overlap it. */}
      <div className="absolute inset-0 flex items-center overflow-hidden pt-32 md:pt-28 pb-6">
        <div
          ref={trackRef}
          className="flex gap-6 pl-[max(2rem,calc((100vw-80rem)/2))] pr-8"
          style={{ width: 'max-content' }}
        >
          {PROJECTS.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              locale={locale}
              visitLabel={t.projects.visit}
              soonLabel={t.projects.soon}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({
  project,
  locale,
  visitLabel,
  soonLabel,
}: {
  project: (typeof PROJECTS)[number]
  locale: 'en' | 'fr'
  visitLabel: string
  soonLabel: string
}) {
  const isComingSoon = 'comingSoon' in project && project.comingSoon === true
  const projectLink = isComingSoon
    ? null
    : (project.link ?? PERSONAL_INFO.portfolio)

  const description =
    typeof project.description === 'string'
      ? project.description
      : project.description[locale]
  const role =
    project.role && typeof project.role !== 'string'
      ? project.role[locale]
      : undefined

  const cardInner = (
    <TiltCard className="w-full h-full">
      <div
        className="relative w-full h-full flex flex-col overflow-hidden border group"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* ── Visual area — 16/10 ratio, but allowed to shrink so the card
            never overflows the viewport on short screens ─────────────── */}
        <div className="relative w-full overflow-hidden aspect-16/10 min-h-0 shrink">
          {project.image ? (
            <div
              data-parallax-img
              className="absolute inset-0 will-change-transform"
              style={{ scale: 1.18 }}
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 80vw, 560px"
                className="object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${project.color}33 0%, ${project.color}11 50%, var(--surface) 100%)`,
              }}
            />
          )}

          {/* Readability gradient at the bottom of the image */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, var(--surface) 4%, transparent 100%)',
            }}
          />

          {/* Color accent top bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] z-10"
            style={{ backgroundColor: project.color }}
          />
        </div>

        {/* ── Content area ────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col shrink-0 p-5 md:p-7 pb-6 md:pb-8">
          {/* Role / scope */}
          {role && (
            <span
              className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2"
              style={{ color: project.color, fontFamily: 'var(--font-mono)' }}
            >
              {role}
            </span>
          )}

          <h3
            className="font-display text-2xl md:text-3xl font-black mb-2 uppercase leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {project.title}
          </h3>

          <p
            className="text-sm leading-relaxed mb-5 line-clamp-3"
            style={{ color: 'var(--text-muted)' }}
          >
            {description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] tracking-wider px-2 py-1 border"
                style={{
                  fontFamily: 'var(--font-mono)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          {isComingSoon || !projectLink ? (
            <span
              className="inline-flex w-fit items-center gap-2 font-mono text-xs tracking-widest uppercase border border-current py-2.5 px-5 opacity-50 cursor-default"
              style={{ color: project.color, fontFamily: 'var(--font-mono)' }}
            >
              {soonLabel}
            </span>
          ) : (
            <span
              className="inline-flex w-fit items-center gap-2 font-mono text-xs tracking-widest uppercase border border-current py-2.5 px-5 transition-colors duration-300"
              style={{ color: project.color, fontFamily: 'var(--font-mono)' }}
            >
              {visitLabel} ↗
            </span>
          )}
        </div>
      </div>
    </TiltCard>
  )

  // Wider landscape-leaning cards on desktop to give the visuals room to breathe.
  // Height is capped to the viewport (leaving room for the pinned title); the image
  // shrinks to absorb the constraint so content/CTA stay visible without overflow.
  const sizeClasses =
    'project-card shrink-0 w-[min(82vw,360px)] md:w-[min(48vw,560px)] h-auto max-h-[min(78vh,620px)]'

  if (projectLink) {
    return (
      <a
        href={projectLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`${sizeClasses} block cursor-pointer`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {cardInner}
      </a>
    )
  }

  return <div className={sizeClasses}>{cardInner}</div>
}
