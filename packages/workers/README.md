# @quoorum/workers

Background job workers para el sistema Quoorum usando Inngest.

## 🚀 Configuración

### Desarrollo Local

Para desarrollo local, **no necesitas configurar una API key de Inngest**. El sistema funciona en modo local:

1. Las variables `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` pueden estar vacías
2. Los workers se ejecutarán pero no enviarán eventos a Inngest cloud
3. Ideal para desarrollo sin dependencias externas

**Archivo `.env.local`:**

```env
# Inngest (Background Jobs) - Opcional en desarrollo
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

### Desarrollo con Inngest Dev Server (Recomendado para testing)

Si quieres probar los workers localmente con el Dev Server de Inngest:

1. Instalar Inngest CLI:
   ```bash
   npm install -g inngest-cli
   ```

2. Iniciar el Dev Server:
   ```bash
   inngest dev
   ```

   Esto abre http://localhost:8288 donde puedes ver los workers ejecutándose.

3. No necesitas configurar `INNGEST_EVENT_KEY` - el Dev Server se detecta automáticamente.

### Producción

Para producción necesitas configurar las API keys de Inngest:

1. Ve a https://app.inngest.com/
2. Crea una cuenta o inicia sesión
3. Obtén las keys desde "Settings → Keys"
4. Configura en `.env`:

```env
INNGEST_EVENT_KEY=tu_event_key_aqui
INNGEST_SIGNING_KEY=tu_signing_key_aqui
```

## 📦 Workers Disponibles

### Quoorum Workers

| Worker | Trigger | Descripción |
|--------|---------|-------------|
| `quoorumDebateCompleted` | `quoorum/debate.completed` | Procesa debate completado, genera reportes |
| `quoorumDebateFailed` | `quoorum/debate.failed` | Maneja fallos de debates, logging |
| `quoorumSendNotification` | `quoorum/send.notification` | Envía notificaciones por email/push |
| `quoorumWeeklyDigest` | `cron: 0 9 * * 1` | Resumen semanal los lunes 9am |
| `quoorumScheduledReportsWorker` | `cron: 0 0 * * *` | Reportes diarios a medianoche |
| `quoorumGenerateReport` | `quoorum/report.generate` | Genera reportes PDF bajo demanda |
| `quoorumExpertPerformanceUpdate` | `quoorum/expert.performance.update` | Actualiza métricas de expertos |

### Next.js Auto-Healer

| Worker | Trigger | Descripción |
|--------|---------|-------------|
| `nextjsAutoHealer` | `nextjs/error.detected` | Auto-reparación de errores comunes |
| `nextjsAutoHealerManual` | `nextjs/heal.manual` | Trigger manual de healing |

## 🔧 Uso

### Desde el código (trigger manual)

```typescript
import { inngest } from '@quoorum/workers/client'

// Trigger un worker
await inngest.send({
  name: 'quoorum/debate.completed',
  data: {
    debateId: 'debate-123',
    sessionId: 'session-456',
    userId: 'user-789',
  },
})
```

### Desde tRPC (recomendado)

Los workers ya están integrados en los routers tRPC relevantes:

```typescript
// En packages/api/src/routers/debates.ts
const result = await runDebate(...)

// Trigger automático después del debate
await inngest.send({
  name: 'quoorum/debate.completed',
  data: { debateId, sessionId, userId },
})
```

## 🧪 Testing

### Verificar que los workers se registran correctamente

1. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

2. Accede al endpoint de Inngest:
   ```
   http://localhost:3000/api/inngest
   ```

3. Deberías ver un JSON con la lista de workers registrados.

### Probar workers localmente

Con Inngest Dev Server corriendo:

1. Envía un evento de prueba desde el código:
   ```typescript
   await inngest.send({
     name: 'quoorum/debate.completed',
     data: { debateId: 'test-123' },
   })
   ```

2. Ve a http://localhost:8288 para ver la ejecución.

## 📊 Monitoreo en Producción

1. Ve a https://app.inngest.com/
2. Sección "Runs" → Ver todas las ejecuciones
3. Sección "Functions" → Ver workers registrados
4. Sección "Events" → Ver eventos enviados

## ⚠️ Troubleshooting

### Error: "401 Event key not found"

**Causa:** `INNGEST_EVENT_KEY` no está configurado o es inválido.

**Solución:**
- Desarrollo: Deja la variable vacía, el sistema funciona en modo local
- Producción: Configura la key correcta desde https://app.inngest.com/

### Error: "Worker no se ejecuta"

**Checklist:**
1. ✅ ¿El worker está registrado en `apps/web/src/app/api/inngest/route.ts`?
2. ✅ ¿El evento se está enviando con el nombre correcto?
3. ✅ ¿El servidor de desarrollo está corriendo?
4. ✅ ¿Inngest Dev Server está corriendo (si aplica)?

### Los workers no aparecen en Inngest Dashboard

**Causa:** El endpoint `/api/inngest` no está accesible desde internet.

**Solución en Vercel:**
1. Asegúrate de que el endpoint está deployado
2. Ve a Inngest Dashboard → "Apps"
3. Sincroniza la app manualmente
4. Verifica que la URL sea accesible: `https://tu-dominio.vercel.app/api/inngest`

## 📚 Recursos

- [Documentación Inngest](https://www.inngest.com/docs)
- [Inngest + Next.js](https://www.inngest.com/docs/learn/serving-inngest-functions#framework-next-js)
- [Dev Server](https://www.inngest.com/docs/local-development)
- [Dashboard](https://app.inngest.com/)

---

**Versión:** 1.0.0
**Última actualización:** Enero 2026
