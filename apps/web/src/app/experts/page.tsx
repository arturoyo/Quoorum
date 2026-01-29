'use client'

import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Award,
  Loader2,
  Star,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { cn } from '@/lib/utils'

export default function ExpertsPage() {
  const { data: topExperts, isLoading } = api.quoorumFeedback.getTopExperts.useQuery({ limit: 50 })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Top Expertos</h1>
          <p className="mt-2 text-[var(--theme-text-secondary)]">
            Ranking de expertos basado en valoraciones de usuarios
          </p>
        </div>

        {!topExperts || topExperts.length === 0 ? (
          <Card className="border-white/10 bg-slate-900/60 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-[var(--theme-text-tertiary)]" />
              <p className="mt-4 text-[var(--theme-text-secondary)]">Aún no hay expertos valorados</p>
              <p className="text-sm text-[var(--theme-text-tertiary)]">
                Los expertos aparecerán aquí después de recibir feedback de los usuarios
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topExperts.map((expert, idx) => {
              const avgRating = expert.avgRating ? expert.avgRating / 100 : 0
              const ratingPercent = Math.round(avgRating * 100)

              return (
                <Card
                  key={expert.expertId}
                  className={cn(
                    'border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all hover:border-purple-500/50',
                    idx === 0 && 'border-purple-500/50 ring-2 ring-purple-500/20'
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white',
                            idx === 0
                              ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                              : idx === 1
                                ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                                : idx === 2
                                  ? 'bg-gradient-to-br from-amber-600 to-amber-700'
                                  : 'bg-gradient-to-br from-purple-500 to-blue-500'
                          )}
                        >
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white">
                            {expert.expertId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </CardTitle>
                          <CardDescription className="text-xs text-[var(--theme-text-secondary)]">
                            {expert.totalRatings} valoraciones
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Overall Rating */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[var(--theme-text-secondary)]">Valoración Promedio</span>
                        <span className="text-2xl font-bold text-white">{ratingPercent}%</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-5 w-5',
                              star <= Math.round(avgRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-[var(--theme-text-tertiary)]'
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Detailed Metrics */}
                    {expert.avgInsightfulness && (
                      <div className="space-y-2 rounded-lg bg-slate-800/50 p-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--theme-text-secondary)]">Perspicacia</span>
                          <span className="text-white">
                            {expert.avgInsightfulness ? Math.round(expert.avgInsightfulness / 100) : 0}/5
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--theme-text-secondary)]">Relevancia</span>
                          <span className="text-white">
                            {expert.avgRelevance ? Math.round(expert.avgRelevance / 100) : 0}/5
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--theme-text-secondary)]">Claridad</span>
                          <span className="text-white">
                            {expert.avgClarity ? Math.round(expert.avgClarity / 100) : 0}/5
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--theme-text-secondary)]">Accionabilidad</span>
                          <span className="text-white">
                            {expert.avgActionability ? Math.round(expert.avgActionability / 100) : 0}/5
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sentiment Stats */}
                    <div className="flex items-center gap-4 text-xs">
                      {expert.helpfulCount > 0 && (
                        <div className="flex items-center gap-1 text-green-400">
                          <TrendingUp className="h-3 w-3" />
                          <span>{expert.helpfulCount} útiles</span>
                        </div>
                      )}
                      {expert.followedCount > 0 && (
                        <div className="flex items-center gap-1 text-purple-400">
                          <Award className="h-3 w-3" />
                          <span>{expert.followedCount} seguidos</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
