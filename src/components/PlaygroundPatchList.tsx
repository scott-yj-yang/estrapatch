"use client";

import { PlaygroundPatch } from "@/lib/types";
import Button from "@/components/Button";

interface PlaygroundPatchListProps {
  patches: PlaygroundPatch[];
  initialPatches: PlaygroundPatch[]; // original state for detecting modifications
  onDeletePatch: (id: string) => void;
  onUndoPatch: (id: string) => void; // restore original removed_at for modified real patches
  onResetAll: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PlaygroundPatchList({
  patches,
  initialPatches,
  onDeletePatch,
  onUndoPatch,
  onResetAll,
}: PlaygroundPatchListProps) {
  const isModified = (patch: PlaygroundPatch): boolean => {
    if (!patch.isOriginal) return false;
    const initial = initialPatches.find((p) => p.id === patch.id);
    return initial?.removed_at !== patch.removed_at;
  };

  // Sort: real patches first (by applied_at asc), then playground patches (by applied_at asc)
  const sorted = [...patches].sort((a, b) => {
    if (a.isOriginal !== b.isOriginal) return a.isOriginal ? -1 : 1;
    return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
  });

  const realCount = patches.filter((p) => p.isOriginal).length;
  const addedCount = patches.filter((p) => !p.isOriginal).length;

  const countLabel =
    addedCount > 0
      ? `Patches (${realCount} real + ${addedCount} added)`
      : `Patches (${patches.length})`;

  return (
    <div>
      {/* Header */}
      <h4 className="text-xs font-bold text-kawaii-pink-dark mb-1.5">
        {countLabel}
      </h4>

      {/* Scrollable list */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {sorted.length === 0 && (
          <p className="text-xs text-gray-400 py-2 text-center">
            No patches yet
          </p>
        )}

        {sorted.map((patch) => {
          const modified = isModified(patch);
          const isActive = patch.removed_at === null;

          return (
            <div
              key={patch.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-kawaii text-xs ${
                patch.isOriginal
                  ? "bg-white"
                  : "bg-purple-50 border-l-2 border-dashed border-purple-400"
              }`}
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-medium text-gray-700 truncate ${
                      modified ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {formatDate(patch.applied_at)}
                  </span>
                  {isActive ? (
                    <span className="shrink-0 inline-block px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold leading-none">
                      Active
                    </span>
                  ) : (
                    <span className="shrink-0 inline-block px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold leading-none truncate max-w-[7rem]">
                      Removed {formatDate(patch.removed_at!)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-gray-500">
                    {patch.dose_mg_per_day} mg/day
                  </span>
                  {!patch.isOriginal && (
                    <span className="text-purple-400 font-medium">
                      (added)
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!patch.isOriginal && (
                <Button
                  variant="danger"
                  size="sm"
                  className="!px-1.5 !py-0.5 !text-xs leading-none"
                  onClick={() => onDeletePatch(patch.id)}
                  aria-label="Delete playground patch"
                >
                  &times;
                </Button>
              )}
              {modified && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="!px-2 !py-0.5 !text-xs leading-none"
                  onClick={() => onUndoPatch(patch.id)}
                >
                  Undo
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset All */}
      <Button
        variant="secondary"
        size="sm"
        className="w-full mt-2"
        onClick={onResetAll}
      >
        Reset All
      </Button>
    </div>
  );
}
