import { clsx } from "clsx";
import type { ReactNode } from "react";
import { ExpertAvatar } from "./ExpertAvatar.js";

export interface ExpertInfo {
  id: string;
  name: string;
  expertise: string;
  category?: string;
  isActive: boolean;
}

export interface ExpertPanelProps {
  experts: ExpertInfo[];
  selectedExpertId?: string;
  onSelectExpert?: (expertId: string) => void;
  showInactive?: boolean;
  className?: string;
}

export function ExpertPanel({
  experts,
  selectedExpertId,
  onSelectExpert,
  showInactive = false,
  className,
}: ExpertPanelProps): ReactNode {
  const filteredExperts = showInactive
    ? experts
    : experts.filter((e) => e.isActive);

  const groupedByCategory = filteredExperts.reduce(
    (acc, expert) => {
      const category = expert.category ?? "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(expert);
      return acc;
    },
    {} as Record<string, ExpertInfo[]>
  );

  return (
    <div className={clsx("space-y-6", className)}>
      {Object.entries(groupedByCategory).map(([category, categoryExperts]) => (
        <div key={category}>
          <h4 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
            {category}
          </h4>
          <div className="space-y-2">
            {categoryExperts.map((expert) => (
              <button
                key={expert.id}
                onClick={() => onSelectExpert?.(expert.id)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
                  selectedExpertId === expert.id
                    ? "bg-blue-50 ring-1 ring-blue-200"
                    : "hover:bg-gray-50",
                  !expert.isActive && "opacity-50"
                )}
              >
                <ExpertAvatar
                  name={expert.name}
                  expertise={expert.expertise}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">
                    {expert.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {expert.expertise}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
