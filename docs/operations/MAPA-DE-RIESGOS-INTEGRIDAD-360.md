# 🔍 MAPA DE RIESGOS - AUDITORÍA DE INTEGRIDAD 360

> **Auditoría realizada:** 26 Dic 2024
> **Metodología:** Análisis de 3 gaps críticos mediante agentes especializados
> **Objetivo:** Garantizar que Wallie pueda manejar cierres de miles de euros sin pérdida de datos, amnesia, ni puntos ciegos

---

## 📋 RESUMEN EJECUTIVO

Wallie tiene **infraestructura sólida** (143 tablas, 35+ routers, RAG implementado) pero con **3 gaps críticos** que comprometen la integridad en producción de alto volumen:

| Gap                                 | Severidad  | Impacto en Negocio              | Estado                |
| ----------------------------------- | ---------- | ------------------------------- | --------------------- |
| **#1: Amplitud de Memoria**         | 🔴 CRÍTICO | Olvida contexto > 10 mensajes   | Límite hardcoded      |
| **#2: Sincronización de Identidad** | 🔴 CRÍTICO | Cliente duplicado cross-channel | Silos de datos        |
| **#3: Resiliencia de Workers**      | 🔴 CRÍTICO | Mensajes perdidos sin traza     | Sin Dead Letter Queue |

**Conclusión:** Sistema **NO PRODUCTION-READY** para cierres de Alto Ticket (>10.000€) hasta resolver estos gaps.

---

## 🧠 GAP #1: AMPLITUD DE MEMORIA (RAG vs HISTORY)

### Hallazgo Principal

El asistente de IA solo ve **los últimos 10 mensajes** en su contexto de prompt, independientemente de cuántos mensajes tenga la conversación completa.

### Mapa de Riesgos

| Flujo                       | Estado Actual                          | Punto de Ruptura                                            | Solución para la Perfección                             |
| --------------------------- | -------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| **Context Retrieval en AI** | Últimos 10 mensajes en prompt          | Conversaciones >10 turnos pierden contexto inicial          | Aumentar a 50+ mensajes con sliding window + compresión |
| **RAG Embeddings**          | Solo histórico importado               | Conversaciones en tiempo real NO se embeben automáticamente | Worker `real-time-embedding` que procesa cada mensaje   |
| **Memory Summarization**    | Se dispara al marcar como "leída"      | Solo últimos 20 mensajes resumidos                          | Aumentar a 50 mensajes + trigger automático cada 100    |
| **Hybrid RAG Search**       | ✅ Implementado correctamente          | Funcional pero limitado a historial importado               | Auto-embedding + índice HNSW optimizado                 |
| **Bible Knowledge**         | ✅ Biblias de Sales/Marketing/PostSale | Completamente funcional                                     | Expandir a biblias custom por usuario                   |

### Escenarios de Fallo Reales

#### Scenario 1: Negociación larga (>10 turnos)

```
Mensajes 1-10:  Discusión de precio inicial ✅ Visible
Mensajes 11-20: Cliente menciona necesidad especial ❌ NO visible
Mensajes 21-30: Acordamos solución ❌ NO visible
Mensaje 31:     Cliente pregunta "¿Cuál era la solución que acordamos?"

Resultado: IA responde sin contexto → ALUCINACIÓN
```

#### Scenario 2: Follow-up después de 1 semana

```
Conversación hace 7 días:
- Prometimos enviar presupuesto
- Cliente acepta esperar

Hoy el cliente dice: "¿Dónde está el presupuesto?"

Sin RAG: IA genera respuesta genérica ❌
Con RAG: IA busca embeddings históricos ✅ (si se importó)
```

### Archivos Críticos

- `packages/api/src/routers/ai.ts:235` → `.limit(10)` - LÍMITE DE MEMORIA
- `packages/ai/src/generate.ts:168` → `.slice(-10)` - DOBLE LIMITACIÓN
- `packages/workers/src/functions/conversation-analysis.ts:58` → `.limit(20)` - RESUMEN CORTO

### Métricas Actuales

| Métrica                       | Actual      | Ideal       | Gap     |
| ----------------------------- | ----------- | ----------- | ------- |
| Mensajes en prompt            | 10          | 50+         | -80%    |
| Auto-embedding en tiempo real | ❌ No       | ✅ Sí       | Crítico |
| Ventana de resumen            | 20 msgs     | 50 msgs     | -60%    |
| RAG client-specific           | ✅ 3 chunks | ✅ 5 chunks | Bueno   |

### Prioridad de Soluciones

#### P0: Bloqueante (1-2 días)

1. **Aumentar límite de 10 a 20 mensajes** en `generate.ts:168`
   - Cambio: `.slice(-20)`
   - Impacto: +100% contexto inmediato
   - Riesgo: Bajo (prompt ligeramente más largo)

2. **Documentar limitación en UI**
   - Tooltip: "Wallie recuerda los últimos 20 mensajes"
   - Feature request para plan Pro: Contexto ilimitado

#### P1: Crítico (1 sprint)

3. **Auto-embedding worker**

   ```typescript
   inngest.createFunction(
     { id: 'real-time-embedding', retries: 3 },
     { event: 'message/created' },
     async ({ event, step }) => {
       // Generar embedding
       const embedding = await generateEmbedding(event.data.content)

       // Guardar con deduplicación
       await db
         .insert(embeddings)
         .values({
           userId: event.data.userId,
           clientId: event.data.clientId,
           conversationId: event.data.conversationId,
           sourceType: 'message',
           sourceId: event.data.messageId,
           content: event.data.content,
           embedding,
         })
         .onConflictDoNothing()
     }
   )
   ```

4. **Aumentar ventana de resumen a 50**
   - `conversation-analysis.ts:58` → `.limit(50)`

#### P2: Importante (2-3 sprints)

5. **Sliding window compression**
   - Últimos 20: En "hot" memory (raw)
   - 21-50: En resumen (comprimido)
   - 51-200: En RAG embeddings
   - 201+: Archivo histórico

---

## 🔗 GAP #2: SINCRONIZACIÓN DE IDENTIDAD (OMNICANALIDAD)

### Hallazgo Principal

**WhatsApp, Email y LinkedIn son silos completamente separados.** Un cliente que escribe por WhatsApp y luego envía email aparece como 2 personas diferentes.

### Mapa de Riesgos

| Flujo                  | Estado Actual                             | Punto de Ruptura                         | Solución para la Perfección                        |
| ---------------------- | ----------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| **WhatsApp → Cliente** | Crea cliente solo por `phone`             | Email del mismo cliente no detectado     | Tabla `client_identities` con lookup cross-channel |
| **Email → Cliente**    | `emailThreads` SIN `clientId` FK          | Email queda huérfano sin cliente         | Agregar `clientId` FK + handler `email/received`   |
| **LinkedIn → Cliente** | Tabla `linkedinConversations` desacoplada | LinkedIn no se linkea con WhatsApp/Email | Unificar en `client_identities`                    |
| **Gmail Sync**         | Procesa emails pero no los linkea         | Emails quedan sin cliente asignado       | Implementar `findClientByEmail()` en worker        |
| **Inbox Unificado**    | UI muestra 3 canales juntos               | Datos separados, scoring dividido        | `enrichWithLinkedClients()` funcional              |
| **Deduplicación**      | ❌ No existe                              | Cliente duplicado manualmente            | Worker de merge detection (NLP/regex)              |

### Escenario de Horror: Cliente Fantasma Duplicado

```
Timeline de desastre:

Lunes 09:00
├─ Cliente escribe WhatsApp: +34612345678
└─ Crea: clients[uuid-123, phone='+34612345678']

Martes 14:00
├─ MISMO cliente envía email: juan@empresa.com
├─ emailThreads INSERT: {fromEmail: 'juan@empresa.com'}
├─ EVENT 'email/received' → ❌ NO HAY HANDLER
└─ Email queda sin clientId

Miércoles 10:00
├─ Usuario ve INBOX UNIFICADO:
│  ├─ WhatsApp: "Juan García" (+34612345678)
│  └─ Email: "Juan García" (juan@empresa.com)
└─ Piensa: ¿Son dos Juanes?

Jueves 15:00
├─ User crea cliente manual: "Juan - juan@empresa.com"
└─ CLIENTE DUPLICADO: uuid-123 vs uuid-456

Viernes 09:00
├─ Report: "3 clientes llamados Juan García"
├─ Scoring: Dividido entre 2 registros (impreciso)
├─ Pipeline: Juan aparece 2 veces
└─ Automation: Email triggered 2 veces ❌
```

### Archivos Críticos

- `packages/db/src/schema/email.ts` → `emailThreads` SIN `clientId` FK
- `packages/whatsapp/src/service.ts:95-107` → Solo `findClientByPhone()`
- `packages/workers/src/functions/gmail-sync.ts:158` → Dispara `email/received` pero sin handler
- `packages/workers/src/client.ts:28` → Evento definido pero NO procesado
- `packages/api/src/routers/inbox.ts:142` → `enrichWithLinkedClients()` vacío

### Matriz de Canales

| Canal           | Tabla Principal         | Lookup Field | clientId Presente | Deduplicación        |
| --------------- | ----------------------- | ------------ | ----------------- | -------------------- |
| WhatsApp        | `conversations`         | `phone`      | ✅ Sí             | Por phone exacto     |
| Email (Gmail)   | `emailThreads`          | `fromEmail`  | ❌ **NO**         | Por threadId (Gmail) |
| Email (Outlook) | `emailThreads`          | `fromEmail`  | ❌ **NO**         | Por threadId         |
| LinkedIn        | `linkedinConversations` | `profileId`  | ❌ **NO**         | Desacoplado          |
| SMS             | (No implementado)       | —            | —                 | —                    |

### Prioridad de Soluciones

#### P0: Bloqueante (2-3 días)

1. **Agregar `clientId` a `emailThreads`**

   ```typescript
   // Migration
   await db.schema
     .alterTable('email_threads')
     .addColumn('client_id', 'uuid', (col) => col.references('clients.id').onDelete('set null'))
     .execute()
   ```

2. **Implementar handler `email/received`**

   ```typescript
   export const emailReceived = inngest.createFunction(
     { id: 'email-received', retries: 3 },
     { event: 'email/received' },
     async ({ event, step }) => {
       const { userId, fromEmail, emailThreadDbId } = event.data

       // Buscar cliente por email
       const [client] = await db
         .select()
         .from(clients)
         .where(and(eq(clients.email, fromEmail), eq(clients.userId, userId)))
         .limit(1)

       if (client) {
         // Linkear email con cliente existente
         await db
           .update(emailThreads)
           .set({ clientId: client.id })
           .where(eq(emailThreads.id, emailThreadDbId))
       } else {
         // Crear cliente nuevo (opcional, solo para leads)
         const [newClient] = await db
           .insert(clients)
           .values({
             userId,
             email: fromEmail,
             name: event.data.fromName,
             lastChannel: 'email',
           })
           .returning()

         await db
           .update(emailThreads)
           .set({ clientId: newClient.id })
           .where(eq(emailThreads.id, emailThreadDbId))
       }
     }
   )
   ```

3. **Implementar `findClientByEmail()` en WhatsApp service**

   ```typescript
   private async findClientByEmail(email: string, userId: string) {
     const [client] = await db.select()
       .from(clients)
       .where(and(
         eq(clients.email, email),
         eq(clients.userId, userId)
       ))
       .limit(1)

     return client ?? null
   }
   ```

#### P1: Crítico (1 sprint)

4. **Tabla `client_identities`**

   ```typescript
   export const clientIdentities = pgTable(
     'client_identities',
     {
       id: uuid('id').primaryKey().defaultRandom(),
       clientId: uuid('client_id')
         .notNull()
         .references(() => clients.id, { onDelete: 'cascade' }),

       identityType: text('identity_type').notNull(),
       // 'whatsapp_phone', 'email', 'linkedin_id', 'instagram_handle'

       identityValue: text('identity_value').notNull(),

       verifiedAt: timestamp('verified_at'),
       confidence: real('confidence').default(1.0), // 0-1
       source: text('source'), // 'manual', 'auto_detected', 'imported'

       createdAt: timestamp('created_at').defaultNow().notNull(),
     },
     (table) => ({
       uniqueIdentity: unique('unique_identity').on(
         table.clientId,
         table.identityType,
         table.identityValue
       ),
     })
   )
   ```

5. **Merge detection worker**

   ```typescript
   inngest.createFunction(
     { id: 'detect-duplicate-clients', retries: 2 },
     { cron: '0 2 * * *' }, // Diario a las 2 AM
     async ({ step }) => {
       // Buscar duplicados por:
       // 1. Mismo phone + email (diferentes UUIDs)
       // 2. Mismo nombre normalizado + similar company
       // 3. Similitud NLP de conversaciones

       const duplicates = await db.execute(sql`
         SELECT c1.id as id1, c2.id as id2, c1.name, c1.phone, c1.email
         FROM clients c1
         INNER JOIN clients c2 ON
           c1.user_id = c2.user_id AND
           c1.id < c2.id AND
           (
             (c1.phone = c2.phone AND c1.phone IS NOT NULL) OR
             (c1.email = c2.email AND c1.email IS NOT NULL)
           )
       `)

       // Notificar al usuario para merge manual
       for (const dup of duplicates.rows) {
         await inngest.send({
           name: 'admin/duplicate-client-detected',
           data: { clientId1: dup.id1, clientId2: dup.id2 },
         })
       }
     }
   )
   ```

#### P2: Importante (2-3 sprints)

6. **Implementar `enrichWithLinkedClients()` real**
7. **LinkedIn + Instagram integration**
8. **UI de merge manual con preview**

---

## ⚙️ GAP #3: RESILIENCIA DE WORKERS (ERROR HANDLING)

### Hallazgo Principal

Después de 3 reintentos fallidos, Inngest **descarta el evento sin dejar traza**. NO existe Dead Letter Queue para recuperar mensajes perdidos.

### Mapa de Riesgos

| Flujo                         | Estado Actual                                         | Punto de Ruptura                                             | Solución para la Perfección             |
| ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| **Failed Jobs Recovery**      | Retries: 3, luego discard                             | Evento perdido sin traza                                     | Tabla `failed_jobs` (Dead Letter Queue) |
| **JSON Parse en AI Response** | Sin try-catch en `emotion-analysis`, `persona-update` | IA responde JSON inválido → crash                            | Wrap con try-catch + validación Zod     |
| **inngest.send() Failures**   | Sin error handling                                    | `conversation-analysis` falla al enviar evento → silent fail | Retry logic con exponential backoff     |
| **Idempotencia**              | Solo 3/14 workers la implementan                      | Retry causa duplicados (broadcast 2x)                        | Upsert con unique constraints           |
| **Logging Coverage**          | 37 logs en 2,523 líneas (1.5%)                        | Imposible debuggear fallos                                   | Structured logging en TODOS los steps   |
| **Sentry Integration**        | Solo en `api/`, NO en `workers/`                      | Errores no se reportan a Sentry                              | Integrar Sentry en workers package      |
| **health-monitor**            | retries: 0                                            | Si falla 1 vez, se descarta                                  | Cambiar a retries: 3                    |

### Escenarios de Fallo Críticos

#### Scenario 1: Emotion Analysis Falla

```
1. Cliente envía: "Necesito esto para la semana que viene, ¿cuánto cuesta?"
2. inngest.send({ name: 'psychology/message.received', ... })
3. emotion-analysis worker inicia
4. Step 1 (analyze-with-openai): ✅ Análisis obtenido
5. Step 2 (store-emotion-data): ❌ DB error (network timeout)
6. Inngest retries:
   - Reintento 1: Falla
   - Reintento 2: Falla
   - Reintento 3: Falla
7. Después de 3 reintentos: ❌ EVENTO DESCARTADO

Resultado:
- intentScore nunca se calcula
- Cliente queda sin scoring
- Hot lead no detectado
- Sales team pierde oportunidad de €50k
```

#### Scenario 2: WhatsApp Broadcast Duplica

```
1. Campaña: 116 destinatarios, template "Oferta Black Friday"
2. Batch 1 (50 msgs): ✅ Enviados, DB actualizado
3. Batch 2 (50 msgs): ✅ Enviados, DB actualizado
4. Batch 3 (16 msgs): ✅ Mensajes enviados, ❌ DB update falla
5. Worker falla, Inngest retries
6. Retry re-envía Batch 3
7. 16 clientes reciben mensaje DUPLICADO
8. Complaints: "¿Por qué me envían 2 veces?"
```

#### Scenario 3: Gmail Sync Cascada

```
1. gmail-sync procesa 100 usuarios
2. Usuario #42: getUnreadMessages() → 20 emails
3. Email #15: inngest.send('email/received') FALLA
4. Worker continúa (no crash)
5. Emails 16-20 procesados
6. Email #15 queda en emailThreads SIN análisis
7. NO hay retry para ese email específico
8. Email nunca se analiza
```

### Archivos Críticos

- `packages/workers/src/functions/emotion-analysis.ts:207` → JSON.parse sin try-catch
- `packages/workers/src/functions/persona-update.ts:251` → JSON.parse sin try-catch
- `packages/workers/src/functions/conversation-analysis.ts:156` → inngest.send sin error handling
- `packages/workers/src/functions/health-monitor.ts:281` → retries: 0
- `packages/workers/src/functions/whatsapp-broadcast.ts:111-154` → Sin idempotencia

### Tabla de Resiliencia por Worker

| Worker                | Retries | Idempotencia | Logging    | Error Handling | Timeout  | DLQ |
| --------------------- | ------- | ------------ | ---------- | -------------- | -------- | --- |
| emotion-analysis      | 3       | ✅           | ⚠️ Parcial | ✅ Good        | ✅ 10s   | ❌  |
| persona-update        | 3       | ✅           | ❌ None    | ⚠️ Partial     | ✅ 10s   | ❌  |
| gmail-sync            | 2       | ✅           | ⚠️ Parcial | ⚠️ Partial     | ❌       | ❌  |
| whatsapp-broadcast    | 2       | ❌           | ❌ None    | ⚠️ Partial     | ❌       | ❌  |
| conversation-analysis | 3       | ❌           | ⚠️ Minimal | ⚠️ Partial     | ❌       | ❌  |
| audio-received        | 2       | ❌           | ✅ Good    | ✅ Good        | ⚠️ Fetch | ❌  |
| scoring-analysis      | 2       | ❌           | ❌ None    | ⚠️ Partial     | ❌       | ❌  |
| health-monitor        | **0**   | ❌           | ✅ Good    | ⚠️ Partial     | ✅ 10s   | ❌  |

### Prioridad de Soluciones

#### P0: Bloqueante (2-3 días)

1. **Crear Dead Letter Queue**

   ```typescript
   // Schema
   export const failedJobs = pgTable('failed_jobs', {
     id: uuid('id').primaryKey().defaultRandom(),
     inngestFunctionId: varchar('inngest_function_id', { length: 100 }).notNull(),
     eventName: varchar('event_name', { length: 100 }).notNull(),
     eventData: jsonb('event_data').notNull(),

     error: text('error').notNull(),
     stackTrace: text('stack_trace'),

     retryCount: integer('retry_count').notNull().default(0),
     maxRetries: integer('max_retries').notNull().default(3),
     lastRetryAt: timestamp('last_retry_at'),

     status: varchar('status', { length: 50 }).notNull().default('pending'),
     // 'pending', 'manual_review', 'fixed', 'ignored'

     createdAt: timestamp('created_at').notNull().defaultNow(),
     resolvedAt: timestamp('resolved_at'),
     resolvedBy: uuid('resolved_by').references(() => profiles.id),
   })

   // En cada worker crítico
   export const emotionAnalysis = inngest.createFunction(
     {...},
     {...},
     async ({ event, step }) => {
       try {
         // ... worker logic ...
       } catch (error) {
         // Log to DLQ
         await db.insert(failedJobs).values({
           inngestFunctionId: 'emotion-analysis',
           eventName: event.name,
           eventData: event.data,
           error: error.message,
           stackTrace: error.stack,
           retryCount: /* obtener de Inngest context */,
           maxRetries: 3,
         })

         throw error // Permitir que Inngest maneje retries
       }
     }
   )
   ```

2. **Wrap JSON.parse con try-catch**

   ```typescript
   // emotion-analysis.ts
   let result: EmotionAnalysisResult
   try {
     const parsed = JSON.parse(response.text || '{}')

     // Validar con Zod
     const validated = emotionAnalysisSchema.safeParse(parsed)
     if (!validated.success) {
       throw new Error(`Invalid AI response: ${validated.error}`)
     }

     result = validated.data
   } catch (parseError) {
     logger.error('Failed to parse AI response', parseError as Error, {
       messageId,
       rawResponse: response.text?.substring(0, 200),
     })

     // Fallback a valores por defecto
     result = {
       intentScore: 30,
       sentimentScore: 50,
       primaryEmotion: 'neutral',
       // ...
     }
   }
   ```

3. **Cambiar health-monitor a retries: 3**
   ```typescript
   retries: 3,  // Cambiar de 0 a 3
   ```

#### P1: Crítico (1 sprint)

4. **Integrar Sentry en workers**

   ```typescript
   // packages/workers/src/lib/logger.ts
   import * as Sentry from '@sentry/node'

   Sentry.init({
     dsn: process.env.SENTRY_DSN_WORKERS,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 0.1,
   })

   export function captureWorkerError(error: Error, context: Record<string, unknown>) {
     Sentry.captureException(error, {
       contexts: { worker: context },
     })
   }
   ```

5. **Agregar logging estructurado**

   ```typescript
   // En TODOS los workers, al inicio de cada step:
   logger.operation('step-started', {
     workerId: 'emotion-analysis',
     step: 'analyze-with-openai',
     messageId,
     conversationId,
   })

   // Al final del step:
   logger.operation('step-completed', {
     workerId: 'emotion-analysis',
     step: 'analyze-with-openai',
     messageId,
     durationMs,
   })

   // En errores:
   logger.error('step-failed', error, {
     workerId: 'emotion-analysis',
     step: 'analyze-with-openai',
     messageId,
     retryCount,
   })
   ```

6. **Idempotencia en whatsapp-broadcast**

   ```typescript
   // Antes de enviar, verificar:
   const [existing] = await db
     .select()
     .from(campaignRecipients)
     .where(
       and(
         eq(campaignRecipients.campaignId, campaignId),
         eq(campaignRecipients.recipientId, recipientId),
         isNotNull(campaignRecipients.sentAt)
       )
     )
     .limit(1)

   if (existing) {
     logger.info('Message already sent, skipping', {
       recipientId,
       sentAt: existing.sentAt,
     })
     continue
   }

   // Enviar mensaje
   ```

#### P2: Importante (2-3 sprints)

7. **Timeout en workers**

   ```typescript
   inngest.createFunction(
     {
       id: 'gmail-sync',
       retries: 2,
       timeout: 300000, // 5 minutos
     },
     ...
   )
   ```

8. **Worker status dashboard**
   - UI para ver `failed_jobs`
   - Botón "Retry" manual
   - Grafana/Sentry integration

---

## 🎯 ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Bloqueantes Críticos (Semana 1)

**Objetivo:** Sistema mínimamente funcional para Alto Ticket

| Tarea                                | Gap | Esfuerzo | Impacto |
| ------------------------------------ | --- | -------- | ------- |
| Aumentar límite de memoria a 20      | #1  | 2h       | Alto    |
| Agregar `clientId` a `emailThreads`  | #2  | 4h       | Crítico |
| Implementar handler `email/received` | #2  | 8h       | Crítico |
| Crear tabla `failed_jobs` (DLQ)      | #3  | 6h       | Crítico |
| Wrap JSON.parse con try-catch        | #3  | 4h       | Alto    |
| Cambiar health-monitor retries a 3   | #3  | 1h       | Medio   |

**Total:** ~3 días de trabajo

---

### Fase 2: Mejoras Críticas (Semana 2-3)

| Tarea                                     | Gap | Esfuerzo | Impacto |
| ----------------------------------------- | --- | -------- | ------- |
| Worker `real-time-embedding`              | #1  | 12h      | Alto    |
| Aumentar ventana de resumen a 50          | #1  | 2h       | Medio   |
| Tabla `client_identities`                 | #2  | 8h       | Alto    |
| Implementar `findClientByEmail()`         | #2  | 4h       | Alto    |
| Integrar Sentry en workers                | #3  | 6h       | Alto    |
| Logging estructurado en TODOS los workers | #3  | 16h      | Medio   |
| Idempotencia en whatsapp-broadcast        | #3  | 6h       | Alto    |

**Total:** ~1.5 semanas

---

### Fase 3: Optimizaciones (Semana 4-6)

| Tarea                                 | Gap | Esfuerzo | Impacto |
| ------------------------------------- | --- | -------- | ------- |
| Sliding window compression            | #1  | 16h      | Medio   |
| Merge detection worker                | #2  | 16h      | Medio   |
| `enrichWithLinkedClients()` funcional | #2  | 12h      | Medio   |
| Worker timeout configuration          | #3  | 4h       | Bajo    |
| Worker status dashboard               | #3  | 20h      | Medio   |

**Total:** ~2 semanas

---

## 🚨 CONCLUSIONES CRÍTICAS

### ¿Wallie está Production-Ready?

**Respuesta: NO para Alto Ticket (>10.000€)**

| Aspecto                | Estado Actual         | Requerido para Producción | Gap        |
| ---------------------- | --------------------- | ------------------------- | ---------- |
| **Memoria / Contexto** | 10 mensajes           | 50+ mensajes              | 🔴 CRÍTICO |
| **Omnicanalidad**      | Silos separados       | Identidad unificada       | 🔴 CRÍTICO |
| **Resiliencia**        | Sin DLQ               | Dead Letter Queue         | 🔴 CRÍTICO |
| **Error Handling**     | Inconsistente         | Try-catch en TODO         | 🔴 CRÍTICO |
| **Logging**            | 1.5% coverage         | >80% coverage             | 🟠 ALTO    |
| **Monitoring**         | Sin Sentry en workers | Sentry integrado          | 🟠 ALTO    |
| **Idempotencia**       | 3/14 workers          | 14/14 workers             | 🟠 ALTO    |

### Riesgos Comerciales

Si se lanza en producción sin resolver estos gaps:

1. **Cliente de €50k perdido** por amnesia de contexto → Olvida negociación clave
2. **Cliente duplicado** → Automation 2x, scoring dividido, UX confusa
3. **Hot lead no detectado** → emotion-analysis falla, intentScore nunca se calcula
4. **Email broadcast duplicado** → 116 clientes reciben mensaje 2x, complaints
5. **Conversación perdida** → gmail-sync falla, email nunca se analiza

**Costo de oportunidad estimado:** €200k-500k en primeros 6 meses si no se arregla.

### Recomendación Final

**NO LANZAR** hasta completar **Fase 1 (Bloqueantes Críticos)**.

**Timeline mínima:** 1 semana de desarrollo + 1 semana de testing = **2 semanas antes de producción**.

---

_Auditoría realizada por: Claude Code (Agentes Especializados)_
_CTO Approval Required: Sí_
_Next Review: Post-implementación Fase 1_
