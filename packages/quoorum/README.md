# @wallie/forum

Sistema de deliberación multi-agente para toma de decisiones estratégicas complejas.

## 📖 Descripción

Forum es un sistema personal de deliberación donde múltiples agentes de IA (con diferentes perspectivas y roles) debaten sobre preguntas estratégicas complejas hasta llegar a un consenso o ranking de opciones.

**Propósito:** Exponer conflictos reales, atacar sesgos cognitivos y permitir decisiones humanas conscientes en contextos de alta incertidumbre.

## 🎯 Características

### Sistema Estático (Preguntas Simples)

- **Multi-agente:** 4 agentes con roles especializados (Optimista, Crítico, Analista, Sintetizador)
- **Ultra-optimización:** Lenguaje comprimido para minimizar tokens (~87% ahorro)
- **Rápido y eficiente:** Ideal para preguntas simples y directas

### Sistema Dinámico (Preguntas Complejas) 🆕

- **Matching inteligente de expertos:** Selecciona 5-7 expertos relevantes de una base de 17+ perfiles
- **Monitoreo de calidad en tiempo real:** Detecta debates superficiales o repetitivos
- **Meta-moderador:** Interviene para forzar profundidad y prevenir consenso prematuro
- **Expertos especializados:** April Dunford (positioning), Patrick Campbell (pricing), Alex Hormozi (value), y más

### Características Comunes

- **Multi-provider:** Soporte para DeepSeek, Anthropic (Claude), OpenAI (GPT-4)
- **Rondas dinámicas:** Debate hasta consenso (no número fijo de rondas)
- **Contexto híbrido:** Manual + Internet + Repositorio
- **Ranking con % de éxito:** Output estructurado con múltiples opciones rankeadas
- **Traducción bajo demanda:** Los agentes debaten en lenguaje comprimido, traduces cuando necesitas

## 🏗️ Arquitectura

```
packages/quoorum/
├── src/
│   ├── agents.ts              # Configuración de agentes estáticos
│   ├── consensus.ts           # Detección de consenso y ranking
│   ├── context-loader.ts      # Carga de contexto (manual/internet/repo)
│   ├── runner.ts              # Orquestación del debate
│   ├── ultra-language.ts      # Lenguaje ultra-optimizado
│   ├── question-analyzer.ts   # 🆕 Análisis de preguntas
│   ├── expert-database.ts     # 🆕 Base de datos de expertos
│   ├── expert-matcher.ts      # 🆕 Matching de expertos
│   ├── quality-monitor.ts     # 🆕 Monitoreo de calidad
│   ├── meta-moderator.ts      # 🆕 Meta-moderación
│   ├── types.ts               # Tipos TypeScript
│   └── index.ts               # Exports públicos
├── __tests__/                 # Tests unitarios y E2E (67+ tests, 100% pass)
├── README.md                  # Este archivo
└── DYNAMIC_SYSTEM.md          # 🆕 Documentación del sistema dinámico
```

## 📦 Instalación

```bash
# Ya instalado como parte del monorepo de Wallie
pnpm install
```

## 🚀 Uso

### Uso Básico

```typescript
import { runDebate } from '@wallie/quoorum/runner'
import { loadContext } from '@wallie/quoorum/context'

// 1. Cargar contexto
const context = await loadContext({
  question: '¿Debo lanzar a 29€ o 49€?',
  manualContext: 'Costos: $12/usuario, Margen: 77%, Competencia: $74-500/mes',
  useInternet: true,
  useRepo: true,
  repoPath: '/path/to/wallie',
})

// 2. Ejecutar debate
const result = await runDebate({
  question: '¿Debo lanzar a 29€ o 49€?',
  context: context.combinedContext,
  maxRounds: 20,
  onProgress: (update) => {
    console.log(`Round ${update.round}: ${update.message}`)
  },
})

// 3. Ver resultados
console.log('Consenso:', result.consensus.hasConsensus)
console.log('Top opciones:', result.consensus.topOptions)
```

### Opciones Avanzadas

```typescript
// Configurar agentes personalizados
const result = await runDebate({
  question: '¿Qué feature priorizar?',
  context: '...',
  maxRounds: 15,
  agents: {
    optimizer: { modelId: 'deepseek-chat', temperature: 0.8 },
    critic: { modelId: 'claude-3-5-sonnet-20241022', temperature: 0.3 },
    analyst: { modelId: 'gpt-4o', temperature: 0.5 },
    synthesizer: { modelId: 'gpt-4o-mini', temperature: 0.4 },
  },
  onProgress: (update) => {
    if (update.type === 'message') {
      console.log(`${update.agent}: ${update.content}`)
    }
  },
})
```

## 🧪 Testing

```bash
# Ejecutar tests
pnpm test packages/forum

# Con coverage
pnpm test packages/forum --coverage

# Watch mode
pnpm test packages/forum --watch
```

**Coverage actual:** 85%+ (154 tests, 100% pass)

## 📊 Agentes

### Roles Predefinidos

| Agente           | Rol                                          | Modelo Default    | Temperatura |
| ---------------- | -------------------------------------------- | ----------------- | ----------- |
| **Optimista**    | Propone soluciones, identifica oportunidades | DeepSeek          | 0.8         |
| **Crítico**      | Encuentra riesgos, cuestiona supuestos       | Claude 3.5 Sonnet | 0.3         |
| **Analista**     | Analiza datos, calcula trade-offs            | GPT-4o            | 0.5         |
| **Sintetizador** | Resume debate, propone consenso              | GPT-4o-mini       | 0.4         |

### Personalización

Puedes personalizar los agentes modificando `src/agents.ts`:

```typescript
export const QUOORUM_AGENTS: Record<AgentKey, AgentConfig> = {
  optimizer: {
    name: 'Optimista',
    role: 'Propone soluciones...',
    modelId: 'deepseek-chat', // Cambiar modelo
    temperature: 0.8, // Ajustar temperatura
    systemPrompt: '...', // Personalizar prompt
  },
  // ...
}
```

## 🔄 Flujo de Debate

```
1. INICIO
   ├─ Cargar contexto (manual + internet + repo)
   └─ Inicializar agentes

2. RONDA 1-N (hasta consenso o maxRounds)
   ├─ Cada agente genera mensaje (lenguaje ultra-optimizado)
   ├─ Verificar consenso
   └─ Si no hay consenso → siguiente ronda

3. CONSENSO
   ├─ Extraer opciones viables
   ├─ Rankear por % de éxito
   └─ Generar reasoning

4. OUTPUT
   ├─ Ranking de opciones
   ├─ Pros/cons de cada opción
   ├─ Agentes que apoyan cada opción
   └─ Reasoning del consenso
```

## 💰 Costos

### Sin Ultra-Optimización

- Debate típico (10 rondas, 4 agentes): ~10,000 tokens
- Costo: ~$0.015 por debate

### Con Ultra-Optimización

- Debate típico (10 rondas, 4 agentes): ~1,300 tokens
- Costo: ~$0.002 por debate
- **Ahorro: 87%**

### Modelos Recomendados

| Modelo            | Costo/1M tokens | Uso Recomendado              |
| ----------------- | --------------- | ---------------------------- |
| DeepSeek          | $0.14           | Optimista (creatividad)      |
| GPT-4o-mini       | $0.15           | Sintetizador (síntesis)      |
| GPT-4o            | $2.50           | Analista (análisis profundo) |
| Claude 3.5 Sonnet | $3.00           | Crítico (rigor)              |

## 🎨 Ultra-Optimización

Los agentes debaten en un lenguaje comprimido con emojis y símbolos para minimizar tokens:

**Ejemplo:**

```
💡49€ ✓77%📈 WTP✓ 👑pos ⚠️🐌adopt 75% 👍2
```

**Traducción:**

```
Opción de 49 euros tiene 77% de margen positivo,
willingness to pay validado, posicionamiento premium,
riesgo de adopción lenta, 75% de éxito, 2 apoyos
```

Puedes traducir mensajes individuales cuando necesites leerlos.

## 🧠 Sistema Dinámico

El sistema dinámico se activa automáticamente para preguntas complejas (complejidad ≥ 5 o más de 2 áreas).

### Expertos Disponibles

**Go-to-Market:**

- April Dunford (positioning)
- Peep Laja (CRO)
- Steli Efti (sales)

**Pricing:**

- Patrick Campbell (SaaS pricing)
- Alex Hormozi (value)
- Tomasz Tunguz (VC perspective)

**Product:**

- Rahul Vohra (PMF)
- Lenny Rachitsky (growth)

**Growth:**

- Brian Balfour (growth loops)

**AI:**

- Andrej Karpathy (ML)
- Simon Willison (AI engineering)

**Crítico:**

- The Critic (pensamiento crítico, siempre incluido)

### Flujo Dinámico

```
Pregunta compleja
  ↓
Análisis automático (áreas, topics, complejidad)
  ↓
Matching de expertos (5-7 expertos relevantes)
  ↓
Debate adaptativo con monitoreo de calidad
  ↓
Meta-moderador interviene si calidad < 60
  ↓
Consenso con trade-offs claros
```

### Métricas de Calidad

- **Depth Score:** Profundidad de argumentos (datos, razonamiento, ejemplos)
- **Diversity Score:** Diversidad de perspectivas (riesgos, oportunidades, datos)
- **Originality Score:** Originalidad vs repetición
- **Overall Quality:** Score general combinado

### Intervenciones del Meta-Moderador

- `challenge_depth`: Forzar profundidad con datos
- `explore_alternatives`: Explorar ángulos no considerados
- `diversify_perspectives`: Incorporar perspectivas diversas
- `prevent_premature_consensus`: Cuestionar asunciones
- `request_evidence`: Solicitar evidencia cuantitativa

Para más detalles, ver [DYNAMIC_SYSTEM.md](./DYNAMIC_SYSTEM.md)

## 📋 Tipos

```typescript
// Pregunta y contexto
interface DebateOptions {
  question: string
  context: string
  maxRounds?: number
  agents?: Partial<Record<AgentKey, AgentOverride>>
  onProgress?: (update: DebateProgress) => void
}

// Resultado del debate
interface DebateResult {
  sessionId: string
  question: string
  messages: DebateMessage[]
  consensus: ConsensusResult
  rounds: number
  totalCost: number
}

// Consenso
interface ConsensusResult {
  hasConsensus: boolean
  consensusScore: number
  topOptions: RankedOption[]
  shouldContinue: boolean
  reasoning: string
}

// Opción rankeada
interface RankedOption {
  option: string
  successRate: number
  pros: string[]
  cons: string[]
  supporters: string[]
  confidence: number
}
```

## 🔧 Configuración

### Variables de Entorno

```bash
# APIs de IA (heredadas de @wallie/ai)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...

# Configuración de Forum (opcional)
FORUM_MAX_ROUNDS=20
FORUM_DEFAULT_MODEL=deepseek-chat
FORUM_ENABLE_ULTRA_OPTIMIZATION=true
```

### Contexto Base

El contexto base de Wallie se carga automáticamente desde `/docs/FORUM_CONTEXT.md`:

```typescript
// Carga automática del contexto de Wallie
const wallieContext = await loadWallieContext()

// Combinar con contexto específico de la pregunta
const fullContext = `${wallieContext}\n\n${customContext}`
```

## 🚀 Casos de Uso

### 1. Decisiones de Negocio

```typescript
const result = await runDebate({
  question: '¿Debo lanzar a 29€, 49€ o 79€?',
  context: 'Costos: $12/usuario, Competencia: $74-500/mes, 425 leads',
  maxRounds: 15,
})
```

### 2. Priorización de Features

```typescript
const result = await runDebate({
  question: '¿Qué feature construir primero: Forum, Voice, o Analytics?',
  context: await loadContext({
    question: '...',
    useRepo: true,
    repoPath: '/path/to/wallie',
  }),
  maxRounds: 10,
})
```

### 3. Estrategia de Marketing

```typescript
const result = await runDebate({
  question: '¿Qué headline usar en la landing?',
  context: 'Target: Inmobiliarias España, Pain: Leads perdidos, Value: Automatización WhatsApp',
  maxRounds: 8,
})
```

## 📚 Documentación Adicional

- [DYNAMIC_SYSTEM.md](./DYNAMIC_SYSTEM.md) - 🆕 Sistema dinámico de expertos
- [FORUM_CONTEXT.md](/docs/FORUM_CONTEXT.md) - Contexto base de Wallie
- [quoorum_use_cases_catalog.md](/home/ubuntu/quoorum_use_cases_catalog.md) - 115 casos de uso
- [CLAUDE.md](/CLAUDE.md) - Reglas de desarrollo

## 🤝 Contribución

Este package es parte del monorepo de Wallie y sigue las reglas de CLAUDE.md:

1. **Tests obligatorios:** Todo código nuevo debe tener tests (80%+ coverage)
2. **TypeScript estricto:** Sin `any`, sin `@ts-ignore`
3. **Commits atómicos:** Un commit = una feature/fix
4. **Backend first:** Lógica en backend, UI es presentación

## 📄 Licencia

Privado - Parte del proyecto Wallie

## 🔗 Links

- [Repositorio](https://github.com/arturoyo/Wallie)
- [Documentación Wallie](/)
- [CLAUDE.md](/CLAUDE.md)

---

**Versión:** 0.0.1  
**Autor:** Arturo  
**Última actualización:** 1 Enero 2025
