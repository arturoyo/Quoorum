'use client'

import { createContext, useContext, type ReactNode } from 'react'

export interface ContextHubProfile {
  name?: string | null
  email?: string | null
  role?: string
}

export interface ContextHubCompany {
  name?: string | null
  industry?: string | null
  size?: string | null
  description?: string | null
  context?: string | null
}

export interface ContextHubDepartment {
  id: string
  name: string
  type?: string | null
  description?: string | null
}

export interface ContextHubWorker {
  id: string
  name: string
  role?: string | null
  expertise?: string | null
}

export interface ContextHubFile {
  id: string
  name: string
  description?: string | null
  tags?: string | null
}

export interface UserContextHub {
  // Text version for AI prompts
  fullContextText: string

  // Structured data for UI
  profile: ContextHubProfile | null
  company: ContextHubCompany | null
  departments: ContextHubDepartment[]
  workers: ContextHubWorker[]
  knowledgeFiles: ContextHubFile[]
  expertCategories: string[]

  // Metadata
  isComplete: boolean
}

interface ContextHubContextType {
  contextHub: UserContextHub | undefined
  isLoading: boolean
  error?: Error | null
}

const ContextHubContext = createContext<ContextHubContextType | undefined>(undefined)

export function useContextHub() {
  const context = useContext(ContextHubContext)
  if (!context) {
    throw new Error('useContextHub must be used within ContextHubProvider')
  }
  return context
}

interface ContextHubProviderProps {
  children: ReactNode
  contextHub?: UserContextHub
  isLoading?: boolean
}

export function ContextHubProvider({ children, contextHub, isLoading = false }: ContextHubProviderProps) {
  return (
    <ContextHubContext.Provider value={{ contextHub, isLoading }}>
      {children}
    </ContextHubContext.Provider>
  )
}
