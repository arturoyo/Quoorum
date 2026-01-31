'use client'

/**
 * RAG Analytics Dashboard
 *
 * Shows:
 * - Overall ROI metrics
 * - Usage trends over time
 * - Top performing documents
 * - Recent activity
 * - Quality scores
 */

import { api } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Database,
  Search,
  Sparkles,
  FileText,
  DollarSign,
  Activity,
  Award,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function RAGAnalyticsPage() {
  const { data: dashboard, isLoading: loadingDashboard } = api.ragAnalytics.getDashboard.useQuery()
  const { data: roi, isLoading: loadingROI } = api.ragAnalytics.getROI.useQuery()

  if (loadingDashboard || loadingROI) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const stats = dashboard?.overallStats || {}

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings/rag">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-400" />
              RAG Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Measure the impact and ROI of your document knowledge base
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Documents */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In your knowledge base
            </p>
          </CardContent>
        </Card>

        {/* Debates Enhanced */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Debates Enhanced</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDebatesEnhanced || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With RAG context
            </p>
          </CardContent>
        </Card>

        {/* Avg Quality Score */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgQualityScore
                ? `${(stats.avgQualityScore * 100).toFixed(0)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Context relevance
            </p>
          </CardContent>
        </Card>

        {/* Total Searches */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSearches || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total queries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ROI Card */}
      {roi && (
        <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Return on Investment
            </CardTitle>
            <CardDescription>
              Measuring the value of your RAG system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Avg Satisfaction
                </div>
                <div className="text-3xl font-bold text-purple-300">
                  {roi.avg_satisfaction
                    ? `${roi.avg_satisfaction.toFixed(1)}/5`
                    : 'No data yet'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  User rating after debates
                </p>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Debates Enhanced
                </div>
                <div className="text-3xl font-bold text-blue-300">
                  {roi.debates_enhanced || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Used RAG context
                </p>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Cost
                </div>
                <div className="text-3xl font-bold text-green-300">
                  ${Number(roi.total_cost || 0).toFixed(4)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Embedding costs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Top Performing Documents
          </CardTitle>
          <CardDescription>
            Documents most frequently retrieved in debates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!dashboard?.topDocuments || dashboard.topDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No document performance data yet</p>
              <p className="text-sm">Upload documents and use them in debates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.topDocuments.map((doc, index) => (
                <div
                  key={doc.documentId}
                  className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-medium">{doc.fileName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {doc.retrievals || 0} retrievals • Avg similarity:{' '}
                        {doc.avgSimilarity
                          ? `${(doc.avgSimilarity * 100).toFixed(1)}%`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {doc.relevanceScore && (
                      <Badge className="bg-purple-500/20 text-purple-300">
                        {(doc.relevanceScore * 100).toFixed(0)}% relevance
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Trend */}
      {dashboard?.dailyUsage && dashboard.dailyUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-400" />
              Usage Trend (Last 30 Days)
            </CardTitle>
            <CardDescription>
              Daily RAG search activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.dailyUsage.slice(0, 7).map((day: any) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">
                      {format(new Date(day.date), 'MMM d')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.count} searches
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {day.avg_similarity && (
                      <Badge variant="outline" className="text-xs">
                        {(day.avg_similarity * 100).toFixed(1)}% match
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {dashboard?.recentActivity && dashboard.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest RAG searches and operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.recentActivity.slice(0, 10).map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={
                          activity.eventType === 'debate_injection'
                            ? 'bg-purple-500/20 text-purple-300'
                            : activity.eventType === 'manual_search'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-green-500/20 text-green-300'
                        }
                      >
                        {activity.eventType.replace('_', ' ')}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(activity.createdAt), 'MMM d, HH:mm')}
                      </div>
                    </div>
                    {activity.queryText && (
                      <p className="text-sm text-muted-foreground truncate">
                        "{activity.queryText.substring(0, 100)}"
                      </p>
                    )}
                  </div>
                  {activity.resultsCount !== null && (
                    <Badge variant="secondary">{activity.resultsCount} results</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
