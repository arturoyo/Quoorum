/**
 * Context Assessment - Zod Schemas
 *
 * Validation schemas for context assessment data structures.
 */

import { z } from "zod";

/**
 * Schema for a context dimension (objective, constraints, etc.)
 */
export const contextDimensionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  weight: z.number().min(0).max(1),
  score: z.number().min(0).max(100),
  status: z.enum(["missing", "partial", "complete"]),
  suggestions: z.array(z.string()),
});

/**
 * Schema for an assumption made by the AI
 */
export const contextAssumptionSchema = z.object({
  id: z.string(),
  dimension: z.string(),
  assumption: z.string(),
  confidence: z.number().min(0).max(1),
  confirmed: z.union([z.boolean(), z.string()]).nullable(), // Can be boolean (yes/no) or string (selected alternative)
  alternatives: z.array(z.string()).min(0), // FLEXIBLE: 0 alternatives = yes/no question, 2+ = multiple choice
  questionType: z.enum(["yes_no", "multiple_choice", "free_text"]).default("yes_no"), // AI decides best type
});

/**
 * Schema for a clarifying question
 */
export const clarifyingQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  dimension: z.string(),
  priority: z.enum(["critical", "important", "nice-to-have"]),
  questionType: z.enum(["yes_no", "multiple_choice", "free_text"]), // AI decides optimal type
  multipleChoice: z
    .object({
      options: z.array(z.string()),
      allowMultiple: z.boolean(),
    })
    .optional(), // Only if questionType = "multiple_choice"
  freeText: z.boolean().optional(), // Only if questionType = "free_text"
  dependsOn: z.string().optional(),
});

/**
 * Schema for the full context assessment result
 */
export const contextAssessmentSchema = z.object({
  overallScore: z.number().min(0).max(100),
  readinessLevel: z.enum(["insufficient", "basic", "good", "excellent"]),
  dimensions: z.array(contextDimensionSchema),
  assumptions: z.array(contextAssumptionSchema),
  clarifyingQuestions: z.array(clarifyingQuestionSchema),
  summary: z.string(),
  recommendedAction: z.enum(["proceed", "clarify", "refine"]),
  // NEW: Domain-specific enhancements
  reflection: z.string().optional(), // Shows we understood their situation
  detectedDomain: z.string().optional(), // hiring, pricing, growth, etc.
});

/**
 * Schema for user answers to assessment questions
 */
export const contextAnswersSchema = z.object({
  assumptionResponses: z.record(z.string(), z.union([z.boolean(), z.string()])), // Boolean for yes/no, string for selected alternative
  questionResponses: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  additionalContext: z.string().optional(),
});

// Inferred types from schemas
export type ContextDimension = z.infer<typeof contextDimensionSchema>;
export type ContextAssumption = z.infer<typeof contextAssumptionSchema>;
export type ClarifyingQuestion = z.infer<typeof clarifyingQuestionSchema>;
export type ContextAssessment = z.infer<typeof contextAssessmentSchema>;
export type ContextAnswers = z.infer<typeof contextAnswersSchema>;
