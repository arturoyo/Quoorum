/**
 * Admin Pricing Router
 *
 * Gestión completa de pricing desde admin panel:
 * - Configuración global (CREDIT_MULTIPLIER, USD_PER_CREDIT)
 * - Configuración de tiers (precios, créditos, features)
 * - Historial de cambios
 * - Análisis de profit margin
 */

import { z } from 'zod'
import { eq, and, desc, isNull, or } from 'drizzle-orm'
import { router, adminProcedure } from '../trpc'
import { db } from '@quoorum/db'
import {
  pricingGlobalConfig,
  tierPricingConfig,
  pricingChangeHistory,
  users,
} from '@quoorum/db'
import { TRPCError } from '@trpc/server'
import {
  analyzeAllTiers,
  validatePricingConfig,
  validateTierConfig,
  generateImpactSummary,
  type PricingConfig,
  type TierConfig,
} from '@quoorum/quoorum'

// ============================================================================
// SCHEMAS
// ============================================================================

const updateGlobalConfigSchema = z.object({
  creditMultiplier: z.number().min(1).max(5),
  usdPerCredit: z.number().min(0.001).max(0.1),
  changeReason: z.string().min(1).max(500),
})

const updateTierConfigSchema = z.object({
  id: z.string().uuid(),
  tierName: z.string().min(1).max(100).optional(),
  tierDescription: z.string().max(500).optional(),
  monthlyPriceUsd: z.number().int().min(0).optional(),
  yearlyPriceUsd: z.number().int().min(0).optional(),
  monthlyCredits: z.number().int().min(100).optional(),
  yearlyCredits: z.number().int().min(1000).optional(),
  debatesPerMonth: z.number().int().min(1).optional(),
  maxExperts: z.number().int().min(1).optional(),
  maxRoundsPerDebate: z.number().int().min(1).optional(),
  maxTeamMembers: z.number().int().min(1).optional(),
  features: z.object({
    customExperts: z.boolean().optional(),
    pdfExport: z.boolean().optional(),
    apiAccess: z.boolean().optional(),
    prioritySupport: z.boolean().optional(),
    whiteLabel: z.boolean().optional(),
    analytics: z.boolean().optional(),
    webhooks: z.boolean().optional(),
    scenariosAccess: z.boolean().optional(),
    departmentsAccess: z.boolean().optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  isPubliclyVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  changeReason: z.string().min(1).max(500),
})

const createTierConfigSchema = z.object({
  tier: z.string().min(1).max(50),
  tierName: z.string().min(1).max(100),
  tierDescription: z.string().max(500).optional(),
  monthlyPriceUsd: z.number().int().min(0),
  yearlyPriceUsd: z.number().int().min(0),
  monthlyCredits: z.number().int().min(100),
  yearlyCredits: z.number().int().min(1000),
  debatesPerMonth: z.number().int().min(1).default(5),
  maxExperts: z.number().int().min(1).default(4),
  maxRoundsPerDebate: z.number().int().min(1).default(3),
  maxTeamMembers: z.number().int().min(1).default(1),
  features: z.object({
    customExperts: z.boolean().optional(),
    pdfExport: z.boolean().optional(),
    apiAccess: z.boolean().optional(),
    prioritySupport: z.boolean().optional(),
    whiteLabel: z.boolean().optional(),
    analytics: z.boolean().optional(),
    webhooks: z.boolean().optional(),
    scenariosAccess: z.boolean().optional(),
    departmentsAccess: z.boolean().optional(),
  }).optional(),
  isActive: z.boolean().default(true),
  isPubliclyVisible: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  changeReason: z.string().min(1).max(500),
})

// ============================================================================
// ROUTER
// ============================================================================

export const adminPricingRouter = router({
  // ============================================
  // GLOBAL CONFIG
  // ============================================

  /**
   * Get current active global pricing config
   */
  getGlobalConfig: adminProcedure.query(async () => {
    const [config] = await db
      .select()
      .from(pricingGlobalConfig)
      .where(
        and(
          eq(pricingGlobalConfig.isActive, true),
          or(
            isNull(pricingGlobalConfig.effectiveUntil),
            // effectiveUntil > now()
          )
        )
      )
      .orderBy(desc(pricingGlobalConfig.effectiveFrom))
      .limit(1)

    if (!config) {
      // Return hardcoded defaults if no config exists
      return {
        id: 'default',
        creditMultiplier: '1.75',
        usdPerCredit: '0.01',
        isActive: true,
        effectiveFrom: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    return config
  }),

  /**
   * Update global pricing config
   * Creates new record and deactivates old one (for history)
   */
  updateGlobalConfig: adminProcedure
    .input(updateGlobalConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const { creditMultiplier, usdPerCredit, changeReason } = input

      // Validate new config
      const validation = validatePricingConfig({ creditMultiplier, usdPerCredit })
      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Configuración inválida: ${validation.errors.join(', ')}`,
        })
      }

      // Get current config
      const [currentConfig] = await db
        .select()
        .from(pricingGlobalConfig)
        .where(eq(pricingGlobalConfig.isActive, true))
        .limit(1)

      // Deactivate current config
      if (currentConfig) {
        await db
          .update(pricingGlobalConfig)
          .set({
            isActive: false,
            effectiveUntil: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(pricingGlobalConfig.id, currentConfig.id))
      }

      // Create new config
      const [newConfig] = await db
        .insert(pricingGlobalConfig)
        .values({
          creditMultiplier: creditMultiplier.toString(),
          usdPerCredit: usdPerCredit.toString(),
          isActive: true,
          effectiveFrom: new Date(),
          createdBy: ctx.userId,
          changeReason,
        })
        .returning()

      // Log change in history
      if (currentConfig && newConfig) {
        await db.insert(pricingChangeHistory).values({
          changeType: 'global_config',
          entityType: 'global_config',
          entityId: newConfig.id,
          oldValues: {
            creditMultiplier: currentConfig.creditMultiplier,
            usdPerCredit: currentConfig.usdPerCredit,
          },
          newValues: {
            creditMultiplier: newConfig.creditMultiplier,
            usdPerCredit: newConfig.usdPerCredit,
          },
          changedBy: ctx.userId,
          changeReason,
        } as any)
      }

      return newConfig
    }),

  // ============================================
  // TIER CONFIG
  // ============================================

  /**
   * Get all tier configurations
   */
  listTierConfigs: adminProcedure.query(async () => {
    const configs = await db
      .select()
      .from(tierPricingConfig)
      .where(
        and(
          eq(tierPricingConfig.isActive, true),
          or(
            isNull(tierPricingConfig.effectiveUntil),
            // effectiveUntil > now()
          )
        )
      )
      .orderBy(tierPricingConfig.sortOrder)

    return configs
  }),

  /**
   * Get single tier config
   */
  getTierConfig: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const [config] = await db
        .select()
        .from(tierPricingConfig)
        .where(eq(tierPricingConfig.id, input.id))
        .limit(1)

      if (!config) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tier config no encontrado',
        })
      }

      return config
    }),

  /**
   * Create new tier configuration
   */
  createTierConfig: adminProcedure
    .input(createTierConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const { changeReason, ...configData } = input

      // Get global config for validation
      const [globalConfig] = await db
        .select()
        .from(pricingGlobalConfig)
        .where(eq(pricingGlobalConfig.isActive, true))
        .limit(1)

      const pricingConfig: PricingConfig = {
        creditMultiplier: Number(globalConfig?.creditMultiplier || 1.75),
        usdPerCredit: Number(globalConfig?.usdPerCredit || 0.01),
      }

      // Validate tier config
      const tierConfigForValidation: TierConfig = {
        tier: configData.tier,
        tierName: configData.tierName,
        monthlyPriceUsd: configData.monthlyPriceUsd,
        monthlyCredits: configData.monthlyCredits,
      }

      const validation = validateTierConfig(tierConfigForValidation, pricingConfig)

      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Configuración de tier inválida: ${validation.errors.join(', ')}`,
        })
      }

      // Create tier config
      const [newConfig] = await db
        .insert(tierPricingConfig)
        .values({
          ...configData,
          createdBy: ctx.userId,
          changeReason,
        })
        .returning()

      // Log in history
      if (newConfig) {
        await db.insert(pricingChangeHistory).values({
          changeType: 'tier_created',
          entityType: 'tier_pricing_config',
          entityId: newConfig.id,
          newValues: configData,
          changedBy: ctx.userId,
          changeReason,
        } as any)
      }

      return newConfig
    }),

  /**
   * Update tier configuration
   */
  updateTierConfig: adminProcedure
    .input(updateTierConfigSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, changeReason, ...updates } = input

      // Get current config
      const [currentConfig] = await db
        .select()
        .from(tierPricingConfig)
        .where(eq(tierPricingConfig.id, id))
        .limit(1)

      if (!currentConfig) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tier config no encontrado',
        })
      }

      // Merge updates with current config
      const updatedConfig = {
        ...currentConfig,
        ...updates,
      }

      // Get global config for validation
      const [globalConfig] = await db
        .select()
        .from(pricingGlobalConfig)
        .where(eq(pricingGlobalConfig.isActive, true))
        .limit(1)

      const pricingConfig: PricingConfig = {
        creditMultiplier: Number(globalConfig?.creditMultiplier || 1.75),
        usdPerCredit: Number(globalConfig?.usdPerCredit || 0.01),
      }

      // Validate new config
      const tierConfigForValidation: TierConfig = {
        tier: updatedConfig.tier,
        tierName: updatedConfig.tierName,
        monthlyPriceUsd: updatedConfig.monthlyPriceUsd,
        monthlyCredits: updatedConfig.monthlyCredits,
      }

      const validation = validateTierConfig(tierConfigForValidation, pricingConfig)

      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Configuración de tier inválida: ${validation.errors.join(', ')}`,
        })
      }

      // Update tier config
      const [newConfig] = await db
        .update(tierPricingConfig)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(tierPricingConfig.id, id))
        .returning()

      // Log change in history
      if (newConfig) {
        await db.insert(pricingChangeHistory).values({
          changeType: 'tier_config',
          entityType: 'tier_pricing_config',
          entityId: id,
          oldValues: currentConfig,
          newValues: updates,
          changedBy: ctx.userId,
          changeReason,
        } as any)
      }

      return newConfig
    }),

  /**
   * Delete (deactivate) tier configuration
   */
  deleteTierConfig: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        changeReason: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, changeReason } = input

      // Get current config
      const [currentConfig] = await db
        .select()
        .from(tierPricingConfig)
        .where(eq(tierPricingConfig.id, id))
        .limit(1)

      if (!currentConfig) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tier config no encontrado',
        })
      }

      // Deactivate tier
      await db
        .update(tierPricingConfig)
        .set({
          isActive: false,
          effectiveUntil: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tierPricingConfig.id, id))

      // Log in history
      await db.insert(pricingChangeHistory).values({
        changeType: 'tier_deleted',
        entityType: 'tier_pricing_config',
        entityId: id,
        oldValues: currentConfig,
        changedBy: ctx.userId,
        changeReason,
      } as any)

      return { success: true }
    }),

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get profit margin analysis for all tiers
   */
  getProfitMarginAnalysis: adminProcedure.query(async () => {
    // Get global config
    const [globalConfig] = await db
      .select()
      .from(pricingGlobalConfig)
      .where(eq(pricingGlobalConfig.isActive, true))
      .limit(1)

    const pricingConfig: PricingConfig = {
      creditMultiplier: Number(globalConfig?.creditMultiplier || 1.75),
      usdPerCredit: Number(globalConfig?.usdPerCredit || 0.01),
    }

    // Get all tier configs
    const tierConfigs = await db
      .select()
      .from(tierPricingConfig)
      .where(eq(tierPricingConfig.isActive, true))
      .orderBy(tierPricingConfig.sortOrder)

    // Convert to TierConfig format
    const tiersForAnalysis: TierConfig[] = tierConfigs.map((tc) => ({
      tier: tc.tier,
      tierName: tc.tierName,
      monthlyPriceUsd: tc.monthlyPriceUsd,
      monthlyCredits: tc.monthlyCredits,
    }))

    // Analyze all tiers
    const analysis = analyzeAllTiers(tiersForAnalysis, pricingConfig)

    return {
      globalConfig: pricingConfig,
      tiers: analysis,
    }
  }),

  /**
   * Preview impact of changing global config
   */
  previewGlobalConfigChange: adminProcedure
    .input(
      z.object({
        creditMultiplier: z.number().min(1).max(5),
        usdPerCredit: z.number().min(0.001).max(0.1),
      })
    )
    .query(async ({ input }) => {
      // Get current config
      const [currentConfig] = await db
        .select()
        .from(pricingGlobalConfig)
        .where(eq(pricingGlobalConfig.isActive, true))
        .limit(1)

      const oldConfig: PricingConfig = {
        creditMultiplier: Number(currentConfig?.creditMultiplier || 1.75),
        usdPerCredit: Number(currentConfig?.usdPerCredit || 0.01),
      }

      const newConfig: PricingConfig = {
        creditMultiplier: input.creditMultiplier,
        usdPerCredit: input.usdPerCredit,
      }

      // Get tier configs
      const tierConfigs = await db
        .select()
        .from(tierPricingConfig)
        .where(eq(tierPricingConfig.isActive, true))
        .orderBy(tierPricingConfig.sortOrder)

      const tiersForAnalysis: TierConfig[] = tierConfigs.map((tc) => ({
        tier: tc.tier,
        tierName: tc.tierName,
        monthlyPriceUsd: tc.monthlyPriceUsd,
        monthlyCredits: tc.monthlyCredits,
      }))

      // Generate impact summary
      const impact = generateImpactSummary(oldConfig, newConfig, tiersForAnalysis)

      // Analyze with new config
      const newAnalysis = analyzeAllTiers(tiersForAnalysis, newConfig)

      return {
        impactSummary: impact,
        newAnalysis,
      }
    }),

  // ============================================
  // CHANGE HISTORY
  // ============================================

  /**
   * Get pricing change history
   */
  getChangeHistory: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const changes = await db
        .select({
          id: pricingChangeHistory.id,
          changeType: pricingChangeHistory.changeType,
          entityType: pricingChangeHistory.entityType,
          entityId: pricingChangeHistory.entityId,
          oldValues: pricingChangeHistory.oldValues,
          newValues: pricingChangeHistory.newValues,
          changedAt: pricingChangeHistory.changedAt,
          changeReason: pricingChangeHistory.changeReason,
          changedByEmail: users.email,
          changedByName: users.name,
        })
        .from(pricingChangeHistory)
        .leftJoin(users, eq(pricingChangeHistory.changedBy, users.id))
        .orderBy(desc(pricingChangeHistory.changedAt))
        .limit(input.limit)
        .offset(input.offset)

      return changes
    }),
})
