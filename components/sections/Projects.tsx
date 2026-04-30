'use client'

import { useRef, useEffect } from 'react'
import { TiltCard } from '@/components/ui/TiltCard'
import { PERSONAL_INFO, PROJECTS } from '@/lib/constants'

export function Projects() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

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
            { y: 60, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.1,
              duration: 0.9,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: titleRef.current,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            },
          )

          // Horizontal scroll
          const track = trackRef.current!
          const cards = track.querySelectorAll('.project-card')
          const totalWidth = track.scrollWidth - window.innerWidth

          gsap.to(track, {
            x: () => -totalWidth,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: () => `+=${totalWidth + window.innerWidth * 0.5}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })

          // Individual card entrance (rotateY)
          cards.forEach((card) => {
            gsap.fromTo(
              card,
              { rotateY: 60, opacity: 0 },
              {
                rotateY: 0,
                opacity: 1,
                duration: 0.9,
                ease: 'expo.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'left 90%',
                  toggleActions: 'play none none reverse',
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
      className="relative overflow-hidden"
      style={{ background: 'var(--bg-2)' }}
    >
      {/* Title (not pinned, scrolls normally) */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
        <div ref={titleRef}>
          <div
            className="flex items-center gap-3 mb-6"
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
              SELECTED WORK
            </span>
          </div>
          <h2
            className="font-display text-5xl md:text-7xl font-black leading-none uppercase"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            PROJECTS
          </h2>
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="horizontal-scroll-container gap-6 pl-[max(2rem,calc((100vw-80rem)/2))] pr-[max(1.5rem,env(safe-area-inset-right))] pb-32 md:pb-16 pt-4"
          style={{ width: 'max-content' }}
        >
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number]
  index: number
}) {
  const isComingSoon = 'comingSoon' in project && project.comingSoon === true
  const projectLink = isComingSoon
    ? null
    : (project.link ?? PERSONAL_INFO.portfolio)

  const cardInner = (
    <TiltCard className={projectLink ? 'w-full h-full' : 'project-card shrink-0 w-[min(85vw,420px)] h-[520px]'}>
      <div
        className="relative w-full h-full overflow-hidden border border-(--border) group"
        style={{ background: 'var(--surface)' }}
      >
        {/* Project image / gradient */}
        <div
          className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${project.color}18 0%, ${project.color}08 50%, var(--surface) 100%)`,
          }}
        />

        {/* Color accent top bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ backgroundColor: project.color }}
        />

        {/* Number — large background */}
        <span
          className="absolute bottom-4 right-6 font-display text-[8rem] font-bold leading-none select-none pointer-events-none"
          style={{
            fontFamily: 'var(--font-display)',
            color: project.color,
            opacity: 0.06,
            lineHeight: 1,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
          {/* Top meta */}
          <div>
            <div
              className="font-mono text-xs tracking-[0.2em] uppercase mb-4"
              style={{ color: project.color, fontFamily: 'var(--font-mono)' }}
            >
              {project.year}
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
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
          </div>

          {/* Bottom content */}
          <div>
            <h3
              className="font-display text-3xl font-black mb-3 uppercase leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {project.title}
            </h3>
            <p
              className="text-sm leading-relaxed mb-6 max-w-[280px]"
              style={{ color: 'var(--text-muted)' }}
            >
              {project.description}
            </p>

            {isComingSoon || !projectLink ? (
              <span
                className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase border border-current py-2.5 px-5 opacity-50 cursor-default"
                style={{ color: project.color, fontFamily: 'var(--font-mono)' }}
              >
                SOON
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase border border-current py-2.5 px-5"
                style={{ color: project.color, fontFamily: 'var(--font-mono)' }}
              >
                VISIT ↗
              </span>
            )}
          </div>
        </div>
      </div>
    </TiltCard>
  )

  if (projectLink) {
    return (
      <a
        href={projectLink}
        target="_blank"
        rel="noopener noreferrer"
        className="project-card shrink-0 w-[min(85vw,420px)] h-[520px] block cursor-pointer"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {cardInner}
      </a>
    )
  }

  return cardInner
}
