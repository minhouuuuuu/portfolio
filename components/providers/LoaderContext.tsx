'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface LoaderContextType {
  loaderDone: boolean
  setLoaderDone: (v: boolean) => void
}

const LoaderContext = createContext<LoaderContextType>({
  loaderDone: false,
  setLoaderDone: () => {},
})

export function LoaderProvider({ children }: { children: ReactNode }) {
  // No intro loader anymore — content is shown immediately, so the entrance
  // animations should be free to run from first mount.
  const [loaderDone, setLoaderDone] = useState(true)
  return (
    <LoaderContext.Provider value={{ loaderDone, setLoaderDone }}>
      {children}
    </LoaderContext.Provider>
  )
}

export const useLoader = () => useContext(LoaderContext)
