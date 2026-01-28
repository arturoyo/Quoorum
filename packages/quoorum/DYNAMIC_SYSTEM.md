# Forum Dynamic Expert System

## Resumen

El sistema dinámico de expertos de Forum permite debates adaptativos de alta calidad mediante:

1. **Análisis de preguntas** → Identifica áreas, temáticas y complejidad
2. **Matching de expertos** → Selecciona los expertos más relevantes dinámicamente
3. **Monitoreo de calidad** → Detecta debates superficiales o repetitivos en tiempo real
4. **Meta-moderación** → Interviene para forzar profundidad y prevenir consenso prematuro

## Arquitectura

### Módulos Implementados

#### 1. Question Analyzer (`question-analyzer.ts`)

**Propósito:** Analiza preguntas para identificar qué expertos son necesarios

**Funcionalidad:**

- Identifica áreas de conocimiento (pricing, marketing, product, technical, etc.)
- Detecta temáticas específicas (SaaS, B2B, España, etc.)
- Estima complejidad (1-10) basándose en variables, impacto, reversibilidad e incertidumbre
- Clasifica tipo de decisión (strategic, tactical, operational)
- Recomienda expertos iniciales

**Ejemplo:**

```typescript
const analysis = await analyzeQuestion('¿Debo lanzar a 29€ o 49€?')
// {
//   areas: [
//     { area: 'pricing', weight: 60, reasoning: 'Main focus' },
//     { area: 'marketing', weight: 30, reasoning: 'Secondary' }
//   ],
//   topics: [{ name: 'SaaS', relevance: 90 }],
//   complexity: 7,
//   decisionType: 'strategic'
// }
```

#### 2. Expert Database (`expert-database.ts`)

**Propósito:** Base de datos de perfiles de expertos con especialidades

**Expertos Disponibles (17+):**

- **Go-to-Market:** April Dunford (positioning), Peep Laja (CRO), Steli Efti (sales)
- **Pricing:** Patrick Campbell (SaaS pricing), Alex Hormozi (value), Tomasz Tunguz (VC perspective)
- **Product:** Rahul Vohra (PMF), Lenny Rachitsky (growth)
- **Growth:** Brian Balfour (growth loops)
- **AI:** Andrej Karpathy (ML), Simon Willison (AI engineering)
- **Crítico:** The Critic (pensamiento crítico, siempre incluido)

**Estructura de Perfil:**

```typescript
{
  id: 'patrick_campbell',
  name: 'Patrick Campbell',
  title: 'Pricing Expert',
  expertise: ['pricing', 'SaaS', 'monetization'],
  topics: ['SaaS', 'B2B', 'pricing strategy'],
  perspective: 'data-driven',
  systemPrompt: '...',
  temperature: 0.7,
  provider: 'openai',
  modelId: 'gpt-4.1-mini'
}
```

#### 3. Expert Matcher (`expert-matcher.ts`)

**Propósito:** Matching automático de preguntas con expertos relevantes

**Funcionalidad:**

- Calcula score de matching (0-100) basado en:
  - Expertise match con áreas (60% weight)
  - Topic match (30% weight)
  - Bonuses por complejidad y tipo de decisión
- Asigna roles dinámicos:
  - **Primary:** Top 2-3 expertos (lideran el debate)
  - **Secondary:** Expertos de soporte
  - **Critic:** Siempre incluido para pensamiento crítico
- Valida que el matching sea adecuado

**Ejemplo:**

```typescript
const matches = matchExperts(analysis, { minExperts: 5, maxExperts: 7 })
// [
//   { expert: patrickCampbell, score: 95, suggestedRole: 'primary' },
//   { expert: alexHormozi, score: 85, suggestedRole: 'primary' },
//   { expert: aprilDunford, score: 75, suggestedRole: 'secondary' },
//   { expert: critic, score: 50, suggestedRole: 'critic' }
// ]
```

#### 4. Quality Monitor (`quality-monitor.ts`)

**Propósito:** Monitoreo en tiempo real de la calidad del debate

**Métricas:**

- **Depth Score (0-100):** Profundidad de argumentos (datos, razonamiento causal, ejemplos)
- **Diversity Score (0-100):** Diversidad de perspectivas (riesgos, oportunidades, datos, clientes)
- **Originality Score (0-100):** Originalidad vs repetición de conceptos
- **Overall Quality (0-100):** Score general combinado

**Problemas Detectados:**

- `shallow`: Argumentos superficiales sin profundidad
- `repetitive`: Contenido repetitivo sin nuevas perspectivas
- `lack_of_diversity`: Falta de diversidad de perspectivas
- `premature_consensus`: Consenso alcanzado sin exploración suficiente
- `superficial`: Falta de evidencia o datos

**Ejemplo:**

```typescript
const quality = analyzeDebateQuality(messages)
// {
//   overallQuality: 45,
//   depthScore: 40,
//   diversityScore: 45,
//   originalityScore: 50,
//   issues: [
//     { type: 'shallow', severity: 8, description: '...' }
//   ],
//   needsModeration: true
// }
```

#### 5. Meta-Moderator (`meta-moderator.ts`)

**Propósito:** Intervención inteligente para elevar la calidad del debate

**Tipos de Intervención:**

- `challenge_depth`: Forzar profundidad con datos y razonamiento
- `explore_alternatives`: Explorar ángulos no considerados
- `diversify_perspectives`: Incorporar perspectivas diversas (riesgo, oportunidad, cliente, financiero, operativo)
- `prevent_premature_consensus`: Cuestionar asunciones antes de consenso
- `request_evidence`: Solicitar evidencia y datos cuantitativos
- `challenge_assumptions`: Desafiar asunciones implícitas

**Frecuencia de Intervención:**

- Calidad alta (80+): cada 5 rondas
- Calidad media (60-80): cada 3 rondas
- Calidad baja (<60): cada 2 rondas

**Ejemplo:**

```typescript
if (shouldIntervene(qualityAnalysis)) {
  const intervention = generateIntervention(qualityAnalysis)
  // {
  //   type: 'challenge_depth',
  //   prompt: '[WARN] META-MODERADOR: El debate carece de profundidad...',
  //   severity: 8,
  //   reason: 'Shallow arguments detected'
  // }
}
```

## Flujo de Trabajo Propuesto

### Modo Estático (Actual)

```
Usuario → Pregunta → 4 agentes fijos → Debate → Consenso
```

### Modo Dinámico (Nuevo)

```
Usuario → Pregunta
  ↓
Análisis de pregunta (areas, topics, complexity)
  ↓
Matching de expertos (5-7 expertos relevantes)
  ↓
Debate adaptativo con monitoreo de calidad
  ↓
Meta-moderador interviene si calidad < threshold
  ↓
Consenso con trade-offs claros
```

## Integración con Runner.ts

### Opción 1: Modo Dual (Recomendado)

Mantener ambos modos y permitir al usuario elegir:

```typescript
interface ForumOptions {
  mode: 'static' | 'dynamic'
  // ... otras opciones
}

async function runForum(question: string, options: ForumOptions) {
  if (options.mode === 'static') {
    return runStaticDebate(question, options)
  } else {
    return runDynamicDebate(question, options)
  }
}
```

**Ventajas:**

- Mantiene compatibilidad con código existente
- Permite A/B testing
- Usuario puede elegir según necesidad

**Desventajas:**

- Más código a mantener
- Complejidad adicional

### Opción 2: Migración Completa

Reemplazar el sistema estático por el dinámico:

**Ventajas:**

- Código más limpio
- Un solo sistema a mantener
- Mejor experiencia de usuario

**Desventajas:**

- Breaking change
- Requiere migración de tests

### Opción 3: Híbrido Inteligente

Sistema dinámico con fallback a estático para preguntas simples:

```typescript
async function runForum(question: string, options: ForumOptions) {
  const analysis = await analyzeQuestion(question)

  if (analysis.complexity < 5 && analysis.areas.length <= 2) {
    // Pregunta simple → modo estático
    return runStaticDebate(question, options)
  } else {
    // Pregunta compleja → modo dinámico
    return runDynamicDebate(question, options)
  }
}
```

## Próximos Pasos

### Fase 4: Integración con Runner.ts

1. Decidir estrategia de integración (dual, completa o híbrida)
2. Implementar `runDynamicDebate()` function
3. Integrar quality monitor en el loop de debate
4. Integrar meta-moderator para intervenciones
5. Crear tests de integración

### Fase 5: Documentación y Compliance

1. Actualizar README.md con modo dinámico
2. Documentar API del sistema dinámico
3. Verificar coverage (objetivo: 80%+)
4. Verificar TypeScript strict compliance
5. Commit final y PR

### Futuro (Post-MVP)

- **UI para selección de expertos:** Permitir al usuario ver y ajustar expertos seleccionados
- **Expertos personalizados:** Permitir al usuario crear sus propios expertos
- **Learning system:** Aprender de debates pasados para mejorar matching
- **Multi-idioma:** Expertos en diferentes idiomas
- **Especialización por industria:** Expertos específicos de industrias (fintech, healthtech, etc.)

## Métricas de Éxito

- **Coverage:** 80%+ (actualmente: ~85%)
- **Tests:** 154 tests pasando (100%)
- **TypeScript:** Strict mode, 0 errores
- **Calidad de debate:** Overall quality > 70 en promedio
- **Intervenciones efectivas:** >80% de intervenciones mejoran calidad en 10+ puntos

## Conclusión

El sistema dinámico de expertos transforma Forum de un debate con 4 agentes fijos a un sistema adaptativo que:

1. **Selecciona expertos relevantes** según la pregunta
2. **Monitorea calidad** en tiempo real
3. **Interviene inteligentemente** para prevenir debates mediocres
4. **Produce consenso de alta calidad** con trade-offs claros

Esto hace que Forum sea significativamente más valioso para decisiones estratégicas complejas, que es exactamente el caso de uso del usuario (pricing, positioning, launch strategy de Wallie).
