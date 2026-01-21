/**
 * Decision-Making Frameworks Library
 *
 * Exports for the 3 P0 frameworks:
 * - Pros and Cons
 * - SWOT Analysis
 * - Eisenhower Matrix
 */

export { runProsAndCons } from './pros-and-cons.js'
export type { ProsAndConsInput, ProsAndConsOutput } from './pros-and-cons.js'

export { runSWOTAnalysis } from './swot-analysis.js'
export type { SWOTAnalysisInput, SWOTAnalysisOutput } from './swot-analysis.js'

export { runEisenhowerMatrix } from './eisenhower-matrix.js'
export type {
  EisenhowerMatrixInput,
  EisenhowerMatrixOutput,
  TaskClassification,
} from './eisenhower-matrix.js'
