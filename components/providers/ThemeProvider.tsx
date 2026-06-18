'use client'

import { useEffect } from 'react'
import { ThemeProvider as NextThemeProvider } from 'next-themes'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Defer the cross-fade transition until after first paint so the initial
  // theme doesn't animate in. `theme-ready` gates the transition rule in CSS.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.documentElement.classList.add('theme-ready')
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange={false}
      themes={['light', 'dark']}
    >
      {children}
    </NextThemeProvider>
  )
}
