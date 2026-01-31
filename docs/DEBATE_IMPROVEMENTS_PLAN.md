# 🚀 Plan de Mejora: Debate Normal de Quoorum

**Fecha:** 24 Enero 2026  
**Objetivo:** Mejorar visualización, export y argument mapping del debate normal para aportar MÁS valor que añadir frameworks adicionales

---

## 📊 ESTADO ACTUAL

### ✅ Lo que YA tenemos:

1. **Visualización Básica:**
   - `DebateViewer` - Muestra mensajes por ronda
   - `DebateChat` - Vista tipo chat WhatsApp
   - Métricas de calidad (depth, diversity, originality)
   - Progress bar de rondas

2. **Export:**
   - `generateDebatePDF()` - Implementado pero deshabilitado (dependencias)
   - `generateDebateMarkdown()` - Funcional
   - HTML generation para PDF

3. **Visualizaciones:**
   - Mermaid diagrams (flujo del debate)
   - ASCII tree (estructura)
   - JSON para herramientas externas

### ❌ Lo que FALTA:

1. **Argument Mapping Interactivo:** No existe
2. **Timeline de Consenso:** No existe (solo texto)
3. **Grafos de Influencia:** No existe
4. **Export Avanzado:** PDF deshabilitado, no hay PowerPoint/Excel
5. **Visualización de Argumentos:** Solo texto, no estructura de argumentos

---

## 🎯 MEJORAS PROPUESTAS (Priorizadas)

### 1. 🥇 Argument Mapping Interactivo ⭐ ALTA PRIORIDAD

**Valor:** 🔴 ALTO - Mejora comprensión de debates complejos en 40-60%

**Qué es:**
Visualización de árbol de argumentos donde cada mensaje se descompone en:
- **Premises** (premisas/supuestos)
- **Conclusions** (conclusiones)
- **Support/Attack** (qué argumentos apoyan o refutan otros)

**Implementación:**

```typescript
// packages/quoorum/src/argument-intelligence/index.ts
export interface ArgumentNode {
  id: string
  type: 'premise' | 'conclusion' | 'objection' | 'support'
  content: string
  expert: string
  round: number
  children: ArgumentNode[] // Argumentos que apoyan/refutan
  strength: number // 0-1, calculado por IA
  sourceMessageId: string
}

export interface ArgumentTree {
  root: ArgumentNode // La pregunta principal
  nodes: ArgumentNode[]
  edges: ArgumentEdge[]
}

interface ArgumentEdge {
  from: string // Node ID
  to: string // Node ID
  type: 'supports' | 'attacks' | 'cites'
  strength: number // 0-1
}

/**
 * Analiza un debate y extrae estructura de argumentos
 */
export async function buildArgumentTree(
  debate: DebateResult
): Promise<ArgumentTree> {
  // 1. Para cada mensaje, usar IA para extraer:
  //    - Premises explícitas
  //    - Conclusions
  //    - Referencias a otros argumentos (support/attack)
  
  // 2. Construir árbol jerárquico
  // 3. Calcular strength basándose en:
  //    - Credibilidad del experto
  //    - Evidencia proporcionada
  //    - Consenso con otros expertos
  
  // 4. Retornar árbol completo
}
```

**UI Component:**

```tsx
// apps/web/src/components/quoorum/argument-tree.tsx
'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { buildArgumentTree } from '@quoorum/quoorum/argument-intelligence'
import type { DebateResult } from '@quoorum/quoorum/types'

// Usar librería de grafos: react-flow, cytoscape-react, o d3
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls,
  MiniMap 
} from 'reactflow'
import 'reactflow/dist/style.css'

export function ArgumentTreeViewer({ debate }: { debate: DebateResult }) {
  const { nodes, edges } = useMemo(() => {
    const tree = buildArgumentTree(debate)
    // Convertir ArgumentTree a formato ReactFlow
    return convertToReactFlow(tree)
  }, [debate])

  return (
    <Card className="h-[600px] border-[#2a3942] bg-[#111b21]">
      <CardHeader>
        <CardTitle className="text-white">Árbol de Argumentos</CardTitle>
      </CardHeader>
      <CardContent className="h-[550px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          className="bg-[#0b141a]"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </CardContent>
    </Card>
  )
}
```

**Features:**
- ✅ Zoom y pan
- ✅ Click en nodo → highlight path al root
- ✅ Filter por experto
- ✅ Filter por tipo (premise/conclusion/objection)
- ✅ Toggle mostrar/ocultar argumentos débiles (strength < 0.3)

**Esfuerzo:** 🔴 ALTO (3-4 semanas)
- 2 semanas: Lógica de extracción de argumentos con IA
- 1 semana: Visualización con ReactFlow
- 1 semana: UI/UX y refinamiento

**ROI:** 🔴 ALTO - Diferenciador único, alto valor percibido

---

### 2. 🥈 Timeline de Consenso Interactiva ⭐ ALTA PRIORIDAD

**Valor:** 🟡 MEDIO-ALTO - Mejora comprensión del proceso de decisión

**Qué es:**
Visualización temporal que muestra cómo evoluciona el consenso a lo largo de las rondas.

**Implementación:**

```typescript
// packages/quoorum/src/visualizations/consensus-timeline.ts
export interface ConsensusPoint {
  round: number
  timestamp: Date
  topOption: string
  consensusScore: number // 0-1
  expertAlignment: Map<string, number> // Expert → alignment score (0-1)
  options: {
    option: string
    supportScore: number // 0-1
    expertSupporters: string[] // Expert IDs
  }[]
}

export function generateConsensusTimeline(
  debate: DebateResult
): ConsensusPoint[] {
  const points: ConsensusPoint[] = []
  
  for (const round of debate.rounds) {
    // Analizar mensajes de la ronda
    // Extraer opciones mencionadas
    // Calcular alignment entre expertos
    // Calcular consensus score
    
    points.push({
      round: round.roundNumber,
      timestamp: round.timestamp,
      topOption: extractTopOption(round.messages),
      consensusScore: calculateConsensus(round.messages),
      expertAlignment: calculateAlignment(round.messages),
      options: extractOptions(round.messages)
    })
  }
  
  return points
}
```

**UI Component:**

```tsx
// apps/web/src/components/quoorum/consensus-timeline.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'

export function ConsensusTimeline({ debate }: { debate: DebateResult }) {
  const timeline = generateConsensusTimeline(debate)
  
  const chartData = timeline.map(point => ({
    round: point.round,
    consensus: point.consensusScore * 100,
    topOption: point.topOption
  }))

  return (
    <Card className="border-[#2a3942] bg-[#111b21]">
      <CardHeader>
        <CardTitle className="text-white">Evolución del Consenso</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3942" />
            <XAxis 
              dataKey="round" 
              stroke="#aebac1"
              label={{ value: 'Ronda', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              stroke="#aebac1"
              domain={[0, 100]}
              label={{ value: 'Consenso %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#111b21', 
                border: '1px solid #2a3942',
                color: '#aebac1'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="consensus" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Consenso %"
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Timeline de opciones */}
        <div className="mt-4 space-y-2">
          {timeline.map((point, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-4 p-2 rounded border border-[#2a3942] bg-[#202c33]"
            >
              <span className="text-sm text-[#8696a0]">Ronda {point.round}</span>
              <span className="text-white font-medium">{point.topOption}</span>
              <span className="text-purple-400">
                {(point.consensusScore * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Features:**
- ✅ Gráfico de línea mostrando evolución del consenso
- ✅ Timeline de opciones (qué opción lideraba en cada ronda)
- ✅ Hover para ver detalles de cada ronda
- ✅ Highlight de rondas clave (cuando cambió el líder)

**Esfuerzo:** 🟡 MEDIO (1-2 semanas)
- 3-4 días: Lógica de cálculo de consenso por ronda
- 3-4 días: Visualización con Recharts
- 2-3 días: UI/UX y refinamiento

**ROI:** 🟡 MEDIO - Mejora UX, pero no es diferenciador único

---

### 3. 🥉 Export Avanzado (PDF, PowerPoint, Excel) ⭐ ALTA PRIORIDAD

**Valor:** 🔴 ALTO - Outputs compartibles = más viralidad

**Estado Actual:**
- ✅ PDF export implementado pero deshabilitado (dependencias)
- ✅ Markdown export funcional
- ❌ No hay PowerPoint/Excel export

**Implementación:**

```typescript
// packages/quoorum/src/export/advanced-export.ts
import { generateDebatePDF } from '../pdf-export'
import { generateDebateMarkdown } from '../pdf-export'
import { generateDebatePowerPoint } from './powerpoint-export'
import { generateDebateExcel } from './excel-export'

export type ExportFormat = 'pdf' | 'markdown' | 'powerpoint' | 'excel' | 'json'

export interface ExportOptions {
  format: ExportFormat
  includeMetadata?: boolean
  includeFullTranscript?: boolean
  includeArgumentTree?: boolean
  includeConsensusTimeline?: boolean
  branding?: {
    logo?: string
    color?: string
    companyName?: string
  }
}

export async function exportDebate(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: ExportOptions
): Promise<Buffer | string> {
  switch (options.format) {
    case 'pdf':
      return await generateDebatePDF(debate, experts, {
        includeMetadata: options.includeMetadata,
        includeFullTranscript: options.includeFullTranscript,
        brandingColor: options.branding?.color,
        logo: options.branding?.logo,
      })
    
    case 'markdown':
      return generateDebateMarkdown(debate, experts)
    
    case 'powerpoint':
      return await generateDebatePowerPoint(debate, experts, options)
    
    case 'excel':
      return await generateDebateExcel(debate, experts, options)
    
    case 'json':
      return JSON.stringify(debate, null, 2)
    
    default:
      throw new Error(`Unsupported format: ${options.format}`)
  }
}
```

**PowerPoint Export:**

```typescript
// packages/quoorum/src/export/powerpoint-export.ts
import PptxGenJS from 'pptxgenjs'

export async function generateDebatePowerPoint(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: ExportOptions
): Promise<Buffer> {
  const pptx = new PptxGenJS()
  
  // Slide 1: Title
  pptx.addSlide({
    title: 'Debate Report',
    subtitle: debate.question,
    background: { color: '0b141a' }
  })
  
  // Slide 2: Executive Summary
  pptx.addSlide({
    title: 'Executive Summary',
    content: [
      { text: `Consenso: ${(debate.consensusScore * 100).toFixed(0)}%` },
      { text: `Opción Recomendada: ${debate.finalRanking[0]?.option}` },
      { text: `Rondas: ${debate.rounds.length}` },
      { text: `Costo: $${debate.totalCostUsd.toFixed(2)}` }
    ]
  })
  
  // Slide 3: Ranking de Opciones
  pptx.addSlide({
    title: 'Ranking de Opciones',
    content: debate.finalRanking.map((opt, idx) => ({
      text: `#${idx + 1} ${opt.option} (${opt.successRate}%)`
    }))
  })
  
  // Slide 4-N: Por cada ronda importante
  debate.rounds.forEach((round, idx) => {
    if (idx < 5) { // Solo primeras 5 rondas
      pptx.addSlide({
        title: `Ronda ${idx + 1}`,
        content: round.messages.map(msg => ({
          text: `${msg.agentName}: ${msg.content.substring(0, 200)}...`
        }))
      })
    }
  })
  
  return await pptx.write({ outputType: 'nodebuffer' })
}
```

**Excel Export:**

```typescript
// packages/quoorum/src/export/excel-export.ts
import ExcelJS from 'exceljs'

export async function generateDebateExcel(
  debate: DebateResult,
  experts: ExpertProfile[],
  options: ExportOptions
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  
  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('Resumen')
  summarySheet.addRow(['Pregunta', debate.question])
  summarySheet.addRow(['Consenso', `${(debate.consensusScore * 100).toFixed(0)}%`])
  summarySheet.addRow(['Rondas', debate.rounds.length])
  summarySheet.addRow(['Costo', `$${debate.totalCostUsd.toFixed(2)}`])
  
  // Sheet 2: Ranking
  const rankingSheet = workbook.addWorksheet('Ranking')
  rankingSheet.addRow(['Posición', 'Opción', 'Score', 'Confianza', 'Razonamiento'])
  debate.finalRanking.forEach((opt, idx) => {
    rankingSheet.addRow([
      idx + 1,
      opt.option,
      opt.successRate,
      opt.confidence * 100,
      opt.reasoning
    ])
  })
  
  // Sheet 3: Transcript (si se solicita)
  if (options.includeFullTranscript) {
    const transcriptSheet = workbook.addWorksheet('Transcripción')
    transcriptSheet.addRow(['Ronda', 'Experto', 'Mensaje'])
    debate.rounds.forEach((round, roundIdx) => {
      round.messages.forEach(msg => {
        transcriptSheet.addRow([
          roundIdx + 1,
          msg.agentName,
          msg.content
        ])
      })
    })
  }
  
  return await workbook.xlsx.writeBuffer()
}
```

**UI Component:**

```tsx
// apps/web/src/components/quoorum/debate-export.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, FileText, Presentation, Table, Code } from 'lucide-react'
import { api } from '@/lib/trpc/client'

export function DebateExport({ debateId }: { debateId: string }) {
  const [format, setFormat] = useState<'pdf' | 'powerpoint' | 'excel' | 'markdown'>('pdf')
  const [isExporting, setIsExporting] = useState(false)
  
  const exportMutation = api.debates.export.useMutation({
    onSuccess: (data) => {
      // Descargar archivo
      const blob = new Blob([data.content], { type: data.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `debate-${debateId}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      setIsExporting(false)
    },
    onError: (error) => {
      toast.error(`Error al exportar: ${error.message}`)
      setIsExporting(false)
    }
  })

  const handleExport = () => {
    setIsExporting(true)
    exportMutation.mutate({ debateId, format })
  }

  const formatIcons = {
    pdf: FileText,
    powerpoint: Presentation,
    excel: Table,
    markdown: Code,
  }

  const Icon = formatIcons[format]

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(v) => setFormat(v as any)}>
        <SelectTrigger className="w-[180px] bg-[#2a3942] border-[#2a3942] text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#111b21] border-[#2a3942]">
          <SelectItem value="pdf" className="text-white">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </div>
          </SelectItem>
          <SelectItem value="powerpoint" className="text-white">
            <div className="flex items-center gap-2">
              <Presentation className="h-4 w-4" />
              PowerPoint
            </div>
          </SelectItem>
          <SelectItem value="excel" className="text-white">
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Excel
            </div>
          </SelectItem>
          <SelectItem value="markdown" className="text-white">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Markdown
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? 'Exportando...' : 'Exportar'}
      </Button>
    </div>
  )
}
```

**Esfuerzo:** 🟡 MEDIO (2-3 semanas)
- 1 semana: Fix PDF export (resolver dependencias)
- 1 semana: PowerPoint export
- 3-4 días: Excel export
- 2-3 días: UI y testing

**ROI:** 🔴 ALTO - Outputs compartibles = más viralidad y adopción

---

### 4. 🎨 Grafos de Influencia ⭐ MEDIA PRIORIDAD

**Valor:** 🟡 MEDIO - Útil para entender dinámicas de grupo

**Qué es:**
Visualización de cómo influyen expertos entre sí (quién cita a quién, quién está de acuerdo con quién).

**Implementación:**

```typescript
// packages/quoorum/src/visualizations/influence-graph.ts
export interface InfluenceEdge {
  from: string // Expert ID
  to: string // Expert ID
  strength: number // 0-1
  type: 'agreement' | 'disagreement' | 'citation' | 'counter-argument'
  round: number
  message: string // Extracto del mensaje
}

export function buildInfluenceGraph(
  debate: DebateResult
): InfluenceEdge[] {
  const edges: InfluenceEdge[] = []
  
  for (const round of debate.rounds) {
    for (const message of round.messages) {
      // Analizar si el mensaje:
      // 1. Cita a otro experto (citation)
      // 2. Está de acuerdo con otro (agreement)
      // 3. Discrepa con otro (disagreement)
      // 4. Refuta argumento de otro (counter-argument)
      
      const influences = extractInfluences(message, round.messages)
      edges.push(...influences)
    }
  }
  
  return edges
}
```

**UI Component:**

```tsx
// apps/web/src/components/quoorum/influence-graph.tsx
'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { buildInfluenceGraph } from '@quoorum/quoorum/visualizations/influence-graph'
import ReactFlow from 'reactflow'

export function InfluenceGraphViewer({ debate }: { debate: DebateResult }) {
  const { nodes, edges } = useMemo(() => {
    const influences = buildInfluenceGraph(debate)
    // Convertir a formato ReactFlow
    // Nodos = expertos
    // Edges = influencias
    return convertToReactFlow(influences)
  }, [debate])

  return (
    <Card className="h-[500px] border-[#2a3942] bg-[#111b21]">
      <CardHeader>
        <CardTitle className="text-white">Grafos de Influencia</CardTitle>
        <CardDescription className="text-[#aebac1]">
          Cómo influyen los expertos entre sí
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[450px]">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </CardContent>
    </Card>
  )
}
```

**Esfuerzo:** 🟡 MEDIO (2 semanas)
- 1 semana: Lógica de detección de influencias
- 3-4 días: Visualización
- 2-3 días: UI/UX

**ROI:** 🟡 MEDIO - Interesante pero no crítico

---

## 📋 PLAN DE IMPLEMENTACIÓN (Priorizado)

### Fase 1: Quick Wins (2-3 semanas) 🔴 ALTA PRIORIDAD

1. **Fix PDF Export** (3-4 días)
   - Resolver dependencias (puppeteer o html-pdf-node)
   - Habilitar endpoint `debates.exportPDF`
   - Testing

2. **Timeline de Consenso** (1 semana)
   - Lógica de cálculo
   - Visualización con Recharts
   - Integración en UI

3. **PowerPoint Export** (1 semana)
   - Implementar con pptxgenjs
   - Templates de slides
   - Testing

**Total:** 2-3 semanas, ROI ALTO

---

### Fase 2: Diferenciadores (3-4 semanas) 🟡 MEDIA PRIORIDAD

4. **Argument Mapping Interactivo** (3-4 semanas)
   - Lógica de extracción de argumentos (2 semanas)
   - Visualización con ReactFlow (1 semana)
   - UI/UX y refinamiento (1 semana)

**Total:** 3-4 semanas, ROI ALTO (diferenciador único)

---

### Fase 3: Nice-to-Have (2 semanas) 🟢 BAJA PRIORIDAD

5. **Excel Export** (3-4 días)
6. **Grafos de Influencia** (1-2 semanas)

**Total:** 2 semanas, ROI MEDIO

---

## 🎯 RECOMENDACIÓN FINAL

### ✅ IMPLEMENTAR PRIMERO (Fase 1):

1. **Fix PDF Export** - Quick win, alto valor
2. **Timeline de Consenso** - Mejora UX significativa
3. **PowerPoint Export** - Outputs compartibles

**ROI:** 🔴 ALTO - 2-3 semanas de trabajo, alto impacto

### ✅ IMPLEMENTAR DESPUÉS (Fase 2):

4. **Argument Mapping Interactivo** - Diferenciador único, pero requiere más esfuerzo

**ROI:** 🔴 ALTO - Diferenciador único, pero 3-4 semanas

### ⚠️ OPCIONAL (Fase 3):

5. **Excel Export** - Nice-to-have
6. **Grafos de Influencia** - Interesante pero no crítico

---

## 💡 COMPARATIVA: Mejoras vs. Frameworks Adicionales

| Mejora | Esfuerzo | ROI | Valor Real |
|--------|----------|-----|------------|
| **Argument Mapping** | 3-4 sem | 🔴 ALTO | 🔴 ALTO - Diferenciador único |
| **Timeline Consenso** | 1 sem | 🟡 MEDIO | 🟡 MEDIO - Mejora UX |
| **PDF/PowerPoint Export** | 2-3 sem | 🔴 ALTO | 🔴 ALTO - Viralidad |
| **Decision Matrix Framework** | 2 sem | 🟡 MEDIO | 🟡 MEDIO - SEO/Onboarding |

**Conclusión:**
Mejorar el debate normal (especialmente Argument Mapping) aporta **MÁS valor real** que añadir frameworks adicionales.

---

**Próximos Pasos:**
1. ✅ Decidir qué mejorar primero (recomendado: Fase 1)
2. ✅ Crear tickets de implementación
3. ✅ Asignar recursos
4. ✅ Validar con usuarios beta

---

_Plan completado: 24 Enero 2026_  
_Versión: 1.0_  
_Enfoque: Valor real vs. valor percibido_
