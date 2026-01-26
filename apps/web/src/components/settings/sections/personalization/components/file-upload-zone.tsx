'use client'

/**
 * FileUploadZone Component
 *
 * Drag & drop zone for uploading context files.
 */

import { Upload, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadZoneProps {
  isDragging: boolean
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onClick: () => void
  inputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  variant?: 'default' | 'compact' | 'dialog'
}

export function FileUploadZone({
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onClick,
  inputRef,
  onFileChange,
  variant = 'default',
}: FileUploadZoneProps) {
  if (variant === 'dialog') {
    return (
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ease-in-out',
          isDragging
            ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
            : 'border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] hover:border-purple-500/50 hover:bg-[var(--theme-bg-input)]'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,text/*"
          onChange={onFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className={cn(
            'rounded-full p-3 transition-all duration-200',
            isDragging ? 'bg-purple-500/20 scale-110' : 'bg-purple-500/10'
          )}>
            {isDragging ? (
              <UploadCloud className="h-8 w-8 text-purple-400 animate-pulse" />
            ) : (
              <Upload className="h-8 w-8 text-purple-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--theme-text-primary)] mb-1">
              {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra un archivo o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-[var(--theme-text-tertiary)]">
              Solo archivos de texto (.txt, .md). Máximo 500KB.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Default/compact variant for quick upload zone
  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={cn(
        'mb-6 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ease-in-out',
        isDragging
          ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
          : 'border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] hover:border-purple-500/50 hover:bg-[var(--theme-bg-input)]'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,text/*"
        onChange={onFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <div className={cn(
          'rounded-full p-2 transition-all duration-200',
          isDragging ? 'bg-purple-500/20 scale-110' : 'bg-purple-500/10'
        )}>
          {isDragging ? (
            <UploadCloud className="h-6 w-6 text-purple-400 animate-pulse" />
          ) : (
            <Upload className="h-6 w-6 text-purple-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--theme-text-primary)]">
            {isDragging ? '¡Suelta para subir!' : 'Arrastra archivos aquí para añadirlos rápidamente'}
          </p>
          <p className="text-xs text-[var(--theme-text-tertiary)]">
            O haz clic para seleccionar • Solo .txt, .md • Máx 500KB
          </p>
        </div>
      </div>
    </div>
  )
}
