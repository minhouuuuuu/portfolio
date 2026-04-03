'use client'

import { useState } from 'react'
import { PageLoader } from './PageLoader'

export function LoaderWrapper({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false)
  return (
    <>
      {!done && <PageLoader onComplete={() => setDone(true)} />}
      {children}
    </>
  )
}
