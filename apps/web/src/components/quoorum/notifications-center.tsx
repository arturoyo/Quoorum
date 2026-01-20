'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  MessageCircle,
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
  type: 'debate_completed' | 'debate_failed' | 'debate_ready'
  title: string
  message: string
  debateId?: string
  read: boolean
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
    <Card className="border-[#2a3942] bg-[#202c33]">
      <CardHeader className="border-b border-[#2a3942]">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#e9edef]">
              <Bell className="h-5 w-5" />
              Notificaciones
              {(unreadCount ?? 0) > 0 && (
                <Badge className="bg-[#00a884] text-white">{unreadCount}</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-[#8696a0]">
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
                className="border-[#2a3942] bg-[#111b21] text-[#e9edef]"
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
                className="border-[#2a3942] bg-[#111b21] text-[#e9edef]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpiar todo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="w-full justify-start rounded-none border-b border-[#2a3942] bg-transparent p-0">
          <TabsTrigger
            value="all"
            className={cn(
              'rounded-none border-b-2 border-transparent px-4 py-3 text-[#8696a0] data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent data-[state=active]:text-[#e9edef]'
            )}
          >
            Todas
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className={cn(
              'rounded-none border-b-2 border-transparent px-4 py-3 text-[#8696a0] data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent data-[state=active]:text-[#e9edef]'
            )}
          >
            Sin leer
            {(unreadCount ?? 0) > 0 && (
              <span className="ml-2 rounded-full bg-[#00a884] px-2 py-0.5 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <CardContent className="p-4">
          <TabsContent value="all" className="m-0 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BellOff className="h-12 w-12 text-[#8696a0]" />
                <p className="mt-4 text-[#8696a0]">No hay notificaciones</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
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
                <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-[#00a884]" />
                <p className="mt-4 text-[#8696a0]">Estás al día!</p>
                <p className="text-sm text-[#8696a0]">No tienes notificaciones sin leer</p>
              </div>
            ) : (
              notifications.map((notification) => (
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
      className="relative rounded-lg p-2 transition-colors hover:bg-[#2a3942]"
      title={(unreadCount ?? 0) > 0 ? `${unreadCount} notificación${(unreadCount ?? 0) > 1 ? 'es' : ''} sin leer` : 'Notificaciones'}
    >
      <Bell className="h-5 w-5 text-[#8696a0]" />
      {(unreadCount ?? 0) > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#00a884] text-xs font-medium text-white">
          {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
