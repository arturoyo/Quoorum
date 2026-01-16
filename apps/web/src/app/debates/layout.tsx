'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquarePlus, Search, Filter, X, MessageCircle, Sparkles, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'

interface DebatesLayoutProps {
  children: React.ReactNode
}

function DebatesLayoutInner({ children }: DebatesLayoutProps) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Resizable columns
  const [leftColumnWidth, setLeftColumnWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)

  const selectedDebateId = params?.id as string | undefined
  const isDebateSelected = !!selectedDebateId

  // Check if we're on the "new" route
  const isNewDebate = pathname === '/debates/new'

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

  // Fetch debates
  const { data: debates, isLoading, error } = api.debates.list.useQuery({
    limit: 50,
    offset: 0,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  // Filter and sort debates
  const filteredDebates = useMemo(() => {
    if (!debates) return []

    let filtered = [...debates]

    // Filter by search
    if (search) {
      filtered = filtered.filter((debate) =>
        debate.question.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Sort: in_progress > pending > completed
    filtered.sort((a, b) => {
      const statusOrder = { in_progress: 0, pending: 1, completed: 2 }
      const orderA = statusOrder[a.status as keyof typeof statusOrder] ?? 3
      const orderB = statusOrder[b.status as keyof typeof statusOrder] ?? 3

      if (orderA !== orderB) return orderA - orderB

      // Secondary sort by createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return filtered
  }, [debates, search])

  const handleDebateClick = useCallback(
    (id: string) => {
      router.push(`/debates/${id}`)
    },
    [router]
  )

  const handleNewDebate = useCallback(() => {
    router.push('/debates/new')
  }, [router])

  const handleClearSearch = () => {
    setSearch('')
  }

  return (
    <div className="flex h-screen flex-col relative bg-slate-950">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Header Global with gradient glow */}
      <header className="relative border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
        <div className="container mx-auto px-4">
          <div className="relative flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition" />
                <div className="relative w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Quoorum
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-gray-400 hover:text-blue-300 transition-colors relative group">
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all" />
              </Link>
              <Link href="/debates" className="text-sm font-medium text-blue-300 relative group">
                Debates
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
              </Link>
              <Link href="/settings" className="text-sm text-gray-400 hover:text-blue-300 transition-colors relative group">
                Configuración
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 group-hover:w-full transition-all" />
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/debates/new">
                <Button className="bg-purple-600 hover:bg-purple-500 text-white border-0">
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Nuevo Debate
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Lista de debates - Lado izquierdo */}
        <div
          className={cn(
            'relative flex h-full flex-col border-r border-[#2a3942] transition-all duration-300',
            isDebateSelected && 'hidden md:flex',
            isLeftPanelCollapsed && 'w-0 border-r-0 overflow-hidden'
          )}
          style={!isLeftPanelCollapsed ? { width: `${leftColumnWidth}px`, minWidth: '300px', maxWidth: '600px' } : { width: '0px' }}
        >
          {/* Subheader de la lista */}
          <div className="flex h-[60px] items-center justify-between border-b border-[#2a3942] bg-[#202c33] px-4">
            <h2 className="text-lg font-semibold text-white">Debates</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-[#aebac1] hover:bg-[#2a3942] hover:text-white"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </div>

        {/* Search Bar */}
        <div className="border-b border-[#2a3942] bg-[#202c33] p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aebac1]" />
            <Input
              type="text"
              placeholder="Buscar debates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-[#2a3942] pl-10 pr-10 text-sm text-white placeholder:text-[#aebac1] border-none focus-visible:ring-1 focus-visible:ring-[#00a884]"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aebac1] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="border-b border-[#2a3942] bg-[#202c33] p-3">
            <div className="flex gap-2">
              {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    statusFilter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#2a3942] text-[#aebac1] hover:bg-[#374047]'
                  )}
                >
                  {status === 'all' ? 'Todos' :
                   status === 'pending' ? 'Pendientes' :
                   status === 'in_progress' ? 'En curso' : 'Completados'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Debates List */}
        <div
          className="flex-1 overflow-auto debates-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'transparent transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.scrollbarColor = 'rgb(51 65 85) transparent'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.scrollbarColor = 'transparent transparent'
          }}
        >
          {/* Temporary "New Debate" item when creating */}
          {isNewDebate && (
            <button
              className="relative w-full border-b border-white/10 p-4 text-left bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                    <span className="bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
                      Nuevo debate
                    </span>
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse shadow-lg shadow-purple-500/50" />
                    <span className="text-xs text-blue-300">Configurando contexto...</span>
                  </div>
                </div>
              </div>
            </button>
          )}

          {error ? (
            <div className="p-8 text-center">
              <div className="mb-4 text-red-400">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-white">No se pudo cargar la lista</h3>
              <p className="text-sm text-[#aebac1]">Error de conexión con la base de datos</p>
              <p className="text-xs text-[#aebac1] mt-2">Usa el botón "Nuevo Debate" del header para crear uno</p>
            </div>
          ) : isLoading ? (
            <DebateListSkeleton />
          ) : filteredDebates.length === 0 ? (
            <EmptyDebatesState hasSearch={!!search} />
          ) : (
            <div>
              {filteredDebates.map((debate) => (
                <DebateListItem
                  key={debate.id}
                  debate={debate}
                  isSelected={debate.id === selectedDebateId}
                  onClick={() => handleDebateClick(debate.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Collapse/Expand Button */}
        {!isLeftPanelCollapsed && (
          <button
            onClick={() => setIsLeftPanelCollapsed(true)}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-gray-400 backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white"
            title="Ocultar panel de debates"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Resize Handle */}
        {!isLeftPanelCollapsed && (
          <div
            onMouseDown={() => setIsResizing(true)}
            className={cn(
              'absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-purple-600',
              isResizing && 'bg-purple-600'
            )}
            title="Arrastra para redimensionar"
          >
            <div className="absolute right-0 top-0 h-full w-2 -translate-x-1" />
          </div>
        )}
      </div>

      {/* Expand Button (when collapsed) */}
      {isLeftPanelCollapsed && (
        <button
          onClick={() => setIsLeftPanelCollapsed(false)}
          className="absolute left-4 top-20 z-50 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/90 text-white backdrop-blur-sm shadow-lg transition-all hover:bg-purple-500 hover:scale-110"
          title="Mostrar panel de debates"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

        {/* Debate Content - Right side */}
        <div className={cn('flex flex-1 flex-col', !isDebateSelected && !isNewDebate && 'hidden md:flex')}>
          {isDebateSelected || isNewDebate ? children : <EmptyDebateState />}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DebateListItem({
  debate,
  isSelected,
  onClick,
}: {
  debate: any
  isSelected: boolean
  onClick: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(debate.metadata?.title || debate.question)
  const utils = api.useUtils()

  const updateDebateMutation = api.debates.update.useMutation({
    onSuccess: () => {
      void utils.debates.list.invalidate()
      setIsEditing(false)
    },
  })

  const deleteDebateMutation = api.debates.delete.useMutation({
    onSuccess: () => {
      void utils.debates.list.invalidate()
    },
  })

  const statusColors = {
    draft: 'bg-gray-500',
    pending: 'bg-yellow-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
  }

  const statusLabels = {
    draft: 'Borrador',
    pending: 'Pendiente',
    in_progress: 'En curso',
    completed: 'Completado',
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('¿Estás seguro de que quieres eliminar este debate?')) {
      deleteDebateMutation.mutate({ id: debate.id })
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    updateDebateMutation.mutate({
      id: debate.id,
      metadata: {
        ...debate.metadata,
        title: editedTitle,
      },
    })
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(false)
    setEditedTitle(debate.metadata?.title || debate.question)
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'relative w-full border-b border-[#2a3942] p-4 transition-colors hover:bg-[#2a3942] cursor-pointer',
        isSelected && 'bg-[#2a3942]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 bg-[#374047] text-white text-sm px-2 py-1 rounded border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                onBlur={handleCancel}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancel(e as any)
                }}
              />
            </form>
          ) : (
            <h3 className="truncate text-sm font-medium text-white">
              {debate.metadata?.title || debate.question}
            </h3>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', statusColors[debate.status as keyof typeof statusColors])} />
            <span className="text-xs text-[#aebac1]">
              {statusLabels[debate.status as keyof typeof statusLabels]}
            </span>
            {debate.consensusScore && (
              <>
                <span className="text-[#aebac1]">•</span>
                <span className="text-xs text-[#aebac1]">
                  {Math.round(debate.consensusScore * 100)}% consenso
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHovered && !isEditing && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleEdit}
                className="p-1.5 rounded hover:bg-[#374047] text-[#aebac1] hover:text-blue-400 transition-colors"
                title="Editar nombre"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded hover:bg-[#374047] text-[#aebac1] hover:text-red-400 transition-colors"
                title="Eliminar debate"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <span className="text-xs text-[#aebac1]">
            {new Date(debate.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

function EmptyDebatesState({
  hasSearch,
}: {
  hasSearch: boolean
  onNewDebate?: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <MessageSquarePlus className="h-16 w-16 text-[#aebac1] mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">
        {hasSearch ? 'No se encontraron debates' : 'No hay debates'}
      </h3>
      <p className="text-sm text-[#aebac1] mb-6 max-w-sm">
        {hasSearch
          ? 'Intenta con otros términos de búsqueda'
          : 'Crea tu primer debate usando el botón "Nuevo Debate" del header'}
      </p>
    </div>
  )
}

function EmptyDebateState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#0b141a] p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#202c33]">
        <MessageSquarePlus className="h-10 w-10 text-[#aebac1]" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">
        Selecciona un debate
      </h3>
      <p className="text-sm text-[#aebac1] mb-6 max-w-md">
        Elige un debate de la lista o usa el botón "Nuevo Debate" del header para crear uno
      </p>
    </div>
  )
}

function DebateListSkeleton() {
  return (
    <div className="space-y-0">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-b border-[#2a3942] p-4">
          <div className="h-4 w-3/4 bg-[#2a3942] rounded mb-2 animate-pulse" />
          <div className="h-3 w-1/2 bg-[#2a3942] rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function DebatesLayout({ children }: DebatesLayoutProps) {
  return <DebatesLayoutInner>{children}</DebatesLayoutInner>
}
