'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MessageSquare,
  MessageSquarePlus,
  Pencil,
  Search,
  Sparkles,
  Trash,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { IconType } from 'react-icons'
import {
  MdRocket,
  MdTrendingUp,
  MdGroups,
  MdCampaign,
  MdLightbulb,
  MdAttachMoney,
  MdSettings,
  MdShoppingCart,
  MdPerson,
  MdLanguage,
  MdPhoneAndroid,
  MdCode,
  MdStorage,
  MdSecurity,
  MdFavorite,
  MdSchool,
  MdBusiness,
  MdEmojiEvents,
  MdForum,
  MdPalette,
  MdEco,
  MdLocalHospital,
  MdDirectionsCar,
  MdHome,
  MdFlight,
  MdRestaurant,
  MdSportsEsports,
  MdMusicNote,
  MdPhotoCamera,
  MdMenuBook,
  MdScience,
  MdWork,
  MdHandshake,
  MdPieChart,
  MdEmail,
  MdNotifications,
  MdStar,
  MdLocalFireDepartment,
  MdCloud,
  MdLock,
  MdSearch,
  MdCheckCircle,
  MdHelp,
} from 'react-icons/md'
import { AppHeader } from '@/components/layout/app-header'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface DebatesLayoutProps {
  children: React.ReactNode
}

/**
 * Selecciona un icono contextual basado en palabras clave de la pregunta del debate
 */
function getContextualIcon(question: string): IconType {
  const lowerQuestion = question.toLowerCase()

  // Categorías de iconos con palabras clave
  const iconMap: Array<{ keywords: string[]; icon: IconType }> = [
    // Negocios y ventas
    { keywords: ['venta', 'vender', 'cliente', 'compra', 'comercial', 'revenue'], icon: MdShoppingCart },
    { keywords: ['dinero', 'precio', 'costo', 'inversión', 'presupuesto', 'financ'], icon: MdAttachMoney },
    { keywords: ['deal', 'negoci', 'acuerdo', 'contrato'], icon: MdHandshake },
    { keywords: ['marketing', 'campaña', 'publicidad', 'promoción'], icon: MdCampaign },
    { keywords: ['crecimiento', 'escal', 'expansión', 'aumento'], icon: MdTrendingUp },
    { keywords: ['éxito', 'logro', 'objetivo', 'meta', 'ganar'], icon: MdEmojiEvents },

    // Productos y desarrollo
    { keywords: ['producto', 'feature', 'funcionalidad', 'desarrollo'], icon: MdRocket },
    { keywords: ['diseño', 'ui', 'ux', 'interfaz', 'visual'], icon: MdPalette },
    { keywords: ['código', 'programación', 'software', 'desarrollo'], icon: MdCode },
    { keywords: ['datos', 'database', 'información', 'analytics'], icon: MdStorage },
    { keywords: ['mobile', 'móvil', 'app', 'aplicación'], icon: MdPhoneAndroid },
    { keywords: ['web', 'sitio', 'website', 'online'], icon: MdLanguage },
    { keywords: ['cloud', 'nube', 'servidor', 'hosting'], icon: MdCloud },
    { keywords: ['seguridad', 'privacidad', 'protección', 'segur'], icon: MdSecurity },

    // Equipo y organización
    { keywords: ['equipo', 'team', 'colabor', 'grupo', 'personal'], icon: MdGroups },
    { keywords: ['líder', 'management', 'gestión', 'dirección'], icon: MdPerson },
    { keywords: ['empresa', 'compañía', 'organización', 'negocio'], icon: MdBusiness },
    { keywords: ['trabajo', 'empleo', 'carrera', 'profesional'], icon: MdWork },

    // Comunicación
    { keywords: ['comunicación', 'mensaje', 'conversación', 'chat'], icon: MdForum },
    { keywords: ['email', 'correo', 'mail'], icon: MdEmail },
    { keywords: ['notificación', 'alerta', 'aviso'], icon: MdNotifications },

    // Ideas e innovación
    { keywords: ['idea', 'innovación', 'creativ', 'concept'], icon: MdLightbulb },
    { keywords: ['estrategia', 'plan', 'táctica', 'approach'], icon: MdPieChart },
    { keywords: ['investigación', 'research', 'estudio', 'análisis'], icon: MdScience },
    { keywords: ['aprendizaje', 'educación', 'formación', 'curso'], icon: MdSchool },
    { keywords: ['libro', 'contenido', 'documentación', 'guía'], icon: MdMenuBook },

    // Industrias específicas
    { keywords: ['salud', 'médico', 'hospital', 'clínica'], icon: MdLocalHospital },
    { keywords: ['coche', 'auto', 'vehículo', 'transporte'], icon: MdDirectionsCar },
    { keywords: ['casa', 'hogar', 'vivienda', 'inmobiliaria'], icon: MdHome },
    { keywords: ['viaje', 'turismo', 'vuelo', 'destino'], icon: MdFlight },
    { keywords: ['comida', 'restaurante', 'food', 'cocina'], icon: MdRestaurant },
    { keywords: ['juego', 'game', 'gaming', 'entretenimiento'], icon: MdSportsEsports },
    { keywords: ['música', 'audio', 'sound', 'canción'], icon: MdMusicNote },
    { keywords: ['foto', 'imagen', 'video', 'visual'], icon: MdPhotoCamera },
    { keywords: ['sostenib', 'ecológico', 'verde', 'medio ambiente'], icon: MdEco },

    // Acciones y estados
    { keywords: ['configuración', 'ajuste', 'settings', 'config'], icon: MdSettings },
    { keywords: ['buscar', 'encontrar', 'search', 'explorar'], icon: MdSearch },
    { keywords: ['importante', 'priority', 'destacado', 'crítico'], icon: MdStar },
    { keywords: ['urgente', 'rápido', 'inmediato', 'hot'], icon: MdLocalFireDepartment },
    { keywords: ['completado', 'terminado', 'finished', 'done'], icon: MdCheckCircle },
    { keywords: ['pregunta', 'duda', 'question', 'cómo'], icon: MdHelp },
    { keywords: ['amor', 'pasión', 'love', 'favorito'], icon: MdFavorite },
    { keywords: ['privado', 'confidencial', 'secret'], icon: MdLock },
  ]

  // Buscar coincidencia de palabras clave
  for (const { keywords, icon } of iconMap) {
    for (const keyword of keywords) {
      if (lowerQuestion.includes(keyword)) {
        return icon
      }
    }
  }

  // Icono por defecto si no hay coincidencia
  return MessageSquare
}

function DebatesLayoutInner({ children }: DebatesLayoutProps) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'in_progress' | 'completed'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [debateToDelete, setDebateToDelete] = useState<string | null>(null)
  const [selectedDebates, setSelectedDebates] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Resizable columns
  const [leftColumnWidth, setLeftColumnWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)

  const selectedDebateId = params?.id as string | undefined
  const isDebateSelected = !!selectedDebateId

  // Check if we're on the "new" route
  const isNewDebate = pathname === '/debates/new'

  // Collapse sidebar only when creating a new debate, expand otherwise
  useEffect(() => {
    setIsLeftPanelCollapsed(isNewDebate)
  }, [isNewDebate])

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

  // Fetch debates with polling for in-progress debates
  const { data: debates, isLoading, error } = api.debates.list.useQuery({
    limit: 50,
    offset: 0,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }, {
    // Poll every 5 seconds if there are any debates in progress
    refetchInterval: (data) => {
      const hasInProgress = data?.some((debate) => debate.status === 'in_progress' || debate.status === 'pending')
      return hasInProgress ? 5000 : false
    },
    refetchIntervalInBackground: true,
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

  const handleDebateClick = useCallback(
    (debate: any) => {
      // If it's a draft, open in /debates/new with draft ID
      if (debate.status === 'draft') {
        router.push(`/debates/new?draft=${debate.id}`)
      } else {
        router.push(`/debates/${debate.id}`)
      }
    },
    [router]
  )

  const handleNewDebate = useCallback(() => {
    router.push('/debates/new')
  }, [router])

  const handleClearSearch = () => {
    setSearch('')
  }

  // Multi-select handlers
  const utils = api.useUtils()

  const deleteDebateMutation = api.debates.delete.useMutation({
    onSuccess: (_, variables) => {
      void utils.debates.list.invalidate()
      // Si el debate eliminado es el seleccionado actualmente, redirigir a /debates
      if (selectedDebateId === variables.id) {
        router.push('/debates')
      }
    },
  })

  const handleToggleSelect = (debateId: string, e: React.MouseEvent) => {
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
  }

  const handleSelectAll = () => {
    if (selectedDebates.size === filteredDebates.length && filteredDebates.length > 0) {
      setSelectedDebates(new Set())
    } else {
      setSelectedDebates(new Set(filteredDebates.map((d) => d.id)))
    }
  }

  const handleBulkDelete = async () => {
    try {
      const selectedIds = Array.from(selectedDebates)
      await Promise.all(
        selectedIds.map((id) => deleteDebateMutation.mutateAsync({ id }))
      )
      toast.success(
        `${selectedIds.length} debate${selectedIds.length > 1 ? 's' : ''} eliminado${selectedIds.length > 1 ? 's' : ''}`
      )
      setSelectedDebates(new Set())
      setBulkDeleteDialogOpen(false)
    } catch (error) {
      toast.error('Error al eliminar debates')
    }
  }

  return (
    <div className="flex h-screen flex-col relative bg-slate-950">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Header Global */}
      <AppHeader variant="app" />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Lista de debates - Lado izquierdo */}
        {!isNewDebate && (
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
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 text-[#aebac1] hover:bg-[#2a3942] hover:text-white"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-5 w-5" />
            </Button>
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
            <div className="flex flex-wrap gap-2">
              {(['all', 'draft', 'pending', 'in_progress', 'completed'] as const).map((status) => (
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
                   status === 'draft' ? 'Borradores' :
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
                  isCheckboxSelected={selectedDebates.has(debate.id)}
                  showCheckbox={selectedDebates.size > 0}
                  onClick={() => handleDebateClick(debate)}
                  onToggleSelect={(e) => handleToggleSelect(debate.id, e)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Collapse/Expand Button */}
        {!isLeftPanelCollapsed && !isNewDebate && (
          <button
            onClick={() => setIsLeftPanelCollapsed(true)}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 text-gray-400 backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white"
            title="Ocultar panel de debates"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Resize Handle */}
        {!isLeftPanelCollapsed && !isNewDebate && (
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
        )}

      {/* Expand Button (when collapsed) */}
      {isLeftPanelCollapsed && !isNewDebate && (
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

      {/* Floating Action Bar for bulk delete */}
      {selectedDebates.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <div className="border border-white/20 bg-slate-800/95 backdrop-blur-xl shadow-2xl rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDebates.size === filteredDebates.length}
                  onCheckedChange={handleSelectAll}
                  className="h-5 w-5"
                />
                <span className="text-white font-medium text-sm">
                  {selectedDebates.size} debate{selectedDebates.size > 1 ? 's' : ''} seleccionado{selectedDebates.size > 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={deleteDebateMutation.isPending}
              >
                {deleteDebateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="¿Eliminar debates seleccionados?"
        description={`Estás a punto de eliminar ${selectedDebates.size} debate${selectedDebates.size > 1 ? 's' : ''}. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleBulkDelete}
        variant="destructive"
        isLoading={deleteDebateMutation.isPending}
      />
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DebateListItem({
  debate,
  isSelected,
  isCheckboxSelected,
  showCheckbox,
  onClick,
  onToggleSelect,
}: {
  debate: any
  isSelected: boolean
  isCheckboxSelected: boolean
  showCheckbox: boolean
  onClick: () => void
  onToggleSelect: (e: React.MouseEvent) => void
}) {
  const router = useRouter()
  const params = useParams()
  const selectedDebateId = params?.id as string | undefined

  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(debate.metadata?.title || debate.question)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const utils = api.useUtils()

  const updateDebateMutation = api.debates.update.useMutation({
    onSuccess: () => {
      void utils.debates.list.invalidate()
      setIsEditing(false)
    },
  })

  const deleteDebateMutation = api.debates.delete.useMutation({
    onSuccess: (_, variables) => {
      void utils.debates.list.invalidate()
      // Si el debate eliminado es el seleccionado actualmente, redirigir a /debates
      if (selectedDebateId === variables.id) {
        router.push('/debates')
      }
    },
  })

  const statusColors = {
    draft: 'bg-yellow-500',
    pending: 'bg-yellow-500',
    in_progress: 'bg-yellow-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  }

  const statusLabels = {
    draft: 'En progreso',
    pending: 'En progreso',
    in_progress: 'En progreso',
    completed: 'Completado',
    failed: 'Error',
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    deleteDebateMutation.mutate({ id: debate.id })
    setDeleteDialogOpen(false)
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

  // Obtener icono contextual basado en la pregunta
  const ContextualIcon = getContextualIcon(debate.question)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'relative w-full border-b border-[#2a3942] p-4 transition-all cursor-pointer group',
        isSelected
          ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-l-4 border-l-purple-500 shadow-lg shadow-purple-500/10'
          : 'hover:bg-[#2a3942]'
      )}
    >
      {/* Icon/Checkbox - Contextual icon by default, checkbox on hover or when selected */}
      <div
        className="absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-all cursor-pointer"
        onClick={onToggleSelect}
      >
        {/* Show checkbox on hover, when any debate is selected, or when this debate is checked */}
        {(isHovered || showCheckbox || isCheckboxSelected) ? (
          <Checkbox
            checked={isCheckboxSelected}
            className="h-6 w-6 border-2 border-[#aebac1]/60 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 hover:border-purple-500"
          />
        ) : (
          <ContextualIcon className="h-6 w-6 text-[#aebac1]" />
        )}
      </div>

      <div className="flex items-start justify-between gap-3 pl-12">
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
            <h3 className={cn(
              'truncate text-sm font-medium',
              isSelected ? 'text-white font-semibold' : 'text-white'
            )}>
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar debate?"
        description="Esta acción eliminará permanentemente este debate. No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteDebateMutation.isPending}
      />
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
