# 🚀 Roadmap Features - Documentación Completa

## 1. Integraciones Opcionales (Corto Plazo)

### Pinecone (Vector DB)
- **Propósito:** Búsqueda de similitud semántica entre debates.
- **Implementación:** `packages/quoorum/src/integrations/pinecone.ts`
- **Features:**
  - Creación automática de index si no existe
  - Generación de embeddings con `text-embedding-3-small`
  - Operaciones CRUD: `upsert`, `search`, `delete`
  - Batch operations: `batchUpsert`, `deleteMany`
  - Analytics: `getIndexStats`
  - Migración de debates existentes
- **Uso:** `question-similarity.ts` ahora usa `searchSimilarDebates` para encontrar debates relevantes.

### Serper (Search API)
- **Propósito:** Carga de contexto en tiempo real desde internet.
- **Implementación:** `packages/quoorum/src/integrations/serper.ts`
- **Features:**
  - Búsqueda web y de noticias
  - Carga de contexto para una pregunta (web + news)
  - Búsquedas específicas de industria (trends, competitors, market data)
  - Batch search con rate limiting
  - Caching en memoria con TTL
  - Analytics de uso
- **Uso:** `context-loader.ts` ahora usa `loadContextForQuestion` para obtener contexto relevante.

## 2. Optimizaciones (Corto Plazo)

### Redis Caching
- **Propósito:** Caching avanzado para mejorar performance y reducir costos.
- **Implementación:** `packages/quoorum/src/integrations/redis.ts`
- **Features:**
  - Conexión a Redis con fallback a in-memory cache
  - Operaciones CRUD: `get`, `set`, `delete`, `exists`
  - Caching de debates, listas de debates, y resultados de similitud
  - Caching de analytics
  - Rate limiting (ver abajo)
  - Session management
  - Lock management para evitar race conditions
  - Batch operations: `multiGet`, `multiSet`
  - Limpieza de cache y estadísticas

### Rate Limiting Granular
- **Propósito:** Control de uso y costos por tier de usuario.
- **Implementación:** `packages/quoorum/src/rate-limiting-advanced.ts`
- **Features:**
  - 4 tiers: `free`, `starter`, `pro`, `enterprise`
  - Límites por debates/hora, debates/día, rondas/debate, debates concurrentes, y costo/día
  - Algoritmos de sliding window y token bucket
  - Tracking de debates activos y costos
  - Funciones de admin para ver estado y dar debates extra

## 3. Mejoras de UX (Corto Plazo)

### Onboarding & Ayuda
- **Propósito:** Mejorar la experiencia de nuevos usuarios.
- **Implementación:** `apps/web/src/components/quoorum/onboarding.tsx`
- **Features:**
  - **Onboarding Modal:** Tutorial interactivo de 5 pasos para nuevos usuarios.
  - **Quick Start Guide:** Guía rápida accesible en cualquier momento.
  - **Feature Highlights:** Notificaciones para descubrir nuevas features.
  - **Contextual Help:** Iconos de ayuda en la UI para explicar conceptos clave.

### Tooltips
- **Propósito:** Proveer información contextual sin saturar la UI.
- **Implementación:** `apps/web/src/components/quoorum/tooltips.tsx`
- **Features:**
  - Sistema de tooltips genérico con delay y posicionamiento
  - 10+ variantes predefinidas: `DebateMode`, `Consensus`, `SuccessRate`, `QualityScore`, `Cost`, `Rich`, `Info`, `KeyboardShortcut`, `FeatureBadge`, `Expert`, `Stat`.

## 4. Features Adicionales (Medio Plazo)

### Debate Scheduling
- **Propósito:** Programar debates para que se ejecuten en el futuro.
- **Implementación:** `packages/quoorum/src/scheduling.ts`
- **Features:**
  - **One-time scheduling:** Programar un debate para una fecha y hora específicas.
  - **Recurring scheduling:** Programar debates recurrentes (diario, semanal, mensual).
  - CRUD completo para debates programados y recurrentes.
  - Limpieza automática de debates completados.

### Custom Templates
- **Propósito:** Crear y reusar templates para debates comunes.
- **Implementación:** `packages/quoorum/src/custom-templates.ts`
- **Features:**
  - 6 templates predefinidos (Pivot, Pricing, Features, Market Entry, Retention, Fundraising).
  - CRUD completo para templates personalizados.
  - Variables en templates para rellenar datos.
  - Analytics de uso por template.

### Integraciones de Mensajería
- **Propósito:** Notificar a equipos sobre el estado de los debates.
- **Implementación:** `packages/quoorum/src/integrations/messaging.ts`
- **Features:**
  - **Slack:** Notificaciones con formato enriquecido (attachments, colores).
  - **Discord:** Notificaciones con embeds.
  - Notificaciones para inicio y fin de debates.
  - Sistema de webhooks para eventos personalizados.
  - Handler de slash commands (placeholder).

## 5. Analytics Avanzados (Medio Plazo)

### Métricas y Dashboards
- **Propósito:** Proveer insights profundos sobre el uso y performance del sistema.
- **Implementación:**
  - `packages/quoorum/src/analytics-advanced.ts` (lógica)
  - `apps/web/src/components/quoorum/admin-dashboard.tsx` (UI)
- **Features:**
  - **Cálculo de Métricas:** 20+ métricas (avg consensus, avg cost, top experts, etc.).
  - **User Analytics:** Reportes por usuario con trends y breakdown de costos.
  - **Admin Dashboard:** Vista global con overview, crecimiento, top users, y system health.
  - **Cost Tracking:** Tracking detallado de costos por modelo y operación.
  - **Usage Metrics:** Métricas de uso para reportes de negocio.
  - **Export:** Exportar reportes a JSON y CSV.
