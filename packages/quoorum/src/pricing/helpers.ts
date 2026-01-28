/**
 * Pricing Helpers
 *
 * Funciones para calcular profit margin, validar configuración,
 * y determinar si un tier es rentable
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PricingConfig {
  creditMultiplier: number
  usdPerCredit: number
}

export interface TierConfig {
  tier: string
  tierName: string
  monthlyPriceUsd: number // in cents
  monthlyCredits: number
}

export interface ProfitMarginAnalysis {
  tier: string
  tierName: string
  monthlyPriceUsd: number // in USD
  monthlyCredits: number
  breakEvenCredits: number
  breakEvenPercentage: number
  profitMarginAt100Percent: number // in USD
  profitMarginPercentage: number
  isProfitable: boolean
  recommendation: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// ============================================================================
// PROFIT MARGIN CALCULATIONS
// ============================================================================

/**
 * Calculate how much API cost 1 credit can cover
 *
 * @example
 * creditMultiplier = 1.75, usdPerCredit = 0.01
 * coveragePerCredit = 0.01 / 1.75 = $0.00571
 *
 * Interpretation: Each credit sold covers up to $0.00571 in API costs
 */
export function getApiCostCoveragePerCredit(config: PricingConfig): number {
  return config.usdPerCredit / config.creditMultiplier
}

/**
 * Calculate API cost for a given number of credits
 *
 * @param credits Number of credits used
 * @param config Pricing configuration
 * @returns API cost in USD
 *
 * @example
 * calculateApiCost(1000, { creditMultiplier: 1.75, usdPerCredit: 0.01 })
 * = 1000 × (0.01 / 1.75) = $5.71
 */
export function calculateApiCost(credits: number, config: PricingConfig): number {
  const costPerCredit = getApiCostCoveragePerCredit(config)
  return credits * costPerCredit
}

/**
 * Calculate breakeven point for a tier
 * Returns the number of credits at which we start losing money
 *
 * @example
 * monthlyPriceUsd = 4900 (cents) = $49.00
 * creditMultiplier = 1.75, usdPerCredit = 0.01
 *
 * costPerCredit = 0.01 / 1.75 = $0.00571
 * breakEven = 49.00 / 0.00571 = 8,580 créditos
 */
export function calculateBreakEvenPoint(
  monthlyPriceUsd: number, // in cents
  config: PricingConfig
): number {
  const priceInDollars = monthlyPriceUsd / 100
  const costPerCredit = getApiCostCoveragePerCredit(config)
  return Math.floor(priceInDollars / costPerCredit)
}

/**
 * Analyze profit margin for a tier
 *
 * @param tierConfig Tier configuration
 * @param pricingConfig Global pricing config
 * @returns Complete profit margin analysis
 */
export function analyzeProfitMargin(
  tierConfig: TierConfig,
  pricingConfig: PricingConfig
): ProfitMarginAnalysis {
  const { tier, tierName, monthlyPriceUsd, monthlyCredits } = tierConfig

  // Convert price to dollars
  const priceInDollars = monthlyPriceUsd / 100

  // Calculate breakeven
  const breakEvenCredits = calculateBreakEvenPoint(monthlyPriceUsd, pricingConfig)
  const breakEvenPercentage = (breakEvenCredits / monthlyCredits) * 100

  // Calculate profit margin if user uses 100% of credits
  const apiCostAt100 = calculateApiCost(monthlyCredits, pricingConfig)
  const profitMarginAt100Percent = priceInDollars - apiCostAt100
  const profitMarginPercentage = (profitMarginAt100Percent / priceInDollars) * 100

  // Determine if profitable
  const isProfitable = profitMarginAt100Percent > 0

  // Generate recommendation
  let recommendation = ''
  if (isProfitable) {
    if (profitMarginPercentage < 10) {
      recommendation = 'Margen muy ajustado. Considerar subir precio o reducir créditos.'
    } else if (profitMarginPercentage < 20) {
      recommendation = 'Margen aceptable pero ajustado. Monitorear uso real de clientes.'
    } else if (profitMarginPercentage < 30) {
      recommendation = 'Margen saludable.'
    } else {
      recommendation = 'Margen excelente.'
    }
  } else {
    const lossAmount = Math.abs(profitMarginAt100Percent)
    recommendation = `⚠️ PÉRDIDA de $${lossAmount.toFixed(2)}/mes si cliente usa todos los créditos. ACCIÓN REQUERIDA.`
  }

  return {
    tier,
    tierName,
    monthlyPriceUsd: priceInDollars,
    monthlyCredits,
    breakEvenCredits,
    breakEvenPercentage: Math.round(breakEvenPercentage * 10) / 10,
    profitMarginAt100Percent,
    profitMarginPercentage: Math.round(profitMarginPercentage * 10) / 10,
    isProfitable,
    recommendation,
  }
}

/**
 * Analyze all tiers at once
 */
export function analyzeAllTiers(
  tiers: TierConfig[],
  pricingConfig: PricingConfig
): ProfitMarginAnalysis[] {
  return tiers.map((tier) => analyzeProfitMargin(tier, pricingConfig))
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate pricing configuration
 */
export function validatePricingConfig(config: PricingConfig): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Credit multiplier validation
  if (config.creditMultiplier <= 1) {
    errors.push('CREDIT_MULTIPLIER debe ser mayor que 1 (markup mínimo requerido)')
  } else if (config.creditMultiplier < 1.5) {
    warnings.push('CREDIT_MULTIPLIER < 1.5 resulta en margen muy bajo (<33%)')
  } else if (config.creditMultiplier > 3) {
    warnings.push('CREDIT_MULTIPLIER > 3 puede hacer pricing menos competitivo')
  }

  // USD per credit validation
  if (config.usdPerCredit <= 0) {
    errors.push('USD_PER_CREDIT debe ser mayor que 0')
  } else if (config.usdPerCredit < 0.005) {
    warnings.push('USD_PER_CREDIT muy bajo puede causar confusión en clientes')
  } else if (config.usdPerCredit > 0.1) {
    warnings.push('USD_PER_CREDIT muy alto (>$0.10) puede reducir percepción de valor')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate tier configuration
 */
export function validateTierConfig(
  tierConfig: TierConfig,
  pricingConfig: PricingConfig
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Price validation
  if (tierConfig.monthlyPriceUsd < 0) {
    errors.push('Precio no puede ser negativo')
  }

  // Credits validation
  if (tierConfig.monthlyCredits <= 0) {
    errors.push('Créditos deben ser mayor que 0')
  }

  // Profit margin validation
  const analysis = analyzeProfitMargin(tierConfig, pricingConfig)

  if (!analysis.isProfitable) {
    errors.push(
      `Tier no rentable: pierde $${Math.abs(analysis.profitMarginAt100Percent).toFixed(2)}/mes si cliente usa todos los créditos`
    )
  } else if (analysis.profitMarginPercentage < 10) {
    warnings.push(
      `Margen muy bajo (${analysis.profitMarginPercentage.toFixed(1)}%). Considerar ajustar precio o créditos`
    )
  }

  // Breakeven validation
  if (analysis.breakEvenPercentage < 50) {
    warnings.push(
      `Breakeven muy bajo (${analysis.breakEvenPercentage.toFixed(1)}%). Cliente puede usar >50% y causar pérdidas`
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format USD amount from cents
 */
export function formatUsdFromCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Format profit margin
 */
export function formatProfitMargin(margin: number): string {
  if (margin >= 0) {
    return `+${formatUsdFromCents(Math.round(margin * 100))} (${margin > 0 ? ((margin / Math.abs(margin)) * 100).toFixed(1) : '0.0'}%)`
  } else {
    return `-${formatUsdFromCents(Math.round(Math.abs(margin) * 100))} (${((margin / Math.abs(margin)) * 100).toFixed(1)}%)`
  }
}

/**
 * Generate impact summary when changing config
 */
export function generateImpactSummary(
  oldConfig: PricingConfig,
  newConfig: PricingConfig,
  tiers: TierConfig[]
): {
  globalImpact: string
  tierImpacts: Array<{
    tier: string
    oldBreakEven: number
    newBreakEven: number
    change: string
  }>
} {
  const oldAnalysis = analyzeAllTiers(tiers, oldConfig)
  const newAnalysis = analyzeAllTiers(tiers, newConfig)

  const tierImpacts = tiers.map((tier, index) => {
    const oldBE = oldAnalysis[index]!.breakEvenCredits
    const newBE = newAnalysis[index]!.breakEvenCredits
    const delta = newBE - oldBE
    const sign = delta >= 0 ? '+' : ''
    const change = `${sign}${delta} créditos (${sign}${((delta / oldBE) * 100).toFixed(1)}%)`

    return {
      tier: tier.tierName,
      oldBreakEven: oldBE,
      newBreakEven: newBE,
      change,
    }
  })

  const multiplierChange = ((newConfig.creditMultiplier - oldConfig.creditMultiplier) / oldConfig.creditMultiplier) * 100
  const globalImpact = `Markup ${oldConfig.creditMultiplier}x → ${newConfig.creditMultiplier}x (${multiplierChange > 0 ? '+' : ''}${multiplierChange.toFixed(1)}%)`

  return {
    globalImpact,
    tierImpacts,
  }
}
