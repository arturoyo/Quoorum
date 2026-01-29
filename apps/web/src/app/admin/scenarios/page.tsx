/**
 * Admin Scenarios Page
 * 
 * Redirects to Admin Modal with scenarios section
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminScenariosPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to admin modal with scenarios section
    router.replace('/admin/scenarios')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b141a]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
        <p className="text-[#aebac1]">Redirigiendo a Escenarios...</p>
      </div>
    </div>
  )
}
