'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  DICTIONARIES,
  DEFAULT_LOCALE,
  LOCALES,
  type Dictionary,
  type Locale,
} from '@/lib/i18n/dictionaries'

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  toggleLocale: () => void
  t: Dictionary
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  toggleLocale: () => {},
  t: DICTIONARIES[DEFAULT_LOCALE],
})

const STORAGE_KEY = 'portfolio-locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Resolve preferred locale on mount: stored choice → browser language → default.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && LOCALES.includes(stored)) {
      setLocaleState(stored)
      document.documentElement.lang = stored
      return
    }
    const browser = navigator.language?.toLowerCase().startsWith('fr')
      ? 'fr'
      : 'en'
    setLocaleState(browser)
    document.documentElement.lang = browser
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l
  }, [])

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === 'en' ? 'fr' : 'en'
      localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next
      return next
    })
  }, [])

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, toggleLocale, t: DICTIONARIES[locale] }}
    >
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = () => useContext(LocaleContext)
