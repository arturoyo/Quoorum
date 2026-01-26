/**
 * Costs Section
 * Analytics de costos y uso
 */

'use client'

import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function CostsSection({ isInModal = false }: { isInModal?: boolean }) {
  const { data: analytics, isLoading } = api.admin.getCostAnalytics.useQuery({
    // Last 30 days
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Costos y Analytics</h2>
        <p className="text-sm text-[var(--theme-text-secondary)] mt-1">
          Análisis de costos de debates y uso del sistema
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900/60 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white text-sm">Total Debates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {analytics?.overall.totalDebates || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white text-sm">Costo Total (USD)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                ${(analytics?.overall.totalCostUsd || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white text-sm">Créditos Usados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {(analytics?.overall.totalCreditsUsed || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white text-sm">Costo Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                ${(analytics?.overall.avgCostPerDebate || 0).toFixed(4)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {analytics && analytics.byUser.length > 0 && (
        <Card className="bg-slate-900/60 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Costos por Usuario</CardTitle>
            <CardDescription className="text-[var(--theme-text-secondary)]">
              Top usuarios por costo total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.byUser.slice(0, 10).map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 border border-purple-500/10"
                >
                  <div>
                    <p className="text-white font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${user.totalCostUsd.toFixed(2)}</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">
                      {user.totalDebates} debates
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
