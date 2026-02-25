"use client";

import { useMemo } from "react";
import { PatchWindow } from "@/lib/pk-model";

// Color palette matching kawaii theme
const PATCH_COLORS = ["#F5A9B8", "#F28CB1", "#D16B98", "#B55083", "#8B2F6A", "#6B1F4A", "#4B0F2A", "#2B0010"];

interface PatchTimelineProps {
  windows: PatchWindow[];
  period: number;
}

export default function PatchTimeline({ windows, period }: PatchTimelineProps) {
  const rows = useMemo(() => {
    return windows.map((w) => ({
      label: `Patch ${w.index + 1}`,
      startPct: (w.appliedAt / period) * 100,
      widthPct: Math.min(((w.removedAt - w.appliedAt) / period) * 100, 100 - (w.appliedAt / period) * 100),
      color: PATCH_COLORS[w.index % PATCH_COLORS.length],
      appliedAt: w.appliedAt,
      removedAt: w.removedAt,
    }));
  }, [windows, period]);

  if (rows.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-4">No patches in this schedule.</p>;
  }

  // Only show first 12 patches to avoid overcrowding (later ones repeat the pattern)
  const visibleRows = rows.slice(0, 12);
  const hasMore = rows.length > 12;

  return (
    <div className="space-y-1">
      {/* Time axis labels */}
      <div className="flex justify-between text-[9px] text-gray-400 px-16">
        <span>0h</span>
        <span>{Math.round(period / 4)}h</span>
        <span>{Math.round(period / 2)}h</span>
        <span>{Math.round((3 * period) / 4)}h</span>
        <span>{period}h</span>
      </div>
      {visibleRows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="text-[9px] text-gray-500 w-14 text-right shrink-0">{row.label}</span>
          <div className="flex-1 relative h-4 bg-kawaii-rose/30 rounded-full overflow-hidden">
            <div
              className="absolute top-0 h-full rounded-full"
              style={{
                left: `${row.startPct}%`,
                width: `${row.widthPct}%`,
                backgroundColor: row.color,
              }}
              title={`Applied: ${row.appliedAt}h — Removed: ${row.removedAt}h`}
            />
          </div>
        </div>
      ))}
      {hasMore && (
        <p className="text-[9px] text-gray-400 text-center pt-1">
          +{rows.length - 12} more patches (pattern repeats)
        </p>
      )}
      {/* Period markers */}
      <div className="flex justify-between text-[9px] text-gray-400 px-16 pt-1">
        <span>Day 0</span>
        <span>Day {Math.round(period / 4 / 24)}</span>
        <span>Day {Math.round(period / 2 / 24)}</span>
        <span>Day {Math.round((3 * period) / 4 / 24)}</span>
        <span>Day {Math.round(period / 24)}</span>
      </div>
    </div>
  );
}
