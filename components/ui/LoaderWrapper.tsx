'use client'

import { useState, useEffect } from 'react'
import { PageLoader } from './PageLoader'
import { useLoader } from '@/components/providers/LoaderContext'

const COOKIE_NAME = 'loader_shown'

function getCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='))
    ?.split('=')[1]
}

function setCookie(name: string, value: string) {
  // Session cookie — expires when the browser is closed
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`
}

export function LoaderWrapper({ children }: { children: React.ReactNode }) {
  const { setLoaderDone } = useLoader()
  const [showLoader, setShowLoader] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const alreadyShown = getCookie(COOKIE_NAME) === '1'
    if (alreadyShown) {
      // Returning visitor: skip the loader, show content immediately.
      setLoaderDone(true)
      setDone(true)
    } else {
      setShowLoader(true)
    }
  }, [setLoaderDone])

  const handleComplete = () => {
    setCookie(COOKIE_NAME, '1')
    setDone(true)
  }

  return (
    <>
      {showLoader && !done && <PageLoader onComplete={handleComplete} />}
      {children}
    </>
  )
}
