# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.4] - 2025-12-29

### Added

#### WhatsApp Lead Mining System (Database Layer)

- **`packages/db/drizzle/0015_mining_system.sql`** - Database migration for lead mining infrastructure:
  - **Enum**: `mining_status` - Processing states (pending, processing, completed, failed, retry)
  - **Table**: `mining_queue` - Input queue for raw phone numbers to validate
    - Phone data: `phone_number`, `country_code`
    - Execution control: `status`, `attempts`, `next_attempt_at`
    - Source tracking: `source` (google_maps, instagram_scrape, manual_csv), `batch_id`
    - Indexes: Optimized for worker queries (status + next_attempt)
  - **Table**: `qualified_leads` - Output for validated WhatsApp numbers
    - Validated data: `phone_number` (UNIQUE), `country_code`
    - Enriched WhatsApp data: `whatsapp_name`, `whatsapp_status`, `whatsapp_picture_url`, `is_business_account`
    - CRM integration: `converted_to_prospect_id` (links to prospects table)
    - Mining metadata: `mined_at`, `mining_queue_id`
    - Indexes: Phone number, conversion status, business accounts
  - **RLS Policies**: Service role full access, authenticated users read-only

- **`packages/db/src/schema/mining-queue.ts`** - Drizzle schema for mining queue:
  - Type-safe schema with Zod inference
  - Relations to `qualified_leads` table
  - Exported types: `MiningQueue`, `NewMiningQueue`, `MiningStatus`

- **`packages/db/src/schema/qualified-leads.ts`** - Drizzle schema for qualified leads:
  - Type-safe schema with unique constraint on `phone_number`
  - Relations to `mining_queue` and `prospects` tables
  - Exported types: `QualifiedLead`, `NewQualifiedLead`

- **Schema exports** updated in `packages/db/src/schema/index.ts`:
  - Added mining-queue and qualified-leads exports under "Lead Mining" section

### Technical

- **Architecture Design**: Separation of concerns "barro" (mud/queue) vs "oro" (gold/qualified)
  - `mining_queue`: Raw, unvalidated numbers for bulk processing
  - `qualified_leads`: Validated, WhatsApp-verified numbers ready for outreach
- **Purpose**: Unblock "Minero (Local 1)" bottleneck - lead generation infrastructure
- **Integration Ready**: Schema prepared for SMSPool service and WhatsApp validation workers
- Total schemas: 71 (was 69)

### Notes

- Migration file created but not yet applied to Supabase (authentication issues pending resolution)
- To apply migration manually: `cd packages/db && pnpm exec drizzle-kit push`
- Worker implementation pending (infrastructure layer complete)

## [0.3.3] - 2025-12-29

### Added

#### Corrective RAG with Hallucination Check (Complete)

- **`packages/ai/src/advanced-rag/crag-with-hallucination-check.ts`** - Enhanced Corrective RAG with hallucination detection:
  - `evaluateWithHallucinationCheck()`: Multi-layer document evaluation (CRAG + hallucination check)
  - `cragWithHallucinationCheck()`: Full pipeline with automatic fallback strategies
  - `CRAGWithHallucinationPipeline`: Class-based pipeline with configurable options
  - **Key Features**:
    - Combines CRAG relevance scoring with hallucination confidence
    - Automatic downgrade of documents with detected hallucinations
    - Multi-layer validation: CRAG evaluation → Hallucination check → Combined scoring
    - `finalScore = (cragConfidence + hallucinationConfidence) / 2`

- **`packages/api/src/routers/corrective-rag.ts`** - tRPC router with 3 endpoints:
  - `evaluate`: Document evaluation with CRAG + Hallucination Check
    - Input validation (Zod): query (1-500 chars), documents (1-20), thresholds (0-1)
    - Returns: evaluations with relevance, confidence, hallucination check results
    - Summary: total, correct, incorrect, ambiguous, hallucinationDetected
  - `correct`: Full Corrective RAG pipeline with refinement
    - Configurable thresholds: correctThreshold, incorrectThreshold
    - Optional hallucination check and web search fallback
    - Returns: action (keep/refine/search), refined documents, final context
  - `correctStreaming`: Real-time streaming version for progressive feedback
  - **Security**: All endpoints protected with `protectedProcedure` + `aiRateLimitGuard`

- **Integration with MCP/Tool Use**:
  - Bridge function `createHallucinationCheckFn()` wraps `hallucinationCheckerAgent`
  - Connects CRAG pipeline to existing `check_hallucination` tool (12 MCP tools total)
  - Enables agentic RAG with automatic hallucination detection in retrieval

#### Tests

- **`packages/api/src/__tests__/corrective-rag-validation.test.ts`** - 31 validation tests:
  - Document schema validation (5 tests)
  - Evaluate endpoint validation (10 tests)
  - Correct endpoint validation (8 tests)
  - Edge cases: unicode, special chars, boundaries (8 tests)

- **`apps/web/e2e/corrective-rag.spec.ts`** - E2E test suite:
  - Authentication (3 tests)
  - Input validation (6 tests)
  - Correct endpoint validation (4 tests)
  - Edge cases (6 tests)
  - Error handling (3 tests)
  - Rate limiting (2 tests)
  - Options handling (4 tests)
  - Document structure (6 tests)
  - Total: 34 E2E tests

#### Documentation

- **`docs/API-REFERENCE.md`**: Added `correctiveRAG` router to Inteligencia Artificial section
- **`packages/ai/src/advanced-rag/index.ts`**: Exported new CRAG + Hallucination Check module

### Technical

- Total routers: 67 (was 66)
- Hallucination detection now integrated into RAG pipeline
- Multi-layer validation ensures response accuracy and factual grounding
- Automatic fallback strategies prevent hallucinated information in responses

## [0.3.2] - 2025-12-05

### Added

#### Referral System (Complete)

- `packages/api/src/routers/referrals.ts` - Full referral router with 10+ endpoints:
  - `getMyCode`: Get or generate user's referral code (WALLIE-XXXXXX format)
  - `regenerateCode`: Generate new unique code
  - `getStats`: Referral statistics (total, pending, converted)
  - `invite`: Send email invitation
  - `list`: List all referrals with pagination/filtering
  - `validateCode`: Public endpoint to validate referral code
  - `convertReferral`: Convert referral on registration
  - `claimReward`: Claim referral reward
  - `getInviteUrl`: Get shareable invite URL
  - `inviteViaWhatsapp`: Bulk WhatsApp invitations via Inngest

- `packages/db/src/schema/referrals.ts` - Referral schema:
  - `referrals` table: tracks invitations (referrer, referred, status, rewards)
  - `referralCodes` table: user referral codes with usage limits

- `packages/db/src/schema/user-features.ts` - Unlockable features schema:
  - Track unlocked features per user (spy agent, migration assistant, etc.)
  - Feature history with unlock timestamps and sources

- `packages/workers/src/functions/referral-invites.ts` - Inngest workers:
  - `sendWhatsappInvite`: Individual WhatsApp invite with random delay
  - `batchSendInvites`: Batch processing with progressive delays
  - Message variations to prevent spam detection

#### Auth Integration

- `apps/web/src/app/(auth)/register/page.tsx`:
  - Detect `?ref=CODE` query parameter on registration
  - Validate referral code via tRPC
  - Show referral bonus banner when valid code detected
  - Store referral code in user metadata during signup

- `apps/web/src/app/auth/callback/route.ts`:
  - Process referral after successful authentication
  - Create referral record linking referrer to new user

#### Stripe Integration

- `apps/web/src/app/api/webhooks/stripe/route.ts`:
  - Convert pending referrals on payment success
  - Update referral status to 'converted'
  - Increment successful referrals counter

#### Reward System

- Multiple reward types supported:
  - `free_month`: Apply Stripe coupon for free months
  - `unlock_agent`: Enable features in userFeatures table
  - `gamification`: Add points to user score
  - `credits`: Add AI credits to subscription

### Technical

- Added `referralStatusEnum` to enums (pending, converted, expired)
- Updated workers client with new event types
- 36 tRPC routers total, 34 DB schemas

## [0.2.0] - 2025-11-30

### Added

#### Dashboard & UI

- Dashboard principal con layout WhatsApp-style (dark theme)
- Página de conversaciones con lista y vista de chat
- Página de clientes con Kanban por pipeline status
- Formulario de crear/editar cliente con validación Zod
- Página de estadísticas con KPIs:
  - Total clientes, conversaciones, mensajes del mes
  - Revenue total (deals ganados)
  - Distribución del pipeline
  - Funnel de conversión
- Página de ajustes con:
  - Perfil de usuario (nombre, negocio, sector, teléfono)
  - Configuración de IA (autopilot, horarios)
  - Plan y uso (límites)
  - Estado de WhatsApp Business
- Dark mode con next-themes
- Componentes UI: Dialog, Label, Textarea, Select, Input (WhatsApp theme)

#### API (tRPC)

- `clientsRouter`: CRUD clientes, getByPipeline, updatePipelineStatus
- `conversationsRouter`: lista, mensajes, envío
- `tagsRouter`: CRUD tags, asignación a clientes/conversaciones
- `statsRouter`: overview, pipelineDistribution, recentActivity, conversionFunnel
- `settingsRouter`: profile, AI settings, subscription, usage
- `whatsappRouter`: webhook verification, message handling

#### WhatsApp Integration

- Webhook para recibir mensajes de WhatsApp Business API
- Procesamiento de mensajes entrantes
- Auto-reply con IA (OpenAI) configurable

#### Database

- Schema completo con Drizzle ORM:
  - profiles, subscriptions
  - clients, conversations, messages
  - tags, client_tags, conversation_tags
  - reminders
- Enums: subscription_plan, subscription_status, message_direction, message_status, pipeline_status

#### AI

- Integración OpenAI para generación de respuestas
- Sistema de auto-reply configurable por horarios

### Technical

- Monorepo con Turborepo + pnpm workspaces
- Next.js 14 App Router
- tRPC v11 para type-safe API
- Supabase Auth + PostgreSQL
- TypeScript strict mode
- ESLint + Prettier configurados

## [0.1.0] - 2025-11-29

### Added

- Configuración inicial del monorepo
- Estructura de packages: api, db, ai, auth, whatsapp, ui
- Configuración de Turborepo
- Setup de Supabase y Drizzle ORM
- Schemas básicos de base de datos
- Configuración de Next.js 14
