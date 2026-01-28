/**
 * Debates Module - Barrel Export
 *
 * Re-exports types and helpers for the debates router.
 */

export type { DebateContext, FallbackQuestion, BusinessAnalysis } from './types';
export { analyzeBusinessQuestion, generateSmartFallbackQuestions } from './helpers';
