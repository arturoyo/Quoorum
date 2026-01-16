# 🔄 FLUJO COMPLETO DEL SISTEMA DE DEBATES

## Desde "Iniciar Deliberación" hasta "Debate Completado"

---

## 📍 FASE 1: FRONTEND - Inicio del Debate

**Ubicación:** `apps/web/src/app/debates/new/page.tsx`

### 1.1 Usuario presiona "Iniciar Deliberación"
- **Línea:** 752-773
- **Trigger:** Button onClick → `handleStartDeliberation()`

### 1.2 Validaciones preliminares
```typescript
// Línea 462-468
if (!contextState.question || contextState.question.trim().length < 10) {
  toast.error("Pregunta muy corta")
  return
}
```

### 1.3 Enriquecimiento de contexto
```typescript
// Línea 487-501
const enrichedContext = Object.entries(contextState.responses)
  .map(([id, value]) => {
    // Combina assumptions + questions respondidas
    return `${question}: ${value}`
  })
  .join('\n')

const finalQuestion = `${contextState.question}\n\nContexto adicional:\n${enrichedContext}`
```

### 1.4 Llamada a tRPC mutation
```typescript
// Línea 510-517
createDebateMutation.mutate({
  draftId: contextState.debateId,  // UUID del draft creado anteriormente
  question: finalQuestion,          // Pregunta + contexto enriquecido
  context: enrichedContext,
  category: 'general',
  expertCount: 6,                   // Metadata (no usado por sistema dinámico)
  maxRounds: 5,                     // Metadata (no usado por sistema dinámico)
})
```

---

## 📍 FASE 2: BACKEND API - Procesamiento de la Petición

**Ubicación:** `packages/api/src/routers/debates.ts`

### 2.1 Endpoint `create` recibe la petición
- **Línea:** 108-258
- **Rate limit aplicado:** `debateRateLimitedProcedure`

### 2.2 Validación de input (Zod)
```typescript
// Línea 109-125
z.object({
  question: z.string().min(20).max(1000),  // Mínimo 20 caracteres
  context: z.string().optional(),
  expertCount: z.number().min(4).max(10).default(6),
  maxRounds: z.number().min(3).max(10).default(5),
})
```

### 2.3 Construcción del contexto estructurado
```typescript
// Línea 137-148
const debateContext: DebateContext = {
  background: input.context,
  constraints: [],
  assessment: input.assessment,
  sources: [{ type: "category", content: input.category }],
}
```

### 2.4 Actualizar draft existente → status 'pending'
```typescript
// Línea 153-205
await db.update(quoorumDebates)
  .set({
    context: debateContext,
    status: "pending",  // ✅ Ahora es un debate activo
    metadata: { expertCount, maxRounds, category },
    updatedAt: new Date(),
  })
  .where(eq(quoorumDebates.id, draftId))
```

### 2.5 Trigger asíncrono del debate (2 vías)

**Vía 1: Inngest Worker (background job)**
```typescript
// Línea 236-247
await inngest.send({
  name: "forum/debate.created",
  data: { debateId, userId, question, context }
})
```

**Vía 2: Fallback inline (si Inngest no está configurado)**
```typescript
// Línea 250-258
runDebateAsync(debate.id, userId, question, context).catch((error) => {
  logger.error("Error starting debate", error)
})
```

### 2.6 Respuesta inmediata al frontend
```typescript
// Línea 260-267
return {
  id: debate.id,
  status: "pending",  // Cliente recibe confirmación
  // ... resto de data
}
```

---

## 📍 FASE 3: EJECUCIÓN ASÍNCRONA DEL DEBATE

**Ubicación:** `packages/api/src/routers/debates.ts` → función `runDebateAsync`

### 3.1 Actualizar status a 'in_progress'
```typescript
// Línea 734-737
await db.update(quoorumDebates)
  .set({
    status: "in_progress",
    startedAt: new Date()
  })
  .where(eq(quoorumDebates.id, debateId))
```

### 3.2 Mapear contexto a formato interno
```typescript
// Línea 739-747
const loadedContext = {
  sources: context?.sources?.map(s => ({
    type: s.type as "manual" | "internet" | "repo",
    content: s.content,
  })),
  combinedContext: context?.background ?? "",
}
```

### 3.3 **LLAMADA AL MOTOR DE DEBATES** 🚀
```typescript
// Línea 750-755
const result = await runDynamicDebate({
  sessionId: debateId,
  question,
  context: loadedContext,
  forceMode: "dynamic",
})
```

---

## 📍 FASE 4: MOTOR DE DEBATES - Análisis Inteligente

**Ubicación:** `packages/quoorum/src/runner-dynamic.ts`

### 4.1 Determinar modo del debate
```typescript
// Línea 76
const debateMode = await determineDebateMode(question, forceMode)

// Si forceMode = 'dynamic' → siempre usa modo dinámico
// Si no, analiza complejidad:
//   - Complejidad < 5 → modo estático (4 agentes fijos)
//   - Complejidad >= 5 → modo dinámico (expertos especializados)
```

### 4.2 **ANÁLISIS DE LA PREGUNTA** 🧠
```typescript
// En determineDebateMode() → línea ~140-160
const analysis = await analyzeQuestion(question)
// Retorna:
// - complexity: number (1-10)
// - areas: string[] (ej: ["tech", "business", "legal"])
// - subjectMatter: string
// - bestApproach: string
```

### 4.3 **MATCHING DE EXPERTOS** 🎯
```typescript
// Línea ~170-180
const { selectedExperts, recommendations } = await matchExperts(
  question,
  analysis.areas,
  4, // Número de expertos a seleccionar
  "balanced" // Estrategia: balanced | diverse | specialist
)
// Busca en base de datos de 24+ expertos
// Selecciona los 4-6 más adecuados según la pregunta
```

### 4.4 **CONVERSIÓN A AGENTES** ⚙️
```typescript
// Línea 181-191
function expertToAgentConfig(expert: ExpertProfile): AgentConfig {
  return {
    key: expert.id,
    name: expert.name,
    role: 'analyst',
    prompt: expert.systemPrompt,
    provider: 'google',
    model: 'gemini-2.0-flash-exp',
    temperature: expert.temperature,
  }
}

const agents = selectedExperts.map(expertToAgentConfig)
const agentOrder = selectedExperts.map(e => e.id)
```

---

## 📍 FASE 5: EJECUCIÓN DEL DEBATE DINÁMICO

**Ubicación:** `packages/quoorum/src/runner-dynamic.ts` → función `runDynamicDebate`

### 5.1 Inicialización
```typescript
// Línea 294-301
const rounds: DebateRound[] = []
let totalCost = 0
let consensusResult: ConsensusResult | undefined
let interventionFrequency = 5

let contextPrompt = buildContextPrompt(question, context)
const agentsMap = new Map(agents.map(a => [a.key, a]))
```

### 5.2 **LOOP DE RONDAS** (hasta MAX_ROUNDS = 20)
```typescript
// Línea 302
for (let roundNum = 1; roundNum <= MAX_ROUNDS; roundNum++) {
```

#### 5.2.1 Meta-Moderación (cada N rondas)
```typescript
// Línea 307-335
if (roundNum > 1 && roundNum % interventionFrequency === 0) {
  // Analiza calidad del debate
  const quality = analyzeDebateQuality(allMessages)

  if (onQualityCheck) {
    await onQualityCheck({
      round: roundNum,
      score: quality.overallQuality,
      issues: quality.issues.map(i => i.type)
    })
  }

  // Interviene si detecta problemas
  if (shouldIntervene(quality)) {
    const intervention = generateIntervention(quality)
    contextPrompt += `\n\n${intervention.prompt}`
  }
}
```

#### 5.2.2 **EJECUCIÓN DE CADA EXPERTO** 🗣️
```typescript
// Línea 338-357
for (const agentKey of agentOrder) {
  const agent = agentsMap.get(agentKey)

  // 1. Construir prompt específico del agente
  const prompt = buildAgentPrompt(agent, question, contextPrompt, rounds, roundMessages)

  // 2. Generar respuesta con AI
  const message = await generateAgentResponse({
    sessionId,
    round: roundNum,
    agent,
    prompt,
  })

  // 3. Guardar mensaje
  roundMessages.push(message)
  totalCost += message.costUsd

  // 4. Callback opcional (para UI en tiempo real)
  if (onMessageGenerated) {
    await onMessageGenerated(message)
  }
}
```

#### 5.2.3 **GENERACIÓN DE RESPUESTA AI** 🤖
```typescript
// Línea 401-442 (función generateAgentResponse)
async function generateAgentResponse(input): Promise<DebateMessage> {
  const { agent, prompt } = input

  try {
    // Obtener cliente AI (con fallback automático)
    const client = getAIClient()

    // ✨ LLAMADA A LA AI ✨
    const response = await client.generate(prompt, {
      modelId: agent.model,        // ej: 'gemini-2.0-flash-exp'
      temperature: agent.temperature,
      maxTokens: MAX_TOKENS_PER_MESSAGE,
    })

    // Si falla (quota exceeded), automáticamente prueba:
    // Gemini → DeepSeek → Groq → OpenAI → Claude

    return {
      id: crypto.randomUUID(),
      agentKey: agent.key,
      agentName: agent.name,
      content: response.text.trim(),
      tokensUsed: response.usage?.totalTokens,
      costUsd: estimateAgentCost(agent, tokensUsed),
      createdAt: new Date(),
    }
  } catch (error) {
    // Si todos los fallbacks fallan, retorna mensaje de error
    return {
      content: `[Error: ${error.message}]`,
      // ... resto de campos
    }
  }
}
```

#### 5.2.4 **CHECK DE CONSENSO** 🎯
```typescript
// Línea 359-361
const allMessagesWithCurrent = [...allMessages, ...roundMessages]
consensusResult = await checkConsensus(allMessagesWithCurrent, roundNum, MAX_ROUNDS)
```

**Algoritmo de consenso:**
```typescript
// packages/quoorum/src/consensus.ts
export async function checkConsensus(
  messages: DebateMessage[],
  currentRound: number,
  maxRounds: number
): Promise<ConsensusResult> {

  // 1. Extraer opciones mencionadas por los expertos
  const options = extractOptionsFromMessages(messages)

  // 2. Calcular score de éxito para cada opción (0-100%)
  const ranking = options.map(option => ({
    option,
    score: calculateSuccessRate(option, messages),
    reasoning: extractReasoningForOption(option, messages),
  }))

  // 3. Criterios de consenso:
  const topOption = ranking[0]
  const hasStrongConsensus = topOption.score >= 70  // >= 70% success rate
  const hasSignificantGap = topOption.score - ranking[1]?.score >= 30  // 30% gap
  const minRoundsCompleted = currentRound >= 3

  return {
    hasConsensus: hasStrongConsensus && hasSignificantGap && minRoundsCompleted,
    consensusScore: topOption.score / 100,
    topOption: topOption.option,
    ranking,
    reason: `...`
  }
}
```

#### 5.2.5 Guardar ronda
```typescript
// Línea 362-371
const round: DebateRound = {
  round: roundNum,
  messages: roundMessages,
  consensusCheck: consensusResult,
}

rounds.push(round)

if (onRoundComplete) {
  await onRoundComplete(round)  // Callback para UI
}
```

#### 5.2.6 **CONDICIÓN DE SALIDA** 🏁
```typescript
// Línea ~373-380
if (consensusResult.hasConsensus) {
  quoorumLogger.info('Consensus reached', {
    round: roundNum,
    score: consensusResult.consensusScore
  })
  break  // ✅ Sale del loop
}

// Si llega a MAX_ROUNDS sin consenso, también termina
```

---

## 📍 FASE 6: FINALIZACIÓN Y PERSISTENCIA

### 6.1 Construcción del resultado
```typescript
// Línea ~385-400
return {
  sessionId,
  status: consensusResult.hasConsensus ? 'completed' : 'failed',
  rounds,
  finalRanking: consensusResult.ranking,
  consensusScore: consensusResult.consensusScore,
  totalRounds: rounds.length,
  totalCostUsd,
  experts: mappedExperts,
  qualityMetrics: quality,
  interventions: interventions,
}
```

### 6.2 Persistir resultados en DB
```typescript
// packages/api/src/routers/debates.ts línea 772-787
await db.update(quoorumDebates)
  .set({
    status: result.status === "failed" ? "failed" : "completed",
    completedAt: new Date(),
    consensusScore: result.consensusScore,
    totalRounds: result.rounds.length,
    totalCostUsd: estimateCost(result.rounds.length, experts.length),
    finalRanking: mappedRanking,
    rounds: result.rounds,  // JSON completo de todas las rondas
    experts: mappedExperts,
    qualityMetrics: result.qualityMetrics,
    interventions: result.interventions,
  })
  .where(eq(quoorumDebates.id, debateId))
```

### 6.3 Enviar notificación por email
```typescript
// Línea 790-815
const [user] = await db.select({ email: users.email })
  .from(users)
  .where(eq(users.id, userId))

if (user?.email) {
  await sendDebateCompletedNotification(
    user.email,
    question,
    expertProfiles,
    result.finalRanking
  )
}
```

---

## 📍 FASE 7: FRONTEND - Actualización de UI

**Ubicación:** `apps/web/src/app/debates/[id]/page.tsx`

### 7.1 Redirección automática
```typescript
// apps/web/src/app/debates/new/page.tsx línea 257-259
createDebateMutation.onSuccess((data) => {
  toast.success('¡Debate creado! Los expertos están deliberando...')
  router.push(`/debates/${data.id}`)
})
```

### 7.2 Polling del estado
```typescript
// apps/web/src/app/debates/[id]/page.tsx
const { data: debate } = api.debates.get.useQuery(
  { id: debateId },
  {
    refetchInterval: debate?.status === 'in_progress' ? 3000 : false,
    // Refresca cada 3 segundos mientras está en progreso
  }
)
```

### 7.3 Renderizado condicional
```typescript
{debate.status === 'in_progress' && (
  <div className="text-center py-12">
    <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto" />
    <p className="mt-4 text-gray-300">
      Los expertos están deliberando...
    </p>
  </div>
)}

{debate.status === 'completed' && (
  <DebateResults
    rounds={debate.rounds}
    ranking={debate.finalRanking}
    experts={debate.experts}
  />
)}
```

---

## 🔄 RESUMEN DEL FLUJO (Cascada de Eventos)

```
1. ✅ "Iniciar Deliberación" presionado
   ↓
2. 📤 Frontend envía tRPC mutation
   ↓
3. ✅ Backend valida y crea debate (status: pending)
   ↓
4. 🚀 Trigger asíncrono (Inngest + fallback inline)
   ↓
5. 🔄 Status → in_progress
   ↓
6. 🧠 Analizar pregunta (complejidad, áreas)
   ↓
7. 🎯 Matchear expertos de base de datos
   ↓
8. ⚙️  Convertir expertos → AgentConfig
   ↓
9. 🔁 LOOP DE RONDAS (1-20):
   ├─ 🗣️  Cada experto genera mensaje
   │  ├─ 🤖 Llamada a AI (Gemini/DeepSeek/Groq/etc)
   │  ├─ 💾 Guardar mensaje
   │  └─ 📊 Acumular costos
   ├─ 🎯 Check consenso
   ├─ 🔍 Meta-moderación (cada 5 rondas)
   └─ 🏁 ¿Consenso? → BREAK
   ↓
10. ✅ Status → completed/failed
    ↓
11. 💾 Persistir resultados completos
    ↓
12. 📧 Enviar email notificación
    ↓
13. 🔄 Frontend polling detecta cambio
    ↓
14. 🎉 Mostrar resultados al usuario
```

---

## 🎨 EVENTOS VISIBLES PARA EL USUARIO (Propuesta)

Para implementar la cascada de eventos visual, estos serían los estados/mensajes:

1. **"Validando pregunta..."** (0.5s)
2. **"Analizando complejidad..."** (2-3s)
3. **"Seleccionando expertos especializados..."** (3-4s)
4. **"Iniciando deliberación..."** (1s)
5. **"Ronda 1/20 - Los expertos están opinando..."** (10-15s por ronda)
6. **"Evaluando consenso..."** (1s entre rondas)
7. **"Meta-moderador interviniendo..."** (opcional, cada 5 rondas)
8. **"¡Consenso alcanzado en ronda X!"** o **"Debate completado"**
9. **"Generando reporte final..."** (2s)
10. **"✅ Debate completado - Ver resultados"**

---

## 📊 MÉTRICAS DE RENDIMIENTO

- **Análisis de pregunta:** ~2-4s
- **Matching de expertos:** ~3-5s
- **Por mensaje de experto:** ~8-15s (depende del provider)
- **Por ronda completa:** ~40-60s (4 expertos × ~12s cada uno)
- **Consenso típico:** 3-8 rondas
- **Tiempo total estimado:** 3-10 minutos

---

## ⚠️ PUNTOS DE FALLO COMUNES

1. **Quota exceeded en AI provider**
   - ✅ Solucionado: Sistema de fallback automático

2. **Timeout en llamadas AI**
   - ⚠️  No hay timeout configurado actualmente
   - 💡 Solución: Añadir timeout de 60s por mensaje

3. **Webhook no configurado**
   - ✅ Solucionado: Fallback inline `runDebateAsync()`

4. **Base de datos desconectada**
   - ❌ Causa fallo total
   - 💡 Solución: Retry con exponential backoff

---

## 🔧 CALLBACKS DISPONIBLES (para UI en tiempo real)

```typescript
await runDynamicDebate({
  sessionId: debateId,
  question,
  context,

  // Callbacks para eventos en tiempo real:
  onRoundComplete: async (round) => {
    console.log(`Ronda ${round.round} completada`)
  },

  onMessageGenerated: async (message) => {
    console.log(`${message.agentName}: ${message.content}`)
  },

  onQualityCheck: async (quality) => {
    console.log(`Calidad del debate: ${quality.score}%`)
  },

  onIntervention: async (intervention) => {
    console.log(`Meta-moderador interviene: ${intervention.type}`)
  },
})
```

**⚠️ NOTA:** Estos callbacks NO están conectados actualmente porque el debate corre asíncrono.
Para usarlos, necesitaríamos WebSockets o Server-Sent Events (SSE).
