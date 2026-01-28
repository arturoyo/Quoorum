'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertCircle,
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  Clock,
  Loader2,
  type MessageCircle,
  Trash2,
  X,
  TrendingUp,
  History,
  MessageSquare,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getContextualIcon } from '@/lib/icons/contextual-icons'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProcessTimeline } from '@quoorum/db/schema'

// ============================================================================
// Types
// ============================================================================

interface NotificationsSidebarProps {
  isOpen: boolean
  onClose: () => void
  onNotificationClick?: (notification: Notification) => void
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  debateId?: string
  read: boolean
  createdAt: Date
}

// Unified item type for the combined list
type ActivityItemType = 'notification' | 'debate' | 'process'

interface UnifiedActivityItem {
  id: string
  type: ActivityItemType
  title: string
  subtitle?: string
  createdAt: Date
  data: Notification | DebateItem | ProcessTimeline
}

interface DebateItem {
  id: string
  question: string
  status: string
  consensusScore: number | null
  createdAt: Date
  metadata?: {
    title?: string
    tags?: string[]
    topics?: string[]
    areas?: string[]
  }
}

// ============================================================================
// Sub-components
// ============================================================================

const notificationIcons: Record<string, typeof MessageCircle> = {
  debate_completed: CheckCircle2,
  debate_failed: AlertCircle,
  debate_ready: Clock,
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  isMarkingAsRead,
  isDeleting,
}: {
  notification: Notification
  onMarkAsRead: () => void
  onDelete: () => void
  onClick?: () => void
  isMarkingAsRead?: boolean
  isDeleting?: boolean
}) {
  const Icon = notificationIcons[notification.type] || Bell
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-lg border-l-4 p-4 transition-all',
        notification.read
          ? 'border-l-[#8696a0] bg-[#111b21]/50 opacity-70'
          : 'border-l-[#00a884] cursor-pointer bg-[#111b21] hover:bg-[#111b21]/80',
        onClick && 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          notification.read ? 'bg-[#2a3942]' : 'bg-[#00a884]/20'
        )}
      >
        <Icon
          className={cn('h-5 w-5', notification.read ? 'text-[#8696a0]' : 'text-[#00a884]')}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm font-medium',
              notification.read ? 'text-[#8696a0]' : 'text-[#e9edef]'
            )}
          >
            {notification.title}
          </h4>
          <span className="shrink-0 text-xs text-[#8696a0]">{timeAgo}</span>
        </div>
        <p className="mt-1 text-sm text-[#8696a0]">{notification.message}</p>

        {notification.debateId && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto p-0 text-[#00a884]"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            Ver debate →
          </Button>
        )}

        <div className="mt-2 flex items-center gap-2">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead()
              }}
              disabled={isMarkingAsRead}
              className="h-7 text-xs text-[#8696a0] hover:text-[#e9edef]"
            >
              {isMarkingAsRead ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="mr-1 h-3 w-3" />
              )}
              Marcar como leída
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={isDeleting}
            className="h-7 text-xs text-[#8696a0] hover:text-[#e9edef]"
          >
            {isDeleting ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-3 w-3" />
            )}
            Eliminar
          </Button>
        </div>
      </div>

      {!notification.read && <div className="h-2 w-2 shrink-0 rounded-full bg-[#00a884]" />}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function NotificationsSidebar({
  isOpen,
  onClose,
  onNotificationClick,
}: NotificationsSidebarProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check authentication status before making queries
  useEffect(() => {
    let mounted = true
    setIsCheckingAuth(true)

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setIsAuthenticated(!!user)
        setIsCheckingAuth(false)
      }
    })

    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session?.user)
        setIsCheckingAuth(false)
      }
    })

    return () => {
      mounted = false
      subscription.data.subscription.unsubscribe()
    }
  }, [])

  // Aplicar efecto de colapso al contenido principal cuando el sidebar está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sidebar-open')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.classList.remove('sidebar-open')
      document.body.style.overflow = ''
    }

    return () => {
      document.body.classList.remove('sidebar-open')
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Fetch ALL data at once (not conditionally based on tabs)
  const {
    data: notifications,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
  } = api.quoorumNotifications.list.useQuery(
    {
      limit: 50,
      unreadOnly: false,
    },
    {
      enabled: !isCheckingAuth && isAuthenticated && isOpen,
      retry: false,
    }
  )

  const { data: unreadCount } = api.quoorumNotifications.getUnreadCount.useQuery(undefined, {
    enabled: !isCheckingAuth && isAuthenticated && isOpen,
    retry: false,
  })

  const {
    data: debates,
    isLoading: isLoadingDebates,
  } = api.debates.list.useQuery(
    {
      limit: 20,
      offset: 0,
    },
    {
      enabled: !isCheckingAuth && isAuthenticated && isOpen,
      retry: false,
    }
  )

  const {
    data: processes,
    isLoading: isLoadingProcesses,
  } = api.processTimeline.list.useQuery(
    {
      limit: 50,
    },
    {
      enabled: !isCheckingAuth && isAuthenticated && isOpen,
      retry: false,
    }
  )

  // Combine all items into a unified list sorted by date
  const unifiedItems = useMemo<UnifiedActivityItem[]>(() => {
    const items: UnifiedActivityItem[] = []

    // Add notifications
    if (notifications) {
      notifications.forEach((n) => {
        items.push({
          id: `notification-${n.id}`,
          type: 'notification',
          title: n.title,
          subtitle: n.message,
          createdAt: new Date(n.createdAt),
          data: n,
        })
      })
    }

    // Add debates
    if (debates && Array.isArray(debates)) {
      debates.forEach((d) => {
        if (d && d.id) {
          items.push({
            id: `debate-${d.id}`,
            type: 'debate',
            title: (d.metadata as DebateItem['metadata'])?.title || d.question || 'Sin título',
            subtitle: d.status === 'completed' ? 'Completado' : d.status === 'in_progress' ? 'En progreso' : d.status,
            createdAt: new Date(d.createdAt),
            data: d as DebateItem,
          })
        }
      })
    }

    // Add processes
    if (processes) {
      processes.forEach((p) => {
        items.push({
          id: `process-${p.id}`,
          type: 'process',
          title: p.processName,
          subtitle: `Fase ${p.currentPhase} de ${p.totalPhases} (${p.progressPercent}%)`,
          createdAt: new Date(p.startedAt),
          data: p,
        })
      })
    }

    // Sort by date, most recent first
    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [notifications, debates, processes])

  const isLoading = isLoadingNotifications || isLoadingDebates || isLoadingProcesses

  // Mutations
  const markAsRead = api.quoorumNotifications.markAsRead.useMutation({
    onSuccess: () => {
      void refetchNotifications()
    },
  })

  const markAllAsRead = api.quoorumNotifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success('Todas las notificaciones marcadas como leídas')
      void refetchNotifications()
    },
  })

  const deleteNotification = api.quoorumNotifications.archive.useMutation({
    onSuccess: () => {
      void refetchNotifications()
    },
  })

  // Get type badge styling
  const getTypeBadge = (type: ActivityItemType) => {
    switch (type) {
      case 'notification':
        return { label: 'Notificación', icon: Bell, bgColor: 'bg-[#00a884]/20', textColor: 'text-[#00a884]' }
      case 'debate':
        return { label: 'Debate', icon: MessageSquare, bgColor: 'bg-purple-500/20', textColor: 'text-purple-400' }
      case 'process':
        return { label: 'Proceso', icon: TrendingUp, bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' }
    }
  }

  // Render a unified activity item
  const renderActivityItem = (item: UnifiedActivityItem) => {
    const typeBadge = getTypeBadge(item.type)
    const TypeIcon = typeBadge.icon
    const timeAgo = formatDistanceToNow(item.createdAt, {
      addSuffix: true,
      locale: es,
    })

    if (item.type === 'notification') {
      const notification = item.data as Notification
      return (
        <div
          key={item.id}
          className={cn(
            'rounded-lg border p-4 transition-all',
            notification.read
              ? 'border-[#2a3942] bg-[#111b21]/50 opacity-70'
              : 'border-[#00a884]/30 bg-[#111b21] hover:bg-[#111b21]/80 cursor-pointer'
          )}
          onClick={() => !notification.read && onNotificationClick?.(notification)}
        >
          {/* Type Badge */}
          <div className="flex items-center justify-between mb-2">
            <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs', typeBadge.bgColor, typeBadge.textColor)}>
              <TypeIcon className="h-3 w-3" />
              {typeBadge.label}
            </div>
            <span className="text-xs text-[#8696a0]">{timeAgo}</span>
          </div>

          {/* Content */}
          <h4 className={cn('text-sm font-medium', notification.read ? 'text-[#8696a0]' : 'text-white')}>
            {notification.title}
          </h4>
          <p className="text-sm text-[#8696a0] mt-1">{notification.message}</p>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-2">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  markAsRead.mutate({ id: notification.id })
                }}
                disabled={markAsRead.isPending}
                className="h-7 text-xs text-[#8696a0] hover:text-[var(--theme-text-primary)]"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Marcar como leída
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                deleteNotification.mutate({ id: notification.id })
              }}
              disabled={deleteNotification.isPending}
              className="h-7 text-xs text-[#8696a0] hover:text-[var(--theme-text-primary)]"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Eliminar
            </Button>
          </div>
        </div>
      )
    }

    if (item.type === 'debate') {
      const debate = item.data as DebateItem
      const ContextualIcon = getContextualIcon(
        debate.question,
        debate.id,
        debate.metadata?.tags,
        debate.metadata?.topics,
        debate.metadata?.areas
      )
      const statusColors = {
        draft: 'bg-yellow-500',
        pending: 'bg-yellow-500',
        in_progress: 'bg-blue-500',
        completed: 'bg-green-500',
        failed: 'bg-red-500',
      }

      return (
        <Card
          key={item.id}
          className="cursor-pointer border-[#2a3942] bg-[#111b21] hover:border-purple-500/30 transition-colors"
          onClick={() => {
            router.push(`/debates/${debate.id}`)
            onClose()
          }}
        >
          <CardContent className="p-4">
            {/* Type Badge */}
            <div className="flex items-center justify-between mb-2">
              <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs', typeBadge.bgColor, typeBadge.textColor)}>
                <TypeIcon className="h-3 w-3" />
                {typeBadge.label}
              </div>
              <span className="text-xs text-[#8696a0]">{timeAgo}</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <ContextualIcon className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-[var(--theme-text-primary)] line-clamp-2">
                  {debate.metadata?.title || debate.question}
                </h4>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      statusColors[debate.status as keyof typeof statusColors]
                    )}
                  />
                  <span className="text-xs text-[#8696a0]">{item.subtitle}</span>
                  {debate.consensusScore && (
                    <>
                      <span className="text-[#8696a0]">•</span>
                      <span className="text-xs text-[#8696a0]">
                        {Math.round(debate.consensusScore * 100)}% consenso
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (item.type === 'process') {
      const process = item.data as ProcessTimeline
      const getStatusIcon = (status: string) => {
        switch (status) {
          case 'completed':
            return <CheckCircle2 className="h-4 w-4 text-green-500" />
          case 'in_progress':
            return <Clock className="h-4 w-4 text-purple-500" />
          case 'failed':
            return <AlertCircle className="h-4 w-4 text-red-500" />
          default:
            return <Clock className="h-4 w-4 text-[#8696a0]" />
        }
      }

      return (
        <Card key={item.id} className="border-[#2a3942] bg-[#111b21] hover:border-blue-500/30 transition-colors">
          <CardContent className="p-4">
            {/* Type Badge */}
            <div className="flex items-center justify-between mb-3">
              <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs', typeBadge.bgColor, typeBadge.textColor)}>
                <TypeIcon className="h-3 w-3" />
                {typeBadge.label}
              </div>
              <span className="text-xs text-[#8696a0]">{timeAgo}</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon(process.status)}
              <h3 className="text-[var(--theme-text-primary)] font-medium text-sm">{process.processName}</h3>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-[#aebac1] mb-2">
                <span>Fase {process.currentPhase} de {process.totalPhases}</span>
                <span className="font-medium">{process.progressPercent}%</span>
              </div>
              <Progress value={process.progressPercent} className="h-2 bg-[#2a3942]" />
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            data-backdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[10000]"
          />

          {/* Sidebar */}
          <motion.div
            data-sidebar
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0b141a] border-l border-[#2a3942] shadow-2xl z-[10001] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a3942] bg-[#202c33]">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#e9edef]" />
                <h2 className="text-lg font-semibold text-[var(--theme-text-primary)]">Centro de Actividad</h2>
                {(unreadCount ?? 0) > 0 && (
                  <Badge className="bg-[#00a884] text-[var(--theme-text-primary)]">{unreadCount}</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[#8696a0] hover:text-[var(--theme-text-primary)] hover:bg-[#2a3942]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Actions */}
            {(unreadCount ?? 0) > 0 && (
              <div className="px-4 py-2 border-b border-[#2a3942]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  className="border-[#2a3942] bg-[#111b21] text-[#e9edef] hover:bg-[#202c33]"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marcar notificaciones como leídas
                </Button>
              </div>
            )}

            {/* Unified Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
                </div>
              ) : unifiedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BellOff className="h-12 w-12 text-[#8696a0]" />
                  <p className="mt-4 text-[#8696a0]">No hay actividad reciente</p>
                  <p className="text-sm text-[#8696a0] mt-2">
                    Las notificaciones, debates y procesos aparecerán aquí
                  </p>
                </div>
              ) : (
                unifiedItems.map(renderActivityItem)
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Notification Bell (for navbar/header) - Updated to toggle sidebar
// ============================================================================

export function NotificationBell({ onClick, enabled = true }: { onClick?: () => void; enabled?: boolean }) {
  const { data: unreadCount } = api.quoorumNotifications.getUnreadCount.useQuery(undefined, {
    enabled, // Only fetch when authenticated
  })

  return (
    <button
      onClick={onClick}
      className="relative rounded-lg p-2 transition-colors hover:bg-[#2a3942]"
      title={
        (unreadCount ?? 0) > 0
          ? `${unreadCount} notificación${(unreadCount ?? 0) > 1 ? 'es' : ''} sin leer`
          : 'Notificaciones'
      }
    >
      <History className="h-5 w-5 text-[#8696a0]" />
      {(unreadCount ?? 0) > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#00a884] text-xs font-medium text-[var(--theme-text-primary)]">
          {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
