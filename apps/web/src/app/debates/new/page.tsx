/**
 * DEPRECATED: /debates/new
 *
 * This route is deprecated in favor of /debates/new-unified/
 * which provides a unified Typeform-style debate creation flow.
 *
 * This file only redirects to the new unified route.
 * Original implementation preserved in git history.
 */

'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function DeprecatedNewDebatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve any query params during redirect
    const search = searchParams.toString()
    const redirectUrl = search ? `/debates/new-unified?${search}` : '/debates/new-unified'
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
      <div className="text-white text-center">
        <p className="text-lg mb-2">Redirigiendo...</p>
        <p className="text-sm styles.colors.text.secondary">Esta ruta ha sido actualizada</p>
      </div>
    </div>
  )
}
