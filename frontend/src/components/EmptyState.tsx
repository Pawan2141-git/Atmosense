"use client";

import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function EmptyState({
  title = "No Data Available",
  subtitle = "Data will appear here when the system receives live feeds.",
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-page flex items-center justify-center mb-4 border border-border">
        <Inbox className="w-6 h-6 text-muted" />
      </div>
      <h4 className="text-sm font-bold text-navy">{title}</h4>
      <p className="text-xs text-muted mt-1 max-w-[260px]">{subtitle}</p>
    </div>
  );
}
