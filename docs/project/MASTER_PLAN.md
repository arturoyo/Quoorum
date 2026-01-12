# MASTER_PLAN.md — Arquitectura Técnica Completa

---

## 1. Visión del Producto

### Qué es Wallie

> **El asistente de ventas para WhatsApp que aprende tu estilo y nunca olvida un seguimiento.**

### Propuesta de valor

1. **Sincroniza** tu WhatsApp Business automáticamente
2. **Organiza** clientes con tags, pipeline, calendario
3. **Aprende** cómo escribes TÚ
4. **Responde** como tú (copiloto o automático)
5. **Recuerda** a quién escribir
6. **Predice** oportunidades de venta
7. **Conecta** con email, calendario, facturas

### Target

- Autónomos y pymes en España
- Usan WhatsApp Business como canal principal
- 50+ conversaciones activas
- Pierden ventas por mal seguimiento
- Ticket medio > €200

---

## 2. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENTE                                │
│                    (Next.js App - Browser)                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         NEXT.JS API                              │
│                    (App Router + tRPC)                           │
├─────────────────────────────────────────────────────────────────┤
│  /api/trpc/*        │  /api/webhook/whatsapp  │  /api/webhook/* │
│  (tRPC handlers)    │  (WA Business API)      │  (Stripe, etc)  │
└─────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    SUPABASE      │ │     OPENAI       │ │   EXTERNOS       │
│                  │ │                  │ │                  │
│ • Auth           │ │ • GPT-4o-mini    │ │ • WhatsApp API   │
│ • Postgres       │ │ • Embeddings     │ │ • Gmail/Outlook  │
│ • Storage        │ │                  │ │ • Google Cal     │
│ • Realtime       │ │                  │ │ • Stripe         │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 3. Stack Técnico

### Core

| Capa            | Tecnología   | Versión           |
| --------------- | ------------ | ----------------- |
| Framework       | Next.js      | 14.x (App Router) |
| Lenguaje        | TypeScript   | 5.x               |
| Estilos         | Tailwind CSS | 3.x               |
| Componentes     | shadcn/ui    | latest            |
| API             | tRPC         | 11.x              |
| ORM             | Drizzle      | latest            |
| Validación      | Zod          | 3.x               |
| Monorepo        | Turborepo    | latest            |
| Package manager | pnpm         | 8.x               |

### Infraestructura

| Servicio      | Proveedor           | Uso                      |
| ------------- | ------------------- | ------------------------ |
| Base de datos | Supabase (Postgres) | Datos + Auth             |
| Hosting       | Vercel              | App + API                |
| AI            | OpenAI              | GPT-4o-mini + Embeddings |
| WhatsApp      | 360dialog / Twilio  | Business API             |
| Email         | Resend              | Transaccional            |
| Pagos         | Stripe              | Suscripciones            |
| Storage       | Supabase Storage    | Documentos               |
| Analytics     | PostHog             | Producto                 |
| Errors        | Sentry              | Monitoreo                |

---

## 4. Estructura del Monorepo

```
wallie/
├── apps/
│   └── web/                          # Next.js App
│       ├── src/
│       │   ├── app/                  # App Router
│       │   │   ├── (auth)/           # Rutas públicas
│       │   │   │   ├── login/
│       │   │   │   └── register/
│       │   │   ├── (dashboard)/      # Rutas protegidas
│       │   │   │   ├── chats/
│       │   │   │   ├── pipeline/
│       │   │   │   ├── calendar/
│       │   │   │   ├── todos/
│       │   │   │   └── settings/
│       │   │   ├── api/
│       │   │   │   ├── trpc/[trpc]/
│       │   │   │   └── webhook/
│       │   │   │       ├── whatsapp/
│       │   │   │       └── stripe/
│       │   │   └── layout.tsx
│       │   ├── components/
│       │   │   ├── chat/
│       │   │   ├── client/
│       │   │   ├── pipeline/
│       │   │   ├── wallie/
│       │   │   └── ui/               # shadcn
│       │   ├── lib/
│       │   │   ├── utils.ts
│       │   │   └── constants.ts
│       │   └── server/
│       │       └── actions/
│       ├── public/
│       ├── tailwind.config.ts
│       ├── next.config.js
│       └── package.json
│
├── packages/
│   ├── db/                           # Base de datos
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── users.ts
│   │   │   │   ├── clients.ts
│   │   │   │   ├── conversations.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── tags.ts
│   │   │   │   ├── reminders.ts
│   │   │   │   ├── documents.ts
│   │   │   │   └── subscriptions.ts
│   │   │   ├── index.ts
│   │   │   └── client.ts
│   │   ├── drizzle/
│   │   │   └── migrations/
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── api/                          # tRPC
│   │   ├── src/
│   │   │   ├── routers/
│   │   │   │   ├── clients.ts
│   │   │   │   ├── conversations.ts
│   │   │   │   ├── messages.ts
│   │   │   │   ├── tags.ts
│   │   │   │   ├── reminders.ts
│   │   │   │   ├── wallie.ts
│   │   │   │   ├── documents.ts
│   │   │   │   └── billing.ts
│   │   │   ├── root.ts
│   │   │   ├── trpc.ts
│   │   │   └── context.ts
│   │   └── package.json
│   │
│   ├── ai/                           # Inteligencia Artificial
│   │   ├── src/
│   │   │   ├── openai.ts             # Cliente OpenAI
│   │   │   ├── embeddings.ts         # Generar embeddings
│   │   │   ├── generate.ts           # Generar mensajes
│   │   │   ├── style-analyzer.ts     # Analizar estilo
│   │   │   ├── rag.ts                # Retrieval
│   │   │   └── prompts/
│   │   │       ├── system.ts
│   │   │       ├── suggest-message.ts
│   │   │       └── wallie-chat.ts
│   │   └── package.json
│   │
│   ├── whatsapp/                     # WhatsApp Business API
│   │   ├── src/
│   │   │   ├── client.ts             # API client
│   │   │   ├── webhook.ts            # Procesar webhooks
│   │   │   ├── send.ts               # Enviar mensajes
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   └── package.json
│   │
│   ├── email/                        # Email (Gmail/Outlook)
│   │   ├── src/
│   │   │   ├── gmail.ts
│   │   │   ├── outlook.ts
│   │   │   ├── sync.ts
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   ├── agents/                       # Agentes IA
│   │   ├── src/
│   │   │   ├── orchestrator.ts       # Decide qué agente usar
│   │   │   ├── search.ts             # Búsqueda web
│   │   │   ├── documents.ts          # RAG documentos
│   │   │   ├── invoices.ts           # Facturas
│   │   │   ├── calendar.ts           # Google Calendar
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   ├── integrations/                 # Integraciones externas
│   │   ├── src/
│   │   │   ├── google-calendar.ts
│   │   │   ├── holded.ts
│   │   │   ├── stripe.ts
│   │   │   └── types.ts
│   │   └── package.json
│   │
│   └── ui/                           # Componentes compartidos
│       ├── src/
│       │   ├── chat-bubble.tsx
│       │   ├── client-card.tsx
│       │   ├── pipeline-column.tsx
│       │   └── index.ts
│       └── package.json
│
├── tooling/
│   ├── eslint/
│   │   └── index.js
│   └── typescript/
│       └── base.json
│
├── .env.example
├── .gitignore
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 5. Modelo de Datos

### Diagrama ER

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │  profiles   │       │   clients   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──────<│ user_id(FK) │       │ id (PK)     │
│ email       │       │ business    │   ┌──>│ user_id(FK) │
│ created_at  │       │ phone       │   │   │ name        │
└─────────────┘       │ sector      │   │   │ phone       │
                      │ wa_connected│   │   │ email       │
                      │ style_data  │   │   │ company     │
                      └─────────────┘   │   │ status      │
                                        │   │ pipeline    │
┌─────────────┐                         │   │ notes       │
│    tags     │       ┌─────────────┐   │   │ last_contact│
├─────────────┤       │ client_tags │   │   └─────────────┘
│ id (PK)     │──────<│ tag_id (FK) │   │          │
│ user_id(FK) │       │ client_id   │>──┘          │
│ name        │       └─────────────┘              │
│ color       │                                    │
└─────────────┘                                    │
                      ┌─────────────┐              │
                      │conversations│              │
                      ├─────────────┤              │
                      │ id (PK)     │<─────────────┘
                      │ client_id   │
                      │ channel     │  (whatsapp/email)
                      │ wa_chat_id  │
                      │ last_msg_at │
                      └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │  messages   │
                      ├─────────────┤
                      │ id (PK)     │
                      │ conv_id(FK) │
                      │ direction   │  (in/out)
                      │ content     │
                      │ sent_at     │
                      │ read_at     │
                      │ embedding   │  (vector)
                      └─────────────┘

┌─────────────┐       ┌─────────────┐
│  reminders  │       │  documents  │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ user_id(FK) │       │ user_id(FK) │
│ client_id   │       │ client_id   │  (null=global)
│ type        │       │ name        │
│ due_at      │       │ type        │
│ status      │       │ content     │
│ note        │       │ embedding   │
│ predicted   │       │ created_at  │
└─────────────┘       └─────────────┘

┌─────────────┐
│subscriptions│
├─────────────┤
│ id (PK)     │
│ user_id(FK) │
│ plan        │
│ stripe_id   │
│ status      │
│ ends_at     │
└─────────────┘
```

### Schema Drizzle (ejemplo)

```typescript
// packages/db/src/schema/clients.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  company: text('company'),
  status: text('status').default('active'), // active, archived
  pipeline: text('pipeline').default('lead'), // lead, contacted, proposal, negotiation, won, lost
  notes: text('notes'),
  lastContactAt: timestamp('last_contact_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

---

## 6. API (tRPC Routers)

### Estructura

```typescript
// packages/api/src/root.ts
import { router } from './trpc'
import { clientsRouter } from './routers/clients'
import { conversationsRouter } from './routers/conversations'
import { messagesRouter } from './routers/messages'
import { tagsRouter } from './routers/tags'
import { remindersRouter } from './routers/reminders'
import { wallieRouter } from './routers/wallie'
import { documentsRouter } from './routers/documents'
import { billingRouter } from './routers/billing'

export const appRouter = router({
  clients: clientsRouter,
  conversations: conversationsRouter,
  messages: messagesRouter,
  tags: tagsRouter,
  reminders: remindersRouter,
  wallie: wallieRouter,
  documents: documentsRouter,
  billing: billingRouter,
})

export type AppRouter = typeof appRouter
```

### Ejemplo Router

```typescript
// packages/api/src/routers/wallie.ts
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

export const wallieRouter = router({
  // Obtener resumen diario
  getDailySummary: protectedProcedure.query(async ({ ctx }) => {
    // Lógica para generar resumen
  }),

  // Sugerir mensaje para un cliente
  suggestMessage: protectedProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Lógica IA para sugerir mensaje
    }),

  // Chat con Wallie
  chat: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Lógica de chat conversacional
    }),
})
```

---

## 7. Flujo de WhatsApp

### Webhook (recibir mensaje)

```
WhatsApp API
     │
     ▼
/api/webhook/whatsapp (POST)
     │
     ├─ Verificar firma
     ├─ Parsear mensaje
     ├─ Buscar/crear cliente
     ├─ Guardar mensaje
     ├─ Generar embedding
     │
     ├─ ¿Piloto automático ON?
     │      │
     │      YES ──> Generar respuesta IA
     │              Enviar respuesta
     │              Guardar en log
     │
     └─ Notificar UI (Realtime)
```

### Enviar mensaje

```
UI: Click "Enviar"
     │
     ▼
tRPC: messages.send
     │
     ├─ Guardar en DB
     ├─ Llamar WhatsApp API
     ├─ Actualizar last_contact
     └─ Generar embedding
```

---

## 8. Flujo de IA

### Generar sugerencia de mensaje

```
Input: clientId
     │
     ▼
1. Obtener contexto
   ├─ Últimos 20 mensajes
   ├─ Ficha cliente (notas, tags)
   ├─ Documentos relacionados (RAG)
   └─ Estilo del usuario
     │
     ▼
2. Construir prompt
   ├─ System: "Eres Wallie..."
   ├─ Contexto: "Cliente: Juan, último msg hace 4 días..."
   ├─ Estilo: "El usuario escribe de forma cercana, usa emojis..."
   └─ Instrucción: "Genera mensaje de seguimiento"
     │
     ▼
3. Llamar OpenAI (GPT-4o-mini)
     │
     ▼
4. Devolver sugerencia
```

### Clonar estilo

```
Input: Mensajes del usuario (últimos 100)
     │
     ▼
1. Analizar patrones
   ├─ Longitud media
   ├─ Uso de emojis
   ├─ Formalidad
   ├─ Saludos típicos
   ├─ Despedidas
   └─ Expresiones frecuentes
     │
     ▼
2. Guardar en profile.style_data
     │
     ▼
3. Usar en cada generación
```

---

## 9. Agentes

### Orquestador

```typescript
// packages/agents/src/orchestrator.ts
export async function orchestrate(query: string, context: Context) {
  // 1. Determinar qué agente(s) necesita
  const intent = await detectIntent(query)

  // 2. Ejecutar agente(s)
  let results = []

  if (intent.needsWebSearch) {
    results.push(await searchAgent.run(query))
  }

  if (intent.needsDocuments) {
    results.push(await documentsAgent.run(query, context.userId))
  }

  if (intent.needsInvoices) {
    results.push(await invoicesAgent.run(query, context.clientId))
  }

  // 3. Sintetizar respuesta
  return synthesize(query, results, context)
}
```

### Agente de búsqueda

```typescript
// packages/agents/src/search.ts
import { serper } from './providers/serper'

export const searchAgent = {
  async run(query: string) {
    const results = await serper.search(query)
    return {
      source: 'web',
      data: results.slice(0, 5),
    }
  },
}
```

---

## 10. Integraciones

### WhatsApp Business API

| Proveedor    | Pros              | Contras        |
| ------------ | ----------------- | -------------- |
| 360dialog    | Barato, EU-based  | Menos features |
| Twilio       | Robusto, docs     | Más caro       |
| Meta directo | Sin intermediario | Más complejo   |

**Recomendación:** Empezar con 360dialog por coste.

### Gmail/Outlook

```typescript
// packages/email/src/gmail.ts
import { google } from 'googleapis'

export async function syncEmails(userId: string, tokens: Tokens) {
  const gmail = google.gmail({ version: 'v1', auth: getAuth(tokens) })

  const messages = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 50,
  })

  // Procesar y guardar
}
```

### Stripe

```typescript
// packages/integrations/src/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const plans = {
  starter: 'price_xxx',
  pro: 'price_yyy',
  business: 'price_zzz',
}
```

---

## 11. Seguridad

### RLS (Row Level Security)

```sql
-- Ejemplo: clients solo visibles por su owner
CREATE POLICY "Users can only see their clients"
ON clients FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can only insert their clients"
ON clients FOR INSERT
WITH CHECK (user_id = auth.uid());
```

### Validación

```typescript
// Siempre validar input con Zod
const createClientSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/),
  email: z.string().email().optional(),
})
```

### Rate Limiting

```typescript
// En webhook de WhatsApp
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})
```

---

## 12. Despliegue

### Entornos

| Entorno    | Infraestructura       | Cuándo     |
| ---------- | --------------------- | ---------- |
| Local      | localhost             | Desarrollo |
| Staging    | Miniservidor          | Fases 0-7  |
| Producción | Vercel + Supabase Pro | Fase 8+    |

### Variables de entorno

```bash
# .env.example
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# WhatsApp
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_VERIFY_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email
RESEND_API_KEY=

# Google (Calendar, Gmail)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 13. Costes Estimados

### Por usuario activo (mes)

| Servicio     | Coste                            |
| ------------ | -------------------------------- |
| WhatsApp API | ~€5-10 (100 conversaciones)      |
| OpenAI       | ~€2-5 (sugerencias + embeddings) |
| Supabase     | ~€0.50 (prorrateado)             |
| Vercel       | ~€0.20 (prorrateado)             |
| **Total**    | **~€8-15/usuario**               |

### Márgenes por plan

| Plan          | Precio | Coste | Margen      |
| ------------- | ------ | ----- | ----------- |
| Starter €49   | €49    | ~€10  | ~€39 (80%)  |
| Pro €99       | €99    | ~€15  | ~€84 (85%)  |
| Business €199 | €199   | ~€25  | ~€174 (87%) |

---

## 14. Métricas Clave

### Producto

- DAU/MAU (engagement)
- Mensajes enviados via Wallie
- % sugerencias aceptadas
- % piloto automático activado
- Tiempo respuesta medio

### Negocio

- MRR
- Churn rate
- LTV
- CAC
- NPS

---

_Última actualización: 29 Nov 2025_
