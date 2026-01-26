/**
 * Roles and Permissions Section
 * 
 * CRUD completo de roles administrativos con gestión de permisos
 */

'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Shield,
  Users,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface RolesSectionProps {
  isInModal?: boolean
}

export function RolesSection({ isInModal = false }: RolesSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    permissions: [] as string[],
    isActive: true,
  })

  // Queries
  const { data: roles, isLoading, refetch } = api.adminRoles.list.useQuery({
    includeInactive: false,
  })

  const { data: availablePermissions } = api.adminRoles.getAvailablePermissions.useQuery()

  // Mutations
  const createRole = api.adminRoles.create.useMutation({
    onSuccess: () => {
      toast.success('Rol creado exitosamente')
      setIsCreateDialogOpen(false)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear rol')
    },
  })

  const updateRole = api.adminRoles.update.useMutation({
    onSuccess: () => {
      toast.success('Rol actualizado exitosamente')
      setEditingRole(null)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar rol')
    },
  })

  const deleteRole = api.adminRoles.delete.useMutation({
    onSuccess: () => {
      toast.success('Rol eliminado exitosamente')
      setDeleteDialogOpen(false)
      setRoleToDelete(null)
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar rol')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      permissions: [],
      isActive: true,
    })
  }

  const handleEdit = (roleId: string) => {
    const role = roles?.find((r) => r.id === roleId)
    if (role) {
      setFormData({
        name: role.name,
        slug: role.slug,
        description: role.description || '',
        permissions: (role.permissions as string[]) || [],
        isActive: role.isActive,
      })
      setEditingRole(roleId)
      setIsCreateDialogOpen(true)
    }
  }

  const handleDelete = (roleId: string) => {
    setRoleToDelete(roleId)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.slug) {
      toast.error('Nombre y slug son requeridos')
      return
    }

    if (editingRole) {
      updateRole.mutate({
        roleId: editingRole,
        ...formData,
      })
    } else {
      createRole.mutate(formData)
    }
  }

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Roles y Permisos</h2>
          <p className="text-sm text-[#aebac1] mt-1">
            Gestiona roles administrativos y sus permisos
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setEditingRole(null)
            setIsCreateDialogOpen(true)
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Rol
        </Button>
      </div>

      {/* Roles List */}
      <Card className="bg-[#111b21] border-[#2a3942]">
        <CardHeader>
          <CardTitle className="text-white">Roles Existentes</CardTitle>
          <CardDescription className="text-[#aebac1]">
            {roles?.length || 0} roles configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roles && roles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a3942] hover:bg-[#202c33]">
                  <TableHead className="text-[#aebac1]">Nombre</TableHead>
                  <TableHead className="text-[#aebac1]">Slug</TableHead>
                  <TableHead className="text-[#aebac1]">Permisos</TableHead>
                  <TableHead className="text-[#aebac1]">Usuarios</TableHead>
                  <TableHead className="text-[#aebac1]">Estado</TableHead>
                  <TableHead className="text-[#aebac1]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id} className="border-[#2a3942] hover:bg-[#202c33]">
                    <TableCell className="text-white font-medium">{role.name}</TableCell>
                    <TableCell className="text-[#aebac1]">
                      <code className="text-xs bg-[#2a3942] px-2 py-1 rounded">{role.slug}</code>
                    </TableCell>
                    <TableCell className="text-[#aebac1]">
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions as string[]).length > 0 ? (
                          (role.permissions as string[]).slice(0, 3).map((perm) => (
                            <Badge
                              key={perm}
                              variant="secondary"
                              className="bg-purple-900/20 text-purple-300 border-purple-500/30"
                            >
                              {perm === '*' ? 'Todos' : perm.split('.')[0]}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[#8696a0] text-sm">Sin permisos</span>
                        )}
                        {(role.permissions as string[]).length > 3 && (
                          <Badge variant="secondary" className="bg-[#2a3942] text-[#aebac1]">
                            +{(role.permissions as string[]).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#aebac1]">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {role.userCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={role.isActive ? 'default' : 'secondary'}
                        className={
                          role.isActive
                            ? 'bg-green-900/20 text-green-300 border-green-500/30'
                            : 'bg-[#2a3942] text-[#8696a0]'
                        }
                      >
                        {role.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role.id)}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                          disabled={(role.userCount || 0) > 0}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-[#aebac1]">
              <Shield className="h-12 w-12 mx-auto mb-4 text-[#8696a0]" />
              <p>No hay roles configurados</p>
              <p className="text-sm text-[#8696a0] mt-1">
                Crea tu primer rol para comenzar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#111b21] border-[#2a3942] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
            <DialogDescription className="text-[#aebac1]">
              {editingRole
                ? 'Modifica los detalles del rol y sus permisos'
                : 'Crea un nuevo rol administrativo con permisos personalizados'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#aebac1]">
                Nombre del Rol *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Moderador, Soporte, etc."
                className="bg-[#2a3942] border-[#2a3942] text-white placeholder:text-[#8696a0] focus-visible:ring-purple-500 focus-visible:border-purple-500"
                disabled={!!editingRole}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-[#aebac1]">
                Slug (identificador único) *
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
                }
                placeholder="Ej: moderator, support, etc."
                className="bg-[#2a3942] border-[#2a3942] text-white placeholder:text-[#8696a0] focus-visible:ring-purple-500 focus-visible:border-purple-500"
                disabled={!!editingRole}
              />
              <p className="text-xs text-[#8696a0]">
                Solo letras minúsculas, números y guiones. No se puede cambiar después.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#aebac1]">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el propósito y responsabilidades de este rol..."
                className="bg-[#2a3942] border-[#2a3942] text-white placeholder:text-[#8696a0] focus-visible:ring-purple-500 focus-visible:border-purple-500 min-h-[100px]"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#aebac1]">Permisos</Label>
              <div className="bg-[#2a3942] border border-[#2a3942] rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                {availablePermissions?.permissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`perm-${permission}`}
                      checked={formData.permissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                      className="border-[#2a3942] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <Label
                      htmlFor={`perm-${permission}`}
                      className="text-sm text-white cursor-pointer flex-1"
                    >
                      {permission === '*' ? (
                        <span className="font-semibold text-purple-400">Todos los permisos</span>
                      ) : (
                        permission
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#8696a0]">
                {formData.permissions.length} permiso(s) seleccionado(s)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
                setEditingRole(null)
              }}
              className="border-[#2a3942] bg-[#2a3942] text-white hover:bg-[#202c33]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createRole.isPending || updateRole.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {(createRole.isPending || updateRole.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          if (roleToDelete) {
            deleteRole.mutate({ roleId: roleToDelete })
          }
        }}
        title="Eliminar Rol"
        description="¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  )
}
