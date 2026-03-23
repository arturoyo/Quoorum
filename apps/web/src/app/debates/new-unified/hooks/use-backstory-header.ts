/**
 * useBackstoryHeader Hook
 *
 * Provides dynamic title/subtitle for DebateStickyHeader based on user's backstory.
 * Falls back to random prompts if no backstory is configured.
 */

import { useMemo, useState, useEffect } from 'react'
import { api } from '@/lib/trpc/client'
import { getRandomDebatePrompt } from '@/lib/debate-prompts'

interface BackstoryHeader {
  title: string
  subtitle: string
  hasBackstory: boolean
}

// Static fallback to avoid hydration mismatch
const STATIC_FALLBACK = {
  title: '¿Qué decisión quieres tomar?',
  subtitle: 'Describe tu pregunta o decisión y te guiaremos paso a paso',
}

export function useBackstoryHeader(): BackstoryHeader {
  const { data: backstorySummary } = api.userBackstory.getSummary.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return useMemo(() => {
    // If user has backstory configured, use it
    if (backstorySummary?.backstory) {
      const { companyName, role, industry } = backstorySummary.backstory

      // Generate contextual title
      let title = 'Nuevo Debate'
      if (companyName) {
        title = `Debate para ${companyName}`
      } else if (role && industry) {
        const roleLabel = role.replace(/_/g, ' ')
        const industryLabel = industry.replace(/_/g, ' ')
        title = `Debate: ${roleLabel} en ${industryLabel}`
      }

      // Use summary as subtitle (format: "Role: founder | Company: Quoorum | ...")
      const subtitle = backstorySummary.summary || 'Configuración completa'

      return {
        title,
        subtitle,
        hasBackstory: true,
      }
    }

    // Fallback: Use static prompt on server/first render, random on client after mount
    // This prevents hydration mismatch from Math.random()
    if (!isMounted) {
      return {
        title: STATIC_FALLBACK.title,
        subtitle: STATIC_FALLBACK.subtitle,
        hasBackstory: false,
      }
    }

    const randomPrompt = getRandomDebatePrompt()
    return {
      title: randomPrompt.title,
      subtitle: randomPrompt.subtitle,
      hasBackstory: false,
    }
  }, [backstorySummary, isMounted])
}
