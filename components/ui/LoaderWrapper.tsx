'use client'

import { useState, useEffect } from 'react'
import { PageLoader } from './PageLoader'
import { useLoader } from '@/components/providers/LoaderContext'

const COOKIE_NAME = 'loader_shown'
const OVERLAY_ID = 'ssr-loader-overlay'

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

function removeOverlay() {
  document.getElementById(OVERLAY_ID)?.remove()
}

export function LoaderWrapper({ children }: { children: React.ReactNode }) {
  const { setLoaderDone } = useLoader()
  const [showLoader, setShowLoader] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const alreadyShown = getCookie(COOKIE_NAME) === '1'
    if (alreadyShown) {
      setLoaderDone(true)
      setDone(true)
      // Returning visitor: drop the static black overlay immediately.
      removeOverlay()
    } else {
      setShowLoader(true)
      // The cinematic PageLoader's own fixed layer now covers the page,
      // so the static SSR overlay can be removed.
      removeOverlay()
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
