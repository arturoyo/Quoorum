'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
  type MessageCircle,
  Trash2,
  X,
  TrendingUp,
  History,
  MessageSquare,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getContextualIcon } from '@/lib/icons/contextual-icons'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProcessTimeline } from '@quoorum/db/schema'
import { ProcessTimelineCard } from './process-timeline-card'

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
  const [activeTab, setActiveTab] = useState<'notifications' | 'debates' | 'timeline'>('notifications')
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
      // Añadir clase al body para colapsar el contenido
      document.body.classList.add('sidebar-open')
      // Prevenir scroll del body cuando el sidebar está abierto
      document.body.style.overflow = 'hidden'
    } else {
      // Remover clase cuando se cierra
      document.body.classList.remove('sidebar-open')
      // Restaurar scroll del body
      document.body.style.overflow = ''
    }

    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('sidebar-open')
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Notifications queries (only when authenticated)
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
      enabled: !isCheckingAuth && isAuthenticated && isOpen && activeTab === 'notifications',
      retry: false,
      onError: () => {
        // Silenciar errores de autenticación (ya manejados por enabled)
      },
    }
  )

  const { data: unreadCount } = api.quoorumNotifications.getUnreadCount.useQuery(undefined, {
    enabled: !isCheckingAuth && isAuthenticated && isOpen,
    retry: false,
    onError: () => {
      // Silenciar errores de autenticación (ya manejados por enabled)
    },
  })

  // Debates queries - Show recent debates (only when authenticated)
  const {
    data: debates,
    isLoading: isLoadingDebates,
  } = api.debates.list.useQuery(
    {
      limit: 20,
      offset: 0,
    },
    { 
      enabled: !isCheckingAuth && isAuthenticated && isOpen && activeTab === 'debates',
      retry: false,
      onError: () => {
        // Silenciar errores de autenticación (ya manejados por enabled)
      },
    }
  )

  // Process timeline queries - Show all processes (not just in_progress) (only when authenticated)
  const {
    data: processes,
    isLoading: isLoadingProcesses,
  } = api.processTimeline.list.useQuery(
    {
      // No status filter - show all processes
      limit: 50,
    },
    { 
      enabled: !isCheckingAuth && isAuthenticated && isOpen && activeTab === 'timeline',
      retry: false,
      onError: () => {
        // Silenciar errores de autenticación (ya manejados por enabled)
      },
    }
  )

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

  const clearAll = api.quoorumNotifications.archiveAllRead.useMutation({
    onSuccess: () => {
      toast.success('Todas las notificaciones archivadas')
      void refetchNotifications()
    },
  })

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
                <h2 className="text-lg font-semibold text-white">Centro de Actividad</h2>
                {unreadCount && unreadCount > 0 && (
                  <Badge className="bg-[#00a884] text-white">{unreadCount}</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[#8696a0] hover:text-white hover:bg-[#2a3942]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="w-full justify-start rounded-none border-b border-[#2a3942] bg-transparent p-0">
                <TabsTrigger
                  value="notifications"
                  className={cn(
                    'rounded-none border-b-2 border-transparent px-4 py-3 text-[#8696a0] data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent data-[state=active]:text-[#e9edef]'
                  )}
                >
                  Notificaciones
                  {unreadCount && unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-[#00a884] px-2 py-0.5 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="debates"
                  className={cn(
                    'rounded-none border-b-2 border-transparent px-4 py-3 text-[#8696a0] data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent data-[state=active]:text-[#e9edef]'
                  )}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Debates
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className={cn(
                    'rounded-none border-b-2 border-transparent px-4 py-3 text-[#8696a0] data-[state=active]:border-[#00a884] data-[state=active]:bg-transparent data-[state=active]:text-[#e9edef]'
                  )}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Procesos
                </TabsTrigger>
              </TabsList>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="notifications" className="m-0 p-4 space-y-3">
                  {/* Actions */}
                  <div className="flex gap-2 mb-4">
                    {unreadCount && unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAllAsRead.mutate()}
                        disabled={markAllAsRead.isPending}
                        className="border-[#2a3942] bg-[#111b21] text-[#e9edef] hover:bg-[#202c33]"
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
                        className="border-[#2a3942] bg-[#111b21] text-[#e9edef] hover:bg-[#202c33]"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpiar todo
                      </Button>
                    )}
                  </div>

                  {/* Notifications List */}
                  {isLoadingNotifications ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
                    </div>
                  ) : !notifications || notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <BellOff className="h-12 w-12 text-[#8696a0]" />
                      <p className="mt-4 text-[#8696a0]">No hay notificaciones</p>
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

                <TabsContent value="debates" className="m-0 p-4 space-y-3">
                  {isLoadingDebates ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
                    </div>
                  ) : !debates || debates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="h-12 w-12 text-[#8696a0]" />
                      <p className="mt-4 text-[#8696a0]">No hay debates</p>
                      <p className="text-sm text-[#8696a0] mt-2">
                        Crea tu primer debate para comenzar
                      </p>
                    </div>
                  ) : (
                    debates.map((debate) => {
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
                      const statusLabels = {
                        draft: 'Borrador',
                        pending: 'Pendiente',
                        in_progress: 'En progreso',
                        completed: 'Completado',
                        failed: 'Fallido',
                      }
                      const timeAgo = formatDistanceToNow(new Date(debate.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })

                      return (
                        <Card
                          key={debate.id}
                          className="cursor-pointer border-[#2a3942] bg-[#111b21] hover:border-purple-500/30 transition-colors"
                          onClick={() => {
                            router.push(`/debates/${debate.id}`)
                            onClose()
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                                  <ContextualIcon className="h-5 w-5 text-purple-400" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-medium text-white line-clamp-2">
                                    {debate.metadata?.title || debate.question}
                                  </h4>
                                  <span className="shrink-0 text-xs text-[#8696a0]">{timeAgo}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'h-2 w-2 rounded-full',
                                      statusColors[debate.status as keyof typeof statusColors]
                                    )}
                                  />
                                  <span className="text-xs text-[#8696a0]">
                                    {statusLabels[debate.status as keyof typeof statusLabels]}
                                  </span>
                                  {debate.consensusScore && (
                                    <>
                                      <span className="text-[#8696a0]">•</span>
                                      <span className="text-xs text-[#8696a0]">
                                        {Math.round(debate.consensusScore * 100)}% consenso
                                      </span>
                                    </>
                                  )}
                                </div>
                                {debate.metadata?.tags && Array.isArray(debate.metadata.tags) && debate.metadata.tags.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {debate.metadata.tags.slice(0, 3).map((tag: string) => (
                                      <span
                                        key={tag}
                                        className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-400"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {debate.metadata.tags.length > 3 && (
                                      <span className="text-xs text-[#8696a0]">
                                        +{debate.metadata.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="m-0 p-4 space-y-4">
                  {isLoadingProcesses ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#8696a0]" />
                    </div>
                  ) : !processes || processes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <TrendingUp className="h-12 w-12 text-[#8696a0]" />
                      <p className="mt-4 text-[#8696a0]">No hay procesos activos</p>
                      <p className="text-sm text-[#8696a0] mt-2">
                        Los procesos con fases aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    processes.map((process) => (
                      <ProcessTimelineCard key={process.id} process={process} />
                    ))
                  )}
                </TabsContent>
              </div>
            </Tabs>
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
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#00a884] text-xs font-medium text-white">
          {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
