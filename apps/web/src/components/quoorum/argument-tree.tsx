'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { api } from '@/lib/trpc/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter } from 'lucide-react'

interface ArgumentTreeProps {
  debateId: string
}

/**
 * Argument Tree Viewer
 * 
 * Visualización interactiva del árbol de argumentos de un debate.
 * 
 * Note: This uses a simple node-based visualization. For production,
 * consider using react-flow or cytoscape-react for interactive graphs.
 */
export function ArgumentTreeViewer({ debateId }: ArgumentTreeProps) {
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
    return [...new Set(tree.nodes.map((n) => n.expert))].sort()
  }, [tree])

  // Filter nodes
  const filteredNodes = useMemo(() => {
    if (!tree) return []
    return tree.nodes.filter((node) => {
      if (filterExpert !== 'all' && node.expert !== filterExpert) return false
      if (filterType !== 'all' && node.type !== filterType) return false
      if (node.strength < minStrength) return false
      return true
    })
  }, [tree, filterExpert, filterType, minStrength])

  if (isLoading) {
    return (
      <Card className="border-[#2a3942] bg-[#111b21]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Árbol de Argumentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full bg-[#202c33]" />
        </CardContent>
      </Card>
    )
  }

  if (!tree || tree.nodes.length === 0) {
    return (
      <Card className="border-[#2a3942] bg-[#111b21]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Árbol de Argumentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#aebac1]">No se pudieron extraer argumentos de este debate.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#2a3942] bg-[#111b21]">
      <CardHeader>
        <CardTitle className="text-[var(--theme-text-primary)]">Árbol de Argumentos</CardTitle>
        <CardDescription className="text-[#aebac1]">
          Estructura de argumentos y sus relaciones ({tree.nodes.length} argumentos,{' '}
          {tree.edges.length} relaciones)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Select value={filterExpert} onValueChange={setFilterExpert}>
            <SelectTrigger className="w-[150px] bg-[#2a3942] border-[#2a3942] text-[var(--theme-text-primary)]">
              <SelectValue placeholder="Experto" />
            </SelectTrigger>
            <SelectContent className="bg-[#111b21] border-[#2a3942]">
              <SelectItem value="all" className="text-[var(--theme-text-primary)]">
                Todos los expertos
              </SelectItem>
              {experts.map((expert) => (
                <SelectItem key={expert} value={expert} className="text-[var(--theme-text-primary)]">
                  {expert}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px] bg-[#2a3942] border-[#2a3942] text-[var(--theme-text-primary)]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-[#111b21] border-[#2a3942]">
              <SelectItem value="all" className="text-[var(--theme-text-primary)]">
                Todos los tipos
              </SelectItem>
              <SelectItem value="premise" className="text-[var(--theme-text-primary)]">
                Premisas
              </SelectItem>
              <SelectItem value="conclusion" className="text-[var(--theme-text-primary)]">
                Conclusiones
              </SelectItem>
              <SelectItem value="objection" className="text-[var(--theme-text-primary)]">
                Objeciones
              </SelectItem>
              <SelectItem value="support" className="text-[var(--theme-text-primary)]">
                Apoyos
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Simple list visualization (will be replaced with graph in production) */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              className="p-3 rounded-lg border border-[#2a3942] bg-[#202c33]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
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
                  <span className="text-xs text-[#8696a0]">Ronda {node.round}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#aebac1]">{node.expert}</span>
                  <span className="text-xs text-purple-400">
                    {(node.strength * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-[var(--theme-text-primary)]">{node.content}</p>
              {node.children.length > 0 && (
                <div className="mt-2 text-xs text-[#8696a0]">
                  {node.children.length} relación{node.children.length !== 1 ? 'es' : ''}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredNodes.length === 0 && (
          <p className="text-center text-[#aebac1] py-8">
            No hay argumentos que coincidan con los filtros seleccionados.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
