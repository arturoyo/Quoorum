/**
 * Forum Configuration
 *
 * Configuración centralizada del sistema dinámico de expertos
 */

export interface ForumConfig {
  /** Complejidad mínima para activar modo dinámico (1-10) */
  dynamicModeComplexityThreshold: number

  /** Número máximo de áreas para usar modo estático */
  staticModeMaxAreas: number

  /** Número mínimo de expertos en modo dinámico */
  minExperts: number

  /** Número máximo de expertos en modo dinámico */
  maxExperts: number

  /** Frecuencia de intervención para debates de alta calidad (cada N rondas) */
  interventionFrequencyHigh: number

  /** Frecuencia de intervención para debates de calidad media (cada N rondas) */
  interventionFrequencyMedium: number

  /** Frecuencia de intervención para debates de baja calidad (cada N rondas) */
  interventionFrequencyLow: number

  /** Threshold de calidad para considerar debate de alta calidad */
  highQualityThreshold: number

  /** Threshold de calidad para considerar debate de baja calidad */
  lowQualityThreshold: number

  /** Threshold de calidad para activar intervención del meta-moderador */
  interventionQualityThreshold: number

  /** Número máximo de rondas de debate */
  maxRounds: number

  /** Máximo de tokens por mensaje de agente */
  maxTokensPerMessage: number
}

/**
 * Configuración por defecto del sistema
 */
export const DEFAULT_CONFIG: ForumConfig = {
  // Mode detection
  dynamicModeComplexityThreshold: 5,
  staticModeMaxAreas: 2,

  // Expert matching
  minExperts: 5,
  maxExperts: 7,

  // Intervention frequency
  interventionFrequencyHigh: 5, // Cada 5 rondas si calidad >= 80
  interventionFrequencyMedium: 3, // Cada 3 rondas si calidad 60-80
  interventionFrequencyLow: 2, // Cada 2 rondas si calidad < 60

  // Quality thresholds
  highQualityThreshold: 80,
  lowQualityThreshold: 60,
  interventionQualityThreshold: 70,

  // Debate limits
  maxRounds: 20,
  maxTokensPerMessage: 50,
}

/**
 * Configuración actual (puede ser modificada en runtime)
 */
let currentConfig: ForumConfig = { ...DEFAULT_CONFIG }

/**
 * Obtener configuración actual
 */
export function getConfig(): Readonly<ForumConfig> {
  return currentConfig
}

/**
 * Actualizar configuración (merge con valores existentes)
 */
export function updateConfig(partialConfig: Partial<ForumConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...partialConfig,
  }
}

/**
 * Resetear configuración a valores por defecto
 */
export function resetConfig(): void {
  currentConfig = { ...DEFAULT_CONFIG }
}

/**
 * Validar configuración
 */
export function validateConfig(config: Partial<ForumConfig>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.dynamicModeComplexityThreshold !== undefined) {
    if (config.dynamicModeComplexityThreshold < 1 || config.dynamicModeComplexityThreshold > 10) {
      errors.push('dynamicModeComplexityThreshold must be between 1 and 10')
    }
  }

  if (config.staticModeMaxAreas !== undefined) {
    if (config.staticModeMaxAreas < 1 || config.staticModeMaxAreas > 10) {
      errors.push('staticModeMaxAreas must be between 1 and 10')
    }
  }

  if (config.minExperts !== undefined && config.maxExperts !== undefined) {
    if (config.minExperts > config.maxExperts) {
      errors.push('minExperts must be <= maxExperts')
    }
  }

  if (config.highQualityThreshold !== undefined && config.lowQualityThreshold !== undefined) {
    if (config.lowQualityThreshold >= config.highQualityThreshold) {
      errors.push('lowQualityThreshold must be < highQualityThreshold')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Presets de configuración para diferentes escenarios
 */
export const CONFIG_PRESETS = {
  /** Modo conservador: Usa más modo estático, menos intervenciones */
  conservative: {
    dynamicModeComplexityThreshold: 7,
    staticModeMaxAreas: 3,
    interventionFrequencyHigh: 7,
    interventionFrequencyMedium: 5,
    interventionFrequencyLow: 3,
  } as Partial<ForumConfig>,

  /** Modo agresivo: Usa más modo dinámico, más intervenciones */
  aggressive: {
    dynamicModeComplexityThreshold: 3,
    staticModeMaxAreas: 1,
    interventionFrequencyHigh: 3,
    interventionFrequencyMedium: 2,
    interventionFrequencyLow: 1,
  } as Partial<ForumConfig>,

  /** Modo económico: Optimiza para reducir costos */
  economical: {
    maxExperts: 5,
    maxRounds: 15,
    maxTokensPerMessage: 30,
    interventionFrequencyHigh: 7,
    interventionFrequencyMedium: 5,
  } as Partial<ForumConfig>,

  /** Modo premium: Máxima calidad sin restricciones */
  premium: {
    minExperts: 6,
    maxExperts: 8,
    maxRounds: 25,
    maxTokensPerMessage: 75,
    interventionFrequencyHigh: 4,
    interventionFrequencyMedium: 2,
    interventionFrequencyLow: 1,
  } as Partial<ForumConfig>,
}

/**
 * Aplicar preset de configuración
 */
export function applyPreset(preset: keyof typeof CONFIG_PRESETS): void {
  const presetConfig = CONFIG_PRESETS[preset]
  updateConfig(presetConfig)
}
