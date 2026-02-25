"use client";

import { Recommendation } from "@/lib/pk-model";

interface TimelineBlock {
  hour: number;
  status: "in-range" | "warning" | "out-of-range";
}

interface RecommendationTimelineProps {
  projection: { time: number; value: number }[];
  targetMin: number;
  targetMax: number;
  recommendations: Recommendation[];
}

export default function RecommendationTimeline({
  projection,
  targetMin,
  targetMax,
  recommendations,
}: RecommendationTimelineProps) {
  if (projection.length === 0) return null;

  const totalHours = Math.min(projection[projection.length - 1].time, 72);
  const warningMargin = (targetMax - targetMin) * 0.1;

  // Build hourly blocks
  const blocks: TimelineBlock[] = [];
  for (let h = 0; h <= totalHours; h++) {
    const point = projection.find((p) => Math.round(p.time) === h);
    const value = point?.value ?? 0;

    let status: TimelineBlock["status"];
    if (value < targetMin || value > targetMax) {
      status = "out-of-range";
    } else if (
      value < targetMin + warningMargin ||
      value > targetMax - warningMargin
    ) {
      status = "warning";
    } else {
      status = "in-range";
    }
    blocks.push({ hour: h, status });
  }

  const statusColors = {
    "in-range": "bg-green-400",
    warning: "bg-yellow-400",
    "out-of-range": "bg-red-400",
  };

  return (
    <div className="space-y-3">
      {/* Timeline bar */}
      <div>
        <div className="relative mb-1" style={{ height: 16 }}>
          <span className="absolute left-0 text-[10px] text-gray-400">Now</span>
          <span className="absolute left-1/3 -translate-x-1/2 text-[10px] text-gray-400">+24h</span>
          <span className="absolute left-2/3 -translate-x-1/2 text-[10px] text-gray-400">+48h</span>
          <span className="absolute right-0 text-[10px] text-gray-400">+72h</span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden gap-px">
          {blocks.map((block, i) => (
            <div
              key={i}
              className={`flex-1 ${statusColors[block.status]} transition-colors`}
              style={{ opacity: block.status === "in-range" ? 0.6 : 0.8 }}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            In range
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            Near boundary
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Out of range
          </span>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-1.5">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className={`text-sm px-3 py-2 rounded-kawaii ${
                rec.urgency === "now"
                  ? "bg-red-50 text-red-700 font-semibold"
                  : rec.urgency === "soon"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {rec.type === "apply" ? "\uD83D\uDC8A " : "\u270B "}
              {rec.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
