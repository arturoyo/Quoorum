import { clsx } from "clsx";
import type { ReactNode } from "react";
import { ExpertAvatar } from "./ExpertAvatar";

export interface OpinionCardProps {
  expertName: string;
  expertise: string;
  opinion: string;
  reasoning: string;
  confidence: number;
  qualityScore?: number;
  timestamp: Date;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

export function OpinionCard({
  expertName,
  expertise,
  opinion,
  reasoning,
  confidence,
  qualityScore,
  timestamp,
  isExpanded = false,
  onToggleExpand,
  className,
}: OpinionCardProps): ReactNode {
  return (
    <div
      className={clsx(
        "rounded-lg border border-purple-500/20 bg-slate-900/60 backdrop-blur-sm p-4",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <ExpertAvatar name={expertName} expertise={expertise} showExpertise />
        <div className="flex items-center gap-2 text-sm">
          <span
            className={clsx(
              "rounded-full px-2 py-1 font-medium border",
              confidence >= 0.8
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : confidence >= 0.5
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
            )}
          >
            {(confidence * 100).toFixed(0)}% confident
          </span>
          {qualityScore !== undefined && (
            <span className="text-[#8696a0]">
              Quality: {(qualityScore * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-white">{opinion}</p>
      </div>

      {(isExpanded || reasoning) && (
        <div className="mt-4">
          <button
            onClick={onToggleExpand}
            className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isExpanded ? "Hide reasoning" : "Show reasoning"}
          </button>
          {isExpanded && (
            <div className="mt-2 rounded-lg bg-[#202c33] border border-[#2a3942] p-3 text-sm text-[#aebac1]">
              {reasoning}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-[#8696a0]">
        <time dateTime={timestamp.toISOString()}>
          {timestamp.toLocaleTimeString()}
        </time>
      </div>
    </div>
  );
}
