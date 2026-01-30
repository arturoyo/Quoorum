'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

interface NotificationsCenterProps {
  onNotificationClick?: (notification: Notification) => void
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  debateId?: string | null
  read?: boolean
  createdAt: Date
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
          : cn(styles.colors.brand.border, styles.colors.bg.secondary, 'cursor-pointer hover:bg-[var(--theme-bg-tertiary)]'),
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

export function NotificationsCenter({ onNotificationClick }: NotificationsCenterProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')

  const {
    data: notifications,
    isLoading,
    refetch,
  } = api.quoorumNotifications.list.useQuery({
    limit: 50,
    unreadOnly: activeTab === 'unread',
  })

  const normalizedNotifications: Notification[] = (notifications ?? []).map((notification) => ({
    ...notification,
    read: (notification as { read?: boolean }).read ?? false,
  }))

  const { data: unreadCount } = api.quoorumNotifications.getUnreadCount.useQuery()

  const markAsRead = api.quoorumNotifications.markAsRead.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  const markAllAsRead = api.quoorumNotifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success('Todas las notificaciones marcadas como leídas')
      void refetch()
    },
  })

  const deleteNotification = api.quoorumNotifications.archive.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  const clearAll = api.quoorumNotifications.archiveAllRead.useMutation({
    onSuccess: () => {
      toast.success('Todas las notificaciones archivadas')
      void refetch()
    },
  })

  return (
    <Card className={cn(styles.colors.border.default, styles.colors.bg.tertiary)}>
      <CardHeader className={cn('border-b', styles.colors.border.default)}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={cn('flex items-center gap-2', styles.colors.text.primary)}>
              <Bell className="h-5 w-5" />
              Notificaciones
              {(unreadCount ?? 0) > 0 && (
                <Badge className={cn(styles.colors.brand.bg, styles.colors.text.primary)}>{unreadCount}</Badge>
              )}
            </CardTitle>
            <CardDescription className={styles.colors.text.tertiary}>
              Centro de notificaciones de debates
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(unreadCount ?? 0) > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className={cn(styles.colors.border.default, styles.colors.bg.secondary, styles.colors.text.primary)}
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Marcar todo como leído
              </Button>
            )}
            {notifications && notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearAll.mutate()}
                disabled={clearAll.isPending}
                className={cn(styles.colors.border.default, styles.colors.bg.secondary, styles.colors.text.primary)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpiar todo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className={cn('w-full justify-start rounded-none border-b bg-transparent p-0', styles.colors.border.default)}>
          <TabsTrigger
            value="all"
            className={cn(
              'rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:bg-transparent',
              styles.colors.text.tertiary,
              'data-[state=active]:border-[#00a884] data-[state=active]:text-[#e9edef]'
            )}
          >
            Todas
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className={cn(
              'rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:bg-transparent',
              styles.colors.text.tertiary,
              'data-[state=active]:border-[#00a884] data-[state=active]:text-[#e9edef]'
            )}
          >
            Sin leer
            {(unreadCount ?? 0) > 0 && (
              <span className={cn('ml-2 rounded-full px-2 py-0.5 text-xs', styles.colors.brand.bg, styles.colors.text.primary)}>
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <CardContent className="p-4">
          <TabsContent value="all" className="m-0 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={cn('h-6 w-6 animate-spin', styles.colors.text.tertiary)} />
              </div>
            ) : normalizedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BellOff className={cn('h-12 w-12', styles.colors.text.tertiary)} />
                <p className={cn('mt-4', styles.colors.text.tertiary)}>No hay notificaciones</p>
              </div>
            ) : (
              <>
                {normalizedNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead.mutate({ id: notification.id })}
                    onDelete={() => deleteNotification.mutate({ id: notification.id })}
                    onClick={() => onNotificationClick?.(notification)}
                    isMarkingAsRead={markAsRead.isPending}
                    isDeleting={deleteNotification.isPending}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="unread" className="m-0 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className={cn('h-6 w-6 animate-spin', styles.colors.text.tertiary)} />
              </div>
            ) : normalizedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className={cn('h-12 w-12', styles.colors.brand.text)} />
                <p className={cn('mt-4', styles.colors.text.tertiary)}>Estás al día!</p>
                <p className={cn('text-sm', styles.colors.text.tertiary)}>No tienes notificaciones sin leer</p>
              </div>
            ) : (
              normalizedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead.mutate({ id: notification.id })}
                  onDelete={() => deleteNotification.mutate({ id: notification.id })}
                  onClick={() => onNotificationClick?.(notification)}
                  isMarkingAsRead={markAsRead.isPending}
                  isDeleting={deleteNotification.isPending}
                />
              ))
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}

// ============================================================================
// Notification Bell (for navbar/header)
// ============================================================================

export function NotificationBell({ onClick }: { onClick?: () => void }) {
  const { data: unreadCount } = api.quoorumNotifications.getUnreadCount.useQuery()

  return (
    <button
      onClick={onClick}
      className={cn('relative rounded-lg p-2 transition-colors', styles.hoverState())}
      title={(unreadCount ?? 0) > 0 ? `${unreadCount} notificación${(unreadCount ?? 0) > 1 ? 'es' : ''} sin leer` : 'Notificaciones'}
    >
      <Bell className={cn('h-5 w-5', styles.colors.text.tertiary)} />
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
