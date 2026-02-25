"use client";

import { useState, useCallback } from "react";
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
import { PlaygroundMode } from "@/lib/types";

interface PlaygroundPatchEvent {
  hour: number;
  type: "applied" | "removed";
  label: string;
  isOriginal: boolean;
}

interface PlaygroundChartProps {
  data: { time: number; value: number }[];
  nowHour: number;
  startTime: string;
  patchEvents: PlaygroundPatchEvent[];
  targetMin: number;
  targetMax: number;
  mode: PlaygroundMode;
  onTimeClick: (hour: number) => void;
}

function formatRealDateTick(hour: number, startTime: string): string {
  const startMs = new Date(startTime).getTime();
  const dateMs = startMs + hour * 60 * 60 * 1000;
  const d = new Date(dateMs);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function hourToDate(hour: number, startTime: string): string {
  const startMs = new Date(startTime).getTime();
  const dateMs = startMs + hour * 60 * 60 * 1000;
  const d = new Date(dateMs);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const MODE_CURSOR_COLORS: Record<PlaygroundMode, string> = {
  view: "#D4628B",
  add: "#4ade80",
  remove: "#f87171",
};

function PlaygroundTooltip({
  active,
  payload,
  startTime,
  mode,
}: {
  active?: boolean;
  payload?: { value: number; payload: { time: number }; dataKey?: string }[];
  label?: number;
  startTime: string;
  mode: PlaygroundMode;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload.find((p) => p.value != null) ?? payload[0];
  const value = entry.value;
  const hour = entry.payload.time;
  const isProjection = entry.dataKey === "projection";

  const dateLabel = hourToDate(hour, startTime);

  let modeHint: string | null = null;
  if (mode === "add") {
    modeHint = "Click to add patch";
  } else if (mode === "remove") {
    modeHint = "Click to remove patch";
  }

  return (
    <div className="bg-white rounded-kawaii shadow-kawaii p-2 border border-kawaii-pink/30">
      <p className="text-xs text-gray-500">{dateLabel}</p>
      <p className="text-sm font-bold text-kawaii-pink-dark">
        {value.toFixed(1)} pg/mL
        {isProjection && (
          <span className="text-xs font-normal text-gray-400 ml-1">
            (projected)
          </span>
        )}
      </p>
      {modeHint && (
        <p className="text-xs mt-1 text-gray-400 italic">{modeHint}</p>
      )}
    </div>
  );
}

export default function PlaygroundChart({
  data,
  nowHour,
  startTime,
  patchEvents,
  targetMin,
  targetMax,
  mode,
  onTimeClick,
}: PlaygroundChartProps) {
  const [cursorHour, setCursorHour] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback(
    (state: any) => {
      if (state && state.activeLabel !== undefined) {
        setCursorHour(Number(state.activeLabel));
      }
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setCursorHour(null);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = useCallback(
    (state: any) => {
      if (mode === "view") return;
      if (state && state.activeLabel !== undefined) {
        onTimeClick(Number(state.activeLabel));
      }
    },
    [mode, onTimeClick]
  );

  if (data.length === 0) {
    return (
      <div className="h-72 md:h-96 flex items-center justify-center text-gray-400">
        No data to display
      </div>
    );
  }

  // Build combined data array with separate keys for historical and projection
  const combinedData: {
    time: number;
    historical?: number;
    projection?: number;
  }[] = [];

  for (const d of data) {
    if (d.time <= nowHour) {
      combinedData.push({ time: d.time, historical: d.value });
    }
  }

  // Bridge point: connect historical to projection at nowHour
  const bridgeValue =
    data.find((d) => Math.abs(d.time - nowHour) < 1)?.value ??
    data.filter((d) => d.time <= nowHour).pop()?.value ??
    0;
  const bridgeIdx = combinedData.findIndex(
    (d) => Math.abs(d.time - nowHour) < 1
  );
  if (bridgeIdx >= 0) {
    combinedData[bridgeIdx].projection = bridgeValue;
  } else {
    combinedData.push({
      time: nowHour,
      historical: bridgeValue,
      projection: bridgeValue,
    });
  }

  // Projection data points (time > nowHour)
  for (const d of data) {
    if (d.time > nowHour) {
      combinedData.push({ time: d.time, projection: d.value });
    }
  }

  combinedData.sort((a, b) => a.time - b.time);

  const maxTime =
    combinedData.length > 0
      ? combinedData[combinedData.length - 1].time
      : data[data.length - 1]?.time ?? 0;

  // Daily ticks (every 24h)
  const ticks: number[] = [];
  for (let t = 0; t <= maxTime; t += 24) {
    ticks.push(t);
  }

  const tickFormatter = (hour: number) => formatRealDateTick(hour, startTime);

  const hasProjection = combinedData.some((d) => d.projection !== undefined);

  // Separate original and playground-added patch events
  const originalApplied = patchEvents.filter(
    (e) => e.type === "applied" && e.isOriginal
  );
  const originalRemoved = patchEvents.filter(
    (e) => e.type === "removed" && e.isOriginal
  );
  const playgroundApplied = patchEvents.filter(
    (e) => e.type === "applied" && !e.isOriginal
  );
  const playgroundRemoved = patchEvents.filter(
    (e) => e.type === "removed" && !e.isOriginal
  );

  // Determine CSS cursor based on mode
  const cursorStyle =
    mode === "add" ? "crosshair" : mode === "remove" ? "pointer" : "default";

  return (
    <div className="w-full">
      <div className="h-72 md:h-96" style={{ cursor: cursorStyle }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={combinedData}
            margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#FDE8EF" />

            {/* Target range band */}
            <ReferenceArea
              y1={targetMin}
              y2={targetMax}
              fill="#4ade80"
              fillOpacity={0.12}
              stroke="#4ade80"
              strokeOpacity={0.3}
              strokeDasharray="3 3"
            />

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
              content={
                <PlaygroundTooltip startTime={startTime} mode={mode} />
              }
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
            {hasProjection && (
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

            {/* Original patch applied markers (blue) */}
            {originalApplied.map((event, i) => (
              <ReferenceLine
                key={`orig-applied-${i}`}
                x={event.hour}
                stroke="#5BCEFA"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: "\u25BC",
                  position: "top",
                  fill: "#5BCEFA",
                  fontSize: 10,
                }}
              />
            ))}

            {/* Original patch removed markers (pink) */}
            {originalRemoved.map((event, i) => (
              <ReferenceLine
                key={`orig-removed-${i}`}
                x={event.hour}
                stroke="#F5A9B8"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: "\u25B2",
                  position: "top",
                  fill: "#F5A9B8",
                  fontSize: 10,
                }}
              />
            ))}

            {/* Playground-added patch applied markers (green) */}
            {playgroundApplied.map((event, i) => (
              <ReferenceLine
                key={`pg-applied-${i}`}
                x={event.hour}
                stroke="#4ade80"
                strokeWidth={1.5}
                label={{
                  value: "\u25BC",
                  position: "top",
                  fill: "#4ade80",
                  fontSize: 10,
                }}
              />
            ))}

            {/* Playground-added patch removed markers (orange) */}
            {playgroundRemoved.map((event, i) => (
              <ReferenceLine
                key={`pg-removed-${i}`}
                x={event.hour}
                stroke="#fb923c"
                strokeWidth={1.5}
                label={{
                  value: "\u25B2",
                  position: "top",
                  fill: "#fb923c",
                  fontSize: 10,
                }}
              />
            ))}

            {/* "Now" marker */}
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

            {/* Cursor tracking line */}
            {cursorHour !== null && (
              <ReferenceLine
                x={cursorHour}
                stroke={MODE_CURSOR_COLORS[mode]}
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-1 text-xs text-gray-400">
        {(originalApplied.length > 0 || originalRemoved.length > 0) && (
          <>
            <span className="flex items-center gap-1">
              <span className="text-[#5BCEFA]">{"\u25BC"}</span> Applied
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[#F5A9B8]">{"\u25B2"}</span> Removed
            </span>
          </>
        )}
        {(playgroundApplied.length > 0 || playgroundRemoved.length > 0) && (
          <>
            <span className="flex items-center gap-1">
              <span className="text-[#4ade80]">{"\u25BC"}</span> Added (sim)
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[#fb923c]">{"\u25B2"}</span> Removed (sim)
            </span>
          </>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mt-1 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 bg-green-400/30 border border-green-400/50 rounded-sm" />
          Target: {targetMin}&ndash;{targetMax} pg/mL
        </span>
      </div>
    </div>
  );
}
