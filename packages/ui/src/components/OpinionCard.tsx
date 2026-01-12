import { clsx } from "clsx";
import type { ReactNode } from "react";
import { ExpertAvatar } from "./ExpertAvatar.js";

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
        "rounded-lg border border-gray-200 bg-white p-4",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <ExpertAvatar name={expertName} expertise={expertise} showExpertise />
        <div className="flex items-center gap-2 text-sm">
          <span
            className={clsx(
              "rounded-full px-2 py-1 font-medium",
              confidence >= 0.8
                ? "bg-green-100 text-green-700"
                : confidence >= 0.5
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
            )}
          >
            {(confidence * 100).toFixed(0)}% confident
          </span>
          {qualityScore !== undefined && (
            <span className="text-gray-500">
              Quality: {(qualityScore * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-gray-900">{opinion}</p>
      </div>

      {(isExpanded || reasoning) && (
        <div className="mt-4">
          <button
            onClick={onToggleExpand}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? "Hide reasoning" : "Show reasoning"}
          </button>
          {isExpanded && (
            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              {reasoning}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <time dateTime={timestamp.toISOString()}>
          {timestamp.toLocaleTimeString()}
        </time>
      </div>
    </div>
  );
}
