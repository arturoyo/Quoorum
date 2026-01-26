'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RouterOutputs } from '@quoorum/api'

type Department = RouterOutputs['departments']['list'][number]

interface DepartmentHierarchyViewProps {
  departments: Department[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onCreate?: () => void
}

interface DepartmentNode {
  department: Department
  children: DepartmentNode[]
  level: number
}

/**
 * Builds a hierarchical tree structure from flat department list
 */
function buildHierarchy(departments: Department[]): DepartmentNode[] {
  const departmentMap = new Map<string, DepartmentNode>()
  const roots: DepartmentNode[] = []

  // First pass: create all nodes
  departments.forEach((dept) => {
    departmentMap.set(dept.id, {
      department: dept,
      children: [],
      level: 0,
    })
  })

  // Second pass: build parent-child relationships
  departments.forEach((dept) => {
    const node = departmentMap.get(dept.id)!
    if (dept.parentId) {
      const parent = departmentMap.get(dept.parentId)
      if (parent) {
        parent.children.push(node)
        node.level = parent.level + 1
      } else {
        // Parent not found, treat as root
        roots.push(node)
      }
    } else {
      // No parent, it's a root
      roots.push(node)
    }
  })

  // Calculate levels for all nodes (BFS)
  const queue = [...roots]
  while (queue.length > 0) {
    const node = queue.shift()!
    node.children.forEach((child) => {
      child.level = node.level + 1
      queue.push(child)
    })
  }

  return roots
}

/**
 * Renders a single department node with its children recursively
 */
function DepartmentNodeComponent({
  node,
  onEdit,
  onDelete,
  maxLevel,
}: {
  node: DepartmentNode
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  maxLevel: number
}) {
  const router = useRouter()
  const hasChildren = node.children.length > 0
  const isRoot = node.level === 0

  // Calculate geometric shape based on level
  const shapeClass = isRoot
    ? 'rounded-lg' // Root: rounded rectangle
    : node.level === 1
    ? 'rounded-full' // Level 1: circle
    : 'rounded-t-lg rounded-b-none' // Level 2+: rounded top only

  return (
    <div className="relative">
      {/* Department Card with Geometric Shape */}
      <div
        className={cn('relative mb-6 transition-all')}
        style={{ marginLeft: `${node.level * 64}px` }}
      >
        {/* Connection Line (vertical from parent) */}
        {!isRoot && (
          <div
            className="absolute left-[-32px] top-[-20px] w-0.5 bg-gradient-to-b from-purple-500/60 via-purple-500/40 to-transparent"
            style={{ height: '40px', zIndex: 0 }}
          />
        )}

        {/* Connection Line (horizontal to parent) */}
        {!isRoot && (
          <div
            className="absolute left-[-32px] top-0 w-8 h-0.5 bg-gradient-to-r from-purple-500/60 via-purple-500/40 to-transparent"
            style={{ zIndex: 0 }}
          />
        )}

        {/* Geometric Shape Container */}
        <div className="relative" style={{ zIndex: 1 }}>
          <Card
            className={cn(
              'relative border-2 backdrop-blur-xl hover:border-purple-500/50 transition-all shadow-lg',
              shapeClass,
              isRoot
                ? 'border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-[var(--theme-bg-secondary)] to-blue-500/10'
                : node.level === 1
                ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-[var(--theme-bg-secondary)] to-cyan-500/10 w-64 h-64 flex items-center justify-center'
                : 'border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-[var(--theme-bg-secondary)] to-teal-500/10',
              !node.department.isActive && 'opacity-50 grayscale'
            )}
          >
            {node.level === 1 ? (
              // Circular layout for level 1
              <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                <div className="text-6xl mb-4">{node.department.icon || '📦'}</div>
                <CardTitle className="text-xl font-bold text-[var(--theme-text-primary)] text-center mb-2">
                  {node.department.name}
                </CardTitle>
                <CardDescription className="text-[var(--theme-text-secondary)] text-center text-sm line-clamp-2">
                  {node.department.description || node.department.departmentContext?.substring(0, 60) + '...'}
                </CardDescription>
                {!node.department.isActive && (
                  <Badge variant="outline" className="mt-2 border-gray-500/50 text-[var(--theme-text-secondary)] bg-gray-500/10 text-xs">
                    Inactivo
                  </Badge>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)] text-xs"
                    onClick={() => router.push(`/settings/company/departments/${node.department.id}`)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs"
                      onClick={() => onDelete(node.department.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            ) : (
              // Rectangular layout for root and deeper levels
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg text-[var(--theme-text-primary)]">
                        {node.department.icon && <span className="text-2xl">{node.department.icon}</span>}
                        {node.department.name}
                        {!node.department.isActive && (
                          <Badge variant="outline" className="border-gray-500/50 text-[var(--theme-text-secondary)] bg-gray-500/10 text-xs">
                            Inactivo
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-[var(--theme-text-tertiary)] text-sm">
                        {node.department.description || node.department.departmentContext?.substring(0, 80) + '...'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-500/10 text-xs">
                      {node.department.type}
                    </Badge>
                    <Badge variant="secondary" className="bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)] text-xs">
                      {node.department.agentRole}
                    </Badge>
                    {node.department.isPredefined && (
                      <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/40 text-xs">Plantilla</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-[var(--theme-border)]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-[var(--theme-border)] bg-[var(--theme-bg-input)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-tertiary)] text-xs"
                      onClick={() => router.push(`/settings/company/departments/${node.department.id}`)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Editar
                    </Button>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/40 text-red-300 hover:bg-red-500/20 text-xs"
                        onClick={() => onDelete(node.department.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>

        {/* Connection Line (vertical continuation to children) */}
        {hasChildren && (
          <div
            className="absolute left-[-32px] top-[100%] w-0.5 bg-gradient-to-b from-purple-500/60 via-purple-500/40 to-transparent"
            style={{ height: '24px', zIndex: 0 }}
          />
        )}
      </div>

      {/* Render Children */}
      {hasChildren && (
        <div className="relative">
          {node.children.map((child) => (
            <DepartmentNodeComponent
              key={child.department.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              maxLevel={maxLevel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function DepartmentHierarchyView({
  departments,
  onEdit,
  onDelete,
  onCreate,
}: DepartmentHierarchyViewProps) {
  const hierarchy = useMemo(() => buildHierarchy(departments), [departments])
  const maxLevel = useMemo(() => {
    let max = 0
    function traverse(nodes: DepartmentNode[]) {
      nodes.forEach((node) => {
        max = Math.max(max, node.level)
        traverse(node.children)
      })
    }
    traverse(hierarchy)
    return max
  }, [hierarchy])

  if (departments.length === 0) {
    return (
      <Card className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-[var(--theme-text-tertiary)] mb-4">No hay departamentos configurados</p>
          {onCreate && (
            <Button onClick={onCreate} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Departamento
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[var(--theme-text-primary)]">Estructura Organizacional</h3>
          <p className="text-sm text-[var(--theme-text-tertiary)]">
            Visualiza la jerarquía y dependencias entre departamentos
          </p>
        </div>
        {onCreate && (
          <Button onClick={onCreate} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Añadir Departamento
          </Button>
        )}
      </div>

      <div className="relative min-h-[500px] p-8 bg-gradient-to-br from-[var(--theme-bg-secondary)]/40 via-[var(--theme-bg-tertiary)]/30 to-[var(--theme-bg-secondary)]/40 rounded-xl border-2 border-purple-500/20 shadow-2xl">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ zIndex: 0 }}>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(168, 85, 247, 0.3) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        {/* Department Nodes */}
        <div className="relative" style={{ zIndex: 1 }}>
          {hierarchy.map((root) => (
            <DepartmentNodeComponent
              key={root.department.id}
              node={root}
              onEdit={onEdit}
              onDelete={onDelete}
              maxLevel={maxLevel}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
