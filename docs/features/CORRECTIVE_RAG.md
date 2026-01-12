# 🎯 Corrective RAG with Hallucination Check

> **Status:** ✅ Production Ready
> **Versión:** 1.0.0
> **Última actualización:** 29 Dic 2025

## 📋 Descripción General

**Corrective RAG (CRAG)** es un sistema avanzado de Retrieval-Augmented Generation que evalúa la relevancia de documentos recuperados y aplica estrategias correctivas automáticas para mejorar la calidad de las respuestas generadas por IA.

**Integración con Hallucination Check**: Esta implementación combina CRAG con detección de alucinaciones, creando un sistema de **validación multi-capa** que garantiza respuestas precisas y fundamentadas en hechos.

---

## 🌟 Características Principales

### 1. Evaluación Multi-Capa

```
Documento → CRAG Evaluation → Hallucination Check → Combined Score → Action
```

- **CRAG Evaluation**: Clasifica documentos como `correct`, `incorrect`, o `ambiguous`
- **Hallucination Check**: Verifica claims factuales, precios, contactos, exageraciones
- **Combined Scoring**: `finalScore = (cragConfidence + hallucinationConfidence) / 2`

### 2. Estrategias Correctivas Automáticas

| Acción   | Cuándo se aplica          | Qué hace                       |
| -------- | ------------------------- | ------------------------------ |
| `keep`   | Todos los docs relevantes | Usa documentos originales      |
| `refine` | Algunos docs relevantes   | Filtra documentos incorrectos  |
| `search` | Ningún doc relevante      | Activa búsqueda web (opcional) |

### 3. Downgrade Automático

Si un documento pasa CRAG pero **falla hallucination check**:

- Se reclasifica como `incorrect`
- Se excluye del contexto final
- Se registra en summary: `hallucinationDetected: true`

---

## 🔌 Endpoints API

### 1. `correctiveRAG.evaluate` (Mutation)

**Propósito**: Evaluar documentos sin ejecutar pipeline completo.

**Input**:

```typescript
{
  query: string          // 1-500 caracteres
  documents: Array<{     // 1-20 documentos
    id: string
    content: string
    title?: string
    source?: string
    score?: number
  }>
  enableHallucinationCheck?: boolean  // default: true
  hallucinationThreshold?: number     // 0-1, default: 0.7
}
```

**Output**:

```typescript
{
  evaluations: Array<{
    id: string
    relevance: 'correct' | 'incorrect' | 'ambiguous'
    confidence: number
    reason: string
    hallucinationCheck?: {
      isValid: boolean
      confidenceScore: number
      issues: Array<{
        type: string
        severity: 'low' | 'medium' | 'high'
        description: string
      }>
    }
    finalScore: number
  }>
  summary: {
    total: number
    correct: number
    incorrect: number
    ambiguous: number
    hallucinationDetected: boolean
  }
}
```

**Ejemplo de uso**:

```typescript
import { api } from '@/lib/trpc'

const { data, isLoading, error } = api.correctiveRAG.evaluate.useMutation({
  onSuccess: (result) => {
    console.log('Evaluaciones:', result.evaluations)
    console.log('Resumen:', result.summary)

    if (result.summary.hallucinationDetected) {
      console.warn('⚠️ Se detectaron alucinaciones')
    }
  },
})

// Ejecutar evaluación
await data.mutateAsync({
  query: '¿Cuál es el precio del Plan Pro?',
  documents: [
    {
      id: 'doc-1',
      content: 'Plan Pro cuesta 49€/mes con todas las funciones',
      source: 'knowledge-base',
      score: 0.92,
    },
  ],
  enableHallucinationCheck: true,
  hallucinationThreshold: 0.7,
})
```

---

### 2. `correctiveRAG.correct` (Mutation)

**Propósito**: Pipeline completo con refinamiento y fallbacks.

**Input**:

```typescript
{
  query: string
  documents: Array<Document>
  options?: {
    correctThreshold?: number        // 0-1, default: 0.8
    incorrectThreshold?: number      // 0-1, default: 0.3
    enableHallucinationCheck?: boolean
    hallucinationThreshold?: number
    enableWebSearch?: boolean        // default: false
  }
}
```

**Output**:

```typescript
{
  action: 'keep' | 'refine' | 'search'
  evaluations: Array<EnhancedEvaluation>
  refinedDocuments: Array<Document>     // Documentos válidos después de filtrar
  webSearchResults?: Array<SearchResult> // Solo si enableWebSearch=true
  finalContext: string                   // Contexto final para LLM
  summary: {
    total: number
    totalValidDocuments: number
    avgConfidence: number
    hallucinationDetected: boolean
    action: string
  }
}
```

**Ejemplo de uso**:

```typescript
const result = await api.correctiveRAG.correct.mutateAsync({
  query: '¿Qué incluye el Plan Business?',
  documents: retrievedDocs,
  options: {
    correctThreshold: 0.8,
    incorrectThreshold: 0.3,
    enableHallucinationCheck: true,
    hallucinationThreshold: 0.7,
    enableWebSearch: false, // Desactivar búsqueda web
  },
})

// Verificar acción tomada
if (result.action === 'refine') {
  console.log('Documentos refinados:', result.refinedDocuments)
  console.log('Contexto final:', result.finalContext)
}

// Generar respuesta con contexto validado
const response = await generateWithContext({
  query: query,
  context: result.finalContext,
})
```

---

### 3. `correctiveRAG.correctStreaming` (Query)

**Propósito**: Versión streaming para feedback en tiempo real.

**Nota**: Actualmente retorna resultado completo (no streaming real). Para implementar streaming real, usar SSE o WebSockets.

**Input**: Igual que `correct`

**Output**: Igual que `correct`

**Ejemplo de uso**:

```typescript
const { data } = api.correctiveRAG.correctStreaming.useQuery({
  query: 'Pregunta del usuario',
  documents: docs,
  options: { ... }
})

// Renderizar resultado progresivamente
if (data) {
  return <ResultsDisplay evaluations={data.evaluations} />
}
```

---

## 🔧 Implementación Backend

### Crear Hallucination Check Function

```typescript
import { hallucinationCheckerAgent } from '@wallie/agents'
import type { HallucinationCheckResult } from '@wallie/ai'

function createHallucinationCheckFn(
  userId: string
): (response: string, context: string) => Promise<HallucinationCheckResult> {
  return async (response: string, context: string) => {
    const agentResult = await hallucinationCheckerAgent.run(
      {
        response,
        userMessage: context,
        businessContext: context,
      },
      { userId }
    )

    if (!agentResult.success || !agentResult.data) {
      // Fail open: si el check falla, no bloqueamos
      return {
        isValid: true,
        confidenceScore: 0.5,
        issues: [],
      }
    }

    return {
      isValid: agentResult.data.isValid,
      confidenceScore: agentResult.data.confidenceScore,
      issues: agentResult.data.issues.map((issue) => ({
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
      })),
    }
  }
}
```

### Usar en Pipeline

```typescript
import { cragWithHallucinationCheck, type CRAGWithHallucinationOptions } from '@wallie/ai'

// En tu router/servicio
const checkHallucinationFn = createHallucinationCheckFn(ctx.userId)

const result = await cragWithHallucinationCheck(query, documents, {
  correctThreshold: 0.8,
  incorrectThreshold: 0.3,
  enableHallucinationCheck: true,
  hallucinationThreshold: 0.7,
  checkHallucinationFn, // ← Inyectar función
})
```

---

## 🎓 Casos de Uso

### 1. Validación de Respuestas de Soporte

**Problema**: El agente podría inventar precios o características que no existen.

**Solución**:

```typescript
// Recuperar documentos relevantes
const docs = await retrieveFromKnowledge(query)

// Evaluar con hallucination check
const result = await api.correctiveRAG.correct.mutateAsync({
  query: '¿Cuánto cuesta el Plan Pro?',
  documents: docs,
  options: {
    enableHallucinationCheck: true,
    hallucinationThreshold: 0.8, // Umbral alto para precios
  },
})

if (result.summary.hallucinationDetected) {
  // No generar respuesta, escalar a humano
  await escalateToHuman(conversation)
} else {
  // Generar respuesta con contexto validado
  const response = await generateResponse(query, result.finalContext)
}
```

### 2. Verificación de Claims de Marketing

**Problema**: Asegurar que los mensajes de marketing son precisos.

**Solución**:

```typescript
const marketingClaim = 'Wallie reduce el tiempo de respuesta en un 90%'

const result = await api.correctiveRAG.evaluate.mutateAsync({
  query: marketingClaim,
  documents: [
    {
      id: 'stats',
      content: 'Según nuestros estudios internos, Wallie reduce...',
      source: 'internal-reports',
    },
  ],
  enableHallucinationCheck: true,
})

// Verificar si el claim está fundamentado
const evaluation = result.evaluations[0]
if (evaluation.relevance === 'correct' && evaluation.hallucinationCheck?.isValid) {
  console.log('✅ Claim verificado')
} else {
  console.log('❌ Claim no verificado')
  console.log('Razón:', evaluation.reason)
  if (evaluation.hallucinationCheck) {
    console.log('Issues:', evaluation.hallucinationCheck.issues)
  }
}
```

### 3. RAG con Fallback a Búsqueda Web

**Problema**: Documentos internos incompletos o desactualizados.

**Solución**:

```typescript
const result = await api.correctiveRAG.correct.mutateAsync({
  query: 'Últimas actualizaciones de Next.js 15',
  documents: internalDocs,
  options: {
    enableWebSearch: true, // ← Activar fallback
    correctThreshold: 0.8,
  },
})

if (result.action === 'search') {
  console.log('Documentos internos insuficientes')
  console.log('Resultados de búsqueda web:', result.webSearchResults)
  // Usar webSearchResults para generar respuesta
}
```

---

## 📊 Métricas y Monitoreo

### Logs Estructurados

Todos los endpoints generan logs con:

```typescript
{
  userId: string,
  query: string,
  documentsCount: number,
  enableHallucinationCheck: boolean,
  action?: string,
  totalValidDocuments?: number,
  avgConfidence?: number,
  hallucinationDetected?: boolean
}
```

### Alertas Recomendadas

1. **Alta tasa de hallucination detection** (>20%):
   - Revisar quality de knowledge base
   - Ajustar `hallucinationThreshold`

2. **Muchos `action: 'search'`** (>30%):
   - Knowledge base incompleto
   - Queries fuera de dominio

3. **Baja confidence promedio** (<0.6):
   - Documentos poco relevantes
   - Embeddings necesitan re-entrenamiento

---

## 🔒 Seguridad

### Rate Limiting

Todos los endpoints usan `aiRateLimitGuard`:

```typescript
const rateLimit = await aiRateLimitGuard(ctx.userId)
if (!rateLimit.allowed) {
  throw new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message: rateLimit.reason,
  })
}
```

### Validación de Input

Schemas Zod estrictos:

```typescript
const EvaluateDocumentsSchema = z.object({
  query: z.string().min(1).max(500),
  documents: z.array(DocumentSchema).min(1).max(20),
  hallucinationThreshold: z.number().min(0).max(1).default(0.7),
})
```

### Fail-Safe Behavior

Si hallucination check **falla** (error de red, timeout, etc.):

- **NO bloquea** la operación
- Retorna `isValid: true, confidenceScore: 0.5`
- Log de warning para monitoreo

---

## 🧪 Testing

### Tests de Validación

31 tests unitarios en `packages/api/src/__tests__/corrective-rag-validation.test.ts`:

```bash
pnpm test corrective-rag-validation
```

### Tests E2E

34 tests E2E en `apps/web/e2e/corrective-rag.spec.ts`:

```bash
pnpm test:e2e corrective-rag
```

### Test Manual

```typescript
// En tRPC Playground o Postman
POST /api/trpc/correctiveRAG.evaluate

{
  "query": "¿Cuál es el precio de Wallie?",
  "documents": [
    {
      "id": "pricing-doc",
      "content": "Wallie tiene 3 planes: Starter (29€), Pro (49€), Business (personalizado)",
      "source": "pricing-page"
    }
  ],
  "enableHallucinationCheck": true,
  "hallucinationThreshold": 0.7
}
```

---

## 🔄 Roadmap

### Próximas Mejoras

1. **Streaming Real** (Q1 2025)
   - SSE para feedback progresivo
   - Evaluaciones parciales en tiempo real

2. **Cache de Evaluaciones** (Q1 2025)
   - Redis cache para documentos frecuentes
   - Reducir latencia en 80%

3. **Fine-tuning de Thresholds** (Q2 2025)
   - A/B testing de thresholds óptimos
   - Machine learning para ajuste automático

4. **Integración con Analytics** (Q2 2025)
   - Dashboard de métricas CRAG
   - Alertas automáticas de quality degradation

---

## 📚 Referencias

- **CRAG Paper**: [Corrective Retrieval Augmented Generation](https://arxiv.org/abs/2401.15884)
- **Hallucination Detection**: `packages/agents/src/agents/hallucination-checker.ts`
- **MCP/Tool Use**: `docs/mcp/README.md`
- **Advanced RAG**: `packages/ai/src/advanced-rag/README.md`

---

## 👥 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-org/wallie/issues)
- **Documentación**: `docs/API-REFERENCE.md`
- **Changelog**: `docs/project/CHANGELOG.md`

---

_Última actualización: 29 Dic 2025 | Versión 1.0.0_
