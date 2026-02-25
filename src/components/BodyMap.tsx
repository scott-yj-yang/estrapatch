"use client";

import { useState, useCallback, useRef } from "react";
import { BodySide } from "@/lib/types";

export interface PatchMarker {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  side: BodySide;
  active?: boolean;
  label?: string;
}

interface BodyMapProps {
  onPlacePatch?: (x: number, y: number, side: BodySide) => void;
  existingMarkers?: PatchMarker[];
  interactive?: boolean;
}

const PATCH_WIDTH = 24;
const PATCH_HEIGHT = 24;

const IMAGE_MAP: Record<BodySide, string> = {
  front: "/body-front.png",
  back: "/body-back.png",
  left: "/body-side.png",
  right: "/body-side.png",
};

const COLOR_MAP: Record<BodySide, string> = {
  front: "#F5A9B8",
  back: "#5BCEFA",
  left: "#C8A2D4",
  right: "#A2C8D4",
};

const SIDES: { value: BodySide; label: string; activeClass: string; inactiveClass: string }[] = [
  {
    value: "front",
    label: "Front",
    activeClass: "bg-kawaii-pink text-white shadow-kawaii",
    inactiveClass: "bg-kawaii-rose text-kawaii-pink-dark hover:bg-kawaii-pink/30",
  },
  {
    value: "back",
    label: "Back",
    activeClass: "bg-kawaii-lavender text-white shadow-kawaii",
    inactiveClass: "bg-kawaii-lavender/40 text-sky-700 hover:bg-kawaii-lavender/60",
  },
  {
    value: "left",
    label: "Left",
    activeClass: "bg-purple-400 text-white shadow-kawaii",
    inactiveClass: "bg-purple-200/40 text-purple-700 hover:bg-purple-300/60",
  },
  {
    value: "right",
    label: "Right",
    activeClass: "bg-teal-400 text-white shadow-kawaii",
    inactiveClass: "bg-teal-200/40 text-teal-700 hover:bg-teal-300/60",
  },
];

export default function BodyMap({
  onPlacePatch,
  existingMarkers = [],
  interactive = true,
}: BodyMapProps) {
  const [currentSide, setCurrentSide] = useState<BodySide>("front");
  const [pendingMarker, setPendingMarker] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const strokeColor = COLOR_MAP[currentSide];
  const imageSrc = IMAGE_MAP[currentSide];

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!interactive) return;

      const svg = svgRef.current;
      if (!svg) return;

      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;

      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      const svgPoint = point.matrixTransform(ctm.inverse());

      // Normalize to 0-1 range
      const normX = svgPoint.x / 300;
      const normY = svgPoint.y / 400;

      // Clamp within bounds
      const clampedX = Math.max(0, Math.min(1, normX));
      const clampedY = Math.max(0, Math.min(1, normY));

      setPendingMarker({ x: clampedX, y: clampedY });
    },
    [interactive]
  );

  const handleConfirm = useCallback(() => {
    if (pendingMarker && onPlacePatch) {
      onPlacePatch(pendingMarker.x, pendingMarker.y, currentSide);
    }
    setPendingMarker(null);
  }, [pendingMarker, onPlacePatch, currentSide]);

  const handleCancel = useCallback(() => {
    setPendingMarker(null);
  }, []);

  const markersForSide = existingMarkers.filter(
    (m) => m.side === currentSide
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Front/Back/Left/Right toggle */}
      <div className="flex gap-2">
        {SIDES.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setCurrentSide(s.value);
              setPendingMarker(null);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              currentSide === s.value ? s.activeClass : s.inactiveClass
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* SVG body map with click handling */}
      <svg
        ref={svgRef}
        viewBox="0 0 300 400"
        className={`w-full max-w-[280px] md:max-w-[400px] ${
          interactive ? "cursor-crosshair" : ""
        }`}
        onClick={handleSvgClick}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body image */}
        <image
          href={imageSrc}
          x={10}
          y={5}
          width={280}
          height={390}
          preserveAspectRatio="xMidYMid meet"
          transform={currentSide === "right" ? "translate(300, 0) scale(-1, 1)" : undefined}
        />

        {/* L/R labels (only for front/back views) */}
        {(currentSide === "front" || currentSide === "back") && (
          <>
            <text x={30} y={200} textAnchor="middle" fontSize={13} fill={strokeColor} fontFamily="Nunito, sans-serif" fontWeight={700} opacity={0.45}>
              {currentSide === "front" ? "R" : "L"}
            </text>
            <text x={270} y={200} textAnchor="middle" fontSize={13} fill={strokeColor} fontFamily="Nunito, sans-serif" fontWeight={700} opacity={0.45}>
              {currentSide === "front" ? "L" : "R"}
            </text>
          </>
        )}

        {/* Label */}
        <text
          x={150}
          y={396}
          textAnchor="middle"
          fontSize={14}
          fill={strokeColor}
          fontFamily="Nunito, sans-serif"
          fontWeight={600}
        >
          {SIDES.find((s) => s.value === currentSide)?.label}
        </text>

        {/* Existing markers */}
        {markersForSide.map((marker, i) => {
          const px = marker.x * 300;
          const py = marker.y * 400;
          const isActive = marker.active !== false;

          return (
            <g key={`marker-${i}`}>
              <rect
                x={px - PATCH_WIDTH / 2}
                y={py - PATCH_HEIGHT / 2}
                width={PATCH_WIDTH}
                height={PATCH_HEIGHT}
                rx={4}
                fill={isActive ? "#D4628B" : "#F5A9B8"}
                opacity={isActive ? 0.8 : 0.35}
                stroke={isActive ? "#C44E78" : "#F5A9B8"}
                strokeWidth={1.5}
              />
              {marker.label && (
                <text
                  x={px}
                  y={py + PATCH_HEIGHT / 2 + 12}
                  textAnchor="middle"
                  fontSize={9}
                  fill={isActive ? "#D4628B" : "#ccc"}
                  fontFamily="Nunito, sans-serif"
                  fontWeight={600}
                >
                  {marker.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Pending marker */}
        {pendingMarker && (
          <g>
            <rect
              x={pendingMarker.x * 300 - PATCH_WIDTH / 2}
              y={pendingMarker.y * 400 - PATCH_HEIGHT / 2}
              width={PATCH_WIDTH}
              height={PATCH_HEIGHT}
              rx={4}
              fill="none"
              stroke="#D4628B"
              strokeWidth={2}
              strokeDasharray="4 3"
              opacity={0.9}
            >
              <animate
                attributeName="opacity"
                values="0.5;0.9;0.5"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </rect>
            <text
              x={pendingMarker.x * 300}
              y={pendingMarker.y * 400 - PATCH_HEIGHT / 2 - 5}
              textAnchor="middle"
              fontSize={9}
              fill="#D4628B"
              fontFamily="Nunito, sans-serif"
              fontWeight={700}
            >
              NEW
            </text>
          </g>
        )}
      </svg>

      {/* Confirm / Cancel buttons */}
      {pendingMarker && (
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-full text-sm font-semibold bg-kawaii-pink-dark text-white shadow-kawaii hover:brightness-110 transition-all"
          >
            Confirm Placement
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-200 text-gray-500 hover:bg-gray-300 transition-all"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
