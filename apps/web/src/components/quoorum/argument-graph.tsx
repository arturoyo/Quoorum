'use client'

/**
 * Argument Graph Visualization
 * 
 * Visualización interactiva del árbol de argumentos como grafo usando react-flow.
 * Reemplaza la lista simple con un grafo interactivo que muestra relaciones entre argumentos.
 */

import { useMemo, useState, useCallback } from 'react'
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionMode,
  MarkerType,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Filter, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { Skeleton } from '@/components/ui/skeleton'
import type { ArgumentTree, ArgumentNode, ArgumentEdge } from '@quoorum/quoorum/argument-intelligence'

interface ArgumentGraphProps {
  debateId: string
}

/**
 * Convierte ArgumentTree a formato ReactFlow
 */
function convertToReactFlow(tree: ArgumentTree): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Create nodes with positions (force-directed layout will be handled by ReactFlow)
  tree.nodes.forEach((node, index) => {
    // Calculate position (temporary, ReactFlow will auto-layout)
    const angle = (index / tree.nodes.length) * 2 * Math.PI
    const radius = 200
    const x = Math.cos(angle) * radius + 400
    const y = Math.sin(angle) * radius + 300

    // Determine node color based on type
    const nodeColors = {
      premise: '#3b82f6', // Blue
      conclusion: '#8b5cf6', // Purple
      objection: '#ef4444', // Red
      support: '#10b981', // Green
    }

    const nodeColor = nodeColors[node.type] || '#6b7280'

    nodes.push({
      id: node.id,
      type: 'default',
      position: { x, y },
      data: {
        label: (
          <div className="p-2 min-w-[200px] max-w-[300px]">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                className={
                  node.type === 'premise'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : node.type === 'conclusion'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : node.type === 'objection'
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : 'bg-green-500/20 text-green-300 border-green-500/30'
                }
              >
                {node.type === 'premise'
                  ? 'Premisa'
                  : node.type === 'conclusion'
                    ? 'Conclusión'
                    : node.type === 'objection'
                      ? 'Objeción'
                      : 'Apoyo'}
              </Badge>
              <span className="text-xs styles.colors.text.tertiary">Ronda {node.round}</span>
            </div>
            <p className="text-sm styles.colors.text.primary mb-1 line-clamp-3">{node.content}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs styles.colors.text.secondary">{node.expert}</span>
              <span className="text-xs text-purple-400">
                {(node.strength * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ),
        node,
      },
      style: {
        background: `rgba(${parseInt(nodeColor.slice(1, 3), 16)}, ${parseInt(nodeColor.slice(3, 5), 16)}, ${parseInt(nodeColor.slice(5, 7), 16)}, 0.1)`,
        border: `2px solid ${nodeColor}`,
        borderRadius: '8px',
        color: '#ffffff',
        width: 'auto',
        minWidth: '200px',
      },
    })
  })

  // Create edges with different styles based on type
  tree.edges.forEach((edge) => {
    const edgeColors = {
      supports: '#10b981', // Green
      attacks: '#ef4444', // Red
      cites: '#3b82f6', // Blue
      agrees_with: '#8b5cf6', // Purple
      disagrees_with: '#f59e0b', // Amber
    }

    const edgeColor = edgeColors[edge.type] || '#6b7280'
    const isAttack = edge.type === 'attacks' || edge.type === 'disagrees_with'

    edges.push({
      id: `${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: edgeColor,
        strokeWidth: Math.max(2, edge.strength * 5),
        opacity: 0.6,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
      },
      label: edge.type === 'supports' ? 'apoya' : edge.type === 'attacks' ? 'ataca' : edge.type,
      labelStyle: {
        fill: edgeColor,
        fontWeight: 600,
        fontSize: '12px',
      },
      labelBgStyle: {
        fill: '#111b21',
        fillOpacity: 0.8,
      },
    })
  })

  return { nodes, edges }
}

export function ArgumentGraph({ debateId }: ArgumentGraphProps) {
  const { data: tree, isLoading } = api.debates.getArgumentTree.useQuery(
    { debateId },
    { enabled: !!debateId }
  )

  const [filterExpert, setFilterExpert] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [minStrength, setMinStrength] = useState<number>(0)

  // Get unique experts and types
  const experts = useMemo(() => {
    if (!tree) return []
    const filtered = tree.nodes.map((n) => n.expert).filter((e): e is string => typeof e === 'string' && !!e)
    return [...new Set(filtered)].sort()
  }, [tree]) as string[]

  // Filter and convert to ReactFlow format
  const { nodes, edges } = useMemo(() => {
    if (!tree) return { nodes: [], edges: [] }

    // Filter nodes
    const filteredNodes = tree.nodes.filter((node) => {
      if (filterExpert !== 'all' && node.expert !== filterExpert) return false
      if (filterType !== 'all' && node.type !== filterType) return false
      if (node.strength < minStrength) return false
      return true
    })

    // Filter edges (only include edges between filtered nodes)
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
    const filteredEdges = tree.edges.filter(
      (e) => filteredNodeIds.has(e.from) && filteredNodeIds.has(e.to)
    )

    // Create filtered tree
    const filteredTree: ArgumentTree = {
      ...tree,
      nodes: filteredNodes,
      edges: filteredEdges,
    }

    return convertToReactFlow(filteredTree)
  }, [tree, filterExpert, filterType, minStrength])

  const onNodesChange = useCallback(() => {
    // ReactFlow handles node changes automatically
  }, [])

  const onEdgesChange = useCallback(() => {
    // ReactFlow handles edge changes automatically
  }, [])

  if (isLoading) {
    return (
      <Card className="styles.colors.border.default styles.colors.bg.secondary">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary">Árbol de Argumentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full styles.colors.bg.tertiary" />
        </CardContent>
      </Card>
    )
  }

  // Don't render anything if there's no data
  if (!tree || tree.nodes.length === 0) {
    return null
  }

  return (
    <Card className="styles.colors.border.default styles.colors.bg.secondary">
      <CardHeader>
        <CardTitle className="styles.colors.text.primary">Grafo de Argumentos</CardTitle>
        <CardDescription className="styles.colors.text.secondary">
          Visualización interactiva de argumentos y sus relaciones ({tree.nodes.length} argumentos,{' '}
          {tree.edges.length} relaciones)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Select value={filterExpert} onValueChange={setFilterExpert}>
            <SelectTrigger className="w-[150px] styles.colors.bg.input styles.colors.border.default styles.colors.text.primary">
              <SelectValue placeholder="Experto" />
            </SelectTrigger>
            <SelectContent className="styles.colors.bg.secondary styles.colors.border.default">
              <SelectItem value="all" className="styles.colors.text.primary">
                Todos los expertos
              </SelectItem>
              {experts.map((expert) => (
                <SelectItem key={expert} value={expert} className="styles.colors.text.primary">
                  {expert}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px] styles.colors.bg.input styles.colors.border.default styles.colors.text.primary">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="styles.colors.bg.secondary styles.colors.border.default">
              <SelectItem value="all" className="styles.colors.text.primary">
                Todos los tipos
              </SelectItem>
              <SelectItem value="premise" className="styles.colors.text.primary">
                Premisas
              </SelectItem>
              <SelectItem value="conclusion" className="styles.colors.text.primary">
                Conclusiones
              </SelectItem>
              <SelectItem value="objection" className="styles.colors.text.primary">
                Objeciones
              </SelectItem>
              <SelectItem value="support" className="styles.colors.text.primary">
                Apoyos
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={minStrength.toString()}
            onValueChange={(v) => setMinStrength(parseFloat(v))}
          >
            <SelectTrigger className="w-[150px] styles.colors.bg.input styles.colors.border.default styles.colors.text.primary">
              <SelectValue placeholder="Fuerza mínima" />
            </SelectTrigger>
            <SelectContent className="styles.colors.bg.secondary styles.colors.border.default">
              <SelectItem value="0" className="styles.colors.text.primary">
                Todas
              </SelectItem>
              <SelectItem value="0.3" className="styles.colors.text.primary">
                ≥ 30%
              </SelectItem>
              <SelectItem value="0.5" className="styles.colors.text.primary">
                ≥ 50%
              </SelectItem>
              <SelectItem value="0.7" className="styles.colors.text.primary">
                ≥ 70%
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ReactFlow Graph */}
        <div className="h-[600px] w-full border styles.colors.border.default rounded-lg styles.colors.bg.primary">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{
              padding: 0.2,
              maxZoom: 1.5,
            }}
            nodeTypes={{}}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
            }}
            style={{
              background: '#0b141a',
            }}
          >
            <Background color="#2a3942" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const nodeData = node.data?.node as ArgumentNode | undefined
                if (!nodeData) return '#6b7280'
                const colors = {
                  premise: '#3b82f6',
                  conclusion: '#8b5cf6',
                  objection: '#ef4444',
                  support: '#10b981',
                }
                return colors[nodeData.type] || '#6b7280'
              }}
              maskColor="rgba(11, 20, 26, 0.6)"
              style={{
                backgroundColor: '#111b21',
                border: '1px solid #2a3942',
              }}
            />
            <Panel position="top-right" className="styles.colors.bg.secondary border styles.colors.border.default rounded p-2">
              <div className="text-xs styles.colors.text.secondary space-y-1">
                <div>Nodos: {nodes.length}</div>
                <div>Relaciones: {edges.length}</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 rounded-lg border styles.colors.border.default styles.colors.bg.tertiary">
          <p className="text-sm font-semibold styles.colors.text.primary mb-2">Leyenda:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/30"></div>
              <span className="styles.colors.text.secondary">Premisa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500/20 border border-purple-500/30"></div>
              <span className="styles.colors.text.secondary">Conclusión</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
              <span className="styles.colors.text.secondary">Objeción</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
              <span className="styles.colors.text.secondary">Apoyo</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t styles.colors.border.default">
            <p className="text-xs styles.colors.text.tertiary">
              💡 Arrastra los nodos para reorganizar el grafo. Usa los controles para zoom y pan.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
