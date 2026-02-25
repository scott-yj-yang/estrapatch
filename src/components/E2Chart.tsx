"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

export interface PatchEvent {
  hour: number;
  type: "applied" | "removed";
  label: string;
}

interface E2ChartProps {
  data: { time: number; value: number }[];
  period: number;
  nowHour?: number;
  startTime?: string; // ISO datetime of hour=0
  patchEvents?: PatchEvent[];
  projection?: { time: number; value: number }[];
  targetMin?: number;
  targetMax?: number;
}

function formatDayTick(hour: number): string {
  const day = Math.floor(hour / 24) + 1;
  return `Day ${day}`;
}

function formatRealDateTick(hour: number, startTime: string): string {
  const startMs = new Date(startTime).getTime();
  const dateMs = startMs + hour * 60 * 60 * 1000;
  const d = new Date(dateMs);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  startTime,
}: {
  active?: boolean;
  payload?: { value: number; payload: { time: number }; dataKey?: string }[];
  label?: number;
  startTime?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // Pick the first non-null value (historical or projection)
  const entry = payload.find((p) => p.value != null) ?? payload[0];
  const value = entry.value;
  const hour = entry.payload.time;
  const isProjection = entry.dataKey === "projection";

  let dateLabel: string;
  if (startTime) {
    const startMs = new Date(startTime).getTime();
    const dateMs = startMs + hour * 60 * 60 * 1000;
    const d = new Date(dateMs);
    dateLabel = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } else {
    const day = Math.floor(hour / 24) + 1;
    const hourOfDay = hour % 24;
    dateLabel = `Day ${day}, Hour ${hourOfDay}`;
  }

  return (
    <div className="bg-white rounded-kawaii shadow-kawaii p-2 border border-kawaii-pink/30">
      <p className="text-xs text-gray-500">{dateLabel}</p>
      <p className="text-sm font-bold text-kawaii-pink-dark">
        {value.toFixed(1)} pg/mL
        {isProjection && <span className="text-xs font-normal text-gray-400 ml-1">(projected)</span>}
      </p>
    </div>
  );
}

export default function E2Chart({
  data,
  period,
  nowHour,
  startTime,
  patchEvents = [],
  projection,
  targetMin,
  targetMax,
}: E2ChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        No data to display
      </div>
    );
  }

  // Build projection data points offset from nowHour
  const projectionPoints = projection && nowHour !== undefined
    ? projection.map((p) => ({
        time: nowHour + p.time,
        value: p.value,
      }))
    : [];

  // Build combined data array with separate keys for historical and projection
  // This ensures Recharts positions both series correctly on the shared x-axis
  const combinedData: { time: number; historical?: number; projection?: number }[] = [];

  for (const d of data) {
    combinedData.push({ time: d.time, historical: d.value });
  }

  if (projectionPoints.length > 0 && nowHour !== undefined) {
    // Bridge point: connect historical to projection at nowHour
    const bridgeValue = data.find((d) => Math.abs(d.time - nowHour) < 1)?.value
      ?? projectionPoints[0]?.value ?? 0;
    const bridgeIdx = combinedData.findIndex((d) => Math.abs(d.time - nowHour) < 1);
    if (bridgeIdx >= 0) {
      combinedData[bridgeIdx].projection = bridgeValue;
    } else {
      combinedData.push({ time: nowHour, historical: bridgeValue, projection: bridgeValue });
    }

    for (const p of projectionPoints) {
      if (p.time > nowHour) {
        combinedData.push({ time: p.time, projection: p.value });
      }
    }
  }

  combinedData.sort((a, b) => a.time - b.time);

  const maxTime = combinedData.length > 0
    ? combinedData[combinedData.length - 1].time
    : data[data.length - 1]?.time ?? 0;

  // Use daily ticks for short periods (what-if), weekly for longer (personal)
  const tickInterval = maxTime <= 720 ? 24 : 168;
  const ticks: number[] = [];
  for (let t = 0; t <= maxTime; t += tickInterval) {
    ticks.push(t);
  }

  const tickFormatter = startTime
    ? (hour: number) => formatRealDateTick(hour, startTime)
    : formatDayTick;

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={combinedData}
          margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#FDE8EF" />
          {/* Target range band */}
          {targetMin !== undefined && targetMax !== undefined && (
            <ReferenceArea
              y1={targetMin}
              y2={targetMax}
              fill="#4ade80"
              fillOpacity={0.12}
              stroke="#4ade80"
              strokeOpacity={0.3}
              strokeDasharray="3 3"
            />
          )}
          <XAxis
            dataKey="time"
            ticks={ticks}
            tickFormatter={tickFormatter}
            tick={{ fontSize: 10, fill: "#999" }}
            axisLine={{ stroke: "#FDE8EF" }}
            tickLine={{ stroke: "#FDE8EF" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#999" }}
            axisLine={{ stroke: "#FDE8EF" }}
            tickLine={{ stroke: "#FDE8EF" }}
            label={{
              value: "pg/mL",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "#999" },
            }}
          />
          <Tooltip
            content={<CustomTooltip startTime={startTime} />}
          />
          {/* Historical line (solid) */}
          <Line
            type="monotone"
            dataKey="historical"
            stroke="#D4628B"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />

          {/* Projection line (dashed) */}
          {projectionPoints.length > 0 && (
            <Line
              type="monotone"
              dataKey="projection"
              stroke="#D4628B"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          )}

          {/* Patch application markers */}
          {patchEvents
            .filter((e) => e.type === "applied")
            .map((event, i) => (
              <ReferenceLine
                key={`applied-${i}`}
                x={event.hour}
                stroke="#5BCEFA"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: "▼",
                  position: "top",
                  fill: "#5BCEFA",
                  fontSize: 10,
                }}
              />
            ))}

          {/* Patch removal markers */}
          {patchEvents
            .filter((e) => e.type === "removed")
            .map((event, i) => (
              <ReferenceLine
                key={`removed-${i}`}
                x={event.hour}
                stroke="#F5A9B8"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: "▲",
                  position: "top",
                  fill: "#F5A9B8",
                  fontSize: 10,
                }}
              />
            ))}

          {/* "Now" marker */}
          {nowHour !== undefined && (
            <ReferenceLine
              x={nowHour}
              stroke="#D4628B"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: "Now",
                position: "top",
                fill: "#D4628B",
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Legend for patch events */}
      {patchEvents.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="text-[#5BCEFA]">▼</span> Applied
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[#F5A9B8]">▲</span> Removed
          </span>
        </div>
      )}
      {targetMin !== undefined && targetMax !== undefined && (
        <div className="flex items-center justify-center gap-2 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 bg-green-400/30 border border-green-400/50 rounded-sm" />
            Target: {targetMin}–{targetMax} pg/mL
          </span>
        </div>
      )}
    </div>
  );
}
