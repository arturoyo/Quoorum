/**
 * Logs Page - Redirects to Admin Modal
 * 
 * Esta página redirige a /admin con la sección de logs
 * La funcionalidad completa está integrada en el admin modal
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LogsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir al admin modal con la sección de logs
    router.replace('/admin/logs')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b141a]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
        <p className="text-[#aebac1]">Redirigiendo a Logs del Sistema...</p>
      </div>
    </div>
  )
}
