# 🔔 Sistema de Notificaciones - Unificación

> **Fecha:** 22 Enero 2026
> **Estado:** ✅ Completado
> **Autor:** Claude Code

---

## 📋 Resumen Ejecutivo

Se ha unificado el sistema de notificaciones eliminando duplicación de código y consolidando funcionalidad en un único router y sistema de preferencias.

### Problema Identificado

1. **Duplicación de Routers**:
   - `notifications.ts` (huérfano) - Solo 2 tipos de notificación
   - `quoorum-notifications.ts` (usado en frontend) - 10 tipos completos

2. **Duplicación de Settings**:
   - `notification_settings` - Tabla simple, 6 campos boolean
   - `quoorum_notification_preferences` - Tabla completa con canales por tipo

3. **Fallo Silencioso**: Las notificaciones podían fallar sin reportarse visiblemente

### Solución Implementada

**Sistema unificado basado en `quoorumNotifications`**

---

## 🔨 Cambios Realizados

### 1. Eliminación de Router Huérfano

**Archivo eliminado:**
- `packages/api/src/routers/notifications.ts` → `.deprecated`

**Motivo:** Nadie lo usaba en el frontend. Todo el sistema usa `api.quoorumNotifications`.

### 2. Migración de Funciones Útiles

**Nuevas funciones en `packages/api/src/routers/quoorum-notifications.ts`:**

```typescript
// Funciones helper exportadas
export async function notifyDebateCompleted(
  userId: string,
  debateId: string,
  consensusScore: number
): Promise<void>

export async function notifyDebateFailed(
  userId: string,
  debateId: string
): Promise<void>

// Ya existía
export async function sendForumNotification(params: {...}): Promise<void>
```

### 3. Actualización de Imports

**Archivos modificados:**
- `packages/api/src/index.ts` - Eliminado `notificationsRouter` del appRouter
- `packages/api/src/routers/index.ts` - Eliminado export

**Antes:**
```typescript
export const appRouter = router({
  notifications: notificationsRouter,        // ❌ Eliminado
  quoorumNotifications: quoorumNotificationsRouter, // ✅ Único
})
```

**Después:**
```typescript
export const appRouter = router({
  quoorumNotifications: quoorumNotificationsRouter, // ✅ Único sistema
})
```

### 4. Unificación en packages/quoorum

**Archivo actualizado:** `packages/quoorum/src/notifications.ts`

**Cambios:**
- `sendInAppNotification()` ahora usa `sendForumNotification()`
- `notifyQualityIssue()` ahora usa `sendForumNotification()`
- `notifyIntervention()` ahora usa `sendForumNotification()`

**Mejoras en logging:**
```typescript
// Antes
quoorumLogger.info('In-app notification created', { userId })

// Después
quoorumLogger.info('✅ In-app notification sent successfully', {
  userId,
  debateId: debate.sessionId,
  type: 'debate_completed',
})
```

### 5. Migración de Base de Datos

**Archivo creado:** `packages/db/drizzle/0031_deprecate_notification_settings.sql`

Marca `notification_settings` como DEPRECATED con comentarios SQL.

**NO se elimina inmediatamente** - grace period para verificar.

---

## 📊 Comparación Antes vs Después

### Routers de Notificaciones

| Aspecto | Antes | Después |
|---------|-------|---------|
| Routers expuestos | 2 (`notifications`, `quoorumNotifications`) | 1 (`quoorumNotifications`) |
| Tipos soportados | 2 vs 10 | 10 (unificado) |
| Funciones helper | Duplicadas | Unificadas |
| Frontend usa | Solo `quoorumNotifications` | ✅ Igual |

### Tablas de Preferencias

| Tabla | Estado | Uso |
|-------|--------|-----|
| `notification_settings` | ⚠️ DEPRECATED | No se usa |
| `quoorum_notification_preferences` | ✅ ACTIVA | Sistema único |

---

## 🎯 Beneficios

### 1. Menos Complejidad
- **1 router** en lugar de 2
- **1 sistema de preferencias** en lugar de 2
- Menos confusión para desarrolladores

### 2. Mejor Debugging
- Logs mejorados con emojis (✅ / ❌)
- Contexto completo en cada log
- Errores más visibles

### 3. Arquitectura Más Limpia
```
Antes:
packages/quoorum/src/notifications.ts
    ↓ (inserta directamente)
packages/db → quoorumNotifications

Después:
packages/quoorum/src/notifications.ts
    ↓ (usa función helper)
packages/api/routers/quoorum-notifications.ts
    ↓
packages/db → quoorumNotifications
```

### 4. Mejor Mantenibilidad
- Un solo lugar para actualizar lógica de notificaciones
- Validación centralizada (Zod en el router)
- Más fácil añadir canales (email, push) en el futuro

---

## 🔍 Verificación

### Checklist de Testing

- [ ] **Frontend funciona**: Verificar que `api.quoorumNotifications.list.useQuery()` sigue funcionando
- [ ] **Notificaciones se envían**: Completar un debate y verificar que aparece notificación
- [ ] **Logs son visibles**: Revisar consola del servidor para logs con ✅/❌
- [ ] **No errores de import**: `pnpm typecheck` pasa sin errores

### Comandos de Verificación

```bash
# 1. TypeCheck
pnpm typecheck

# 2. Lint
pnpm lint

# 3. Ver logs en tiempo real (cuando corres debates)
# Buscar líneas con "✅ In-app notification sent successfully"

# 4. Verificar en DB (cuando tengas debates completados)
docker exec quoorum-postgres psql -U postgres -d quoorum -c \
  "SELECT COUNT(*), type FROM quoorum_notifications GROUP BY type;"
```

---

## 🚀 Próximos Pasos (Futuro)

### Fase 2: Eliminar Tabla Deprecada

Después de verificar que no hay data importante:

```sql
-- Migration: 0032_drop_notification_settings.sql
DROP TABLE notification_settings CASCADE;
```

### Fase 3: Migrar Router de Settings

Eliminar `notificationSettingsRouter` y usar solo preferencias de quoorum.

### Fase 4: Implementar Email/Push

```typescript
// En sendForumNotification()
if (_prefs?.emailEnabled && params.type in _prefs.debateCompleted?.channels) {
  await sendEmail(...)
}
```

---

## 📝 Archivos Modificados

```
Modified:
  packages/api/src/index.ts
  packages/api/src/routers/index.ts
  packages/api/src/routers/quoorum-notifications.ts (+40 líneas)
  packages/quoorum/src/notifications.ts (refactor completo)

Deprecated:
  packages/api/src/routers/notifications.ts.deprecated

Created:
  packages/db/drizzle/0031_deprecate_notification_settings.sql
  docs/NOTIFICATION-SYSTEM-UNIFICATION.md (este documento)
```

---

## ❓ FAQ

**P: ¿Por qué no eliminamos `notification_settings` inmediatamente?**
R: Grace period. Si alguien tiene data ahí, queremos poder migrarla primero.

**P: ¿Afecta esto a los usuarios existentes?**
R: No. El frontend ya usaba solo `quoorumNotifications`.

**P: ¿Qué pasa con las notificaciones antiguas?**
R: Siguen en `quoorum_notifications`. No se pierde nada.

**P: ¿Cuándo se enviarán emails?**
R: Próxima fase. El código ya está preparado (TODO comments).

---

**Última actualización:** 22 Enero 2026
**Versión del sistema:** Post-unificación v1.0
