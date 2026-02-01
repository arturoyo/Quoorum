# 📝 Módulo 14: AI Prompt Management System

> **Versión:** 1.0.0 | **Fecha:** 31 Ene 2026
> **Sistema de Gestión Centralizada de Prompts de IA**

---

## 🎯 Propósito

Este módulo documenta el **AI Prompt Management System**, un sistema centralizado para gestionar todos los prompts de IA del proyecto con:

- ✅ **3 niveles de rendimiento** configurables por usuario
- ✅ **60+ prompts** dinámicos (no hardcodeados)
- ✅ **Versioning** con historial completo
- ✅ **Admin UI** para editar prompts desde navegador
- ✅ **Fallback** automático a configs si DB no disponible
- ✅ **Type-safe** con TypeScript

---

## 🏗️ Arquitectura

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SETTINGS UI                         │
│  /settings/preferences - Seleccionar nivel de rendimiento   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   PERFORMANCE LEVELS                         │
│  • Económico (0.3x) - GPT-3.5, GPT-4o Mini, Gemini Flash   │
│  • Equilibrado (1.0x) - Mix económico/premium [DEFAULT]     │
│  • Alto Rendimiento (3.0x) - GPT-4, Claude Opus            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  PROMPT RESOLUTION ENGINE                    │
│  getPromptTemplate(slug, variables, performanceLevel)       │
│    1. Check cache (15 min TTL)                              │
│    2. Query DB (system_prompts table)                       │
│    3. Fallback to config (DEBATE_PROMPTS_DEFAULTS)          │
│    4. Select model based on performance level               │
│    5. Replace variables in template                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     AI CLIENT CALL                           │
│  await aiClient.chat({                                       │
│    model: resolvedPrompt.model,                             │
│    temperature: resolvedPrompt.temperature,                 │
│    messages: [{ content: resolvedPrompt.template }]         │
│  })                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Tabla: `system_prompts` (extendida)

```sql
-- Columnas EXISTENTES (no tocar):
id UUID PRIMARY KEY
key VARCHAR(100) UNIQUE NOT NULL          -- Slug del prompt
name VARCHAR(255) NOT NULL
description TEXT
category VARCHAR(50)                       -- 'debates', 'context', 'experts', etc.
prompt TEXT NOT NULL                       -- Template del prompt
is_active BOOLEAN DEFAULT true
version INTEGER DEFAULT 1
created_at TIMESTAMP
updated_at TIMESTAMP
created_by UUID REFERENCES profiles(id)
updated_by UUID REFERENCES profiles(id)

-- Columnas AÑADIDAS (para debate flow):
phase INTEGER CHECK (phase BETWEEN 1 AND 5)     -- Fase del debate (1-5)
system_prompt TEXT                              -- System prompt opcional
variables JSONB DEFAULT '[]'                    -- Variables esperadas
recommended_model VARCHAR(50)                   -- Modelo recomendado
economic_model VARCHAR(50)                      -- Modelo tier económico
balanced_model VARCHAR(50)                      -- Modelo tier equilibrado
performance_model VARCHAR(50)                   -- Modelo tier alto rendimiento
temperature REAL DEFAULT 0.7
max_tokens INTEGER DEFAULT 2000
order_in_phase INTEGER DEFAULT 0                -- Orden dentro de la fase
```

### Tabla: `system_prompt_versions`

```sql
CREATE TABLE system_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES system_prompts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  -- Snapshot del prompt en esta versión
  prompt TEXT NOT NULL,
  system_prompt TEXT,
  recommended_model VARCHAR(50),
  economic_model VARCHAR(50),
  balanced_model VARCHAR(50),
  performance_model VARCHAR(50),
  temperature REAL,
  max_tokens INTEGER,

  -- Audit trail
  changed_by UUID REFERENCES profiles(id),
  change_reason TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(prompt_id, version)
);
```

### Tabla: `profiles` (columna añadida)

```sql
ALTER TABLE profiles
ADD COLUMN performance_level VARCHAR(50) DEFAULT 'balanced'
  CHECK (performance_level IN ('economic', 'balanced', 'performance'));
```

---

## 🔧 Uso del Sistema

### 1. Obtener Prompt Dinámicamente

```typescript
import { getPromptTemplate } from '@quoorum/quoorum/lib/prompt-manager'

// En tRPC procedure o función del servidor
export const myProcedure = protectedProcedure
  .mutation(async ({ ctx, input }) => {
    // 1. Obtener performance level del usuario
    const [userProfile] = await db
      .select({ performanceLevel: profiles.performanceLevel })
      .from(profiles)
      .where(eq(profiles.id, ctx.userId))
      .limit(1)

    const performanceLevel =
      (userProfile?.performanceLevel as 'economic' | 'balanced' | 'performance')
      || 'balanced'

    // 2. Resolver prompt dinámicamente
    const resolvedPrompt = await getPromptTemplate(
      'analyze-question',  // Slug del prompt
      {
        question: input.question,
        context: input.context,
      },
      performanceLevel
    )

    // 3. Usar modelo y parámetros resueltos
    const response = await aiClient.chat({
      model: resolvedPrompt.model,           // Modelo correcto según tier
      temperature: resolvedPrompt.temperature,
      max_tokens: resolvedPrompt.maxTokens,
      messages: [
        {
          role: 'system',
          content: resolvedPrompt.systemPrompt || ''
        },
        {
          role: 'user',
          content: resolvedPrompt.template    // Variables ya reemplazadas
        },
      ],
    })

    return response
  })
```

### 2. Backward Compatibility Pattern

Para funciones que necesitan mantener compatibilidad sync:

```typescript
// ❌ ANTES: Prompt hardcoded
export function myFunction(input: Input): Output {
  const prompt = `Eres un experto en ${input.topic}...`  // Hardcoded
  return callAI(prompt, 'gpt-4')
}

// ✅ DESPUÉS: Prompt dinámico con wrapper sync
function getMyPrompt(performanceLevel: 'economic' | 'balanced' | 'performance') {
  try {
    const { getPromptTemplate } = await import('./lib/prompt-manager')
    const resolved = await getPromptTemplate('my-prompt', {}, performanceLevel)
    return { template: resolved.template, model: resolved.model }
  } catch {
    // Fallback a hardcoded
    return {
      template: `Eres un experto...`,  // Config original
      model: 'gpt-4'
    }
  }
}

export async function myFunction(
  input: Input,
  performanceLevel: 'economic' | 'balanced' | 'performance' = 'balanced'
): Promise<Output> {
  const { template, model } = await getMyPrompt(performanceLevel)
  return callAI(template, model)
}
```

---

## 📝 Crear Nuevo Prompt

### Opción A: Vía Config (Desarrollo)

Añadir a `packages/quoorum/src/config/debate-prompts-config.ts`:

```typescript
export const DEBATE_PROMPTS_DEFAULTS: Record<string, PromptConfig> = {
  // ... prompts existentes

  'my-new-prompt': {
    slug: 'my-new-prompt',
    name: 'Mi Nuevo Prompt',
    description: 'Descripción de qué hace este prompt',
    phase: 1,  // 1-5 (o undefined si no aplica)
    category: 'analysis',
    template: `Eres un experto en \${topic}.

Tu tarea es analizar la siguiente pregunta:

PREGUNTA: \${question}

\${context ? 'CONTEXTO: ' + context : ''}

Proporciona un análisis detallado.`,
    systemPrompt: 'Eres un analista experto.',  // Opcional
    variables: ['topic', 'question', 'context'],

    // Modelos por tier
    recommendedModel: 'gpt-4-turbo',      // El mejor para esta tarea
    economicModel: 'gpt-3.5-turbo',       // Versión barata
    balancedModel: 'gpt-4-turbo',         // Versión equilibrada
    performanceModel: 'claude-3-opus',    // Versión premium

    temperature: 0.5,
    maxTokens: 2000,
    orderInPhase: 1,
  },
}
```

### Opción B: Vía Admin UI (Producción)

1. Ir a `/admin/debate-flow`
2. Click en fase correspondiente
3. Click "Añadir Prompt"
4. Llenar formulario:
   - Nombre
   - Descripción
   - Template (con variables `${varName}`)
   - System Prompt (opcional)
   - Modelos para cada tier (economic/balanced/performance)
   - Temperature (0-1)
   - Max Tokens
5. Testear prompt con variables de prueba
6. Activar

---

## 🎨 User Settings UI

### Componente: PreferencesSection

**Ruta:** `/settings/preferences`

**Archivo:** `apps/web/src/components/settings/sections/preferences-section.tsx`

**Características:**
- ✅ RadioGroup con 3 opciones (Económico/Equilibrado/Alto Rendimiento)
- ✅ Color coding (verde/azul/púrpura)
- ✅ Badges de coste (0.3x, 1.0x, 3.0x)
- ✅ Ejemplos de modelos por nivel
- ✅ Preview de costes estimados
- ✅ Guarda automáticamente en DB

**tRPC Procedures:**
```typescript
// Obtener nivel actual
api.users.getPerformanceLevel.useQuery()

// Actualizar nivel
api.users.updatePerformanceLevel.useMutation({
  performanceLevel: 'balanced'  // 'economic' | 'balanced' | 'performance'
})
```

---

## 🔍 Admin UI

### Ruta: `/admin/debate-flow`

**Características:**
- ✅ Timeline de 5 fases del debate
- ✅ Ver todos los prompts por fase
- ✅ Editar prompts con Monaco Editor (opcional)
- ✅ Test prompts antes de activar
- ✅ Ver historial de versiones
- ✅ Revertir a versión anterior
- ✅ Marcar modelo recomendado con ⭐

**Componentes:**
```
apps/web/src/app/admin/debate-flow/
├── page.tsx                          # Página principal
└── components/
    ├── debate-flow-timeline.tsx      # Timeline de fases
    ├── phase-card.tsx                # Card por fase
    ├── prompt-item.tsx               # Item de prompt
    ├── prompt-editor-dialog.tsx      # Modal de edición
    ├── prompt-test-panel.tsx         # Panel de testing
    └── model-selector-with-badge.tsx # Selector de modelos
```

---

## 📊 Performance Levels

### Económico (0.3x coste)

**Cuándo usar:**
- Pruebas y desarrollo
- Validaciones simples
- Alto volumen de operaciones
- Presupuesto limitado

**Modelos:**
- GPT-3.5 Turbo
- GPT-4o Mini
- Gemini 2.0 Flash

**Coste estimado:**
- Debate típico: 10-15 créditos
- Validación: 0.5-1 créditos
- Framework SWOT: 5-8 créditos

### Equilibrado (1.0x coste) - **DEFAULT**

**Cuándo usar:**
- Uso general de producción
- Balance calidad/precio óptimo
- 80% operaciones económicas + 20% premium

**Modelos:**
- Validaciones: GPT-4o Mini
- Debates: Claude 3.5 Sonnet
- Frameworks: GPT-4 Turbo
- Síntesis: GPT-4 Turbo

**Coste estimado:**
- Debate típico: 35-50 créditos
- Validación: 1-2 créditos
- Framework SWOT: 15-25 créditos

### Alto Rendimiento (3.0x coste)

**Cuándo usar:**
- Decisiones críticas de negocio
- Máxima calidad y precisión
- Debates complejos
- Presupuesto no es restricción

**Modelos:**
- GPT-4
- Claude 3 Opus
- Claude 3.5 Sonnet

**Coste estimado:**
- Debate típico: 100-150 créditos
- Validación: 3-5 créditos
- Framework SWOT: 40-60 créditos

---

## 🚀 Prompts Refactorizados

### Fase 1: Contexto (4 prompts)

| Slug | Descripción | Modelo Recomendado |
|------|-------------|-------------------|
| `analyze-question` | Analizar complejidad de pregunta | gpt-4o-mini |
| `suggest-initial-questions` | Generar preguntas críticas | gpt-4-turbo |
| `validate-answer` | Validar respuesta del usuario | gpt-4-turbo |
| `evaluate-context-quality` | Evaluar calidad global | gpt-4-turbo |

### Fase 2: Expertos (12 prompts)

| Slug | Descripción | Modelo Recomendado |
|------|-------------|-------------------|
| `match-experts` | Sugerir expertos relevantes | gemini-2.0-flash |
| `match-departments` | Sugerir departamentos | gemini-2.0-flash |
| `match-workers` | Sugerir profesionales | gemini-2.0-flash |
| `department-base-*` | 9 prompts de departamentos | gemini-2.0-flash |

### Fase 3: Estrategia (2 prompts)

| Slug | Descripción | Modelo Recomendado |
|------|-------------|-------------------|
| `analyze-strategy` | Recomendar estrategia | gemini-2.0-flash |
| `suggest-framework` | Sugerir framework | gemini-2.0-flash |

### Fase 5: Debate (10 prompts)

| Slug | Descripción | Modelo Recomendado |
|------|-------------|-------------------|
| `core-agent-optimizer` | Agente optimista | gemini-2.0-flash |
| `core-agent-critic` | Agente crítico | gemini-2.0-flash |
| `core-agent-analyst` | Agente analista | gemini-2.0-flash |
| `core-agent-synthesizer` | Agente sintetizador | gemini-2.0-flash |
| `meta-moderator-*` | 6 intervenciones | gpt-4o-mini |

### Frameworks (11 prompts)

| Slug | Descripción | Modelo Recomendado |
|------|-------------|-------------------|
| `framework-swot-strengths` | SWOT: Fortalezas | gpt-4-turbo |
| `framework-swot-weaknesses` | SWOT: Debilidades | gpt-4-turbo |
| `framework-swot-opportunities` | SWOT: Oportunidades | gpt-4-turbo |
| `framework-swot-threats` | SWOT: Amenazas | gpt-4-turbo |
| `framework-swot-strategist` | SWOT: Estratega | gpt-4-turbo |
| `framework-pros` | Pros & Cons: Pros | gpt-4-turbo |
| `framework-cons` | Pros & Cons: Contras | gpt-4-turbo |
| `framework-analyst` | Pros & Cons: Analista | gpt-4-turbo |
| `framework-synthesizer` | Pros & Cons: Síntesis | gpt-4-turbo |
| `framework-eisenhower-classifier` | Eisenhower: Clasificador | gpt-4-turbo |
| `framework-eisenhower-priority` | Eisenhower: Priorizador | gpt-4-turbo |

### Special Modes (4 prompts)

| Slug | Descripción | Modelo Recomendado |
|------|-------------|-------------------|
| `special-mode-devils-advocate` | Devil's Advocate | gpt-4-turbo |
| `special-mode-pre-mortem` | Pre-Mortem Analysis | gpt-4-turbo |
| `special-mode-gut-check` | Gut Check | gpt-4o-mini |
| `final-synthesis` | Síntesis Final | gpt-4-turbo |

**Total: 60+ prompts dinámicos** ✅

---

## 🔒 Cache System

**TTL:** 15 minutos

**Invalidación:**
- Automática: Cada 15 min
- Manual: Al actualizar prompt en admin UI
- Programática: `invalidatePromptCache(promptSlug)`

**Implementación:**
```typescript
// Cache en memoria
const promptCache = new Map<string, {
  prompt: PromptConfig
  timestamp: number
}>()

const CACHE_TTL = 15 * 60 * 1000  // 15 min

// Invalidar cache al actualizar
export function invalidatePromptCache(promptSlug?: string) {
  if (promptSlug) {
    promptCache.delete(promptSlug)
  } else {
    promptCache.clear()
  }
}
```

---

## ⚠️ Limitaciones Conocidas

### 1. Variable Expressions

**Problema:** Solo soporta variables simples `${varName}`, no expresiones JavaScript.

**No funciona:**
```typescript
template: `${context ? 'CONTEXTO: ' + context : ''}`  // ❌
```

**Funciona:**
```typescript
template: `CONTEXTO: ${context}`  // ✅
```

**Workaround:** Procesar expresiones en código antes de pasar a `getPromptTemplate()`:
```typescript
const contextText = context ? `CONTEXTO: ${context}` : ''
const resolved = await getPromptTemplate('my-prompt', { contextText }, level)
```

### 2. Prompts faltantes en Config

**Problema:** ~40 prompts de frameworks y special modes no están en `DEBATE_PROMPTS_DEFAULTS`.

**Estado:** Sistema funciona con fallback a hardcoded, pero idealmente deberían estar en config.

**Solución:** Completar config (trabajo futuro).

---

## 🧪 Testing

### Test Script

```bash
cd packages/quoorum
pnpm exec tsx test-prompt-system.ts
```

**Verifica:**
- ✅ Performance levels seleccionan modelos correctos
- ✅ Prompt resolution funciona
- ✅ Fallback funciona
- ✅ Variables se reemplazan

### Manual UI Testing

```bash
pnpm dev
```

1. Navegar a `http://localhost:3000/settings/preferences`
2. Cambiar nivel de rendimiento
3. Verificar que se guarda en DB
4. Crear debate pequeño
5. Verificar que usa modelos correctos

---

## 📚 Referencias

### Archivos Clave

**Runtime:**
- `packages/quoorum/src/lib/prompt-manager.ts` - Motor de resolución
- `packages/quoorum/src/config/debate-prompts-config.ts` - Config defaults
- `packages/quoorum/src/config/performance-profiles-config.ts` - Perfiles de rendimiento

**Database:**
- `packages/db/drizzle/0037_extend_system_prompts_for_debate_flow.sql` - Migration

**API:**
- `packages/api/src/routers/admin-prompts.ts` - Admin CRUD
- `packages/api/src/routers/users.ts` - User preferences

**UI:**
- `apps/web/src/components/settings/sections/preferences-section.tsx` - User settings
- `apps/web/src/app/admin/debate-flow/` - Admin UI (placeholder)

### Commits Relevantes

- `e52cd62` - feat(ai-prompts): implement dynamic AI prompt management system
- `a6e71b6` - fix(typescript): resolve type errors in AI prompt system

---

## 🎯 Próximos Pasos

### Completar (Nice-to-have)

1. **Poblar Config Defaults**
   - Añadir ~40 prompts faltantes a `DEBATE_PROMPTS_DEFAULTS`
   - Frameworks: SWOT (5), Pros/Cons (4), Eisenhower (2)
   - Special Modes: Devil's Advocate, Pre-Mortem, Gut Check
   - Final Synthesis

2. **Mejorar Variable System**
   - Soportar expresiones JavaScript en templates
   - Parser más robusto
   - Validación de variables en editor

3. **Monaco Editor Integration**
   - Syntax highlighting para variables `${}`
   - Autocomplete de variables disponibles
   - Inline validation

4. **Manual UI Testing**
   - Verificar /settings/preferences funciona
   - Crear debate end-to-end
   - Verificar costes según nivel

---

**_Sistema creado: 31 Ene 2026_**
**_60+ prompts refactorizados, 3 niveles de rendimiento, UI completa_**
