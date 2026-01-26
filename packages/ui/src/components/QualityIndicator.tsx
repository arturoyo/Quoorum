import { clsx } from "clsx";
import type { ReactNode } from "react";

export interface QualityMetrics {
  averageConfidence: number;
  coherenceScore: number;
  diversityScore: number;
  relevanceScore: number;
  overallQuality: number;
}

export interface QualityIndicatorProps {
  metrics: QualityMetrics;
  compact?: boolean;
  className?: string;
}

interface MetricBarProps {
  label: string;
  value: number;
  compact?: boolean;
}

function MetricBar({ label, value, compact }: MetricBarProps): ReactNode {
  const percentage = Math.round(value * 100);
  const color =
    value >= 0.8
      ? "bg-emerald-500"
      : value >= 0.6
        ? "bg-amber-500"
        : "bg-red-500";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-16 text-xs text-[#aebac1]">{label}</span>
        <div className="h-1.5 flex-1 rounded-full bg-[#2a3942]">
          <div
            className={clsx("h-full rounded-full transition-all", color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="w-8 text-right text-xs font-medium text-white">{percentage}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[#aebac1]">{label}</span>
        <span className="font-medium text-white">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#2a3942]">
        <div
          className={clsx("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function QualityIndicator({
  metrics,
  compact = false,
  className,
}: QualityIndicatorProps): ReactNode {
  return (
    <div className={clsx("space-y-3", className)}>
      {!compact && (
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">Quality Metrics</h4>
          <span
            className={clsx(
              "rounded-full px-2 py-1 text-sm font-medium border",
              metrics.overallQuality >= 0.8
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : metrics.overallQuality >= 0.6
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
            )}
          >
            {Math.round(metrics.overallQuality * 100)}% Overall
          </span>
        </div>
      )}
      <div className={compact ? "space-y-1" : "space-y-3"}>
        <MetricBar
          label="Confidence"
          value={metrics.averageConfidence}
          compact={compact}
        />
        <MetricBar
          label="Coherence"
          value={metrics.coherenceScore}
          compact={compact}
        />
        <MetricBar
          label="Diversity"
          value={metrics.diversityScore}
          compact={compact}
        />
        <MetricBar
          label="Relevance"
          value={metrics.relevanceScore}
          compact={compact}
        />
      </div>
    </div>
  );
}
