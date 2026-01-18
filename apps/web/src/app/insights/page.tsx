'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  ArrowLeft,
  MessageCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Lightbulb,
  BarChart3,
  Flame,
  Star,
  Filter,
  X,
  Users,
  Calendar,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react'
import { QuoorumLogo } from '@/components/ui/quoorum-logo'
import { formatRelativeTime, cn } from '@/lib/utils'
import { toast } from 'sonner'

/**
 * Urgency badge colors
 */
const URGENCY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-[#8696a0]/20', text: 'text-[#8696a0]', label: 'Bajo' },
  medium: { bg: 'bg-[#00a884]/20', text: 'text-[#00a884]', label: 'Medio' },
  high: { bg: 'bg-[#f59e0b]/20', text: 'text-[#f59e0b]', label: 'Alto' },
  critical: { bg: 'bg-[#ef4444]/20', text: 'text-[#ef4444]', label: 'Crítico' },
}

/**
 * Response approach icons and labels
 */
const APPROACH_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  empathetic: { icon: MessageCircle, color: '#00a884', label: 'Empático' },
  assertive: { icon: Target, color: '#f59e0b', label: 'Asertivo' },
  consultative: { icon: Lightbulb, color: '#53bdeb', label: 'Consultivo' },
  direct: { icon: TrendingUp, color: '#22c55e', label: 'Directo' },
}

/**
 * Format trigger key to readable label
 */
function formatTrigger(trigger: string): string {
  const labels: Record<string, string> = {
    price_negotiation: 'Negociación Precio',
    competitor_mention: 'Mención Competencia',
    objection_complex: 'Objeción Compleja',
    high_value_client: 'Cliente VIP',
    escalation_risk: 'Riesgo Escalación',
    contract_terms: 'Términos Contrato',
    strategic_decision: 'Decisión Estratégica',
    churn_signal: 'Señal Churn',
  }
  return labels[trigger] || trigger.replace(/_/g, ' ')
}

export default function InsightsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null)
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [triggerFilter, setTriggerFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setIsAuthenticated(true)
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  // Queries
  const { data: consultations, isLoading, refetch } = api.quoorumInsights.getRecent.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  )

  const { data: stats } = api.quoorumInsights.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  })

  const { data: selectedConsultationData, isLoading: loadingDetail } = api.quoorumInsights.getById.useQuery(
    { id: selectedConsultation! },
    { enabled: !!selectedConsultation && isAuthenticated }
  )

  // Mutation
  const rateConsultation = api.quoorumInsights.rate.useMutation({
    onSuccess: () => {
      toast.success('Consulta valorada correctamente')
      void refetch()
      setSelectedConsultation(null)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Filter consultations
  const filteredConsultations = consultations?.filter((consultation) => {
    if (urgencyFilter !== 'all' && consultation.urgency !== urgencyFilter) return false
    if (triggerFilter !== 'all') {
      const triggers = (consultation.triggers as string[]) || []
      if (!triggers.includes(triggerFilter)) return false
    }
    if (ratingFilter !== 'all') {
      // Note: rating is stored in selectedConsultationData, not in getRecent response
      // For now, we'll skip this filter or need to enhance getRecent to include rating
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesMessage = consultation.originalMessage?.toLowerCase().includes(query)
      const matchesClient = consultation.clientName?.toLowerCase().includes(query)
      if (!matchesMessage && !matchesClient) return false
    }
    return true
  })

  // Get unique triggers for filter
  const allTriggers = consultations
    ?.flatMap((c) => (c.triggers as string[]) || [])
    .filter((t, i, arr) => arr.indexOf(t) === i) || []

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg blur-lg opacity-50" />
                  <div className="relative w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600">
                    <QuoorumLogo size={24} showGradient={true} />
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                  Quoorum
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Statistics */}
          <aside className="lg:col-span-1 space-y-4">
            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">Estadísticas</CardTitle>
                <CardDescription className="text-gray-400">Últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Total Consultas</span>
                        <span className="text-2xl font-bold text-white">{stats.totalConsultations}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Confianza Promedio</span>
                        <span className="text-lg font-semibold text-purple-400">
                          {stats.averageConfidence ?? '-'}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Escalaciones Recomendadas</span>
                        <span className="text-lg font-semibold text-red-400">
                          {stats.humanEscalationsRecommended}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Por Urgencia</h4>
                      <div className="space-y-1.5">
                        {Object.entries(stats.urgencyBreakdown).map(([urgency, count]) => {
                          const config = URGENCY_COLORS[urgency] || URGENCY_COLORS.low
                          return (
                            <div key={urgency} className="flex items-center justify-between text-xs">
                              <span className={config.text}>{config.label}</span>
                              <span className="text-white">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {stats.topTriggers.length > 0 && (
                      <div className="pt-4 border-t border-white/10">
                        <h4 className="text-sm font-medium text-gray-400 mb-2">Triggers Frecuentes</h4>
                        <div className="space-y-1.5">
                          {stats.topTriggers.slice(0, 5).map((trigger) => (
                            <div key={trigger.trigger} className="flex items-center justify-between text-xs">
                              <span className="text-gray-300 truncate">
                                {formatTrigger(trigger.trigger)}
                              </span>
                              <span className="text-white">{trigger.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-white">Consultas Forum</h1>
              <p className="mt-2 text-gray-400">
                Historial completo de asesoría estratégica en tus conversaciones
              </p>
            </div>

            {/* Filters */}
            <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">Buscar</Label>
                    <div className="relative">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar en mensajes..."
                        className="border-white/10 bg-slate-800/50 text-white pr-8"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">Urgencia</Label>
                    <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                      <SelectTrigger className="border-white/10 bg-slate-800/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">Trigger</Label>
                    <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                      <SelectTrigger className="border-white/10 bg-slate-800/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {allTriggers.map((trigger) => (
                          <SelectItem key={trigger} value={trigger}>
                            {formatTrigger(trigger)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400 text-sm">Rating</Label>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger className="border-white/10 bg-slate-800/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="rated">Con rating</SelectItem>
                        <SelectItem value="unrated">Sin rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultations List */}
            {!consultations || consultations.length === 0 ? (
              <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BarChart3 className="h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 mb-2">No hay consultas aún</p>
                  <p className="text-sm text-gray-500">
                    Forum te asesora automáticamente en conversaciones complejas
                  </p>
                </CardContent>
              </Card>
            ) : !filteredConsultations || filteredConsultations.length === 0 ? (
              <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Filter className="h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400 mb-2">No se encontraron consultas con estos filtros</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUrgencyFilter('all')
                      setTriggerFilter('all')
                      setRatingFilter('all')
                      setSearchQuery('')
                    }}
                    className="mt-4 border-white/10 bg-slate-800/50 text-white hover:bg-slate-800"
                  >
                    Limpiar Filtros
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredConsultations.map((consultation) => {
                  const urgencyConfig = URGENCY_COLORS[consultation.urgency] || URGENCY_COLORS.low
                  const approachConfig = consultation.responseApproach
                    ? APPROACH_ICONS[consultation.responseApproach]
                    : null

                  return (
                    <Card
                      key={consultation.id}
                      className="border-white/10 bg-slate-900/60 backdrop-blur-xl hover:border-purple-500/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedConsultation(consultation.id)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className="font-medium text-white truncate">
                                  {consultation.clientName || 'Cliente desconocido'}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                  {consultation.originalMessage}
                                </p>
                              </div>
                              <Badge
                                className={cn(
                                  'flex-shrink-0',
                                  urgencyConfig.bg,
                                  urgencyConfig.text
                                )}
                              >
                                {urgencyConfig.label}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {(consultation.triggers as string[])?.map((trigger) => (
                                <Badge
                                  key={trigger}
                                  variant="outline"
                                  className="border-purple-500/30 text-purple-400 text-xs"
                                >
                                  {formatTrigger(trigger)}
                                </Badge>
                              ))}
                              {approachConfig && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    borderColor: `${approachConfig.color}30`,
                                    color: approachConfig.color,
                                  }}
                                >
                                  {approachConfig.label}
                                </Badge>
                              )}
                              {consultation.recommendHumanEscalation && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Escalación
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatRelativeTime(new Date(consultation.createdAt))}</span>
                              </div>
                              {consultation.adviceConfidence !== null &&
                                consultation.adviceConfidence !== undefined && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>{Math.round(consultation.adviceConfidence)}% confianza</span>
                                  </div>
                                )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedConsultation} onOpenChange={(open) => !open && setSelectedConsultation(null)}>
        <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            </div>
          ) : selectedConsultationData ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">Detalle de Consulta</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Asesoría estratégica proporcionada por Forum
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Client Info */}
                <div className="space-y-2">
                  <Label className="text-gray-400">Cliente</Label>
                  <p className="text-white">{selectedConsultationData.clientName || 'Cliente desconocido'}</p>
                </div>

                {/* Original Message */}
                <div className="space-y-2">
                  <Label className="text-gray-400">Mensaje Original</Label>
                  <p className="text-white bg-slate-800/50 p-3 rounded-lg">
                    {selectedConsultationData.originalMessage}
                  </p>
                </div>

                {/* Urgency & Triggers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Urgencia</Label>
                    <Badge
                      className={cn(
                        URGENCY_COLORS[selectedConsultationData.urgency]?.bg,
                        URGENCY_COLORS[selectedConsultationData.urgency]?.text
                      )}
                    >
                      {URGENCY_COLORS[selectedConsultationData.urgency]?.label || 'Bajo'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Triggers</Label>
                    <div className="flex flex-wrap gap-1">
                      {((selectedConsultationData.triggers as string[]) || []).map((trigger) => (
                        <Badge
                          key={trigger}
                          variant="outline"
                          className="border-purple-500/30 text-purple-400 text-xs"
                        >
                          {formatTrigger(trigger)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Strategy & Approach */}
                {selectedConsultationData.strategy && (
                  <div className="space-y-2">
                    <Label className="text-gray-400">Estrategia</Label>
                    <p className="text-white bg-slate-800/50 p-3 rounded-lg">
                      {selectedConsultationData.strategy}
                    </p>
                  </div>
                )}

                {selectedConsultationData.responseApproach && (
                  <div className="space-y-2">
                    <Label className="text-gray-400">Enfoque de Respuesta</Label>
                    {(() => {
                      const approach = APPROACH_ICONS[selectedConsultationData.responseApproach!]
                      if (!approach) return null
                      const Icon = approach.icon
                      return (
                        <Badge
                          variant="outline"
                          className="text-sm py-2 px-4"
                          style={{
                            borderColor: `${approach.color}30`,
                            color: approach.color,
                          }}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {approach.label}
                        </Badge>
                      )
                    })()}
                  </div>
                )}

                {/* Talking Points */}
                {selectedConsultationData.talkingPoints &&
                  (selectedConsultationData.talkingPoints as string[]).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-gray-400">Puntos Clave</Label>
                      <ul className="list-disc list-inside space-y-1 text-white bg-slate-800/50 p-3 rounded-lg">
                        {(selectedConsultationData.talkingPoints as string[]).map((point, idx) => (
                          <li key={idx} className="text-sm">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Risks & Opportunities */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedConsultationData.risksToAddress &&
                    (selectedConsultationData.risksToAddress as string[]).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-gray-400">Riesgos a Abordar</Label>
                        <ul className="list-disc list-inside space-y-1 text-red-400 bg-slate-800/50 p-3 rounded-lg text-sm">
                          {(selectedConsultationData.risksToAddress as string[]).map((risk, idx) => (
                            <li key={idx}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {selectedConsultationData.opportunitiesToLeverage &&
                    (selectedConsultationData.opportunitiesToLeverage as string[]).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-gray-400">Oportunidades</Label>
                        <ul className="list-disc list-inside space-y-1 text-green-400 bg-slate-800/50 p-3 rounded-lg text-sm">
                          {(selectedConsultationData.opportunitiesToLeverage as string[]).map(
                            (opp, idx) => (
                              <li key={idx}>{opp}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>

                {/* Avoid Saying */}
                {selectedConsultationData.avoidSaying &&
                  (selectedConsultationData.avoidSaying as string[]).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-gray-400">Evitar Decir</Label>
                      <ul className="list-disc list-inside space-y-1 text-yellow-400 bg-slate-800/50 p-3 rounded-lg text-sm">
                        {(selectedConsultationData.avoidSaying as string[]).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Negotiation Guidance */}
                {selectedConsultationData.negotiationGuidance && (
                  <div className="space-y-2">
                    <Label className="text-gray-400">Orientación de Negociación</Label>
                    <div className="bg-slate-800/50 p-3 rounded-lg space-y-2 text-sm">
                      {selectedConsultationData.negotiationGuidance.idealOutcome && (
                        <div>
                          <span className="text-green-400 font-medium">Resultado Ideal: </span>
                          <span className="text-white">
                            {selectedConsultationData.negotiationGuidance.idealOutcome}
                          </span>
                        </div>
                      )}
                      {selectedConsultationData.negotiationGuidance.fallbackPosition && (
                        <div>
                          <span className="text-yellow-400 font-medium">Posición de Reserva: </span>
                          <span className="text-white">
                            {selectedConsultationData.negotiationGuidance.fallbackPosition}
                          </span>
                        </div>
                      )}
                      {selectedConsultationData.negotiationGuidance.leveragePoints &&
                        (selectedConsultationData.negotiationGuidance.leveragePoints as string[])
                          .length > 0 && (
                          <div>
                            <span className="text-purple-400 font-medium">Puntos de Apalancamiento: </span>
                            <ul className="list-disc list-inside mt-1 text-white">
                              {(
                                selectedConsultationData.negotiationGuidance.leveragePoints as string[]
                              ).map((point, idx) => (
                                <li key={idx}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Escalation */}
                {selectedConsultationData.recommendHumanEscalation && (
                  <div className="space-y-2">
                    <Label className="text-red-400">Escalación Recomendada</Label>
                    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                      <p className="text-red-400 text-sm">
                        {selectedConsultationData.escalationReason ||
                          'Se recomienda escalar esta consulta a un humano'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  {selectedConsultationData.adviceConfidence !== null && (
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Confianza</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {Math.round(selectedConsultationData.adviceConfidence)}%
                      </div>
                    </div>
                  )}
                  {selectedConsultationData.processingTimeMs && (
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Tiempo</div>
                      <div className="text-lg font-semibold text-white">
                        {selectedConsultationData.processingTimeMs}ms
                      </div>
                    </div>
                  )}
                  {selectedConsultationData.complexityConfidence !== null && (
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Complejidad</div>
                      <div className="text-lg font-semibold text-white">
                        {Math.round((selectedConsultationData.complexityConfidence || 0) * 100)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="pt-4 border-t border-white/10">
                  <Label className="text-gray-400 mb-2 block">Valorar esta consulta</Label>
                  <ConsultationRating
                    consultationId={selectedConsultationData.id}
                    currentRating={selectedConsultationData.userRating || undefined}
                    onRate={(rating, feedback) => {
                      rateConsultation.mutate({
                        id: selectedConsultationData.id,
                        rating,
                        feedback,
                      })
                    }}
                    isPending={rateConsultation.isPending}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Rating component for consultations
 */
function ConsultationRating({
  consultationId,
  currentRating,
  onRate,
  isPending,
}: {
  consultationId: string
  currentRating?: number
  onRate: (rating: number, feedback?: string) => void
  isPending: boolean
}) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | undefined>(currentRating)
  const [feedback, setFeedback] = useState('')

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating)
    onRate(rating, feedback || undefined)
  }

  const displayRating = hoveredRating || selectedRating || 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={isPending}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star
              className={cn(
                'h-8 w-8 transition-colors',
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600 hover:text-yellow-400'
              )}
            />
          </button>
        ))}
        {selectedRating && (
          <span className="ml-2 text-sm text-gray-400">
            {selectedRating === 5
              ? 'Excelente'
              : selectedRating === 4
                ? 'Muy bueno'
                : selectedRating === 3
                  ? 'Bueno'
                  : selectedRating === 2
                    ? 'Regular'
                    : 'Malo'}
          </span>
        )}
      </div>

      {selectedRating && (
        <div className="space-y-2">
          <Label className="text-gray-400 text-sm">Feedback (opcional)</Label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="¿Qué te pareció útil o qué mejoraría?"
            className="border-white/10 bg-slate-800/50 text-white min-h-[80px]"
          />
          {feedback && (
            <Button
              onClick={() => onRate(selectedRating, feedback)}
              disabled={isPending}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Guardar Feedback
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
