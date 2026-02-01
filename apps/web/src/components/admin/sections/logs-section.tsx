/**
 * Logs Section
 * 
 * Sistema de logs integrado en el admin modal
 * Muestra logs del sistema con filtros y estadísticas
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
import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  XCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Trash,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn, styles } from '@/lib/utils'
import { toast } from 'sonner'

const LEVEL_CONFIG = {
  debug: { icon: Bug, color: "styles.colors.text.tertiary", bg: "styles.colors.bg.input" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/20" },
  warn: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/20" },
  fatal: { icon: XCircle, color: "text-purple-400", bg: "bg-purple-500/20" },
}

interface LogsSectionProps {
  isInModal?: boolean
}

export function LogsSection({ isInModal = false }: LogsSectionProps) {
  const [level, setLevel] = useState<string | undefined>()
  const [source, setSource] = useState<string | undefined>()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const limit = 50

  // Query logs
  const { data, isLoading, refetch } = api.systemLogs.list.useQuery(
    {
      limit,
      offset: page * limit,
      level: level as any,
      source: source as any,
      search: search || undefined,
    }
  )

  // Query stats
  const { data: stats } = api.systemLogs.stats.useQuery({})

  // Delete old logs mutation
  const deleteOld = api.systemLogs.deleteOld.useMutation({
    onSuccess: () => {
      toast.success('Logs antiguos eliminados')
      void refetch()
    },
    onError: (error) => {
      toast.error('Error al eliminar logs', {
        description: error.message,
      })
    },
  })

  const handleExport = () => {
    if (!data) return

    const csv = [
      ["Timestamp", "Level", "Source", "Message", "User ID", "Error"],
      ...data.logs.map((log) => [
        format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
        log.level,
        log.source,
        log.message,
        log.userId || "",
        log.errorMessage || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `logs-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    toast.success('Logs exportados correctamente')
  }

  return (
    <div className={cn('space-y-6', isInModal ? 'pb-6' : 'pb-8')}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">System Logs</h2>
        <p className="text-sm styles.colors.text.secondary mt-1">
          Monitoreo en tiempo real de eventos del sistema
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          onClick={() => void refetch()}
          disabled={isLoading}
          className="styles.colors.border.default styles.colors.bg.input text-white hover:bg-purple-600 hover:border-purple-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refrescar
        </Button>
        <Button 
          variant="outline" 
          onClick={handleExport}
          className="styles.colors.border.default styles.colors.bg.input text-white hover:bg-purple-600 hover:border-purple-600"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            deleteOld.mutate({ olderThanDays: 30 })
          }
          disabled={deleteOld.isPending}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Trash className="w-4 h-4 mr-2" />
          Limpiar +30 días
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="styles.colors.bg.secondary styles.colors.border.default">
            <CardContent className="p-4">
              <div className="text-sm styles.colors.text.secondary">Total Logs</div>
              <div className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>

          {stats.byLevel.map((stat) => {
            const config = LEVEL_CONFIG[stat.level];
            const Icon = config.icon;

            return (
              <Card key={stat.level} className="styles.colors.bg.secondary styles.colors.border.default">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <div className="text-sm styles.colors.text.secondary capitalize">
                      {stat.level}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.count.toLocaleString()}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card className="styles.colors.bg.secondary styles.colors.border.default">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="level" className="text-sm font-medium styles.colors.text.secondary mb-2 block">
                Nivel
              </Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger 
                  id="level"
                  className="styles.colors.bg.input styles.colors.border.default text-white"
                >
                  <SelectValue placeholder="Todos los niveles" />
                </SelectTrigger>
                <SelectContent className="styles.colors.bg.secondary styles.colors.border.default">
                  <SelectItem value="all" className="text-white hover:bg-purple-600/20">Todos</SelectItem>
                  <SelectItem value="debug" className="text-white hover:bg-purple-600/20">Debug</SelectItem>
                  <SelectItem value="info" className="text-white hover:bg-purple-600/20">Info</SelectItem>
                  <SelectItem value="warn" className="text-white hover:bg-purple-600/20">Warn</SelectItem>
                  <SelectItem value="error" className="text-white hover:bg-purple-600/20">Error</SelectItem>
                  <SelectItem value="fatal" className="text-white hover:bg-purple-600/20">Fatal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source" className="text-sm font-medium styles.colors.text.secondary mb-2 block">
                Source
              </Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger 
                  id="source"
                  className="styles.colors.bg.input styles.colors.border.default text-white"
                >
                  <SelectValue placeholder="Todos los sources" />
                </SelectTrigger>
                <SelectContent className="styles.colors.bg.secondary styles.colors.border.default">
                  <SelectItem value="all" className="text-white hover:bg-purple-600/20">Todos</SelectItem>
                  <SelectItem value="client" className="text-white hover:bg-purple-600/20">Client</SelectItem>
                  <SelectItem value="server" className="text-white hover:bg-purple-600/20">Server</SelectItem>
                  <SelectItem value="worker" className="text-white hover:bg-purple-600/20">Worker</SelectItem>
                  <SelectItem value="cron" className="text-white hover:bg-purple-600/20">Cron</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search" className="text-sm font-medium styles.colors.text.secondary mb-2 block">
                Buscar
              </Label>
              <Input
                id="search"
                placeholder="Buscar en mensajes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="styles.colors.bg.input styles.colors.border.default text-white placeholder:styles.colors.text.tertiary focus-visible:ring-purple-500 focus-visible:border-purple-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden styles.colors.bg.secondary styles.colors.border.default">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center styles.colors.text.secondary">
              Cargando logs...
            </div>
          ) : data?.logs.length === 0 ? (
            <div className="p-8 text-center styles.colors.text.secondary">
              No se encontraron logs
            </div>
          ) : (
            <div className="divide-y divide-[#2a3942] max-h-[600px] overflow-y-auto">
              {data?.logs.map((log) => {
                const config = LEVEL_CONFIG[log.level];
                const Icon = config.icon;
                const isExpanded = expandedLog === log.id;

                return (
                  <div key={log.id} className="p-4 hover:styles.colors.bg.tertiary transition-colors">
                    <div
                      className="flex items-start gap-4 cursor-pointer"
                      onClick={() =>
                        setExpandedLog(isExpanded ? null : log.id)
                      }
                    >
                      {/* Expand icon */}
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 styles.colors.text.tertiary" />
                        ) : (
                          <ChevronRight className="w-4 h-4 styles.colors.text.tertiary" />
                        )}
                      </div>

                      {/* Level icon */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="capitalize styles.colors.border.default styles.colors.bg.input styles.colors.text.secondary">
                            {log.source}
                          </Badge>
                          <span className="text-xs styles.colors.text.tertiary">
                            {format(new Date(log.createdAt), "PPp", { locale: es })}
                          </span>
                          {log.userId && (
                            <span className="text-xs styles.colors.text.tertiary">
                              User: {log.userId.slice(0, 8)}
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-white font-medium">
                          {log.message}
                        </div>

                        {log.errorMessage && !isExpanded && (
                          <div className="text-xs text-red-400 mt-1 truncate">
                            {log.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="ml-16 mt-4 space-y-3">
                        {log.errorMessage && (
                          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                            <div className="text-xs font-medium text-red-400 mb-1">
                              Error: {log.errorName}
                            </div>
                            <div className="text-xs text-red-300">
                              {log.errorMessage}
                            </div>
                            {log.errorStack && (
                              <pre className="text-xs text-red-300 mt-2 overflow-x-auto">
                                {log.errorStack}
                              </pre>
                            )}
                          </div>
                        )}

                        {log.metadata && (
                          <div className="styles.colors.bg.input border styles.colors.border.default rounded-lg p-3">
                            <div className="text-xs font-medium styles.colors.text.secondary mb-1">
                              Metadata
                            </div>
                            <pre className="text-xs styles.colors.text.tertiary overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm styles.colors.text.secondary">
            Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, data.total)} de {data.total}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="styles.colors.border.default styles.colors.bg.input text-white hover:bg-purple-600 hover:border-purple-600 disabled:opacity-50"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={!data.hasMore}
              className="styles.colors.border.default styles.colors.bg.input text-white hover:bg-purple-600 hover:border-purple-600 disabled:opacity-50"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
