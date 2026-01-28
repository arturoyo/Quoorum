/**
 * Team Helpers
 * Utility functions for team-related operations
 */

import { db } from '@quoorum/db'
import { teamMembers } from '@quoorum/db/schema'
import { eq, and, or } from 'drizzle-orm'

/**
 * Check if a user is a team member (active) of any team
 * Returns the teamOwnerId if found, null otherwise
 */
export async function getUserTeamOwnerId(userId: string): Promise<string | null> {
  const [member] = await db
    .select({ teamOwnerId: teamMembers.teamOwnerId })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.memberProfileId, userId),
        eq(teamMembers.status, 'active')
      )
    )
    .limit(1)

  return member?.teamOwnerId || null
}

/**
 * Check if a user is a team owner
 * Returns true if the user owns any team
 */
export async function isTeamOwner(userId: string): Promise<boolean> {
  const [member] = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamOwnerId, userId),
        eq(teamMembers.role, 'owner')
      )
    )
    .limit(1)

  return !!member
}

/**
 * Get all team member IDs (including owner) for a team
 * Returns array of profile IDs
 */
export async function getTeamMemberIds(teamOwnerId: string): Promise<string[]> {
  const members = await db
    .select({ memberProfileId: teamMembers.memberProfileId, teamOwnerId: teamMembers.teamOwnerId })
    .from(teamMembers)
    .where(
      and(
        or(
          eq(teamMembers.teamOwnerId, teamOwnerId),
          eq(teamMembers.memberProfileId, teamOwnerId)
        ),
        eq(teamMembers.status, 'active')
      )
    )

  // Include owner + all active members
  const memberIds = new Set<string>([teamOwnerId])
  members.forEach(m => {
    if (m.memberProfileId) {
      memberIds.add(m.memberProfileId)
    }
  })

  return Array.from(memberIds)
}

/**
 * Check if a user can access a debate based on team membership
 * Returns true if:
 * - User is the owner of the debate
 * - Debate visibility is 'team' and user is a member of the owner's team
 * - Debate visibility is 'public'
 */
export async function canUserAccessDebate(
  userId: string,
  debateUserId: string,
  debateVisibility: 'private' | 'team' | 'public'
): Promise<boolean> {
  // Owner can always access
  if (userId === debateUserId) {
    return true
  }

  // Public debates are accessible to everyone
  if (debateVisibility === 'public') {
    return true
  }

  // Team debates: check if user is member of the owner's team
  if (debateVisibility === 'team') {
    // Check if debate owner is a team owner
    const teamOwnerId = await getUserTeamOwnerId(debateUserId)
    if (teamOwnerId) {
      // Check if current user is member of that team
      const memberIds = await getTeamMemberIds(teamOwnerId)
      return memberIds.includes(userId)
    }
    // If debate owner is not in a team, only they can access
    return false
  }

  // Private debates: only owner
  return false
}

/**
 * Get team member role for a user in a team
 * Returns role or null if not a member
 */
export async function getTeamMemberRole(
  userId: string,
  teamOwnerId: string
): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
  // Check if user is the owner
  if (userId === teamOwnerId) {
    return 'owner'
  }

  // Check if user is a member
  const [member] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.memberProfileId, userId),
        eq(teamMembers.teamOwnerId, teamOwnerId),
        eq(teamMembers.status, 'active')
      )
    )
    .limit(1)

  return (member?.role as 'admin' | 'member' | 'viewer') || null
}

/**
 * Check if user has permission based on role
 */
export function hasPermission(
  role: 'owner' | 'admin' | 'member' | 'viewer' | null,
  permission: 'canCreate' | 'canAccess' | 'canManage' | 'canView'
): boolean {
  if (!role) return false

  switch (permission) {
    case 'canCreate':
      return role === 'owner' || role === 'admin' || role === 'member'
    case 'canAccess':
      return role === 'owner' || role === 'admin' || role === 'member' || role === 'viewer'
    case 'canManage':
      return role === 'owner' || role === 'admin'
    case 'canView':
      return role === 'owner' || role === 'admin' || role === 'member' || role === 'viewer'
    default:
      return false
  }
}

/**
 * Parse permissions JSON from team member
 * Returns default permissions if not set
 */
export function parseTeamMemberPermissions(
  permissionsJson: string | null
): {
  canCreateDebates: boolean
  canAccessSensitiveInfo: boolean
  canManageTeam: boolean
  canViewAnalytics: boolean
} {
  if (!permissionsJson) {
    // Default permissions based on role (will be checked separately)
    return {
      canCreateDebates: true,
      canAccessSensitiveInfo: false,
      canManageTeam: false,
      canViewAnalytics: false,
    }
  }

  try {
    const parsed = JSON.parse(permissionsJson) as {
      canCreateDebates?: boolean
      canAccessSensitiveInfo?: boolean
      canManageTeam?: boolean
      canViewAnalytics?: boolean
    }

    return {
      canCreateDebates: parsed.canCreateDebates ?? true,
      canAccessSensitiveInfo: parsed.canAccessSensitiveInfo ?? false,
      canManageTeam: parsed.canManageTeam ?? false,
      canViewAnalytics: parsed.canViewAnalytics ?? false,
    }
  } catch {
    // Invalid JSON, return defaults
    return {
      canCreateDebates: true,
      canAccessSensitiveInfo: false,
      canManageTeam: false,
      canViewAnalytics: false,
    }
  }
}

/**
 * Check if user can perform an action based on role and permissions
 */
export async function canUserPerformAction(
  userId: string,
  teamOwnerId: string,
  action: 'createDebate' | 'accessSensitiveInfo' | 'manageTeam' | 'viewAnalytics'
): Promise<boolean> {
  const role = await getTeamMemberRole(userId, teamOwnerId)
  if (!role) return false

  // Get permissions from team member record
  const [member] = await db
    .select({ permissions: teamMembers.permissions })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.memberProfileId, userId),
        eq(teamMembers.teamOwnerId, teamOwnerId),
        eq(teamMembers.status, 'active')
      )
    )
    .limit(1)

  const permissions = parseTeamMemberPermissions(member?.permissions || null)

  // Owner always has all permissions
  if (role === 'owner') {
    return true
  }

  // Check specific permission
  switch (action) {
    case 'createDebate':
      return hasPermission(role, 'canCreate') && permissions.canCreateDebates
    case 'accessSensitiveInfo':
      return hasPermission(role, 'canAccess') && permissions.canAccessSensitiveInfo
    case 'manageTeam':
      return hasPermission(role, 'canManage') && permissions.canManageTeam
    case 'viewAnalytics':
      return hasPermission(role, 'canView') && permissions.canViewAnalytics
    default:
      return false
  }
}
