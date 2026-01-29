'use client'

/**
 * ContextFileDialog Component
 *
 * Dialog for creating and editing context files.
 */

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Edit, Loader2, Plus } from 'lucide-react'
import { FileUploadZone } from './file-upload-zone'
import type { ContextFileFormData } from '../types'

interface ContextFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ContextFileFormData
  onFormChange: (data: ContextFileFormData) => void
  onSubmit: () => void
  isEditing: boolean
  isPending: boolean
  // File upload props
  isDragging: boolean
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ContextFileDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  isEditing,
  isPending,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  fileInputRef,
  onFileChange,
}: ContextFileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Crear Archivo
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] backdrop-blur-xl text-[var(--theme-text-primary)] max-w-lg">
        <DialogHeader className="border-b-0 pb-0">
          <DialogTitle className="text-[var(--theme-text-primary)]">
            {isEditing ? 'Editar Archivo de Contexto' : 'Crear Nuevo Archivo de Contexto'}
          </DialogTitle>
          <DialogDescription className="text-[var(--theme-text-secondary)]">
            Añade un archivo de texto que se incluirá automáticamente en tus debates para proporcionar contexto adicional.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[var(--theme-text-primary)]">Nombre *</Label>
            <Input
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="Ej: Documentación Quoorum"
              className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--theme-text-primary)]">Descripción</Label>
            <Input
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="Breve descripción del archivo..."
              className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--theme-text-primary)]">Subir Archivo (opcional)</Label>
            <FileUploadZone
              variant="dialog"
              isDragging={isDragging}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              inputRef={fileInputRef}
              onFileChange={onFileChange}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--theme-text-primary)]">Contenido *</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => onFormChange({ ...formData, content: e.target.value })}
              placeholder="Pega o escribe el contenido del archivo aquí..."
              className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)] min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-[var(--theme-text-tertiary)]">
              {formData.content.length} caracteres
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[var(--theme-text-primary)]">Orden</Label>
              <Input
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => onFormChange({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]"
              />
              <p className="text-xs text-[var(--theme-text-tertiary)]">
                Orden en que se incluyen los archivos (menor = primero)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--theme-text-primary)]">Tags (separados por comas)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => onFormChange({ ...formData, tags: e.target.value })}
                placeholder="Ej: proyecto, landing, estrategia"
                className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)]"
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="border-t-0 pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)] hover:bg-[var(--theme-bg-input)]"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : isEditing ? (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Actualizar
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Crear
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
