'use client'

import { useLocale } from '@/components/providers/LocaleProvider'
import type { Locale } from '@/lib/i18n/dictionaries'

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()

  const options: Locale[] = ['en', 'fr']

  return (
    <div
      className="relative flex items-center h-9 border font-mono text-[10px] tracking-[0.15em] uppercase select-none"
      style={{
        borderColor: 'var(--border-strong)',
        fontFamily: 'var(--font-mono)',
      }}
      role="group"
      aria-label="Language"
    >
      {options.map((opt) => {
        const isActive = locale === opt
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={isActive}
            onClick={() => setLocale(opt)}
            className="relative z-10 px-2.5 h-full transition-colors duration-300"
            style={{
              color: isActive ? 'var(--on-accent)' : 'var(--text-muted)',
              background: isActive ? 'var(--accent)' : 'transparent',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
