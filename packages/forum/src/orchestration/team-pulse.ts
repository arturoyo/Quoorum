/**
 * Team Pulse - Team voting and input on debates
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TeamMember {
  id: string
  name: string
  role: string
  department?: string
  weight?: number // Voting weight (default 1)
}

export interface Vote {
  memberId: string
  option: string
  confidence: number // 1-10
  reasoning?: string
  timestamp: Date
}

export interface PollOption {
  id: string
  label: string
  description?: string
}

export interface TeamPoll {
  id: string
  question: string
  debateId?: string
  options: PollOption[]
  votes: Vote[]
  status: 'open' | 'closed'
  createdAt: Date
  closedAt?: Date
  createdBy?: string
}

export interface PollResults {
  pollId: string
  question: string
  totalVotes: number
  results: Array<{
    option: string
    votes: number
    percentage: number
    averageConfidence: number
    weightedScore: number
  }>
  consensus: number // 0-100, how aligned the team is
  winner: string
  dissent: string[] // Minority opinions
}

export interface TeamSentiment {
  pollId: string
  positive: number
  neutral: number
  negative: number
  keyThemes: string[]
}

// ============================================================================
// TEAM PULSE
// ============================================================================

export class TeamPulse {
  private members: Map<string, TeamMember> = new Map()
  private polls: Map<string, TeamPoll> = new Map()

  /** Add team member */
  addMember(member: TeamMember): void {
    this.members.set(member.id, { ...member, weight: member.weight ?? 1 })
  }

  /** Remove team member */
  removeMember(id: string): void { this.members.delete(id) }

  /** Get all members */
  getMembers(): TeamMember[] { return Array.from(this.members.values()) }

  /** Create a new poll */
  createPoll(question: string, options: string[], debateId?: string): TeamPoll {
    const poll: TeamPoll = {
      id: `poll-${Date.now()}`,
      question, debateId,
      options: options.map((label, i) => ({ id: `opt-${i}`, label })),
      votes: [],
      status: 'open',
      createdAt: new Date(),
    }
    this.polls.set(poll.id, poll)
    return poll
  }

  /** Cast a vote */
  vote(pollId: string, memberId: string, optionId: string, confidence: number, reasoning?: string): Vote {
    const poll = this.polls.get(pollId)
    if (!poll) throw new Error('Poll not found')
    if (poll.status !== 'open') throw new Error('Poll is closed')
    if (!this.members.has(memberId)) throw new Error('Member not found')
    if (!poll.options.find(o => o.id === optionId)) throw new Error('Invalid option')

    // Remove existing vote from same member
    poll.votes = poll.votes.filter(v => v.memberId !== memberId)

    const vote: Vote = { memberId, option: optionId, confidence: Math.min(10, Math.max(1, confidence)), reasoning, timestamp: new Date() }
    poll.votes.push(vote)
    return vote
  }

  /** Close a poll */
  closePoll(pollId: string): PollResults {
    const poll = this.polls.get(pollId)
    if (!poll) throw new Error('Poll not found')
    poll.status = 'closed'
    poll.closedAt = new Date()
    return this.getResults(pollId)
  }

  /** Get poll results */
  getResults(pollId: string): PollResults {
    const poll = this.polls.get(pollId)
    if (!poll) throw new Error('Poll not found')

    const optionStats = new Map<string, { votes: number; totalConf: number; weighted: number }>()
    for (const opt of poll.options) {
      optionStats.set(opt.id, { votes: 0, totalConf: 0, weighted: 0 })
    }

    for (const vote of poll.votes) {
      const stat = optionStats.get(vote.option)
      const member = this.members.get(vote.memberId)
      if (stat && member) {
        stat.votes++
        stat.totalConf += vote.confidence
        stat.weighted += vote.confidence * (member.weight ?? 1)
      }
    }

    const totalVotes = poll.votes.length
    const results = poll.options.map(opt => {
      const stat = optionStats.get(opt.id)!
      return {
        option: opt.label,
        votes: stat.votes,
        percentage: totalVotes > 0 ? (stat.votes / totalVotes) * 100 : 0,
        averageConfidence: stat.votes > 0 ? stat.totalConf / stat.votes : 0,
        weightedScore: stat.weighted,
      }
    }).sort((a, b) => b.weightedScore - a.weightedScore)

    const winner = results[0]?.option ?? 'No votes'
    const topScore = results[0]?.percentage ?? 0
    const consensus = topScore >= 80 ? 100 : topScore >= 60 ? 75 : topScore >= 40 ? 50 : 25

    const dissent = poll.votes
      .filter(v => v.option !== poll.options.find(o => o.label === winner)?.id)
      .map(v => v.reasoning)
      .filter((r): r is string => !!r)

    return { pollId, question: poll.question, totalVotes, results, consensus, winner, dissent }
  }

  /** Get poll */
  getPoll(pollId: string): TeamPoll | undefined { return this.polls.get(pollId) }

  /** Get all polls */
  getPolls(status?: 'open' | 'closed'): TeamPoll[] {
    let polls = Array.from(this.polls.values())
    if (status) polls = polls.filter(p => p.status === status)
    return polls.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /** Quick yes/no poll */
  createYesNoPoll(question: string, debateId?: string): TeamPoll {
    return this.createPoll(question, ['Sí', 'No', 'Abstención'], debateId)
  }

  /** Quick approval poll */
  createApprovalPoll(question: string, debateId?: string): TeamPoll {
    return this.createPoll(question, ['Aprobar', 'Aprobar con cambios', 'Rechazar', 'Necesito más info'], debateId)
  }

  /** Get participation rate */
  getParticipation(pollId: string): number {
    const poll = this.polls.get(pollId)
    if (!poll) return 0
    return this.members.size > 0 ? (poll.votes.length / this.members.size) * 100 : 0
  }

  /** Get members who haven't voted */
  getPendingVoters(pollId: string): TeamMember[] {
    const poll = this.polls.get(pollId)
    if (!poll) return []
    const voted = new Set(poll.votes.map(v => v.memberId))
    return this.getMembers().filter(m => !voted.has(m.id))
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createTeamPulse(): TeamPulse {
  return new TeamPulse()
}
