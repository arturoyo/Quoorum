'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn, styles } from '@/lib/utils'
import { AlertCircle, RefreshCw, WifiOff, ServerCrash } from 'lucide-react'

export type ErrorType = 'generic' | 'network' | 'server' | 'not_found'

export interface ErrorStateCardProps {
  /** Error type for pre-configured styling */
  type?: ErrorType
  /** Custom title (overrides type default) */
  title?: string
  /** Error message */
  message?: string
  /** Retry callback */
  onRetry?: () => void
  /** Retry button label */
  retryLabel?: string
  /** Whether retry is in progress */
  isRetrying?: boolean
  /** Visual variant */
  variant?: 'card' | 'inline' | 'full'
  /** Additional class names */
  className?: string
  /** Custom icon */
  icon?: React.ComponentType<{ className?: string }>
}

const errorTypeConfig: Record<
  ErrorType,
  {
    title: string
    message: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  generic: {
    title: 'Algo salió mal',
    message: 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
    icon: AlertCircle,
  },
  network: {
    title: 'Error de conexión',
    message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
    icon: WifiOff,
  },
  server: {
    title: 'Error del servidor',
    message: 'El servidor no está disponible. Por favor, inténtalo más tarde.',
    icon: ServerCrash,
  },
  not_found: {
    title: 'No encontrado',
    message: 'El recurso que buscas no existe o ha sido eliminado.',
    icon: AlertCircle,
  },
}

export function ErrorStateCard({
  type = 'generic',
  title,
  message,
  onRetry,
  retryLabel = 'Reintentar',
  isRetrying = false,
  variant = 'card',
  className,
  icon: CustomIcon,
}: ErrorStateCardProps) {
  const config = errorTypeConfig[type]
  const Icon = CustomIcon || config.icon
  const displayTitle = title || config.title
  const displayMessage = message || config.message

  const content = (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="mb-4 text-red-400">
        <Icon className="h-12 w-12" />
      </div>

      <h3 className={cn('text-lg font-semibold mb-2', styles.colors.text.primary)}>
        {displayTitle}
      </h3>

      <p className={cn('text-sm max-w-md mb-4', styles.colors.text.secondary)}>
        {displayMessage}
      </p>

      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Reintentando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryLabel}
            </>
          )}
        </Button>
      )}
    </div>
  )

  if (variant === 'inline') {
    return <div className={className}>{content}</div>
  }

  if (variant === 'full') {
    return (
      <div className={cn('flex h-full items-center justify-center', className)}>
        {content}
      </div>
    )
  }

  return (
    <Card className={cn('bg-red-500/10 border-red-500/20', className)}>
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  )
}

// Convenience components
export function NetworkError({
  onRetry,
  isRetrying,
  className,
}: {
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}) {
  return (
    <ErrorStateCard
      type="network"
      onRetry={onRetry}
      isRetrying={isRetrying}
      className={className}
    />
  )
}

export function ServerError({
  onRetry,
  isRetrying,
  className,
}: {
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}) {
  return (
    <ErrorStateCard
      type="server"
      onRetry={onRetry}
      isRetrying={isRetrying}
      className={className}
    />
  )
}
