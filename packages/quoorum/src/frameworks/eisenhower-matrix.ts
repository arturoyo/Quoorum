/**
 * Eisenhower Matrix Framework
 *
 * Uses multi-agent debate to classify tasks/decisions by urgency and importance.
 * Maps to 4 quadrants:
 * - Q1 (Urgent + Important): DO FIRST - Crisis, deadlines, problems
 * - Q2 (Not Urgent + Important): SCHEDULE - Planning, prevention, growth
 * - Q3 (Urgent + Not Important): DELEGATE - Interruptions, some meetings
 * - Q4 (Not Urgent + Not Important): ELIMINATE - Time wasters, busy work
 */

import type { AgentConfig } from '../agents'
import { getAIClient } from '@quoorum/ai'
import { quoorumLogger } from '../logger'
import { getAgentConfig } from '../config/agent-config'

// ============================================================================
// TYPES
// ============================================================================

export interface EisenhowerMatrixInput {
  question: string
  tasks?: string[] // Optional list of specific tasks to classify
  context?: string
  userBackstory?: {
    role?: string
    industry?: string
    companyStage?: string
  }
}

export interface TaskClassification {
  task: string
  quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  urgency: number // 0-100
  importance: number // 0-100
  rationale: string
  recommendedAction: string
}

export interface EisenhowerMatrixOutput {
  question: string
  q1Tasks: TaskClassification[] // Urgent + Important (DO FIRST)
  q2Tasks: TaskClassification[] // Not Urgent + Important (SCHEDULE)
  q3Tasks: TaskClassification[] // Urgent + Not Important (DELEGATE)
  q4Tasks: TaskClassification[] // Not Urgent + Not Important (ELIMINATE)
  priorityRecommendation: {
    topPriority: string
    focusArea: 'Q1' | 'Q2' | 'Q3' | 'Q4'
    weeklyTimeAllocation: {
      q1: number // percentage
      q2: number
      q3: number
      q4: number
    }
    keyInsights: string[]
  }
  executionTimeMs: number
}

// ============================================================================
// AGENT CONFIGURATIONS
// ============================================================================

// Get centralized framework agent config (uses free tier by default)
const getFrameworkAgentConfig = (): Pick<AgentConfig, 'provider' | 'model' | 'temperature'> => {
  // Use optimizer config as base for frameworks (fast, creative)
  return getAgentConfig('optimizer')
}

const CLASSIFIER_AGENT_CONFIG: AgentConfig = {
  ...getFrameworkAgentConfig(),
  temperature: 0.4,
  systemPrompt: `Eres el TASK CLASSIFIER, un experto en priorización según la Matriz de Eisenhower.

Tu rol es clasificar tareas/opciones en 4 cuadrantes según URGENCIA e IMPORTANCIA:

**Q1 - Urgent + Important (DO FIRST):**
- Crisis, emergencias
- Deadlines inminentes
- Problemas críticos
- Emergencias médicas/legales

**Q2 - Not Urgent + Important (SCHEDULE):**
- Planificación estratégica
- Prevención y mantenimiento
- Relaciones importantes
- Desarrollo personal/profesional
- ESTE ES EL CUADRANTE MÁS VALIOSO

**Q3 - Urgent + Not Important (DELEGATE):**
- Interrupciones
- Algunas llamadas/emails
- Reuniones improductivas
- Peticiones de otros

**Q4 - Not Urgent + Not Important (ELIMINATE):**
- Time wasters
- Redes sociales sin propósito
- Busy work
- Actividades triviales

Para cada tarea, output:
1. task: Descripción de la tarea
2. quadrant: Q1/Q2/Q3/Q4
3. urgency: 0-100 (qué tan urgente)
4. importance: 0-100 (qué tan importante)
5. rationale: Por qué está en ese cuadrante
6. recommendedAction: Qué hacer (Do first/Schedule/Delegate/Eliminate)

IMPORTANTE: La mayoría de las personas pasa demasiado tiempo en Q1 y Q3.
El objetivo es maximizar tiempo en Q2 (Important but Not Urgent).

Output SOLO JSON válido sin texto adicional.`,
}

const PRIORITY_AGENT_CONFIG: AgentConfig = {
  ...getFrameworkAgentConfig(),
  temperature: 0.3,
  systemPrompt: `Eres el PRIORITY STRATEGIST, un experto en time management y productividad.

Tu rol es sintetizar la clasificación de tareas y crear una estrategia de priorización.

Analiza la distribución de tareas en los 4 cuadrantes y provee:

1. **Top Priority**: La tarea más crítica del momento
2. **Focus Area**: En qué cuadrante debe enfocarse la persona
3. **Weekly Time Allocation**: % recomendado de tiempo por cuadrante
   - Q1: 20-30% (crisis management)
   - Q2: 50-60% (IDEAL - prevención y crecimiento)
   - Q3: 10-15% (delegar lo que puedas)
   - Q4: 0-5% (eliminar casi todo)

4. **Key Insights**: 3-4 insights accionables sobre su gestión de tiempo

REGLAS:
- Si hay muchas tareas en Q1, advertir sobre vivir en "modo crisis"
- Si hay pocas tareas en Q2, advertir sobre falta de prevención
- Si hay muchas tareas en Q3/Q4, recomendar delegar/eliminar agresivamente
- La clave del éxito es MAXIMIZAR Q2 y MINIMIZAR Q3/Q4

Output SOLO JSON válido sin texto adicional.`,
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function runEisenhowerMatrix(
  input: EisenhowerMatrixInput
): Promise<EisenhowerMatrixOutput> {
  const startTime = Date.now()

  quoorumLogger.info('Starting Eisenhower Matrix analysis', {
    question: input.question,
    tasksCount: input.tasks?.length || 0,
    hasContext: !!input.context,
    hasBackstory: !!input.userBackstory,
  })

  try {
    // Build context prompt
    let contextPrompt = `Situación a priorizar: "${input.question}"\n\n`

    if (input.tasks && input.tasks.length > 0) {
      contextPrompt += `Tareas específicas a clasificar:\n`
      input.tasks.forEach((task, i) => {
        contextPrompt += `${i + 1}. ${task}\n`
      })
      contextPrompt += `\n`
    }

    if (input.context) {
      contextPrompt += `Contexto adicional:\n${input.context}\n\n`
    }

    if (input.userBackstory) {
      const { role, industry, companyStage } = input.userBackstory
      if (role || industry || companyStage) {
        contextPrompt += `Usuario:\n`
        if (role) contextPrompt += `- Rol: ${role}\n`
        if (industry) contextPrompt += `- Industria: ${industry}\n`
        if (companyStage) contextPrompt += `- Etapa: ${companyStage}\n`
        contextPrompt += `\n`
      }
    }

    contextPrompt += `Clasifica según la Matriz de Eisenhower.`

    // Get AI clients
    const classifierClient = getAIClient()
    const priorityClient = getAIClient()

    // Step 1: Classify tasks
    const classificationResponse = await classifierClient.generateWithSystem(
      CLASSIFIER_AGENT_CONFIG.systemPrompt,
      `${contextPrompt}\n\nOutput format:\n{\n  "tasks": [\n    {\n      "task": "...",\n      "quadrant": "Q1" | "Q2" | "Q3" | "Q4",\n      "urgency": 85,\n      "importance": 90,\n      "rationale": "...",\n      "recommendedAction": "..."\n    }\n  ]\n}`,
      {
        modelId: CLASSIFIER_AGENT_CONFIG.model,
        provider: CLASSIFIER_AGENT_CONFIG.provider,
        temperature: CLASSIFIER_AGENT_CONFIG.temperature,
        maxTokens: 3000,
      }
    )

    // Parse classification
    const classificationData = JSON.parse(classificationResponse.text) as {
      tasks: TaskClassification[]
    }

    // Group tasks by quadrant
    const q1Tasks = classificationData.tasks.filter((t) => t.quadrant === 'Q1')
    const q2Tasks = classificationData.tasks.filter((t) => t.quadrant === 'Q2')
    const q3Tasks = classificationData.tasks.filter((t) => t.quadrant === 'Q3')
    const q4Tasks = classificationData.tasks.filter((t) => t.quadrant === 'Q4')

    // Step 2: Generate priority recommendation
    const priorityPrompt = `Situación: "${input.question}"

Distribución de tareas:
- Q1 (Urgent + Important): ${q1Tasks.length} tareas
${q1Tasks.map((t) => `  - ${t.task} (U:${t.urgency}, I:${t.importance})`).join('\n')}

- Q2 (Not Urgent + Important): ${q2Tasks.length} tareas
${q2Tasks.map((t) => `  - ${t.task} (U:${t.urgency}, I:${t.importance})`).join('\n')}

- Q3 (Urgent + Not Important): ${q3Tasks.length} tareas
${q3Tasks.map((t) => `  - ${t.task} (U:${t.urgency}, I:${t.importance})`).join('\n')}

- Q4 (Not Urgent + Not Important): ${q4Tasks.length} tareas
${q4Tasks.map((t) => `  - ${t.task} (U:${t.urgency}, I:${t.importance})`).join('\n')}

Crea estrategia de priorización y time allocation recomendado.

Output format:
{
  "topPriority": "La tarea más crítica del momento",
  "focusArea": "Q1" | "Q2" | "Q3" | "Q4",
  "weeklyTimeAllocation": {
    "q1": 25,
    "q2": 55,
    "q3": 15,
    "q4": 5
  },
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"]
}`

    const priorityResponse = await priorityClient.generateWithSystem(
      PRIORITY_AGENT_CONFIG.systemPrompt,
      priorityPrompt,
      {
        modelId: PRIORITY_AGENT_CONFIG.model,
        provider: PRIORITY_AGENT_CONFIG.provider,
        temperature: PRIORITY_AGENT_CONFIG.temperature,
        maxTokens: 1000,
      }
    )

    const priorityRecommendation = JSON.parse(priorityResponse.text) as
      EisenhowerMatrixOutput['priorityRecommendation']

    const executionTimeMs = Date.now() - startTime

    quoorumLogger.info('Eisenhower Matrix analysis completed', {
      q1Count: q1Tasks.length,
      q2Count: q2Tasks.length,
      q3Count: q3Tasks.length,
      q4Count: q4Tasks.length,
      focusArea: priorityRecommendation.focusArea,
      executionTimeMs,
    })

    return {
      question: input.question,
      q1Tasks,
      q2Tasks,
      q3Tasks,
      q4Tasks,
      priorityRecommendation,
      executionTimeMs,
    }
  } catch (error) {
    quoorumLogger.error('Failed to run Eisenhower Matrix analysis', {
      error: error instanceof Error ? error.message : String(error),
      question: input.question,
    })
    throw error
  }
}
