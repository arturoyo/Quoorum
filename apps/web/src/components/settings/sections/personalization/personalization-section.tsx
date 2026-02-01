'use client'

/**
 * PersonalizationSection - Orchestrator Component
 *
 * Main component for managing user profile and context files.
 * Uses modular sub-components for clean separation of concerns.
 *
 * All state management is centralized in usePersonalization hook.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, BookOpen, Palette, Building2 } from 'lucide-react'
import { cn, styles } from '@/lib/utils'
import { ThemeToggle, useTheme } from '@/components/theme'
import { usePersonalization } from './hooks/use-personalization'
import {
  ProfileTab,
  CompanyTab,
  ContextFileCard,
  ContextFileDialog,
  FileUploadZone,
  PersonalizationLoadingState,
  EmptyContextFilesState,
} from './components'
import type { PersonalizationSectionProps } from './types'

export function PersonalizationSection({ isInModal = false, initialTab }: PersonalizationSectionProps) {
  const {
    // Loading
    isLoading,
    isSavingProfile,

    // Data
    files,
    profileData,
    setProfileData,
    formData,
    setFormData,

    // Dialog state
    isDialogOpen,
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
    isCreating,
    isUpdating,
    isDeleting,
    isTogglingActive,

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
  } = usePersonalization({ isInModal })

  if (isLoading) {
    return <PersonalizationLoadingState />
  }

  return (
    <div className={cn('space-y-6', isInModal ? 'pb-8' : 'pb-0')}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 styles.colors.text.primary">Perfil</h1>
        <p className="styles.colors.text.secondary">
          Administra tu información personal, empresa y preferencias
        </p>
      </div>

      <Tabs defaultValue={initialTab || "profile"} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 styles.colors.bg.tertiary border styles.colors.border.default">
          <TabsTrigger value="profile" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white styles.colors.text.secondary">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="company" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white styles.colors.text.secondary">
            <Building2 className="mr-2 h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white styles.colors.text.secondary">
            <BookOpen className="mr-2 h-4 w-4" />
            Conocimiento
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white styles.colors.text.secondary">
            <Palette className="mr-2 h-4 w-4" />
            Apariencia
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <ProfileTab
            profileData={profileData}
            onProfileChange={setProfileData}
            isSaving={isSavingProfile}
          />
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6 mt-6">
          <CompanyTab />
        </TabsContent>

        {/* Knowledge Tab (Context Files) */}
        <TabsContent value="knowledge" className="space-y-6 mt-6">
          <div className="flex justify-end mb-4">
            <ContextFileDialog
              open={isDialogOpen}
              onOpenChange={handleDialogOpenChange}
              formData={formData}
              onFormChange={setFormData}
              onSubmit={handleCreate}
              isEditing={!!editingFile}
              isPending={isCreating || isUpdating}
              isDragging={isDragging}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDropInDialog}
              fileInputRef={fileInputRef}
              onFileChange={(e) => {
                const file = e.target.files?.[0]
                if (file) processFile(file, false)
              }}
            />
          </div>

          {/* Quick Upload Zone */}
          <FileUploadZone
            isDragging={isDragging}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => quickUploadRef.current?.click()}
            inputRef={quickUploadRef}
            onFileChange={handleFileUpload}
          />

          {!files || files.length === 0 ? (
            <EmptyContextFilesState onCreateClick={() => handleDialogOpenChange(true)} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {files.map((file) => (
                <ContextFileCard
                  key={file.id}
                  file={file}
                  onEdit={() => handleEdit(file)}
                  onDelete={() => handleDelete(file.id)}
                  onToggleActive={() => handleToggleActive(file.id, file.isActive)}
                  isTogglingActive={isTogglingActive}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          )}

          <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="¿Eliminar archivo?"
            description="Esta acción eliminará permanentemente este archivo de contexto. No se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            onConfirm={confirmDelete}
            variant="destructive"
            isLoading={isDeleting}
          />
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6 mt-6">
          <AppearanceTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Appearance Tab Component
 * Allows users to switch between light, dark, and system themes
 */
function AppearanceTab() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <Card className="styles.colors.bg.secondary styles.colors.border.default">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary">Tema de la Aplicación</CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Selecciona cómo quieres que se vea Quoorum. Puedes elegir entre modo claro, oscuro, o dejar que el sistema decida automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Toggle */}
          <div className="space-y-4">
            <label className="text-sm font-medium styles.colors.text.secondary">
              Modo de visualización
            </label>
            <ThemeToggle showLabels />
          </div>

          {/* Current Theme Info */}
          <div className="pt-4 border-t styles.colors.border.default">
            <p className="text-sm styles.colors.text.tertiary">
              {theme === 'system'
                ? 'El tema se ajusta automáticamente según la configuración de tu sistema operativo.'
                : theme === 'dark'
                  ? 'Modo oscuro activado - Ideal para uso nocturno y reducir fatiga visual.'
                  : 'Modo claro activado - Ideal para ambientes con buena iluminación.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Appearance Options (future expansion) */}
      <Card className="styles.colors.bg.secondary styles.colors.border.default opacity-60">
        <CardHeader>
          <CardTitle className="styles.colors.text.primary">Próximamente</CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            Más opciones de personalización visual estarán disponibles pronto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm styles.colors.text.tertiary">
            <li>• Tamaño de fuente personalizable</li>
            <li>• Colores de acento</li>
            <li>• Densidad de la interfaz</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
