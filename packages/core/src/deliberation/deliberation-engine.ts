import { ExpertRegistry, type ExpertContext } from "../experts/index";
import { QualityMonitor, createDefaultQualityMonitor } from "../quality/index";
import { MetaModerator, createDefaultMetaModerator } from "./meta-moderator";
import type {
  DeliberationConfig,
  DeliberationEvent,
  DeliberationEventHandler,
  DeliberationMetadata,
  DeliberationResult,
  ExpertOpinionResult,
  RoundResult,
} from "../types";

export class DeliberationEngine {
  private config: DeliberationConfig;
  private expertRegistry: ExpertRegistry;
  private qualityMonitor: QualityMonitor;
  private metaModerator: MetaModerator;
  private eventHandlers: DeliberationEventHandler[] = [];
  private rounds: RoundResult[] = [];
  private startTime: Date | null = null;
  private tokensUsed = 0;

  constructor(config: DeliberationConfig) {
    this.config = config;
    this.expertRegistry = new ExpertRegistry(config.experts);
    this.qualityMonitor = config.qualityMonitor
      ? new QualityMonitor(config.qualityMonitor)
      : createDefaultQualityMonitor();
    this.metaModerator = config.metaModerator
      ? new MetaModerator(config.metaModerator)
      : createDefaultMetaModerator();
  }

  onEvent(handler: DeliberationEventHandler): void {
    this.eventHandlers.push(handler);
  }

  private async emit(
    type: DeliberationEvent["type"],
    data: Record<string, unknown> = {}
  ): Promise<void> {
    const event: DeliberationEvent = {
      type,
      timestamp: new Date(),
      data,
    };
    for (const handler of this.eventHandlers) {
      await handler(event);
    }
  }

  async run(): Promise<DeliberationResult> {
    this.startTime = new Date();
    await this.emit("deliberation.started", {
      topic: this.config.topic,
      maxRounds: this.config.maxRounds,
      expertCount: this.expertRegistry.size(),
    });

    try {
      for (let round = 1; round <= this.config.maxRounds; round++) {
        const roundResult = await this.runRound(round);
        this.rounds.push(roundResult);

        if (roundResult.consensusScore >= this.config.consensusThreshold / 100) {
          await this.emit("consensus.calculated", {
            roundNumber: round,
            consensusScore: roundResult.consensusScore,
            achieved: true,
          });
          break;
        }

        await this.emit("consensus.calculated", {
          roundNumber: round,
          consensusScore: roundResult.consensusScore,
          achieved: false,
        });
      }

      const finalConsensus = await this.metaModerator.generateFinalConsensus(
        this.rounds,
        this.config.topic,
        this.config.consensusThreshold
      );

      const completedAt = new Date();
      const metadata: DeliberationMetadata = {
        totalRounds: this.rounds.length,
        totalOpinions: this.rounds.reduce((sum, r) => sum + r.opinions.length, 0),
        totalTokensUsed: this.tokensUsed,
        totalDurationMs: completedAt.getTime() - this.startTime.getTime(),
        startedAt: this.startTime,
        completedAt,
      };

      const result: DeliberationResult = {
        id: this.config.id,
        topic: this.config.topic,
        rounds: this.rounds,
        finalConsensus,
        metadata,
      };

      await this.emit("deliberation.completed", { result });

      return result;
    } catch (error) {
      await this.emit("error.occurred", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async runRound(roundNumber: number): Promise<RoundResult> {
    await this.emit("round.started", { roundNumber });

    const previousOpinions =
      roundNumber > 1 ? this.rounds[roundNumber - 2]?.opinions : undefined;

    const moderatorGuidance =
      roundNumber > 1
        ? await this.metaModerator.generateGuidance(
            roundNumber,
            this.rounds,
            this.config.topic
          )
        : undefined;

    const context: ExpertContext = {
      topic: this.config.topic,
      description: this.config.description,
      objectives: this.config.objectives,
      constraints: this.config.constraints,
      roundNumber,
      previousOpinions,
      moderatorGuidance,
    };

    const experts = this.expertRegistry.getAll();
    const opinions: ExpertOpinionResult[] = [];

    for (const expert of experts) {
      await this.emit("expert.thinking", {
        expertId: expert.id,
        expertName: expert.name,
        roundNumber,
      });

      const opinion = await expert.generateOpinion(context);

      const qualityScore = await this.qualityMonitor.assessOpinion(
        opinion,
        this.config.topic
      );
      opinion.qualityScore = qualityScore;

      opinions.push(opinion);

      await this.emit("opinion.submitted", {
        expertId: expert.id,
        roundNumber,
        confidence: opinion.confidence,
        qualityScore,
      });
    }

    const qualityMetrics = await this.qualityMonitor.assessRound(
      opinions,
      this.config.topic
    );

    await this.emit("quality.assessed", {
      roundNumber,
      metrics: qualityMetrics,
    });

    const { score: consensusScore, summary: consensusSummary } =
      await this.metaModerator.calculateConsensus(opinions, this.config.topic);

    const summary = await this.metaModerator.summarizeRound(
      roundNumber,
      opinions,
      qualityMetrics
    );

    const roundResult: RoundResult = {
      roundNumber,
      opinions,
      summary,
      consensusScore,
      qualityMetrics,
      moderatorNotes: consensusSummary,
    };

    await this.emit("round.completed", { roundNumber, roundResult });

    return roundResult;
  }

  getProgress(): {
    currentRound: number;
    maxRounds: number;
    consensusScore: number;
    isComplete: boolean;
  } {
    const lastRound = this.rounds[this.rounds.length - 1];
    return {
      currentRound: this.rounds.length,
      maxRounds: this.config.maxRounds,
      consensusScore: lastRound?.consensusScore ?? 0,
      isComplete:
        this.rounds.length >= this.config.maxRounds ||
        (lastRound?.consensusScore ?? 0) >= this.config.consensusThreshold / 100,
    };
  }
}

export function createDeliberationEngine(
  topic: string,
  description: string,
  options: Partial<Omit<DeliberationConfig, "id" | "topic" | "description">> = {}
): DeliberationEngine {
  const config: DeliberationConfig = {
    id: crypto.randomUUID(),
    topic,
    description,
    objectives: options.objectives ?? [],
    constraints: options.constraints ?? [],
    maxRounds: options.maxRounds ?? 5,
    consensusThreshold: options.consensusThreshold ?? 70,
    experts: options.experts ?? ExpertRegistry.getDefaultConfigs(),
    qualityMonitor: options.qualityMonitor ?? {
      enabled: true,
      aiConfig: { provider: "anthropic", model: "claude-3-5-haiku-20241022" },
      minConfidenceThreshold: 0.5,
      coherenceThreshold: 0.6,
      relevanceThreshold: 0.7,
    },
    metaModerator: options.metaModerator ?? {
      enabled: true,
      aiConfig: { provider: "anthropic", model: "claude-sonnet-4-20250514" },
      interventionThreshold: 0.7,
      summaryStyle: "detailed",
    },
  };

  return new DeliberationEngine(config);
}
