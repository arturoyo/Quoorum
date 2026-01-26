/**
 * Loading States for Quoorum
 * 
 * Quick bonus: Beautiful loading states and skeletons
 */

import React from 'react'

// ============================================================================
// DEBATE LOADING SKELETON
// ============================================================================

export function DebateListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
          <div className="flex items-start justify-between mb-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DebateViewerSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[70%] space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="bg-gray-100 rounded-lg p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      
      {/* Chart */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  )
}

// ============================================================================
// LOADING SPINNERS
// ============================================================================

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  return (
    <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
  )
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && <p className="text-[var(--theme-text-secondary)] font-medium">{message}</p>}
      </div>
    </div>
  )
}

// ============================================================================
// PROGRESS INDICATORS
// ============================================================================

export function DebateProgress({ current, total }: { current: number; total: number }) {
  const percentage = Math.min(100, (current / total) * 100)
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-[var(--theme-text-tertiary)]">
        <span>Ronda {current} de {total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

export function ConsensusProgress({ score }: { score: number }) {
  const percentage = score * 100 // Keep decimal precision
  const color = percentage >= 70 ? 'bg-green-600' : percentage >= 50 ? 'bg-yellow-600' : 'bg-red-600'
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-[var(--theme-text-tertiary)]">
        <span>Consenso</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

// ============================================================================
// EMPTY STATES
// ============================================================================

export function EmptyDebateList() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">💬</div>
      <h3 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-2">No hay debates aún</h3>
      <p className="text-[var(--theme-text-tertiary)] mb-6">Crea tu primer debate para empezar</p>
      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        Crear Debate
      </button>
    </div>
  )
}

export function EmptySearchResults({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-2">No se encontraron resultados</h3>
      <p className="text-[var(--theme-text-tertiary)]">No hay debates que coincidan con "{query}"</p>
    </div>
  )
}

export function NoExperts() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">👥</div>
      <h3 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-2">No hay expertos personalizados</h3>
      <p className="text-[var(--theme-text-tertiary)] mb-6">Crea expertos personalizados para tus debates</p>
      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        Crear Experto
      </button>
    </div>
  )
}

// ============================================================================
// ERROR STATES
// ============================================================================

export function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-2">Algo salió mal</h3>
      <p className="text-[var(--theme-text-tertiary)] mb-6">{error}</p>
      {retry && (
        <button 
          onClick={retry}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export function NetworkError({ retry }: { retry?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📡</div>
      <h3 className="text-xl font-semibold text-[var(--theme-text-primary)] mb-2">Sin conexión</h3>
      <p className="text-[var(--theme-text-tertiary)] mb-6">Verifica tu conexión a internet</p>
      {retry && (
        <button 
          onClick={retry}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

// ============================================================================
// SUCCESS STATES
// ============================================================================

export function SuccessMessage({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-2xl">✅</div>
        <p className="text-green-800 font-medium">{message}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-green-600 hover:text-green-800 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function InfoMessage({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-2xl">ℹ️</div>
        <p className="text-blue-800 font-medium">{message}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function WarningMessage({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-2xl">⚠️</div>
        <p className="text-yellow-800 font-medium">{message}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-yellow-600 hover:text-yellow-800 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}
