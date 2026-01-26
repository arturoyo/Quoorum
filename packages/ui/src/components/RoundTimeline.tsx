import { clsx } from "clsx";
import type { ReactNode } from "react";

export interface RoundInfo {
  roundNumber: number;
  status: "pending" | "in_progress" | "completed";
  consensusScore?: number;
  summary?: string;
  completedAt?: Date;
}

export interface RoundTimelineProps {
  rounds: RoundInfo[];
  currentRound: number;
  maxRounds: number;
  onSelectRound?: (roundNumber: number) => void;
  className?: string;
}

export function RoundTimeline({
  rounds,
  currentRound,
  maxRounds,
  onSelectRound,
  className,
}: RoundTimelineProps): ReactNode {
  const allRounds = Array.from({ length: maxRounds }, (_, i) => {
    const existing = rounds.find((r) => r.roundNumber === i + 1);
    return (
      existing ?? {
        roundNumber: i + 1,
        status: "pending" as const,
      }
    );
  });

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      {allRounds.map((round, index) => (
        <div key={round.roundNumber} className="flex items-center">
          <button
            onClick={() => onSelectRound?.(round.roundNumber)}
            disabled={round.status === "pending"}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
              round.status === "completed" &&
                "bg-emerald-500 text-white hover:bg-emerald-600",
              round.status === "in_progress" &&
                "bg-purple-500 text-white animate-pulse",
              round.status === "pending" && "bg-[#2a3942] text-[#8696a0]",
              round.roundNumber === currentRound &&
                round.status !== "pending" &&
                "ring-2 ring-offset-0 ring-purple-500"
            )}
          >
            {round.roundNumber}
          </button>
          {index < allRounds.length - 1 && (
            <div
              className={clsx(
                "h-0.5 w-8",
                round.status === "completed" ? "bg-emerald-500" : "bg-[#2a3942]"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
