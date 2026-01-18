/**
 * Debate Strategy Router
 * 
 * Exposes the orchestration system's strategy selection and pattern analysis
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { selectStrategy, detectSignals } from '@quoorum/quoorum'
import type { PatternType } from '@quoorum/quoorum'

export const debateStrategyRouter = router({
  /**
   * Analyze question and recommend strategy/pattern
   */
  analyzeStrategy: protectedProcedure
    .input(
      z.object({
        question: z.string().min(10).max(5000),
        patternMode: z.enum(['auto', 'manual']).default('auto'),
        preferredPattern: z
          .preprocess(
            (val) => (val === '' || val === null || val === undefined ? undefined : val),
            z
              .enum([
                'simple',
                'sequential',
                'parallel',
                'conditional',
                'iterative',
                'tournament',
                'adversarial',
                'ensemble',
                'hierarchical',
              ])
              .optional()
          ),
        maxCost: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const strategy = await selectStrategy(input.question, {
        patternMode: input.patternMode,
        preferredPattern: input.preferredPattern as PatternType | undefined,
        maxTotalCost: input.maxCost,
      })

      return {
        recommendedPattern: strategy.recommendedPattern,
        confidence: strategy.confidence,
        reasoning: strategy.reasoning,
        estimatedCost: strategy.estimatedCost,
        estimatedTimeMinutes: strategy.estimatedTimeMinutes,
        alternativePatterns: strategy.alternativePatterns,
        signals: strategy.signals.map((s) => ({
          type: s.type,
          detected: s.detected,
          weight: s.weight,
        })),
        structure: {
          phasesCount: strategy.structure.phases.length,
          estimatedTotalCost: strategy.structure.estimatedTotalCost,
          estimatedTotalTimeMinutes: strategy.structure.estimatedTotalTimeMinutes,
        },
      }
    }),

  /**
   * Detect signals in a question
   */
  detectSignals: protectedProcedure
    .input(z.object({ question: z.string().min(10).max(5000) }))
    .query(async ({ input }) => {
      const signals = detectSignals(input.question)
      return signals.map((s) => ({
        type: s.type,
        detected: s.detected,
        weight: s.weight,
      }))
    }),
})
