'use client'
// @ts-nocheck

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertCircle,
  Archive,
  Bell,
  BellOff,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Settings,
  Smartphone,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// ============================================================================
// Types
// ============================================================================

interface NotificationsCenterProps {
  showPreferences?: boolean
  onNotificationClick?: (notification: Notification) => void
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  isRead: boolean
  createdAt: Date
  actionUrl?: string | null
  actionLabel?: string | null
  debateId?: string | null
}

// ============================================================================
// Sub-components
// ============================================================================

const notificationIcons: Record<string, typeof MessageCircle> = {
  debate_completed: CheckCircle2,
  debate_failed: AlertCircle,
  new_comment: MessageCircle,
  comment_reply: MessageCircle,
  debate_shared: Users,
  consensus_reached: TrendingUp,
  expert_recommendation: TrendingUp,
  weekly_digest: Calendar,
  debate_reminder: Clock,
  team_action: Users,
}

const priorityColors: Record<string, string> = {
  low: 'border-l-[#8696a0]',
  normal: 'border-l-[#00a884]',
  high: 'border-l-yellow-500',
  urgent: 'border-l-red-500',
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onArchive,
  onClick,
}: {
  notification: Notification
  onMarkAsRead: () => void
  onArchive: () => void
  onClick?: () => void
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
        priorityColors[notification.priority],
        notification.isRead
          ? 'bg-[#111b21]/50 opacity-70'
          : 'cursor-pointer bg-[#111b21] hover:bg-[#111b21]/80',
        onClick && 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          notification.isRead ? 'bg-[#2a3942]' : 'bg-[#00a884]/20'
        )}
      >
        <Icon
          className={cn('h-5 w-5', notification.isRead ? 'text-[#8696a0]' : 'text-[#00a884]')}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm font-medium',
              notification.isRead ? 'text-[#8696a0]' : 'text-[#e9edef]'
            )}
          >
            {notification.title}
          </h4>
          <span className="shrink-0 text-xs text-[#8696a0]">{timeAgo}</span>
        </div>
        <p className="mt-1 text-sm text-[#8696a0]">{notification.message}</p>

        {notification.actionLabel && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto p-0 text-[#00a884]"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            {notification.actionLabel} →
          </Button>
        )}

        <div className="mt-2 flex items-center gap-2">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead()
              }}
              className="h-7 text-xs text-[#8696a0] hover:text-[#e9edef]"
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
              onArchive()
            }}
            className="h-7 text-xs text-[#8696a0] hover:text-[#e9edef]"
          >
            <Archive className="mr-1 h-3 w-3" />
            Archivar
          </Button>
        </div>
      </div>

      {!notification.isRead && <div className="h-2 w-2 shrink-0 rounded-full bg-[#00a884]" />}
    </div>
  )
}

function PreferencesPanel() {
  const { data: preferences, isLoading } = api.quoorumNotifications.getPreferences.useQuery()
  const updatePreferences = api.quoorumNotifications.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success('Preferencias actualizadas')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
      </div>
    )
  }

  type PrefsKey = 'debateCompleted' | 'newComment' | 'debateShared' | 'weeklyDigest'
  const prefs = preferences as Record<PrefsKey, { enabled: boolean }> | null

  return (
    <div className="space-y-6">
      {/* Global toggles */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#e9edef]">Canales de Notificación</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-[#111b21] p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#8696a0]" />
              <div>
                <Label className="text-[#e9edef]">Email</Label>
                <p className="text-xs text-[#8696a0]">Recibir notificaciones por correo</p>
              </div>
            </div>
            <Switch
              checked={preferences?.emailEnabled ?? true}
              onCheckedChange={(checked) => {
                updatePreferences.mutate({ emailEnabled: checked })
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[#111b21] p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-[#8696a0]" />
              <div>
                <Label className="text-[#e9edef]">Push</Label>
                <p className="text-xs text-[#8696a0]">Notificaciones push en el navegador</p>
              </div>
            </div>
            <Switch
              checked={preferences?.pushEnabled ?? true}
              onCheckedChange={(checked) => {
                updatePreferences.mutate({ pushEnabled: checked })
              }}
            />
          </div>
        </div>
      </div>

      {/* Notification types */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#e9edef]">Tipos de Notificación</h3>
        <div className="space-y-3">
          {[
            { key: 'debateCompleted' as PrefsKey, label: 'Debate completado', icon: CheckCircle2 },
            { key: 'newComment' as PrefsKey, label: 'Nuevos comentarios', icon: MessageCircle },
            { key: 'debateShared' as PrefsKey, label: 'Debate compartido conmigo', icon: Users },
            { key: 'weeklyDigest' as PrefsKey, label: 'Resumen semanal', icon: Calendar },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg bg-[#111b21] p-4"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-[#8696a0]" />
                <Label className="text-[#e9edef]">{item.label}</Label>
              </div>
              <Switch
                checked={prefs?.[item.key]?.enabled ?? true}
                onCheckedChange={(checked) => {
                  updatePreferences.mutate({
                    [item.key]: {
                      enabled: checked,
                      channels: checked ? ['in_app', 'email'] : [],
                    },
                  })
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quiet hours */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#e9edef]">Horas Silenciosas</h3>
        <div className="rounded-lg bg-[#111b21] p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[#8696a0]" />
            <div>
              <Label className="text-[#e9edef]">No molestar</Label>
              <p className="text-xs text-[#8696a0]">
                {preferences?.quietHoursStart && preferences?.quietHoursEnd
                  ? `De ${preferences.quietHoursStart} a ${preferences.quietHoursEnd}`
                  : 'Sin configurar'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function NotificationsCenter({
  showPreferences = true,
  onNotificationClick,
}: NotificationsCenterProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all')

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

  const archive = api.quoorumNotifications.archive.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  const archiveAllRead = api.quoorumNotifications.archiveAllRead.useMutation({
    onSuccess: () => {
      toast.success('Notificaciones leídas archivadas')
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
              Centro de notificaciones del Forum
            </CardDescription>
          </div>
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
          {showPreferences && (
            <TabsTrigger
              value="settings"
              className={cn(
                'rounded-none border-b-2 border-transparent px-4 py-3 text-[#8696a0] data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent data-[state=active]:text-[#e9edef]'
              )}
            >
              <Settings className="mr-2 h-4 w-4" />
              Preferencias
            </TabsTrigger>
          )}
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
                    notification={notification as Notification}
                    onMarkAsRead={() => markAsRead.mutate({ id: notification.id })}
                    onArchive={() => archive.mutate({ id: notification.id })}
                    onClick={() => onNotificationClick?.(notification as Notification)}
                  />
                ))}
                {notifications.some((n) => n.isRead) && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => archiveAllRead.mutate()}
                      disabled={archiveAllRead.isPending}
                      className="border-[#2a3942] bg-[#111b21] text-[#8696a0]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Archivar leídas
                    </Button>
                  </div>
                )}
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
                  notification={notification as Notification}
                  onMarkAsRead={() => markAsRead.mutate({ id: notification.id })}
                  onArchive={() => archive.mutate({ id: notification.id })}
                  onClick={() => onNotificationClick?.(notification as Notification)}
                />
              ))
            )}
          </TabsContent>

          {showPreferences && (
            <TabsContent value="settings" className="m-0">
              <PreferencesPanel />
            </TabsContent>
          )}
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
