/**
 * PhaseDebate Component (Unified - Typeform Style)
 * 
 * Phase 5: Active debate with messages.
 */

'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Send, Loader2, MessageSquare, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { DebateStickyHeader } from './debate-sticky-header'
import type { DebateState } from '../types'

interface PhaseDebateProps {
  state: DebateState
  onSendMessage: (message: string) => void
  isLoading: boolean
}

export function PhaseDebate({ state, onSendMessage, isLoading }: PhaseDebateProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = React.useState('')
  const [debateStatus, setDebateStatus] = useState<'pending' | 'in_progress' | 'completed' | 'failed' | null>(null)
  const [processingInfo, setProcessingInfo] = useState<{ phase: string; message: string; progress: number } | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState(3)
  
  // Query debate status and processing info while redirecting
  const { data: debate } = api.debates.get.useQuery(
    { id: state.debateId! },
    { 
      enabled: !!state.debateId,
      refetchInterval: (queryResult) => {
        // Poll every 1 second if debate is pending or in_progress
        const status = queryResult?.status
        return (status === 'pending' || status === 'in_progress') ? 1000 : false
      },
    }
  )
  
  // Update local state from query
  useEffect(() => {
    if (debate) {
      // Only set status for non-draft/cancelled states
      const status = debate.status
      if (status === 'pending' || status === 'in_progress' || status === 'completed' || status === 'failed') {
        setDebateStatus(status)
      }
      if (debate.processingStatus) {
        setProcessingInfo({
          phase: debate.processingStatus.phase || 'preparing',
          message: debate.processingStatus.message || 'Preparando debate...',
          progress: debate.processingStatus.progress || 0,
        })
      }
    }
  }, [debate])
  
  // State tracking removed (was debug-only)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])
  
  // Countdown before redirect
  useEffect(() => {
    if (state.debateId && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state.debateId, redirectCountdown])
  
  useEffect(() => {
    if (state.debateId && redirectCountdown === 0) {
      // Redirect to debate page
      try {
        const debateUrl = `/debates/${state.debateId}`

        // Use router.replace (doesn't return a promise in Next.js 15)
        router.replace(debateUrl)

        // Fallback: if navigation doesn't work after 2 seconds, use window.location
        setTimeout(() => {
          if (window.location.pathname !== debateUrl) {
            window.location.href = debateUrl
          }
        }, 2000)
      } catch (error) {
        // Last resort: use window.location
        window.location.href = `/debates/${state.debateId}`
      }
    }
  }, [state.debateId, router, redirectCountdown, debateStatus])
  
  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
    }
  }
  
  if (state.debateId) {
    // Determine status icon and color
    const getStatusInfo = () => {
      if (debateStatus === 'failed') {
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          title: 'Error al iniciar el debate',
          message: debate?.metadata?.error || 'El debate no pudo iniciarse. Revisa tus créditos o intenta de nuevo.',
        }
      }
      if (debateStatus === 'in_progress' || processingInfo) {
        return {
          icon: Sparkles,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30',
          title: 'Iniciando debate...',
          message: processingInfo?.message || 'El sistema está preparando los expertos y analizando tu pregunta.',
        }
      }
      if (debateStatus === 'completed') {
        return {
          icon: CheckCircle2,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          title: '¡Debate completado!',
          message: 'El debate ha finalizado. Redirigiendo para ver los resultados...',
        }
      }
      // Default: pending
      return {
        icon: Loader2,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        title: 'Preparando debate...',
        message: 'El debate se está creando y se iniciará automáticamente en breve.',
      }
    }
    
    const statusInfo = getStatusInfo()
    const StatusIcon = statusInfo.icon
    
    // Show loading state while redirecting with detailed information
    return (
      <div className="w-full max-w-2xl mx-auto">
        <DebateStickyHeader
          badges={
            <span className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border",
              statusInfo.bgColor,
              statusInfo.color,
              statusInfo.borderColor
            )}>
              {debateStatus === 'in_progress' ? 'Iniciando...' : 
               debateStatus === 'failed' ? 'Error' :
               debateStatus === 'completed' ? 'Completado' : 'Preparando'}
            </span>
          }
          title={statusInfo.title}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              {debateStatus === 'failed' ? (
                <AlertCircle className={cn("h-12 w-12", statusInfo.color)} />
              ) : debateStatus === 'completed' ? (
                <CheckCircle2 className={cn("h-12 w-12", statusInfo.color)} />
              ) : (
                <StatusIcon className={cn("h-12 w-12 animate-spin", statusInfo.color)} />
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-[var(--theme-text-primary)]">{statusInfo.title}</p>
              <p className="text-sm text-[var(--theme-text-tertiary)]">{statusInfo.message}</p>
              
              {/* Show processing progress if available */}
              {processingInfo && processingInfo.progress > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-[var(--theme-bg-input)] rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingInfo.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--theme-text-tertiary)]">{processingInfo.progress}% completado</p>
                </div>
              )}
              
              {/* Show debate status details */}
              <div className="mt-4 p-4 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-lg text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--theme-text-tertiary)]">Estado:</span>
                    <span className={cn(
                      "font-medium",
                      debateStatus === 'in_progress' ? 'text-purple-400' :
                      debateStatus === 'failed' ? 'text-red-400' :
                      debateStatus === 'completed' ? 'text-green-400' :
                      'text-yellow-400'
                    )}>
                      {debateStatus === 'pending' ? 'Pendiente' :
                       debateStatus === 'in_progress' ? 'En progreso' :
                       debateStatus === 'failed' ? 'Error' :
                       debateStatus === 'completed' ? 'Completado' :
                       'Cargando...'}
                    </span>
                  </div>
                  {debate?.question && (
                    <div className="flex justify-between">
                      <span className="text-[var(--theme-text-tertiary)]">Pregunta:</span>
                      <span className="text-white text-right max-w-[60%] truncate" title={debate.question}>
                        {debate.question.substring(0, 40)}...
                      </span>
                    </div>
                  )}
                  {debateStatus === 'failed' && debate?.metadata?.errorDetails && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                      {String(debate.metadata.errorDetails)}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Countdown and redirect info */}
              {redirectCountdown > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-[var(--theme-text-tertiary)]">
                    Redirigiendo en {redirectCountdown} segundo{redirectCountdown !== 1 ? 's' : ''}...
                  </p>
                  <p className="text-xs text-[var(--theme-text-tertiary)]">
                    Si no redirige automáticamente,{' '}
                    <a 
                      href={`/debates/${state.debateId}`} 
                      className="text-purple-400 hover:underline"
                    >
                      haz clic aquí
                    </a>
                  </p>
                </div>
              )}
              
              {/* Show error action if failed */}
              {debateStatus === 'failed' && (
                <div className="mt-4">
                  <Button
                    onClick={() => router.push('/debates/new-unified')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Crear nuevo debate
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <DebateStickyHeader
        phaseNumber={5}
        title="Debate Activo"
      />
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
          <MessageSquare className="h-8 w-8 text-purple-400" />
        </div>
        <p className="text-[var(--theme-text-tertiary)]">Interactúa con los expertos IA</p>
      </div>
      
      {/* Messages */}
      <div className="bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-lg p-6 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto">
        {state.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
              <p className="text-[var(--theme-text-tertiary)]">Iniciando debate...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {state.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'rounded-lg px-4 py-3 max-w-[80%]',
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-primary)] border border-[var(--theme-border)]'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs text-[var(--theme-text-tertiary)] mt-1">
                    {msg.timestamp.toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
          className={cn(
            'flex-1 bg-[var(--theme-bg-secondary)] border-[var(--theme-border)] text-[var(--theme-text-primary)]',
            'placeholder:text-[var(--theme-text-tertiary)] focus-visible:ring-purple-500',
            'focus-visible:border-purple-500'
          )}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
