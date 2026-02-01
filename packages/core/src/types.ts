// Local type definitions to avoid import issues
export interface AIConfig {
  provider: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ExpertConfig {
  id: string;
  name: string;
  expertise: string;
  systemPrompt: string;
  aiConfig: AIConfig;
}

export interface DeliberationConfig {
  id: string;
  topic: string;
  description: string;
  objectives: string[];
  constraints: string[];
  maxRounds: number;
  consensusThreshold: number;
  experts: ExpertConfig[];
  qualityMonitor: QualityMonitorConfig;
  metaModerator: MetaModeratorConfig;
}

export interface QualityMonitorConfig {
  enabled: boolean;
  aiConfig: AIConfig;
  minConfidenceThreshold: number;
  coherenceThreshold: number;
  relevanceThreshold: number;
}

export interface MetaModeratorConfig {
  enabled: boolean;
  aiConfig: AIConfig;
  interventionThreshold: number;
  summaryStyle: "concise" | "detailed" | "executive";
}

export interface RoundResult {
  roundNumber: number;
  opinions: ExpertOpinionResult[];
  summary: string;
  consensusScore: number;
  qualityMetrics: QualityMetrics;
  moderatorNotes: string;
}

export interface ExpertOpinionResult {
  expertId: string;
  expertName: string;
  opinion: string;
  reasoning: string;
  confidence: number;
  qualityScore: number;
  position: number;
}

export interface QualityMetrics {
  averageConfidence: number;
  coherenceScore: number;
  diversityScore: number;
  relevanceScore: number;
  overallQuality: number;
}

export interface DeliberationResult {
  id: string;
  topic: string;
  rounds: RoundResult[];
  finalConsensus: FinalConsensus;
  metadata: DeliberationMetadata;
}

export interface FinalConsensus {
  achieved: boolean;
  score: number;
  summary: string;
  recommendation: string;
  dissenting: DissentingOpinion[];
  confidence: number;
}

export interface DissentingOpinion {
  expertId: string;
  expertName: string;
  reason: string;
  alternativePosition: string;
}

export interface DeliberationMetadata {
  totalRounds: number;
  totalOpinions: number;
  totalTokensUsed: number;
  totalDurationMs: number;
  startedAt: Date;
  completedAt: Date;
}

export interface DeliberationEvent {
  type: DeliberationEventType;
  timestamp: Date;
  data: Record<string, unknown>;
}

export type DeliberationEventType =
  | "deliberation.started"
  | "round.started"
  | "expert.thinking"
  | "opinion.submitted"
  | "quality.assessed"
  | "round.completed"
  | "consensus.calculated"
  | "deliberation.completed"
  | "error.occurred";

export type DeliberationEventHandler = (event: DeliberationEvent) => void | Promise<void>;
