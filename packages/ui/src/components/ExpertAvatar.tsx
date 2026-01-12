import { clsx } from "clsx";
import type { ReactNode } from "react";

export interface ExpertAvatarProps {
  name: string;
  expertise: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
  showExpertise?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-rose-500",
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length]!;
}

export function ExpertAvatar({
  name,
  expertise,
  avatarUrl,
  size = "md",
  showExpertise = false,
  className,
}: ExpertAvatarProps): ReactNode {
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <div
        className={clsx(
          "flex items-center justify-center rounded-full font-medium text-white",
          sizeClasses[size],
          !avatarUrl && getColorFromName(name)
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          getInitials(name)
        )}
      </div>
      {showExpertise && (
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{expertise}</p>
        </div>
      )}
    </div>
  );
}
