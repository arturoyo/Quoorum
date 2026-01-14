# 📊 Sistema de Logging Propio de Quoorum

Sistema de logging completamente independiente que almacena logs en Supabase sin depender de servicios de terceros como Sentry o PostHog.

## ✨ Características

- ✅ **Almacenamiento propio** - Logs en Supabase PostgreSQL
- ✅ **Sin costos externos** - No dependemos de Sentry/PostHog
- ✅ **Privacidad total** - Tus datos nunca salen de tu infraestructura
- ✅ **Batch processing** - Alta performance con inserciones por lotes
- ✅ **Dashboard completo** - Visualiza y filtra logs en tiempo real
- ✅ **Auto-captura de errores** - Frontend captura errores no manejados automáticamente
- ✅ **Búsqueda avanzada** - Filtra por nivel, source, usuario, fecha
- ✅ **Exportación** - Descarga logs en CSV
- ✅ **Limpieza automática** - Elimina logs antiguos para ahorrar espacio

## 📋 Niveles de Log

| Nivel   | Uso                                    | Color    |
| ------- | -------------------------------------- | -------- |
| `debug` | Información detallada para debugging   | Gris     |
| `info`  | Información general del sistema        | Azul     |
| `warn`  | Advertencias que no son errores        | Amarillo |
| `error` | Errores manejables                     | Rojo     |
| `fatal` | Errores críticos que requieren acción  | Púrpura  |

## 🚀 Uso en Backend (API/Workers)

```typescript
import { systemLogger } from '@quoorum/api/lib/system-logger'

// INFO: Operaciones exitosas
systemLogger.info('Usuario creado exitosamente', { userId: '123' })

// WARN: Advertencias
systemLogger.warn('Rate limit cercano', { userId: '123', usage: 95 })

// ERROR: Errores con stack trace
try {
  await createUser(data)
} catch (error) {
  systemLogger.error('Error al crear usuario', error as Error, {
    userId: '123',
    data: { email: data.email }
  })
}

// FATAL: Errores críticos (flush inmediato)
systemLogger.fatal('Database connection lost', error)

// PERFORMANCE: Medir duración de operaciones
const result = await systemLogger.measure(
  'Process payment',
  async () => await processPayment(orderId),
  { orderId, userId }
)
```

### Configurar Source y UserId

```typescript
// Worker
systemLogger.setSource('worker')
systemLogger.setUserId(null)

// Con contexto específico
const workerLogger = systemLogger.withContext({
  source: 'worker',
  userId: null
})

workerLogger.info('Job started', { jobId: '456' })
```

## 🌐 Uso en Frontend (React/Next.js)

```typescript
import { logger } from '@/lib/logger'

// INFO: Eventos normales
logger.info('Debate created', { debateId: '123' })

// TRACK: Analytics events
logger.track('button_clicked', { buttonId: 'create-debate' })

// ERROR: Errores con contexto
try {
  await api.debates.create.mutate(data)
} catch (error) {
  logger.error('Failed to create debate', error as Error, { data })
}

// Los errores no manejados se capturan automáticamente
```

### Auto-captura de Errores

El cliente captura automáticamente:
- ✅ `window.onerror` - Errores globales no manejados
- ✅ `window.onunhandledrejection` - Promesas sin catch
- ✅ `window.onbeforeunload` - Flush antes de cerrar la página

## 🎯 Dashboard de Admin

Accede al dashboard en: **http://localhost:3002/admin/logs**

### Características del Dashboard:

1. **Estadísticas en tiempo real**
   - Total de logs
   - Logs por nivel (debug, info, warn, error, fatal)
   - Logs por source (client, server, worker, cron)

2. **Filtros avanzados**
   - Por nivel (debug, info, warn, error, fatal)
   - Por source (client, server, worker, cron)
   - Por usuario (userId)
   - Búsqueda en mensajes
   - Rango de fechas

3. **Acciones**
   - Refrescar logs en tiempo real
   - Exportar a CSV
   - Limpiar logs antiguos (+30 días)

4. **Vista expandible**
   - Click en un log para ver detalles completos
   - Stack traces de errores
   - Metadata JSON completo

## 📊 Schema de la Tabla

```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  level log_level NOT NULL,
  source log_source NOT NULL,
  message TEXT NOT NULL,

  -- Context
  metadata JSONB,

  -- Error details
  error_name VARCHAR(255),
  error_message TEXT,
  error_stack TEXT,

  -- Performance
  duration_ms JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para búsqueda rápida
CREATE INDEX system_logs_user_id_idx ON system_logs(user_id);
CREATE INDEX system_logs_level_idx ON system_logs(level);
CREATE INDEX system_logs_source_idx ON system_logs(source);
CREATE INDEX system_logs_created_at_idx ON system_logs(created_at);
CREATE INDEX system_logs_user_level_created_idx ON system_logs(user_id, level, created_at);
```

## 🔄 Batch Processing

Los logs se procesan por lotes para optimizar performance:

### Backend
- **Max batch size:** 50 logs
- **Interval:** 5 segundos
- **Flush inmediato:** Errores críticos (error/fatal)

### Frontend
- **Max batch size:** 20 logs
- **Interval:** 10 segundos
- **Flush inmediato:** Errores críticos + beforeunload

## 🧹 Limpieza Automática

```typescript
// Manual: Eliminar logs > 30 días
const result = await api.systemLogs.deleteOld.mutate({
  olderThanDays: 30
})

console.log(`Eliminados ${result.deletedCount} logs`)
```

### Worker Automático (Recomendado)

Crear un cron job que ejecute limpieza diaria:

```typescript
// packages/workers/src/functions/cleanup-logs.ts
import { inngest } from '../inngest'
import { db } from '@quoorum/db'
import { systemLogs } from '@quoorum/db/schema'
import { lte } from 'drizzle-orm'

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

    return { deletedCount: deleted.length }
  }
)
```

## 📈 Análisis y Queries

### Logs más frecuentes

```sql
SELECT message, COUNT(*) as count
FROM system_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY message
ORDER BY count DESC
LIMIT 10;
```

### Errores por usuario

```sql
SELECT user_id, COUNT(*) as error_count
FROM system_logs
WHERE level IN ('error', 'fatal')
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY error_count DESC
LIMIT 10;
```

### Performance promedio por operación

```sql
SELECT
  message,
  AVG((metadata->>'durationMs')::numeric) as avg_duration_ms,
  COUNT(*) as count
FROM system_logs
WHERE metadata ? 'durationMs'
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY message
ORDER BY avg_duration_ms DESC
LIMIT 10;
```

## 🔒 Seguridad

### RLS Policies

Los logs tienen RLS habilitado con las siguientes políticas:

```sql
-- Cualquiera puede crear logs (incluso sin auth)
CREATE POLICY "Logs insertable by anyone"
  ON system_logs FOR INSERT
  WITH CHECK (true);

-- Solo admins pueden ver logs
CREATE POLICY "Logs viewable by admins"
  ON system_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    )
  );

-- Solo admins pueden eliminar logs
CREATE POLICY "Logs deletable by admins"
  ON system_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
  );
```

## 🚨 Alertas (Opcional)

Puedes configurar alertas para logs críticos:

```typescript
// Worker que monitorea logs fatales
export const alertOnFatal = inngest.createFunction(
  { id: 'alert-on-fatal' },
  { event: 'log/fatal' }, // Trigger manual
  async ({ event }) => {
    // Enviar email/Slack/etc.
    await sendSlackAlert({
      message: `🚨 Fatal error: ${event.data.message}`,
      error: event.data.errorMessage,
      userId: event.data.userId
    })
  }
)

// En el logger, trigger el evento
if (level === 'fatal') {
  await inngest.send({
    name: 'log/fatal',
    data: entry
  })
}
```

## 📊 Métricas Recomendadas

Monitorear estos KPIs en el dashboard:

1. **Error Rate** - % de logs error/fatal vs total
2. **Top Errors** - Errores más frecuentes en últimas 24h
3. **Performance** - Operaciones más lentas (durationMs)
4. **User Errors** - Usuarios con más errores
5. **Source Distribution** - % de logs por source

## 🔄 Migración desde Sentry/PostHog

Si ya usas Sentry o PostHog:

1. ✅ Mantén ambos sistemas en paralelo por 1 semana
2. ✅ Compara volumen y calidad de logs
3. ✅ Verifica que el dashboard cubra tus necesidades
4. ✅ Elimina Sentry/PostHog cuando estés confiado

### Mapeo de Sentry a SystemLogger

```typescript
// Antes (Sentry)
Sentry.captureException(error)
Sentry.captureMessage('User logged in', 'info')
Sentry.setUser({ id: userId })

// Después (SystemLogger)
systemLogger.error('Error description', error)
systemLogger.info('User logged in')
systemLogger.setUserId(userId)
```

## 💰 Estimación de Costos

### Almacenamiento
- **1 log** ≈ 500 bytes promedio
- **100,000 logs/día** ≈ 50 MB/día ≈ 1.5 GB/mes
- **Supabase Free Tier** = 500 MB database
- **Supabase Pro ($25/mes)** = 8 GB database

Con limpieza de logs > 30 días:
- **100,000 logs/día** → ~45 GB máximo
- Cabe en Supabase Pro sin problemas

### Comparación con Sentry

| Servicio       | Costo/mes  | Logs incluidos |
| -------------- | ---------- | -------------- |
| Sentry Team    | $26/mes    | 50,000 errors  |
| Sentry Business| $80/mes    | 100,000 errors |
| **Quoorum**    | **$0**     | **Ilimitado**  |

## 🎯 Roadmap

- [ ] Worker automático de limpieza (cron diario)
- [ ] Sistema de alertas (Slack/Email para fatals)
- [ ] Dashboard con gráficos de tendencias
- [ ] Rate limiting por IP para prevenir spam
- [ ] Compresión de logs antiguos
- [ ] Búsqueda full-text con índices GIN
- [ ] Export a formatos adicionales (JSON, Parquet)

---

**Fecha de creación:** 2026-01-13
**Versión:** 1.0.0
**Autor:** Sistema de Logging Propio - Quoorum
