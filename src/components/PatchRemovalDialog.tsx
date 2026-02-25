"use client";

import { useState } from "react";
import Button from "@/components/Button";

interface PatchRemovalDialogProps {
  activePatches: {
    id: string;
    applied_at: string;
    wearHours: number;
    isOriginal: boolean;
    dose_mg_per_day: number;
  }[];
  removalTime: string; // ISO datetime
  onConfirm: (patchId: string) => void;
  onCancel: () => void;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRemovalTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PatchRemovalDialog({
  activePatches,
  removalTime,
  onConfirm,
  onCancel,
}: PatchRemovalDialogProps) {
  // Sort by wearHours descending (longest worn first)
  const sorted = [...activePatches].sort((a, b) => b.wearHours - a.wearHours);

  // Pre-select the longest-duration patch
  const [selectedId, setSelectedId] = useState<string>(
    sorted.length > 0 ? sorted[0].id : ""
  );

  if (activePatches.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-kawaii shadow-kawaii p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-lg font-bold text-kawaii-pink-dark">
          Remove Patch
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          At {formatRemovalTime(removalTime)}
        </p>

        {/* Radio list */}
        <fieldset className="space-y-2 mb-5">
          <legend className="sr-only">Select patch to remove</legend>
          {sorted.map((patch) => (
            <label
              key={patch.id}
              className={`flex items-center gap-3 p-3 rounded-kawaii cursor-pointer transition-colors ${
                selectedId === patch.id
                  ? "bg-kawaii-rose ring-2 ring-kawaii-pink-dark/30"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <input
                type="radio"
                name="patch-removal"
                value={patch.id}
                checked={selectedId === patch.id}
                onChange={() => setSelectedId(patch.id)}
                className="accent-kawaii-pink-dark w-4 h-4 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">
                    Applied {formatShortDate(patch.applied_at)}
                  </span>
                  {!patch.isOriginal && (
                    <span className="text-xs font-medium text-kawaii-pink-dark bg-kawaii-rose px-1.5 py-0.5 rounded-full">
                      (playground)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">
                    {Math.round(patch.wearHours)}h worn
                  </span>
                  <span className="text-xs text-gray-400">
                    {patch.dose_mg_per_day} mg/day
                  </span>
                </div>
              </div>
            </label>
          ))}
        </fieldset>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => onConfirm(selectedId)}
            disabled={!selectedId}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
