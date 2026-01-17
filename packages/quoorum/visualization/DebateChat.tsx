/**
 * DebateChat Component
 *
 * Panel derecho con conversación del debate (estilo WhatsApp)
 */

import React from 'react'
import { ExpertBadge } from './ExpertBadge'
import { getExpertColor } from './types'
import type { DebateView, DebateMessage } from './types'

export interface DebateChatProps {
  debate: DebateView | null
}

export function DebateChat({ debate }: DebateChatProps) {
  if (!debate) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg">Select a debate to view</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <DebateChatHeader debate={debate} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessagesByRound(debate.messages).map((group) => (
          <RoundGroup key={group.round} round={group.round} messages={group.messages} />
        ))}
      </div>
    </div>
  )
}

function DebateChatHeader({ debate }: { debate: DebateView }) {
  const { summary } = debate

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Question */}
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{summary.question}</h2>

      {/* Expert Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {summary.expertIds.map((id) => (
          <ExpertBadge key={id} expertId={id} expertName={id.split('_').join(' ')} size="sm" showCategory />
        ))}
      </div>

      {/* Metrics Bar */}
      <div className="flex items-center gap-6 text-sm">
        {/* Quality */}
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Quality:</span>
          <div className="flex items-center gap-1">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${summary.quality}%` }}
              />
            </div>
            <span className="font-medium">{summary.quality}/100</span>
            <span>{summary.quality >= 80 ? '✨' : summary.quality >= 60 ? '👍' : '⚠️'}</span>
          </div>
        </div>

        {/* Consensus */}
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Consensus:</span>
          <div className="flex items-center gap-1">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${summary.consensus}%` }}
              />
            </div>
            <span className="font-medium">{summary.consensus}%</span>
            <span>{summary.consensus >= 90 ? '🎯' : summary.consensus >= 70 ? '✅' : '🤔'}</span>
          </div>
        </div>

        {/* Cost (in credits) */}
        <div className="flex items-center gap-1 text-gray-600">
          <span>🪙</span>
          <span>{Math.ceil(summary.cost * 1.75 / 0.005)} créditos</span>
        </div>

        {/* Rounds */}
        <div className="flex items-center gap-1 text-gray-600">
          <span>🔄</span>
          <span>{summary.rounds} rounds</span>
        </div>
      </div>
    </div>
  )
}

interface RoundGroupProps {
  round: number
  messages: DebateMessage[]
}

function RoundGroup({ round, messages }: RoundGroupProps) {
  return (
    <div className="space-y-3">
      {/* Round Header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-300" />
        <span className="text-sm font-medium text-gray-500">Round {round}</span>
        <div className="h-px flex-1 bg-gray-300" />
      </div>

      {/* Messages */}
      {messages.map((message) =>
        message.isIntervention ? (
          <InterventionMessage key={message.id} message={message} />
        ) : (
          <ExpertMessage key={message.id} message={message} />
        )
      )}
    </div>
  )
}

function ExpertMessage({ message }: { message: DebateMessage }) {
  const color = getExpertColor(message.expertId)

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      {/* Expert Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ color: color.color }}>{color.emoji}</span>
          <span className="font-semibold text-gray-900">
            {message.narrativeId ? message.narrativeId.charAt(0).toUpperCase() + message.narrativeId.slice(1) : message.expertName}
          </span>
          <span className="text-xs text-gray-500">({color.label})</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{message.timestamp.toLocaleTimeString()}</span>
          <span>⭐ Depth: {message.depth}</span>
        </div>
      </div>

      {/* Message Content */}
      <div className="text-gray-700 whitespace-pre-wrap">{message.content}</div>
    </div>
  )
}

function InterventionMessage({ message }: { message: DebateMessage }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🤖</span>
        <span className="font-semibold text-yellow-900">Meta-Moderator Intervention</span>
        <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
          {message.interventionType}
        </span>
      </div>
      <div className="text-yellow-900">{message.content}</div>
      <div className="text-xs text-yellow-600 mt-2">{message.timestamp.toLocaleTimeString()}</div>
    </div>
  )
}

function groupMessagesByRound(messages: DebateMessage[]): Array<{ round: number; messages: DebateMessage[] }> {
  const groups = new Map<number, DebateMessage[]>()

  for (const message of messages) {
    if (!groups.has(message.round)) {
      groups.set(message.round, [])
    }
    groups.get(message.round)!.push(message)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, messages]) => ({ round, messages }))
}
