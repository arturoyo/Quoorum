/**
 * Tests for Meta-Moderator
 */

import { describe, it, expect } from 'vitest'
import {
  shouldIntervene,
  generateIntervention,
  generateMultipleInterventions,
  generateTargetedIntervention,
  getInterventionFrequency,
  summarizeIntervention,
  wasInterventionEffective,
  type ModeratorIntervention,
} from '../meta-moderator'
import type { QualityAnalysis, QualityIssue } from '../quality-monitor'

describe('Meta-Moderator', () => {
  describe('shouldIntervene', () => {
    it('should intervene when needsModeration is true', () => {
      const analysis: QualityAnalysis = {
        overallQuality: 45,
        depthScore: 40,
        diversityScore: 45,
        originalityScore: 50,
        issues: [],
        recommendations: [],
        needsModeration: true,
      }

      expect(shouldIntervene(analysis)).toBe(true)
    })

    it('should not intervene when needsModeration is false', () => {
      const analysis: QualityAnalysis = {
        overallQuality: 85,
        depthScore: 80,
        diversityScore: 85,
        originalityScore: 90,
        issues: [],
        recommendations: [],
        needsModeration: false,
      }

      expect(shouldIntervene(analysis)).toBe(false)
    })
  })

  describe('generateIntervention', () => {
    it('should generate challenge_depth intervention for shallow issues', () => {
      const issue: QualityIssue = {
        type: 'shallow',
        severity: 8,
        description: 'Arguments lack depth',
        affectedMessages: [0, 1, 2],
      }

      const analysis: QualityAnalysis = {
        overallQuality: 45,
        depthScore: 40,
        diversityScore: 60,
        originalityScore: 50,
        issues: [issue],
        recommendations: [],
        needsModeration: true,
      }

      const intervention = generateIntervention(analysis)

      expect(intervention.type).toBe('challenge_depth')
      expect(intervention.prompt).toContain('profundidad')
      expect(intervention.prompt).toContain('datos concretos')
      expect(intervention.severity).toBe(8)
    })

    it('should generate explore_alternatives intervention for repetitive issues', () => {
      const issue: QualityIssue = {
        type: 'repetitive',
        severity: 7,
        description: 'Content is repetitive',
        affectedMessages: [1, 2, 3],
      }

      const analysis: QualityAnalysis = {
        overallQuality: 50,
        depthScore: 60,
        diversityScore: 55,
        originalityScore: 35,
        issues: [issue],
        recommendations: [],
        needsModeration: true,
      }

      const intervention = generateIntervention(analysis)

      expect(intervention.type).toBe('explore_alternatives')
      expect(intervention.prompt).toContain('repetitivo')
      expect(intervention.prompt).toContain('ángulos NO explorados')
    })

    it('should generate diversify_perspectives intervention for lack of diversity', () => {
      const issue: QualityIssue = {
        type: 'lack_of_diversity',
        severity: 7,
        description: 'Lacks diverse perspectives',
        affectedMessages: [],
      }

      const analysis: QualityAnalysis = {
        overallQuality: 50,
        depthScore: 65,
        diversityScore: 35,
        originalityScore: 60,
        issues: [issue],
        recommendations: [],
        needsModeration: true,
      }

      const intervention = generateIntervention(analysis)

      expect(intervention.type).toBe('diversify_perspectives')
      expect(intervention.prompt).toContain('diversidad de perspectivas')
      expect(intervention.prompt).toContain('RIESGO')
      expect(intervention.prompt).toContain('OPORTUNIDAD')
    })

    it('should generate prevent_premature_consensus intervention', () => {
      const issue: QualityIssue = {
        type: 'premature_consensus',
        severity: 8,
        description: 'Consensus reached too early',
        affectedMessages: [],
      }

      const analysis: QualityAnalysis = {
        overallQuality: 55,
        depthScore: 50,
        diversityScore: 55,
        originalityScore: 60,
        issues: [issue],
        recommendations: [],
        needsModeration: true,
      }

      const intervention = generateIntervention(analysis)

      expect(intervention.type).toBe('prevent_premature_consensus')
      expect(intervention.prompt).toContain('consenso prematuro')
      expect(intervention.prompt).toContain('asunciones NO cuestionadas')
    })

    it('should generate request_evidence intervention for superficial issues', () => {
      const issue: QualityIssue = {
        type: 'superficial',
        severity: 7,
        description: 'Arguments are superficial',
        affectedMessages: [0, 1],
      }

      const analysis: QualityAnalysis = {
        overallQuality: 48,
        depthScore: 45,
        diversityScore: 50,
        originalityScore: 50,
        issues: [issue],
        recommendations: [],
        needsModeration: true,
      }

      const intervention = generateIntervention(analysis)

      expect(intervention.type).toBe('request_evidence')
      expect(intervention.prompt).toContain('evidencia')
      expect(intervention.prompt).toContain('datos cuantitativos')
    })

    it('should generate generic intervention when no specific issues', () => {
      const analysis: QualityAnalysis = {
        overallQuality: 45,
        depthScore: 50,
        diversityScore: 45,
        originalityScore: 40,
        issues: [],
        recommendations: [],
        needsModeration: true,
      }

      const intervention = generateIntervention(analysis)

      expect(intervention.type).toBe('challenge_depth')
      expect(intervention.prompt).toContain('rigor')
      expect(intervention.prompt).toContain('Calidad actual: 45/100')
    })

    it('should prioritize issues by severity', () => {
      const lowSeverityIssue: QualityIssue = {
        type: 'repetitive',
        severity: 5,
        description: 'Minor repetition',
        affectedMessages: [1],
      }

      const highSeverityIssue: QualityIssue = {
        type: 'shallow',
        severity: 9,
        description: 'Very shallow arguments',
        affectedMessages: [0, 1, 2, 3],
      }

      const analysis: QualityAnalysis = {
        overallQuality: 40,
        depthScore: 35,
        diversityScore: 45,
        originalityScore: 40,
        issues: [lowSeverityIssue, highSeverityIssue],
        recommendations: [],
        needsModeration: true,
      }

      const intervention = generateIntervention(analysis)

      expect(intervention.type).toBe('challenge_depth')
      expect(intervention.severity).toBe(9)
    })
  })

  describe('generateMultipleInterventions', () => {
    it('should generate multiple interventions for multiple severe issues', () => {
      const issue1: QualityIssue = {
        type: 'shallow',
        severity: 8,
        description: 'Shallow arguments',
        affectedMessages: [0, 1],
      }

      const issue2: QualityIssue = {
        type: 'lack_of_diversity',
        severity: 7,
        description: 'No diversity',
        affectedMessages: [],
      }

      const analysis: QualityAnalysis = {
        overallQuality: 40,
        depthScore: 35,
        diversityScore: 35,
        originalityScore: 50,
        issues: [issue1, issue2],
        recommendations: [],
        needsModeration: true,
      }

      const interventions = generateMultipleInterventions(analysis)

      expect(interventions.length).toBe(2)
      expect(interventions[0]!.type).toBe('challenge_depth')
      expect(interventions[1]!.type).toBe('diversify_perspectives')
    })

    it('should respect maxInterventions limit', () => {
      const issues: QualityIssue[] = [
        { type: 'shallow', severity: 8, description: 'Issue 1', affectedMessages: [] },
        { type: 'repetitive', severity: 7, description: 'Issue 2', affectedMessages: [] },
        {
          type: 'lack_of_diversity',
          severity: 7,
          description: 'Issue 3',
          affectedMessages: [],
        },
      ]

      const analysis: QualityAnalysis = {
        overallQuality: 35,
        depthScore: 30,
        diversityScore: 35,
        originalityScore: 40,
        issues,
        recommendations: [],
        needsModeration: true,
      }

      const interventions = generateMultipleInterventions(analysis, 2)

      expect(interventions.length).toBeLessThanOrEqual(2)
    })

    it('should only include severe issues (severity >= 7)', () => {
      const issues: QualityIssue[] = [
        { type: 'shallow', severity: 8, description: 'Severe', affectedMessages: [] },
        { type: 'repetitive', severity: 5, description: 'Minor', affectedMessages: [] },
        { type: 'lack_of_diversity', severity: 6, description: 'Moderate', affectedMessages: [] },
      ]

      const analysis: QualityAnalysis = {
        overallQuality: 50,
        depthScore: 45,
        diversityScore: 50,
        originalityScore: 55,
        issues,
        recommendations: [],
        needsModeration: true,
      }

      const interventions = generateMultipleInterventions(analysis)

      expect(interventions.length).toBe(1)
      expect(interventions[0]!.severity).toBe(8)
    })
  })

  describe('generateTargetedIntervention', () => {
    it('should add target agent to intervention prompt', () => {
      const intervention: ModeratorIntervention = {
        type: 'challenge_depth',
        prompt: 'Improve your arguments',
        reason: 'Shallow content',
        severity: 7,
      }

      const targeted = generateTargetedIntervention(intervention, 'critic')

      expect(targeted).toContain('Improve your arguments')
      expect(targeted).toContain('[Dirigido específicamente a: critic]')
    })
  })

  describe('getInterventionFrequency', () => {
    it('should return 5 for high quality debates', () => {
      const analysis: QualityAnalysis = {
        overallQuality: 85,
        depthScore: 80,
        diversityScore: 85,
        originalityScore: 90,
        issues: [],
        recommendations: [],
        needsModeration: false,
      }

      expect(getInterventionFrequency(analysis)).toBe(5)
    })

    it('should return 3 for medium quality debates', () => {
      const analysis: QualityAnalysis = {
        overallQuality: 65,
        depthScore: 60,
        diversityScore: 65,
        originalityScore: 70,
        issues: [],
        recommendations: [],
        needsModeration: false,
      }

      expect(getInterventionFrequency(analysis)).toBe(3)
    })

    it('should return 2 for low quality debates', () => {
      const analysis: QualityAnalysis = {
        overallQuality: 45,
        depthScore: 40,
        diversityScore: 45,
        originalityScore: 50,
        issues: [],
        recommendations: [],
        needsModeration: true,
      }

      expect(getInterventionFrequency(analysis)).toBe(2)
    })
  })

  describe('summarizeIntervention', () => {
    it('should generate summary with high severity emoji', () => {
      const intervention: ModeratorIntervention = {
        type: 'challenge_depth',
        prompt: 'Test prompt',
        reason: 'Very shallow arguments',
        severity: 9,
      }

      const summary = summarizeIntervention(intervention)

      expect(summary).toContain('🚨')
      expect(summary).toContain('challenge_depth')
      expect(summary).toContain('Severidad: 9/10')
    })

    it('should generate summary with medium severity emoji', () => {
      const intervention: ModeratorIntervention = {
        type: 'explore_alternatives',
        prompt: 'Test prompt',
        reason: 'Some repetition',
        severity: 6,
      }

      const summary = summarizeIntervention(intervention)

      expect(summary).toContain('⚠️')
      expect(summary).toContain('explore_alternatives')
      expect(summary).toContain('Severidad: 6/10')
    })

    it('should generate summary with low severity emoji', () => {
      const intervention: ModeratorIntervention = {
        type: 'request_evidence',
        prompt: 'Test prompt',
        reason: 'Minor issue',
        severity: 4,
      }

      const summary = summarizeIntervention(intervention)

      expect(summary).toContain('ℹ️')
      expect(summary).toContain('request_evidence')
      expect(summary).toContain('Severidad: 4/10')
    })
  })

  describe('wasInterventionEffective', () => {
    it('should return true when overall quality improves significantly', () => {
      const before: QualityAnalysis = {
        overallQuality: 45,
        depthScore: 40,
        diversityScore: 45,
        originalityScore: 50,
        issues: [],
        recommendations: [],
        needsModeration: true,
      }

      const after: QualityAnalysis = {
        overallQuality: 65,
        depthScore: 60,
        diversityScore: 65,
        originalityScore: 70,
        issues: [],
        recommendations: [],
        needsModeration: false,
      }

      expect(wasInterventionEffective(before, after)).toBe(true)
    })

    it('should return true when depth improves significantly', () => {
      const before: QualityAnalysis = {
        overallQuality: 50,
        depthScore: 35,
        diversityScore: 55,
        originalityScore: 60,
        issues: [],
        recommendations: [],
        needsModeration: true,
      }

      const after: QualityAnalysis = {
        overallQuality: 55,
        depthScore: 65,
        diversityScore: 55,
        originalityScore: 60,
        issues: [],
        recommendations: [],
        needsModeration: false,
      }

      expect(wasInterventionEffective(before, after)).toBe(true)
    })

    it('should return false when improvement is minimal', () => {
      const before: QualityAnalysis = {
        overallQuality: 50,
        depthScore: 45,
        diversityScore: 50,
        originalityScore: 55,
        issues: [],
        recommendations: [],
        needsModeration: true,
      }

      const after: QualityAnalysis = {
        overallQuality: 55,
        depthScore: 50,
        diversityScore: 55,
        originalityScore: 60,
        issues: [],
        recommendations: [],
        needsModeration: false,
      }

      expect(wasInterventionEffective(before, after)).toBe(false)
    })

    it('should return false when quality decreases', () => {
      const before: QualityAnalysis = {
        overallQuality: 60,
        depthScore: 55,
        diversityScore: 60,
        originalityScore: 65,
        issues: [],
        recommendations: [],
        needsModeration: false,
      }

      const after: QualityAnalysis = {
        overallQuality: 50,
        depthScore: 45,
        diversityScore: 50,
        originalityScore: 55,
        issues: [],
        recommendations: [],
        needsModeration: true,
      }

      expect(wasInterventionEffective(before, after)).toBe(false)
    })
  })
})
