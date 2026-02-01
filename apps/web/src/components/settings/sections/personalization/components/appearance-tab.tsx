'use client'

/**
 * AppearanceTab Component
 * Allows users to switch between light, dark, and system themes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle, useTheme } from '@/components/theme'

export function AppearanceTab() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <Card className="styles.colors.bg.secondary styles.colors.border.default">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary">Tema de la Aplicación</CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Selecciona cómo quieres que se vea Quoorum. Puedes elegir entre modo claro, oscuro, o dejar que el sistema decida automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Toggle */}
          <div className="space-y-4">
            <label className="text-sm font-medium styles.colors.text.secondary">
              Modo de visualización
            </label>
            <ThemeToggle showLabels />
          </div>

          {/* Current Theme Info */}
          <div className="pt-4 border-t styles.colors.border.default">
            <p className="text-sm styles.colors.text.tertiary">
              {theme === 'system'
                ? 'El tema se ajusta automáticamente según la configuración de tu sistema operativo.'
                : theme === 'dark'
                  ? 'Modo oscuro activado - Ideal para uso nocturno y reducir fatiga visual.'
                  : 'Modo claro activado - Ideal para ambientes con buena iluminación.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Appearance Options (future expansion) */}
      <Card className="styles.colors.bg.secondary styles.colors.border.default opacity-60">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary">Próximamente</CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Más opciones de personalización visual estarán disponibles pronto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm styles.colors.text.tertiary">
            <li>• Tamaño de fuente personalizable</li>
            <li>• Colores de acento</li>
            <li>• Densidad de la interfaz</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
