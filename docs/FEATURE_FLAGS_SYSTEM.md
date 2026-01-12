# Sistema de Feature Flags

Sistema completo para activar/desactivar funcionalidades por usuario, siguiendo la recomendación #8 de la auditoría.

## 📋 Componentes

### 1. Schema de Base de Datos

**Ubicación:** `packages/db/src/schema/feature-flags.ts`

```typescript
export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  flagKey: text('flag_key').notNull(), // 'voiceAI', 'coldCalling', etc.
  enabled: boolean('enabled').notNull().default(false),
  value: jsonb('value'), // Para flags no booleanos
  metadata: jsonb('metadata'), // Metadata adicional
  expiresAt: timestamp('expires_at'), // Para flags temporales
  // ... timestamps
})
```

### 2. Router tRPC

**Ubicación:** `packages/api/src/routers/feature-flags.ts`

**Endpoints disponibles:**

- `featureFlags.get` - Obtener estado de un flag
- `featureFlags.getAll` - Obtener todos los flags del usuario
- `featureFlags.set` - Establecer un flag (usuario actual)
- `featureFlags.adminList` - Listar flags (admin)
- `featureFlags.adminSet` - Establecer flag para cualquier usuario (admin)
- `featureFlags.adminDelete` - Eliminar flag (admin)

### 3. Hook React

**Ubicación:** `apps/web/src/hooks/use-feature-flag.ts`

**Hooks disponibles:**

- `useFeatureFlag(flagKey)` - Verificar si un flag está habilitado
- `useAllFeatureFlags()` - Obtener todos los flags
- `useSetFeatureFlag()` - Establecer un flag

### 4. Componente Guard

**Ubicación:** `apps/web/src/components/feature-flag-guard.tsx`

Componente para mostrar/ocultar contenido basado en feature flags.

## 🚀 Uso

### Ejemplo 1: Verificar flag en componente

```tsx
import { useFeatureFlag } from '@/hooks/use-feature-flag'

export function VoiceAISection() {
  const { enabled, isLoading } = useFeatureFlag('voiceAI')

  if (isLoading) return <Skeleton />
  if (!enabled) return null

  return <VoiceAIInterface />
}
```

### Ejemplo 2: Usar FeatureFlagGuard

```tsx
import { FeatureFlagGuard } from '@/components/feature-flag-guard'

export function SettingsPage() {
  return (
    <div>
      <GeneralSettings />

      <FeatureFlagGuard flagKey="voiceAI">
        <VoiceAISettings />
      </FeatureFlagGuard>

      <FeatureFlagGuard
        flagKey="coldCalling"
        fallback={<UpgradePrompt feature="Cold Calling" />}
      >
        <ColdCallingSettings />
      </FeatureFlagGuard>
    </div>
  )
}
```

### Ejemplo 3: Obtener todos los flags

```tsx
import { useAllFeatureFlags } from '@/hooks/use-feature-flag'

export function Dashboard() {
  const { flags, isLoading } = useAllFeatureFlags()

  if (isLoading) return <Skeleton />

  return (
    <div>
      {flags.voiceAI?.enabled && <VoiceAICard />}
      {flags.coldCalling?.enabled && <ColdCallingCard />}
      {flags.advancedAnalytics?.enabled && <AnalyticsCard />}
    </div>
  )
}
```

### Ejemplo 4: Establecer flag (usuario)

```tsx
import { useSetFeatureFlag } from '@/hooks/use-feature-flag'

export function BetaFeaturesToggle() {
  const { setFlag, isLoading } = useSetFeatureFlag()

  const handleToggle = async () => {
    await setFlag({
      flagKey: 'betaFeatures',
      enabled: true,
      metadata: { source: 'user-preference' },
    })
  }

  return (
    <Button onClick={handleToggle} disabled={isLoading}>
      Activar Beta Features
    </Button>
  )
}
```

### Ejemplo 5: Admin - Establecer flag para usuario

```tsx
// En panel de admin
import { api } from '@/lib/trpc'

export function AdminFeatureFlags() {
  const { mutateAsync } = api.featureFlags.adminSet.useMutation()

  const handleSetFlag = async (userId: string, flagKey: string) => {
    await mutateAsync({
      userId,
      flagKey,
      enabled: true,
      metadata: { reason: 'beta-test', source: 'admin' },
      expiresAt: new Date('2026-12-31'), // Flag temporal
    })
  }

  return (
    <div>
      {/* UI para gestionar flags */}
    </div>
  )
}
```

## 🔧 Migración de Base de Datos

Para aplicar el schema a la base de datos:

```bash
# Generar migración
pnpm db:generate

# Aplicar migración
pnpm db:push
```

## 📝 Casos de Uso

### 1. Beta Features
Activar funcionalidades experimentales para usuarios específicos.

### 2. A/B Testing
Activar diferentes versiones de features para grupos de usuarios.

### 3. Rollouts Graduales
Activar features progresivamente (10% → 50% → 100%).

### 4. Features Temporales
Activar features con fecha de expiración (ej: promociones).

### 5. Features por Plan
Combinar con sistema de planes para activar features premium.

## 🔐 Seguridad

- Los usuarios solo pueden ver/establecer sus propios flags
- Los admins pueden gestionar flags de cualquier usuario
- Los flags expirados se consideran automáticamente deshabilitados
- Validación con Zod en todos los endpoints

## ⚡ Performance

- Cache de 5 minutos en el frontend
- Refetch automático cada 10 minutos
- Invalidación automática del cache al actualizar flags
- Índices en `userId` y `flagKey` para consultas rápidas

## 🎯 Próximos Pasos

1. Crear panel de admin para gestionar flags
2. Añadir analytics de uso de flags
3. Integrar con sistema de notificaciones para nuevos flags
4. Añadir rollouts automáticos (porcentaje de usuarios)

