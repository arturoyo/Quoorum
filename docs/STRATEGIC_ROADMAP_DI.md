# 🎯 Hoja de Ruta Estratégica: Decision Intelligence Platform

> **Fecha:** 24 Ene 2026  
> **Basado en:** Análisis de ChatGPT + Biblia de Inteligencia Competitiva  
> **Objetivo:** Transformar Quoorum de SDP a DI Platform manteniendo la ventaja competitiva en deliberación

---

## 📊 Resumen Ejecutivo

**Posicionamiento Actualizado:**
- **Categoría Principal:** Decision Intelligence Platform (DI)
- **Killer Feature:** Strategic Deliberation (nuestra diferenciación)
- **Mercado Objetivo:** C-Suite, Directores de Riesgo, Enterprise

**Ventaja Competitiva:**
- Los DI tradicionales son *data-first* (Aera, FICO)
- Quoorum es *deliberation-first* con trazabilidad completa
- Único DI con visualización de argumentos como grafo

---

## 🔴 Prioridades Críticas (Q1 2026)

### 1. iMAD (Intelligent Multi-Agent Debate Trigger) - **CRÍTICA**

**Justificación:** Control de costes. Los debates pueden consumir miles de tokens sin límite.

**Objetivo:** Sistema que detiene automáticamente el debate cuando:
- Se alcanza consenso suficiente (≥70%)
- El costo acumulado supera un umbral configurable
- No hay progreso en N rondas consecutivas

**Implementación:**
```typescript
// packages/quoorum/src/cost-control/imad.ts
interface IMADConfig {
  maxCostUsd: number // Límite de costo por debate
  consensusThreshold: number // 0.7 = 70%
  stagnationRounds: number // Rondas sin progreso antes de detener
  minRounds: number // Mínimo de rondas antes de aplicar límites
}

export function shouldStopDebate(
  debate: DebateResult,
  config: IMADConfig
): { shouldStop: boolean; reason: string }
```

**Impacto:**
- ✅ Reduce costes en 40-60% (debates que se detienen antes)
- ✅ Mejora UX (no esperar 20 rondas cuando ya hay consenso)
- ✅ Habilitador para planes freemium

---

### 2. Decision Evidence Engine (Certificado de Gobernanza) - **ALTA**

**Justificación:** Habilitador Enterprise. Trazabilidad legal y auditoría requerida por regulaciones.

**Objetivo:** Generar certificado inmutable con:
- Hash SHA-256 de integridad del debate
- Timestamp notarizado
- Mapeo a estándares (ISO 27001, NIST CSF)
- Audit trail completo

**Implementación:**
```typescript
// packages/quoorum/src/governance/decision-evidence.ts
interface DecisionEvidence {
  debateId: string
  timestamp: Date
  integrityHash: string // SHA-256 del debate completo
  participants: string[] // Expertos involucrados
  methodology: string // "Multi-Agent Deliberation"
  compliance: {
    iso27001: boolean
    nistCsf: boolean
    gdpr: boolean
  }
  auditTrail: AuditEvent[]
}

export async function generateDecisionEvidence(
  debate: DebateResult
): Promise<DecisionEvidence>
```

**Impacto:**
- ✅ Desbloquea mercado Enterprise (requisito de compliance)
- ✅ Diferencia vs competidores (solo Quoorum tiene trazabilidad de deliberación)
- ✅ Valor legal: certificado admisible en auditorías

---

### 3. Argument Intelligence Engine (Grafo Interactivo) - **ALTA**

**Justificación:** Core DI. Visualización de complejidad del debate como grafo de argumentos.

**Estado Actual:** ✅ Backend implementado, ❌ Visualización es lista simple

**Objetivo:** Reemplazar lista por grafo interactivo con:
- Nodos = Argumentos (premisas, conclusiones, objeciones)
- Aristas = Relaciones (apoya, ataca, cita)
- Filtros interactivos (por experto, tipo, fuerza)
- Layout automático (force-directed graph)

**Implementación:**
```typescript
// apps/web/src/components/quoorum/argument-graph.tsx
import ReactFlow, { Node, Edge } from 'react-flow-renderer'

// Instalar: pnpm add react-flow-renderer
// Convertir ArgumentTree a formato ReactFlow
function convertToReactFlow(tree: ArgumentTree): { nodes: Node[], edges: Edge[] }
```

**Impacto:**
- ✅ Diferencia visual clara vs competidores
- ✅ Mejora comprensión del debate (grafo > lista)
- ✅ Valor estratégico: "Decision Graph" como los DI Enterprise

---

## 🟡 Prioridades Medias (Q2 2026)

### 4. Sistemas de Votación Avanzados

**Justificación:** Metodología. Añade opciones de cierre del debate más sofisticadas.

**Opciones:**
- **Votación Cuadrática:** Cada experto tiene puntos limitados, puede "apostar fuerte" por opciones
- **Votación por Puntos:** Asignación de puntos a múltiples opciones
- **Consenso Actual:** Mantener como default

**Implementación:**
```typescript
// packages/quoorum/src/voting/quadratic-voting.ts
export function calculateQuadraticVote(
  votes: Map<string, number>, // expertId -> points allocated
  options: string[]
): RankedOption[]
```

---

### 5. Integración Nativa Slack/Teams

**Justificación:** DaaS (Decision-as-a-Service). Llevar el debate al flujo de trabajo del usuario.

**Objetivo:** Bot de Slack/Teams que:
- Crea debates desde mensajes
- Notifica progreso en tiempo real
- Muestra resultados en canales

**Impacto:**
- ✅ Adopción orgánica (no requiere cambiar de herramienta)
- ✅ Viralidad (otros ven el debate en Slack)
- ✅ DaaS completo (API + Integración)

---

## 📝 Estrategia de Marketing (Copywriting)

### Headlines Actualizados

| Categoría | Pain Point | Headline Sugerido |
|-----------|------------|-------------------|
| **Strategic Planning** | La estrategia se queda en PowerPoint | **"De PowerPoint a Decisión Ejecutable. Quoorum es tu DI para la Estrategia."** |
| **AI Governance** | El riesgo de sesgo en las decisiones es incalculable | **"Mitiga el Riesgo Cognitivo. El Único DI con Trazabilidad de Deliberación."** |
| **Collaborative Governance** | Las reuniones son lentas y dominadas por jerarquías | **"Consenso en Minutos, No en Semanas. Deliberación Estratégica sin Sesgos."** |

### Landing Page Updates

**Sección Hero:**
```
Título: "Decision Intelligence para Estrategia"
Subtítulo: "La única plataforma DI que visualiza la deliberación como un grafo de argumentos. Trazabilidad completa, consenso en minutos."
CTA: "Comenzar Debate Estratégico"
```

**Sección Diferenciación:**
```
"¿Por qué Quoorum vs Aera/FICO?"
- Aera/FICO: Decision Intelligence basado en datos
- Quoorum: Decision Intelligence basado en deliberación
- Visualización única: Grafo de argumentos interactivo
- Certificado de Gobernanza: Trazabilidad legal completa
```

---

## 🚀 Plan de Implementación (Sprint 1-4)

### Sprint 1 (Semana 1-2): iMAD
- [ ] Implementar `imad.ts` en `packages/quoorum/src/cost-control/`
- [ ] Integrar en `runner-dynamic.ts`
- [ ] Añadir configuración en UI (settings)
- [ ] Tests unitarios

### Sprint 2 (Semana 3-4): Decision Evidence Engine
- [ ] Implementar `decision-evidence.ts` en `packages/quoorum/src/governance/`
- [ ] Endpoint tRPC `debates.getEvidence`
- [ ] Componente UI para descargar certificado
- [ ] Tests de integridad (hash verification)

### Sprint 3 (Semana 5-6): Argument Graph Visualization
- [ ] Instalar `react-flow-renderer`
- [ ] Crear `argument-graph.tsx` (reemplazar lista)
- [ ] Layout force-directed
- [ ] Filtros interactivos
- [ ] Tests visuales

### Sprint 4 (Semana 7-8): Voting Systems
- [ ] Implementar votación cuadrática
- [ ] UI para seleccionar método de votación
- [ ] Integración en fase de cierre
- [ ] Tests de algoritmos

---

## 📊 Métricas de Éxito

| Métrica | Baseline | Objetivo Q1 | Objetivo Q2 |
|---------|----------|-------------|-------------|
| **Costo promedio por debate** | $2.50 | $1.50 (iMAD) | $1.00 |
| **Tiempo promedio a consenso** | 15 min | 10 min (iMAD) | 8 min |
| **Adopción Enterprise** | 0% | 5% (Evidence Engine) | 15% |
| **Engagement con visualizaciones** | 20% | 40% (Graph) | 60% |

---

## 🎯 Conclusión

El análisis de ChatGPT confirma que nuestra arquitectura de deliberación es única, pero debemos envolverla en el lenguaje y funcionalidades de una **Decision Intelligence Platform** para capturar el mercado Enterprise.

**Camino claro:**
1. **iMAD** → Rentabilidad (control de costes)
2. **Decision Evidence Engine** → Gobernanza (compliance Enterprise)
3. **AIE Graph** → Diferenciación visual (grafo de argumentos)

**Mantra:** "Quoorum es el único Decision Intelligence Platform que visualiza la deliberación como un grafo de argumentos con trazabilidad legal completa."

---

_Última actualización: 24 Ene 2026_
