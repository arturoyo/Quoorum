'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trophy, TrendingUp, DollarSign, Clock, Target, AlertCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface FrictionScore {
  personaId: string
  personaName: string
  variantIndex: number
  frictionScore: number
  rejectionArgument: string
  alignment: {
    jobsToBeDone: number
    barrierReduction: number
  }
}

interface SimulationResult {
  winningVariant: {
    index: number
    text: string
    consensusScore: number
    avgFriction: number
  }
  frictionMap: FrictionScore[]
  synthesis: string
  costBreakdown: {
    evaluationCost: number
    synthesisCost: number
    totalCost: number
    totalTokens: number
  }
  executionTime: number
}

interface Persona {
  id: string
  name: string
}

interface SimulationResultsProps {
  result: SimulationResult
  personas: Persona[]
  variants: string[]
}

export function SimulationResults({ result, personas, variants }: SimulationResultsProps) {
  const { winningVariant, frictionMap, synthesis, costBreakdown, executionTime } = result

  // Group friction scores by variant
  const variantScores = variants.map((_, variantIndex) => {
    const scores = frictionMap.filter(f => f.variantIndex === variantIndex)
    const avgFriction = scores.reduce((sum, s) => sum + s.frictionScore, 0) / scores.length
    return { variantIndex, scores, avgFriction }
  })

  const getFrictionColor = (score: number) => {
    if (score <= 3) return 'text-green-400 bg-green-500/20 border-green-500/30'
    if (score <= 6) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
    return 'text-red-400 bg-red-500/20 border-red-500/30'
  }

  const getFrictionLabel = (score: number) => {
    if (score <= 3) return 'Baja fricción'
    if (score <= 6) return 'Fricción moderada'
    return 'Alta fricción'
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-400" />
              Variante Ganadora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">#{winningVariant.index + 1}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Score: {winningVariant.consensusScore.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-400" />
              Fricción Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winningVariant.avgFriction.toFixed(1)}/10</div>
            <p className="text-xs text-muted-foreground mt-1">
              {getFrictionLabel(winningVariant.avgFriction)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              Coste Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${costBreakdown.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {costBreakdown.totalTokens.toLocaleString()} tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(executionTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground mt-1">Evaluación completa</p>
          </CardContent>
        </Card>
      </div>

      {/* Synthesis */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Síntesis de IA
          </CardTitle>
          <CardDescription>Análisis global de las variantes evaluadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            <p className="text-sm whitespace-pre-wrap">{synthesis}</p>
          </div>
        </CardContent>
      </Card>

      {/* Variant comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativa de Variantes</CardTitle>
          <CardDescription>
            Fricción mental evaluada por {personas.length} Buyer Personas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {variantScores.map(({ variantIndex, scores, avgFriction }) => {
            const isWinner = variantIndex === winningVariant.index

            return (
              <div key={variantIndex}>
                <div className="flex items-start gap-4">
                  {/* Variant badge */}
                  <div className="flex-shrink-0">
                    <Badge
                      className={`
                        ${isWinner ? 'bg-purple-500/20 text-purple-300 border-purple-500' : 'bg-white/10 text-white/70'}
                      `}
                    >
                      Variante #{variantIndex + 1}
                      {isWinner && ' (Ganadora)'}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Variant text */}
                    <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                      <p className="text-sm">{variants[variantIndex]}</p>
                    </div>

                    {/* Average friction */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Fricción promedio:</span>
                      <Badge className={getFrictionColor(avgFriction)}>
                        {avgFriction.toFixed(1)}/10
                      </Badge>
                    </div>

                    {/* Persona evaluations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <TooltipProvider>
                        {scores.map(score => (
                          <Tooltip key={`${score.personaId}-${variantIndex}`}>
                            <TooltipTrigger asChild>
                              <div
                                className={`
                                  flex items-center gap-3 p-3 rounded-lg border cursor-help
                                  ${getFrictionColor(score.frictionScore)}
                                `}
                              >
                                {/* Avatar with indicator */}
                                <div className="relative">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-xs font-medium">
                                    {score.personaName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div
                                    className={`
                                      absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black
                                      ${score.frictionScore <= 4 ? 'bg-green-500' : 'bg-red-500'}
                                    `}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{score.personaName}</p>
                                  <p className="text-xs opacity-70">Fricción: {score.frictionScore}/10</p>
                                </div>

                                {score.frictionScore <= 4 ? (
                                  <div className="text-green-400 text-xs">✓</div>
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-400" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <div className="space-y-2">
                                <div>
                                  <p className="font-medium text-xs text-purple-300">Argumento de Rechazo:</p>
                                  <p className="text-xs mt-1">{score.rejectionArgument}</p>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <p className="text-muted-foreground">JTBD Alignment:</p>
                                    <p className="font-medium">{score.alignment.jobsToBeDone}/10</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Barrier Reduction:</p>
                                    <p className="font-medium">{score.alignment.barrierReduction}/10</p>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  </div>
                </div>

                {variantIndex < variantScores.length - 1 && <Separator className="my-6" />}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Cost breakdown */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="text-sm">Desglose de Costes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Evaluaciones ({frictionMap.length}):</span>
              <span className="font-medium">${costBreakdown.evaluationCost.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Síntesis final:</span>
              <span className="font-medium">${costBreakdown.synthesisCost.toFixed(4)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span className="text-green-400">${costBreakdown.totalCost.toFixed(4)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
