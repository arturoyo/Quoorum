'use client'

/**
 * DebatesLayout - Orchestrator Component
 *
 * Layout for the debates section with a resizable sidebar.
 * Shows list of debates on the left, selected debate on the right.
 *
 * All state management is centralized in useDebatesLayout hook.
 */

import { cn, styles } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Trash,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/layout'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDebatesLayout } from './hooks/use-debates-layout'
import {
  DebateListIconOnly,
  DebateListItem,
  EmptyDebatesState,
  EmptyDebateState,
  DebateListSkeleton,
  EmbeddedDebateView,
} from './components'

interface DebatesLayoutProps {
  children: React.ReactNode
}

function DebatesLayoutInner({ children }: DebatesLayoutProps) {
  const {
    // Data
    filteredDebates,
    isLoading,

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
    handleNewDebate: _handleNewDebate,
    handleClearSearch,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDelete,
    toggleLeftPanel,
    startResizing,
  } = useDebatesLayout()

  return (
    <AppShell showGradient={true}>
      <div className={cn(
        "relative flex flex-1 overflow-hidden w-full"
      )}>
        {/* Debates List - Left Side */}
        {!isNewDebate && (
          <div
            className={cn(
              'relative flex h-full flex-col border-r styles.colors.border.default transition-all duration-300',
              isDebateSelected && 'hidden md:flex',
              isLeftPanelCollapsed && 'overflow-hidden',
              !isLeftPanelCollapsed
                ? `w-[${leftColumnWidth}px] min-w-[300px] max-w-[600px]`
                : 'w-[80px]'
            )}
          >
            {/* Subheader */}
            <div className="flex h-[60px] items-center justify-between border-b styles.colors.border.default styles.colors.bg.tertiary px-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* Collapse/Expand Button */}
                {!isLeftPanelCollapsed ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn('h-9 w-9 p-0', styles.colors.text.secondary, styles.hoverState())}
                    onClick={toggleLeftPanel}
                    title="Ocultar panel de debates"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn('h-9 w-9 p-0', styles.colors.text.secondary, styles.hoverState())}
                    onClick={toggleLeftPanel}
                    title="Mostrar panel de debates"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}
                {!isLeftPanelCollapsed && (
                  <h2 className="text-lg font-semibold styles.colors.text.primary">Debates</h2>
                )}
              </div>

              {/* Collapsed state - no buttons needed */}

              {!isLeftPanelCollapsed && (
                <div className="flex items-center gap-2">
                  {/* Bulk Actions */}
                  {selectedDebates.size > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setBulkDeleteDialogOpen(true)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      {selectedDebates.size}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn('h-9 w-9 p-0', styles.colors.text.secondary, styles.hoverState())}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Search & Filters */}
            {!isLeftPanelCollapsed && (
              <div className={cn('border-b p-3 flex-shrink-0', styles.colors.border.default, styles.colors.bg.secondary)}>
                <div className="relative">
                  <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', styles.colors.text.secondary)} />
                  <Input
                    type="text"
                    placeholder="Buscar debates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={cn(
                      'h-10 w-full rounded-lg border-0 pl-10 pr-10 focus-visible:ring-1 focus-visible:ring-purple-500',
                      styles.colors.bg.tertiary,
                      styles.colors.text.primary,
                      'placeholder:text-[var(--theme-text-tertiary)]'
                    )}
                  />
                  {search && (
                    <button
                      onClick={handleClearSearch}
                      className={cn('absolute right-3 top-1/2 -translate-y-1/2', styles.colors.text.secondary, styles.hoverState())}
                      title="Limpiar búsqueda"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                {showFilters && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(['all', 'draft', 'in_progress', 'completed'] as const).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={statusFilter === status ? 'default' : 'outline'}
                        className={cn(
                          'h-7 text-xs',
                          statusFilter === status
                            ? 'bg-purple-600 text-white'
                            : cn(styles.colors.border.default, styles.colors.text.secondary, 'hover:bg-[var(--theme-bg-input)]')
                        )}
                        onClick={() => setStatusFilter(status)}
                      >
                        {status === 'all' && 'Todos'}
                        {status === 'draft' && 'Borrador'}
                        {status === 'in_progress' && 'En progreso'}
                        {status === 'completed' && 'Completados'}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Select All */}
                {filteredDebates.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Checkbox
                      checked={selectedDebates.size === filteredDebates.length && filteredDebates.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="h-4 w-4 border-[#aebac1]/60 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <span className="text-xs styles.colors.text.secondary">
                      {selectedDebates.size > 0
                        ? `${selectedDebates.size} seleccionado${selectedDebates.size > 1 ? 's' : ''}`
                        : 'Seleccionar todos'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Debates List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <DebateListSkeleton />
              ) : filteredDebates.length === 0 ? (
                <EmptyDebatesState hasSearch={!!search} />
              ) : isLeftPanelCollapsed ? (
                // Collapsed view - icons only
                filteredDebates.map((debate) => (
                  <DebateListIconOnly
                    key={debate.id}
                    debate={debate}
                    isSelected={selectedDebateId === debate.id}
                    onClick={() => handleDebateClick(debate)}
                  />
                ))
              ) : (
                // Expanded view - full items
                filteredDebates.map((debate) => (
                  <DebateListItem
                    key={debate.id}
                    debate={debate}
                    isSelected={selectedDebateId === debate.id}
                    isCheckboxSelected={selectedDebates.has(debate.id)}
                    showCheckbox={selectedDebates.size > 0}
                    onClick={() => handleDebateClick(debate)}
                    onToggleSelect={(e) => handleToggleSelect(debate.id, e)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Resize Handle */}
        {!isNewDebate && !isLeftPanelCollapsed && (
          <div
            className={cn(
              'absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-500/50 transition-colors z-20 hidden md:block',
              isResizing && 'bg-purple-500',
              `left-[${leftColumnWidth}px]`
            )}
            onMouseDown={startResizing}
          />
        )}

        {/* Main Content - Right Side */}
        <div
          className={cn(
            'flex-1 overflow-hidden flex flex-col',
            !isDebateSelected && !isNewDebate && 'hidden md:flex'
          )}
        >
          {isNewDebate ? (
            children
          ) : selectedDebateId ? (
            <EmbeddedDebateView debateId={selectedDebateId} />
          ) : (
            <EmptyDebateState />
          )}
        </div>
      </div>

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title={`¿Eliminar ${selectedDebates.size} debate${selectedDebates.size > 1 ? 's' : ''}?`}
        description="Esta acción eliminará permanentemente los debates seleccionados. No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleBulkDelete}
        variant="destructive"
        isLoading={deleteDebateMutation.isPending}
      />
      {selectedDebates.size > 0 && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-20 animate-in slide-in-from-bottom-4">
            <div className="fixed bottom-[calc(3vh+1.5rem)] left-1/2 -translate-x-1/2 z-20 animate-in slide-in-from-bottom-4">
          <div className="border styles.colors.border.default styles.colors.bg.secondary/95 backdrop-blur-xl shadow-2xl rounded-lg">
            <div className="flex items-center gap-4 p-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDebates.size === filteredDebates.length && filteredDebates.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="h-5 w-5"
                />
                <span className="styles.colors.text.primary font-medium">
                  {selectedDebates.size} debate{selectedDebates.size > 1 ? 's' : ''} seleccionado{selectedDebates.size > 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-6 w-px bg-[var(--theme-border)]" />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={deleteDebateMutation.isPending}
              >
                {deleteDebateMutation.isPending ? (
                  'Eliminando...'
                ) : (
                  <>
                    <Trash className="mr-2 h-4 w-4" />
                    Eliminar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default function DebatesLayout({ children }: DebatesLayoutProps) {
  return <DebatesLayoutInner>{children}</DebatesLayoutInner>
}
