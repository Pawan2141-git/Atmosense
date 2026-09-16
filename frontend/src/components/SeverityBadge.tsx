import React from "react";

export type SeverityTier = "low" | "watch" | "moderate" | "high" | "warning" | "severe" | "critical" | "extreme";

interface SeverityBadgeProps {
  level: SeverityTier | string;
  label?: string;
  className?: string;
}

export function normalizeSeverity(level: string): "low" | "moderate" | "high" | "critical" {
  const l = (level || "").toLowerCase();
  if (l === "low" || l === "watch") return "low";
  if (l === "moderate" || l === "mod") return "moderate";
  if (l === "high" || l === "warning") return "high";
  if (l === "severe" || l === "critical" || l === "extreme") return "critical";
  return "low";
}

export default function SeverityBadge({ level, label, className = "" }: SeverityBadgeProps) {
  const norm = normalizeSeverity(level);

  const styleMap = {
    low: {
      bg: "bg-[#DCEAFB]",
      text: "text-[#3568C4]",
      defaultLabel: "LOW",
    },
    moderate: {
      bg: "bg-[#FBEDC4]",
      text: "text-[#8A6A1E]",
      defaultLabel: "MODERATE",
    },
    high: {
      bg: "bg-[#FBDADB]",
      text: "text-[#C23948]",
      defaultLabel: "HIGH",
    },
    critical: {
      bg: "bg-[#F8C9CC]",
      text: "text-[#B12433]",
      defaultLabel: "CRITICAL",
    },
  };

  const current = styleMap[norm];
  const displayText = label || (level ? level.toUpperCase() : current.defaultLabel);

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${current.bg} ${current.text} ${className}`}
    >
      {displayText}
    </span>
  );
}
