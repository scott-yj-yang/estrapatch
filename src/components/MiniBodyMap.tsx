"use client";

import { BodySide } from "@/lib/types";

interface MiniBodyMapProps {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  side: BodySide;
  size?: number; // px, default 80
}

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

export default function MiniBodyMap({ x, y, side, size = 80 }: MiniBodyMapProps) {
  const viewW = 300;
  const viewH = 400;
  const dotR = 10;

  // Square crop centered on the patch location
  const cropSize = 120;
  const cx = x * viewW;
  const cy = y * viewH;
  const cropX = Math.max(0, Math.min(cx - cropSize / 2, viewW - cropSize));
  const cropY = Math.max(0, Math.min(cy - cropSize / 2, viewH - cropSize));

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg
        viewBox={`${cropX} ${cropY} ${cropSize} ${cropSize}`}
        width={size}
        height={size}
        className="rounded-lg bg-white/50"
      >
        <image
          href={IMAGE_MAP[side]}
          x={10}
          y={5}
          width={280}
          height={390}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.5}
          transform={side === "right" ? `translate(${viewW}, 0) scale(-1, 1)` : undefined}
        />
        {/* Patch dot */}
        <circle
          cx={cx}
          cy={cy}
          r={dotR}
          fill={COLOR_MAP[side]}
          stroke="white"
          strokeWidth={3}
          opacity={0.9}
        />
      </svg>
      <span className="text-[10px] text-gray-400 capitalize">{side}</span>
    </div>
  );
}
