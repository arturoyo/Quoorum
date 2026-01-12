/**
 * ExpertBadge Component
 *
 * Badge de experto con color por categoría
 */

import React from 'react'
import { getExpertColor } from './types'

export interface ExpertBadgeProps {
  expertId: string
  expertName: string
  size?: 'sm' | 'md' | 'lg'
  showCategory?: boolean
  onClick?: () => void
}

export function ExpertBadge({
  expertId,
  expertName,
  size = 'md',
  showCategory = false,
  onClick,
}: ExpertBadgeProps) {
  const color = getExpertColor(expertId)

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      style={{
        backgroundColor: `${color.color}20`,
        color: color.color,
        border: `1px solid ${color.color}40`,
      }}
      onClick={onClick}
    >
      <span>{color.emoji}</span>
      <span>{expertName}</span>
      {showCategory && <span className="text-xs opacity-70">({color.label})</span>}
    </div>
  )
}

export interface ExpertBadgeGroupProps {
  expertIds: string[]
  expertNames: string[]
  maxVisible?: number
}

export function ExpertBadgeGroup({ expertIds, expertNames, maxVisible = 4 }: ExpertBadgeGroupProps) {
  const visible = expertIds.slice(0, maxVisible)
  const remaining = expertIds.length - maxVisible

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((id, index) => (
        <ExpertBadge key={id} expertId={id} expertName={expertNames[index] || id} size="sm" />
      ))}
      {remaining > 0 && (
        <div className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
          +{remaining}
        </div>
      )}
    </div>
  )
}
