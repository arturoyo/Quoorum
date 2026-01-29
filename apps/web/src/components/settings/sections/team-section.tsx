'use client'

import { useState, useEffect } from 'react'
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  UserPlus,
  Loader2,
  Mail,
  MoreVertical,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/trpc/client'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TeamSectionProps {
  isInModal?: boolean
}

export function TeamSection({ isInModal = false }: TeamSectionProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [isInviting, setIsInviting] = useState(false)

  // Fetch team members
  const { data: members = [], isLoading, refetch } = api.teamMembers.list.useQuery()

  // Invite mutation
  const inviteMutation = api.teamMembers.invite.useMutation({
    onSuccess: () => {
      toast.success('Invitación enviada correctamente')
      setIsInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('member')
      void refetch()
    },
    onError: (error) => {
      toast.error('Error al enviar invitación', {
        description: error.message,
      })
      setIsInviting(false)
    },
  })

  // Remove mutation
  const removeMutation = api.teamMembers.remove.useMutation({
    onSuccess: () => {
      toast.success('Miembro eliminado del equipo')
      void refetch()
    },
    onError: (error) => {
      toast.error('Error al eliminar miembro', {
        description: error.message,
      })
    },
  })

  // Update mutation
  const updateMutation = api.teamMembers.update.useMutation({
    onSuccess: () => {
      toast.success('Miembro actualizado correctamente')
      void refetch()
    },
    onError: (error) => {
      toast.error('Error al actualizar miembro', {
        description: error.message,
      })
    },
  })

  const handleInvite = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Por favor, introduce un email válido')
      return
    }

    setIsInviting(true)
    inviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
    })
  }

  const handleRemove = (memberId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar a este miembro del equipo?')) {
      removeMutation.mutate({ id: memberId })
    }
  }

  const handleUpdateRole = (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    updateMutation.mutate({
      id: memberId,
      role: newRole,
    })
  }

  const getStatusBadge = (status: string, isPending: boolean) => {
    if (isPending || status === 'pending') {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Clock className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      )
    }
    if (status === 'active') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Activo
        </Badge>
      )
    }
    if (status === 'inactive') {
      return (
        <Badge className="bg-gray-500/20 text-[var(--theme-text-secondary)] border-gray-500/30">
          Inactivo
        </Badge>
      )
    }
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <XCircle className="h-3 w-3 mr-1" />
        Eliminado
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      owner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      member: 'bg-green-500/20 text-green-400 border-green-500/30',
      viewer: 'bg-gray-500/20 text-[var(--theme-text-secondary)] border-gray-500/30',
    }
    return (
      <Badge className={cn('text-xs', roleColors[role as keyof typeof roleColors] || roleColors.member)}>
        {role === 'owner' ? 'Propietario' : role === 'admin' ? 'Administrador' : role === 'member' ? 'Miembro' : 'Visualizador'}
      </Badge>
    )
  }

  return (
    <div className={cn('space-y-6', isInModal ? 'pb-8' : 'pb-0')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--theme-text-primary)]">Miembros del Equipo</h2>
          <p className="text-sm text-[var(--theme-text-tertiary)] mt-1">
            Gestiona los miembros de tu equipo y sus permisos
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Invitar miembro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
            <DialogHeader>
              <DialogTitle className="text-[var(--theme-text-primary)]">Invitar miembro al equipo</DialogTitle>
              <DialogDescription className="text-[var(--theme-text-secondary)]">
                Envía una invitación por email para añadir un nuevo miembro a tu equipo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail" className="text-[var(--theme-text-primary)]">
                  Email
                </Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-tertiary)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteRole" className="text-[var(--theme-text-primary)]">
                  Rol
                </Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as typeof inviteRole)}>
                  <SelectTrigger
                    id="inviteRole"
                    className="bg-[var(--theme-bg-input)] border-[var(--theme-border)] text-[var(--theme-text-primary)]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
                    <SelectItem value="admin" className="text-[var(--theme-text-primary)] hover:bg-purple-600/20">
                      Administrador
                    </SelectItem>
                    <SelectItem value="member" className="text-[var(--theme-text-primary)] hover:bg-purple-600/20">
                      Miembro
                    </SelectItem>
                    <SelectItem value="viewer" className="text-[var(--theme-text-primary)] hover:bg-purple-600/20">
                      Visualizador
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                className="border-[var(--theme-border)] bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)] hover:bg-purple-600 hover:border-purple-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleInvite}
                disabled={isInviting || inviteMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isInviting || inviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar invitación
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members Table */}
      <Card className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-text-primary)]">Miembros</CardTitle>
          <CardDescription className="text-[var(--theme-text-secondary)]">
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-[var(--theme-text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--theme-text-secondary)] mb-2">No hay miembros en tu equipo</p>
              <p className="text-sm text-[var(--theme-text-tertiary)]">
                Invita a miembros para comenzar a colaborar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--theme-border)] hover:bg-[var(--theme-bg-tertiary)]">
                  <TableHead className="text-[var(--theme-text-secondary)]">Miembro</TableHead>
                  <TableHead className="text-[var(--theme-text-secondary)]">Rol</TableHead>
                  <TableHead className="text-[var(--theme-text-secondary)]">Estado</TableHead>
                  <TableHead className="text-[var(--theme-text-secondary)]">Fecha</TableHead>
                  <TableHead className="text-[var(--theme-text-secondary)] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="border-[var(--theme-border)] hover:bg-[var(--theme-bg-tertiary)]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="bg-purple-600 text-white">
                            {member.name
                              ? member.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)
                              : member.email[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[var(--theme-text-primary)] font-medium">
                            {member.name || 'Sin nombre'}
                          </p>
                          <p className="text-sm text-[var(--theme-text-tertiary)]">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>{getStatusBadge(member.status, member.isPending)}</TableCell>
                    <TableCell className="text-[var(--theme-text-tertiary)]">
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString('es-ES')
                        : member.isPending
                        ? 'Pendiente'
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-primary)]"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[var(--theme-bg-secondary)] border-[var(--theme-border)]"
                          >
                            {member.role !== 'admin' && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'admin')}
                                className="text-[var(--theme-text-primary)] hover:bg-purple-600/20"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Cambiar a Administrador
                              </DropdownMenuItem>
                            )}
                            {member.role !== 'member' && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'member')}
                                className="text-[var(--theme-text-primary)] hover:bg-purple-600/20"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Cambiar a Miembro
                              </DropdownMenuItem>
                            )}
                            {member.role !== 'viewer' && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, 'viewer')}
                                className="text-[var(--theme-text-primary)] hover:bg-purple-600/20"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Cambiar a Visualizador
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleRemove(member.id)}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
