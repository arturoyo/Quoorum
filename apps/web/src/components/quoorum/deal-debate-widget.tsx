'use client'
// @ts-nocheck

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  Link2,
  Link2Off,
  Loader2,
  MessageCircle,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

interface DealDebateWidgetProps {
  mode: 'deal' | 'debate'
  entityId: string
  onLinkCreated?: () => void
  onLinkRemoved?: () => void
}

interface LinkedDebate {
  link: {
    id: string
    context: string
    influence: string | null
    notes: string | null
    createdAt: Date
  }
  debate: {
    id: string
    question: string
    status: string
    createdAt: Date
  }
}

interface LinkedDeal {
  link: {
    id: string
    context: string
    influence: string | null
    notes: string | null
    createdAt: Date
  }
  deal: {
    id: string
    title: string | null
    value: string | null
    stage: string | null
    clientId: string | null
  }
}

type ContextType =
  | 'pricing_strategy'
  | 'negotiation_tactics'
  | 'objection_handling'
  | 'proposal_review'
  | 'competitor_analysis'
  | 'closing_strategy'
  | 'risk_assessment'
  | 'value_proposition'
  | 'general'

const contextLabels: Record<ContextType, string> = {
  pricing_strategy: 'Estrategia de Precios',
  negotiation_tactics: 'Tácticas de Negociación',
  objection_handling: 'Manejo de Objeciones',
  proposal_review: 'Revisión de Propuesta',
  competitor_analysis: 'Análisis de Competencia',
  closing_strategy: 'Estrategia de Cierre',
  risk_assessment: 'Evaluación de Riesgos',
  value_proposition: 'Propuesta de Valor',
  general: 'General',
}

const influenceLabels: Record<string, { label: string; color: string }> = {
  decisive: { label: 'Decisivo', color: 'bg-green-500' },
  significant: { label: 'Significativo', color: 'bg-blue-500' },
  moderate: { label: 'Moderado', color: 'bg-yellow-500' },
  minimal: { label: 'Mínimo', color: 'bg-orange-500' },
  none: { label: 'Ninguno', color: 'bg-red-500' },
  unknown: { label: 'Sin evaluar', color: 'bg-gray-500' },
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/20 text-green-400',
  running: 'bg-blue-500/20 text-blue-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  failed: 'bg-red-500/20 text-red-400',
}

// ============================================================================
// Sub-components
// ============================================================================

function DebateLinkCard({
  linked,
  onUnlink,
  onUpdateInfluence,
}: {
  linked: LinkedDebate
  onUnlink: () => void
  onUpdateInfluence?: (influence: string) => void
}) {
  const timeAgo = formatDistanceToNow(new Date(linked.debate.createdAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <div className="rounded-lg border border-[#2a3942] bg-[#111b21] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0 text-purple-400" />
            <h4 className="truncate text-sm font-medium text-[#e9edef]">
              {linked.debate.question}
            </h4>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className={cn('text-xs', statusColors[linked.debate.status])}>
              {linked.debate.status === 'completed' ? 'Completado' : linked.debate.status}
            </Badge>
            <Badge variant="outline" className="border-[#2a3942] text-xs text-[#8696a0]">
              {contextLabels[linked.link.context as ContextType]}
            </Badge>
            {linked.link.influence && linked.link.influence !== 'unknown' && (
              <Badge
                className={cn('text-xs text-white', influenceLabels[linked.link.influence]?.color)}
              >
                {influenceLabels[linked.link.influence]?.label}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-xs text-[#8696a0]">{timeAgo}</p>
          {linked.link.notes && (
            <p className="mt-2 text-xs italic text-[#8696a0]">&ldquo;{linked.link.notes}&rdquo;</p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {onUpdateInfluence && linked.debate.status === 'completed' && (
            <Select onValueChange={onUpdateInfluence} value={linked.link.influence ?? 'unknown'}>
              <SelectTrigger className="h-8 w-[120px] border-[#2a3942] bg-[#202c33] text-xs">
                <SelectValue placeholder="Influencia" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(influenceLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onUnlink}
            className="h-8 w-8 p-0 text-[#8696a0] hover:text-red-400"
          >
            <Link2Off className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function DealLinkCard({ linked, onUnlink }: { linked: LinkedDeal; onUnlink: () => void }) {
  return (
    <div className="rounded-lg border border-[#2a3942] bg-[#111b21] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 shrink-0 text-green-400" />
            <h4 className="truncate text-sm font-medium text-[#e9edef]">
              {linked.deal.title ?? 'Oportunidad sin nombre'}
            </h4>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {linked.deal.value && (
              <Badge className="bg-green-500/20 text-xs text-green-400">
                {Number(linked.deal.value).toLocaleString('es-ES', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </Badge>
            )}
            {linked.deal.stage && (
              <Badge variant="outline" className="border-[#2a3942] text-xs text-[#8696a0]">
                {linked.deal.stage}
              </Badge>
            )}
            <Badge variant="outline" className="border-[#2a3942] text-xs text-[#8696a0]">
              {contextLabels[linked.link.context as ContextType]}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnlink}
          className="h-8 w-8 shrink-0 p-0 text-[#8696a0] hover:text-red-400"
        >
          <Link2Off className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function LinkDealDialog({ debateId, onSuccess }: { debateId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [selectedDealId, setSelectedDealId] = useState('')
  const [context, setContext] = useState<ContextType>('general')
  const [notes, setNotes] = useState('')

  const { data: deals, isLoading } = api.quoorumDeals.listDeals.useQuery({ limit: 50 })

  const linkDebate = api.quoorumDeals.linkDebate.useMutation({
    onSuccess: () => {
      toast.success('Debate vinculado correctamente')
      setOpen(false)
      setSelectedDealId('')
      setContext('general')
      setNotes('')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleLink = () => {
    if (!selectedDealId) return
    linkDebate.mutate({
      debateId,
      dealId: selectedDealId,
      context,
      notes: notes || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-[#2a3942] bg-[#111b21] text-[#e9edef]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Vincular Oportunidad
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#2a3942] bg-[#202c33] text-[#e9edef]">
        <DialogHeader>
          <DialogTitle>Vincular Debate a Oportunidad</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            Selecciona una oportunidad de venta para vincular con este debate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Oportunidad</Label>
            <Select value={selectedDealId} onValueChange={setSelectedDealId}>
              <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                <SelectValue placeholder="Seleccionar oportunidad..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  deals?.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{deal.name || deal.title}</span>
                        {deal.stage && (
                          <Badge variant="outline" className="border-[#2a3942] text-xs text-[#8696a0]">
                            {deal.stage}
                          </Badge>
                        )}
                        {deal.value && (
                          <Badge className="bg-green-500/20 text-xs text-green-400">
                            {Number(deal.value).toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contexto</Label>
            <Select value={context} onValueChange={(v) => setContext(v as ContextType)}>
              <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(contextLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="¿Por qué vinculas este debate?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-[#2a3942] bg-[#111b21]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-[#2a3942] bg-[#111b21]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedDealId || linkDebate.isPending}
            className="bg-[#00a884] hover:bg-[#00a884]/90"
          >
            {linkDebate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LinkDebateDialog({ dealId, onSuccess }: { dealId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [selectedDebateId, setSelectedDebateId] = useState('')
  const [context, setContext] = useState<ContextType>('general')
  const [notes, setNotes] = useState('')

  const { data: debates, isLoading } = api.quoorum.list.useQuery(
    { limit: 20, orderBy: 'recent' }
  )

  const linkDebate = api.quoorumDeals.linkDebate.useMutation({
    onSuccess: () => {
      toast.success('Debate vinculado correctamente')
      setOpen(false)
      setSelectedDebateId('')
      setContext('general')
      setNotes('')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleLink = () => {
    if (!selectedDebateId) return
    linkDebate.mutate({
      dealId,
      debateId: selectedDebateId,
      context,
      notes: notes || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-[#2a3942] bg-[#111b21] text-[#e9edef]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Vincular Debate
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#2a3942] bg-[#202c33] text-[#e9edef]">
        <DialogHeader>
          <DialogTitle>Vincular Debate a Oportunidad</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            Selecciona un debate de Quoorum para vincular con esta oportunidad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Debate</Label>
            <Select value={selectedDebateId} onValueChange={setSelectedDebateId}>
              <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                <SelectValue placeholder="Seleccionar debate..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  debates?.map((debate) => (
                    <SelectItem key={debate.id} value={debate.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{debate.question}</span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', statusColors[debate.status])}
                        >
                          {debate.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contexto</Label>
            <Select value={context} onValueChange={(v) => setContext(v as ContextType)}>
              <SelectTrigger className="border-[#2a3942] bg-[#111b21]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(contextLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="¿Por qué vinculas este debate?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-[#2a3942] bg-[#111b21]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-[#2a3942] bg-[#111b21]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedDebateId || linkDebate.isPending}
            className="bg-[#00a884] hover:bg-[#00a884]/90"
          >
            {linkDebate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Recommendations Section
// ============================================================================

function RecommendationsSection({ dealId }: { dealId: string }) {
  const { data: recommendations, isLoading } = api.quoorumDeals.getRecommendations.useQuery({
    dealId,
  })

  const generateRecommendations = api.quoorumDeals.generateRecommendations.useMutation({
    onSuccess: () => {
      toast.success('Recomendaciones generadas')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const dismissRecommendation = api.quoorumDeals.dismissRecommendation.useMutation({
    onSuccess: () => {
      toast.success('Recomendación descartada')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-[#8696a0]" />
      </div>
    )
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#2a3942] p-6 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-[#8696a0]" />
        <p className="mt-2 text-sm text-[#8696a0]">Sin recomendaciones activas</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateRecommendations.mutate({ dealId })}
          disabled={generateRecommendations.isPending}
          className="mt-4 border-[#2a3942] bg-[#111b21] text-[#e9edef]"
        >
          {generateRecommendations.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generar Recomendaciones
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <div key={rec.id} className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-purple-400" />
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    rec.confidence === 'high'
                      ? 'border-green-500 text-green-400'
                      : rec.confidence === 'medium'
                        ? 'border-yellow-500 text-yellow-400'
                        : 'border-[#8696a0] text-[#8696a0]'
                  )}
                >
                  {rec.confidence === 'high'
                    ? 'Alta confianza'
                    : rec.confidence === 'medium'
                      ? 'Media confianza'
                      : 'Baja confianza'}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-[#e9edef]">{rec.recommendation}</p>

              {rec.suggestedActions && Array.isArray(rec.suggestedActions) && (
                <div className="mt-3 space-y-2">
                  {rec.suggestedActions.map(
                    (action: { action: string; priority: string }, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Target className="h-3 w-3 text-[#00a884]" />
                        <span className="text-[#8696a0]">{action.action}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            action.priority === 'high'
                              ? 'border-red-500 text-red-400'
                              : 'border-[#8696a0] text-[#8696a0]'
                          )}
                        >
                          {action.priority}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              )}

              {rec.riskFactors && Array.isArray(rec.riskFactors) && rec.riskFactors.length > 0 && (
                <div className="mt-3 rounded bg-red-500/10 p-2">
                  <div className="flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    Riesgos identificados: {rec.riskFactors.length}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissRecommendation.mutate({ recommendationId: rec.id })}
              className="shrink-0 text-[#8696a0] hover:text-red-400"
            >
              Descartar
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function DealDebateWidget({
  mode,
  entityId,
  onLinkCreated,
  onLinkRemoved,
}: DealDebateWidgetProps) {
  // For deals: show linked debates
  const {
    data: linkedDebates,
    isLoading: loadingDebates,
    refetch: refetchDebates,
  } = api.quoorumDeals.getDebatesByDeal.useQuery({ dealId: entityId })

  // For debates: show linked deals
  const {
    data: linkedDeals,
    isLoading: loadingDeals,
    refetch: refetchDeals,
  } = api.quoorumDeals.getDealsByDebate.useQuery({ debateId: entityId })

  const unlinkDebate = api.quoorumDeals.unlinkDebate.useMutation({
    onSuccess: () => {
      toast.success('Vínculo eliminado')
      if (mode === 'deal') {
        void refetchDebates()
      } else {
        void refetchDeals()
      }
      onLinkRemoved?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateInfluence = api.quoorumDeals.updateInfluence.useMutation({
    onSuccess: () => {
      toast.success('Influencia actualizada')
      void refetchDebates()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleLinkCreated = () => {
    if (mode === 'deal') {
      void refetchDebates()
    } else {
      void refetchDeals()
    }
    onLinkCreated?.()
  }

  const isLoading = mode === 'deal' ? loadingDebates : loadingDeals
  const isEmpty =
    mode === 'deal'
      ? !linkedDebates || linkedDebates.length === 0
      : !linkedDeals || linkedDeals.length === 0

  return (
    <Card className="border-[#2a3942] bg-[#202c33]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#e9edef]">
              <Link2 className="h-5 w-5 text-[#00a884]" />
              {mode === 'deal' ? 'Debates Vinculados' : 'Oportunidades Vinculadas'}
            </CardTitle>
            <CardDescription className="text-[#8696a0]">
              {mode === 'deal'
                ? 'Debates de Quoorum relacionados con esta oportunidad'
                : 'Oportunidades de venta relacionadas con este debate'}
            </CardDescription>
          </div>
          {mode === 'deal' ? (
            <LinkDebateDialog dealId={entityId} onSuccess={handleLinkCreated} />
          ) : (
            <LinkDealDialog debateId={entityId} onSuccess={handleLinkCreated} />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Links Section */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#2a3942] py-8 text-center">
              <Link2Off className="h-10 w-10 text-[#8696a0]" />
              <p className="mt-3 text-sm text-[#8696a0]">
                {mode === 'deal' ? 'Sin debates vinculados' : 'Sin oportunidades vinculadas'}
              </p>
              <p className="text-xs text-[#8696a0]">
                {mode === 'deal'
                  ? 'Vincula debates para obtener insights de ventas'
                  : 'Este debate no está asociado a ninguna oportunidad'}
              </p>
            </div>
          ) : mode === 'deal' ? (
            linkedDebates?.map((linked) => (
              <DebateLinkCard
                key={linked.link.id}
                linked={linked as LinkedDebate}
                onUnlink={() => unlinkDebate.mutate({ linkId: linked.link.id })}
                onUpdateInfluence={(influence) =>
                  updateInfluence.mutate({
                    linkId: linked.link.id,
                    influence: influence as
                      | 'decisive'
                      | 'significant'
                      | 'moderate'
                      | 'minimal'
                      | 'none'
                      | 'unknown',
                  })
                }
              />
            ))
          ) : (
            linkedDeals?.map((linked) => (
              <DealLinkCard
                key={linked.link.id}
                linked={linked as unknown as LinkedDeal}
                onUnlink={() => unlinkDebate.mutate({ linkId: linked.link.id })}
              />
            ))
          )}
        </div>

        {/* Recommendations Section (only for deals) */}
        {mode === 'deal' && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium text-[#e9edef]">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Recomendaciones basadas en Quoorum
            </h3>
            <RecommendationsSection dealId={entityId} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Suggested Deals Section (for Quoorum page)
// ============================================================================

export function SuggestedDealsForForum() {
  const { data: suggestedDeals, isLoading } = api.quoorumDeals.getSuggestedDeals.useQuery({
    limit: 5,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-[#8696a0]" />
      </div>
    )
  }

  if (!suggestedDeals || suggestedDeals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#2a3942] p-6 text-center">
        <CheckCircle className="mx-auto h-8 w-8 text-[#00a884]" />
        <p className="mt-2 text-sm text-[#8696a0]">
          Todas tus oportunidades tienen debates vinculados
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggestedDeals.map((deal) => (
        <div
          key={deal.id}
          className="flex items-center justify-between rounded-lg border border-[#2a3942] bg-[#111b21] p-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 shrink-0 text-green-400" />
              <h4 className="truncate text-sm font-medium text-[#e9edef]">
                {deal.name ?? 'Oportunidad sin nombre'}
              </h4>
            </div>
            <p className="mt-1 text-xs text-purple-400">{deal.suggestion}</p>
            <div className="mt-2 flex items-center gap-2">
              {deal.value && (
                <Badge className="bg-green-500/20 text-xs text-green-400">
                  {Number(deal.value).toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </Badge>
              )}
              {deal.stage && (
                <Badge variant="outline" className="border-[#2a3942] text-xs text-[#8696a0]">
                  {deal.stage}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-purple-500 text-purple-400 hover:bg-purple-500/10"
          >
            <Plus className="mr-1 h-4 w-4" />
            Crear Debate
          </Button>
        </div>
      ))}
    </div>
  )
}
