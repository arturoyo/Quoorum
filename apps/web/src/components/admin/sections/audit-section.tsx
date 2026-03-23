/**
 * Audit Section
 * 
 * Logs de auditoría del sistema con filtros y búsqueda
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
  Search,
  Filter,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn, styles } from '@/lib/utils'

interface AuditSectionProps {
  isInModal?: boolean
}

const ACTION_COLORS: Record<string, string> = {
  'deliberation.created': 'bg-blue-900/20 text-blue-300 border-blue-500/30',
  'deliberation.started': 'bg-green-900/20 text-green-300 border-green-500/30',
  'deliberation.completed': 'bg-purple-900/20 text-purple-300 border-purple-500/30',
  'deliberation.cancelled': 'bg-red-900/20 text-red-300 border-red-500/30',
  'round.started': 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30',
  'round.completed': 'bg-green-900/20 text-green-300 border-green-500/30',
  'consensus.reached': 'bg-purple-900/20 text-purple-300 border-purple-500/30',
  'settings.changed': 'bg-orange-900/20 text-orange-300 border-orange-500/30',
}

export function AuditSection({ isInModal = false }: AuditSectionProps) {
  const [actionFilter, setActionFilter] = useState<string | undefined>()
  const [userIdFilter, setUserIdFilter] = useState<string>('')
  const [deliberationIdFilter, setDeliberationIdFilter] = useState<string>('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const limit = 50

  // Query audit logs
  const { data, isLoading, refetch } = api.audit.list.useQuery({
    limit,
    offset: page * limit,
    action: actionFilter as any,
    userId: userIdFilter || undefined,
    deliberationId: deliberationIdFilter || undefined,
  })

  const handleClearFilters = () => {
    setActionFilter(undefined)
    setUserIdFilter('')
    setDeliberationIdFilter('')
    setPage(0)
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
          <h2 className="text-2xl font-bold text-white">Auditoría</h2>
          <p className="text-sm styles.colors.text.secondary mt-1">
            Logs de auditoría del sistema
          </p>
        </div>
        <Button
          onClick={() => void refetch()}
          variant="outline"
          size="sm"
          className="styles.colors.border.default styles.colors.bg.input text-white hover:bg-purple-600 hover:border-purple-600"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="styles.colors.bg.secondary styles.colors.border.default">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action" className="styles.colors.text.secondary">
                Acción
              </Label>
              <Select value={actionFilter || 'all'} onValueChange={(v) => setActionFilter(v === 'all' ? undefined : v)}>
                <SelectTrigger className="styles.colors.bg.input styles.colors.border.default text-white">
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent className="styles.colors.bg.secondary styles.colors.border.default">
                  <SelectItem value="all" className="text-white hover:styles.colors.bg.tertiary">
                    Todas las acciones
                  </SelectItem>
                  <SelectItem value="deliberation.created" className="text-white hover:styles.colors.bg.tertiary">
                    Debate Creado
                  </SelectItem>
                  <SelectItem value="deliberation.started" className="text-white hover:styles.colors.bg.tertiary">
                    Debate Iniciado
                  </SelectItem>
                  <SelectItem value="deliberation.completed" className="text-white hover:styles.colors.bg.tertiary">
                    Debate Completado
                  </SelectItem>
                  <SelectItem value="deliberation.cancelled" className="text-white hover:styles.colors.bg.tertiary">
                    Debate Cancelado
                  </SelectItem>
                  <SelectItem value="round.started" className="text-white hover:styles.colors.bg.tertiary">
                    Ronda Iniciada
                  </SelectItem>
                  <SelectItem value="round.completed" className="text-white hover:styles.colors.bg.tertiary">
                    Ronda Completada
                  </SelectItem>
                  <SelectItem value="consensus.reached" className="text-white hover:styles.colors.bg.tertiary">
                    Consenso Alcanzado
                  </SelectItem>
                  <SelectItem value="settings.changed" className="text-white hover:styles.colors.bg.tertiary">
                    Configuración Cambiada
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId" className="styles.colors.text.secondary">
                User ID
              </Label>
              <Input
                id="userId"
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value)
                  setPage(0)
                }}
                placeholder="Filtrar por usuario..."
                className="styles.colors.bg.input styles.colors.border.default text-white placeholder:styles.colors.text.tertiary focus-visible:ring-purple-500 focus-visible:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliberationId" className="styles.colors.text.secondary">
                Debate ID
              </Label>
              <Input
                id="deliberationId"
                value={deliberationIdFilter}
                onChange={(e) => {
                  setDeliberationIdFilter(e.target.value)
                  setPage(0)
                }}
                placeholder="Filtrar por debate..."
                className="styles.colors.bg.input styles.colors.border.default text-white placeholder:styles.colors.text.tertiary focus-visible:ring-purple-500 focus-visible:border-purple-500"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
              className="styles.colors.border.default styles.colors.bg.input text-white hover:styles.colors.bg.tertiary"
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="styles.colors.bg.secondary styles.colors.border.default">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs de Auditoría
          </CardTitle>
          <CardDescription className="styles.colors.text.secondary">
            {data?.length || 0} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data && data.length > 0 ? (
            <div className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow className="styles.colors.border.default hover:styles.colors.bg.tertiary">
                    <TableHead className="styles.colors.text.secondary w-12"></TableHead>
                    <TableHead className="styles.colors.text.secondary">Fecha</TableHead>
                    <TableHead className="styles.colors.text.secondary">Acción</TableHead>
                    <TableHead className="styles.colors.text.secondary">Usuario</TableHead>
                    <TableHead className="styles.colors.text.secondary">Entidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((log) => {
                    const isExpanded = expandedLog === log.id
                    const actionColor = ACTION_COLORS[log.action] || 'styles.colors.bg.input styles.colors.text.secondary'

                    return (
                      <>
                        <TableRow
                          key={log.id}
                          className="styles.colors.border.default hover:styles.colors.bg.tertiary cursor-pointer"
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 styles.colors.text.secondary" />
                            ) : (
                              <ChevronRight className="h-4 w-4 styles.colors.text.secondary" />
                            )}
                          </TableCell>
                          <TableCell className="text-white">
                            {format(new Date(log.createdAt), 'PPp', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn('border', actionColor)}>
                              {log.action.replace('.', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="styles.colors.text.secondary">
                            {log.userId ? (
                              <code className="text-xs styles.colors.bg.input px-2 py-1 rounded">
                                {log.userId.substring(0, 8)}...
                              </code>
                            ) : (
                              <span className="styles.colors.text.tertiary">Sistema</span>
                            )}
                          </TableCell>
                          <TableCell className="styles.colors.text.secondary">
                            {log.entityType && log.entityId ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{log.entityType}</span>
                                <code className="text-xs styles.colors.bg.input px-2 py-1 rounded">
                                  {log.entityId.substring(0, 8)}...
                                </code>
                              </div>
                            ) : (
                              <span className="styles.colors.text.tertiary">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="styles.colors.border.default styles.colors.bg.primary">
                            <TableCell colSpan={5} className="p-4">
                              <div className="space-y-3 text-sm">
                                <div>
                                  <Label className="styles.colors.text.secondary text-xs">Detalles:</Label>
                                  <pre className="mt-1 p-3 styles.colors.bg.input rounded styles.colors.text.secondary text-xs overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                                {log.ipAddress && (
                                  <div>
                                    <Label className="styles.colors.text.secondary text-xs">IP:</Label>
                                    <span className="ml-2 text-white">{log.ipAddress}</span>
                                  </div>
                                )}
                                {log.userAgent && (
                                  <div>
                                    <Label className="styles.colors.text.secondary text-xs">User Agent:</Label>
                                    <span className="ml-2 text-white text-xs">{log.userAgent}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="styles.colors.border.default styles.colors.bg.input text-white hover:styles.colors.bg.tertiary disabled:opacity-50"
                >
                  Anterior
                </Button>
                <span className="text-sm styles.colors.text.secondary">
                  Página {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data || data.length < limit}
                  className="styles.colors.border.default styles.colors.bg.input text-white hover:styles.colors.bg.tertiary disabled:opacity-50"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 styles.colors.text.secondary">
              <FileText className="h-12 w-12 mx-auto mb-4 styles.colors.text.tertiary" />
              <p>No se encontraron logs de auditoría</p>
              <p className="text-sm styles.colors.text.tertiary mt-1">
                Los logs aparecerán aquí cuando haya actividad en el sistema
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
