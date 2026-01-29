/**
 * Test Mode Toggle Component
 * 
 * Permite habilitar/deshabilitar el modo test desde el dashboard
 * Solo visible en desarrollo
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function TestModeToggle() {
  const [isTestModeEnabled, setIsTestModeEnabled] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)

  useEffect(() => {
    // Solo mostrar en desarrollo
    setIsDevelopment(process.env.NODE_ENV !== 'production')
    
    // Verificar si el modo test está habilitado
    const checkTestMode = () => {
      const cookies = document.cookie.split(';')
      const testCookie = cookies.find(c => c.trim().startsWith('test-auth-bypass='))
      setIsTestModeEnabled(testCookie?.includes('test@quoorum.pro') ?? false)
    }
    
    checkTestMode()
    
    // Verificar cada segundo (para detectar cambios externos)
    const interval = setInterval(checkTestMode, 1000)
    return () => clearInterval(interval)
  }, [])

  const enableTestMode = () => {
    document.cookie = 'test-auth-bypass=test@quoorum.pro; path=/'
    setIsTestModeEnabled(true)
    toast.success('Modo test habilitado', {
      description: 'Ahora puedes acceder a rutas protegidas sin autenticación'
    })
    
    // Recargar después de un breve delay para aplicar los cambios
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const disableTestMode = () => {
    document.cookie = 'test-auth-bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setIsTestModeEnabled(false)
    toast.success('Modo test deshabilitado', {
      description: 'Ahora necesitarás autenticarte normalmente'
    })
    
    // Recargar después de un breve delay
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  // No mostrar en producción
  if (!isDevelopment) {
    return null
  }

  return (
    <Card className="border-purple-500/20 bg-purple-900/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-purple-400" />
              Modo Test (Desarrollo)
            </CardTitle>
            <CardDescription className="text-[#aebac1] mt-1">
              Permite acceder a rutas protegidas sin autenticación
            </CardDescription>
          </div>
          {isTestModeEnabled ? (
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          ) : (
            <XCircle className="h-6 w-6 text-[var(--theme-text-secondary)]" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white font-medium">
              Estado: {isTestModeEnabled ? 'Habilitado' : 'Deshabilitado'}
            </p>
            <p className="text-xs text-[#aebac1] mt-1">
              {isTestModeEnabled 
                ? 'Puedes acceder a /debates, /dashboard, etc. sin login'
                : 'Necesitas autenticarte para acceder a rutas protegidas'
              }
            </p>
          </div>
          {isTestModeEnabled ? (
            <Button
              onClick={disableTestMode}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500"
            >
              Deshabilitar
            </Button>
          ) : (
            <Button
              onClick={enableTestMode}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Habilitar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
