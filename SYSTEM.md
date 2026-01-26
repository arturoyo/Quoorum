# 🏗️ SYSTEM.md — Arquitectura Completa del Sistema Quoorum

> **Versión:** 1.2.1 | **Última actualización:** 30 Dic 2025
> **Arquitectura:** Quoorum - Comité Ejecutivo de IA (Capa de Inteligencia Corporativa) para Decisiones Estratégicas

---

## 📋 ÍNDICE

1. [Visión General](#-visión-general)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Capas del Sistema](#-capas-del-sistema)
4. [Packages del Monorepo](#-packages-del-monorepo)
5. [Flujos de Datos](#-flujos-de-datos)
6. [Infraestructura](#-infraestructura)
7. [Seguridad](#-seguridad)
8. [Escalabilidad](#-escalabilidad)

---

## 🎯 VISIÓN GENERAL

### ¿Qué es Quoorum?

**Quoorum** es la única plataforma que simula un **Comité Ejecutivo de expertos de IA** (la **Capa de Inteligencia Corporativa**) para debatir, criticar y sintetizar la mejor decisión estratégica. 

**Elimina los sesgos humanos y la lentitud de las reuniones**, entregando un **consenso accionable en minutos** en lugar de semanas de reuniones interminables.

El sistema utiliza múltiples expertos virtuales especializados que debaten hasta alcanzar consenso, con búsqueda vectorial de debates similares y exportación a PDF.

### Arquitectura "Quoorum Swarm"

```
┌─────────────────────────────────────────────────────────────────┐
│                       QUOORUM SWARM                             │
│              Sistema Multi-Agente de IA para Debates            │
├─────────────────────────────────────────────────────────────────┤
│  Orquestación: tRPC + Inngest + CrewAI-like Architecture       │
│  Coordinación: Event-Driven + Background Jobs                  │
│  Inteligencia: OpenAI, Anthropic, Google AI, Groq              │
└─────────────────────────────────────────────────────────────────┘
```

**Principios Arquitectónicos:**

1. **Multi-Agente:** Cada agente es un especialista (email, calendario, prospecting)
2. **Event-Driven:** Comunicación asíncrona entre agentes vía Inngest
3. **Modular:** Packages independientes con responsabilidades claras
4. **Type-Safe:** TypeScript estricto + Zod para validación
5. **Real-Time:** Supabase Realtime para sincronización instantánea

---

## 🏛️ ARQUITECTURA DEL SISTEMA

### Vista de Alto Nivel

```
┌──────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js 14)                      │
│                      apps/web/ - App Router                      │
├──────────────────────────────────────────────────────────────────┤
│                        API LAYER (tRPC v11)                      │
│                      packages/api/ - 85 Routers                  │
├──────────────────────────────────────────────────────────────────┤
│                     ORCHESTRATION LAYER                          │
│  ┌─────────────────┬──────────────────┬─────────────────────┐  │
│  │   Agents        │    Workers       │    AI Core          │  │
│  │  (Specialized)  │   (Background)   │  (Multi-Provider)   │  │
│  │  packages/      │   packages/      │   packages/ai/      │  │
│  │  agents/        │   workers/       │                     │  │
│  └─────────────────┴──────────────────┴─────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                    DATA LAYER (Drizzle ORM)                      │
│                    packages/db/ - 69 Schemas                     │
├──────────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE (Supabase + Vercel)              │
│         PostgreSQL + Auth + Storage + Realtime + Edge            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📦 PACKAGES DEL MONOREPO

### Frontend App

**`apps/web/`** - Next.js 14 Application

```
Tecnologías:
- Next.js 14 (App Router)
- React 18 (Server + Client Components)
- Tailwind CSS + shadcn/ui
- TanStack Query (React Query)
- Zustand (State Management)

Responsabilidades:
- UI/UX para dashboard
- Gestión de clientes y conversaciones
- Configuración de agentes
- Analytics y reportes
```

### Core Packages

#### `packages/api/` - API Layer (tRPC)

```
85 Routers tRPC:
- auth.ts, clients.ts, conversations.ts, messages.ts
- gmail.ts, whatsapp.ts, whatsapp-connections.ts
- ai.ts, voice.ts, rewards.ts, quoorum.ts
- admin-growth.ts, integrations.ts, support.ts
- sessions.ts, referrals.ts, addons.ts
- phone-auth.ts, magic-link.ts, onboarding-analysis.ts
- psychology-engine.ts, persona-detection.ts, reciprocity.ts
- emotional-intelligence.ts, behavior-dna.ts
- ... y 65+ routers más (ver API-REFERENCE.md)

Utilidades:
- logger.ts (Logging estructurado + Sentry)
- google-gmail.ts (Cliente Gmail)
- voice.ts (ElevenLabs integration)
- tier-limits.ts (Rate limiting)
- rule-evaluator.ts (Sistema de reglas)
```

#### `packages/db/` - Database Layer (Drizzle ORM)

```
69 Schemas:
- users.ts, clients.ts, conversations.ts, messages.ts
- email.ts, subscriptions.ts, dynamic-plans.ts
- rewards.ts, integrations.ts, support-tickets.ts
- feedback.ts, growth.ts, whatsapp.ts
- psychology.ts (16 nested tables), admin-config.ts
- compliance.ts, voice-calls.ts, knowledge.ts
- client-live-profile.ts, agent-events.ts
- ... y 50+ schemas más (ver packages/db/src/schema/)

Database: PostgreSQL (Supabase)
ORM: Drizzle (Type-safe)
Migrations: drizzle-kit
```

#### `packages/ai/` - AI Core (Multi-Provider + Tool Use)

```
Providers:
- OpenAI (GPT-4, GPT-4-Turbo) + Tool Use nativo
- Anthropic (Claude Sonnet, Opus) + Tool Use nativo
- Google AI (Gemini Pro, Flash)
- Groq (LLaMA inference)
- LiteLLM (unified interface)

Features:
- Prompt builder system
- Voice context builder
- Support context builder
- Client enrichment agent
- RAG + Embeddings (Gemini text-embedding-004, 768 dims)
- Embedding cache (Redis/Upstash, 15x más rápido)

⭐ MCP/Tool Use (Agentic RAG) - NUEVO (27 Dic 2025):
- 12 tool definitions nativos (search_client_knowledge, search_sales_bible, etc.)
- generateWithTools() - Agentic loop con max iterations
- Tool executor bridge (ToolCall → Agent → ToolResult)
- 18/25 tipos de RAG habilitados (+100% mejora)
- Multi-Hop RAG, Corrective RAG, Self-RAG, Chain-of-Retrieval
- Type-safe end-to-end con TypeScript

Archivos clave:
- packages/ai/src/tools/definitions.ts (12 tools)
- packages/ai/src/providers/unified-client.ts (generateWithTools)
- packages/api/src/lib/tool-executor.ts (bridge)
- packages/api/src/routers/quoorum.ts (agenticChat endpoint)
```

#### `packages/agents/` - Specialized AI Agents

```
Agentes:
- email-handler.ts (Gestión de emails automática)
- calendar.ts (Google Calendar integration)
- prospecting.ts (Lead generation)

Tecnologías:
- Google Gemini (multimodal)
- Cheerio (web scraping)
- Drizzle ORM
```

#### `packages/workers/` - Background Jobs (Inngest)

```
27 Workers Inngest:
- gmail-sync.ts (cada 5 min)
- linkedin-sync.ts (cada 15 min)
- outlook-sync.ts (cada 10 min)
- conversation-analysis.ts (on-demand)
- psychology-analysis.ts (on-demand)
- emotion-analysis.ts (on-demand)
- persona-update.ts (on-demand)
- client-classification.ts (on-demand)
- client-churn-detection.ts (diario)
- campaign-scheduler.ts (cada minuto)
- sequence-runner.ts (cada 5 min)
- referral-invites.ts (on-demand)
- weekly-report.ts (semanal)
- data-backup.ts (diario)
- knowledge-ingestion.ts (on-demand)
- audio-received.ts (on-demand)
- ... y 11+ workers más (ver packages/workers/src/functions/)
```

### Integration Packages

#### `packages/whatsapp/` - WhatsApp Integration

```
Estrategia Dual:
1. WhatsApp Cloud API (Producción)
   - API oficial de Meta
   - Requiere Business account
   - Rate limits oficiales

2. Baileys (Desarrollo)
   - Open-source
   - WhatsApp Web protocol
   - QR code login

Features:
- Envío/recepción de mensajes
- Media handling (imágenes, audios, videos)
- Webhooks
- Connection management
```

#### `packages/baileys-worker/` - WhatsApp Baileys Worker

```
Tecnologías:
- Express server
- @whiskeysockets/baileys
- Session management
- QR code generation
```

#### `packages/email/` - Email Integration

```
Providers:
- Resend (Transactional emails)
- Gmail API (OAuth2 sync)
- Outlook (Microsoft Graph)

Templates:
- React Email components
- Welcome, reset-password, etc.
```

#### `packages/stripe/` - Payment Integration

```
Features:
- Subscription management
- Webhook handlers
- Invoice generation
- Plan upgrades/downgrades
```

### Utility Packages

#### `packages/auth/` - Authentication

```
Provider: Supabase Auth
Methods:
- Email + Password
- Magic Links
- Phone OTP (via WhatsApp)
- OAuth (Google, LinkedIn)
```

#### `packages/types/` - Shared Types

```
Tipos compartidos entre packages:
- User, Client, Message types
- API response types
- Zod schemas compartidos
```

#### `packages/ui/` - UI Components

```
Componentes compartidos:
- shadcn/ui base components
- Custom hooks
- Utilities (cn, formatters)
```

---

## 🔄 FLUJOS DE DATOS

### Flujo 1: Mensaje de WhatsApp Entrante

```
┌─────────────┐
│  WhatsApp   │
│  Cloud API  │
└──────┬──────┘
       │ (1) Webhook POST
       ▼
┌──────────────────────────┐
│ /api/webhooks/whatsapp   │
│ Validate signature       │
└──────┬───────────────────┘
       │ (2) Parse payload
       ▼
┌──────────────────────────┐
│ tRPC Router              │
│ whatsapp.receiveMessage  │
└──────┬───────────────────┘
       │ (3) Store in DB
       ▼
┌──────────────────────────┐
│ Drizzle: messages table  │
│ + Update conversation    │
└──────┬───────────────────┘
       │ (4) Trigger worker
       ▼
┌──────────────────────────┐
│ Inngest Worker           │
│ conversation-analysis    │
└──────┬───────────────────┘
       │ (5) AI processing
       ▼
┌──────────────────────────┐
│ AI Multi-Provider        │
│ Analyze + Generate       │
└──────┬───────────────────┘
       │ (6) Send response
       ▼
┌──────────────────────────┐
│ WhatsApp Cloud API       │
│ Send message             │
└──────────────────────────┘
```

### Flujo 2: Campaign Automation

```
Admin crea campaign
       │
       ▼
Store in DB (campaigns table)
       │
       ▼
campaign-scheduler worker (cada minuto)
       │
       ├─→ Find scheduled campaigns
       ├─→ Get recipients list
       ├─→ Filter: not contacted + rate limit OK
       │
       └─→ For each recipient:
            ├─ Personalize message (AI)
            ├─ Send via WhatsApp/Email
            ├─ Mark as sent
            └─ Schedule next step
```

### Flujo 3: Email Sync

```
gmail-sync worker (cada 5 min)
       │
       ├─→ Get OAuth tokens from DB
       │
       ├─→ Gmail API: list messages
       │
       ├─→ For each new email:
       │    ├─ Store in email_threads table
       │    ├─ Extract client info
       │    ├─ Trigger email-handler agent
       │    │
       │    └─→ Agent:
       │         ├─ Analyze intent
       │         ├─ Generate response
       │         └─ Send via Gmail API
       │
       └─→ Update last_sync_at
```

---

## 🔒 SEGURIDAD

### Capas de Seguridad

1. **Autenticación (Supabase Auth)**
   - Multi-factor authentication
   - Session management
   - Token refresh automático

2. **Autorización (RLS + tRPC)**
   - Row Level Security en PostgreSQL
   - Filtrado por userId en TODAS las queries
   - Validación de permisos en cada endpoint

3. **Rate Limiting (Upstash Redis)**
   - Por usuario
   - Por IP
   - Por tier de subscripción

4. **Input Validation (Zod)**
   - Todos los inputs validados
   - Type-safe en runtime
   - Error messages descriptivos

5. **Output Sanitization**
   - No exponer datos sensibles
   - Omitir passwords, tokens, API keys
   - Logs sin PII (Personal Identifiable Information)

6. **Secrets Management**
   - Variables de entorno (.env.local)
   - Nunca hardcoded
   - Validación con @t3-oss/env-nextjs

### Ejemplo de Query Seguro

```typescript
// ✅ CORRECTO - Filtra por userId
const client = await db
  .select()
  .from(clients)
  .where(
    and(
      eq(clients.id, input.id),
      eq(clients.userId, ctx.userId) // ⚠️ OBLIGATORIO
    )
  )

// ❌ INCORRECTO - Cualquiera puede ver cualquier cliente
const client = await db.select().from(clients).where(eq(clients.id, input.id))
```

---

## 📈 ESCALABILIDAD

### Estrategias

1. **Horizontal Scaling**
   - Vercel Edge Functions (auto-scaling)
   - Serverless (no límite de concurrent executions)

2. **Database Scaling**
   - Connection Pooler (PgBouncer)
   - Read replicas (futuro)
   - Índices optimizados

3. **Caching**
   - Browser cache (Next.js ISR)
   - Redis cache (Upstash)
   - React Query cache

4. **Background Processing**
   - Inngest workers (offload heavy tasks)
   - Retry automático
   - Rate limiting por worker

5. **AI Provider Fallback**
   - Si OpenAI falla → Groq
   - Si Anthropic falla → Google AI
   - Redundancia para alta disponibilidad

---

## 🔍 MONITORING

### Stack

- **Sentry** - Error tracking (Frontend + Backend)
- **PostHog** - Analytics + Feature flags
- **Inngest Dashboard** - Worker monitoring
- **Vercel Analytics** - Web vitals
- **Logger Estructurado** - JSON logs → Sentry

### Ejemplo de Log

```typescript
import { logger } from '@quoorum/api/lib/logger'

// Log con contexto
logger.info('Cliente creado', {
  userId: ctx.userId,
  clientId: client.id,
  clientName: client.name,
})

// Error con stack trace
logger.error('Error al crear cliente', error, {
  userId: ctx.userId,
  input: sanitizedInput,
})
```

---

## 🚀 DEPLOYMENT

### Ambientes

| Ambiente    | URL               | Database       | Workers       |
| ----------- | ----------------- | -------------- | ------------- |
| Development | localhost:3000    | Local/Supabase | Local         |
| Staging     | staging.quoorum.ai | Staging DB     | Inngest Cloud |
| Production  | app.quoorum.ai     | Prod DB (EU)   | Inngest Cloud |

### CI/CD

```
GitHub Push → main branch
       │
       ├─→ Vercel Build
       │    ├─ TypeScript check
       │    ├─ Lint
       │    ├─ Tests
       │    └─ Deploy to Edge
       │
       ├─→ Database Migrations (manual)
       │    └─ pnpm db:push
       │
       └─→ Workers Auto-sync
            └─ Inngest syncs from code
```

---

## 📚 DEPENDENCIAS CLAVE

### Runtime

```json
{
  "@trpc/server": "11.x",
  "drizzle-orm": "^0.44.7",
  "next": "14.x",
  "openai": "^4.104.0",
  "@anthropic-ai/sdk": "^0.71.2",
  "@google/generative-ai": "^0.24.1",
  "groq-sdk": "^0.37.0",
  "inngest": "^3.31.0",
  "@supabase/supabase-js": "^2.86.0",
  "zod": "^3.23.0"
}
```

### Dev

```json
{
  "typescript": "^5.3.0",
  "vitest": "^4.0.15",
  "eslint": "^8.55.0",
  "prettier": "^3.1.0",
  "drizzle-kit": "^0.31.7"
}
```

---

## 🎯 ROADMAP

### Q4 2025 (Completado)

- [x] Monorepo con Turborepo
- [x] 69 schemas de base de datos
- [x] 85 routers tRPC
- [x] 27 workers Inngest
- [x] Multi-provider AI (OpenAI, Anthropic, Google, Groq)
- [x] Psychology Engine completo
- [x] Migrar console.log → logger (Sentry)
- [x] Eliminar tipos `any` (0 any types)
- [x] 0 ESLint warnings
- [x] E2E tests con Playwright

### Q2 2025

- [ ] Redis caching layer
- [ ] Database read replicas
- [ ] Advanced analytics dashboard
- [ ] A/B testing de modelos AI
- [ ] Real-time collaboration

### Q3-Q4 2025

- [ ] Multi-tenancy optimization
- [ ] Self-hosted option
- [ ] Plugin system
- [ ] Advanced RAG con vector DB
- [ ] Voice AI (llamadas telefónicas)

---

**Última actualización:** 30 Dic 2025
**Versión:** 1.2.1
**Mantenido por:** Equipo Quoorum
