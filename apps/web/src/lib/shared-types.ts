/**
 * Shared types for Forum web app
 */

// Cache time constants
export const CACHE_TIMES = {
  SHORT: 1000 * 30, // 30 seconds
  STANDARD: 1000 * 60, // 1 minute
  MEDIUM: 1000 * 60 * 5, // 5 minutes
  LONG: 1000 * 60 * 30, // 30 minutes
}

// Base widget props
export interface BaseWidgetProps {
  className?: string
  refreshInterval?: number
}

export interface ForumDebate {
  id: string
  userId: string
  question: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  consensusScore: number | null
  totalCostUsd: number | null
  createdAt: Date
  updatedAt: Date
}

export interface ForumExpert {
  id: string
  name: string
  title: string
  expertise: string[]
  personality: string
}

export interface ForumRound {
  round: number
  messages: ForumMessage[]
  consensusLevel: number | null
}

export interface ForumMessage {
  role: string
  content: string
  expertId?: string
}

export interface TeamMember {
  id: string
  userId: string
  roleId: string | null
  roleName: string
  isActive: boolean
  createdAt: Date
  name: string | null
  avatar: string | null
}

// More permissive type for API responses
export type TeamMemberResponse = {
  id: string
  userId: string
  roleId: string | null
  roleName: string
  isActive: boolean
  createdAt: Date
  name: string | null
  avatar: string | null
}

export interface LinkedDeal {
  link: {
    id: string
    userId: string
    debateId: string
    dealId: string
    context: string
    createdAt: Date
    updatedAt: Date
    outcomeData: Record<string, unknown> | null
  }
  deal: {
    id: string
    name: string
    title?: string | null
    value: number | null
    stage: string | null
    clientId: string | null
    description: string | null
    metadata: Record<string, unknown> | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    expectedCloseDate: Date | null
  }
}
