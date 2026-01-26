'use client'

/**
 * usePersonalization Hook
 *
 * Centralized state management for the personalization section.
 * Handles authentication, profile data, context files, and file uploads.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/error-messages'
import {
  type ProfileData,
  type ContextFileFormData,
  type ContextFile,
  INITIAL_PROFILE_DATA,
  INITIAL_FORM_DATA,
} from '../types'

interface UsePersonalizationOptions {
  isInModal?: boolean
}

export function usePersonalization({ isInModal = false }: UsePersonalizationOptions = {}) {
  const router = useRouter()
  const supabase = createClient()

  // ═══════════════════════════════════════════════════════════
  // AUTH STATE
  // ═══════════════════════════════════════════════════════════
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ═══════════════════════════════════════════════════════════
  // UI STATE
  // ═══════════════════════════════════════════════════════════
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // ═══════════════════════════════════════════════════════════
  // FORM STATE
  // ═══════════════════════════════════════════════════════════
  const [profileData, setProfileData] = useState<ProfileData>(INITIAL_PROFILE_DATA)
  const [formData, setFormData] = useState<ContextFileFormData>(INITIAL_FORM_DATA)

  // ═══════════════════════════════════════════════════════════
  // REFS
  // ═══════════════════════════════════════════════════════════
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quickUploadRef = useRef<HTMLInputElement>(null)
  const saveProfileTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ═══════════════════════════════════════════════════════════
  // AUTH CHECK
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!isInModal) {
          router.push('/login')
        }
        return
      }
      setIsAuthenticated(true)

      // Load profile data from user metadata
      setProfileData({
        nickname: user.user_metadata?.nickname || user.user_metadata?.first_name || '',
        occupation: user.user_metadata?.occupation || user.user_metadata?.role || '',
        about: user.user_metadata?.about || '',
        customInstructions: user.user_metadata?.custom_instructions || '',
      })
    }
    void checkAuth()
  }, [router, supabase.auth, isInModal])

  // ═══════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════
  const { data: files, isLoading, refetch } = api.contextFiles.list.useQuery(
    { activeOnly: false, limit: 100 },
    { enabled: isAuthenticated }
  )

  // ═══════════════════════════════════════════════════════════
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════
  const createFile = api.contextFiles.create.useMutation({
    onSuccess: () => {
      toast.success('Archivo de contexto creado correctamente')
      setIsDialogOpen(false)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.CONTEXT_CREATE))
    },
  })

  const updateFile = api.contextFiles.update.useMutation({
    onSuccess: () => {
      toast.success('Archivo de contexto actualizado correctamente')
      setIsDialogOpen(false)
      setEditingFile(null)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.CONTEXT_UPDATE))
    },
  })

  const deleteFileMutation = api.contextFiles.delete.useMutation({
    onSuccess: () => {
      toast.success('Archivo eliminado')
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.CONTEXT_DELETE))
    },
  })

  const toggleActive = api.contextFiles.toggleActive.useMutation({
    onSuccess: () => {
      void refetch()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, ERROR_MESSAGES.CONTEXT_UPDATE))
    },
  })

  // ═══════════════════════════════════════════════════════════
  // PROFILE SAVE (DEBOUNCED)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isAuthenticated) return

    if (saveProfileTimeoutRef.current) {
      clearTimeout(saveProfileTimeoutRef.current)
    }

    saveProfileTimeoutRef.current = setTimeout(async () => {
      setIsSavingProfile(true)
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            nickname: profileData.nickname,
            occupation: profileData.occupation,
            about: profileData.about,
            custom_instructions: profileData.customInstructions,
          },
        })

        if (error) {
          toast.error('Error al guardar el perfil')
        } else {
          toast.success('Perfil guardado')
        }
      } catch {
        toast.error('Error al guardar el perfil')
      } finally {
        setIsSavingProfile(false)
      }
    }, 800)

    return () => {
      if (saveProfileTimeoutRef.current) {
        clearTimeout(saveProfileTimeoutRef.current)
      }
    }
  }, [profileData, isAuthenticated, supabase.auth])

  // ═══════════════════════════════════════════════════════════
  // FORM HANDLERS
  // ═══════════════════════════════════════════════════════════
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA)
    setEditingFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleEdit = useCallback((file: ContextFile) => {
    setEditingFile(file.id)
    setFormData({
      name: file.name,
      description: file.description || '',
      content: file.content,
      contentType: file.contentType || 'text/plain',
      tags: file.tags || '',
      order: file.order || 0,
    })
    setIsDialogOpen(true)
  }, [])

  const handleCreate = useCallback(() => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Nombre y contenido son requeridos')
      return
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description || undefined,
      content: formData.content.trim(),
      contentType: formData.contentType,
      tags: formData.tags || undefined,
      order: formData.order,
    }

    if (editingFile) {
      updateFile.mutate({
        id: editingFile,
        ...payload,
      })
    } else {
      createFile.mutate(payload)
    }
  }, [formData, editingFile, updateFile, createFile])

  const handleDelete = useCallback((id: string) => {
    setFileToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(() => {
    if (fileToDelete) {
      deleteFileMutation.mutate({ id: fileToDelete })
    }
    setDeleteDialogOpen(false)
    setFileToDelete(null)
  }, [fileToDelete, deleteFileMutation])

  const handleToggleActive = useCallback((id: string, currentStatus: boolean) => {
    toggleActive.mutate({ id, isActive: !currentStatus })
  }, [toggleActive])

  // ═══════════════════════════════════════════════════════════
  // FILE PROCESSING
  // ═══════════════════════════════════════════════════════════
  const processFile = useCallback((uploadedFile: File, autoCreate = true) => {
    if (!uploadedFile.type.startsWith('text/') && !uploadedFile.name.endsWith('.txt') && !uploadedFile.name.endsWith('.md')) {
      toast.error('Solo se permiten archivos de texto (.txt, .md)')
      return
    }

    if (uploadedFile.size > 500000) {
      toast.error('El archivo es demasiado grande. Máximo 500KB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const fileName = uploadedFile.name.replace(/\.[^/.]+$/, '')

      if (autoCreate) {
        createFile.mutate({
          name: fileName,
          content: content,
          contentType: uploadedFile.type || 'text/plain',
          order: 0,
        })
      } else {
        setFormData((prev) => ({
          ...prev,
          content: content,
          name: prev.name || fileName,
          contentType: uploadedFile.type || 'text/plain',
        }))
        toast.success(`Archivo "${uploadedFile.name}" cargado correctamente`)
      }
    }
    reader.onerror = () => {
      toast.error('Error al leer el archivo')
    }
    reader.readAsText(uploadedFile)
  }, [createFile])

  // ═══════════════════════════════════════════════════════════
  // DRAG & DROP HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0]
      if (file) {
        processFile(file, true)
      }
    }
  }, [processFile])

  const handleDropInDialog = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0]
      if (file) {
        processFile(file, false)
      }
    }
  }, [processFile])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return
    processFile(uploadedFile, true)
  }, [processFile])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }, [resetForm])

  return {
    // Auth
    isAuthenticated,

    // Loading
    isLoading,
    isSavingProfile,

    // Data
    files: files as ContextFile[] | undefined,
    profileData,
    setProfileData,
    formData,
    setFormData,

    // Dialog state
    isDialogOpen,
    setIsDialogOpen,
    handleDialogOpenChange,
    editingFile,

    // Delete dialog state
    deleteDialogOpen,
    setDeleteDialogOpen,

    // Drag state
    isDragging,

    // Refs
    fileInputRef,
    quickUploadRef,

    // Mutation states
    isCreating: createFile.isPending,
    isUpdating: updateFile.isPending,
    isDeleting: deleteFileMutation.isPending,
    isTogglingActive: toggleActive.isPending,

    // Handlers
    handleEdit,
    handleCreate,
    handleDelete,
    confirmDelete,
    handleToggleActive,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleDropInDialog,
    handleFileUpload,
    processFile,
  }
}
