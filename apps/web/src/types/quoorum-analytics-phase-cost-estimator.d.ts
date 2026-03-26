declare module '@quoorum/quoorum/analytics/phase-cost-estimator' {
  export interface PhaseCostConfig {
    numCriticalQuestions?: number
    numExperts?: number
    numDepartments?: number
    numWorkers?: number
    strategyComplexity?: 'simple' | 'medium' | 'complex'
    estimatedRounds?: number
  }

  export interface PhaseCostEstimate {
    phase: string
    costCredits: number
    costUsd: number
    breakdown?: {
      item: string
      costCredits: number
    }[]
    minCostCredits?: number
    maxCostCredits?: number
  }

  export function estimateContextPhaseCost(config: PhaseCostConfig): PhaseCostEstimate
  export function estimateExpertSelectionPhaseCost(config: PhaseCostConfig): PhaseCostEstimate
  export function estimateStrategyPhaseCost(config: PhaseCostConfig): PhaseCostEstimate
  export function estimateDebateExecutionCost(config: PhaseCostConfig): PhaseCostEstimate
  export function calculateTotalAccumulatedCost(
    phaseCosts: PhaseCostEstimate[]
  ): { totalCredits: number; totalUsd: number }
}
