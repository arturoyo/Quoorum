'use client'

import { motion } from 'framer-motion'
import { Save, History, Download, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// ============================================================================
// TYPES
// ============================================================================

interface ContextSnapshot {
  id: string
  name: string
  question: string
  context: Record<string, unknown>
  score: number
  dimensions: Array<{ id: string; name: string; score: number }>
  createdAt: Date
  tags: string[]
}

interface ContextSnapshotsProps {
  snapshots: ContextSnapshot[]
  currentScore: number
  onSave: (name: string) => void
  onRestore: (snapshotId: string) => void
  onDelete: (snapshotId: string) => void
  onClose: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContextSnapshots({
  snapshots,
  currentScore,
  onSave,
  onRestore,
  onDelete,
  onClose,
}: ContextSnapshotsProps) {
  const [snapshotName, setSnapshotName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    if (!snapshotName.trim()) return

    setIsSaving(true)
    onSave(snapshotName)
    setSnapshotName('')
    setTimeout(() => setIsSaving(false), 500)
  }

  const sortedSnapshots = [...snapshots].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-[var(--theme-text-primary)]">
                ?? Context Snapshots
              </h3>
            </div>
            <p className="mt-1 text-sm text-[#aebac1]">
              Guarda y restaura versiones de tu contexto para iterar rápidamente
            </p>
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-[#8696a0] hover:text-[var(--theme-text-primary)]"
          >
            Cerrar
          </Button>
        </div>

        {/* Save New Snapshot */}
        <div className="mt-4 flex gap-2">
          <Input
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            placeholder="Nombre del snapshot (ej: 'Primera versión')"
            className="flex-1 border-[#2a3942] bg-[#111b21] text-[var(--theme-text-primary)] placeholder:text-[#8696a0]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave()
              }
            }}
          />
          <Button
            onClick={handleSave}
            disabled={!snapshotName.trim() || isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSaving ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>
        </div>

        {/* Current Score */}
        <div className="mt-3 rounded border border-[#2a3942] bg-[#0b141a] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8696a0]">Score actual:</span>
            <span className="font-semibold text-[var(--theme-text-primary)]">{currentScore}%</span>
          </div>
        </div>
      </div>

      {/* Snapshots List */}
      {sortedSnapshots.length === 0 ? (
        <Card className="border-[#2a3942] bg-[#111b21] p-8 text-center">
          <History className="mx-auto h-12 w-12 text-[#8696a0] mb-4" />
          <p className="text-sm text-[#aebac1]">
            No hay snapshots guardados aún
          </p>
          <p className="text-xs text-[#8696a0] mt-2">
            Guarda una versión para poder volver a ella más tarde
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--theme-text-primary)]">
            ?? Snapshots Guardados ({sortedSnapshots.length})
          </h4>
          {sortedSnapshots.map((snapshot, index) => {
            const isAuto = snapshot.tags.includes('auto')
            const scoreChange = snapshot.score - currentScore

            return (
              <motion.div
                key={snapshot.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-[#2a3942] bg-[#111b21] p-4 transition-all hover:border-purple-500/40">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-semibold text-[var(--theme-text-primary)]">
                          {snapshot.name}
                        </h5>
                        {isAuto && (
                          <Badge variant="outline" className="border-[#2a3942] bg-[#0b141a] text-[#8696a0] text-xs">
                            Auto
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#8696a0]">
                        Guardado hace{' '}
                        {formatDistanceToNow(new Date(snapshot.createdAt), {
                          locale: es,
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => onRestore(snapshot.id)}
                        size="sm"
                        variant="outline"
                        className="border-[#2a3942] text-[#aebac1] hover:bg-purple-600 hover:text-white hover:border-purple-600"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Restaurar
                      </Button>
                      <Button
                        onClick={() => onDelete(snapshot.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Snapshot Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded border border-[#2a3942] bg-[#0b141a] p-2">
                      <p className="text-xs text-[#8696a0] mb-1">Score</p>
                      <p className="text-lg font-bold text-[var(--theme-text-primary)]">{snapshot.score}%</p>
                    </div>

                    <div className="rounded border border-[#2a3942] bg-[#0b141a] p-2">
                      <p className="text-xs text-[#8696a0] mb-1">Cambio</p>
                      <p
                        className={`text-lg font-bold ${
                          scoreChange > 0
                            ? 'text-green-400'
                            : scoreChange < 0
                            ? 'text-red-400'
                            : 'text-[#8696a0]'
                        }`}
                      >
                        {scoreChange > 0 ? '+' : ''}
                        {scoreChange}
                      </p>
                    </div>

                    <div className="rounded border border-[#2a3942] bg-[#0b141a] p-2">
                      <p className="text-xs text-[#8696a0] mb-1">Dimensiones</p>
                      <p className="text-lg font-bold text-[var(--theme-text-primary)]">
                        {snapshot.dimensions.filter((d) => d.score >= 70).length}/
                        {snapshot.dimensions.length}
                      </p>
                    </div>
                  </div>

                  {/* Dimensions Preview */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {snapshot.dimensions.slice(0, 5).map((dim) => (
                      <Badge
                        key={dim.id}
                        variant="outline"
                        className={`text-xs ${
                          dim.score >= 70
                            ? 'border-green-500/30 bg-green-900/20 text-green-300'
                            : dim.score >= 40
                            ? 'border-yellow-500/30 bg-yellow-900/20 text-yellow-300'
                            : 'border-red-500/30 bg-red-900/20 text-red-300'
                        }`}
                      >
                        {dim.name}: {dim.score}%
                      </Badge>
                    ))}
                    {snapshot.dimensions.length > 5 && (
                      <Badge
                        variant="outline"
                        className="border-[#2a3942] bg-[#0b141a] text-[#8696a0] text-xs"
                      >
                        +{snapshot.dimensions.length - 5}
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-lg border border-[#2a3942] bg-[#0b141a] p-3"
      >
        <p className="text-xs text-[#8696a0]">
          ?? <span className="text-[#aebac1]">Tip:</span> Guarda snapshots antes de hacer
          cambios grandes. Puedes comparar versiones y volver atrás si es necesario.
        </p>
      </motion.div>
    </motion.div>
  )
}
