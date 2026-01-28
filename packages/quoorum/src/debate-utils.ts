/**
 * Debate Utilities
 * 
 * Quick bonus utilities for working with debates
 */

import type { DebateResult, DebateMessage, RankedOption } from './types'
import type { ExpertProfile } from './expert-database'

// ============================================================================
// DEBATE FORMATTING
// ============================================================================

/**
 * Format debate duration in human-readable format
 */
export function formatDebateDuration(startTime: Date, endTime?: Date): string {
  const end = endTime || new Date()
  const durationMs = end.getTime() - startTime.getTime()
  
  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

/**
 * Format consensus score as emoji + percentage
 */
export function formatConsensusScore(score: number): string {
  const percentage = Math.round(score * 100)
  
  if (percentage >= 90) return `[INFO] ${percentage}%`
  if (percentage >= 70) return `[OK] ${percentage}%`
  if (percentage >= 50) return `[WARN] ${percentage}%`
  return `[ERROR] ${percentage}%`
}

/**
 * Format cost in USD with appropriate precision
 */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) return `$${(costUsd * 100).toFixed(2)}¢`
  if (costUsd < 1) return `$${costUsd.toFixed(3)}`
  return `$${costUsd.toFixed(2)}`
}

/**
 * Get debate status emoji
 */
export function getStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    pending: '⏳',
    in_progress: '🔄',
    completed: '[OK]',
    failed: '[ERROR]',
    cancelled: '🚫',
  }
  return emojiMap[status] || '❓'
}

// ============================================================================
// DEBATE ANALYSIS
// ============================================================================

/**
 * Calculate debate statistics
 */
export function calculateDebateStats(debate: DebateResult) {
  const totalMessages = debate.rounds?.reduce((sum, round) => sum + (round.messages?.length || 0), 0) || 0
  const avgMessagesPerRound = debate.rounds?.length ? totalMessages / debate.rounds.length : 0
  const totalWords = debate.rounds?.reduce((sum, round) => {
    return sum + (round.messages?.reduce((msgSum, msg) => {
      return msgSum + msg.content.split(/\s+/).length
    }, 0) || 0)
  }, 0) || 0
  
  return {
    totalRounds: debate.rounds?.length || 0,
    totalMessages,
    avgMessagesPerRound: Math.round(avgMessagesPerRound * 10) / 10,
    totalWords,
    avgWordsPerMessage: totalMessages > 0 ? Math.round((totalWords / totalMessages) * 10) / 10 : 0,
    estimatedReadingTime: Math.ceil(totalWords / 200), // 200 words per minute
  }
}

/**
 * Get top contributors (experts with most messages)
 */
export function getTopContributors(debate: DebateResult, limit: number = 3): Array<{ agentKey: string; messageCount: number }> {
  const contributorMap = new Map<string, number>()
  
  debate.rounds?.forEach(round => {
    round.messages?.forEach(msg => {
      const current = contributorMap.get(msg.agentKey) || 0
      contributorMap.set(msg.agentKey, current + 1)
    })
  })
  
  return Array.from(contributorMap.entries())
    .map(([agentKey, messageCount]) => ({ agentKey, messageCount }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, limit)
}

/**
 * Extract key quotes from debate (messages with high engagement)
 */
export function extractKeyQuotes(debate: DebateResult, limit: number = 5): DebateMessage[] {
  const allMessages = debate.rounds?.flatMap(r => r.messages || []) || []
  
  // Sort by length (longer messages tend to be more substantive)
  return allMessages
    .filter(msg => msg.content.length > 100) // At least 100 chars
    .sort((a, b) => b.content.length - a.content.length)
    .slice(0, limit)
}

/**
 * Calculate agreement score between experts
 */
export function calculateAgreementScore(debate: DebateResult): number {
  if (!debate.ranking || debate.ranking.length === 0) return 0
  
  // Higher consensus score = more agreement
  // More options with similar scores = less agreement
  const topOption = debate.ranking[0]
  const secondOption = debate.ranking[1]
  
  if (!secondOption) return 1 // Only one option = full agreement
  
  const scoreDiff = (topOption?.successRate || 0) - (secondOption?.successRate || 0)
  return Math.min(1, scoreDiff / 50) // Normalize to 0-1
}

// ============================================================================
// DEBATE COMPARISON
// ============================================================================

/**
 * Compare two debates
 */
export function compareDebates(debate1: DebateResult, debate2: DebateResult) {
  const stats1 = calculateDebateStats(debate1)
  const stats2 = calculateDebateStats(debate2)
  
  return {
    roundsDiff: stats2.totalRounds - stats1.totalRounds,
    messagesDiff: stats2.totalMessages - stats1.totalMessages,
    consensusDiff: debate2.consensusScore - debate1.consensusScore,
    costDiff: (debate2.totalCostUsd || 0) - (debate1.totalCostUsd || 0),
    durationDiff: 0, // Would need timestamps
  }
}

/**
 * Find similar options across debates
 */
export function findSimilarOptions(option: string, otherOptions: RankedOption[]): RankedOption[] {
  const optionLower = option.toLowerCase()
  const words = optionLower.split(/\s+/)
  
  return otherOptions.filter(other => {
    const otherLower = other.option.toLowerCase()
    // Check if they share significant words
    const sharedWords = words.filter(word => word.length > 3 && otherLower.includes(word))
    return sharedWords.length >= 2
  })
}

// ============================================================================
// EXPERT UTILITIES
// ============================================================================

/**
 * Get expert display name
 */
export function getExpertDisplayName(expert: ExpertProfile): string {
  return `${expert.name} - ${expert.title}`
}

/**
 * Get expert avatar emoji (based on expertise)
 */
export function getExpertAvatar(expert: ExpertProfile): string {
  const avatarMap: Record<string, string> = {
    'positioning': '[INFO]',
    'pricing': '💰',
    'product': '[INFO]',
    'growth': '📈',
    'operations': '⚙️',
    'technical': '💻',
    'ai': '🤖',
    'legal': '⚖️',
    'fundraising': '💵',
  }
  
  // Find first matching expertise
  for (const [key, emoji] of Object.entries(avatarMap)) {
    if (expert.expertise.some(e => e.toLowerCase().includes(key))) {
      return emoji
    }
  }
  
  return '👤'
}

/**
 * Group experts by category
 */
export function groupExpertsByCategory(experts: ExpertProfile[]): Record<string, ExpertProfile[]> {
  const categories: Record<string, ExpertProfile[]> = {}
  
  experts.forEach(expert => {
    // Use first expertise as category
    const category = expert.expertise[0] || 'Other'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(expert)
  })
  
  return categories
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate debate result completeness
 */
export function validateDebateResult(debate: DebateResult): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!debate.sessionId) errors.push('Missing sessionId')
  if (!debate.question) errors.push('Missing question')
  if (!debate.rounds || debate.rounds.length === 0) errors.push('No rounds')
  if (!debate.ranking || debate.ranking.length === 0) errors.push('No ranking')
  if (debate.consensusScore < 0 || debate.consensusScore > 1) errors.push('Invalid consensus score')
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if debate needs intervention
 */
export function needsIntervention(debate: DebateResult): { needs: boolean; reason?: string } {
  // Check if consensus is too low after many rounds
  if ((debate.rounds?.length || 0) >= 5 && debate.consensusScore < 0.3) {
    return { needs: true, reason: 'Low consensus after 5+ rounds' }
  }
  
  // Check if cost is too high
  if ((debate.totalCostUsd || 0) > 5) {
    return { needs: true, reason: 'Cost exceeds $5' }
  }
  
  return { needs: false }
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Generate debate summary for sharing
 */
export function generateDebateSummary(debate: DebateResult, experts: ExpertProfile[]): string {
  const stats = calculateDebateStats(debate)
  const topOption = debate.ranking?.[0]
  
  return `
📊 Debate Summary

Question: ${debate.question}

Consensus: ${formatConsensusScore(debate.consensusScore)}
Top Recommendation: ${topOption?.option || 'N/A'}
Success Rate: ${topOption?.successRate.toFixed(1)}%

Experts: ${experts.map(e => e.name).join(', ')}
Rounds: ${stats.totalRounds}
Messages: ${stats.totalMessages}
Reading Time: ${stats.estimatedReadingTime} min

Cost: ${formatCost(debate.totalCostUsd || 0)}
  `.trim()
}

/**
 * Generate markdown summary
 */
export function generateMarkdownSummary(debate: DebateResult, experts: ExpertProfile[]): string {
  const stats = calculateDebateStats(debate)
  const topContributors = getTopContributors(debate)
  
  return `
# ${debate.question}

## Overview
- **Consensus:** ${formatConsensusScore(debate.consensusScore)}
- **Rounds:** ${stats.totalRounds}
- **Messages:** ${stats.totalMessages}
- **Cost:** ${formatCost(debate.totalCostUsd || 0)}

## Top Recommendations

${debate.ranking?.slice(0, 3).map((option, i) => `
### ${i + 1}. ${option.option}
- **Success Rate:** ${option.successRate.toFixed(1)}%
- **Confidence:** ${(option.confidence * 100).toFixed(0)}%
${option.reasoning ? `- **Reasoning:** ${option.reasoning}` : ''}
`).join('\n')}

## Experts
${experts.map(e => `- **${e.name}** - ${e.title}`).join('\n')}

## Top Contributors
${topContributors.map(c => `- ${c.agentKey}: ${c.messageCount} messages`).join('\n')}
  `.trim()
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

/**
 * Search debates by keyword
 */
export function searchDebates(debates: DebateResult[], keyword: string): DebateResult[] {
  const keywordLower = keyword.toLowerCase()
  
  return debates.filter(debate => {
    // Search in question
    if (debate.question?.toLowerCase().includes(keywordLower)) return true
    
    // Search in ranking options
    if (debate.ranking?.some(r => r.option.toLowerCase().includes(keywordLower))) return true
    
    // Search in messages
    if (debate.rounds?.some(round => 
      round.messages?.some(msg => msg.content.toLowerCase().includes(keywordLower))
    )) return true
    
    return false
  })
}

/**
 * Filter debates by criteria
 */
export function filterDebates(
  debates: DebateResult[],
  criteria: {
    minConsensus?: number
    maxCost?: number
    minRounds?: number
    maxRounds?: number
    hasRanking?: boolean
  }
): DebateResult[] {
  return debates.filter(debate => {
    if (criteria.minConsensus !== undefined && debate.consensusScore < criteria.minConsensus) return false
    if (criteria.maxCost !== undefined && (debate.totalCostUsd || 0) > criteria.maxCost) return false
    if (criteria.minRounds !== undefined && (debate.rounds?.length || 0) < criteria.minRounds) return false
    if (criteria.maxRounds !== undefined && (debate.rounds?.length || 0) > criteria.maxRounds) return false
    if (criteria.hasRanking !== undefined && !debate.ranking?.length) return false
    
    return true
  })
}

/**
 * Sort debates by various criteria
 */
export function sortDebates(
  debates: DebateResult[],
  sortBy: 'consensus' | 'cost' | 'rounds' | 'recent',
  order: 'asc' | 'desc' = 'desc'
): DebateResult[] {
  const sorted = [...debates].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'consensus':
        comparison = a.consensusScore - b.consensusScore
        break
      case 'cost':
        comparison = (a.totalCostUsd || 0) - (b.totalCostUsd || 0)
        break
      case 'rounds':
        comparison = (a.rounds?.length || 0) - (b.rounds?.length || 0)
        break
      case 'recent':
        // Would need timestamps
        comparison = 0
        break
    }
    
    return order === 'asc' ? comparison : -comparison
  })
  
  return sorted
}
