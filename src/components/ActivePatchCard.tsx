"use client";

import { useState } from "react";
import { Patch, BodySide } from "@/lib/types";
import BodyMap from "./BodyMap";
import CountdownTimer from "./CountdownTimer";
import Button from "./Button";
import MiniBodyMap from "./MiniBodyMap";

interface ActivePatchCardProps {
  patch: Patch;
  onRemove: (id: number) => void;
  onAdjust?: (id: number, wearHours: number) => void;
  onEditLocation?: (id: number, x: number, y: number, side: BodySide) => void;
}

export default function ActivePatchCard({
  patch,
  onRemove,
  onAdjust,
  onEditLocation,
}: ActivePatchCardProps) {
  const [adjusting, setAdjusting] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  const currentWearHours =
    patch.wear_hours ??
    (new Date(patch.scheduled_removal).getTime() -
      new Date(patch.applied_at).getTime()) /
      (1000 * 60 * 60);
  const [wearDays, setWearDays] = useState(
    Math.round((currentWearHours / 24) * 2) / 2
  );

  const appliedDate = new Date(patch.applied_at);
  const formattedApplied = appliedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const handleSaveAdjust = () => {
    onAdjust?.(patch.id, wearDays * 24);
    setAdjusting(false);
  };

  return (
    <div className="p-3 bg-kawaii-rose/50 rounded-kawaii">
      <div className="flex items-start gap-3">
        <MiniBodyMap
          x={patch.body_x}
          y={patch.body_y}
          side={patch.body_side}
          size={60}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-kawaii-pink-dark capitalize">
              {patch.body_side}
            </span>
            <span className="text-sm text-gray-500">
              {patch.dose_mg_per_day} mg/day
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Applied {formattedApplied}
          </p>
          <CountdownTimer
            targetDate={patch.scheduled_removal}
            label="Time until removal"
          />
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAdjusting(!adjusting)}
          >
            Adjust
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditingLocation(!editingLocation)}
          >
            Location
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onRemove(patch.id)}
          >
            Remove
          </Button>
        </div>
      </div>

      {/* Inline wear time adjuster */}
      {adjusting && (
        <div className="mt-3 pt-3 border-t border-kawaii-pink/20">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Adjust wear time
          </label>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="range"
              min={0.5}
              max={7}
              step={0.5}
              value={wearDays}
              onChange={(e) => setWearDays(Number(e.target.value))}
              className="flex-1 accent-kawaii-pink-dark"
            />
            <span className="text-sm font-bold text-kawaii-pink-dark w-20 text-right">
              {wearDays} {wearDays === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleSaveAdjust}>
              Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setWearDays(Math.round((currentWearHours / 24) * 2) / 2);
                setAdjusting(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {editingLocation && (
        <div className="mt-3 pt-3 border-t border-kawaii-pink/20">
          <label className="block text-xs font-semibold text-gray-600 mb-2">
            Click to set new patch location
          </label>
          <BodyMap
            interactive={true}
            onPlacePatch={(x, y, side) => {
              onEditLocation?.(patch.id, x, y, side);
              setEditingLocation(false);
            }}
            existingMarkers={[
              { x: patch.body_x, y: patch.body_y, side: patch.body_side, active: true, label: "Current" },
            ]}
          />
        </div>
      )}
    </div>
  );
}
