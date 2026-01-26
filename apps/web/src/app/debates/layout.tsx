'use client'

/**
 * DebatesLayout - Orchestrator Component
 *
 * Layout for the debates section with a resizable sidebar.
 * Shows list of debates on the left, selected debate on the right.
 *
 * All state management is centralized in useDebatesLayout hook.
 */

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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
import { AppHeader } from '@/components/layout/app-header'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useDebatesLayout } from './hooks/use-debates-layout'
import {
  DebateListIconOnly,
  DebateListItem,
  EmptyDebatesState,
  EmptyDebateState,
  DebateListSkeleton,
} from './components'

interface DebatesLayoutProps {
  children: React.ReactNode
}

function DebatesLayoutInner({ children }: DebatesLayoutProps) {
  useRouter() // Keep for future navigation
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
    <div className="flex h-screen flex-col relative bg-[var(--theme-bg-primary)]">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Header Global */}
      <AppHeader variant="app" />

      <div className={cn(
        "relative flex flex-1 overflow-hidden",
        // Solo añadir pt-16 si NO es new-unified (para que el sticky funcione correctamente)
        !isNewDebate && "pt-16"
      )}>
        {/* Debates List - Left Side */}
        {!isNewDebate && (
          <div
            className={cn(
              'relative flex h-full flex-col border-r border-[var(--theme-border)] transition-all duration-300',
              isDebateSelected && 'hidden md:flex',
              isLeftPanelCollapsed && 'overflow-hidden'
            )}
            style={!isLeftPanelCollapsed ? { width: `${leftColumnWidth}px`, minWidth: '300px', maxWidth: '600px' } : { width: '80px' }}
          >
            {/* Subheader */}
            <div className="flex h-[60px] items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] px-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* Collapse/Expand Button */}
                {!isLeftPanelCollapsed ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-input)] hover:text-[var(--theme-text-primary)]"
                    onClick={toggleLeftPanel}
                    title="Ocultar panel de debates"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-input)] hover:text-[var(--theme-text-primary)]"
                    onClick={toggleLeftPanel}
                    title="Mostrar panel de debates"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                )}
                {!isLeftPanelCollapsed && (
                  <h2 className="text-lg font-semibold text-[var(--theme-text-primary)]">Debates</h2>
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
                    className="h-9 w-9 p-0 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-input)] hover:text-[var(--theme-text-primary)]"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Search & Filters */}
            {!isLeftPanelCollapsed && (
              <div className="border-b border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] p-3 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-secondary)]" />
                  <Input
                    type="text"
                    placeholder="Buscar debates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 w-full rounded-lg border-0 bg-[var(--theme-bg-tertiary)] pl-10 pr-10 text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-1 focus-visible:ring-purple-500"
                  />
                  {search && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]"
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
                            : 'border-[var(--theme-border)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-bg-input)]'
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
                    <span className="text-xs text-[var(--theme-text-secondary)]">
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
              isResizing && 'bg-purple-500'
            )}
            style={{ left: `${leftColumnWidth}px` }}
            onMouseDown={startResizing}
          />
        )}

        {/* Main Content - Right Side */}
        <div
          className={cn(
            'flex-1 overflow-hidden',
            !isDebateSelected && !isNewDebate && 'hidden md:flex'
          )}
        >
          {isDebateSelected || isNewDebate ? (
            children
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
    </div>
  )
}

export default function DebatesLayout({ children }: DebatesLayoutProps) {
  return <DebatesLayoutInner>{children}</DebatesLayoutInner>
}
