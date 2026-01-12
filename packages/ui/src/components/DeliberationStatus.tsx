import { clsx } from "clsx";
import type { ReactNode } from "react";
import { ConsensusGauge } from "./ConsensusGauge.js";
import { RoundTimeline } from "./RoundTimeline.js";
import type { QualityMetrics } from "./QualityIndicator.js";
import { QualityIndicator } from "./QualityIndicator.js";

export interface DeliberationStatusProps {
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  consensusScore: number;
  consensusThreshold: number;
  currentRound: number;
  maxRounds: number;
  rounds: Array<{
    roundNumber: number;
    status: "pending" | "in_progress" | "completed";
    consensusScore?: number;
  }>;
  qualityMetrics?: QualityMetrics;
  onSelectRound?: (roundNumber: number) => void;
  className?: string;
}

export function DeliberationStatus({
  status,
  consensusScore,
  consensusThreshold,
  currentRound,
  maxRounds,
  rounds,
  qualityMetrics,
  onSelectRound,
  className,
}: DeliberationStatusProps): ReactNode {
  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-200 bg-white p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Deliberation Progress
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {status === "active"
              ? `Round ${currentRound} in progress`
              : status === "completed"
                ? "Deliberation completed"
                : status === "paused"
                  ? "Deliberation paused"
                  : status === "draft"
                    ? "Not started"
                    : "Cancelled"}
          </p>
        </div>
        <div className="relative">
          <ConsensusGauge
            score={consensusScore}
            threshold={consensusThreshold}
            size="md"
          />
        </div>
      </div>

      <div className="mt-6">
        <RoundTimeline
          rounds={rounds}
          currentRound={currentRound}
          maxRounds={maxRounds}
          onSelectRound={onSelectRound}
        />
      </div>

      {qualityMetrics && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <QualityIndicator metrics={qualityMetrics} compact />
        </div>
      )}
    </div>
  );
}
