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
  const [loaderDone, setLoaderDone] = useState(false)
  return (
    <LoaderContext.Provider value={{ loaderDone, setLoaderDone }}>
      {children}
    </LoaderContext.Provider>
  )
}

export const useLoader = () => useContext(LoaderContext)
