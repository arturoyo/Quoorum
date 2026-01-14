'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  MessageCircle,
  Award,
  Target,
  Clock,
  Zap,
  Link2,
  FileText,
  Bell,
  Loader2,
} from 'lucide-react'

import { api } from '@/lib/trpc/client'
import { ConsensusTrendChart } from './advanced-charts'
import { ReportsViewer } from './reports-viewer'
import { NotificationsCenter } from './notifications-center'
import { SuggestedDealsForForum } from './deal-debate-widget'

export function AnalyticsDashboard() {
  // Fetch real analytics data
  const { isLoading: isLoadingAnalytics } = api.quoorum.analytics.useQuery()
  const { isLoading: isLoadingExperts } = api.quoorum.expertLeaderboard.useQuery()

  // Fetch Phase 4 data (topExperts not used yet - reserved for future feature)
  void api.quoorumFeedback.getTopExperts.useQuery({ limit: 5 })
  const { data: influenceStats } = api.quoorumDeals.getInfluenceStats.useQuery()
  const { data: unreadCount } = api.quoorumNotifications.getUnreadCount.useQuery()

  if (isLoadingAnalytics || isLoadingExperts) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#8696a0]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#e9edef]">Analytics</h2>
        <p className="text-sm text-[#8696a0]">
          Insights sobre debates, expertos y rendimiento del sistema
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap bg-[#202c33]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#00a884]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="experts" className="data-[state=active]:bg-[#00a884]">
            Expertos
          </TabsTrigger>
          <TabsTrigger value="deals" className="data-[state=active]:bg-[#00a884]">
            <Link2 className="mr-1 h-4 w-4" />
            Deals
          </TabsTrigger>
          <TabsTrigger value="quality" className="data-[state=active]:bg-[#00a884]">
            Calidad
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-[#00a884]">
            <FileText className="mr-1 h-4 w-4" />
            Informes
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#00a884]">
            <Bell className="mr-1 h-4 w-4" />
            Notificaciones
            {(unreadCount ?? 0) > 0 && (
              <Badge className="ml-1 bg-red-500 text-xs">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="costs" className="data-[state=active]:bg-[#00a884]">
            Costos
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#8696a0]">Total Debates</CardTitle>
                <MessageCircle className="h-4 w-4 text-[#8696a0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#e9edef]">127</div>
                <p className="text-xs text-[#8696a0]">+12% desde el mes pasado</p>
              </CardContent>
            </Card>

            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#8696a0]">Avg Quality</CardTitle>
                <Award className="h-4 w-4 text-[#8696a0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#e9edef]">85%</div>
                <p className="text-xs text-[#8696a0]">+3% desde el mes pasado</p>
              </CardContent>
            </Card>

            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#8696a0]">Avg Consensus</CardTitle>
                <Target className="h-4 w-4 text-[#8696a0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#e9edef]">78%</div>
                <p className="text-xs text-[#8696a0]">+5% desde el mes pasado</p>
              </CardContent>
            </Card>

            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#8696a0]">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-[#8696a0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#e9edef]">$42.50</div>
                <p className="text-xs text-[#8696a0]">$0.33 por debate</p>
              </CardContent>
            </Card>
          </div>

          {/* Trends Chart Placeholder */}
          <Card className="border-[#2a3942] bg-[#202c33]">
            <CardHeader>
              <CardTitle className="text-[#e9edef]">Tendencias</CardTitle>
              <CardDescription className="text-[#8696a0]">
                Debates y calidad en los últimos 30 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConsensusTrendChart
                data={[
                  { round: 1, consensus: 45, quality: 60 },
                  { round: 2, consensus: 62, quality: 72 },
                  { round: 3, consensus: 78, quality: 85 },
                  { round: 4, consensus: 85, quality: 88 },
                  { round: 5, consensus: 92, quality: 92 },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experts Tab */}
        <TabsContent value="experts" className="space-y-4">
          <Card className="border-[#2a3942] bg-[#202c33]">
            <CardHeader>
              <CardTitle className="text-[#e9edef]">Expert Leaderboard</CardTitle>
              <CardDescription className="text-[#8696a0]">
                Top expertos por rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Patrick Campbell', debates: 45, quality: 92, winRate: 68 },
                  { name: 'April Dunford', debates: 38, quality: 89, winRate: 71 },
                  { name: 'Alex Hormozi', debates: 32, quality: 87, winRate: 65 },
                  { name: 'The Critic', debates: 89, quality: 85, winRate: 0 },
                  { name: 'Rahul Vohra', debates: 28, quality: 84, winRate: 62 },
                ].map((expert, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-[#111b21] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884] font-bold text-white">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-[#e9edef]">{expert.name}</div>
                        <div className="text-xs text-[#8696a0]">{expert.debates} debates</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <div className="text-[#8696a0]">Quality</div>
                        <div className="font-medium text-[#e9edef]">{expert.quality}%</div>
                      </div>
                      <div>
                        <div className="text-[#8696a0]">Win Rate</div>
                        <div className="font-medium text-[#e9edef]">
                          {expert.winRate > 0 ? `${expert.winRate}%` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Best Combinations */}
          <Card className="border-[#2a3942] bg-[#202c33]">
            <CardHeader>
              <CardTitle className="text-[#e9edef]">Mejores Combinaciones</CardTitle>
              <CardDescription className="text-[#8696a0]">
                Expertos que trabajan bien juntos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  {
                    experts: ['Patrick Campbell', 'Alex Hormozi'],
                    quality: 94,
                    debates: 12,
                  },
                  { experts: ['April Dunford', 'Steli Efti'], quality: 91, debates: 8 },
                  { experts: ['Rahul Vohra', 'Lenny Rachitsky'], quality: 89, debates: 6 },
                ].map((combo, idx) => (
                  <div key={idx} className="rounded-lg bg-[#111b21] p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-sm font-medium text-[#e9edef]">
                        {combo.experts.join(' + ')}
                      </div>
                      <div className="text-sm text-[#00a884]">{combo.quality}% quality</div>
                    </div>
                    <div className="text-xs text-[#8696a0]">{combo.debates} debates juntos</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          {/* Deal Influence Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#8696a0]">
                  Debates Vinculados
                </CardTitle>
                <Link2 className="h-4 w-4 text-[#8696a0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#e9edef]">
                  {influenceStats?.total ?? 0}
                </div>
                <p className="text-xs text-[#8696a0]">Total de vínculos debate-deal</p>
              </CardContent>
            </Card>

            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#8696a0]">
                  Influencia Decisiva
                </CardTitle>
                <Target className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {influenceStats?.decisive ?? 0}
                </div>
                <p className="text-xs text-[#8696a0]">Debates que cerraron ventas</p>
              </CardContent>
            </Card>

            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#8696a0]">
                  Recomendaciones Seguidas
                </CardTitle>
                <Award className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">
                  {influenceStats?.recommendationsFollowed ?? 0}
                </div>
                <p className="text-xs text-[#8696a0]">Usuarios siguieron consejos</p>
              </CardContent>
            </Card>

            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#8696a0]">Sin Evaluar</CardTitle>
                <Clock className="h-4 w-4 text-[#8696a0]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#8696a0]">
                  {influenceStats?.unknown ?? 0}
                </div>
                <p className="text-xs text-[#8696a0]">Pendientes de evaluación</p>
              </CardContent>
            </Card>
          </div>

          {/* Suggested Deals */}
          <Card className="border-[#2a3942] bg-[#202c33]">
            <CardHeader>
              <CardTitle className="text-[#e9edef]">Oportunidades Sugeridas</CardTitle>
              <CardDescription className="text-[#8696a0]">
                Deals que podrían beneficiarse de un debate en Forum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SuggestedDealsForForum />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <ReportsViewer showSchedules={true} />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <NotificationsCenter showPreferences={true} />
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-[#8696a0]">
                  Avg Depth Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#e9edef]">82</div>
                <div className="mt-2 h-2 w-full rounded-full bg-[#111b21]">
                  <div className="h-2 w-[82%] rounded-full bg-[#00a884]" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-[#8696a0]">
                  Avg Diversity Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#e9edef]">76</div>
                <div className="mt-2 h-2 w-full rounded-full bg-[#111b21]">
                  <div className="h-2 w-[76%] rounded-full bg-[#00a884]" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-[#8696a0]">
                  Avg Originality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#e9edef]">88</div>
                <div className="mt-2 h-2 w-full rounded-full bg-[#111b21]">
                  <div className="h-2 w-[88%] rounded-full bg-[#00a884]" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#2a3942] bg-[#202c33]">
            <CardHeader>
              <CardTitle className="text-[#e9edef]">Intervenciones del Meta-Moderador</CardTitle>
              <CardDescription className="text-[#8696a0]">
                Frecuencia y tipos de intervenciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { type: 'challenge_depth', count: 23, percentage: 45 },
                  { type: 'force_diversity', count: 18, percentage: 35 },
                  { type: 'prevent_groupthink', count: 10, percentage: 20 },
                ].map((intervention, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#e9edef]">{intervention.type}</span>
                      <span className="text-[#8696a0]">
                        {intervention.count} ({intervention.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#111b21]">
                      <div
                        className="h-2 rounded-full bg-[#00a884]"
                        style={{ width: `${intervention.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader>
                <CardTitle className="text-[#e9edef]">Cost Breakdown</CardTitle>
                <CardDescription className="text-[#8696a0]">Por tipo de debate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { mode: 'Dynamic', cost: 28.5, debates: 85, avg: 0.34 },
                    { mode: 'Static', cost: 14.0, debates: 42, avg: 0.33 },
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-lg bg-[#111b21] p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium text-[#e9edef]">{item.mode}</span>
                        <span className="text-[#00a884]">${item.cost.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-[#8696a0]">
                        {item.debates} debates • ${item.avg.toFixed(2)} avg
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#2a3942] bg-[#202c33]">
              <CardHeader>
                <CardTitle className="text-[#e9edef]">Cache Performance</CardTitle>
                <CardDescription className="text-[#8696a0]">Ahorro por caching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-[#8696a0]">Hit Rate</span>
                      <span className="text-[#e9edef]">42%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#111b21]">
                      <div className="h-2 w-[42%] rounded-full bg-[#00a884]" />
                    </div>
                  </div>
                  <div className="rounded-lg bg-[#111b21] p-3">
                    <div className="mb-1 text-sm text-[#8696a0]">Total Saved</div>
                    <div className="text-2xl font-bold text-[#00a884]">$8.20</div>
                    <div className="text-xs text-[#8696a0]">En los últimos 30 días</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#2a3942] bg-[#202c33]">
            <CardHeader>
              <CardTitle className="text-[#e9edef]">Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  'Consider preloading common questions to improve cache hit rate',
                  'Static mode is cost-effective for simple questions (< complexity 5)',
                  'Enable caching for expert responses to save ~$0.05 per debate',
                ].map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 rounded-lg bg-[#111b21] p-3">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#00a884]" />
                    <span className="text-sm text-[#e9edef]">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
