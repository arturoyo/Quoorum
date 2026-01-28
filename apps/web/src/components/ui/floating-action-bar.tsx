'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

export interface FloatingActionItem {
  /** Action label */
  label: string
  /** Action icon */
  icon?: LucideIcon
  /** Click handler */
  onClick: () => void
  /** Button variant */
  variant?: 'default' | 'destructive' | 'outline'
  /** Whether disabled */
  disabled?: boolean
  /** Whether loading */
  loading?: boolean
}

export interface FloatingActionBarProps {
  /** Actions to display */
  actions: FloatingActionItem[]
  /** Number of selected items */
  selectionCount?: number
  /** Total number of items (for select all) */
  totalCount?: number
  /** Select all callback */
  onSelectAll?: (checked: boolean) => void
  /** Whether all items are selected */
  isAllSelected?: boolean
  /** Show selection checkbox */
  showSelection?: boolean
  /** Whether to show the bar */
  show?: boolean
  /** Additional class names */
  className?: string
}

export function FloatingActionBar({
  actions,
  selectionCount = 0,
  totalCount,
  onSelectAll,
  isAllSelected = false,
  showSelection = true,
  show = true,
  className,
}: FloatingActionBarProps) {
  if (!show || (selectionCount === 0 && showSelection)) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        className
      )}
    >
      <div className="border border-white/20 bg-slate-800/95 backdrop-blur-xl shadow-2xl rounded-lg p-4">
        <div className="flex items-center gap-4">
          {showSelection && (
            <>
              <div className="flex items-center gap-3">
                {onSelectAll && (
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={onSelectAll}
                    className="border-white/30 data-[state=checked]:bg-purple-600"
                  />
                )}
                <span className="text-sm text-white font-medium">
                  {selectionCount} seleccionado{selectionCount !== 1 ? 's' : ''}
                  {totalCount !== undefined && ` de ${totalCount}`}
                </span>
              </div>

              <Separator orientation="vertical" className="h-6 bg-white/20" />
            </>
          )}

          <div className="flex items-center gap-2">
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <Button
                  key={index}
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled || action.loading}
                  className={cn(
                    action.variant === 'destructive'
                      ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                      : 'border-white/20 text-white hover:bg-white/10'
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'h-4 w-4 mr-1.5',
                        action.loading && 'animate-spin'
                      )}
                    />
                  )}
                  {action.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
