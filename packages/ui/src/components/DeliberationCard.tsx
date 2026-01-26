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

// Dark theme status colors - Quoorum Design System
const statusColors: Record<DeliberationCardProps["status"], string> = {
  draft: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
  active: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  paused: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  completed: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  cancelled: "bg-red-500/20 text-red-300 border border-red-500/30",
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
        "rounded-lg border border-purple-500/20 bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-300 hover:border-purple-500/40 hover:bg-slate-900/80",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span
          className={clsx(
            "rounded-full px-2 py-1 text-xs font-medium",
            statusColors[status]
          )}
        >
          {status}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-[#aebac1]">{description}</p>

      <div className="mt-4 flex items-center justify-between text-sm text-[#8696a0]">
        <div className="flex items-center gap-4">
          {consensusScore !== undefined && (
            <span className="text-purple-400">
              Consensus: {(consensusScore * 100).toFixed(0)}%
            </span>
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
