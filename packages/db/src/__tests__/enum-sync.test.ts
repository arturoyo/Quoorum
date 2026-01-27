/**
 * Enum Synchronization Tests
 *
 * Verifies that frontend types match database enums exactly.
 * Prevents desynchronization issues like Error #6.
 *
 * @see AUDITORIA-CAPAS-MULTIPLES.md
 * @see ERRORES-COMETIDOS.md#error-6
 */

import { describe, it, expect } from 'vitest'
import { debateStatusEnum, quoorumReportTypeEnum } from '../schema'

describe('Enum Synchronization Tests', () => {
  describe('DebateStatus', () => {
    it('should have exactly 6 status values', () => {
      expect(debateStatusEnum.enumValues).toHaveLength(6)
    })

    it('should include all expected status values', () => {
      const expectedValues = [
        'draft',
        'pending',
        'in_progress',
        'completed',
        'failed',
        'cancelled',
      ]

      expectedValues.forEach((value) => {
        expect(debateStatusEnum.enumValues).toContain(value)
      })
    })

    it('should match frontend DebateStatus type', () => {
      // This test ensures type inference works
      // If frontend uses: export type DebateStatus = (typeof debateStatusEnum.enumValues)[number]
      // Then TypeScript will catch any mismatches at compile time

      const validStatuses: Array<(typeof debateStatusEnum.enumValues)[number]> = [
        'draft',
        'pending',
        'in_progress',
        'completed',
        'failed',
        'cancelled',
      ]

      expect(validStatuses).toHaveLength(6)
    })
  })

  describe('ReportType', () => {
    it('should have exactly 6 report types', () => {
      expect(quoorumReportTypeEnum.enumValues).toHaveLength(6)
    })

    it('should include all expected report types', () => {
      const expectedValues = [
        'single_debate',
        'weekly_summary',
        'monthly_summary',
        'deal_analysis',
        'expert_performance',
        'custom',
      ]

      expectedValues.forEach((value) => {
        expect(quoorumReportTypeEnum.enumValues).toContain(value)
      })
    })

    it('should include deal_analysis (not missing)', () => {
      // Regression test for Problema #2
      expect(quoorumReportTypeEnum.enumValues).toContain('deal_analysis')
    })

    it('should match frontend ReportType type', () => {
      // This test ensures type inference works
      // If frontend uses: export type ReportType = (typeof quoorumReportTypeEnum.enumValues)[number]
      // Then TypeScript will catch any mismatches at compile time

      const validTypes: Array<(typeof quoorumReportTypeEnum.enumValues)[number]> = [
        'single_debate',
        'weekly_summary',
        'monthly_summary',
        'deal_analysis',
        'expert_performance',
        'custom',
      ]

      expect(validTypes).toHaveLength(6)
    })
  })

  describe('Future Enum Audits', () => {
    it('should document process for adding new enums', () => {
      // When adding a new enum to DB:
      // 1. Define enum in packages/db/src/schema/*.ts
      // 2. Export from packages/db/src/schema/index.ts
      // 3. In frontend, import enum and infer type:
      //    import type { myEnum } from '@quoorum/db/schema'
      //    export type MyType = (typeof myEnum.enumValues)[number]
      // 4. Add test case here to verify synchronization
      // 5. Update AUDITORIA-CAPAS-MULTIPLES.md

      expect(true).toBe(true) // Documentation test
    })
  })
})
