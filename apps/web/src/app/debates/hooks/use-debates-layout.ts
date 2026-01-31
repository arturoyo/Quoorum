/**
 * useDebatesLayout Hook
 *
 * Centralized state management for the debates layout.
 * Handles debates list, filtering, selection, and UI state.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { debateStatusEnum } from '@quoorum/db/schema'

type StatusFilter = 'all' | (typeof debateStatusEnum.enumValues)[number]

export function useDebatesLayout() {
  const router = useRouter()
  const pathname = usePathname()
  const hasInitializedSelection = useRef(false)

  // ═══════════════════════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════════════════════
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [_deleteConfirmOpen, _setDeleteConfirmOpen] = useState(false)
  const [_debateToDelete, _setDebateToDelete] = useState<string | null>(null)
  const [selectedDebates, setSelectedDebates] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Resizable columns
  const [leftColumnWidth, setLeftColumnWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)

  // ═══════════════════════════════════════════════════════════
  // DERIVED STATE
  // ═══════════════════════════════════════════════════════════
  const [selectedDebateId, setSelectedDebateId] = useState<string | undefined>(undefined)
  const isDebateSelected = !!selectedDebateId
  // Only new-unified is the official route (others redirect here)
  const isNewDebate =
    pathname === '/debates/new-unified' ||
    pathname.startsWith('/debates/new-unified/')

  // ═══════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════

  // Collapse sidebar only when creating a new debate
  useEffect(() => {
    setIsLeftPanelCollapsed(isNewDebate)
  }, [isNewDebate])

  // Initialize selection from route only once (e.g., /debates/:id)
  useEffect(() => {
    if (hasInitializedSelection.current) return
    if (!pathname) return

    const match = pathname.match(/^\/debates\/([^/]+)$/)
    if (match && match[1] !== 'new-unified') {
      setSelectedDebateId(match[1])
    }

    hasInitializedSelection.current = true
  }, [pathname])

  // Clear selection when creating a new debate
  useEffect(() => {
    if (isNewDebate && selectedDebateId) {
      setSelectedDebateId(undefined)
    }
  }, [isNewDebate, selectedDebateId])

  // Load column width from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('debates-left-column-width')
    if (saved) {
      const width = Number(saved)
      if (width >= 300 && width <= 600) {
        setLeftColumnWidth(width)
      }
    }
  }, [])

  // Handle column resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      if (newWidth >= 300 && newWidth <= 600) {
        setLeftColumnWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
        localStorage.setItem('debates-left-column-width', String(leftColumnWidth))
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, leftColumnWidth])

  // ═══════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════

  const { data: debates, isLoading, error } = api.debates.list.useQuery({
    limit: 50,
    offset: 0,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }, {
    refetchInterval: (data) => {
      const hasInProgress = data?.some((debate) => debate.status === 'in_progress' || debate.status === 'pending')
      return hasInProgress ? 5000 : false
    },
    refetchIntervalInBackground: true,
  })

  // ═══════════════════════════════════════════════════════════
  // FILTERED & SORTED DEBATES
  // ═══════════════════════════════════════════════════════════

  const filteredDebates = useMemo(() => {
    if (!debates) return []

    let filtered = [...debates]

    // Filter by search
    if (search) {
      filtered = filtered.filter((debate) =>
        debate.question.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Sort: draft > in_progress > pending > completed
    filtered.sort((a, b) => {
      const statusOrder = { draft: 0, in_progress: 1, pending: 2, completed: 3 }
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 4
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 4

      if (orderA !== orderB) return orderA - orderB

      // Secondary sort by createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return filtered
  }, [debates, search])

  // ═══════════════════════════════════════════════════════════
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════

  const utils = api.useUtils()

  const deleteDebateMutation = api.debates.delete.useMutation({
    onSuccess: (_, variables) => {
      void utils.debates.list.invalidate()
      if (selectedDebateId === variables.id) {
        setSelectedDebateId(undefined)
        router.replace('/debates')
      }
    },
  })

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleDebateClick = useCallback(
    (debate: { id: string; status: string }) => {
      setSelectedDebateId(debate.id)
      router.replace(`/debates/${debate.id}`)
    },
    [router]
  )

  const handleNewDebate = useCallback(() => {
    router.push('/debates/new-unified')
  }, [router])

  const handleClearSearch = useCallback(() => {
    setSearch('')
  }, [])

  const handleToggleSelect = useCallback((debateId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDebates((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(debateId)) {
        newSet.delete(debateId)
      } else {
        newSet.add(debateId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedDebates.size === filteredDebates.length && filteredDebates.length > 0) {
      setSelectedDebates(new Set())
    } else {
      setSelectedDebates(new Set(filteredDebates.map((d) => d.id)))
    }
  }, [selectedDebates.size, filteredDebates])

  const handleBulkDelete = useCallback(async () => {
    try {
      const selectedIds = Array.from(selectedDebates)
      await Promise.all(
        selectedIds.map((id) => deleteDebateMutation.mutateAsync({ id }))
      )
      toast.success(
        `${selectedIds.length} debate${selectedIds.length > 1 ? 's' : ''} eliminado${selectedIds.length > 1 ? 's' : ''}`
      )
      if (selectedDebateId && selectedIds.includes(selectedDebateId)) {
        setSelectedDebateId(undefined)
        router.replace('/debates')
      }
      setSelectedDebates(new Set())
      setBulkDeleteDialogOpen(false)
    } catch {
      toast.error('Error al eliminar debates')
    }
  }, [selectedDebates, deleteDebateMutation, selectedDebateId, router])

  const toggleLeftPanel = useCallback(() => {
    setIsLeftPanelCollapsed(prev => !prev)
  }, [])

  const startResizing = useCallback(() => {
    setIsResizing(true)
  }, [])

  // ═══════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════

  return {
    // Data
    debates,
    filteredDebates,
    isLoading,
    error,

    // Derived state
    selectedDebateId,
    isDebateSelected,
    isNewDebate,

    // UI state
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    showFilters,
    setShowFilters,
    selectedDebates,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    leftColumnWidth,
    isResizing,
    isLeftPanelCollapsed,

    // Mutations
    deleteDebateMutation,

    // Handlers
    handleDebateClick,
    handleNewDebate,
    handleClearSearch,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDelete,
    toggleLeftPanel,
    startResizing,
  }
}

export type UseDebatesLayoutReturn = ReturnType<typeof useDebatesLayout>
