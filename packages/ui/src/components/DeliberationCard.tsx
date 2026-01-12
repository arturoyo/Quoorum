import { clsx } from "clsx";
import type { ReactNode } from "react";

export interface DeliberationCardProps {
  id: string;
  title: string;
  description: string;
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  consensusScore?: number;
  currentRound?: number;
  maxRounds?: number;
  createdAt: Date;
  onClick?: () => void;
  className?: string;
}

const statusColors: Record<DeliberationCardProps["status"], string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

export function DeliberationCard({
  title,
  description,
  status,
  consensusScore,
  currentRound,
  maxRounds,
  createdAt,
  onClick,
  className,
}: DeliberationCardProps): ReactNode {
  return (
    <div
      className={clsx(
        "rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span
          className={clsx(
            "rounded-full px-2 py-1 text-xs font-medium",
            statusColors[status]
          )}
        >
          {status}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{description}</p>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          {consensusScore !== undefined && (
            <span>Consensus: {(consensusScore * 100).toFixed(0)}%</span>
          )}
          {currentRound !== undefined && maxRounds !== undefined && (
            <span>
              Round {currentRound}/{maxRounds}
            </span>
          )}
        </div>
        <time dateTime={createdAt.toISOString()}>
          {createdAt.toLocaleDateString()}
        </time>
      </div>
    </div>
  );
}
