/**
 * DebateList Component
 *
 * Panel izquierdo con lista de debates (estilo WhatsApp)
 */

import React, { useState } from 'react'
import { ExpertBadgeGroup } from './ExpertBadge'
import type { DebateSummary } from './types'

export interface DebateListProps {
  debates: DebateSummary[]
  selectedId?: string
  onSelect: (sessionId: string) => void
  onSearch?: (query: string) => void
}

export function DebateList({ debates, selectedId, onSelect, onSearch }: DebateListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search debates..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Debate List */}
      <div className="flex-1 overflow-y-auto">
        {debates.map((debate) => (
          <DebateListItem
            key={debate.sessionId}
            debate={debate}
            isSelected={debate.sessionId === selectedId}
            onClick={() => onSelect(debate.sessionId)}
          />
        ))}
      </div>
    </div>
  )
}

interface DebateListItemProps {
  debate: DebateSummary
  isSelected: boolean
  onClick: () => void
}

function DebateListItem({ debate, isSelected, onClick }: DebateListItemProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getQualityEmoji = (quality: number) => {
    if (quality >= 80) return '[INFO]'
    if (quality >= 60) return '👍'
    return '[WARN]'
  }

  const getConsensusEmoji = (consensus: number) => {
    if (consensus >= 90) return '[INFO]'
    if (consensus >= 70) return '[OK]'
    return '🤔'
  }

  return (
    <div
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {/* Title and Top Option */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 flex-1">{debate.shortQuestion}</h3>
        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
          {debate.topOption}
        </span>
      </div>

      {/* Expert Badges */}
      <div className="mb-2">
        <ExpertBadgeGroup
          expertIds={debate.expertIds}
          expertNames={debate.expertIds.map((id) => id.split('_')[0] || id)}
          maxVisible={3}
        />
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{debate.rounds} rounds</span>
        <span>•</span>
        <span>${debate.cost.toFixed(2)}</span>
        <span>•</span>
        <span>
          {debate.consensus}% consensus {getConsensusEmoji(debate.consensus)}
        </span>
        <span>•</span>
        <span>
          Quality {debate.quality} {getQualityEmoji(debate.quality)}
        </span>
      </div>

      {/* Timestamp */}
      <div className="mt-2 text-xs text-gray-400">{formatTimestamp(debate.timestamp)}</div>

      {/* Tags */}
      {debate.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {debate.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
