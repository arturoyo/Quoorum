# 🚀 Setup del Sistema de Logging - Guía Rápida

## ✅ Lo que ya está implementado

### 1. **Schema de Base de Datos**
- ✅ `packages/db/src/schema/system-logs.ts` - Tabla system_logs con 11 columnas
- ✅ Enums: `log_level`, `log_source`
- ✅ 5 índices para búsqueda rápida
- ✅ Migración generada: `drizzle/0001_strange_iron_monger.sql`

### 2. **Backend API**
- ✅ `packages/api/src/routers/system-logs.ts` - Router tRPC completo
- ✅ Endpoints:
  - `create` - Insertar log individual
  - `createBatch` - Insertar múltiples logs (hasta 100)
  - `list` - Listar logs con filtros
  - `stats` - Estadísticas de logs
  - `deleteOld` - Limpieza de logs antiguos
- ✅ Integrado en appRouter

### 3. **Logger Backend**
- ✅ `packages/api/src/lib/system-logger.ts` - Sistema de logging con batch processing
- ✅ Batch queue: 50 logs, flush cada 5 segundos
- ✅ Flush inmediato para errores críticos
- ✅ Método `.measure()` para performance tracking

### 4. **Logger Frontend**
- ✅ `apps/web/src/lib/logger.ts` - Cliente de logging para React
- ✅ Auto-captura de errores no manejados
- ✅ Auto-captura de promesas rechazadas
- ✅ Flush antes de cerrar la página
- ✅ Batch queue: 20 logs, flush cada 10 segundos

### 5. **Dashboard de Admin**
- ✅ `apps/web/src/app/admin/logs/page.tsx` - UI completa
- ✅ Estadísticas en tiempo real
- ✅ Filtros avanzados (nivel, source, búsqueda, fechas)
- ✅ Vista expandible con stack traces
- ✅ Exportar a CSV
- ✅ Limpiar logs antiguos

### 6. **Documentación**
- ✅ `LOGGING.md` - Guía completa de uso
- ✅ `LOGGING_SETUP.md` - Este archivo

## 🔧 Pasos para Activar el Sistema

### Paso 1: Aplicar Migración a Supabase

```bash
cd packages/db
pnpm push
```

**Si falla por conexión:**
1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `packages/db/drizzle/0001_strange_iron_monger.sql`
3. Pégalo y ejecuta

### Paso 2: Verificar que la Tabla Existe

En Supabase SQL Editor:
```sql
SELECT * FROM system_logs LIMIT 1;
```

### Paso 3: Aplicar RLS Policies (Seguridad)

```sql
-- Habilitar RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Cualquiera puede insertar logs
CREATE POLICY "Logs insertable by anyone"
  ON system_logs FOR INSERT
  WITH CHECK (true);

-- Policy: Solo admins pueden ver logs
CREATE POLICY "Logs viewable by admins"
  ON system_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    )
  );

-- Policy: Solo super admins pueden eliminar
CREATE POLICY "Logs deletable by super_admins"
  ON system_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );
```

### Paso 4: Reemplazar Loggers Antiguos (Opcional)

#### Backend
```typescript
// ANTES
import { logger } from '@quoorum/api/lib/logger'
logger.info('Usuario creado', { userId })

// DESPUÉS
import { systemLogger } from '@quoorum/api/lib/system-logger'
systemLogger.info('Usuario creado', { userId })
```

#### Frontend
```typescript
// ANTES
import { logInfo, logError } from '@/lib/monitoring'
logInfo('Debate created', { debateId })
logError(error, { action: 'create' })

// DESPUÉS
import { logger } from '@/lib/logger'
logger.info('Debate created', { debateId })
logger.error('Failed to create debate', error, { action: 'create' })
```

### Paso 5: Acceder al Dashboard

1. Reinicia el servidor dev si está corriendo
2. Accede a: **http://localhost:3002/admin/logs**
3. Verifica que puedas ver la página (aunque sin datos aún)

### Paso 6: Test del Sistema

#### Test Backend
```typescript
// En cualquier router tRPC
import { systemLogger } from '@quoorum/api/lib/system-logger'

export const testRouter = router({
  testLog: publicProcedure.query(() => {
    systemLogger.info('Test log desde backend', { test: true })
    return { success: true }
  })
})
```

#### Test Frontend
```typescript
// En cualquier componente
import { logger } from '@/lib/logger'

function TestButton() {
  return (
    <button onClick={() => logger.info('Test log desde frontend')}>
      Test Logger
    </button>
  )
}
```

Luego ve a `/admin/logs` y verifica que aparezcan los logs.

## 📊 Estado Actual del Servidor

```bash
# Ver estado
tail -50 /c/Users/Usuario/AppData/Local/Temp/claude/C--Quorum/tasks/b8ee4de.output

# Ver puerto
grep "Local:" /c/Users/Usuario/AppData/Local/Temp/claude/C--Quorum/tasks/b8ee4de.output
```

Servidor actual: **http://localhost:3002**

## 🎯 Próximos Pasos Opcionales

### 1. Worker de Limpieza Automática

Crear `packages/workers/src/functions/cleanup-logs.ts`:
```typescript
import { inngest } from '../inngest'
import { db } from '@quoorum/db'
import { systemLogs } from '@quoorum/db/schema'
import { lte } from 'drizzle-orm'
import { systemLogger } from '@quoorum/api/lib/system-logger'

export const cleanupLogs = inngest.createFunction(
  { id: 'cleanup-logs' },
  { cron: '0 2 * * *' }, // Diario a las 2 AM
  async () => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30)

    const deleted = await db
      .delete(systemLogs)
      .where(lte(systemLogs.createdAt, cutoffDate))
      .returning({ id: systemLogs.id })

    systemLogger.info('Logs cleaned up', {
      deletedCount: deleted.length,
      olderThan: cutoffDate.toISOString()
    })

    return { deletedCount: deleted.length }
  }
)
```

### 2. Alertas de Logs Fatales

Crear notificaciones automáticas para errores críticos:
```typescript
import { systemLogger } from '@quoorum/api/lib/system-logger'
import { sendSlackNotification } from '@/lib/slack'

// Wrapper que alerta en fatals
export const alertLogger = {
  ...systemLogger,
  fatal: (message: string, error?: Error, metadata?: any) => {
    systemLogger.fatal(message, error, metadata)

    // Enviar alerta a Slack/Email
    void sendSlackNotification({
      channel: '#alerts',
      text: `🚨 FATAL ERROR: ${message}`,
      attachments: [{
        color: 'danger',
        fields: [
          { title: 'Error', value: error?.message },
          { title: 'Metadata', value: JSON.stringify(metadata) }
        ]
      }]
    })
  }
}
```

### 3. Dashboard Mejorado

Agregar gráficos con Recharts:
- Logs por hora (últimas 24h)
- Error rate timeline
- Top errores
- Distribución por source

## 🔍 Verificar Implementación

Checklist de verificación:

```bash
# 1. Schema existe
ls packages/db/src/schema/system-logs.ts

# 2. Router existe
ls packages/api/src/routers/system-logs.ts

# 3. Router exportado
grep "systemLogsRouter" packages/api/src/routers/index.ts

# 4. Router en appRouter
grep "systemLogs:" packages/api/src/index.ts

# 5. Logger backend existe
ls packages/api/src/lib/system-logger.ts

# 6. Logger frontend existe
ls apps/web/src/lib/logger.ts

# 7. Dashboard existe
ls apps/web/src/app/admin/logs/page.tsx

# 8. Migración generada
ls packages/db/drizzle/0001_strange_iron_monger.sql
```

Todos deberían existir ✅

## 💡 Uso Recomendado

### En routers tRPC:
```typescript
import { systemLogger } from '@quoorum/api/lib/system-logger'

export const debatesRouter = router({
  create: protectedProcedure
    .input(createDebateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const debate = await db.insert(debates).values({
          ...input,
          userId: ctx.userId
        })

        systemLogger.info('Debate created', {
          debateId: debate.id,
          userId: ctx.userId
        })

        return debate
      } catch (error) {
        systemLogger.error('Failed to create debate', error as Error, {
          userId: ctx.userId,
          input
        })
        throw error
      }
    })
})
```

### En componentes React:
```typescript
import { logger } from '@/lib/logger'

function CreateDebateButton() {
  const createDebate = api.debates.create.useMutation({
    onSuccess: (debate) => {
      logger.info('Debate created successfully', { debateId: debate.id })
    },
    onError: (error) => {
      logger.error('Failed to create debate', error)
    }
  })

  return <Button onClick={() => createDebate.mutate(data)}>Create</Button>
}
```

## 📞 Soporte

Si tienes problemas:
1. Revisa `LOGGING.md` para documentación completa
2. Verifica que la migración se aplicó correctamente en Supabase
3. Revisa logs de desarrollo en consola del navegador
4. Verifica que el servidor backend esté corriendo

---

**Creado:** 2026-01-13
**Estado:** ✅ Implementación Completa
**Falta:** Aplicar migración a Supabase
