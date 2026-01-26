/**
 * Decision-Making Frameworks Library
 *
 * Exports for the 3 P0 frameworks:
 * - Pros and Cons
 * - SWOT Analysis
 * - Eisenhower Matrix
 */

export { runProsAndCons } from './pros-and-cons'
export type { ProsAndConsInput, ProsAndConsOutput } from './pros-and-cons'

export { runSWOTAnalysis } from './swot-analysis'
export type { SWOTAnalysisInput, SWOTAnalysisOutput } from './swot-analysis'

export { runEisenhowerMatrix } from './eisenhower-matrix'
export type {
  EisenhowerMatrixInput,
  EisenhowerMatrixOutput,
  TaskClassification,
} from './eisenhower-matrix'
