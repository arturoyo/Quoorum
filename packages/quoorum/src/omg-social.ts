/**
 * Forum OMG Social Features
 *
 * Quick OMGs: Social & Viral (Cards, Highlights, Community Voting)
 */

import type { DebateResult } from './types'
import { quoorumLogger } from './logger'

// ============================================================================
// SHAREABLE DEBATE CARDS
// ============================================================================

export interface DebateCard {
  question: string
  shortQuestion: string
  consensus: string
  consensusScore: number
  experts: string[]
  keyInsight: string
  url?: string
}

/**
 * Genera tarjeta compartible del debate
 */
export function generateShareableCard(result: DebateResult, url?: string): DebateCard {
  const question = 'Debate question' // Placeholder
  const shortQuestion = question.length > 50 ? question.substring(0, 47) + '...' : question

  const consensus =
    typeof result.finalRanking[0] === 'string' ? result.finalRanking[0] : result.finalRanking[0]?.option || 'No consensus'

  // Extract experts
  const expertIds = new Set<string>()
  for (const round of result.rounds) {
    for (const message of round.messages) {
      if (message.agentKey !== 'meta_moderator') {
        expertIds.add(message.agentKey)
      }
    }
  }

  const experts = Array.from(expertIds).map((id) =>
    id
      .split('_')
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(' ')
  )

  // Extract key insight (from first message of winner's expert)
  let keyInsight = `${consensus} is the recommended approach`
  for (const round of result.rounds) {
    for (const message of round.messages) {
      if (message.content.toLowerCase().includes(consensus.toLowerCase())) {
        keyInsight = message.content.substring(0, 100) + '...'
        break
      }
    }
  }

  return {
    question,
    shortQuestion,
    consensus,
    consensusScore: result.consensusScore * 100,
    experts: experts.slice(0, 3),
    keyInsight,
    url,
  }
}

/**
 * Renderiza tarjeta como ASCII art
 */
export function renderDebateCardASCII(card: DebateCard): string {
  const width = 60
  const border = '─'.repeat(width - 2)

  let output = `\n┌${border}┐\n`
  output += `│ 💰 ${card.shortQuestion.padEnd(width - 6)}│\n`
  output += `│${' '.repeat(width)}│\n`
  output += `│ Question: ${card.question.substring(0, width - 13).padEnd(width - 12)}│\n`
  output += `│ Consensus: ${card.consensus.padEnd(width - 14)}│\n`
  output += `│ Score: ${(card.consensusScore.toFixed(0) + '%').padEnd(width - 10)}│\n`
  output += `│ Experts: ${card.experts.join(', ').substring(0, width - 12).padEnd(width - 12)}│\n`
  output += `│${' '.repeat(width)}│\n`
  output += `│ "${card.keyInsight.substring(0, width - 5)}"${' '.repeat(Math.max(0, width - card.keyInsight.length - 5))}│\n`
  output += `│${' '.repeat(width)}│\n`

  if (card.url) {
    output += `│ 🔗 ${card.url.padEnd(width - 6)}│\n`
  } else {
    output += `│ 🔗 See full debate →${' '.repeat(width - 22)}│\n`
  }

  output += `└${border}┘\n`

  return output
}

/**
 * Genera HTML para tarjeta compartible
 */
export function generateShareableCardHTML(card: DebateCard): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${card.shortQuestion}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon { font-size: 32px; margin-bottom: 16px; }
    .question { font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 24px; }
    .consensus { font-size: 20px; color: #2d3748; margin-bottom: 8px; }
    .score { font-size: 16px; color: #4a5568; margin-bottom: 16px; }
    .experts { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
    .expert-badge { background: #edf2f7; padding: 6px 12px; border-radius: 12px; font-size: 14px; }
    .insight { font-style: italic; color: #4a5568; padding: 16px; background: #f7fafc; border-left: 4px solid #667eea; margin-bottom: 24px; }
    .cta { text-align: center; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">💰</div>
    <div class="question">${card.question}</div>
    <div class="consensus">Consensus: ${card.consensus}</div>
    <div class="score">${card.consensusScore.toFixed(0)}% agreement</div>
    <div class="experts">
      ${card.experts.map((e) => `<span class="expert-badge">${e}</span>`).join('')}
    </div>
    <div class="insight">"${card.keyInsight}"</div>
    <div class="cta">
      <a href="${card.url || '#'}" class="button">See Full Debate →</a>
    </div>
  </div>
</body>
</html>
`
}

/**
 * Imprime tarjeta en consola
 */
export function printDebateCard(result: DebateResult, url?: string): void {
  const card = generateShareableCard(result, url)
  quoorumLogger.debug('Debate card', {
    sessionId: result.sessionId,
    url,
    card,
  })
}

// ============================================================================
// COMMUNITY VOTING
// ============================================================================

export interface CommunityVote {
  option: string
  votes: number
  percentage: number
}

export interface CommunityVotingResult {
  question: string
  votes: CommunityVote[]
  totalVotes: number
  expertConsensus: string
  expertScore: number
  alignment: boolean
}

/**
 * Simula votación comunitaria (mock para demo)
 */
export function simulateCommunityVoting(result: DebateResult, totalVotes: number = 100): CommunityVotingResult {
  const options = result.finalRanking.slice(0, 3).map((opt) => (typeof opt === 'string' ? opt : opt.option || 'Unknown'))

  // Simulate votes (biased toward expert consensus)
  const expertConsensus = options[0] || 'Unknown'
  const votes: CommunityVote[] = options.map((option, i) => {
    let baseVotes: number
    if (i === 0) {
      baseVotes = Math.round(totalVotes * (0.6 + Math.random() * 0.3)) // 60-90%
    } else if (i === 1) {
      baseVotes = Math.round(totalVotes * (0.1 + Math.random() * 0.2)) // 10-30%
    } else {
      baseVotes = Math.round(totalVotes * (0.05 + Math.random() * 0.15)) // 5-20%
    }

    return {
      option,
      votes: baseVotes,
      percentage: (baseVotes / totalVotes) * 100,
    }
  })

  // Normalize to 100%
  const totalPercentage = votes.reduce((sum, v) => sum + v.percentage, 0)
  for (const vote of votes) {
    vote.percentage = (vote.percentage / totalPercentage) * 100
  }

  const communityWinner = votes.reduce((prev, current) => (current.votes > prev.votes ? current : prev))
  const alignment = communityWinner.option === expertConsensus

  return {
    question: 'Debate question', // Placeholder
    votes,
    totalVotes,
    expertConsensus,
    expertScore: result.consensusScore * 100,
    alignment,
  }
}

/**
 * Renderiza resultados de votación
 */
export function renderCommunityVoting(voting: CommunityVotingResult): string {
  let output = '\n🗳️  Community Voting Results\n\n'
  output += `Question: ${voting.question}\n\n`
  output += 'What do YOU think?\n\n'

  for (const vote of voting.votes) {
    const bar = generateVoteBar(vote.percentage)
    const icon = vote.option === voting.expertConsensus ? '[OK]' : '🔵'
    output += `${icon} ${vote.option.padEnd(20)} ${bar} ${vote.percentage.toFixed(0)}%\n`
  }

  output += `\nTotal votes: ${voting.totalVotes}\n\n`

  output += `Experts say: ${voting.expertConsensus} (${voting.expertScore.toFixed(0)}%)\n`
  const communityWinner = voting.votes.reduce((prev, current) => (current.votes > prev.votes ? current : prev))
  output += `Community says: ${communityWinner.option} (${communityWinner.percentage.toFixed(0)}%)\n`

  if (voting.alignment) {
    output += `\n[OK] Alignment! Experts and community agree.\n`
  } else {
    output += `\n[WARN]  Divergence! Community disagrees with experts.\n`
  }

  return output
}

function generateVoteBar(percentage: number): string {
  const filled = Math.round(percentage / 10)
  const empty = 10 - filled
  const block = typeof process !== 'undefined' && process.platform === 'win32' ? ['#', '-'] : ['█', '░']
  return block[0]!.repeat(filled) + block[1]!.repeat(empty)
}

/**
 * Imprime votación en consola
 */
export function printCommunityVoting(result: DebateResult, totalVotes?: number): void {
  const voting = simulateCommunityVoting(result, totalVotes)
  quoorumLogger.debug('Community voting', {
    sessionId: result.sessionId,
    totalVotes,
    voting,
  })
}

// ============================================================================
// DEBATE HIGHLIGHTS REEL
// ============================================================================

export interface HighlightClip {
  title: string
  round: number
  expertId: string
  content: string
  duration: number // seconds
  impact: number // 0-100
}

/**
 * Genera reel de highlights (estilo TikTok/Reels)
 */
export function generateHighlightsReel(result: DebateResult): HighlightClip[] {
  const clips: HighlightClip[] = []

  // Top 5 moments
  for (let r = 0; r < Math.min(result.rounds.length, 5); r++) {
    const round = result.rounds[r]!

    // Find most impactful message
    const messages = round.messages.filter((m) => m.agentKey !== 'meta_moderator')
    if (messages.length === 0) continue

    const longest = messages.reduce((prev, current) => (current.content.length > prev.content.length ? current : prev))

    clips.push({
      title: `Round ${r + 1}: Key Argument`,
      round: r + 1,
      expertId: longest.agentKey,
      content: longest.content.substring(0, 150) + '...',
      duration: 15,
      impact: 70 + Math.random() * 30,
    })
  }

  // Add intervention if exists
  for (let r = 0; r < result.rounds.length; r++) {
    const round = result.rounds[r]!
    const intervention = round.messages.find((m) => m.agentKey === 'meta_moderator')

    if (intervention) {
      clips.push({
        title: '⚡ Plot Twist: Meta-Moderator Intervenes',
        round: r + 1,
        expertId: 'meta_moderator',
        content: intervention.content.substring(0, 150) + '...',
        duration: 10,
        impact: 95,
      })
      break // Only one intervention highlight
    }
  }

  // Sort by impact
  return clips.sort((a, b) => b.impact - a.impact).slice(0, 5)
}

/**
 * Renderiza reel
 */
export function renderHighlightsReel(clips: HighlightClip[]): string {
  let output = '\n🎬 Debate Highlights Reel\n\n'
  output += 'Top moments from this debate:\n\n'

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i]!
    const expertName = clip.expertId.split('_').map((w) => w[0]?.toUpperCase() + w.slice(1)).join(' ')

    output += `${i + 1}. ${clip.title}\n`
    output += `   ${expertName} • ${clip.duration}s • Impact: ${clip.impact.toFixed(0)}/100\n`
    output += `   "${clip.content}"\n\n`
  }

  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0)
  output += `Total reel duration: ${totalDuration}s\n`

  return output
}

/**
 * Imprime reel en consola
 */
export function printHighlightsReel(result: DebateResult): void {
  const clips = generateHighlightsReel(result)
  quoorumLogger.debug('Highlights reel', {
    sessionId: result.sessionId,
    clipCount: clips.length,
    clips,
  })
}

// ============================================================================
// SOCIAL SHARING METADATA
// ============================================================================

export interface SocialMetadata {
  title: string
  description: string
  image?: string
  url?: string
  hashtags: string[]
}

/**
 * Genera metadata para compartir en redes sociales
 */
export function generateSocialMetadata(result: DebateResult, url?: string): SocialMetadata {
  const consensus =
    typeof result.finalRanking[0] === 'string' ? result.finalRanking[0] : result.finalRanking[0]?.option || 'No consensus'

  const title = `Debate: ${consensus}`

  const description = `After ${result.rounds.length} rounds of expert debate, the consensus is: ${consensus} (${(result.consensusScore * 100).toFixed(0)}% agreement)`

  const hashtags = ['Quoorum', 'ExpertDebate', 'DecisionMaking', 'AI', 'Consensus']

  return {
    title,
    description,
    url,
    hashtags,
  }
}

/**
 * Genera texto para tweet/post
 */
export function generateSocialPost(result: DebateResult, url?: string): string {
  const metadata = generateSocialMetadata(result, url)

  let post = `[INFO] ${metadata.title}\n\n`
  post += `${metadata.description}\n\n`

  if (url) {
    post += `🔗 ${url}\n\n`
  }

  post += metadata.hashtags.map((h) => `#${h}`).join(' ')

  return post
}

/**
 * Imprime post en consola
 */
export function printSocialPost(result: DebateResult, url?: string): void {
  const post = generateSocialPost(result, url)
  quoorumLogger.debug('Social media post', {
    sessionId: result.sessionId,
    url,
    post,
  })
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const omgSocial = {
  generateShareableCard,
  renderDebateCardASCII,
  generateShareableCardHTML,
  printDebateCard,
  simulateCommunityVoting,
  renderCommunityVoting,
  printCommunityVoting,
  generateHighlightsReel,
  renderHighlightsReel,
  printHighlightsReel,
  generateSocialMetadata,
  generateSocialPost,
  printSocialPost,
}
