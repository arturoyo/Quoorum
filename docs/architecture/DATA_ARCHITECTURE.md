# 🗄️ Arquitectura de Datos - Wallie Core (Supabase)

> **Documento para:** Arquitecto de Datos & Backend Senior
> **Última actualización:** 25 Dic 2025
> **Base de datos:** PostgreSQL 143 tablas en Supabase

---

## 📋 Índice

1. [Visión General](#-visión-general)
2. [Estado Actual (As-Is)](#-estado-actual-as-is)
3. [Flujo de Webhook → Clasificación](#-flujo-de-webhook--clasificación)
4. [Tablas Críticas](#-tablas-críticas)
5. [Sistema de Scoring](#-sistema-de-scoring)
6. [Puntos Ciegos Detectados](#-puntos-ciegos-detectados)
7. [Arquitectura Propuesta (To-Be)](#-arquitectura-propuesta-to-be)
8. [Plan de Implementación](#-plan-de-implementación)

---

## 🎯 Visión General

### Responsabilidades del Arquitecto de Datos

Como guardián de la **verdad de los datos**, tus responsabilidades son:

1. **Estructura de Datos**: Diseñar y optimizar tablas para recibir información del Miniserver
2. **Lógica de Negocio**: Procesar webhooks y decidir respuestas basadas en historial
3. **Seguridad (RLS)**: Blindar datos sensibles con políticas de Row Level Security
4. **Integración API**: Sincronizar tiempo real entre Miniserver y Frontend

### Regla de Oro

> **El Miniserver encuentra leads → El Core los clasifica**

---

## 📸 Estado Actual (As-Is)

### Resumen Ejecutivo

- ✅ **143 tablas** sincronizadas en Supabase
- ✅ **86 enums** personalizados (PostgreSQL)
- ✅ **Sistema de scoring** funcional con auto-clasificación
- ⚠️ **Psychology engine** implementado pero NO integrado en webhook flow
- 🔴 **Workers de análisis** faltantes (NLP sentiment/intent)
- 🔴 **Valores default** en scoring (no hay análisis real de mensajes)

### Paquetes Activos

| Paquete              | Propósito                             | Estado                          |
| -------------------- | ------------------------------------- | ------------------------------- |
| `packages/db/`       | Schemas Drizzle (13 dominios)         | ✅ Completo                     |
| `packages/whatsapp/` | Cloud API + Baileys híbrido           | ✅ Activo                       |
| `packages/api/`      | tRPC routers (35+ endpoints)          | ✅ Activo                       |
| `packages/workers/`  | Background jobs (12 workers)          | ⚠️ Psychology workers faltantes |
| `packages/ai/`       | Providers IA (OpenAI, Anthropic, etc) | ✅ Activo                       |

---

## 🔄 Flujo de Webhook → Clasificación

### Diagrama de Flujo Actual

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. MINISERVER (Baileys Worker)                                 │
│    • Recibe mensaje WhatsApp                                    │
│    • Normaliza datos                                            │
│    • POST /api/webhooks/baileys                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. WEBHOOK HANDLER                                              │
│    apps/web/src/app/api/webhooks/baileys/route.ts              │
│                                                                 │
│    • Valida x-service-secret                                    │
│    • Extrae payload { userId, message }                         │
│    • Llama whatsappService.processIncomingMessage()             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. WHATSAPP SERVICE                                             │
│    packages/whatsapp/src/service.ts:processIncomingMessage()    │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 3.1. Buscar/Crear Cliente                               │ │
│    │      • SELECT FROM clients WHERE phone = ? AND userId   │ │
│    │      • Si NULL → INSERT con pipelineStatus = 'lead'     │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 3.2. Obtener/Crear Conversación                         │ │
│    │      • SELECT FROM conversations WHERE clientId         │ │
│    │      • Si NULL → INSERT con channel = 'whatsapp'        │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 3.3. Almacenar Mensaje                                  │ │
│    │      • INSERT INTO messages (text, mediaUrl, etc)       │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 3.4. Actualizar Timestamps                              │ │
│    │      • UPDATE conversations.lastMessageAt               │ │
│    │      • UPDATE clients.lastContactAt                     │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 3.5. 🎯 DISPARO DE SCORING                              │ │
│    │      • recalculateClientScore(client.id).catch(...)     │ │
│    │      • Async, non-blocking                              │ │
│    └─────────────────────┬───────────────────────────────────┘ │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. SCORING SERVICE                                              │
│    packages/db/src/services/scoring.ts:recalculateClientScore() │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 4.1. Recopilar Estadísticas de Mensajes                │ │
│    │      • totalMessages: COUNT(*)                          │ │
│    │      • lastMessageAt: MAX(createdAt)                    │ │
│    │      • firstMessageAt: MIN(createdAt)                   │ │
│    │      • unreadCount: COUNT WHERE readAt IS NULL          │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 4.2. Calcular Scores Individuales                       │ │
│    │      • recencyScore (días desde último mensaje)         │ │
│    │      • messageFrequencyScore (totalMessages * 5)        │ │
│    │      • ⚠️ sentimentScore = 50 (HARDCODED DEFAULT)       │ │
│    │      • ⚠️ intentScore = 30 (HARDCODED DEFAULT)          │ │
│    │      • ⚠️ responseTimeScore = 50 (HARDCODED DEFAULT)    │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 4.3. Calcular Engagement Score                          │ │
│    │      • Weighted average con pesos:                      │ │
│    │        - responseTime: 20%                              │ │
│    │        - messageFrequency: 20%                          │ │
│    │        - sentiment: 15%                                 │ │
│    │        - intent: 25% (⚠️ más importante, pero default!) │ │
│    │        - recency: 20%                                   │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 4.4. Clasificar Temperatura                             │ │
│    │      • hot: engagement ≥70 + días ≤3 + intent ≥50       │ │
│    │      • warm: engagement ≥50 + días ≤14                  │ │
│    │      • cold: engagement ≥30 + días ≤60                  │ │
│    │      • very_cold: resto                                 │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 4.5. Calcular Closing Probability                       │ │
│    │      • probability = engagement/100 + (intent/100)*0.3  │ │
│    │      • ⚠️ Depende de intentScore default                │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 4.6. Calcular Urgency & VIP                             │ │
│    │      • urgencyScore (espera + unread + intent)          │ │
│    │      • vipScore (antigüedad + mensajes + engagement)    │ │
│    └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐ │
│    │ 4.7. Upsert en client_scores                            │ │
│    │      • INSERT ... ON CONFLICT DO UPDATE                 │ │
│    │      • Preserva isVip manual si existe                  │ │
│    └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Código Crítico: Valores Default

**Archivo:** `packages/db/src/services/scoring.ts` (líneas 198-204)

```typescript
// ⚠️ PROBLEMA: Valores hardcodeados sin análisis real
const recencyScore = calculateRecencyScore(daysSince(stats.lastMessageAt))
const messageFrequencyScore = Math.min(100, (stats.totalMessages ?? 0) * 5)
const sentimentScore = 50 // ⚠️ Default, would need NLP analysis
const intentScore = 30 // ⚠️ Default, would need NLP analysis
const responseTimeScore = 50 // ⚠️ Default, would need calculation

const engagementScore = calculateEngagementScore({
  responseTime: responseTimeScore,
  messageFrequency: messageFrequencyScore,
  sentiment: sentimentScore,
  intent: intentScore, // ⚠️ 25% del peso total usa valor default!
  recency: recencyScore,
})
```

**Impacto:**

- ❌ Todos los clientes tienen `sentimentScore = 50` (neutral)
- ❌ Todos los clientes tienen `intentScore = 30` (bajo)
- ❌ La clasificación hot/warm/cold es **imprecisa** porque depende de intent
- ❌ `closingProbability` subestimada (usa `intentScore = 30`)

---

## 📊 Tablas Críticas

### 1. `clients` - Registro de Clientes

**Propósito:** Cliente creado desde primer mensaje de WhatsApp

**Creación:** `packages/whatsapp/src/service.ts:54`

```typescript
await db.insert(clients).values({
  userId, // ID del business owner
  phone: message.from, // +34612345678
  name: message.fromName, // Nombre de perfil WA
  lastChannel: 'whatsapp',
  pipelineStatus: 'lead', // 🎯 Siempre empieza como lead
  waProfileName: message.fromName,
})
```

**Campos Clave:**

- `pipelineStatus`: lead → contacted → qualified → proposal → negotiation → won/lost
- `lastContactAt`: Actualizado en cada mensaje
- `lastMessageAt`: Timestamp del último mensaje

---

### 2. `conversations` - Hilo de Conversación

**Propósito:** Agrupa mensajes de un cliente en un contexto

**Creación:** `packages/whatsapp/src/service.ts:528`

```typescript
await db.insert(conversations).values({
  clientId,
  userId,
  channel: 'whatsapp', // whatsapp | email | voice
  status: 'active', // active | archived | closed
})
```

**Campos Clave:**

- `lastMessageAt`: Ordenación en inbox
- `phase`: discovery | interest | consideration | decision | closed
- `aiSummary`: Resumen generado por IA

---

### 3. `messages` - Mensajes Individuales

**Propósito:** Almacenar cada mensaje entrante/saliente

**Creación:** `packages/whatsapp/src/service.ts:73`

```typescript
await db.insert(messagesTable).values({
  conversationId,
  waMessageId: message.id, // ID de WhatsApp
  direction: 'inbound', // inbound | outbound
  contentType: 'text', // text | image | audio | video | document
  content: message.text, // Texto del mensaje
  mediaUrl: message.mediaUrl, // URL si es multimedia
  status: 'delivered', // sent | delivered | read | failed
})
```

---

### 4. `client_scores` - Sistema de Scoring

**Propósito:** Clasificar engagement y probabilidad de cierre

**Actualización:** Automática en cada mensaje (via `recalculateClientScore`)

**Schema:** `packages/db/src/schema/client-scoring.ts`

```typescript
export const clientScores = pgTable('client_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id)
    .unique(),

  // Scores principales
  engagementScore: integer('engagement_score').notNull().default(0), // 0-100
  closingProbability: decimal('closing_probability', { precision: 5, scale: 4 }).default('0.0000'),
  temperature: temperatureEnum('temperature').default('cold'), // hot/warm/cold/very_cold

  // Scores individuales (componentes)
  responseTimeScore: integer('response_time_score').default(0),
  messageFrequencyScore: integer('message_frequency_score').default(0),
  sentimentScore: integer('sentiment_score').default(50), // ⚠️ Siempre 50
  intentScore: integer('intent_score').default(0), // ⚠️ Siempre 30
  recencyScore: integer('recency_score').default(0),

  // Urgencia
  urgencyScore: integer('urgency_score').default(0),
  waitingTimeMinutes: integer('waiting_time_minutes'),
  hasUnreadMessages: boolean('has_unread_messages').default(false),

  // VIP
  vipScore: integer('vip_score').default(0),
  isVip: boolean('is_vip').default(false),

  // Intent signals (AI detectados)
  intentSignals: jsonb('intent_signals').$type<IntentSignal[]>().default([]),

  // Timestamps
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
```

**Thresholds de Clasificación:**

```typescript
export const SCORE_THRESHOLDS = {
  hot: 70, // engagement ≥70
  warm: 50, // engagement ≥50
  cold: 30, // engagement ≥30
  very_cold: 0, // engagement <30
} as const
```

---

### 5. `prospects` - Prospección Activa

**Propósito:** Leads fríos detectados por outbound (LinkedIn, etc)

**Diferencia con `clients`:**

- `clients` = Contacto inbound (escribió primero)
- `prospects` = Contacto outbound (encontrado por prospecting)

**Schema:** `packages/db/src/schema/prospecting.ts`

```typescript
export const prospects = pgTable('prospects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => profiles.id)
    .notNull(),

  // Basic Info
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  role: varchar('role', { length: 255 }),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),

  // Enriched Data (from external APIs)
  companyData: jsonb('company_data'),
  experience: jsonb('experience'),
  skills: jsonb('skills'),

  // Scoring
  score: integer('score').default(0), // 0-100 fit score
  scoringFactors: jsonb('scoring_factors'),

  // Status
  status: prospectStatusEnum('status').default('new').notNull(),
  // new → contacted → interested → qualified → converted → disqualified

  enrichmentStatus: enrichmentStatusEnum('enrichment_status').default('pending'),
  // pending → processing → enriched → failed

  // Metadata
  source: varchar('source', { length: 100 }), // linkedin_auto_prospector, manual, import
  tags: jsonb('tags').$type<string[]>(),

  // Conversión
  convertedToClientId: uuid('converted_to_client_id').references(() => clients.id),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
})
```

**Flujo de Conversión:**

```
Prospect (nuevo lead) → Sequence → Email/WhatsApp → Responde → Client
```

---

### 6. Psychology Engine Tables (13 tablas)

**Estado:** ✅ Implementadas | ⚠️ NO integradas en webhook flow

**Tablas Principales:**

1. **`emotion_tracking`** - Análisis de emociones en mensajes
2. **`persona_classifications`** - Tipo DISC (analytical, driver, expressive, amiable)
3. **`conversation_phases`** - Fase de venta (discovery, interest, etc)
4. **`reciprocity_ledgers`** - Balance de favores (dar/recibir)
5. **`wallie_annotations`** - Notas de IA sobre conversaciones
6. **`behavioral_interventions`** - Estrategias sugeridas por psicología

**⚠️ PROBLEMA:** Estas tablas NO se populan automáticamente en webhook flow

**Razón:** Faltan workers que procesen mensajes con NLP

---

## 🔴 Puntos Ciegos Detectados

### 1. Scoring con Valores Default (CRÍTICO)

**Archivo:** `packages/db/src/services/scoring.ts:201-203`

```typescript
const sentimentScore = 50 // ⚠️ Default, would need NLP analysis
const intentScore = 30 // ⚠️ Default, would need NLP analysis
const responseTimeScore = 50 // ⚠️ Default, would need calculation
```

**Impacto:**

- Todos los clientes tienen mismo `sentimentScore` (neutral)
- `intentScore` (25% del peso total) usa valor default bajo
- Clasificación hot/warm/cold es **imprecisa**

**Solución Requerida:**

- Integrar Psychology Engine en webhook flow
- Calcular sentiment/intent real con NLP (OpenAI/Anthropic)

---

### 2. Workers de Psychology Faltantes (CRÍTICO)

**Esperados (según arquitectura):**

- `emotion-analysis.ts` - Analizar sentiment de cada mensaje
- `persona-update.ts` - Clasificar tipo DISC del cliente
- `conversation-phase-update.ts` - Detectar fase de venta

**Estado Actual:**

- ❌ NO existen en `packages/workers/src/functions/`
- ❌ Tablas de psychology permanecen vacías
- ❌ No hay análisis automático de mensajes

**Consecuencia:**

- Sistema de scoring usa valores hardcodeados
- No hay personalización de respuestas por tipo de personalidad
- No hay detección de señales de compra

---

### 3. Tabla `potential_leads` No Existe

**Propuesto por usuario:** Tabla para capturar leads que aún no son clientes

**Pregunta Crítica:** ¿Cuál es la diferencia con `prospects` y `clients`?

**Análisis:**

| Tabla             | Origen                        | Estado Inicial | Conversión                  |
| ----------------- | ----------------------------- | -------------- | --------------------------- |
| `prospects`       | Outbound (LinkedIn, scraping) | new            | → `clients` cuando responde |
| `clients`         | Inbound (WhatsApp directo)    | lead           | → qualified cuando califica |
| `potential_leads` | ???                           | ???            | ???                         |

**Recomendación:**

- ❓ Clarificar caso de uso para `potential_leads`
- ¿Es para números de WhatsApp sin nombre? (ya cubierto por `clients` con name null)
- ¿Es para mensajes sin conversación? (edge case raro)

**Decisión Pendiente:** Definir si realmente se necesita o si `prospects` + `clients` es suficiente

---

### 4. RLS Policies No Verificadas

**Pendiente:** Auditoría de políticas de Row Level Security

**Checklist:**

- [ ] Verificar que todas las tablas tienen RLS habilitado
- [ ] Verificar que policies filtran por `userId` o `user_id`
- [ ] Verificar que no hay bypass accidental (SELECT sin WHERE)
- [ ] Verificar que admin puede ver todos los datos (si requerido)

**Script de Verificación:**

```sql
-- Listar tablas sin RLS
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename
  FROM pg_policies
);

-- Verificar policies existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🏗️ Arquitectura Propuesta (To-Be)

### Objetivo

Transformar el sistema de scoring de **valores default** a **análisis real con IA**.

### Diagrama de Flujo Mejorado

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Webhook llega desde Miniserver                              │
│    • POST /api/webhooks/baileys                                 │
│    • Payload: { userId, message: { text, from, ... } }          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Procesamiento de Mensaje (WhatsApp Service)                 │
│    • Crear/actualizar cliente                                   │
│    • Almacenar mensaje                                          │
│    • Actualizar timestamps                                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ├─────────────┬────────────────┬───────────┐
                       ▼             ▼                ▼           ▼
      ┌────────────────────┐  ┌──────────┐  ┌─────────────┐  ┌────────┐
      │ 3a. Scoring        │  │ 3b. NLP  │  │ 3c. Persona │  │ 3d.    │
      │     (current)      │  │ Analysis │  │ Detection   │  │ Phase  │
      │                    │  │ (NEW)    │  │ (NEW)       │  │ (NEW)  │
      ├────────────────────┤  ├──────────┤  ├─────────────┤  ├────────┤
      │ • Recency score    │  │ • AI     │  │ • Classify  │  │ • Disc-│
      │ • Frequency score  │  │   analyzes│  │   DISC      │  │   overy│
      │ • Engagement       │  │   message│  │   type      │  │ • Inter│
      │ • Temperature      │  │ • Extract│  │ • Update    │  │   -est │
      │ • VIP detection    │  │   intent │  │   persona_  │  │ • Deci-│
      │                    │  │ • Extract│  │   classifi- │  │   sion │
      │ ⚠️ Uses defaults:  │  │   senti- │  │   cations   │  │        │
      │   - sentiment=50   │  │   ment   │  │             │  │        │
      │   - intent=30      │  │ • Store  │  │             │  │        │
      │                    │  │   in     │  │             │  │        │
      │                    │  │   emotion│  │             │  │        │
      │                    │  │   _track-│  │             │  │        │
      │                    │  │   ing    │  │             │  │        │
      └────────┬───────────┘  └────┬─────┘  └──────┬──────┘  └───┬────┘
               │                   │               │             │
               └───────────────────┴───────────────┴─────────────┘
                                   │
                                   ▼
               ┌────────────────────────────────────────────────┐
               │ 4. NUEVO: Recalculate Score con Valores Reales│
               │    • sentiment = emotion_tracking.sentiment    │
               │    • intent = emotion_tracking.intent          │
               │    • Clasificación precisa hot/warm/cold       │
               │    • Closing probability ajustada              │
               └────────────────────────────────────────────────┘
```

---

### Componentes Nuevos Requeridos

#### 1. Worker: `emotion-analysis.ts`

**Responsabilidad:** Analizar cada mensaje con NLP y extraer:

- Sentiment (0-100): positivo/neutral/negativo
- Intent (0-100): probabilidad de intención de compra
- Emotions: joy, trust, fear, surprise, sadness, disgust, anger, anticipation

**Trigger:** Evento Inngest `message.received`

**Implementación:**

```typescript
// packages/workers/src/functions/emotion-analysis.ts
import { inngest } from '../client'
import { db } from '@wallie/db'
import { emotionTracking, messages } from '@wallie/db/schema'
import { openai } from '@wallie/ai'

export const emotionAnalysis = inngest.createFunction(
  { id: 'emotion-analysis' },
  { event: 'message.received' },
  async ({ event, step }) => {
    const { messageId, conversationId, text } = event.data

    // Step 1: Analyze with OpenAI
    const analysis = await step.run('analyze-emotion', async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analiza el siguiente mensaje y extrae:
1. sentiment (0-100): 0=muy negativo, 50=neutral, 100=muy positivo
2. intent (0-100): probabilidad de intención de compra
3. emotions: array de emociones detectadas (joy, trust, fear, etc)

Responde en JSON: { "sentiment": 75, "intent": 60, "emotions": ["joy", "anticipation"] }`,
          },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      })

      return JSON.parse(response.choices[0]?.message.content || '{}')
    })

    // Step 2: Store in emotion_tracking
    await step.run('store-emotion', async () => {
      await db.insert(emotionTracking).values({
        conversationId,
        messageId,
        primaryEmotion: analysis.emotions[0] || 'neutral',
        secondaryEmotions: analysis.emotions.slice(1),
        sentiment: analysis.sentiment,
        intent: analysis.intent,
        confidence: 0.85, // Confidence del modelo
        modelUsed: 'gpt-4o-mini',
      })
    })

    return { success: true, analysis }
  }
)
```

---

#### 2. Worker: `persona-update.ts`

**Responsabilidad:** Clasificar tipo DISC del cliente basado en historial de mensajes

**Trigger:** Evento Inngest `client.messages.updated` (cada 5 mensajes)

**Implementación:**

```typescript
// packages/workers/src/functions/persona-update.ts
import { inngest } from '../client'
import { db } from '@wallie/db'
import { personaClassifications, messages } from '@wallie/db/schema'
import { anthropic } from '@wallie/ai'
import { eq, desc } from 'drizzle-orm'

export const personaUpdate = inngest.createFunction(
  { id: 'persona-update' },
  { event: 'client.messages.updated' },
  async ({ event, step }) => {
    const { clientId, conversationId } = event.data

    // Step 1: Get last 20 messages
    const messageHistory = await step.run('fetch-messages', async () => {
      return db
        .select({ content: messages.content, direction: messages.direction })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(20)
    })

    // Step 2: Classify DISC with Claude
    const classification = await step.run('classify-disc', async () => {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Basándote en estos mensajes de WhatsApp, clasifica el tipo de personalidad DISC del cliente:

Mensajes:
${messageHistory.map((m) => `[${m.direction}]: ${m.content}`).join('\n')}

Tipos DISC:
- analytical: Preciso, meticuloso, pregunta detalles técnicos
- driver: Directo, impaciente, quiere resultados rápidos
- expressive: Emocional, entusiasta, usa emojis
- amiable: Amigable, indeciso, necesita confianza

Responde en JSON:
{
  "primaryType": "analytical",
  "secondaryType": "driver",
  "confidence": 0.85,
  "reasoning": "Pregunta muchos detalles técnicos y precios..."
}`,
          },
        ],
      })

      return JSON.parse(response.content[0]?.text || '{}')
    })

    // Step 3: Upsert persona classification
    await step.run('upsert-persona', async () => {
      await db
        .insert(personaClassifications)
        .values({
          conversationId,
          clientId,
          discType: classification.primaryType,
          confidence: classification.confidence,
          detectedAt: new Date(),
          modelUsed: 'claude-3-5-sonnet',
        })
        .onConflictDoUpdate({
          target: personaClassifications.conversationId,
          set: {
            discType: classification.primaryType,
            confidence: classification.confidence,
            detectedAt: new Date(),
            updatedAt: new Date(),
          },
        })
    })

    return { success: true, classification }
  }
)
```

---

#### 3. Modificación: `scoring.ts` con Valores Reales

**Cambio Requerido:** Reemplazar defaults por valores de `emotion_tracking`

```typescript
// packages/db/src/services/scoring.ts (MODIFICADO)
import { emotionTracking } from '../schema/psychology'

export async function recalculateClientScore(clientId: string) {
  // ... código existente de message stats ...

  // 🆕 NUEVO: Get latest emotion analysis
  const [latestEmotion] = await db
    .select()
    .from(emotionTracking)
    .innerJoin(messages, eq(emotionTracking.messageId, messages.id))
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(desc(emotionTracking.analyzedAt))
    .limit(1)

  // 🆕 NUEVO: Use real values instead of defaults
  const sentimentScore = latestEmotion?.sentiment ?? 50 // Fallback a 50 si no hay análisis
  const intentScore = latestEmotion?.intent ?? 30 // Fallback a 30 si no hay análisis

  // ✅ MANTENER: Cálculos existentes
  const recencyScore = calculateRecencyScore(daysSince(stats.lastMessageAt))
  const messageFrequencyScore = Math.min(100, (stats.totalMessages ?? 0) * 5)
  const responseTimeScore = calculateResponseTimeScore(/* ... */) // ⚠️ Por implementar

  const engagementScore = calculateEngagementScore({
    responseTime: responseTimeScore,
    messageFrequency: messageFrequencyScore,
    sentiment: sentimentScore, // 🆕 Ahora es real!
    intent: intentScore, // 🆕 Ahora es real!
    recency: recencyScore,
  })

  // ... resto del código (temperatura, VIP, etc) ...
}
```

---

#### 4. Modificación: Webhook Handler con Inngest Events

**Cambio Requerido:** Disparar eventos para workers de psychology

```typescript
// apps/web/src/app/api/webhooks/baileys/route.ts (MODIFICADO)
import { inngest } from '@wallie/workers'

async function processIncomingMessage(
  userId: string,
  _sessionId: string,
  message: NonNullable<BaileysWebhookPayload['message']>
) {
  // 1. Proceso existente (crear cliente, conversación, mensaje)
  const result = await whatsappService.processIncomingMessage(normalizedMessage, userId)

  // 🆕 2. NUEVO: Trigger emotion analysis
  await inngest.send({
    name: 'message.received',
    data: {
      messageId: result.message.id,
      conversationId: result.conversation.id,
      text: message.text || '',
      clientId: result.client?.id,
    },
  })

  // 🆕 3. NUEVO: Check if we should update persona (every 5 messages)
  const messageCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.conversationId, result.conversation.id))

  if (messageCount[0]?.count % 5 === 0) {
    await inngest.send({
      name: 'client.messages.updated',
      data: {
        clientId: result.client?.id,
        conversationId: result.conversation.id,
      },
    })
  }

  // 4. Proceso existente (generar respuesta IA, enviar)
  // ...
}
```

---

### Arquitectura de Seguridad (RLS)

#### Política Base para Todas las Tablas

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users see own data only"
  ON table_name
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only insert their own data
CREATE POLICY "Users insert own data only"
  ON table_name
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own data
CREATE POLICY "Users update own data only"
  ON table_name
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own data
CREATE POLICY "Users delete own data only"
  ON table_name
  FOR DELETE
  USING (user_id = auth.uid());
```

#### Tablas con RLS Crítico

| Tabla                  | Columna de Filtro       | Justificación                       |
| ---------------------- | ----------------------- | ----------------------------------- |
| `clients`              | `user_id`               | Cada business solo ve sus clientes  |
| `conversations`        | `user_id`               | Privacidad de conversaciones        |
| `messages`             | `conversations.user_id` | Join con conversations              |
| `client_scores`        | `clients.user_id`       | Join con clients                    |
| `emotion_tracking`     | `conversations.user_id` | Join con conversations              |
| `prospects`            | `user_id`               | Leads prospectados por cada negocio |
| `whatsapp_connections` | `user_id`               | Configuración privada de WhatsApp   |

---

## 📅 Plan de Implementación

### Fase 1: Integración de Psychology Engine (2-3 días)

**Prioridad:** 🔴 CRÍTICA

**Objetivo:** Eliminar valores default de scoring y usar análisis real

**Tareas:**

1. ✅ **Día 1 - Mañana: Worker de Emotion Analysis**
   - [ ] Crear `packages/workers/src/functions/emotion-analysis.ts`
   - [ ] Configurar prompt de OpenAI para extraer sentiment/intent
   - [ ] Almacenar resultados en `emotion_tracking`
   - [ ] Test con 10 mensajes reales

2. ✅ **Día 1 - Tarde: Integración con Scoring**
   - [ ] Modificar `packages/db/src/services/scoring.ts`
   - [ ] Obtener último análisis de `emotion_tracking`
   - [ ] Reemplazar defaults por valores reales
   - [ ] Fallback a defaults solo si no hay análisis

3. ✅ **Día 2 - Mañana: Worker de Persona Detection**
   - [ ] Crear `packages/workers/src/functions/persona-update.ts`
   - [ ] Configurar prompt de Claude para clasificar DISC
   - [ ] Almacenar en `persona_classifications`
   - [ ] Trigger cada 5 mensajes

4. ✅ **Día 2 - Tarde: Integración con Webhook**
   - [ ] Modificar `apps/web/src/app/api/webhooks/baileys/route.ts`
   - [ ] Disparar evento `message.received` para emotion analysis
   - [ ] Disparar evento `client.messages.updated` cada 5 mensajes
   - [ ] Test E2E: enviar mensaje → verificar análisis → verificar scoring

5. ✅ **Día 3: Testing y Validación**
   - [ ] Test con 50 mensajes reales variados
   - [ ] Verificar que `sentimentScore` varía (no siempre 50)
   - [ ] Verificar que `intentScore` varía (no siempre 30)
   - [ ] Validar clasificaciones hot/warm/cold más precisas
   - [ ] Comparar closing probability antes/después

---

### Fase 2: Optimización de RLS (1 día)

**Prioridad:** 🟠 ALTA

**Objetivo:** Auditar y reforzar seguridad de datos

**Tareas:**

1. ✅ **Mañana: Auditoría**
   - [ ] Ejecutar script de verificación de RLS
   - [ ] Identificar tablas sin políticas
   - [ ] Revisar políticas existentes

2. ✅ **Tarde: Implementación**
   - [ ] Crear políticas faltantes
   - [ ] Test con múltiples usuarios
   - [ ] Verificar que user A no ve datos de user B

---

### Fase 3: Worker de Conversation Phase (1 día)

**Prioridad:** 🟡 MEDIA

**Objetivo:** Detectar automáticamente fase de venta

**Tareas:**

1. ✅ **Crear Worker**
   - [ ] `packages/workers/src/functions/conversation-phase-update.ts`
   - [ ] Analizar últimos 10 mensajes
   - [ ] Clasificar fase: discovery → interest → consideration → decision
   - [ ] Almacenar en `conversations.phase`

2. ✅ **Integración**
   - [ ] Trigger al finalizar conversación (status=closed)
   - [ ] Actualizar `conversations` con fase detectada

---

### Fase 4: Tabla `potential_leads` (Pendiente de Definición)

**Prioridad:** ⚪ BAJA (requiere aclaración de caso de uso)

**Preguntas Abiertas:**

- ¿Cuál es la diferencia con `prospects` y `clients`?
- ¿Qué datos específicos almacenaría?
- ¿Cuándo se crea un registro en esta tabla?

**Decisión:** Esperar feedback del equipo antes de implementar

---

## 🎯 Métricas de Éxito

### KPIs para Validar Arquitectura Mejorada

| Métrica                                      | Antes (As-Is)          | Después (To-Be)      | Cómo Medir                                   |
| -------------------------------------------- | ---------------------- | -------------------- | -------------------------------------------- |
| **Precisión de Clasificación Hot/Warm/Cold** | ~60% (valores default) | >85% (análisis real) | Comparar con clasificación manual de muestra |
| **Coverage de Sentiment Analysis**           | 0% (todos default=50)  | >95%                 | `SELECT COUNT(*) WHERE sentimentScore != 50` |
| **Coverage de Intent Detection**             | 0% (todos default=30)  | >95%                 | `SELECT COUNT(*) WHERE intentScore != 30`    |
| **Latencia de Scoring**                      | ~100ms                 | <500ms (con NLP)     | Prometheus metrics                           |
| **Tablas Psychology Populadas**              | 0% (vacías)            | >80% conversaciones  | `SELECT COUNT(DISTINCT conversationId)`      |
| **Closing Probability Accuracy**             | ???                    | >70%                 | Comparar con deals cerrados                  |

---

## 📚 Referencias Técnicas

### Documentación Relacionada

- [WHATSAPP_BAILEYS_SETUP.md](../operations/WHATSAPP_BAILEYS_SETUP.md) - Arquitectura del Miniserver
- [CLAUDE.md](../../CLAUDE.md) - Estándares de desarrollo
- [SYSTEM.md](../../SYSTEM.md) - Arquitectura completa del sistema

### Archivos Clave

| Archivo                                          | Líneas | Propósito                                 |
| ------------------------------------------------ | ------ | ----------------------------------------- |
| `packages/whatsapp/src/service.ts`               | 588    | WhatsApp service (processIncomingMessage) |
| `packages/db/src/services/scoring.ts`            | 292    | Sistema de scoring (⚠️ valores default)   |
| `packages/db/src/schema/client-scoring.ts`       | 150    | Schema de scoring                         |
| `packages/db/src/schema/prospecting.ts`          | 200    | Schema de prospección                     |
| `apps/web/src/app/api/webhooks/baileys/route.ts` | 100    | Webhook handler                           |

---

## ✅ Checklist de Arquitecto de Datos

### Pre-Implementación

- [x] Documentación de estado actual (As-Is)
- [x] Identificación de puntos ciegos críticos
- [x] Diseño de arquitectura mejorada (To-Be)
- [ ] Validación de caso de uso para `potential_leads`
- [ ] Aprobación de plan de implementación

### Implementación (Fase 1)

- [ ] Worker `emotion-analysis.ts` creado y testeado
- [ ] Worker `persona-update.ts` creado y testeado
- [ ] `scoring.ts` modificado para usar valores reales
- [ ] Webhook handler dispara eventos Inngest
- [ ] Test E2E completo (mensaje → análisis → scoring)

### Implementación (Fase 2)

- [ ] Auditoría de RLS completada
- [ ] Políticas faltantes creadas
- [ ] Test de aislamiento entre usuarios

### Validación

- [ ] KPIs de precisión medidos
- [ ] Tablas de psychology populándose correctamente
- [ ] Latencia de scoring <500ms
- [ ] No hay degradación de performance en webhook

### Post-Implementación

- [ ] Documentación actualizada
- [ ] Runbook de troubleshooting creado
- [ ] Alertas de Sentry configuradas para workers
- [ ] Dashboard de monitoreo en PostHog

---

**Última actualización:** 25 Dic 2025
**Próxima revisión:** Tras implementación de Fase 1
