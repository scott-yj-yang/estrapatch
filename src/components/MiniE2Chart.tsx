"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceArea,
} from "recharts";

interface MiniE2ChartProps {
  data: { time: number; value: number }[];
  currentLevel: number;
  projection?: { time: number; value: number }[];
  targetMin?: number;
  targetMax?: number;
}

export default function MiniE2Chart({ data, currentLevel, projection, targetMin, targetMax }: MiniE2ChartProps) {
  // Show only the last 168 hours (7 days) of data
  const last168 = data.length > 168 ? data.slice(-168) : data;

  // Append projection data (offset from end of historical data)
  const nowHour = last168.length > 0 ? last168[last168.length - 1].time : 0;
  const projectionMapped = projection
    ? projection.map((p) => ({ time: nowHour + p.time, value: p.value }))
    : [];
  const chartData = [...last168, ...projectionMapped.filter((p) => p.time > nowHour)];

  // Range status
  let rangeStatus: "in-range" | "below" | "above" | null = null;
  if (targetMin !== undefined && targetMax !== undefined) {
    if (currentLevel < targetMin) rangeStatus = "below";
    else if (currentLevel > targetMax) rangeStatus = "above";
    else rangeStatus = "in-range";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-center">
        <p className="text-sm text-gray-500">Current Estimated Level</p>
        <p className="text-3xl font-bold text-kawaii-pink-dark">
          {currentLevel.toFixed(1)}
          <span className="text-sm font-normal text-gray-400 ml-1">pg/mL</span>
        </p>
        {rangeStatus && (
          <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            rangeStatus === "in-range"
              ? "bg-green-100 text-green-700"
              : rangeStatus === "below"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}>
            {rangeStatus === "in-range" ? "In range" : rangeStatus === "below" ? "Below target" : "Above target"}
          </span>
        )}
      </div>
      {chartData.length > 1 && (
        <div className="w-full h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <defs>
                <linearGradient id="miniE2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4628B" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D4628B" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              {targetMin !== undefined && targetMax !== undefined && (
                <ReferenceArea
                  y1={targetMin}
                  y2={targetMax}
                  fill="#4ade80"
                  fillOpacity={0.15}
                />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#D4628B"
                strokeWidth={2}
                fill="url(#miniE2Gradient)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
