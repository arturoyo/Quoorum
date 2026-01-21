/**
 * Context Snapshots System
 * Save and restore context versions for iterative refinement
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ContextSnapshot {
  id: string
  name: string
  question: string
  context: Record<string, unknown>
  score: number
  dimensions: Array<{ id: string; name: string; score: number }>
  createdAt: Date
  tags: string[]
}

export interface SnapshotComparison {
  snapshot1: ContextSnapshot
  snapshot2: ContextSnapshot
  improvements: string[]
  regressions: string[]
  scoreChange: number
}

// ============================================================================
// IN-MEMORY STORAGE (Replace with DB in production)
// ============================================================================

const snapshots = new Map<string, ContextSnapshot>()

// ============================================================================
// SNAPSHOT OPERATIONS
// ============================================================================

export function createSnapshot(
  question: string,
  context: Record<string, unknown>,
  score: number,
  dimensions: Array<{ id: string; name: string; score: number }>,
  name?: string,
  tags?: string[]
): ContextSnapshot {
  const snapshot: ContextSnapshot = {
    id: generateSnapshotId(),
    name: name || `Snapshot ${new Date().toLocaleString()}`,
    question,
    context: JSON.parse(JSON.stringify(context)), // Deep clone
    score,
    dimensions: JSON.parse(JSON.stringify(dimensions)),
    createdAt: new Date(),
    tags: tags || [],
  }

  snapshots.set(snapshot.id, snapshot)
  return snapshot
}

export function getSnapshot(id: string): ContextSnapshot | null {
  return snapshots.get(id) || null
}

export function listSnapshots(questionFilter?: string): ContextSnapshot[] {
  const allSnapshots = Array.from(snapshots.values())

  if (questionFilter) {
    return allSnapshots.filter((s) =>
      s.question.toLowerCase().includes(questionFilter.toLowerCase())
    )
  }

  return allSnapshots.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function deleteSnapshot(id: string): boolean {
  return snapshots.delete(id)
}

export function updateSnapshot(
  id: string,
  updates: { name?: string; tags?: string[] }
): ContextSnapshot | null {
  const snapshot = snapshots.get(id)
  if (!snapshot) return null

  if (updates.name) snapshot.name = updates.name
  if (updates.tags) snapshot.tags = updates.tags

  snapshots.set(id, snapshot)
  return snapshot
}

// ============================================================================
// SNAPSHOT COMPARISON
// ============================================================================

export function compareSnapshots(id1: string, id2: string): SnapshotComparison | null {
  const snapshot1 = snapshots.get(id1)
  const snapshot2 = snapshots.get(id2)

  if (!snapshot1 || !snapshot2) return null

  const improvements: string[] = []
  const regressions: string[] = []

  // Compare dimensions
  snapshot1.dimensions.forEach((dim1) => {
    const dim2 = snapshot2.dimensions.find((d) => d.id === dim1.id)
    if (dim2) {
      const change = dim2.score - dim1.score
      if (change > 5) {
        improvements.push(`${dim1.name}: +${change} puntos`)
      } else if (change < -5) {
        regressions.push(`${dim1.name}: ${change} puntos`)
      }
    }
  })

  // Compare context keys
  const keys1 = Object.keys(snapshot1.context)
  const keys2 = Object.keys(snapshot2.context)

  const newKeys = keys2.filter((k) => !keys1.includes(k))
  const removedKeys = keys1.filter((k) => !keys2.includes(k))

  if (newKeys.length > 0) {
    improvements.push(`Añadidas ${newKeys.length} dimensiones: ${newKeys.join(', ')}`)
  }
  if (removedKeys.length > 0) {
    regressions.push(`Eliminadas ${removedKeys.length} dimensiones: ${removedKeys.join(', ')}`)
  }

  const scoreChange = snapshot2.score - snapshot1.score

  return {
    snapshot1,
    snapshot2,
    improvements,
    regressions,
    scoreChange,
  }
}

// ============================================================================
// SNAPSHOT ANALYTICS
// ============================================================================

export function getSnapshotStats(): {
  total: number
  avgScore: number
  bestScore: number
  recentActivity: number
} {
  const allSnapshots = Array.from(snapshots.values())

  if (allSnapshots.length === 0) {
    return { total: 0, avgScore: 0, bestScore: 0, recentActivity: 0 }
  }

  const avgScore =
    allSnapshots.reduce((sum, s) => sum + s.score, 0) / allSnapshots.length
  const bestScore = Math.max(...allSnapshots.map((s) => s.score))

  // Count snapshots from last 24h
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const recentActivity = allSnapshots.filter(
    (s) => s.createdAt.getTime() > oneDayAgo
  ).length

  return {
    total: allSnapshots.length,
    avgScore: Math.round(avgScore),
    bestScore,
    recentActivity,
  }
}

// ============================================================================
// AUTO-SAVE
// ============================================================================

const autoSaveIntervals = new Map<string, NodeJS.Timeout>()

export function enableAutoSave(
  questionId: string,
  getContextFn: () => {
    question: string
    context: Record<string, unknown>
    score: number
    dimensions: Array<{ id: string; name: string; score: number }>
  },
  intervalMs = 60000 // 1 minute
): void {
  // Clear existing interval
  const existing = autoSaveIntervals.get(questionId)
  if (existing) clearInterval(existing)

  // Create new interval
  const interval = setInterval(() => {
    const data = getContextFn()
    createSnapshot(data.question, data.context, data.score, data.dimensions, 'Auto-save', [
      'auto',
    ])
    console.log(`[Snapshots] Auto-saved for question: ${questionId}`)
  }, intervalMs)

  autoSaveIntervals.set(questionId, interval)
}

export function disableAutoSave(questionId: string): void {
  const interval = autoSaveIntervals.get(questionId)
  if (interval) {
    clearInterval(interval)
    autoSaveIntervals.delete(questionId)
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateSnapshotId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

// Export for testing
export function clearAllSnapshots(): void {
  snapshots.clear()
  autoSaveIntervals.forEach((interval) => clearInterval(interval))
  autoSaveIntervals.clear()
}
