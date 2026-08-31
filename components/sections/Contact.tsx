'use client'

import { useRef, useEffect } from 'react'
import { GlitchText } from '@/components/ui/GlitchText'
import { MagneticButton } from '@/components/ui/MagneticButton'
import { PERSONAL_INFO } from '@/lib/constants'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ContactMap } from '@/components/sections/ContactMap'
import { track } from '@/lib/analytics'

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { t } = useLocale()

  useEffect(() => {
    if (!sectionRef.current) return
    let ctx: { revert(): void } | undefined

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger)
        ctx = gsap.context(() => {
          gsap.fromTo(
            contentRef.current?.children ?? [],
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.12,
              duration: 0.9,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: contentRef.current,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            },
          )
        }, sectionRef)
      },
    )

    return () => ctx?.revert()
  }, [])

  const socials = [
    { label: 'Github', href: PERSONAL_INFO.github },
    { label: 'LinkedIn', href: PERSONAL_INFO.linkedin },
    { label: 'Instagram', href: PERSONAL_INFO.instagram },
  ]

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[80vw] h-[80vw] rounded-full mesh-gradient"
          style={{
            background:
              'radial-gradient(circle, rgba(200,255,0,0.04) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <div
          className="absolute w-[60vw] h-[60vw] rounded-full mesh-gradient"
          style={{
            background:
              'radial-gradient(circle, rgba(123,97,255,0.04) 0%, transparent 70%)',
            top: '30%',
            left: '70%',
            transform: 'translate(-50%, -50%)',
            animationDelay: '3s',
          }}
        />
        <div
          className="absolute w-[50vw] h-[50vw] rounded-full mesh-gradient"
          style={{
            background:
              'radial-gradient(circle, rgba(255,107,53,0.03) 0%, transparent 70%)',
            top: '70%',
            left: '20%',
            transform: 'translate(-50%, -50%)',
            animationDelay: '1.5s',
          }}
        />
      </div>

      <div
        ref={contentRef}
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        {/* Label */}
        <div
          className="flex items-center gap-3 justify-center mb-8"
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
            {t.contact.label}
          </span>
          <span
            className="inline-block w-6 h-[1px]"
            style={{ backgroundColor: 'var(--text-muted)' }}
          />
        </div>

        {/* Giant headline */}
        <div className="w-full overflow-hidden">
          <h2
            className="font-display font-black leading-none uppercase"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.25rem, 8vw, 6rem)',
              lineHeight: 0.9,
            }}
          >
            {t.contact.line1}
          </h2>
          <h2
            className="font-display font-black leading-none uppercase"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.25rem, 8vw, 6rem)',
              lineHeight: 0.9,
              WebkitTextStroke: '1px var(--text)',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t.contact.line2}
          </h2>
        </div>

        {/* Email */}
        <div className="mt-12 mb-10">
          <a
            href={`mailto:${PERSONAL_INFO.email}`}
            onClick={() => track({ name: 'contact_click', method: 'email' })}
            className="font-mono text-base md:text-lg tracking-wider"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}
          >
            <GlitchText
              text={PERSONAL_INFO.email}
              intensity="medium"
              className="hover:text-[var(--text)] transition-colors duration-300"
            />
          </a>
        </div>

        {/* Dotted map — where I am + open across Europe */}
        <ContactMap />

        {/* Social links */}
        <div className="flex items-center justify-center gap-8 mb-16">
          {socials.map(({ label, href }) => (
            <MagneticButton key={label} strength={0.4}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm tracking-widest uppercase relative group"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                }}
              >
                {label} ↗
                <span
                  className="absolute -bottom-1 left-0 h-[1px] w-0 group-hover:w-full transition-all duration-400"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              </a>
            </MagneticButton>
          ))}
        </div>

        {/* Footer */}
        <p
          className="font-mono text-xs tracking-[0.2em] uppercase pb-4"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          {t.contact.footer}
        </p>
      </div>
    </section>
  )
}
