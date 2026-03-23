/**
 * Settings Context
 * Provides setCurrentSection function to child components when in modal mode
 */

'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface SettingsContextValue {
  setCurrentSection?: (section: string) => void
  isInModal?: boolean
}

const SettingsContext = createContext<SettingsContextValue>({})

export function SettingsProvider({ 
  children, 
  setCurrentSection, 
  isInModal 
}: { 
  children: ReactNode
  setCurrentSection?: (section: string) => void
  isInModal?: boolean
}) {
  return (
    <SettingsContext.Provider value={{ setCurrentSection, isInModal }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  return useContext(SettingsContext)
}
