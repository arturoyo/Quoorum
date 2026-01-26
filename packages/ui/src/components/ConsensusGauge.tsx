import { clsx } from "clsx";
import type { ReactNode } from "react";

export interface ConsensusGaugeProps {
  score: number;
  threshold: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 80, strokeWidth: 6, fontSize: 12 },
  md: { width: 120, strokeWidth: 8, fontSize: 16 },
  lg: { width: 160, strokeWidth: 10, fontSize: 20 },
};

export function ConsensusGauge({
  score,
  threshold,
  size = "md",
  showLabel = true,
  className,
}: ConsensusGaugeProps): ReactNode {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 1);
  const offset = circumference * (1 - progress);

  const achieved = score >= threshold;
  const color = achieved ? "#22c55e" : score >= threshold * 0.7 ? "#eab308" : "#ef4444";

  return (
    <div className={clsx("flex flex-col items-center", className)}>
      <svg
        width={config.width}
        height={config.width}
        className="rotate-[-90deg]"
      >
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="#2a3942"
          strokeWidth={config.strokeWidth}
        />
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        <circle
          cx={config.width / 2}
          cy={config.width / 2 - radius}
          r={3}
          fill="#8696a0"
          transform={`rotate(${threshold * 360} ${config.width / 2} ${config.width / 2})`}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          width: config.width,
          height: config.width,
        }}
      >
        <span
          className="font-bold"
          style={{ fontSize: config.fontSize, color }}
        >
          {(score * 100).toFixed(0)}%
        </span>
      </div>
      {showLabel && (
        <p className="mt-2 text-sm text-[#aebac1]">
          {achieved ? "Consensus Achieved" : `Target: ${(threshold * 100).toFixed(0)}%`}
        </p>
      )}
    </div>
  );
}
