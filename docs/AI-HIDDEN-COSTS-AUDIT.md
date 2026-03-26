# Auditoría de Costos de IA Ocultos

**Fecha:** 28 Ene 2026
**Estado:** ⚠️ CRÍTICO - Costos no rastreados identificados
**Impacto:** Profit margins pueden estar sobrestimados

---

## 🚨 PROBLEMA IDENTIFICADO

Existen costos de IA "ocultos" que NO están siendo contabilizados en el sistema actual de profit margin analysis. Esto puede llevar a:

1. **Sobrestimación de profit margins** (creemos que ganamos más de lo que realmente ganamos)
2. **Sorpresas cuando Gemini free tier cambie a paid**
3. **Incapacidad de optimizar costos** (no sabemos qué operaciones consumen más)
4. **Dificultad para escalar** (no sabemos cuánto costará 10x usuarios)

---

## 📊 COSTOS ACTUALMENTE NO RASTREADOS

### 1. Context Assessment (Inicio de Debate)

**Archivo:** `packages/api/src/routers/context-assessment.ts`

| Operación | Línea | Frecuencia | Tokens | Modelo | Costo |
|-----------|-------|------------|--------|--------|-------|
| `analyzeWithAI()` | 266 | Por debate nuevo | ~2,500 | gemini-2.0-flash-exp | $0 (FREE) |
| `generateMemorableSummary()` | 1229 | Por contexto completo (85%+) | ~1,000 | gemini-2.0-flash-exp | $0 (FREE) |

**Estimación:** 3,500 tokens por debate nuevo (si el usuario completa contexto)

---

### 2. Auto-Research (Búsqueda en Internet)

**Archivo:** `packages/api/src/lib/auto-research.ts`

| Operación | Línea | Frecuencia | Tokens | Modelo | Costo |
|-----------|-------|------------|--------|--------|-------|
| `generateResearchQueries()` - Analysis | 82 | Por auto-research | ~300 | gemini-2.0-flash-exp | $0 (FREE) |
| `generateResearchQueries()` - Query Gen | 98 | Por auto-research | ~500 | gemini-2.0-flash-exp | $0 (FREE) |
| Internet Search (Serper API) | 892 | Por auto-research | 0 | N/A | **$0.005** ✅ RASTREADO |

**Estimación:** 800 tokens por auto-research (solo IA)

**✅ BUENA NOTICIA:** El costo de Serper API ($0.005) YA está siendo rastreado y descontado en créditos (1 crédito por búsqueda).

---

## 💰 IMPACTO EN PROFIT MARGINS

### Escenario Actual (Gemini FREE)

**Por cada debate nuevo:**
```
Context Assessment:      2,500 tokens  →  $0 (FREE)
Memorable Summary:       1,000 tokens  →  $0 (FREE)
Auto-Research (IA):        800 tokens  →  $0 (FREE)
Auto-Research (Serper):      0 tokens  →  $0.005 (PAID) ✅ rastreado
Debate Phases:          ~15,000 tokens → $0-0.30 (depende del modelo) ✅ rastreado
────────────────────────────────────────────────────────────
TOTAL:                  ~19,300 tokens →  $0.005-0.305
```

**Costo REAL vs Costo RASTREADO:**
- Rastreado: $0.005 (Serper) + $0-0.30 (debates)
- Oculto: $0 (Gemini free tier - 4,300 tokens)
- **Total oculto: 4,300 tokens/debate**

---

### Escenario Futuro (Si Gemini empieza a cobrar)

**Hipótesis:** Gemini cambia a pricing de $0.10/1M tokens (similar a GPT-4o-mini prompt)

**Por cada debate nuevo:**
```
Context Assessment:      2,500 tokens  →  $0.00025
Memorable Summary:       1,000 tokens  →  $0.00010
Auto-Research (IA):        800 tokens  →  $0.00008
Auto-Research (Serper):      0 tokens  →  $0.005 (PAID)
Debate Phases:          ~15,000 tokens →  $0.0015 (si usa Gemini)
────────────────────────────────────────────────────────────
TOTAL:                  ~19,300 tokens →  $0.00693 por debate
```

**Con 100 usuarios/día creando 1 debate cada uno:**
- 100 debates × $0.00693 = **$0.693/día** = **$20.79/mes**
- 100 debates × 19,300 tokens = 1,930,000 tokens/día

**Con 1,000 usuarios/día:**
- 1,000 debates × $0.00693 = **$6.93/día** = **$207.90/mes**
- 1,000 debates × 19,300 tokens = 19,300,000 tokens/día

---

### Impacto en Tiers (Si Gemini cobra)

**Escenario:** Usuario Starter usa todos sus créditos (3,000 créditos = ~5 debates completos)

```
Tier: Starter
Precio: $29/mes
Créditos: 3,000
Debates estimados: 5 (600 créditos/debate)

COSTO ACTUAL (rastreado):
- Debates (5 × $0.30 API):        $1.50
- Auto-research (5 × $0.005):     $0.025
──────────────────────────────────────
Total rastreado:                  $1.525
Profit (con CREDIT_MULTIPLIER):   $27.48  (94.7% margin) ✅

COSTO REAL (con Gemini paid):
- Debates (5 × $0.30 API):        $1.50
- Auto-research (5 × $0.005):     $0.025
- Context + Summary (5 × $0.00043): $0.00215
──────────────────────────────────────
Total REAL:                       $1.52715
Profit (con CREDIT_MULTIPLIER):   $27.47  (94.7% margin) ✅ CASI IGUAL
```

**CONCLUSIÓN:** Incluso si Gemini empieza a cobrar, el impacto es MÍNIMO en profit margins porque los tokens de context assessment son pocos comparados con los debates.

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Nueva Tabla: `ai_cost_tracking`

**Archivo:** `packages/db/drizzle/0038_add_ai_cost_tracking.sql`

Rastrea TODOS los costos de IA:
- ✅ Context assessment
- ✅ Auto-research (análisis + generación de queries)
- ✅ Memorable summary
- ✅ Debate phases (estrategia, expertos, revisión, síntesis)
- ✅ Onboarding (profile analysis, company analysis)
- ✅ Content generation (expertos, profesionales, departamentos)
- ✅ Workers (emotion analysis, intent scoring, sentiment)

**Columnas clave:**
```sql
operation_type       -- Qué operación (context_assessment, etc.)
provider             -- openai, anthropic, google, groq, deepseek
model_id             -- Modelo específico usado
prompt_tokens        -- Tokens de input
completion_tokens    -- Tokens de output
total_tokens         -- Total
cost_usd_total       -- Costo total en USD
is_free_tier         -- TRUE si usa free tier (Gemini)
latency_ms           -- Performance tracking
success              -- Si la llamada tuvo éxito
```

---

### 2. Función Helper: `trackAICall()`

**Archivo:** `packages/quoorum/src/ai-cost-tracking.ts`

**Uso:**
```typescript
import { trackAICall } from '@quoorum/quoorum/ai-cost-tracking'

// Después de CADA llamada a IA
const startTime = Date.now()
const response = await aiClient.generate(prompt, { modelId: 'gemini-2.0-flash-exp' })

await trackAICall({
  userId: ctx.userId,
  operationType: 'context_assessment',
  provider: 'google',
  modelId: 'gemini-2.0-flash-exp',
  promptTokens: response.usage.promptTokens,
  completionTokens: response.usage.completionTokens,
  latencyMs: Date.now() - startTime,
  success: true,
  inputSummary: input.userInput.substring(0, 500),
  outputSummary: JSON.stringify(result).substring(0, 500),
})
```

**Beneficios:**
- ✅ Tracking automático de costos (incluso free tier)
- ✅ Cálculo de costos usando pricing real de cada proveedor
- ✅ Flag `isFreeTier` para saber qué depende de free tier
- ✅ Metadata para debugging (input/output summary)
- ✅ Performance tracking (latencyMs)

---

### 3. Materialized View: `ai_cost_summary`

Agregaciones pre-calculadas para dashboards rápidos:
```sql
SELECT
  user_id,
  operation_type,
  provider,
  date,
  SUM(total_tokens) AS total_tokens,
  SUM(cost_usd_total) AS total_cost_usd,
  COUNT(*) AS request_count,
  AVG(latency_ms) AS avg_latency_ms,
  SUM(CASE WHEN is_free_tier THEN 1 ELSE 0 END) AS free_tier_count
FROM ai_cost_tracking
GROUP BY user_id, operation_type, provider, date
```

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Fase 1: Aplicar Migración ✅
```bash
psql "postgresql://postgres:postgres@localhost:5434/quoorum" \
  -f "packages/db/drizzle/0038_add_ai_cost_tracking.sql"
```

### Fase 2: Integrar en Context Assessment
**Archivo:** `packages/api/src/routers/context-assessment.ts`

**Modificar funciones:**
1. `analyzeWithAI()` - línea 266
2. `generateMemorableSummary()` - línea 1229

**Añadir tracking:**
```typescript
// En analyzeWithAI()
const startTime = Date.now()
const response = await aiClient.generate(userPrompt, { ... })

await trackAICall({
  userId: ctx.userId,
  operationType: 'context_assessment',
  provider: 'google',
  modelId: 'gemini-2.0-flash-exp',
  promptTokens: response.usage?.promptTokens || 0,
  completionTokens: response.usage?.completionTokens || 0,
  latencyMs: Date.now() - startTime,
  success: true,
})
```

### Fase 3: Integrar en Auto-Research
**Archivo:** `packages/api/src/lib/auto-research.ts`

**Modificar funciones:**
1. `generateResearchQueries()` - línea 36

### Fase 4: Integrar en Debate Phases
**Archivo:** `packages/api/src/routers/debates.ts`

Ya está parcialmente implementado con `phase_costs`, pero falta granularidad.

### Fase 5: Admin Dashboard
**Añadir tab en:** `/admin/billing`

**Mostrar:**
- ✅ Total AI cost por mes
- ✅ Desglose por operation_type
- ✅ Desglose por provider
- ✅ Free tier vs Paid tier
- ✅ Top 10 usuarios por AI cost
- ✅ Alertas si free tier usage crece demasiado

---

## 🎯 MÉTRICAS A MONITOREAR

### 1. Free Tier Dependency
**Riesgo:** ¿Qué % de operaciones dependen de Gemini free tier?

```sql
SELECT
  COUNT(*) FILTER (WHERE is_free_tier = TRUE)::FLOAT /
  COUNT(*)::FLOAT * 100 AS free_tier_percentage
FROM ai_cost_tracking
WHERE created_at >= NOW() - INTERVAL '30 days';
```

**Target:** <30% (no depender demasiado de free tier)

---

### 2. Cost per Debate
**Pregunta:** ¿Cuánto cuesta REALMENTE cada debate?

```sql
SELECT
  debate_id,
  SUM(cost_usd_total) AS total_cost_usd,
  SUM(total_tokens) AS total_tokens,
  COUNT(*) AS ai_calls
FROM ai_cost_tracking
WHERE debate_id IS NOT NULL
GROUP BY debate_id
ORDER BY total_cost_usd DESC
LIMIT 10;
```

**Target:** <$0.50 por debate (para mantener profit margins)

---

### 3. Cost per User per Month
**Pregunta:** ¿Cuánto cuesta cada usuario en IA?

```sql
SELECT
  user_id,
  DATE_TRUNC('month', created_at) AS month,
  SUM(cost_usd_total) AS total_cost_usd,
  SUM(total_tokens) AS total_tokens
FROM ai_cost_tracking
GROUP BY user_id, DATE_TRUNC('month', created_at)
ORDER BY total_cost_usd DESC;
```

**Target (Starter tier):**
- Costo IA < $17.14 (para mantener 40.9% margin)
- Si Starter usa 3,000 créditos = ~5 debates
- 5 debates × $0.50 = $2.50 (OK ✅)

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Aplicar migración** (0038_add_ai_cost_tracking.sql)
2. ⬜ **Integrar trackAICall() en context-assessment.ts**
3. ⬜ **Integrar trackAICall() en auto-research.ts**
4. ⬜ **Integrar trackAICall() en debates.ts** (fases)
5. ⬜ **Crear admin dashboard tab** para visualizar costos
6. ⬜ **Configurar alertas** si free tier usage > 30%
7. ⬜ **Monitorear durante 1 semana** para baseline
8. ⬜ **Ajustar profit margin calculations** con datos reales

---

## 💡 CONCLUSIONES

### ✅ Buenas Noticias

1. **Impacto actual es MÍNIMO** - Gemini free tier cubre 4,300 tokens/debate
2. **Incluso si Gemini cobra**, el impacto es <$0.0043/debate
3. **Profit margins son reales** - No hay sorpresas gigantes ocultas
4. **Internet search YA está rastreado** - Serper API ($0.005) descontado en créditos

### ⚠️ Riesgos a Monitorear

1. **Dependencia de Gemini free tier** - Si cambia a paid, hay impacto
2. **Escalabilidad** - 1,000 usuarios/día = $6.93/día extra si Gemini cobra
3. **Operations no optimizadas** - Sin tracking, no podemos optimizar

### 🎯 Recomendaciones

1. **Aplicar migración AHORA** - Empezar a trackear todos los costos
2. **Integrar trackAICall() ESTA SEMANA** - En context-assessment y auto-research
3. **Monitorear 1 mes** - Obtener baseline de costos reales
4. **Revisar pricing en Marzo 2026** - Con datos reales, ajustar si necesario
5. **Plan B para Gemini** - Si cambia a paid, tener alternativas (DeepSeek, Groq)

---

**Última actualización:** 28 Ene 2026
**Siguiente revisión:** 28 Feb 2026
**Owner:** Pricing & Cost Optimization Team
