# 📚 API-REFERENCE.md — Referencia Central de APIs y Schemas

> **Versión:** 1.1.0 | **Última actualización:** 10 Dic 2025
> **Propósito:** Fuente única de verdad para routers, procedimientos y schemas
> **Verificado:** 66 routers | 460 procedures | 60 schemas (auditoría 10 Dic 2025)

---

## 📋 ÍNDICE

1. [Routers tRPC (66 total, 460 procedures)](#-routers-trpc)
2. [Schemas de Base de Datos (60 total)](#-schemas-de-base-de-datos)
3. [Enums y Tipos Compartidos](#-enums-y-tipos-compartidos)
4. [Relaciones entre Entidades](#-relaciones-entre-entidades)
5. [Patrones de Arquitectura](#-patrones-de-arquitectura)

---

## 🔌 ROUTERS tRPC

> **Ubicación:** `packages/api/src/routers/*.ts`
> **Root:** `packages/api/src/root.ts`

### Comunicación Core

| Router                | Archivo                   | Procedimientos Principales                                          |
| --------------------- | ------------------------- | ------------------------------------------------------------------- |
| `clients`             | `clients.ts`              | `list`, `getById`, `create`, `update`, `delete`, `getByPipeline`    |
| `conversations`       | `conversations.ts`        | `list`, `getById`, `create`, `archive`, `setStatus`                 |
| `whatsapp`            | `whatsapp.ts`             | `getConversations`, `getConversation`, `getMessages`, `sendMessage` |
| `inbox`               | `inbox.ts`                | `getFeed` (unificado: WhatsApp + Email + LinkedIn)                  |
| `email`               | `email.ts`                | Endpoints específicos de email                                      |
| `gmail`               | `gmail.ts`                | `getThreads`, `getByClientEmail`, `sync`                            |
| `voice`               | `voice.ts`                | `listCalls`, `getCall`, `initiateCall`                              |
| `whatsappConnections` | `whatsapp-connections.ts` | `getStatus`, `connect`, `disconnect`                                |

### Inteligencia Artificial

| Router             | Archivo                | Procedimientos Principales                                                                                                  |
| ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ai`               | `ai.ts`                | `generateResponse`, `generateQuickResponse`, `generateSuggestedReplies`, `analyzeMessage`, `detectIntent`, `detectLanguage` |
| `aiModels`         | `ai-models.ts`         | `getOrder`, `updateOrder` (preferencias de modelo)                                                                          |
| `correctiveRAG`    | `corrective-rag.ts`    | `evaluate`, `correct`, `correctStreaming` (CRAG + Hallucination Check)                                                      |
| `scoring`          | `scoring.ts`           | `getClientScore`, `recalculate`                                                                                             |
| `coldCalling`      | `cold-calling.ts`      | `listCampaigns`, `createCampaign`, `executeCall`                                                                            |
| `prospecting`      | `prospecting.ts`       | `search`, `enrich`, `getLeads`                                                                                              |
| `clientEnrichment` | `client-enrichment.ts` | `enrich`, `getEnrichmentData`                                                                                               |

### Gestión de Usuario

| Router      | Archivo         | Procedimientos Principales   |
| ----------- | --------------- | ---------------------------- |
| `profiles`  | `profiles.ts`   | `me`, `update`               |
| `settings`  | `settings.ts`   | `get`, `update`              |
| `phoneAuth` | `phone-auth.ts` | `sendCode`, `verifyCode`     |
| `magicLink` | `magic-link.ts` | `send`, `verify`             |
| `sessions`  | `sessions.ts`   | `list`, `revoke`             |
| `twoFactor` | `two-factor.ts` | `setup`, `verify`, `disable` |
| `consents`  | `consents.ts`   | `get`, `update`              |

### Suscripciones y Facturación

| Router          | Archivo             | Procedimientos Principales   |
| --------------- | ------------------- | ---------------------------- |
| `subscriptions` | `subscriptions.ts`  | `get`, `upgrade`, `cancel`   |
| `invoices`      | `invoices.ts`       | `list`, `getById`            |
| `usage`         | `usage.ts`          | `getUsage`, `getCosts`       |
| `publicPricing` | `public-pricing.ts` | `getPlans` (público)         |
| `addons`        | `addons.ts`         | `list`, `purchase`, `cancel` |

### Operaciones de Negocio

| Router              | Archivo                 | Procedimientos Principales           |
| ------------------- | ----------------------- | ------------------------------------ |
| `businessProfile`   | `business-profile.ts`   | `get`, `update`                      |
| `campaigns`         | `campaigns.ts`          | `list`, `create`, `update`, `delete` |
| `marketingCalendar` | `marketing-calendar.ts` | `getEvents`, `createEvent`           |
| `clientGroups`      | `client-groups.ts`      | `list`, `create`, `addMembers`       |
| `tags`              | `tags.ts`               | `list`, `create`, `delete`           |
| `reminders`         | `reminders.ts`          | `list`, `create`, `complete`         |
| `productivity`      | `productivity.ts`       | `getMetrics`, `getLeaderboard`       |

### Gamificación

| Router         | Archivo           | Procedimientos Principales                       |
| -------------- | ----------------- | ------------------------------------------------ |
| `gamification` | `gamification.ts` | `getPoints`, `getAchievements`, `getLeaderboard` |
| `rewards`      | `rewards.ts`      | `getStore`, `redeem`                             |
| `referrals`    | `referrals.ts`    | `getCode`, `trackReferral`                       |

### Administración

| Router                | Archivo                   | Procedimientos Principales                   |
| --------------------- | ------------------------- | -------------------------------------------- |
| `admin`               | `admin.ts`                | Procedimientos genéricos admin               |
| `adminUsers`          | `admin-users.ts`          | `list`, `getById`, `update`, `delete`        |
| `adminAnalytics`      | `admin-analytics.ts`      | `getDashboard`, `getMetrics`                 |
| `adminGrowth`         | `admin-growth.ts`         | `listJobs`, `createJob`, `listScheduledJobs` |
| `adminAgentConfig`    | `admin-agent-config.ts`   | `getConfig`, `saveConfig`                    |
| `adminPlans`          | `admin-plans.ts`          | `list`, `create`, `update`                   |
| `adminSubscriptions`  | `admin-subscriptions.ts`  | `list`, `update`, `cancel`                   |
| `adminDynamicPlans`   | `admin-dynamic-plans.ts`  | `getPlans`, `updatePlan`                     |
| `adminRewards`        | `admin-rewards.ts`        | `list`, `create`, `update`                   |
| `adminSystem`         | `admin-system.ts`         | `getHealth`, `getConfig`                     |
| `adminCommunications` | `admin-communications.ts` | `broadcast`, `getHistory`                    |
| `adminFeedback`       | `admin-feedback.ts`       | `list`, `respond`                            |
| `adminReports`        | `admin-reports.ts`        | `generate`, `list`                           |
| `adminApiKeys`        | `admin-api-keys.ts`       | `list`, `create`, `revoke`                   |
| `adminWebhooks`       | `admin-webhooks.ts`       | `list`, `create`, `update`                   |

### Funcionalidades Especializadas

| Router            | Archivo               | Procedimientos Principales         |
| ----------------- | --------------------- | ---------------------------------- |
| `wallie`          | `wallie.ts`           | Funcionalidades específicas Wallie |
| `knowledge`       | `knowledge.ts`        | `search`, `addDocument`            |
| `tools`           | `tools.ts`            | `speedTest` (público)              |
| `integrations`    | `integrations.ts`     | `list`, `connect`, `disconnect`    |
| `emailOnboarding` | `email-onboarding.ts` | `getStatus`, `complete`            |
| `workers`         | `workers.ts`          | `listRuns`, `triggerWorker`        |
| `compliance`      | `compliance.ts`       | `getMode`, `enable`, `disable`     |
| `health`          | `health.ts`           | `check` (público)                  |
| `gdpr`            | `gdpr.ts`             | `exportData`, `deleteAccount`      |
| `support`         | `support.ts`          | `createTicket`, `listTickets`      |

---

## 🗃️ SCHEMAS DE BASE DE DATOS

> **Ubicación:** `packages/db/src/schema/*.ts`
> **Export:** `packages/db/src/schema/index.ts`

### Entidades Core

```
┌─────────────────────────────────────────────────────────────────┐
│ profiles                                                         │
│ ─────────                                                        │
│ id: uuid (PK)                                                    │
│ fullName: varchar(100)                                           │
│ businessName: varchar(100)                                       │
│ businessSector: varchar(50)                                      │
│ phone: varchar(20)                                               │
│ email: varchar(255)                                              │
│ language: varchar(5) ['es', 'en', 'pt']                         │
│ timezone: varchar(50)                                            │
│ aiPriceList: text                                                │
│ aiHoursInfo: text                                                │
│ aiPreferQuality: boolean                                         │
│ metadata: jsonb                                                  │
│ createdAt, updatedAt: timestamp                                  │
└─────────────────────────────────────────────────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ clients                                                          │
│ ─────────                                                        │
│ id: uuid (PK)                                                    │
│ userId: uuid (FK → profiles)                                     │
│ name: varchar(100)                                               │
│ phone: varchar(20)                                               │
│ email: varchar(255)                                              │
│ company: varchar(100)                                            │
│ address, city, postalCode, province, country                     │
│ isPersonal: boolean                                              │
│ pipelineStatus: enum ['lead','contacted','proposal',...]         │
│ pipelineValue: decimal                                           │
│ waChatId: varchar (WhatsApp chat ID)                            │
│ lastChannel: enum ['whatsapp','email','phone','voice']          │
│ extractedData: jsonb                                             │
│ engagementScore: integer                                         │
│ notes: text                                                      │
│ createdAt, updatedAt: timestamp                                  │
└─────────────────────────────────────────────────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ conversations                                                    │
│ ─────────────                                                    │
│ id: uuid (PK)                                                    │
│ userId: uuid (FK → profiles)                                     │
│ clientId: uuid (FK → clients)                                    │
│ channel: enum ['whatsapp','email','linkedin','phone','voice']   │
│ type: enum ['sales','support','follow_up','complaint','general']│
│ status: enum ['open','closed','archived']                       │
│ sentiment: enum ['positive','neutral','negative','mixed']       │
│ lastMessageAt: timestamp                                         │
│ emailThreadId: varchar (para emails)                            │
│ UNIQUE(userId, clientId, channel)                               │
│ createdAt, updatedAt: timestamp                                  │
└─────────────────────────────────────────────────────────────────┘
          │
          │ 1:N
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ messages                                                         │
│ ─────────                                                        │
│ id: uuid (PK)                                                    │
│ conversationId: uuid (FK → conversations)                        │
│ direction: enum ['inbound','outbound']                          │
│ status: enum ['pending','sent','delivered','read','failed']     │
│ content: text                                                    │
│ contentType: varchar ['text','image','audio','video','document']│
│ waMessageId: varchar (WhatsApp message ID)                      │
│ emailMessageId: varchar (Email message ID)                      │
│ wasAiGenerated: boolean                                          │
│ aiEdited: boolean                                                │
│ sentAt, deliveredAt, readAt: timestamp                          │
│ createdAt: timestamp                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Scoring y Clasificación

```
┌─────────────────────────────────────────────────────────────────┐
│ clientScores                                                     │
│ ────────────                                                     │
│ id: uuid (PK)                                                    │
│ clientId: uuid (FK → clients, UNIQUE)                           │
│ temperature: enum ['cold','warm','hot']                         │
│ engagementScore: integer (0-100)                                │
│ vipScore: integer                                                │
│ isVip: boolean                                                   │
│ closingProbability: decimal                                      │
│ urgencyScore: integer                                            │
│ hasUnreadMessages: boolean                                       │
│ lastInteractionAt: timestamp                                     │
│ calculatedAt: timestamp                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Etiquetas y Agrupación

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ tags             │     │ clientTags       │     │ conversationTags │
│ ────             │     │ ──────────       │     │ ────────────────  │
│ id: uuid (PK)    │◄────│ tagId (FK)       │     │ conversationId   │
│ userId (FK)      │     │ clientId (FK)    │     │ tagId (FK)       │
│ name: varchar    │     └──────────────────┘     └──────────────────┘
│ color: varchar   │
│ UNIQUE(userId,   │     ┌──────────────────┐     ┌──────────────────┐
│   name)          │     │ clientGroups     │     │ clientGroupMem.  │
└──────────────────┘     │ ────────────     │     │ ───────────────  │
                         │ id: uuid (PK)    │◄────│ groupId (FK)     │
                         │ userId (FK)      │     │ clientId (FK)    │
                         │ name, description│     └──────────────────┘
                         └──────────────────┘
```

### Suscripciones y Facturación

```
┌─────────────────────────────────────────────────────────────────┐
│ subscriptions                                                    │
│ ─────────────                                                    │
│ id: uuid (PK)                                                    │
│ userId: uuid (FK → profiles, UNIQUE)                            │
│ stripeCustomerId: varchar                                        │
│ stripeSubscriptionId: varchar                                    │
│ plan: enum ['free','starter','pro','business']                  │
│ status: enum ['active','past_due','cancelled','trialing']       │
│ clientsLimit: integer                                            │
│ clientsUsed: integer                                             │
│ messagesLimit: integer                                           │
│ messagesUsed: integer                                            │
│ aiSuggestionsLimit: integer                                      │
│ aiSuggestionsUsed: integer                                       │
│ currentPeriodStart, currentPeriodEnd: timestamp                 │
│ trialEndsAt: timestamp                                           │
│ createdAt, updatedAt: timestamp                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ invoices                                                         │
│ ─────────                                                        │
│ id: uuid (PK)                                                    │
│ userId: uuid (FK → profiles)                                     │
│ stripeInvoiceId: varchar                                         │
│ number: varchar                                                  │
│ status: enum ['draft','open','paid','void','uncollectible']     │
│ amount: decimal                                                  │
│ currency: varchar ['eur','usd']                                 │
│ vatAmount: decimal                                               │
│ dueDate: timestamp                                               │
│ paidAt: timestamp                                                │
│ invoicePdf: varchar (URL)                                       │
│ createdAt: timestamp                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Uso de IA

```
┌─────────────────────────────────────────────────────────────────┐
│ agentUsage                                                       │
│ ──────────                                                       │
│ id: uuid (PK)                                                    │
│ userId: uuid (FK → profiles)                                     │
│ agentName: varchar ['auto_reply','baileys_auto_reply',...]      │
│ block: enum ['pods','specialists','intelligence']               │
│ routerPath: enum ['pod','brain']                                │
│ routerReason: varchar                                            │
│ costUsd: decimal(10,6)                                          │
│ latencyMs: integer                                               │
│ success: boolean                                                 │
│ createdAt: timestamp                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ agentConfigs                                                     │
│ ────────────                                                     │
│ id: uuid (PK)                                                    │
│ userId: uuid (FK → profiles, UNIQUE)                            │
│ greeting: text                                                   │
│ signOff: text                                                    │
│ personality: varchar                                             │
│ toneLevel: integer (1-5)                                        │
│ formalityLevel: integer (1-5)                                   │
│ emojiUsage: enum ['none','minimal','moderate','frequent']       │
│ businessInfo: jsonb                                              │
│ forbiddenTopics: text[]                                         │
│ styleData: jsonb                                                 │
│ createdAt, updatedAt: timestamp                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ aiModels                                                         │
│ ─────────                                                        │
│ id: uuid (PK)                                                    │
│ userId: uuid (FK → profiles, UNIQUE)                            │
│ modelOrder: jsonb (array de modelos en orden de preferencia)    │
│ preferences: jsonb                                               │
│ createdAt, updatedAt: timestamp                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Autenticación y Seguridad

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ phoneVerifications   │  │ twoFactor            │  │ refreshTokens        │
│ ──────────────────   │  │ ─────────            │  │ ─────────────        │
│ id, phoneNumber      │  │ userId (FK, UNIQUE)  │  │ userId (FK)          │
│ code, verified       │  │ secret, enabled      │  │ token, expiresAt     │
│ expiresAt            │  │ backupCodes[]        │  │ revokedAt            │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ connectedAccounts                                                │
│ ─────────────────                                                │
│ id: uuid (PK)                                                    │
│ userId: uuid (FK → profiles)                                     │
│ provider: enum ['google','microsoft','linkedin']                │
│ providerAccountId: varchar                                       │
│ accessToken: text (encrypted)                                    │
│ refreshToken: text (encrypted)                                   │
│ expiresAt: timestamp                                             │
│ scope: text                                                      │
│ UNIQUE(userId, provider)                                        │
│ createdAt, updatedAt: timestamp                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏷️ ENUMS Y TIPOS COMPARTIDOS

> **Ubicación:** `packages/db/src/schema/enums.ts`

### Pipeline y Estado

```typescript
// Estado del cliente en el pipeline de ventas
pipelineStatus = ['lead', 'contacted', 'proposal', 'negotiation', 'won', 'lost']

// Estado de registros (soft delete)
recordStatus = ['active', 'archived', 'deleted']

// Planes de suscripción
subscriptionPlan = ['free', 'starter', 'pro', 'business']

// Estado de suscripción
subscriptionStatus = ['active', 'past_due', 'cancelled', 'trialing']
```

### Comunicación

```typescript
// Canales de comunicación
channelType = ['whatsapp', 'email', 'phone', 'voice', 'linkedin', 'other']

// Dirección del mensaje
messageDirection = ['inbound', 'outbound']

// Estado del mensaje
messageStatus = ['pending', 'sent', 'delivered', 'read', 'failed']

// Tipo de conversación
conversationType = ['sales', 'support', 'follow_up', 'complaint', 'general']

// Sentimiento detectado
conversationSentiment = ['positive', 'neutral', 'negative', 'mixed']
```

### IA y Routing

```typescript
// Bloques tecnológicos (arquitectura de IA)
techBlock = ['pods', 'specialists', 'intelligence', 'privacy_local', 'privacy_power']

// Ruta del router de IA
routerPath = ['pod', 'brain']
// pod = rápido/barato (Gemini Flash, Groq)
// brain = calidad/caro (Claude, GPT-4)

// Razón de routing
routerReason = [
  'greeting_pattern', // Saludo simple
  'vip_client', // Cliente VIP
  'hot_lead', // Lead caliente
  'complaint', // Queja
  'purchase_intent', // Intención de compra
  'complex_question', // Pregunta compleja
  'price_negotiation', // Negociación de precio
  'default', // Por defecto
]
```

### Temperatura de Cliente

```typescript
// Temperatura (engagement)
clientTemperature = ['cold', 'warm', 'hot']
// cold = sin interacción reciente
// warm = interacción moderada
// hot = alta interacción, probable cierre
```

---

## 🔗 RELACIONES ENTRE ENTIDADES

### Diagrama de Relaciones Principal

```
                              ┌─────────────┐
                              │  profiles   │
                              │  (usuarios) │
                              └──────┬──────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
    │   clients   │          │subscriptions│          │    tags     │
    │  (clientes) │          │   (planes)  │          │ (etiquetas) │
    └──────┬──────┘          └─────────────┘          └──────┬──────┘
           │                                                  │
           │                                                  │
           ├────────────────────┬─────────────────────────────┤
           │                    │                             │
           ▼                    ▼                             ▼
    ┌─────────────┐      ┌─────────────┐              ┌─────────────┐
    │conversations│      │clientScores │              │ clientTags  │
    │   (chats)   │      │  (scoring)  │              │  (N:N tag)  │
    └──────┬──────┘      └─────────────┘              └─────────────┘
           │
           ▼
    ┌─────────────┐
    │  messages   │
    │ (mensajes)  │
    └─────────────┘
```

### Flujo de Datos Omnicanal

```
Cliente contacta por WhatsApp:
  1. Se busca/crea client con phone
  2. Se busca/crea conversation (userId, clientId, channel='whatsapp')
  3. Se crea message en esa conversation
  4. Se actualiza clientScores

Mismo cliente contacta por Email:
  1. Se busca client existente por email
  2. Se crea NUEVA conversation (userId, clientId, channel='email')
  3. Se crea message en la nueva conversation
  4. Se actualiza clientScores (acumulativo)

IMPORTANTE: Un cliente = múltiples conversaciones (una por canal)
```

### Constraint Único de Conversaciones

```sql
-- Solo puede haber UNA conversación por combinación:
UNIQUE (userId, clientId, channel)

-- Esto permite:
-- Cliente A + WhatsApp = 1 conversación
-- Cliente A + Email = 1 conversación (diferente)
-- Cliente A + Phone = 1 conversación (diferente)
```

---

## 🏗️ PATRONES DE ARQUITECTURA

### 1. Multi-tenancy

```typescript
// TODAS las tablas tienen userId como FK
// SIEMPRE filtrar por userId en queries

// ❌ INCORRECTO
const clients = await db.select().from(clients)

// ✅ CORRECTO
const clients = await db.select().from(clients).where(eq(clients.userId, ctx.userId))
```

### 2. Soft Deletes

```typescript
// Usar status enum en lugar de DELETE
// Mantiene historial y permite recuperación

// ❌ INCORRECTO
await db.delete(clients).where(eq(clients.id, id))

// ✅ CORRECTO
await db.update(clients).set({ status: 'deleted', deletedAt: new Date() }).where(eq(clients.id, id))
```

### 3. Routing de IA (Pod vs Brain)

```typescript
// Pod = Rápido/Barato (Gemini Flash, Groq)
// Brain = Calidad/Caro (Claude, GPT-4)

// El router decide automáticamente basado en:
// - Tipo de mensaje (saludo → pod, queja → brain)
// - Contexto del cliente (VIP → brain)
// - Configuración del usuario (preferQuality → brain)

const decision = routeMessage({
  message: text,
  clientContext: { isVip, temperature },
  businessContext: { hasCustomPriceList, preferQuality },
})
// decision.path = 'pod' | 'brain'
```

### 4. Límites por Plan

```typescript
// Límites definidos en subscriptions:
interface PlanLimits {
  clientsLimit: number // Clientes máximos
  messagesLimit: number // Mensajes/mes
  aiSuggestionsLimit: number // Sugerencias IA/mes
}

// Verificar antes de operaciones:
if (subscription.clientsUsed >= subscription.clientsLimit) {
  throw new TRPCError({ code: 'FORBIDDEN', message: 'Límite alcanzado' })
}
```

### 5. Estructura de Exports

```typescript
// packages/api/src/index.ts
export { appRouter } from './root'
export type { AppRouter } from './root'
export { createContext } from './context'
export type { Context } from './context'

// Exportar tipos que el frontend necesita:
export type { InboxItem } from './routers/inbox'
export type { ClientScore } from './routers/scoring'
// ... añadir aquí cuando se creen nuevos tipos públicos
```

---

## 📝 CHECKLIST AL AÑADIR NUEVAS FUNCIONALIDADES

### Nuevo Router

- [ ] Crear archivo en `packages/api/src/routers/[nombre].ts`
- [ ] Añadir al root: `packages/api/src/root.ts`
- [ ] Exportar tipos públicos en `packages/api/src/index.ts`
- [ ] Documentar aquí en la sección correspondiente

### Nuevo Schema

- [ ] Crear archivo en `packages/db/src/schema/[nombre].ts`
- [ ] Exportar en `packages/db/src/schema/index.ts`
- [ ] Generar migración: `pnpm db:generate`
- [ ] Aplicar migración: `pnpm db:push`
- [ ] Documentar aquí en la sección correspondiente

### Nuevo Procedimiento

- [ ] Añadir al router correspondiente
- [ ] Incluir validación con Zod
- [ ] Filtrar siempre por `ctx.userId`
- [ ] Manejar errores con TRPCError
- [ ] Actualizar esta documentación

---

_Última actualización: 10 Dic 2025_
_Versión: 1.1.0_
_Verificado contra código: 66 routers, 460 procedures, 60 schemas_
