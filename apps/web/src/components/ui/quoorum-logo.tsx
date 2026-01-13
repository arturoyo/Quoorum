import React from "react";

interface QuoorumLogoProps {
  className?: string;
  size?: number;
  showGradient?: boolean;
}

export function QuoorumLogo({
  className = "",
  size = 40,
  showGradient = true,
}: QuoorumLogoProps) {
  const id = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id={`gradient-${id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Speech bubble forming a Q shape */}
      <path
        d="M50 15 C65 15, 75 25, 75 40 C75 50, 70 58, 62 62 L62 62 C70 58, 75 50, 75 40 C75 25, 65 15, 50 15 Z
           M50 15 C35 15, 25 25, 25 40 C25 55, 35 65, 50 65 C52 65, 54 65, 56 64.5
           M56 64.5 L65 80 L60 65 C58 65, 57 65, 56 64.5 Z"
        fill={showGradient ? `url(#gradient-${id})` : "currentColor"}
        strokeWidth="0"
      />

      {/* Inner circle (the hole of the Q) */}
      <circle
        cx="50"
        cy="40"
        r="12"
        fill="#0A0A0F"
      />

      {/* Small dots representing conversation */}
      <circle cx="42" cy="38" r="2.5" fill={showGradient ? "#06b6d4" : "currentColor"} opacity="0.6" />
      <circle cx="50" cy="38" r="2.5" fill={showGradient ? "#a855f7" : "currentColor"} opacity="0.6" />
      <circle cx="58" cy="38" r="2.5" fill={showGradient ? "#06b6d4" : "currentColor"} opacity="0.6" />
    </svg>
  );
}

export function QuoorumLogoSimple({
  className = "",
  size = 40,
}: Omit<QuoorumLogoProps, "showGradient">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Simplified version for small sizes */}
      <path
        d="M50 20 C65 20, 75 30, 75 45 C75 60, 65 70, 50 70 C48 70, 46 69.8, 44 69.5
           M44 69.5 L50 85 L46 70 C46 70, 45 69.8, 44 69.5 Z
           M50 20 C35 20, 25 30, 25 45 C25 60, 35 70, 50 70"
        fill="currentColor"
        strokeWidth="0"
      />
      <circle cx="50" cy="45" r="15" fill="#0A0A0F" />
      <circle cx="50" cy="45" r="3" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function QuoorumIcon({
  className = "",
  size = 24,
}: Pick<QuoorumLogoProps, "className" | "size">) {
  const id = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id={`icon-gradient-${id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Compact Q speech bubble for icon use */}
      <path
        d="M12 4 C16 4, 19 7, 19 11 C19 15, 16 18, 12 18 C11.5 18, 11 17.9, 10.5 17.8
           M10.5 17.8 L13 22 L11 18 C11 18, 10.7 17.9, 10.5 17.8 Z
           M12 4 C8 4, 5 7, 5 11 C5 15, 8 18, 12 18"
        fill={`url(#icon-gradient-${id})`}
      />
      <circle cx="12" cy="11" r="3" fill="#0A0A0F" />
      <circle cx="12" cy="11" r="1" fill="#06b6d4" opacity="0.8" />
    </svg>
  );
}
