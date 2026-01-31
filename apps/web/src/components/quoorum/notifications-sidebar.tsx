'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/trpc/client'
import { cn, styles } from '@/lib/utils'
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
const ACTIVITY_ITEM_TYPES = ['notification', 'debate', 'process'] as const
type ActivityItemType = (typeof ACTIVITY_ITEM_TYPES)[number]

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
          ? cn(styles.colors.border.default, styles.colors.bg.secondary, 'opacity-70')
          : cn(styles.colors.brand.border, styles.colors.bg.secondary, 'cursor-pointer hover:opacity-90'),
        onClick && 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          notification.read ? styles.colors.bg.input : styles.colors.brand.bgSoft
        )}
      >
        <Icon
          className={cn('h-5 w-5', notification.read ? styles.colors.text.tertiary : styles.colors.brand.text)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm font-medium',
              notification.read ? styles.colors.text.tertiary : styles.colors.text.primary
            )}
          >
            {notification.title}
          </h4>
          <span className={cn('shrink-0 text-xs', styles.colors.text.tertiary)}>{timeAgo}</span>
        </div>
        <p className={cn('mt-1 text-sm', styles.colors.text.tertiary)}>{notification.message}</p>

        {notification.debateId && (
          <Button
            variant="link"
            size="sm"
            className={cn('mt-2 h-auto p-0', styles.colors.brand.text)}
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
              className={cn('h-7 text-xs', styles.colors.text.tertiary, styles.hoverState())}
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
            className={cn('h-7 text-xs', styles.colors.text.tertiary, styles.hoverState())}
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

      {!notification.read && <div className={cn('h-2 w-2 shrink-0 rounded-full', styles.colors.brand.bg)} />}
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
        const read = (n as { read?: boolean }).read ?? false
        items.push({
          id: `notification-${n.id}`,
          type: 'notification',
          title: n.title,
          subtitle: n.message,
          createdAt: new Date(n.createdAt),
          data: { ...n, read },
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
        return { label: 'Notificación', icon: Bell, bgColor: styles.colors.brand.bgSoft, textColor: styles.colors.brand.text }
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
              ? cn(styles.colors.border.default, styles.colors.bg.secondary, 'opacity-70')
              : cn(styles.colors.brand.border, styles.colors.bg.secondary, 'hover:bg-[var(--theme-bg-tertiary)] cursor-pointer')
          )}
          onClick={() => !notification.read && onNotificationClick?.(notification)}
        >
          {/* Type Badge */}
          <div className="flex items-center justify-between mb-2">
            <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs', typeBadge.bgColor, typeBadge.textColor)}>
              <TypeIcon className="h-3 w-3" />
              {typeBadge.label}
            </div>
            <span className={cn('text-xs', styles.colors.text.tertiary)}>{timeAgo}</span>
          </div>

          {/* Content */}
          <h4 className={cn('text-sm font-medium', notification.read ? styles.colors.text.tertiary : styles.colors.text.primary)}>
            {notification.title}
          </h4>
          <p className={cn('text-sm mt-1', styles.colors.text.tertiary)}>{notification.message}</p>

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
                className={cn('h-7 text-xs', styles.colors.text.tertiary, styles.hoverState())}
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
              className={cn('h-7 text-xs', styles.colors.text.tertiary, styles.hoverState())}
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
          className={cn(
            'cursor-pointer transition-colors hover:border-purple-500/30',
            styles.colors.border.default,
            styles.colors.bg.secondary
          )}
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
              <span className={cn('text-xs', styles.colors.text.tertiary)}>{timeAgo}</span>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <ContextualIcon className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={cn('text-sm font-medium line-clamp-2', styles.colors.text.primary)}>
                  {debate.metadata?.title || debate.question}
                </h4>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      statusColors[debate.status as keyof typeof statusColors]
                    )}
                  />
                  <span className={cn('text-xs', styles.colors.text.tertiary)}>{item.subtitle}</span>
                  {debate.consensusScore && (
                    <>
                      <span className={styles.colors.text.tertiary}>•</span>
                      <span className={cn('text-xs', styles.colors.text.tertiary)}>
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
            return <Clock className={cn('h-4 w-4', styles.colors.text.tertiary)} />
        }
      }

      return (
        <Card
          key={item.id}
          className={cn(
            'transition-colors hover:border-blue-500/30',
            styles.colors.border.default,
            styles.colors.bg.secondary
          )}
        >
          <CardContent className="p-4">
            {/* Type Badge */}
            <div className="flex items-center justify-between mb-3">
              <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs', typeBadge.bgColor, typeBadge.textColor)}>
                <TypeIcon className="h-3 w-3" />
                {typeBadge.label}
              </div>
              <span className={cn('text-xs', styles.colors.text.tertiary)}>{timeAgo}</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              {getStatusIcon(process.status)}
              <h3 className={cn('font-medium text-sm', styles.colors.text.primary)}>{process.processName}</h3>
            </div>

            {/* Progress Bar */}
            <div>
              <div className={cn('flex items-center justify-between text-xs mb-2', styles.colors.text.secondary)}>
                <span>Fase {process.currentPhase} de {process.totalPhases}</span>
                <span className="font-medium">{process.progressPercent}%</span>
              </div>
              <Progress value={process.progressPercent} className={cn('h-2', styles.colors.bg.input)} />
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
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-md border-l shadow-2xl z-[10001] flex flex-col',
              styles.colors.bg.primary,
              styles.colors.border.default
            )}
          >
            {/* Header */}
            <div className={cn('flex items-center justify-between p-4 border-b', styles.colors.border.default, styles.colors.bg.tertiary)}>
              <div className="flex items-center gap-2">
                <History className={cn('h-5 w-5', styles.colors.text.primary)} />
                <h2 className={cn('text-lg font-semibold', styles.colors.text.primary)}>Centro de Actividad</h2>
                {(unreadCount ?? 0) > 0 && (
                  <Badge className={cn(styles.colors.brand.bg, styles.colors.text.primary)}>{unreadCount}</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className={cn(styles.colors.text.tertiary, styles.hoverState())}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Actions */}
            {(unreadCount ?? 0) > 0 && (
              <div className={cn('px-4 py-2 border-b', styles.colors.border.default)}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                  className={cn(
                    styles.colors.border.default,
                    styles.colors.bg.secondary,
                    styles.colors.text.primary,
                    'hover:bg-[var(--theme-bg-tertiary)]'
                  )}
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
                  <Loader2 className={cn('h-6 w-6 animate-spin', styles.colors.text.tertiary)} />
                </div>
              ) : unifiedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BellOff className={cn('h-12 w-12', styles.colors.text.tertiary)} />
                  <p className={cn('mt-4', styles.colors.text.tertiary)}>No hay actividad reciente</p>
                  <p className={cn('text-sm mt-2', styles.colors.text.tertiary)}>
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
      className={cn('relative rounded-lg p-2 transition-colors', styles.hoverState())}
      title={
        (unreadCount ?? 0) > 0
          ? `${unreadCount} notificación${(unreadCount ?? 0) > 1 ? 'es' : ''} sin leer`
          : 'Notificaciones'
      }
    >
      <History className={cn('h-5 w-5', styles.colors.text.tertiary)} />
      {(unreadCount ?? 0) > 0 && (
        <span className={cn(
          'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium',
          styles.colors.brand.bg,
          styles.colors.text.primary
        )}>
          {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
