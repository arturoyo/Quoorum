# 🎯 Flujo Completo de Creación de Debates

> **Módulo 13** | Sistema completo de creación de debates paso a paso
> **Versión:** 2.0.0 | **Fecha:** 30 Ene 2026

---

## 📋 ÍNDICE

1. [Arquitectura General](#arquitectura-general)
2. [FASE 1: Contexto - Preguntas y Respuestas](#fase-1-contexto)
3. [FASE 2: Expertos - Selección de Participantes](#fase-2-expertos)
4. [FASE 3: Estrategia - Patrón y Framework](#fase-3-estrategia)
5. [FASE 4: Revisión - Confirmación Final](#fase-4-revision)
6. [FASE 5: Debate - Ejecución en Vivo](#fase-5-debate)
7. [Sistema de Validación de Calidad](#sistema-de-validacion-de-calidad)
8. [Sistema de Guardado Automático](#sistema-de-guardado-automatico)
9. [Sistema de Créditos](#sistema-de-creditos)
10. [Personalización con Backstory](#personalizacion-con-backstory)
11. [Componentes Visuales](#componentes-visuales)
12. [Debugging y Errores Comunes](#debugging)

---

## 🏗️ ARQUITECTURA GENERAL

### Ubicación del Sistema

```
apps/web/src/app/debates/new-unified/
├── [sessionId]/
│   └── page.tsx                    # Página principal del flujo
├── components/
│   ├── phase-contexto.tsx          # Fase 1: Contexto
│   ├── phase-expertos.tsx          # Fase 2: Expertos
│   ├── phase-estrategia.tsx        # Fase 3: Estrategia
│   ├── phase-revision.tsx          # Fase 4: Revisión
│   ├── phase-debate.tsx            # Fase 5: Debate activo
│   ├── debate-sticky-header.tsx    # Header fijo con título/subtítulo dinámico
│   ├── real-credits-tracker.tsx    # Muestra créditos gastados en tiempo real
│   ├── validation-indicator.tsx    # Indicadores de validación
│   └── autosave-indicator.tsx      # Indicador de autoguardado
├── hooks/
│   ├── use-unified-debate-state.ts # Hook central de gestión de estado
│   └── use-backstory-header.ts     # Hook para título/subtítulo dinámico
└── types.ts                        # Tipos TypeScript del flujo
```

### Hook Central: `use-unified-debate-state.ts`

**Responsabilidades:**
- ✅ Gestionar estado de las 5 fases
- ✅ Persistencia automática en localStorage (cada cambio)
- ✅ Creación de drafts en DB
- ✅ Validación de respuestas con IA
- ✅ Evaluación de calidad del contexto
- ✅ Navegación entre fases
- ✅ Tracking de créditos consumidos
- ✅ Generación de preguntas contextuales

**Estados exportados:**
```typescript
{
  // Estados de las fases
  currentPhase: 1-5
  phaseProgress: { contexto: 0-100, expertos: 0-100, estrategia: 0-100, revision: 0-100 }
  contexto: ContextoState
  expertos: ExpertosState
  estrategia: EstrategiaState
  revision: RevisionState
  debate: DebateState

  // Estados de loading
  isGeneratingQuestions: boolean
  isEvaluating: boolean
  isValidating: boolean        // ✅ NUEVO (30 Ene 2026)
  isCreatingDebate: boolean

  // Handlers
  handleInitialQuestion: (q: string) => void
  handleAnswer: (answer: string) => void
  handleParticipantUpdate: (update) => void
  handleStrategySelection: (strategy) => void
  handleFrameworkSelection: (frameworkId) => void
  handleCreateDebate: () => void
  navigateToPhase: (phase: number) => void
}
```

---

## 🎯 FASE 1: CONTEXTO

**Archivo:** `apps/web/src/app/debates/new-unified/components/phase-contexto.tsx`

**Objetivo:** Recopilar contexto relevante mediante preguntas guiadas por IA.

---

### **Flujo Completo**

```
1. Usuario escribe pregunta inicial (mín 10 caracteres)
   ↓
2. Sistema muestra 3 opciones de inicio:
   a) 📋 Preguntas sugeridas (pool de 50 preguntas)
   b) 🤖 Generar preguntas con IA (basadas en su pregunta + backstory)
   c) ⏭️ Saltar directamente a siguiente fase (si isAdmin)
   ↓
3. Si elige IA:
   - Llama a api.debates.suggestInitialQuestions
   - Consume ~2-5 créditos
   - Genera 3-5 preguntas críticas personalizadas

   Si elige sugeridas:
   - Muestra 3 preguntas aleatorias del pool
   - Sin coste de créditos
   - Opción más rápida
   ↓
4. Usuario responde cada pregunta (una a la vez)
   ↓
5. [VALIDACIÓN NIVEL 1] Por cada respuesta:
   - Llama a api.debates.validateAnswerRelevance
   - Consume ~1 crédito por validación
   - Verifica: relevancia, claridad, longitud, calidad
   ↓
6. Si validación detecta problemas:
   - ❌ Muestra toast con warning específico
   - ❌ Muestra mensaje en chat explicando qué mejorar
   - ❌ NO permite avanzar a siguiente pregunta
   - Usuario DEBE mejorar la respuesta

   Si validación OK:
   - ✅ Acepta respuesta
   - ✅ Actualiza realCreditsDeducted
   - ✅ [GUARDADO AUTO] Guarda en localStorage
   - ✅ Avanza a siguiente pregunta
   ↓
7. Al completar TODAS las preguntas críticas:
   ↓
8. [VALIDACIÓN NIVEL 2] Evaluación global de calidad:
   - Llama a api.debates.evaluateContextQuality
   - Consume ~3-5 créditos
   - Analiza TODAS las respuestas en conjunto
   - Detecta: missing aspects, contradictions, duplicates
   ↓
9. Sistema calcula contextScore (0-100)
   ↓
10. Decisión de progreso:
    - Si score >= 40 → phase = 'ready', progreso = 100%
    - Si score < 40 → phase = 'deep', genera más preguntas
    ↓
11. Si phase = 'ready':
    - ✅ Botón "Continuar a Expertos" habilitado
    - Usuario puede avanzar a Fase 2
```

---

### **Pool de Preguntas Sugeridas (50 preguntas)**

**Archivo:** `apps/web/src/lib/suggested-debate-questions.ts`

#### **Categoría 1: Estrategia & Negocio (10 preguntas)**

1. ¿Debería cambiar mi modelo de precios?
2. ¿Es el momento correcto para expandir a nuevos mercados?
3. ¿Qué estrategia de growth priorizar este trimestre?
4. ¿Debería pivotear mi producto?
5. ¿Cómo competir contra un rival más grande?
6. ¿Merece la pena levantar ronda de inversión ahora?
7. ¿Qué alianzas estratégicas priorizar?
8. ¿Debería hacer vertical u horizontal integration?
9. ¿Lanzar en beta o esperar a versión completa?
10. ¿Cómo optimizar customer acquisition cost?

#### **Categoría 2: Producto & Desarrollo (10 preguntas)**

1. ¿Qué feature debería priorizar en el roadmap?
2. ¿Debería migrar mi stack tecnológico?
3. ¿Vale la pena invertir en automatización ahora?
4. ¿Cómo balancear deuda técnica vs nuevas features?
5. ¿Debería hacer refactor o construir desde cero?
6. ¿Cómo mejorar time-to-market sin sacrificar calidad?
7. ¿Qué herramientas de analytics implementar?
8. ¿Debería open-source parte del producto?
9. ¿Cómo diseñar onboarding más efectivo?
10. ¿Qué métrica de producto es más crítica ahora?

#### **Categoría 3: Equipo & Recursos (10 preguntas)**

1. ¿Debería contratar más gente ahora o esperar?
2. ¿Cómo distribuir responsabilidades en el equipo?
3. ¿Qué perfil contratar primero?
4. ¿Debería externalizar desarrollo o hacerlo interno?
5. ¿Cómo mejorar retención de talento?
6. ¿Es momento de implementar OKRs?
7. ¿Cómo estructurar equipos para escalar?
8. ¿Debería invertir en capacitación del equipo?
9. ¿Qué beneficios laborales priorizar?
10. ¿Cómo gestionar equipos remotos vs híbridos?

#### **Categoría 4: Finanzas & Operaciones (10 preguntas)**

1. ¿Cómo optimizar cash flow este trimestre?
2. ¿Debería reducir gastos operativos?
3. ¿Qué KPIs financieros monitorizar prioritariamente?
4. ¿Es momento de cambiar de proveedor?
5. ¿Cómo preparar due diligence para inversores?
6. ¿Debería renegociar contratos con clientes?
7. ¿Qué estructura legal es mejor para mi caso?
8. ¿Cómo mejorar márgenes sin subir precios?
9. ¿Debería diversificar fuentes de ingreso?
10. ¿Cómo gestionar riesgo financiero en expansión?

#### **Categoría 5: Marketing & Ventas (10 preguntas)**

1. ¿Qué canal de marketing priorizar ahora?
2. ¿Debería cambiar mi estrategia de contenido?
3. ¿Cómo mejorar conversion rate?
4. ¿Es momento de invertir en paid ads?
5. ¿Qué segmento de clientes atacar primero?
6. ¿Debería cambiar mi propuesta de valor?
7. ¿Cómo optimizar customer lifetime value?
8. ¿Qué estrategia de pricing es mejor: freemium, suscripción, one-time?
9. ¿Debería invertir en brand awareness o performance marketing?
10. ¿Cómo gestionar customer feedback negativo?

**Lógica de selección:**
```typescript
// Muestra 3 preguntas aleatorias de diferentes categorías
const categories = Object.values(DEBATE_QUESTIONS_BY_CATEGORY)
const randomQuestions = categories
  .map(cat => cat[Math.floor(Math.random() * cat.length)])
  .slice(0, 3)
```

---

### **Generación de Preguntas con IA**

**Procedimiento tRPC:** `debates.suggestInitialQuestions`

**Archivo:** `packages/api/src/routers/debates.ts` (líneas ~1850-1920)

**Input:**
```typescript
{
  question: string,              // Pregunta principal del usuario
  cachedContext?: string,        // Contexto previo si existe
  userBackstory?: {              // Datos del perfil del usuario
    companyName?: string,
    role?: string,
    industry?: string,
    companyStage?: string,
    decisionStyle?: string
  }
}
```

**Prompt del Sistema:**
```
Eres un experto en estrategia de negocio que genera preguntas críticas
para decisiones complejas.

CONTEXTO DEL USUARIO:
- Company: ${companyName}
- Role: ${role}
- Industry: ${industry}
- Stage: ${companyStage}

TAREA:
Genera 3-5 preguntas críticas que exploren:
1. Contexto situacional (qué está pasando ahora)
2. Objetivos y prioridades
3. Recursos disponibles
4. Restricciones y riesgos
5. Stakeholders afectados

Cada pregunta debe ser:
- Específica y accionable
- Relevante para el rol y la industria del usuario
- Diseñada para extraer información crítica de decisión

FORMATO JSON:
{
  "questions": [
    {
      "id": "q1",
      "priority": "critical",
      "questionType": "free_text",
      "content": "...",
      "reasoning": "Por qué es importante esta pregunta",
      "relatedConcepts": ["concepto1", "concepto2"]
    }
  ]
}
```

**Output:** Array de 3-5 preguntas priorizadas según el contexto del usuario

**Coste:** ~2-5 créditos según complejidad de la pregunta

---

### **Estructura de Pregunta**

```typescript
type Question = {
  id: string                                    // Unique ID (q1, q2, q3...)
  priority: 'critical' | 'high' | 'medium' | 'low'
  questionType: 'yes_no' | 'multiple_choice' | 'free_text'
  content: string                               // La pregunta en sí
  options?: string[]                            // Para multiple_choice
  expectedAnswerType?: 'short' | 'long'        // Input (1 línea) vs Textarea
  reasoning?: string                            // Por qué se pregunta esto
  relatedConcepts?: string[]                   // Conceptos relacionados
}
```

---

### **Datos Guardados en Fase 1**

```typescript
{
  mainQuestion: string           // Pregunta principal
  answers: Record<id, answer>    // Respuestas del usuario
  questions: Question[]          // Preguntas generadas por IA o sugeridas
  contextScore: 0-100           // ✅ Score de calidad
  evaluation: {                 // ✅ Evaluación global (ver Validación Nivel 2)
    score: number,
    readinessLevel: 'poor' | 'fair' | 'good' | 'excellent',
    summary: string,
    missingAspects: string[],
    qualityIssues: string[],
    shouldContinue: boolean,
    followUpQuestions: Question[]
  } | null
  phase: 'initial' | 'critical' | 'deep' | 'ready'
  realCreditsDeducted: number  // ✅ Créditos reales gastados
  draftId: string | undefined  // ✅ ID del draft en DB
  messages: Message[]          // Historial del chat
  currentQuestionIndex: number // Índice de pregunta actual (0-based)
}
```

---

## 🎯 FASE 2: EXPERTOS

**Archivo:** `apps/web/src/app/debates/new-unified/components/phase-expertos.tsx`

**Objetivo:** Seleccionar participantes del debate (expertos IA, departamentos, profesionales).

---

### **Flujo Completo**

```
1. Usuario selecciona tipos de participantes (checkboxes):
   □ Expertos IA (80+ expertos disponibles)
   □ Departamentos (de la empresa del usuario)
   □ Profesionales/Workers (equipo del usuario)
   ↓
2. Para cada tipo seleccionado, mostrar selector correspondiente
   ↓
3. Cada selector tiene 2 modos:
   a) AUTO: IA sugiere participantes relevantes basados en pregunta
   b) MANUAL: Usuario explora biblioteca completa y elige
   ↓
4. Usuario selecciona participantes específicos
   ↓
5. Sistema calcula coste estimado del debate en tiempo real
   - Basado en: número de participantes, estrategia, rondas estimadas
   ↓
6. Verifica balance de créditos del usuario
   ↓
7. Si balance >= coste estimado:
   - ✅ Botón "Continuar a Estrategia" habilitado

   Si balance < coste estimado:
   - ❌ Muestra warning de créditos insuficientes
   - ❌ Bloquea avance
   - Sugiere: Reducir participantes o recargar créditos
```

---

### **A. Selección de Expertos IA**

**Componente:** `apps/web/src/components/quoorum/expert-selector.tsx`

**Base de Datos de Expertos:** `packages/quoorum/src/config/expert-config.ts`

#### **80+ Expertos en 5 Categorías Principales:**

**1. Empresa (20+ categorías de expertise)**

| Categoría | Expertos | Expertise |
|-----------|----------|-----------|
| **Positioning** | Seth Godin, Al Ries | Diferenciación, USP, posicionamiento de marca |
| **Conversion** | Peep Laja, Talia Wolf | CRO, A/B testing, optimización de funnel |
| **Sales** | Aaron Ross, Jill Konrath | Predictable revenue, ventas B2B, prospecting |
| **Pricing** | Patrick Campbell, Hermann Simon | Pricing strategy, willingness to pay, price optimization |
| **Product** | Teresa Torres, Marty Cagan | Discovery continuo, product-market fit, roadmap |
| **Growth** | Sean Ellis, Brian Balfour | Growth loops, product-led growth, virality |
| **Operations** | Eliyahu Goldratt, Taiichi Ohno | Theory of constraints, Lean, process optimization |
| **Finance** | Aswath Damodaran, Patrick McKenzie | Valuation, unit economics, financial modeling |
| **VC/Investment** | Paul Graham, Marc Andreessen | Fundraising, pitch, term sheets |
| **AI/Tech** | Andrew Ng, Cassie Kozyrkov | ML/AI strategy, data science, automation |
| **Design/UX** | Don Norman, Jakob Nielsen | Usabilidad, cognitive load, experiencia de usuario |
| **Engineering** | Martin Fowler, Kent Beck | Arquitectura, refactoring, clean code |
| **Legal/IP** | Brad Feld, Yokum Taku | Cap table, stock options, legal structure |

**2. Vida Personal (25+ expertos)**

| Subcategoría | Expertos | Enfoque |
|--------------|----------|---------|
| **Mindfulness** | Jon Kabat-Zinn, Thich Nhat Hanh | Reducción de estrés, meditación |
| **Productivity** | David Allen (GTD), Cal Newport | Deep work, time management |
| **Relationships** | John Gottman, Esther Perel | Pareja, comunicación |
| **Parenting** | Janet Lansbury, Becky Kennedy | Crianza respetuosa, límites |
| **Career** | Cal Newport, Adam Grant | Desarrollo profesional, trabajo significativo |
| **Habits** | James Clear, Charles Duhigg | Atomic habits, cambio de comportamiento |
| **Wellness** | Andrew Huberman, Peter Attia | Salud, longevidad, sueño |
| **Finance Personal** | Ramit Sethi, Vicki Robin | FIRE, inversión personal |

**3. Personajes Históricos (25+ figuras)**

| Época | Personajes | Filosofía/Expertise |
|-------|------------|---------------------|
| **Grecia Clásica** | Sócrates, Platón, Aristóteles, Diógenes | Dialéctica, lógica, ética, virtud |
| **Estoicismo** | Marco Aurelio, Séneca, Epicteto | Control interno, resiliencia, disciplina |
| **Renacimiento** | Maquiavelo, Da Vinci, Maquiavelo | Poder, pragmatismo, invención |
| **Ilustración** | Voltaire, Rousseau, Kant | Razón, contrato social, imperativo categórico |
| **Estrategia Militar** | Sun Tzu, Clausewitz, Napoleon | Arte de la guerra, estrategia, táctica |
| **Liderazgo** | Lincoln, Churchill, Mandela | Empatía, retórica, perseverancia |
| **Ciencia** | Newton, Einstein, Feynman | Método científico, pensamiento primero |

**4. Thinking Tools (Frameworks especializados)**

| Experto | Framework | Aplicación |
|---------|-----------|------------|
| **Edward de Bono** | Six Thinking Hats | Pensamiento paralelo, perspectivas múltiples |
| **Charlie Munger** | Mental Models | Lattice of models, inversión de pensamiento |
| **Ray Dalio** | Principles | Radical transparency, idea meritocracy |
| **Annie Duke** | Thinking in Bets | Probabilistic thinking, decisiones bajo incertidumbre |
| **Daniel Kahneman** | Thinking Fast & Slow | Sesgos cognitivos, System 1 vs System 2 |

**5. General / Multi-Disciplinary**

- Generalist Strategist (default)
- Systems Thinker
- Data-Driven Analyst
- Creative Problem Solver
- Devil's Advocate
- Pragmatic Executor

---

#### **Modos de Selección de Expertos**

**AUTO Mode (Recomendado):**
```typescript
api.experts.suggest.useQuery({
  question: mainQuestion,
  context: fullContext,
  limit: 10
})

// Output:
{
  expertId: string,
  matchScore: 0-100,              // Qué tan relevante es este experto
  expertise: string[],            // Áreas de expertise que aplican
  reasons: string[],              // Por qué fue recomendado
  role: 'primary' | 'critic' | 'secondary'
}
```

**MANUAL Mode:**
```typescript
api.experts.list.useQuery({
  category?: string,              // Filtrar por categoría
  search?: string,               // Buscar por nombre/expertise
  limit: 100
})

// Browse all 80+ experts, user selects manually
```

**Visualización:**
- Cards con foto, nombre, expertise tags
- Match score (% de relevancia) en modo auto
- Checkbox para seleccionar/deseleccionar
- Botones "Seleccionar todos", "Limpiar selección"

---

### **B. Selección de Departamentos**

**Componente:** `apps/web/src/components/quoorum/department-selector.tsx`

**¿Qué son los Departamentos?**
- Representan áreas funcionales de la empresa del usuario
- Deben configurarse previamente en `/settings/company`
- Cada departamento tiene:
  - **Nombre:** "Marketing", "Finanzas", "Operaciones", etc.
  - **Tipo:** Categoría funcional
  - **Icono:** Visual identifier
  - **Contexto:** Descripción de KPIs, procesos, responsabilidades
  - **agentRole:** Cómo el agente aborda decisiones desde esa perspectiva

**4 Capas de Contexto para cada Departamento:**
```typescript
1. Technical Role: "Eres un experto en [tipo de departamento]"
2. Company Context: Mission, vision, values de la empresa
3. Department Context: KPIs específicos, procesos, objetivos
4. Custom Prompt: Instrucciones adicionales del usuario
```

**Ejemplo de Departamento:**
```typescript
{
  id: "dept-123",
  name: "Marketing",
  type: "marketing",
  icon: "megaphone",
  departmentContext: "Responsable de brand awareness, demand generation, y customer acquisition. KPIs: CAC, MQL, conversion rate, ROAS.",
  agentRole: "Piensas en términos de audiencias, mensajes, canales, y métricas de marketing. Priorizas visibility, engagement, y conversión.",
  companyId: "company-456"
}
```

---

#### **Modos de Selección de Departamentos**

**AUTO Mode:**
```typescript
api.departments.suggest.useQuery({
  question: mainQuestion,
  context: fullContext,
  companyId: user.companyId,
  limit: 5
})

// Output: Similar a experts, con matchScore y reasons
```

**MANUAL Mode:**
```typescript
api.departments.list.useQuery({
  companyId: user.companyId
})

// Lista TODOS los departamentos de la empresa del usuario
```

**Validación:**
- ⚠️ Requiere que el usuario tenga empresa configurada
- Si no tiene empresa → Muestra warning: "Configura tu empresa en Settings primero"

---

### **C. Selección de Profesionales/Workers**

**Componente:** `apps/web/src/components/quoorum/worker-selector.tsx`

**¿Qué son los Profesionales?**
- Representaciones virtuales de miembros del equipo del usuario
- Configurados en `/settings/team`
- Cada profesional tiene:
  - **Nombre:** "Ana García", "Carlos Pérez"
  - **Rol:** "CTO", "Head of Marketing", "Lead Designer"
  - **Expertise:** Tags de habilidades
  - **Descripción:** Background, experiencia, enfoque
  - **Departamento:** A qué área pertenece
  - **Email** (opcional): Para notificaciones futuras

**Ejemplo de Profesional:**
```typescript
{
  id: "worker-789",
  name: "Ana García",
  role: "CTO",
  expertise: ["Arquitectura", "Escalabilidad", "DevOps"],
  description: "15 años de experiencia en startups tech. Especializada en arquitectura de sistemas distribuidos.",
  departmentId: "dept-tech",
  email: "ana@company.com"
}
```

---

#### **Modos de Selección de Profesionales**

**AUTO Mode:**
```typescript
api.workers.suggest.useQuery({
  question: mainQuestion,
  context: fullContext,
  selectedDepartmentIds?: string[],  // ✅ Prioriza workers de estos depts
  limit: 5
})

// Output:
{
  workerId: string,
  matchScore: 0-100,
  expertise: string[],
  reasons: string[],
  department: string              // Nombre del departamento
}

// Si hay departamentos seleccionados → Prioriza workers de esos depts
```

**MANUAL Mode:**
```typescript
api.workers.list.useQuery({
  companyId: user.companyId,
  departmentId?: string          // Filtrar por departamento
})

// Lista TODOS los profesionales del equipo del usuario
```

**Validación:**
- ⚠️ Requiere que el usuario tenga empresa configurada
- Si no tiene empresa → Muestra warning: "Configura tu equipo en Settings primero"

---

### **Validación de Fase 2**

```typescript
// Puede avanzar a Fase 3 si:
const canContinue =
  (expertos.selectedExpertIds.length > 0 ||
   expertos.selectedDepartmentIds.length > 0 ||
   expertos.selectedWorkerIds.length > 0) &&
  userBalance >= estimatedTotalCost

// Al menos 1 tipo de participante seleccionado
// Y créditos suficientes para el debate completo
```

---

### **Datos Guardados en Fase 2**

```typescript
{
  participantTypes: {
    expertos: boolean,              // ¿Incluye expertos IA?
    departamentos: boolean,         // ¿Incluye departamentos?
    trabajadores: boolean           // ¿Incluye profesionales?
  },
  selectedExpertIds: string[],      // IDs de expertos seleccionados
  selectedDepartmentIds: string[],  // IDs de departamentos seleccionados
  selectedWorkerIds: string[],      // IDs de profesionales seleccionados
  estimatedCost: number             // Coste estimado total del debate
}
```

---

## 🎯 FASE 3: ESTRATEGIA

**Archivo:** `apps/web/src/app/debates/new-unified/components/phase-estrategia.tsx`

**Objetivo:** Seleccionar estrategia de debate y framework de decisión.

---

### **Flujo Completo**

```
1. Sistema muestra 2 selectores OBLIGATORIOS:
   A. Patrón de Estrategia (9 opciones)
   B. Framework de Decisión (3 opciones principales)
   ↓
2. Para cada selector:
   - Modo AUTO: IA recomienda basado en pregunta + complejidad
   - Modo MANUAL: Usuario elige de la lista completa
   ↓
3. Usuario selecciona ambos (OBLIGATORIOS)
   ↓
4. Sistema actualiza estimación de costes
   ↓
5. Verifica balance de créditos
   ↓
6. Si todo OK:
   - ✅ Botón "Continuar a Revisión" habilitado
```

---

### **A. Patrones de Estrategia (9 opciones)**

**Componente:** `apps/web/src/components/quoorum/strategy-selector.tsx`

| # | Pattern | Label | Descripción Completa | Cuándo Usar |
|---|---------|-------|---------------------|-------------|
| 1 | **simple** | Simple | Un debate único sin subdivisión. Todos los participantes intervienen simultáneamente. | Preguntas simples, decisiones rápidas, pocos participantes (1-3) |
| 2 | **sequential** | Secuencial | Debates en orden: A → B → C → Conclusión. Cada participante construye sobre el anterior. | Análisis paso a paso, cuando el orden importa, decisiones que requieren fases |
| 3 | **parallel** | Paralelo | Múltiples debates simultáneos (A, B, C) → Síntesis final. Cada uno explora un aspecto diferente. | Explorar múltiples perspectivas independientes, decisiones multidimensionales |
| 4 | **conditional** | Condicional | Ramificación basada en resultados intermedios. Si X → hacer Y, si no X → hacer Z. | Decisiones con múltiples caminos, análisis de escenarios |
| 5 | **iterative** | Iterativo | Loop de debates hasta alcanzar umbral de calidad o consenso. Máximo 5 iteraciones. | Refinamiento progresivo, decisiones que requieren convergencia |
| 6 | **tournament** | Torneo | Eliminación por brackets. A vs B, C vs D → Ganadores → Final. | Comparar múltiples opciones (>4), priorización competitiva |
| 7 | **adversarial** | Adversarial | Defensor vs Atacante + Juez neutral. Red team vs Blue team. | Estrés test de decisiones, identificar puntos débiles, decisiones críticas |
| 8 | **ensemble** | Ensemble | Múltiples debates independientes → Agregación de resultados (voting, averaging, weighted). | Alta incertidumbre, decisiones que requieren múltiples modelos |
| 9 | **hierarchical** | Jerárquico | Estructura de árbol: Debate general → Sub-debates específicos (drill down). | Decisiones complejas con múltiples niveles, análisis top-down |

---

#### **Recomendación Automática de Estrategia**

**Procedimiento tRPC:** `debateStrategy.analyzeStrategy`

**Archivo:** `packages/api/src/routers/debate-strategy.ts`

**Análisis de Complejidad:**

```typescript
// Input:
{
  question: string,
  context: string,
  participantCount: number
}

// Sistema analiza:
1. Complejidad de la pregunta (keywords, longitud, ambigüedad)
2. Número de participantes
3. Tipo de decisión (estratégica, táctica, operativa)
4. Urgencia (detectada en el texto)
5. Riesgo (detectado en el contexto)

// Output:
{
  recommendedStrategy: string,           // 'parallel', 'adversarial', etc.
  confidence: 0-100,                     // Qué tan seguro está
  reasoning: string,                     // Por qué recomienda esta estrategia
  alternatives: Array<{                  // Otras opciones válidas
    strategy: string,
    confidence: number,
    reasoning: string
  }>
}
```

**Algoritmo de Recomendación:**

```
Si participantCount >= 8 → Recomendar 'tournament' o 'hierarchical'
Si pregunta contiene "vs" o "comparar" → Recomendar 'adversarial'
Si pregunta es simple y directa → Recomendar 'simple'
Si pregunta tiene múltiples dimensiones → Recomendar 'parallel'
Si pregunta requiere iteración → Recomendar 'iterative'
Si pregunta es "qué hacer primero" → Recomendar 'sequential'
Default → 'parallel' (más flexible)
```

---

### **B. Frameworks de Decisión (3 frameworks principales)**

**Componente:** `apps/web/src/components/quoorum/framework-selector.tsx`

**Base de Datos:** `packages/db/drizzle/0035_add_frameworks_v2.sql`

#### **Framework 1: Pros and Cons (Ventajas y Desventajas)**

**Slug:** `pros-and-cons`

**Descripción:**
- Análisis simple de ventajas vs desventajas
- Estructura clara: ¿Qué gano? ¿Qué pierdo?
- Ideal para decisiones binarias (sí/no, hacer/no hacer)

**Cuándo usar:**
- Decisiones rápidas con 2 opciones
- Cuando necesitas claridad y simplicidad
- Primera aproximación a cualquier decisión

**Estructura del debate:**
```
1. Identificar todos los PROS
2. Identificar todos los CONS
3. Ponderar importancia de cada uno
4. Comparar: ¿Los PROS superan los CONS?
5. Decisión final con justificación
```

---

#### **Framework 2: SWOT Analysis (Fortalezas, Debilidades, Oportunidades, Amenazas)**

**Slug:** `swot-analysis`

**Descripción:**
- Análisis estratégico de 4 dimensiones
- Interno (Strengths, Weaknesses) vs Externo (Opportunities, Threats)
- Ideal para decisiones de negocio y estrategia

**Cuándo usar:**
- Decisiones estratégicas de negocio
- Análisis de posicionamiento competitivo
- Evaluación de nuevas oportunidades de mercado
- Planning de largo plazo

**Estructura del debate:**
```
Cuadrante 1: STRENGTHS (Fortalezas internas)
  - ¿Qué hacemos bien?
  - ¿Qué recursos/capacidades tenemos?
  - ¿Qué ventajas competitivas?

Cuadrante 2: WEAKNESSES (Debilidades internas)
  - ¿Qué podríamos mejorar?
  - ¿Qué recursos nos faltan?
  - ¿Qué hacen mejor los competidores?

Cuadrante 3: OPPORTUNITIES (Oportunidades externas)
  - ¿Qué tendencias de mercado aprovechar?
  - ¿Qué necesidades sin cubrir?
  - ¿Qué cambios regulatorios benefician?

Cuadrante 4: THREATS (Amenazas externas)
  - ¿Qué competidores emergen?
  - ¿Qué cambios de mercado perjudican?
  - ¿Qué riesgos externos existen?

→ Síntesis: Estrategias que capitalizan S+O, minimizan W+T
```

---

#### **Framework 3: Eisenhower Matrix (Urgente vs Importante)**

**Slug:** `eisenhower-matrix`

**Descripción:**
- Priorización por urgencia e importancia
- Matriz 2x2: 4 cuadrantes de acción
- Ideal para decisiones de productividad y priorización

**Cuándo usar:**
- Múltiples tareas/proyectos para priorizar
- Decisiones de time management
- Cuando hay más opciones que recursos
- Identificar qué delegar o eliminar

**Estructura del debate:**
```
Cuadrante 1: URGENTE + IMPORTANTE
  → HACER YA (crisis, deadlines críticos)

Cuadrante 2: NO URGENTE + IMPORTANTE
  → PLANIFICAR (estrategia, prevención, desarrollo)

Cuadrante 3: URGENTE + NO IMPORTANTE
  → DELEGAR (interrupciones, algunas reuniones)

Cuadrante 4: NO URGENTE + NO IMPORTANTE
  → ELIMINAR (distracciones, time wasters)

→ Recomendación final de priorización
```

---

#### **Recomendación Automática de Framework**

**Procedimiento tRPC:** `frameworks.suggest`

**Archivo:** `packages/api/src/routers/frameworks.ts`

**Análisis:**

```typescript
// Input:
{
  question: string,
  context: string,
  questionType?: string
}

// Sistema detecta keywords:
const keywords = {
  prosAndCons: ['ventajas', 'desventajas', 'comparar', 'vs', 'pros', 'cons', 'decidir entre'],
  swot: ['estrategia', 'mercado', 'competencia', 'oportunidad', 'amenaza', 'fortaleza'],
  eisenhower: ['priorizar', 'urgente', 'importante', 'cuándo', 'qué primero', 'tareas']
}

// Output:
{
  frameworkId: string,
  slug: string,
  name: string,
  matchScore: 0-100,
  reasoning: string,                // Por qué se recomienda este framework
  alternatives: Framework[]         // Otros frameworks aplicables
}
```

**Lógica de recomendación:**
```
Si pregunta contiene "vs", "comparar" → Pros and Cons (90% confidence)
Si pregunta contiene "estrategia", "mercado" → SWOT (85% confidence)
Si pregunta contiene "priorizar", "qué primero" → Eisenhower (80% confidence)
Si múltiples opciones detectadas → Eisenhower (75% confidence)
Default → Pros and Cons (más versátil)
```

---

### **Validación de Fase 3**

```typescript
// AMBOS obligatorios:
const canContinue =
  !!estrategia.selectedStrategy &&        // ❌ NO puede ser null
  !!estrategia.selectedFrameworkId &&     // ❌ NO puede ser null
  userBalance >= estimatedTotalCost

// Si falta alguno → Botón "Continuar" deshabilitado
```

---

### **Datos Guardados en Fase 3**

```typescript
{
  selectedStrategy: string,               // 'parallel', 'adversarial', etc.
  selectedFrameworkId: string,            // UUID del framework
  frameworkSlug?: string,                 // 'pros-and-cons', 'swot-analysis', etc.
  estimatedRounds: number,                // Estimación de rondas del debate
  estimatedCost: number                   // Coste estimado total
}
```

---

## 🎯 FASE 4: REVISIÓN

**Archivo:** `apps/web/src/app/debates/new-unified/components/phase-revision.tsx`

**Objetivo:** Revisar toda la configuración antes de crear el debate.

---

### **Flujo Completo**

```
1. Sistema muestra resumen completo:
   ├─ Pregunta principal
   ├─ Contexto recopilado (score de calidad)
   ├─ Participantes seleccionados (expertos, depts, workers)
   ├─ Estrategia elegida
   ├─ Framework elegido
   ├─ Créditos gastados hasta ahora (Fase 1)
   └─ Estimación total del debate (min-max)
   ↓
2. Validación final:
   - ¿Balance >= coste estimado?
   - ¿Todos los datos completos?
   ↓
3. Si validación OK:
   - ✅ Botón "Crear Debate" habilitado

   Si validación falla:
   - ❌ Muestra warning específico
   - Permite editar cualquier fase
   ↓
4. Usuario puede editar:
   - 📝 Editar pregunta → Vuelve a Fase 1
   - 📝 Editar contexto → Vuelve a Fase 1
   - 📝 Editar expertos → Vuelve a Fase 2
   - 📝 Editar estrategia → Vuelve a Fase 3
   ↓
5. Usuario confirma → Click en "Crear Debate"
   ↓
6. Sistema:
   - Actualiza draft existente (status: 'draft' → 'pending')
   - Crea debate en DB con toda la configuración
   - Inicia ejecución del debate
   - Redirige a Fase 5
```

---

### **Resumen Mostrado**

```typescript
{
  question: string,                    // Pregunta principal
  contextScore: number,                // Score de calidad 0-100
  contextAnswersCount: number,         // Cuántas preguntas respondidas

  participants: {
    expertsCount: number,              // Número de expertos IA
    departmentsCount: number,          // Número de departamentos
    workersCount: number,              // Número de profesionales
    total: number                      // Total de participantes
  },

  strategy: string,                    // Nombre de la estrategia
  framework: string,                   // Nombre del framework

  costs: {
    spentSoFar: number,               // Créditos gastados en Fase 1
    estimatedMin: number,             // Estimación mínima del debate
    estimatedMax: number,             // Estimación máxima del debate
    total: number                     // spentSoFar + estimatedMax
  }
}
```

---

### **Visualización de Créditos**

**Componente:** `RealCreditsTracker` (variant="card")

```tsx
<RealCreditsTracker
  realCreditsDeducted={contexto.realCreditsDeducted}
  estimatedCredits={estimatedMin}
  showComparison={true}
  variant="card"
/>

// Muestra:
// 💰 Créditos Gastados: 12
// En esta fase
// ✅ 2 bajo estimado (si gastó menos)
// 🔴 +3 vs estimado (si gastó más)
```

---

### **Validación Final**

```typescript
const canProceed =
  contexto.mainQuestion.length >= 10 &&
  Object.keys(contexto.answers).length > 0 &&
  (expertos.selectedExpertIds.length > 0 ||
   expertos.selectedDepartmentIds.length > 0 ||
   expertos.selectedWorkerIds.length > 0) &&
  !!estrategia.selectedStrategy &&
  !!estrategia.selectedFrameworkId &&
  userBalance >= (contexto.realCreditsDeducted + estrategia.estimatedCost)

// Si falta algo → Muestra mensaje específico
```

---

### **Datos Guardados en Fase 4**

```typescript
{
  canProceed: boolean,
  summary: {
    question: string,
    expertCount: number,
    departmentCount: number,
    workerCount: number,
    strategy: string,
    framework: string,
    contextScore: number,
    totalCost: number
  }
}
```

---

## 🎯 FASE 5: DEBATE ACTIVO

**Archivo:** `apps/web/src/app/debates/new-unified/components/phase-debate.tsx`

**Objetivo:** Mostrar el debate en ejecución y permitir interacción.

---

### **Flujo Completo**

```
1. Usuario confirma creación en Fase 4
   ↓
2. Sistema llama a api.debates.create:
   - Actualiza draft (status: 'draft' → 'pending')
   - Crea registro completo en DB
   - Inicia workers de debate en background
   ↓
3. Debate cambia a status: 'in_progress'
   ↓
4. Usuario es redirigido a /debates/[id]
   - Redirección automática en 3 segundos
   - Muestra countdown
   ↓
5. En /debates/[id]:
   - SSE (Server-Sent Events) para updates en tiempo real
   - Muestra progreso del debate
   - Muestra argumentos de cada participante
   - Permite interacción del usuario (añadir comentarios, votar)
   ↓
6. Estados del debate:
   - pending → Esperando inicio
   - in_progress → Ejecutándose
   - completed → Finalizado con consenso
   - failed → Error durante ejecución
   - cancelled → Cancelado por el usuario
```

---

### **Auto-redirección**

```typescript
// En phase-debate.tsx:
useEffect(() => {
  if (debate.debateId) {
    const timer = setTimeout(() => {
      router.push(`/debates/${debate.debateId}`)
    }, 3000)

    return () => clearTimeout(timer)
  }
}, [debate.debateId])

// Muestra countdown: "Redirigiendo en 3... 2... 1..."
```

---

### **Datos Guardados en Fase 5**

```typescript
{
  debateId: string | null,        // UUID del debate creado
  status: DebateStatus,           // 'pending' | 'in_progress' | 'completed' | 'failed'
  messages: Message[],            // Historial del chat (no usado en esta fase)
  input: string,                  // Input del usuario (no usado en esta fase)
  isLoading: boolean              // Creando el debate
}
```

---

## ✅ SISTEMA DE VALIDACIÓN DE CALIDAD

### **Objetivo**

Asegurar que las respuestas del usuario:
- ✅ Están relacionadas con la pregunta
- ✅ Aportan valor real al contexto
- ✅ Tienen suficiente detalle
- ✅ No son evasivas ni vagas

---

### **Nivel 1: Validación Individual**

**Archivo:** `packages/api/src/routers/debates.ts` (línea 2432-2620)

**Procedimiento tRPC:**
```typescript
validateAnswerRelevance: protectedProcedure
  .input(z.object({
    question: z.string(),
    answer: z.string(),
    previousAnswers: z.record(z.string()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Deducir 1 crédito por validación
    // 2. Llamar a IA (OpenAI o Anthropic) para validar
    // 3. Retornar resultado de validación
  })
```

**Criterios de validación:**

| Criterio | Qué detecta | Ejemplo de respuesta inválida | Acción |
|----------|-------------|-------------------------------|--------|
| `isRelevant: false` | No relacionado con la pregunta | P: "¿Cuál es tu producto?" → R: "Me gusta el café" | ❌ Bloquea |
| `isVague: true` | Demasiado genérica sin detalles | "Es importante", "Depende", "No sé" | ❌ Bloquea |
| `isTooShort: true` | Menos de 15 caracteres cuando pide desarrollo | "Sí", "No", "Ok" | ❌ Bloquea |
| `qualityIssues: ['evasive']` | Evasiva sin intentar responder | "No tengo claro", "No estoy seguro" (sin más) | ❌ Bloquea |
| `requiresExplanation: true` | Necesita más contexto para entender | Respuesta ambigua que no se conecta claramente | ❌ Bloquea |

**Prompt del sistema (línea 2514-2547):**
```
Eres un validador experto de respuestas en contexto de decisiones estratégicas.

CRITERIOS ESTRICTOS:

1. RELEVANCIA:
   - La respuesta DEBE estar relacionada con la pregunta
   - Si habla de tema completamente diferente → isRelevant: false

2. CLARIDAD (NO VAGA):
   - Si menciona "voy a analizar", "necesito evaluar", "buscaré info" → Es VÁLIDA
   - SOLO es vaga si es literalmente "Sí", "No", "Depende" sin explicación
   - Respuestas que muestran proceso de pensamiento son VÁLIDAS

3. LONGITUD:
   - isTooShort: true SOLO si < 15 caracteres Y la pregunta pide desarrollo
   - "Sí" a pregunta yes/no → Válida
   - "Sí" a pregunta abierta → Inválida

4. EVASIVAS:
   - "No sé" sin más → Evasiva
   - "No sé, pero creo que..." → Válida (intenta responder)

5. EXPLICACIÓN:
   - Si la respuesta es ambigua o no se entiende bien → requiresExplanation: true

RESPONDE JSON:
{
  "isRelevant": boolean,
  "isVague": boolean,
  "isTooShort": boolean,
  "requiresExplanation": boolean,
  "reasoning": "Por qué pasó o no la validación",
  "suggestion": "Qué debería hacer el usuario para mejorar",
  "qualityIssues": ["evasive", "generic", etc.],
  "creditsDeducted": 1
}
```

---

### **Nivel 2: Evaluación Global del Contexto**

**Archivo:** `packages/api/src/routers/debates.ts` (líneas ~2050-2150)

**Procedimiento tRPC:**
```typescript
evaluateContextQuality: protectedProcedure
  .input(z.object({
    question: z.string(),
    answers: z.record(z.string()),
    currentPhase: z.enum(['critical', 'deep', 'refine']),
    internetContext: z.string().optional(),
    totalAnswersCount: z.number(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Analizar todas las respuestas en conjunto
    // 2. Calcular score de calidad (0-100)
    // 3. Detectar aspectos faltantes
    // 4. Decidir si necesita más preguntas
    // 5. Generar follow-up questions si es necesario
  })
```

**Análisis realizado:**

```
1. Completitud: ¿Se cubrieron todos los aspectos necesarios?
2. Coherencia: ¿Las respuestas son consistentes entre sí?
3. Profundidad: ¿Hay suficiente detalle para tomar decisión?
4. Relevancia: ¿Todo es relevante para la pregunta?
5. Duplicación: ¿Hay información repetida innecesariamente?
6. Contradicciones: ¿Hay respuestas que se contradicen?
```

**Resultado:**
```typescript
{
  score: 0-100,                           // Calidad del contexto
  readinessLevel: 'poor' | 'fair' | 'good' | 'excellent',
  summary: string,                        // Resumen de la evaluación
  missingAspects: string[],               // ["Objetivos claros", "Timeline", ...]
  shouldContinue: boolean,                // ¿Necesita más preguntas?
  followUpQuestions: Question[],          // Preguntas de profundización
  qualityIssues: string[],                // ['vague_answers', 'missing_critical_info']
  reasoning: string,                      // Explicación del score
  creditsDeducted: number                 // Créditos consumidos (~3-5)
}
```

**Lógica de progreso:**
```typescript
// Si score >= 40 y no hay aspectos críticos faltantes:
if (result.score >= 40 && !result.shouldContinue) {
  setContexto(prev => ({ ...prev, phase: 'ready' }))
  updatePhaseProgress(1, 100)  // ✅ Puede avanzar
}

// Si score < 40 o hay aspectos faltantes:
else {
  setContexto(prev => ({
    ...prev,
    phase: 'deep',
    questions: [...prev.questions, ...result.followUpQuestions]
  }))

  const qualityProgress = result.score // 0-100
  const answersBonus = Math.min(10, totalAnswersCount * 2)
  const calculatedProgress = Math.min(90, qualityProgress + answersBonus)
  updatePhaseProgress(1, calculatedProgress)  // ⚠️ Progreso parcial
}
```

---

## 💾 SISTEMA DE GUARDADO AUTOMÁTICO

### **Guardado en localStorage (24 horas)**

**Archivo:** `use-unified-debate-state.ts` (línea 103-156)

**Cuándo se guarda:**
```typescript
useEffect(() => {
  const hasAtLeastOneAnswer = Object.keys(contexto.answers).length > 0

  if (hasAtLeastOneAnswer) {
    saveStateToStorage({
      sessionId,
      currentPhase,
      phaseProgress,
      contexto,
      expertos,
      estrategia,
      revision,
    })
  }
}, [sessionId, currentPhase, phaseProgress, contexto, expertos, estrategia, revision])
```

**Trigger de guardado:**
- ✅ Después de responder cualquier pregunta
- ✅ Al cambiar de fase
- ✅ Al seleccionar expertos/departamentos/workers
- ✅ Al elegir estrategia o framework
- ✅ Al modificar cualquier parte del estado

**Datos guardados:**
```json
{
  "sessionId": "uuid",
  "currentPhase": 1-5,
  "phaseProgress": { "contexto": 65, "expertos": 0, "estrategia": 0, "revision": 0 },
  "contexto": {
    "mainQuestion": "...",
    "answers": { "q1": "...", "q2": "..." },
    "questions": [...],
    "contextScore": 65,
    "realCreditsDeducted": 5,
    "phase": "critical",
    "draftId": "debate-uuid"
  },
  "expertos": { ... },
  "estrategia": { ... },
  "savedAt": "2026-01-30T10:30:00Z"
}
```

**Duración:** 24 horas máximo (se limpia automáticamente si es más antiguo)

---

### **Guardado en Base de Datos (Permanente)**

**Tabla:** `quoorum_debates` con `status: 'draft'`

**Cuándo se crea el draft:**
```typescript
// Al enviar la pregunta inicial (Fase 1)
const draftDebate = await createDraft.mutateAsync({
  question: mainQuestion,
  context: { answers, questions },
  category: 'general',
})

setContexto(prev => ({
  ...prev,
  draftId: draftDebate.id  // ✅ Guardar ID para actualizaciones futuras
}))
```

**Actualización del draft:**
```typescript
// Al crear el debate final (Fase 4 → Fase 5)
await createDebate.mutateAsync({
  draftId: contexto.draftId,  // ✅ Actualiza el draft existente
  question: contexto.mainQuestion,
  context: fullContext,
  expertIds: expertos.selectedExpertIds,
  departmentIds: expertos.selectedDepartmentIds,
  workerIds: expertos.selectedWorkerIds,
  strategy: estrategia.selectedStrategy,
  frameworkId: estrategia.selectedFrameworkId,
})
```

**Estados del debate:**
- `draft` → Borrador (se puede editar, recuperar)
- `pending` → Enviado a ejecutar (esperando workers)
- `in_progress` → Ejecutándose
- `completed` → Completado con consenso
- `failed` → Error durante ejecución
- `cancelled` → Cancelado por el usuario

---

### **Recuperación Automática**

**Archivo:** `use-unified-debate-state.ts` (línea 163-234)

```typescript
function loadStateFromStorage(sessionId: string) {
  const saved = localStorage.getItem(`quoorum-debate-creation-state-${sessionId}`)
  if (!saved) return null

  const parsed = JSON.parse(saved)

  // Verificar antigüedad (24 horas máx)
  const ageInHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
  if (ageInHours > 24) {
    localStorage.removeItem(storageKey)
    return null
  }

  return parsed  // ✅ Recupera TODO el estado
}

// Auto-cargar al iniciar
useEffect(() => {
  if (!hasLoadedSavedState && sessionId) {
    const saved = loadStateFromStorage(sessionId)
    if (saved) {
      // Restaurar TODO el estado
      setCurrentPhase(saved.currentPhase)
      setPhaseProgress(saved.phaseProgress)
      setContexto(saved.contexto)
      setExpertos(saved.expertos)
      setEstrategia(saved.estrategia)
      setRevision(saved.revision)
    }
    setHasLoadedSavedState(true)
  }
}, [sessionId, hasLoadedSavedState])
```

---

## 💰 SISTEMA DE CRÉDITOS

### **Tracking de Créditos Reales**

**Campo:** `contexto.realCreditsDeducted` (acumulador en Fase 1)

**Cuándo se consumen créditos:**

| Operación | Coste | Cuándo | Archivo |
|-----------|-------|--------|---------|
| **Generar preguntas críticas (IA)** | ~2-5 créditos | Al inicio de Fase 1 (si elige IA) | debates.ts:1850 |
| **Validar cada respuesta** | ~1 crédito | Por cada respuesta del usuario | debates.ts:2432 |
| **Evaluar calidad global** | ~3-5 créditos | Al completar preguntas críticas o deep | debates.ts:2050 |
| **Búsqueda en internet** | ~5-10 créditos | Si el usuario la activa (opcional) | internet-search.ts |
| **Sugerir expertos (IA)** | ~1-2 créditos | Si usa modo AUTO en Fase 2 | experts.ts |
| **Sugerir departamentos (IA)** | ~1-2 créditos | Si usa modo AUTO en Fase 2 | departments.ts |
| **Sugerir workers (IA)** | ~1-2 créditos | Si usa modo AUTO en Fase 2 | workers.ts |
| **Analizar estrategia (IA)** | ~1-2 créditos | Si usa modo AUTO en Fase 3 | debate-strategy.ts |
| **Sugerir framework (IA)** | ~1-2 créditos | Si usa modo AUTO en Fase 3 | frameworks.ts |
| **Crear y ejecutar debate** | ~50-500 créditos | Al pasar de Fase 4 → Fase 5 | debates.ts:create |

**Total estimado por fase:**
- Fase 1: 5-20 créditos (depende de cuántas preguntas + validaciones)
- Fase 2: 0-6 créditos (depende de si usa AUTO para cada tipo)
- Fase 3: 0-4 créditos (depende de si usa AUTO)
- Fase 4: 0 créditos (solo revisión)
- Fase 5: 50-500 créditos (depende de participantes, estrategia, rondas)

---

### **Actualización en Tiempo Real**

```typescript
// En handleAnswer después de validar:
if (validation.creditsDeducted) {
  setContexto(prev => ({
    ...prev,
    realCreditsDeducted: prev.realCreditsDeducted + validation.creditsDeducted
  }))
}

// En evaluateContextQuality:
setContexto(prev => ({
  ...prev,
  realCreditsDeducted: prev.realCreditsDeducted + result.creditsDeducted
}))

// En suggestInitialQuestions:
setContexto(prev => ({
  ...prev,
  realCreditsDeducted: prev.realCreditsDeducted + result.creditsDeducted
}))
```

---

### **Componente de Visualización: RealCreditsTracker**

**Archivo:** `components/real-credits-tracker.tsx`

**3 Variantes:**

#### **1. Inline (por defecto)**
```tsx
<RealCreditsTracker
  realCreditsDeducted={5}
  variant="inline"
/>
// Muestra: 💰 5 créditos gastados
```

#### **2. Card (para resumen)**
```tsx
<RealCreditsTracker
  realCreditsDeducted={12}
  estimatedCredits={10}
  showComparison={true}
  variant="card"
/>
// Muestra card destacada con:
// Créditos Gastados
// En esta fase
// 12
// ✅ 2 bajo estimado (o 🔴 +2 vs estimado)
```

#### **3. Compact (minimal)**
```tsx
<RealCreditsTracker
  realCreditsDeducted={5}
  variant="compact"
/>
// Muestra: 💰 5 gastados
```

**Dónde se muestra:**
- ✅ **PhaseContexto** (línea 185-191): Inline si hay créditos gastados
- ✅ **PhaseRevision** (línea 157-163): Card con resumen completo

---

### **Estimaciones vs Créditos Reales**

**Estimaciones** (mostradas en PhaseIndicator y Revisión):
- Se calculan ANTES de ejecutar
- Basadas en algoritmos predefinidos
- Fórmula: `baseByParticipant × participantCount × estimatedRounds`
- Sirven para que el usuario sepa cuánto costará ANTES de confirmar

**Créditos Reales** (mostrados en RealCreditsTracker):
- Se acumulan DESPUÉS de cada operación de IA
- Son los créditos REALMENTE deducidos de la cuenta del usuario
- Pueden diferir de las estimaciones (IA consumió más/menos tokens)
- Solo en Fase 1 (contexto), porque es la única fase con IA antes de crear debate

**Comparación visual en Fase 4:**
```
Fase 1 - Créditos Gastados: 12
Estimado original: 10
Diferencia: +2 (2 créditos más de lo estimado) 🔴

Debate Estimado: 150-300 créditos
(Se deducirán al ejecutar el debate)
```

---

## 🎨 PERSONALIZACIÓN CON BACKSTORY

### **Hook: useBackstoryHeader**

**Archivo:** `hooks/use-backstory-header.ts`

**Obtiene datos del usuario de `/settings/backstory`:**
```typescript
const { data: backstorySummary } = api.userBackstory.getSummary.useQuery()

// Genera título y subtítulo dinámicos:
return useMemo(() => {
  if (backstorySummary?.backstory) {
    const { companyName, role, industry, companyStage } = backstorySummary.backstory

    // Título personalizado:
    let title = 'Nuevo Debate'
    if (companyName) {
      title = `Debate para ${companyName}`
    } else if (role && industry) {
      title = `Debate: ${role} en ${industry}`
    }

    // Subtítulo con info del perfil:
    const subtitle = backstorySummary.summary || 'Configuración completa'
    // Ej: "Role: founder | Company: Quoorum | Industry: saas | Stage: growth"

    return { title, subtitle, hasBackstory: true }
  }

  // Fallback: Sin backstory configurado
  const randomPrompt = getRandomDebatePrompt()
  return {
    title: randomPrompt.title,
    subtitle: randomPrompt.subtitle,
    hasBackstory: false
  }
}, [backstorySummary])
```

**Datos del backstory:**
- `companyName` → Nombre de la empresa
- `role` → Rol del usuario (founder, CEO, CTO, etc.)
- `industry` → Industria (SaaS, fintech, etc.)
- `companySize` → Tamaño de la empresa
- `companyStage` → Etapa (idea, MVP, growth, scale, mature)
- `decisionStyle` → Estilo de decisión (rápido, balanceado, analítico)
- `additionalContext` → Contexto adicional

**Uso en componentes:**
```typescript
// En TODAS las fases (1-5):
const backstoryHeader = useBackstoryHeader()

<DebateStickyHeader
  phaseNumber={1}
  title={backstoryHeader.title}        // ✅ Dinámico según backstory
  subtitle={backstoryHeader.subtitle}   // ✅ Muestra rol, empresa, industria
/>
```

**Fallback automático:**
- Si el usuario NO ha configurado backstory → Usa prompts aleatorios genéricos
- Sin errores, transición suave

---

## 🛡️ COMPONENTES VISUALES

### **1. ValidationIndicator**

**Archivo:** `components/validation-indicator.tsx`

#### **ValidationBadge** (en tiempo real)
```tsx
{isValidating && <ValidationBadge isValidating={true} />}
// Muestra: 🔄 Validando...

{!isValidating && isValid && <ValidationBadge isValid={true} />}
// Muestra: ✅ Validado
```

**Ubicación:** En el input donde el usuario escribe respuestas

---

#### **ValidationShield** (permanente)
```tsx
{state.phase !== 'initial' && <ValidationShield />}
// Muestra: 🛡️ Validación activa
// Cada respuesta se verifica automáticamente
```

**Ubicación:** Justo debajo del `DebateStickyHeader` en `PhaseContexto`

---

#### **ValidationIndicator** (errores detallados)
```tsx
<ValidationIndicator
  isValidating={false}
  hasError={true}
  errorMessage="Tu respuesta es demasiado vaga. Por favor, proporciona más detalles específicos sobre tu producto."
/>

// Muestra card expandida con:
// ⚠️ La respuesta necesita mejorar
// [mensaje de error detallado]
```

**Ubicación:** En el chat, como mensaje de sistema

---

### **2. AutosaveIndicator**

**Archivo:** `components/autosave-indicator.tsx`

**Estados:**
- 🔄 **Guardando...** → Mientras guarda en localStorage
- ✅ **Guardado** → Muestra por 3 segundos después de guardar
- ☁️ **hace 2m** → Muestra tiempo desde último guardado

#### **AutosaveIndicator** (inline)
```tsx
<AutosaveIndicator
  isSaving={false}
  lastSaved={new Date()}
/>
// Muestra: ☁️ Guardado hace 2m
```

#### **AutosaveBadge** (floating)
```tsx
<AutosaveBadge isSaving={true} />
// Badge flotante top-right con "Guardando" o "Guardado"
```

**Uso:** Se puede integrar en el header o como badge flotante

---

### **3. RealCreditsTracker**

Ver sección [Sistema de Créditos](#sistema-de-creditos) arriba.

---

### **4. DebatesInProgressSection**

**Archivo:** `apps/web/src/app/debates/components/debates-in-progress-section.tsx`

**Ubicación:** En `/debates` page, antes de la lista de debates completados

**Muestra 2 tipos de drafts:**

#### **Drafts Locales (localStorage)**
- ✅ Guardados en las últimas 24 horas
- ✅ Muestra fase exacta (Contexto 65%, Expertos 0%, etc.)
- ✅ Muestra tiempo transcurrido ("hace 3h")
- ✅ Badge "Local" para identificarlos
- ✅ Preview de la pregunta principal
- ✅ Botón "Continuar" → `/debates/new-unified/{sessionId}`
- ✅ Botón "Eliminar" → Borra de localStorage

```typescript
{
  sessionId: "abc-123",
  currentPhase: 2,
  mainQuestion: "¿Debería lanzar mi producto ahora?",
  timestamp: 1738234567890,
  phaseProgress: { contexto: 100, expertos: 50, estrategia: 0, revision: 0 }
}
```

#### **Drafts en Base de Datos**
- ✅ Permanentes hasta que se eliminen manualmente
- ✅ Status: `'draft'` en tabla `quoorum_debates`
- ✅ Muestra fecha de creación
- ✅ Badge "Guardado en DB"
- ✅ Preview de la pregunta
- ✅ Botón "Ver" → `/debates/{id}`
- ✅ Botón "Eliminar" → Llama a `api.debates.delete`

**Query:**
```typescript
api.debates.list.useQuery({
  status: 'draft',
  limit: 10,
  orderBy: 'createdAt',
  orderDir: 'desc'
})
```

**Auto-ocultación:**
- Si no hay drafts (ni local ni DB) → Sección no se muestra
- Aparece solo cuando hay al menos 1 draft

---

## 🔍 DEBUGGING

### **Problema: Validación no funciona**

**Síntoma:** Acepta cualquier respuesta sin validar

**Verificar:**
```typescript
// 1. ¿El catch está silenciando errores?
catch (error) {
  logger.error('Error validating', { error })
  // ❌ NO hacer return aquí sin avisar al usuario
  // ❌ NO continuar aceptando la respuesta
}

// 2. ¿Se está llamando validateAnswer?
const validation = await validateAnswer.mutateAsync(...)
console.log('Validation result:', validation)

// 3. ¿Se detectan los quality issues?
const hasQualityIssues =
  validation.isVague ||
  validation.isTooShort ||
  validation.qualityIssues?.length > 0

if (!validation.isRelevant || validation.requiresExplanation || hasQualityIssues) {
  // ✅ DEBE bloquear aquí
  return
}

// 4. ¿Se muestran los toasts?
toast.warning('Test')  // Probar manualmente

// 5. ¿Hay créditos suficientes?
// Sin créditos → La validación falla con PAYMENT_REQUIRED
```

**Solución:** Ver [Errores Comunes - Error 1](#error-1-try-catch-silencia-validación) abajo

---

### **Problema: No se guardan drafts**

**Verificar:**
```typescript
// 1. ¿Hay al menos una respuesta?
const hasAtLeastOneAnswer = Object.keys(contexto.answers).length > 0
// Solo guarda si hasAtLeastOneAnswer = true

// 2. ¿El localStorage funciona?
localStorage.setItem('test', 'value')
localStorage.getItem('test')  // Debe retornar 'value'

// 3. ¿El sessionId es válido?
console.log('Session ID:', sessionId)
// Debe ser un UUID válido

// 4. ¿El useEffect se ejecuta?
useEffect(() => {
  console.log('Saving state...', contexto.answers)
  // Debe ejecutarse después de cada respuesta
}, [contexto.answers])
```

---

### **Problema: No se recuperan drafts**

**Verificar:**
```typescript
// 1. ¿El draft no es muy antiguo?
const ageInHours = (Date.now() - savedTimestamp) / (1000 * 60 * 60)
// Si > 24 horas → Se borra automáticamente

// 2. ¿El JSON es válido?
const saved = localStorage.getItem(`quoorum-debate-creation-state-${sessionId}`)
JSON.parse(saved)  // ¿Parsea sin error?

// 3. ¿El sessionId coincide con la URL?
// URL debe ser: /debates/new-unified/{sessionId}
// sessionId debe ser el mismo que el key en localStorage

// 4. ¿El componente DebatesInProgressSection está en la página?
// Debe estar en apps/web/src/app/debates/page.tsx
```

---

### **Problema: No se muestran créditos reales**

**Síntoma:** Usuario no ve cuántos créditos realmente gastó

**Causa:** `realCreditsDeducted` no se pasa a los componentes

**Solución:**
```tsx
// En phase-contexto.tsx:
{state.realCreditsDeducted > 0 && (
  <RealCreditsTracker
    realCreditsDeducted={state.realCreditsDeducted}
    variant="inline"
  />
)}

// En phase-revision.tsx:
{contexto.realCreditsDeducted > 0 && (
  <RealCreditsTracker
    realCreditsDeducted={contexto.realCreditsDeducted}
    estimatedCredits={estrategia.estimatedCost}
    showComparison={true}
    variant="card"
  />
)}
```

---

## ⚠️ ERRORES COMUNES

### **Error 1: Try-Catch Silencia Validación**

**Síntoma:** Acepta cualquier respuesta sin validar

**Causa:**
```typescript
try {
  const validation = await validateAnswer.mutateAsync(...)
  // ... código de validación
} catch (error) {
  logger.error('Error', { error })
  // ❌ Continúa sin validar
}
// ❌ Código continúa aquí aceptando la respuesta
```

**Solución:**
```typescript
try {
  const validation = await validateAnswer.mutateAsync(...)

  // Detectar quality issues
  const hasQualityIssues =
    validation.isVague ||
    validation.isTooShort ||
    validation.qualityIssues?.length > 0

  if (!validation.isRelevant || validation.requiresExplanation || hasQualityIssues) {
    // Mostrar warning
    toast.warning(warningTitle, { description: validation.suggestion })

    // Añadir mensaje al chat
    setContexto(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'ai', content: errorMessage, type: 'validation' }]
    }))

    setIsValidating(false)
    return  // ✅ BLOQUEAR si hay problemas
  }

  // ✅ Solo llega aquí si la validación pasó
  setIsValidating(false)

  // Actualizar créditos
  if (validation.creditsDeducted) {
    setContexto(prev => ({
      ...prev,
      realCreditsDeducted: prev.realCreditsDeducted + validation.creditsDeducted
    }))
  }

} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

  // Error de créditos → BLOQUEAR
  if (errorMessage.includes('insuficientes') || errorMessage.includes('PAYMENT_REQUIRED')) {
    toast.error('Créditos insuficientes', {
      description: 'Recarga créditos para continuar.',
      duration: 8000,
    })

    setContexto(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'ai', content: '**⚠️ Créditos insuficientes**', type: 'error' }]
    }))

    setIsValidating(false)
    return  // ✅ BLOQUEAR
  }

  // Otros errores (red, timeout): avisar pero permitir continuar
  toast.warning('No se pudo validar la respuesta', {
    description: 'Error de conexión. Continuamos sin validar.',
    duration: 6000,
  })

  setContexto(prev => ({
    ...prev,
    messages: [...prev.messages, { role: 'ai', content: '⚠️ No se pudo validar (error de conexión)', type: 'warning' }]
  }))

  setIsValidating(false)
  // ⚠️ Permite continuar (no es error crítico)
}
```

---

### **Error 2: Drafts No Aparecen en Lista**

**Síntoma:** Usuario tiene drafts pero no se muestran en `/debates`

**Causa:** `DebatesInProgressSection` no añadido a la página

**Solución:**
```tsx
// En apps/web/src/app/debates/page.tsx:
import { DebatesInProgressSection } from "./components"

// Añadir ANTES de la lista de debates:
<div className="mb-8">
  <DebatesInProgressSection />
</div>

<div className="space-y-4">
  {debates.map(debate => <DebateListItem key={debate.id} debate={debate} />)}
</div>
```

---

### **Error 3: Frameworks No Disponibles**

**Síntoma:** Framework selector vacío o muestra error

**Causa:** Base de datos no tiene frameworks seeded

**Solución:**
```bash
# Ejecutar migración:
pnpm db:push

# Verificar que la tabla existe:
SELECT * FROM frameworks;

# Debe mostrar 3 rows:
# - pros-and-cons
# - swot-analysis
# - eisenhower-matrix
```

**Archivo de migración:** `packages/db/drizzle/0035_add_frameworks_v2.sql`

---

## ⚡ FLUJO COMPLETO RESUMIDO

```
1. Usuario va a /debates/new-unified
   ↓
2. Se genera sessionId único (UUID)
   ↓
3. Se carga estado guardado si existe (localStorage)
   ↓
4. Se obtiene backstory del usuario → Título/subtítulo personalizado
   ↓
5. FASE 1: Usuario escribe pregunta inicial
   ↓
6. Usuario elige: Preguntas sugeridas (gratis) o IA (2-5 créditos)
   ↓
7. IA genera 3-5 preguntas críticas (si eligió IA)
   ↓
8. Usuario responde cada pregunta
   ↓
9. [VALIDACIÓN] IA verifica calidad (1 crédito/respuesta)
   ├─ Si inválida → Warning + bloqueo
   └─ Si válida → Continúa
   ↓
10. [GUARDADO AUTO] Estado guardado en localStorage
    ↓
11. Al completar preguntas → Evaluación global (3-5 créditos)
    ↓
12. Si score >= 40 → Fase 2 (Expertos)
    Si score < 40 → Más preguntas (deep)
    ↓
13. FASE 2: Seleccionar participantes
    ├─ Expertos IA (80+ disponibles, 5 categorías)
    ├─ Departamentos (de la empresa del usuario)
    └─ Profesionales (del equipo del usuario)
    ↓
14. Cada selector en modo AUTO consume ~1-2 créditos
    ↓
15. Sistema calcula coste estimado del debate (50-500 créditos)
    ↓
16. Verifica balance >= coste → Continúa a Fase 3
    ↓
17. FASE 3A: Seleccionar patrón de estrategia (9 opciones)
    - simple, sequential, parallel, conditional, iterative
    - tournament, adversarial, ensemble, hierarchical
    ↓
18. FASE 3B: Seleccionar framework de decisión (OBLIGATORIO)
    - Pros and Cons (simple, binario)
    - SWOT Analysis (estratégico, 4 cuadrantes)
    - Eisenhower Matrix (priorización, urgencia vs importancia)
    ↓
19. Modo AUTO de estrategia y framework consume ~2-4 créditos
    ↓
20. FASE 4: Revisión completa
    - Muestra resumen de TODO
    - Muestra créditos gastados hasta ahora (RealCreditsTracker card)
    - Muestra estimación del debate (min-max)
    - Permite editar cualquier fase
    - Botón "Crear Debate"
    ↓
21. [CREACIÓN] Draft actualizado a debate real:
    - status: 'draft' → 'pending'
    - Se inician workers de debate
    - Se consume el coste estimado del debate (50-500 créditos)
    ↓
22. FASE 5: Debate se ejecuta
    - Muestra progreso de inicialización
    - Polling cada 1 segundo para actualizar estado
    ↓
23. Auto-redirección a /debates/{id} en 3 segundos
    ↓
24. Debate en vivo con SSE (Server-Sent Events)
```

---

## 📊 TABLA DE DATOS POR FASE

| Fase | Datos Guardados | Validaciones | Créditos Consumidos |
|------|----------------|--------------|---------------------|
| **1. Contexto** | mainQuestion, answers, questions, contextScore, evaluation, phase, realCreditsDeducted, draftId | Validación individual (cada respuesta) + Evaluación global (al final) | 5-20 créditos |
| **2. Expertos** | selectedExpertIds, selectedDepartmentIds, selectedWorkerIds, participantTypes, estimatedCost | Al menos 1 tipo seleccionado + balance >= coste | 0-6 créditos |
| **3. Estrategia** | selectedStrategy, selectedFrameworkId, frameworkSlug, estimatedRounds | Ambos obligatorios (strategy + framework) | 0-4 créditos |
| **4. Revisión** | canProceed, summary | Verificación final de balance + completitud | 0 créditos |
| **5. Debate** | debateId, status | Debate iniciado correctamente | 50-500 créditos |

---

## 🎓 EJEMPLOS DE USO

### **Ejemplo 1: Usuario con Backstory Configurado**

```
/settings/backstory:
  - companyName: "Quoorum"
  - role: "founder"
  - industry: "saas"
  - companyStage: "growth"

→ Al crear debate:

Fase 1 Header:
  📊 Fase 1 de 5
  Título: "Debate para Quoorum"
  Subtítulo: "Role: founder | Company: Quoorum | Industry: saas | Stage: growth"

Preguntas generadas por IA (contextualizadas):
  - "Como founder de una SaaS en fase growth, ¿cuál es tu ARR actual?"
  - "¿Qué canales de adquisición están generando mejor ROI ahora?"
  - "¿Cuál es tu burn rate y runway actual?"
```

---

### **Ejemplo 2: Respuesta Inválida**

```
IA: "¿Cuál es tu principal objetivo con este producto?"

Usuario: "No sé"

→ Sistema detecta:
  - isRelevant: true (relacionado con la pregunta)
  - isVague: true (muy genérica)
  - qualityIssues: ['evasive']

→ Muestra:
  🔔 Toast: "Respuesta evasiva"
  💬 Chat: "Tu respuesta es evasiva. Por favor, intenta proporcionar información útil aunque sea aproximada. Por ejemplo: objetivos de revenue, usuarios, engagement, etc."
  🚫 NO permite continuar

Usuario: "Mi objetivo es aumentar el engagement de usuarios activos en un 30% en los próximos 3 meses"

→ Sistema detecta:
  - isRelevant: true
  - isVague: false
  - isTooShort: false
  - qualityIssues: []
  ✅ Permite continuar
```

---

### **Ejemplo 3: Selección de Participantes (Fase 2)**

```
Pregunta: "¿Debería lanzar una nueva feature de IA en mi SaaS?"

Usuario selecciona:
  ☑️ Expertos IA
  ☑️ Departamentos
  ☐ Profesionales

→ Modo AUTO sugiere:

EXPERTOS IA:
  1. Andrew Ng (AI/ML) - 95% match
  2. Marty Cagan (Product) - 88% match
  3. Patrick Campbell (Pricing) - 82% match
  4. Aaron Ross (Sales) - 75% match

DEPARTAMENTOS (de su empresa):
  1. Product Department - 92% match
  2. Engineering Department - 90% match
  3. Marketing Department - 78% match

Usuario selecciona 3 expertos + 2 departamentos = 5 participantes

→ Coste estimado: 150-300 créditos
→ Balance del usuario: 500 créditos
→ ✅ Puede continuar
```

---

### **Ejemplo 4: Selección de Estrategia (Fase 3)**

```
Pregunta: "¿Debería lanzar una nueva feature de IA en mi SaaS?"
5 participantes seleccionados

→ Modo AUTO analiza:

ESTRATEGIA RECOMENDADA: Adversarial (85% confidence)
Reasoning: "La pregunta implica una decisión de go/no-go con riesgo significativo.
            Un debate adversarial (Defensor vs Atacante + Juez) permitirá
            identificar puntos débiles antes del lanzamiento."

Alternativas:
  - Parallel (75%): Explorar múltiples dimensiones (producto, marketing, tech)
  - SWOT (70%): Análisis estratégico de strengths/weaknesses

Usuario acepta: Adversarial

FRAMEWORK RECOMENDADO: Pros and Cons (90% confidence)
Reasoning: "Decisión binaria (lanzar/no lanzar). Pros and Cons es el framework
            más claro para este tipo de decisiones."

Alternativas:
  - SWOT (65%): Si quiere análisis más profundo de mercado
  - Eisenhower (30%): No aplica (no es cuestión de priorización)

Usuario acepta: Pros and Cons

→ Configuración final:
  - Strategy: Adversarial
  - Framework: Pros and Cons
  - Estimado: 180-350 créditos
  ✅ Continúa a Revisión
```

---

### **Ejemplo 5: Recuperación de Draft**

```
Usuario crea debate:
  - Fase 1: Completa (100%)
  - Fase 2: Selecciona 3 expertos (50%)
  - Cierra navegador

18 horas después:
  1. Va a /debates
  2. Ve sección "Debates en Progreso"
  3. Ve su draft:
     📋 "¿Debería lanzar nueva feature de IA?"
     🏷️ Local | Fase 2: Expertos (50%)
     ⏱️ hace 18h
  4. Click en "Continuar"
  5. → Carga en /debates/new-unified/{sessionId}
  6. ✅ TODO el estado restaurado:
     - Pregunta inicial
     - Todas las respuestas de Fase 1
     - Score de contexto: 78
     - 3 expertos ya seleccionados
     - Checkboxes de tipos de participantes ya marcados
  7. Usuario continúa desde donde lo dejó
```

---

## 📝 CHECKLIST DE DESARROLLO

### **Al modificar el flujo de debates:**

- [ ] ✅ **Leer este módulo completo primero** (13-debate-flow.md)
- [ ] ✅ **Verificar que la validación funciona** (no silenciar errores en catch)
- [ ] ✅ **Probar con respuestas inválidas** ("No sé", "Sí", texto irrelevante)
- [ ] ✅ **Verificar que se muestran créditos reales** (RealCreditsTracker visible)
- [ ] ✅ **Comprobar guardado automático** (localStorage + draftId en DB)
- [ ] ✅ **Probar recuperación de drafts** (cerrar navegador y volver)
- [ ] ✅ **Verificar que backstory se aplica** (título/subtítulo personalizados)
- [ ] ✅ **Testear sin créditos** (debe bloquear con mensaje claro)
- [ ] ✅ **Testear sin backstory** (debe usar fallback sin errores)
- [ ] ✅ **Probar modo AUTO vs MANUAL** en todos los selectores
- [ ] ✅ **Verificar estimaciones de costes** (se actualizan en tiempo real)
- [ ] ✅ **Testear cada framework** (Pros/Cons, SWOT, Eisenhower)
- [ ] ✅ **Testear cada estrategia** (simple, parallel, adversarial, etc.)

---

## 🔗 REFERENCIAS

### **Archivos Principales:**

**Páginas y Hooks:**
- `apps/web/src/app/debates/new-unified/[sessionId]/page.tsx` - Página principal del flujo
- `apps/web/src/app/debates/new-unified/hooks/use-unified-debate-state.ts` - Hook central (1200+ líneas)
- `apps/web/src/app/debates/new-unified/hooks/use-backstory-header.ts` - Personalización con backstory
- `apps/web/src/app/debates/new-unified/types.ts` - Tipos TypeScript

**Componentes de Fases:**
- `apps/web/src/app/debates/new-unified/components/phase-contexto.tsx` - Fase 1
- `apps/web/src/app/debates/new-unified/components/phase-expertos.tsx` - Fase 2
- `apps/web/src/app/debates/new-unified/components/phase-estrategia.tsx` - Fase 3
- `apps/web/src/app/debates/new-unified/components/phase-revision.tsx` - Fase 4
- `apps/web/src/app/debates/new-unified/components/phase-debate.tsx` - Fase 5

**Componentes Visuales (Nuevos - 30 Ene 2026):**
- `apps/web/src/app/debates/new-unified/components/real-credits-tracker.tsx` - Créditos reales
- `apps/web/src/app/debates/new-unified/components/validation-indicator.tsx` - Validación visual
- `apps/web/src/app/debates/new-unified/components/autosave-indicator.tsx` - Autoguardado visual
- `apps/web/src/app/debates/components/debates-in-progress-section.tsx` - Lista de drafts

**Selectores de Participantes:**
- `apps/web/src/components/quoorum/expert-selector.tsx` - Selección de expertos (Auto/Manual)
- `apps/web/src/components/quoorum/department-selector.tsx` - Selección de departamentos (Auto/Manual)
- `apps/web/src/components/quoorum/worker-selector.tsx` - Selección de profesionales (Auto/Manual)
- `apps/web/src/components/quoorum/strategy-selector.tsx` - Selección de estrategia (9 patrones)
- `apps/web/src/components/quoorum/framework-selector.tsx` - Selección de framework (3 opciones)

**Configuración y Datos:**
- `packages/quoorum/src/config/expert-config.ts` - Base de datos de 80+ expertos
- `apps/web/src/lib/suggested-debate-questions.ts` - Pool de 50 preguntas sugeridas

**APIs (tRPC):**
- `packages/api/src/routers/debates.ts` - API principal de debates
  - `suggestInitialQuestions` (línea ~1850)
  - `validateAnswerRelevance` (línea ~2432)
  - `evaluateContextQuality` (línea ~2050)
  - `createDraft` (línea ~1200)
  - `create` (línea ~1450)
  - `list` (línea ~800)
  - `delete` (línea ~950)
- `packages/api/src/routers/experts.ts` - Sugerencia de expertos
- `packages/api/src/routers/departments.ts` - Sugerencia de departamentos
- `packages/api/src/routers/workers.ts` - Sugerencia de profesionales
- `packages/api/src/routers/debate-strategy.ts` - Análisis de estrategia
- `packages/api/src/routers/frameworks.ts` - Sugerencia de frameworks
- `packages/api/src/routers/user-backstory.ts` - API de backstory del usuario

**Base de Datos:**
- `packages/db/drizzle/0035_add_frameworks_v2.sql` - Schema de frameworks
- `packages/db/drizzle/0026_add_companies_departments.sql` - Schema de companies y departments
- `packages/db/schema/debates.ts` - Schema principal de debates

---

## 🚨 REGLAS CRÍTICAS

### **Este flujo SIEMPRE debe funcionar así:**

1. ❌ **NUNCA saltarse la validación** - Cada respuesta DEBE validarse
2. ❌ **NUNCA silenciar errores de validación** - El catch DEBE diferenciar error types
3. ❌ **NUNCA permitir avanzar sin créditos** - Verificar balance antes de cada fase
4. ✅ **SIEMPRE guardar automáticamente** - Después de cada cambio significativo
5. ✅ **SIEMPRE mostrar créditos reales** - Usuario debe saber cuánto gastó
6. ✅ **SIEMPRE personalizar con backstory** - Si está configurado
7. ✅ **SIEMPRE permitir recuperación** - localStorage (24h) + DB (permanente)
8. ✅ **SIEMPRE requerir ambos** - Strategy + Framework son OBLIGATORIOS
9. ✅ **SIEMPRE actualizar estimaciones** - Al cambiar participantes o estrategia
10. ✅ **SIEMPRE permitir edición en Revisión** - Botones de editar por fase

### **Validación es BLOQUEANTE:**
- Si respuesta es irrelevante → ❌ NO continuar
- Si respuesta es vaga → ❌ NO continuar
- Si respuesta es evasiva → ❌ NO continuar
- Si respuesta es muy corta → ❌ NO continuar
- Solo si TODAS las validaciones pasan → ✅ Continuar

### **Créditos son TRANSPARENTES:**
- Usuario ve créditos gastados en Fase 1 (RealCreditsTracker inline)
- Usuario ve estimación del debate ANTES de confirmar
- Usuario ve comparación real vs estimado en Fase 4 (RealCreditsTracker card)
- Si no hay créditos → Bloqueo con mensaje claro

---

## 📚 MÓDULOS RELACIONADOS

- [00 - CLAUDE-CORE](../CLAUDE-CORE.md) - Reglas críticas
- [01 - Startup Protocol](./01-startup-protocol.md) - Protocolo de inicio
- [03 - Database](./03-database.md) - Schema de debates
- [05 - Patterns](./05-patterns.md) - tRPC patterns
- [08 - Design System](./08-design-system.md) - Componentes UI
- [10 - Security](./10-security.md) - userId filtering
- [12 - AI Systems](./12-ai-systems.md) - Rate limiting de IA

---

**_Módulo expandido: 30 Ene 2026_**
**_Sistema de debates completamente documentado con todas las fases, sub-fases, selectores, frameworks, y validaciones_**
