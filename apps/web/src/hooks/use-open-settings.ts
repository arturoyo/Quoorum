/**
 * Hook para abrir el modal de configuración desde cualquier componente
 * 
 * Uso:
 * const openSettings = useOpenSettings()
 * openSettings('/settings/company') // Abre el modal en la sección de empresa
 */

'use client'

import { useRouter } from 'next/navigation'

export function useOpenSettings() {
  const router = useRouter()

  return (section: string = '/settings') => {
    // Navegar a /settings con la sección como query param
    // La página /settings abrirá el modal automáticamente con initialSection
    router.push(`/settings?section=${encodeURIComponent(section)}`)
  }
}
