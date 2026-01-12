# Forum API Documentation

Complete API documentation for the Wallie Forum dynamic expert system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core API](#core-api)
3. [Dynamic Expert System](#dynamic-expert-system)
4. [Visualizations & Interactive](#visualizations--interactive)
5. [Learning & Optimization](#learning--optimization)
6. [Templates & Rate Limiting](#templates--rate-limiting)
7. [WebSocket Events](#websocket-events)
8. [Configuration](#configuration)
9. [Error Handling](#error-handling)

---

## Getting Started

### Installation

```bash
pnpm add @wallie/forum
```

### Basic Usage

```typescript
import { runDynamicDebate } from '@wallie/forum'

const result = await runDynamicDebate({
  sessionId: 'unique-session-id',
  question: '¿Debo lanzar Wallie a 29€, 49€ o 79€?',
  context: JSON.stringify({
    sources: [{ type: 'text', content: 'Context about Wallie...' }],
    constraints: ['Consider Spanish market', 'B2B SaaS'],
  }),
  mode: 'dynamic', // or 'static' or 'auto'
})

console.log(result.finalRanking) // Ranked options
console.log(result.consensusScore) // 0-100
```

---

## Core API

### `runDynamicDebate(options)`

Run a complete debate with dynamic expert selection.

**Parameters:**

```typescript
interface DynamicDebateOptions {
  sessionId: string
  question: string
  context?: string
  mode?: 'static' | 'dynamic' | 'auto'
  onRoundComplete?: (round: DebateRound) => Promise<void>
  onQualityCheck?: (quality: QualityAnalysis) => Promise<void>
  onIntervention?: (intervention: ModeratorIntervention) => Promise<void>
}
```

**Returns:**

```typescript
interface DebateResult {
  sessionId: string
  question: string
  rounds: DebateRound[]
  finalRanking: RankedOption[]
  consensusScore: number
  experts?: ExpertProfile[]
  qualityMetrics?: QualityAnalysis
  interventions?: ModeratorIntervention[]
}
```

**Example:**

```typescript
const result = await runDynamicDebate({
  sessionId: 'session-123',
  question: '¿Qué vertical atacar: Inmobiliarias, Seguros o Telecomunicaciones?',
  context: JSON.stringify({
    background: 'SaaS CRM for sales teams',
    constraints: ['Spanish market', 'B2B focus'],
  }),
  mode: 'dynamic',
  onRoundComplete: async (round) => {
    console.log(`Round ${round.number} complete`)
  },
})
```

---

## Dynamic Expert System

### Question Analysis

#### `analyzeQuestion(question, context?)`

Analyze a question to determine complexity, areas, and recommended experts.

```typescript
import { analyzeQuestion } from '@wallie/forum'

const analysis = await analyzeQuestion(
  '¿Debo lanzar Wallie a 29€, 49€ o 79€?',
  'SaaS B2B product for sales teams'
)

console.log(analysis.complexity) // 1-10
console.log(analysis.primaryAreas) // ['pricing', 'positioning']
console.log(analysis.recommendedExperts) // ['Patrick Campbell', 'Alex Hormozi', ...]
```

### Expert Matching

#### `matchExperts(analysis, options?)`

Match experts to a question based on analysis.

```typescript
import { matchExperts } from '@wallie/forum'

const matches = await matchExperts(analysis, {
  minScore: 30,
  maxExperts: 5,
  includeScores: true,
})

// matches: ExpertMatch[]
// { expert: ExpertProfile, score: 85, reasoning: '...' }
```

### Quality Monitoring

#### `analyzeDebateQuality(rounds, question)`

Analyze the quality of a debate.

```typescript
import { analyzeDebateQuality } from '@wallie/forum'

const quality = await analyzeDebateQuality(result.rounds, result.question)

console.log(quality.score) // 0-100
console.log(quality.depth) // 0-100
console.log(quality.diversity) // 0-100
console.log(quality.originality) // 0-100
console.log(quality.issues) // QualityIssue[]
```

### Meta-Moderator

#### `shouldIntervene(quality, round)`

Check if meta-moderator should intervene.

```typescript
import { shouldIntervene, generateIntervention } from '@wallie/forum'

if (shouldIntervene(quality, currentRound)) {
  const intervention = await generateIntervention(quality, rounds, question)
  console.log(intervention.type) // 'challenge_depth' | 'prevent_premature_consensus' | ...
  console.log(intervention.prompt) // Intervention message
}
```

---

## Visualizations & Interactive

### ASCII Dashboard

```typescript
import { visualizations } from '@wallie/forum'

const dashboard = visualizations.generateDashboard(result, {
  showProgress: true,
  showQuality: true,
  showExperts: true,
})

console.log(dashboard)
// ╔══════════════════════════════════════╗
// ║  WALLIE FORUM - DYNAMIC SYSTEM      ║
// ╠══════════════════════════════════════╣
// ║  Mode: 🧠 DYNAMIC                    ║
// ...
```

### Debate Visualization

```typescript
// Generate Mermaid diagram
const diagram = visualizations.generateFlowDiagram(result)

// Generate argument flow (Sankey)
const flow = omgVisuals.generateArgumentFlow(result)
```

### Interactive Replay

```typescript
import { interactive } from '@wallie/forum'

const replayer = interactive.createDebateReplayer(result)

// Control playback
replayer.play()
replayer.pause()
replayer.seek(roundNumber)
replayer.setSpeed(2.0)
```

---

## Learning & Optimization

### Expert Performance Tracking

```typescript
import { updateExpertPerformance, getExpertPerformance } from '@wallie/forum'

// Update after debate
await updateExpertPerformance('patrick-campbell', result)

// Get performance metrics
const metrics = await getExpertPerformance('patrick-campbell')
console.log(metrics.totalDebates)
console.log(metrics.avgQualityScore)
console.log(metrics.winRate)
```

### Question Similarity

```typescript
import { findSimilarDebates } from '@wallie/forum'

const similar = await findSimilarDebates(question, {
  limit: 5,
  minSimilarity: 0.7,
})

// similar: SimilarDebate[]
// { debate: DebateResult, similarity: 0.85, sharedTopics: [...] }
```

### Caching

```typescript
import { getCachedDebate, cacheDebate } from '@wallie/forum'

// Check cache before running debate
const cached = await getCachedDebate(question, context)
if (cached) {
  return cached
}

// Run debate and cache result
const result = await runDynamicDebate(...)
await cacheDebate(question, context, result)
```

---

## Templates & Rate Limiting

### Templates

```typescript
import { ALL_TEMPLATES, getTemplatesByIndustry, getTemplateById } from '@wallie/forum'

// Get all SaaS templates
const saasTemplates = getTemplatesByIndustry('SaaS')

// Use a template
const template = getTemplateById('saas-pricing')
const question = template.questionTemplate
  .replace('{product}', 'Wallie')
  .replace('{price1}', '29€')
  .replace('{price2}', '49€')
  .replace('{price3}', '79€')
```

### Rate Limiting

```typescript
import { checkRateLimit, incrementDebateCounter } from '@wallie/forum'

// Check before creating debate
const status = await checkRateLimit(userId, isPremium)
if (!status.allowed) {
  throw new Error(status.reason)
}

// Increment counter when debate starts
await incrementDebateCounter(userId)
```

---

## WebSocket Events

### Server Setup

```typescript
import { ForumWebSocketServer } from '@wallie/forum'

const wss = new ForumWebSocketServer({ port: 3001 })
wss.start()
```

### Client Connection

```typescript
const ws = new WebSocket('ws://localhost:3001')

ws.onmessage = (event) => {
  const update = JSON.parse(event.data)
  
  switch (update.type) {
    case 'round_complete':
      console.log('Round complete:', update.payload)
      break
    case 'quality_update':
      console.log('Quality update:', update.payload)
      break
    case 'intervention':
      console.log('Meta-moderator intervention:', update.payload)
      break
  }
}

// Subscribe to debate
ws.send(JSON.stringify({
  type: 'subscribe',
  debateId: 'debate-123',
}))
```

---

## Configuration

### Global Config

```typescript
import { getConfig, updateConfig, applyPreset } from '@wallie/forum'

// Get current config
const config = getConfig()

// Update config
updateConfig({
  complexityThreshold: 6,
  maxExpertsPerDebate: 7,
})

// Apply preset
applyPreset('premium') // 'economical' | 'balanced' | 'premium'
```

### Config Options

```typescript
interface ForumConfig {
  // Debate settings
  complexityThreshold: number // 1-10, default: 5
  maxAreasForStatic: number // default: 2
  maxExpertsPerDebate: number // default: 5
  minExpertsPerDebate: number // default: 3
  alwaysIncludeCritic: boolean // default: true
  
  // Quality monitoring
  qualityCheckInterval: number // rounds, default: 2
  minQualityScore: number // 0-100, default: 60
  interventionThreshold: number // 0-100, default: 50
  
  // Performance
  enableCaching: boolean // default: true
  cacheExpiry: number // seconds, default: 3600
  maxConcurrentDebates: number // default: 10
}
```

---

## Error Handling

### Validation Errors

```typescript
import { validateQuestionStrict, ValidationError } from '@wallie/forum'

try {
  validateQuestionStrict(question)
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message)
    console.error(error.suggestions) // Improvement suggestions
  }
}
```

### Rate Limit Errors

```typescript
const status = await checkRateLimit(userId)
if (!status.allowed) {
  throw new Error(`Rate limit exceeded: ${status.reason}. Retry after ${status.retryAfter}s`)
}
```

### Debate Errors

```typescript
try {
  const result = await runDynamicDebate(options)
} catch (error) {
  console.error('Debate failed:', error.message)
  // Handle error (retry, notify user, etc.)
}
```

---

## Advanced Usage

### Custom Expert Selection

```typescript
import { EXPERT_DATABASE, matchExperts } from '@wallie/forum'

// Get specific experts
const experts = getExpertsByIds(['patrick-campbell', 'alex-hormozi', 'april-dunford'])

// Or match based on custom criteria
const analysis = await analyzeQuestion(question)
const matches = await matchExperts(analysis, {
  minScore: 50,
  maxExperts: 3,
  preferredExpertise: ['pricing', 'positioning'],
})
```

### Custom Quality Metrics

```typescript
const quality = await analyzeDebateQuality(rounds, question)

// Custom intervention logic
if (quality.depth < 60 && quality.diversity < 50) {
  const intervention = await generateIntervention(quality, rounds, question)
  // Handle intervention...
}
```

### Export & Sharing

```typescript
import { generateDebatePDF, generateDebateMarkdown } from '@wallie/forum'

// Generate PDF
const pdfBuffer = await generateDebatePDF(result, {
  includeQualityMetrics: true,
  includeExpertProfiles: true,
})

// Generate Markdown
const markdown = await generateDebateMarkdown(result)
```

---

## Best Practices

1. **Always validate input** before running debates
2. **Check rate limits** to prevent abuse
3. **Use caching** for similar questions
4. **Monitor quality** in real-time with callbacks
5. **Handle errors gracefully** with try-catch
6. **Use templates** for common scenarios
7. **Enable WebSocket** for better UX
8. **Track expert performance** to improve matching
9. **Configure appropriately** for your use case
10. **Test thoroughly** before production

---

## Support

For issues, questions, or feature requests, visit:
- GitHub: https://github.com/arturoyo/Wallie
- Documentation: https://docs.wallie.ai/forum
