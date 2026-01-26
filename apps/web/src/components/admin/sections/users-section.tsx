/**
 * Users Management Section
 * 
 * CRUD completo de usuarios con capacidad de:
 * - Ver lista de usuarios con filtros
 * - Editar créditos, tier, rol
 * - Activar/desactivar usuarios
 * - Ver estadísticas de uso por usuario
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogBody,
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
import { toast } from 'sonner'
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface UsersSectionProps {
  isInModal?: boolean
}

export function UsersSection({ isInModal = false }: UsersSectionProps) {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    credits: 1000,
    tier: 'free' as 'free' | 'starter' | 'pro' | 'business',
    role: 'member' as 'member' | 'admin' | 'super_admin',
  })

  // Queries
  const { data: usersData, isLoading, refetch } = api.admin.listUsers.useQuery({
    limit: 100,
    offset: 0,
    search: search || undefined,
    tier: tierFilter !== 'all' ? (tierFilter as any) : undefined,
    role: roleFilter !== 'all' ? (roleFilter as any) : undefined,
  })

  // Mutations
  const createUser = api.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success('Usuario creado correctamente')
      setIsCreateDialogOpen(false)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear usuario')
    },
  })

  const updateUser = api.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success('Usuario actualizado correctamente')
      setEditingUser(null)
      resetForm()
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar usuario')
    },
  })

  const updateCredits = api.admin.updateUserCredits.useMutation({
    onSuccess: () => {
      toast.success('Créditos actualizados')
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar créditos')
    },
  })

  const updateTier = api.admin.updateUserTier.useMutation({
    onSuccess: () => {
      toast.success('Tier actualizado')
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar tier')
    },
  })

  const updateRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success('Rol actualizado')
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar rol')
    },
  })

  const deleteUser = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success('Usuario desactivado')
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      void refetch()
    },
    onError: (error) => {
      toast.error(error.message || 'Error al desactivar usuario')
    },
  })

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      credits: 1000,
      tier: 'free',
      role: 'member',
    })
    setEditingUser(null)
  }

  const handleEdit = (userId: string) => {
    const user = usersData?.users.find((u) => u.id === userId)
    if (user) {
      setEditingUser(userId)
      setFormData({
        email: user.email,
        name: user.name,
        credits: user.credits,
        tier: user.tier,
        role: user.role as any,
      })
      setIsCreateDialogOpen(true)
    }
  }

  const handleSubmit = () => {
    if (editingUser) {
      updateUser.mutate({
        userId: editingUser,
        ...formData,
      })
    } else {
      createUser.mutate(formData)
    }
  }

  const handleDelete = (userId: string) => {
    setUserToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser.mutate({ userId: userToDelete })
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'business':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'pro':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'starter':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-[var(--theme-text-secondary)] border-gray-500/30'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'admin':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      default:
        return 'bg-gray-500/20 text-[var(--theme-text-secondary)] border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
          <p className="text-sm text-[var(--theme-text-secondary)] mt-1">
            Administra usuarios, créditos, tiers y roles
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsCreateDialogOpen(true)
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/60 border-purple-500/20">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-[var(--theme-text-secondary)]">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--theme-text-secondary)]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Email o nombre..."
                  className="pl-10 bg-slate-800/60 border-purple-500/30 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--theme-text-secondary)]">Tier</Label>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="bg-slate-800/60 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--theme-text-secondary)]">Rol</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="bg-slate-800/60 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setTierFilter('all')
                  setRoleFilter('all')
                }}
                className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
              >
                <Filter className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-900/60 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">
            Usuarios ({usersData?.total || 0})
          </CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            Lista completa de usuarios del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : !usersData?.users || usersData.users.length === 0 ? (
            <div className="text-center py-8 text-[var(--theme-text-secondary)]">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-purple-500/20 hover:bg-purple-500/5">
                    <TableHead className="text-[var(--theme-text-secondary)]">Email</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Nombre</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Créditos</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Tier</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Rol</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Estado</TableHead>
                    <TableHead className="text-[var(--theme-text-secondary)]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-purple-500/10 hover:bg-purple-500/5"
                    >
                      <TableCell className="text-white">{user.email}</TableCell>
                      <TableCell className="text-[var(--theme-text-secondary)]">{user.name}</TableCell>
                      <TableCell className="text-white font-mono">
                        {user.credits.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTierBadgeColor(user.tier)}>
                          {user.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.isActive
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[var(--theme-text-secondary)] hover:text-white"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-purple-500/20">
                            <DropdownMenuItem
                              onClick={() => handleEdit(user.id)}
                              className="text-white hover:bg-purple-500/20"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(user.id)}
                              className="text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Desactivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 border-purple-500/20">
          <DialogHeader className="border-b-0 pb-0">
            <DialogTitle className="text-white">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription className="text-[var(--theme-text-secondary)]">
              {editingUser
                ? 'Modifica la información del usuario'
                : 'Crea un nuevo usuario en el sistema'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--theme-text-secondary)]">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@example.com"
                  className="bg-slate-800/60 border-purple-500/30 text-white"
                  disabled={!!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[var(--theme-text-secondary)]">
                  Nombre *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre completo"
                  className="bg-slate-800/60 border-purple-500/30 text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="credits" className="text-[var(--theme-text-secondary)]">
                  Créditos
                </Label>
                <Input
                  id="credits"
                  type="number"
                  value={formData.credits}
                  onChange={(e) =>
                    setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-800/60 border-purple-500/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier" className="text-[var(--theme-text-secondary)]">
                  Tier
                </Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value: any) => setFormData({ ...formData, tier: value })}
                >
                  <SelectTrigger
                    id="tier"
                    className="bg-slate-800/60 border-purple-500/30 text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-[var(--theme-text-secondary)]">
                  Rol
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger
                    id="role"
                    className="bg-slate-800/60 border-purple-500/30 text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="border-t-0 pt-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}
              className="border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createUser.isPending || updateUser.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {(createUser.isPending || updateUser.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Desactivar Usuario"
        description="¿Estás seguro de que quieres desactivar este usuario? Podrás reactivarlo más tarde."
      />
    </div>
  )
}
