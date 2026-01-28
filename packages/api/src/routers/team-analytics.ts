/**
 * Team Analytics Router
 * Provides usage metrics per team member
 */

import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import { db } from '@quoorum/db'
import { quoorumDebates, profiles, usage } from '@quoorum/db/schema'
import { eq, and, desc, gte, sql, count, sum, inArray } from 'drizzle-orm'
import { getUserTeamOwnerId, getTeamMemberIds } from '../lib/team-helpers'

export const teamAnalyticsRouter = router({
  /**
   * Get usage metrics for all team members
   * Only accessible by team owner or admins
   */
  getTeamUsage: protectedProcedure
    .input(
      z.object({
        periodStart: z.coerce.date().optional(), // Default: start of current month
        periodEnd: z.coerce.date().optional(), // Default: now
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user is team owner
      const teamOwnerId = await getUserTeamOwnerId(ctx.user.id)
      const isTeamOwner = teamOwnerId === ctx.user.id

      if (!teamOwnerId && !isTeamOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Solo el propietario del equipo puede ver estas métricas',
        })
      }

      const effectiveTeamOwnerId = isTeamOwner ? ctx.user.id : teamOwnerId

      // Get all team member IDs
      const teamMemberIds = await getTeamMemberIds(effectiveTeamOwnerId)

      // Default period: current month
      const periodStart = input.periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const periodEnd = input.periodEnd || new Date()

      // Get debates created by each team member
      const debatesByMember = await db
        .select({
          userId: quoorumDebates.userId,
          count: count(),
          totalCost: sum(quoorumDebates.totalCostUsd),
          totalCredits: sum(quoorumDebates.totalCreditsUsed),
        })
        .from(quoorumDebates)
        .where(
          and(
            inArray(quoorumDebates.userId, teamMemberIds),
            gte(quoorumDebates.createdAt, periodStart),
            sql`${quoorumDebates.createdAt} <= ${periodEnd}`,
            sql`${quoorumDebates.deletedAt} IS NULL`
          )
        )
        .groupBy(quoorumDebates.userId)

      // Get usage records for each member
      const usageByMember = await db
        .select({
          userId: usage.userId,
          debatesUsed: sum(usage.debatesUsed),
          creditsDeducted: sum(usage.creditsDeducted),
          totalCostUsd: sum(usage.totalCostUsd),
        })
        .from(usage)
        .where(
          and(
            inArray(usage.userId, teamMemberIds),
            gte(usage.periodStart, periodStart),
            sql`${usage.periodEnd} <= ${periodEnd}`
          )
        )
        .groupBy(usage.userId)

      // Get member profiles
      const memberProfiles = await db
        .select({
          id: profiles.id,
          name: profiles.name,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        })
        .from(profiles)
        .where(inArray(profiles.id, teamMemberIds))

      // Combine data
      const memberMetrics = memberProfiles.map((profile) => {
        const debateStats = debatesByMember.find((d) => d.userId === profile.id)
        const usageStats = usageByMember.find((u) => u.userId === profile.id)

        return {
          memberId: profile.id,
          name: profile.name || 'Sin nombre',
          email: profile.email,
          avatar: profile.avatarUrl,
          metrics: {
            debatesCreated: Number(debateStats?.count || 0),
            totalCostUsd: Number(debateStats?.totalCost || 0) + Number(usageStats?.totalCostUsd || 0),
            totalCreditsUsed: Number(debateStats?.totalCredits || 0) + Number(usageStats?.creditsDeducted || 0),
            debatesUsed: Number(usageStats?.debatesUsed || 0),
          },
        }
      })

      // Calculate team totals
      const teamTotals = {
        totalDebates: memberMetrics.reduce((sum, m) => sum + m.metrics.debatesCreated, 0),
        totalCostUsd: memberMetrics.reduce((sum, m) => sum + m.metrics.totalCostUsd, 0),
        totalCreditsUsed: memberMetrics.reduce((sum, m) => sum + m.metrics.totalCreditsUsed, 0),
        memberCount: memberMetrics.length,
      }

      return {
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
        },
        members: memberMetrics.sort((a, b) => b.metrics.debatesCreated - a.metrics.debatesCreated),
        totals: teamTotals,
      }
    }),

  /**
   * Get usage metrics for a specific team member
   */
  getMemberUsage: protectedProcedure
    .input(
      z.object({
        memberId: z.string().uuid(),
        periodStart: z.coerce.date().optional(),
        periodEnd: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user is team owner or the member themselves
      const teamOwnerId = await getUserTeamOwnerId(ctx.user.id)
      const isTeamOwner = teamOwnerId === ctx.user.id
      const isSelf = ctx.user.id === input.memberId

      if (!isTeamOwner && !isSelf) {
        // Check if both users are in the same team
        const userTeamOwnerId = await getUserTeamOwnerId(ctx.user.id)
        const memberTeamOwnerId = await getUserTeamOwnerId(input.memberId)

        if (userTeamOwnerId !== memberTeamOwnerId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No tienes acceso a estas métricas',
          })
        }
      }

      const periodStart = input.periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      const periodEnd = input.periodEnd || new Date()

      // Get member profile
      const [memberProfile] = await db
        .select({
          id: profiles.id,
          name: profiles.name,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        })
        .from(profiles)
        .where(eq(profiles.id, input.memberId))
        .limit(1)

      if (!memberProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Miembro no encontrado',
        })
      }

      // Get debates created
      const debates = await db
        .select({
          id: quoorumDebates.id,
          question: quoorumDebates.question,
          status: quoorumDebates.status,
          consensusScore: quoorumDebates.consensusScore,
          totalCostUsd: quoorumDebates.totalCostUsd,
          totalCreditsUsed: quoorumDebates.totalCreditsUsed,
          createdAt: quoorumDebates.createdAt,
        })
        .from(quoorumDebates)
        .where(
          and(
            eq(quoorumDebates.userId, input.memberId),
            gte(quoorumDebates.createdAt, periodStart),
            sql`${quoorumDebates.createdAt} <= ${periodEnd}`,
            sql`${quoorumDebates.deletedAt} IS NULL`
          )
        )
        .orderBy(desc(quoorumDebates.createdAt))

      // Get usage records
      const usageRecords = await db
        .select()
        .from(usage)
        .where(
          and(
            eq(usage.userId, input.memberId),
            gte(usage.periodStart, periodStart),
            sql`${usage.periodEnd} <= ${periodEnd}`
          )
        )
        .orderBy(desc(usage.periodStart))

      // Calculate totals
      const totals = {
        debatesCreated: debates.length,
        totalCostUsd: debates.reduce((sum, d) => sum + (d.totalCostUsd || 0), 0),
        totalCreditsUsed: debates.reduce((sum, d) => sum + (d.totalCreditsUsed || 0), 0),
      }

      return {
        member: {
          id: memberProfile.id,
          name: memberProfile.name || 'Sin nombre',
          email: memberProfile.email,
          avatar: memberProfile.avatarUrl,
        },
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
        },
        debates: debates.map((debate) => ({
          ...debate,
          createdAt: debate.createdAt.toISOString(),
        })),
        usageRecords: usageRecords.map((record) => ({
          ...record,
          periodStart: record.periodStart.toISOString(),
          periodEnd: record.periodEnd.toISOString(),
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        })),
        totals,
      }
    }),
})
