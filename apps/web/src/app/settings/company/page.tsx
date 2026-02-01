'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * DEPRECATED: Esta página redirige a /settings con la pestaña de empresa
 * 
 * El contenido de CompanySection ahora está en PersonalizationSection > CompanyTab
 * Esta ruta se mantiene para compatibilidad con enlaces antiguos
 */
export default function CompanySetupPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a /settings con la pestaña de empresa abierta
    router.push('/settings?section=/settings/company')
  }, [router])

  // Mostrar loading mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center styles.colors.bg.primary">
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
  )
}
