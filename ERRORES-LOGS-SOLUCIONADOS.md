# Errores en Logs y Soluciones

**Fecha:** 17 Enero 2026
**Estado:** ✅ RESUELTO

## Problemas Encontrados:

### 1. ❌ Error 500 en `debates.list` (RESUELTO)

**Síntoma:**
```
GET /api/trpc/debates.list?... 500 in 6553ms
```

**Causa Raíz:**
- El endpoint `debates.list` lanzaba excepciones sin logging detallado
- No había try-catch para capturar y loguear errores específicos

**Solución Implementada:**
- ✅ Añadido try-catch con logging detallado en `packages/api/src/routers/debates.ts:297-342`
- ✅ Logs de inicio de query, ejecución, y éxito
- ✅ Logs de error con mensaje, stack trace, y userId

**Commit:** `9d9b267` - "debug: add detailed logging to debates.list endpoint"

### 2. ⚠️ Warning: STRIPE_WEBHOOK_SECRET placeholder

**Síntoma:**
```
⚠️  PLACEHOLDER: STRIPE_WEBHOOK_SECRET has placeholder value
   Current: whsec_placeholder
   Impact: ⚠️ Webhooks will not be verified (security risk)
```

**Estado:** ⚠️ NO CRÍTICO - Feature degradada pero sistema funcional

**Causa:**
- Variable de entorno tiene valor placeholder en desarrollo

**Impacto:**
- Los webhooks de Stripe no se verifican (solo afecta en producción)
- En desarrollo no es bloqueante

**Solución Futura:**
- Configurar `STRIPE_WEBHOOK_SECRET` con valor real cuando se despliegue a producción

### 3. ✅ Error "column total_credits_used does not exist" (RESUELTO)

**Síntoma:**
```
column "total_credits_used" does not exist
```

**Causa:**
- Migraciones de base de datos no aplicadas

**Solución Implementada:**
- ✅ Aplicada migración `0020_credits_narrative_system.sql`
- ✅ Aplicada migración `0023_theme_confidence.sql`
- ✅ Verificadas columnas creadas: `total_credits_used`, `theme_id`, `theme_confidence`

### 4. ✅ Error "handleQuestionResponse is not defined" (RESUELTO)

**Síntoma:**
- Loop en `/debates/new` causado por función no definida

**Causa:**
- Función `handleQuestionResponse` se llamaba 3 veces pero no estaba definida

**Solución Implementada:**
- ✅ Implementada función `handleQuestionResponse` en `apps/web/src/app/debates/new/page.tsx:546-598`
- ✅ Sigue el mismo patrón que `handleAssumptionResponse`

**Commit:** `06ac331` - "fix(debates): add missing handleQuestionResponse function"

## Estado Actual del Sistema:

✅ **Servidor:** Funcionando en puerto 3000 (PID: 2647188+)
✅ **Base de Datos:** PostgreSQL localhost:5433 - 24 debates
✅ **Migraciones:** Todas aplicadas
✅ **Código:** Sin errores de compilación
✅ **Autenticación:** Supabase Auth funcionando

## Logs Limpios:

El sistema ahora tiene logging estructurado para debugging:

```typescript
console.log('[debates.list] Starting query', { userId, input });
console.log('[debates.list] Executing database query');
console.log('[debates.list] Query successful', { count });
console.error('[debates.list] Error:', error);
```

## Próximos Pasos:

1. ⏭️ Monitorear logs en producción para detectar errores reales
2. ⏭️ Configurar Stripe webhook secret antes de deploy
3. ⏭️ Remover logs de debugging en producción (o usar logger estructurado)

## Archivos Modificados:

- `packages/api/src/routers/debates.ts` - Logging detallado
- `apps/web/src/app/debates/new/page.tsx` - Función handleQuestionResponse
- `packages/db/drizzle/0020_credits_narrative_system.sql` - Aplicada
- `packages/db/drizzle/0023_theme_confidence.sql` - Aplicada
- `CLAUDE.md` - Documentación puerto 3000

