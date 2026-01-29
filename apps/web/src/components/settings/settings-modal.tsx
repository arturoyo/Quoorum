'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SettingsContent } from './settings-content'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSection?: string
}

/**
 * Settings Modal Component
 * Opens settings in a modal with blur background effect (like manus)
 * Can be opened from any button/link instead of direct navigation
 * 
 * The DialogOverlay already has backdrop-blur-md applied in dialog.tsx
 */
export function SettingsModal({
  open,
  onOpenChange,
  initialSection,
}: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-5xl max-h-[80vh] w-[95vw] sm:w-full overflow-hidden !p-0 bg-[var(--theme-bg-secondary)] text-[var(--theme-text-primary)] backdrop-blur-xl border-[var(--theme-border)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
        )}
      >
        <DialogTitle className="sr-only">Configuración</DialogTitle>
        <DialogDescription className="sr-only">
          Gestiona tu cuenta y configuración
        </DialogDescription>
        <SettingsContent 
          isInModal={true} 
          onClose={() => onOpenChange(false)} 
          initialSection={initialSection}
        />
      </DialogContent>
    </Dialog>
  )
}
