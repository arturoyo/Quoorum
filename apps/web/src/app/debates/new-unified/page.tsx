/**
 * NewUnifiedDebatePage
 * 
 * Main component for the unified Typeform-style debate creation flow.
 * Combines the best of /debates/new and /debates/new-v2.
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function NewUnifiedDebatePage() {
  // Redirigir a una URL con sessionId único si no hay uno en la URL
  const router = useRouter()
  
  React.useEffect(() => {
    const generateSessionId = () => {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID()
      }
      return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    }

    const getLastSessionId = () => {
      if (typeof window === 'undefined') return null
      return localStorage.getItem('quoorum-debate-creation-last-session')
    }

    const hasSavedState = (sessionId: string) => {
      if (typeof window === 'undefined') return false
      return localStorage.getItem(`quoorum-debate-creation-state-${sessionId}`) !== null
    }

    const lastSessionId = getLastSessionId()
    const sessionId = lastSessionId && hasSavedState(lastSessionId)
      ? lastSessionId
      : generateSessionId()
    let search = typeof window !== 'undefined' ? window.location.search : ''
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(search)
      if (!p.has('draft') && !p.has('retry') && p.get('new') !== '1') {
        search = search ? `${search}&new=1` : '?new=1'
      }
    }
    router.replace(`/debates/new-unified/${sessionId}${search}`)
  }, [router])
  
  // Mostrar loading mientras redirige
  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
      <div className="text-white">Cargando...</div>
    </div>
  )
}
