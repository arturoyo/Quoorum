/**
 * DebateViewer Component
 *
 * Componente principal tipo WhatsApp para visualizar debates
 */

import React, { useState, useEffect } from 'react'
import { DebateList } from './DebateList'
import { DebateChat } from './DebateChat'
import type { DebateSummary, DebateView } from './types'

export interface DebateViewerProps {
  debates: DebateSummary[]
  onLoadDebate: (sessionId: string) => Promise<DebateView>
  initialSelectedId?: string
}

export function DebateViewer({ debates, onLoadDebate, initialSelectedId }: DebateViewerProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedId)
  const [selectedDebate, setSelectedDebate] = useState<DebateView | null>(null)
  const [loading, setLoading] = useState(false)
  const [filteredDebates, setFilteredDebates] = useState(debates)

  useEffect(() => {
    if (selectedId) {
      loadDebate(selectedId)
    }
  }, [selectedId])

  const loadDebate = async (sessionId: string) => {
    setLoading(true)
    try {
      const debate = await onLoadDebate(sessionId)
      setSelectedDebate(debate)
    } catch (error) {
      console.error('Failed to load debate:', error)
      setSelectedDebate(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredDebates(debates)
      return
    }

    const lowercaseQuery = query.toLowerCase()
    const filtered = debates.filter(
      (d) =>
        d.question.toLowerCase().includes(lowercaseQuery) ||
        d.topOption.toLowerCase().includes(lowercaseQuery) ||
        d.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    )
    setFilteredDebates(filtered)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel - Debate List */}
      <div className="w-96 flex-shrink-0">
        <DebateList
          debates={filteredDebates}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onSearch={handleSearch}
        />
      </div>

      {/* Right Panel - Debate Chat */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-600">Loading debate...</p>
            </div>
          </div>
        ) : (
          <DebateChat debate={selectedDebate} />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

export function ExampleDebateViewer() {
  const exampleDebates: DebateSummary[] = [
    {
      sessionId: 'session-1',
      question: '¿Debo lanzar Wallie a 29€, 49€ o 79€?',
      shortQuestion: '📊 Pricing Decision',
      topOption: '49€',
      expertIds: ['patrick_campbell', 'alex_hormozi', 'april_dunford', 'tomasz_tunguz'],
      rounds: 5,
      cost: 0.23,
      consensus: 95,
      quality: 85,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      tags: ['pricing', 'strategy'],
    },
    {
      sessionId: 'session-2',
      question: '¿Cómo posicionar Wallie: "WhatsApp CRM" o "AI Sales Assistant"?',
      shortQuestion: '[INFO] Positioning Strategy',
      topOption: 'AI Sales Assistant',
      expertIds: ['april_dunford', 'peep_laja', 'steli_efti'],
      rounds: 7,
      cost: 0.31,
      consensus: 87,
      quality: 82,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      tags: ['positioning', 'marketing'],
    },
    {
      sessionId: 'session-3',
      question: '¿Qué feature construir primero: Forum, Voice Analytics, o AI Coaching?',
      shortQuestion: '[INFO] Roadmap Priority',
      topOption: 'Forum',
      expertIds: ['rahul_vohra', 'lenny_rachitsky', 'the_critic'],
      rounds: 4,
      cost: 0.18,
      consensus: 78,
      quality: 75,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      tags: ['product', 'roadmap'],
    },
  ]

  const handleLoadDebate = async (sessionId: string): Promise<DebateView> => {
    // In real app, fetch from API
    // For demo, return mock data
    const debate = exampleDebates.find((d) => d.sessionId === sessionId)!

    return {
      summary: debate,
      messages: [
        {
          id: '1',
          expertId: debate.expertIds[0] || 'unknown',
          expertName: 'Patrick Campbell',
          content: 'Recomiendo 49€ porque:\n\n• ROI claro para el cliente\n• Competitivo vs alternativas\n• Permite escalar',
          timestamp: new Date(),
          round: 1,
          depth: 82,
        },
        {
          id: '2',
          expertId: debate.expertIds[1] || 'unknown',
          expertName: 'Alex Hormozi',
          content: 'Desde perspectiva de valor:\n\n49€ comunica premium sin ser prohibitivo',
          timestamp: new Date(),
          round: 1,
          depth: 78,
        },
        {
          id: '3',
          expertId: 'meta_moderator',
          expertName: 'Meta-Moderator',
          content: '[WARN] Necesito más profundidad en el análisis. ¿Qué datos cuantitativos respaldan 49€?',
          timestamp: new Date(),
          round: 2,
          depth: 0,
          isIntervention: true,
          interventionType: 'challenge_depth',
        },
      ],
      qualityHistory: [68, 72, 85, 88, 90],
      interventions: [
        {
          round: 2,
          type: 'challenge_depth',
          prompt: 'Necesito más profundidad...',
        },
      ],
    }
  }

  return <DebateViewer debates={exampleDebates} onLoadDebate={handleLoadDebate} />
}
