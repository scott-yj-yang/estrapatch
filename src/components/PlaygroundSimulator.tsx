"use client";

import { useState, useEffect, useCallback } from "react";
import { PlaygroundPatch, PlaygroundMode } from "@/lib/types";
import { usePlaygroundSimulation } from "@/hooks/usePlaygroundSimulation";
import PlaygroundChart from "@/components/PlaygroundChart";
import PlaygroundPatchList from "@/components/PlaygroundPatchList";
import PatchRemovalDialog from "@/components/PatchRemovalDialog";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import Card from "@/components/Card";

interface PlaygroundSimulatorProps {
  initialPatches: PlaygroundPatch[];
  targetMin: number;
  targetMax: number;
}

interface RemovalDialogState {
  activePatches: {
    id: string;
    applied_at: string;
    wearHours: number;
    isOriginal: boolean;
    dose_mg_per_day: number;
  }[];
  timeISO: string;
}

const MODE_BUTTON_STYLES: Record<
  PlaygroundMode,
  { active: string; label: string }
> = {
  view: {
    active: "bg-kawaii-pink-dark text-white",
    label: "View",
  },
  add: {
    active: "bg-green-500 text-white",
    label: "+ Add Patch",
  },
  remove: {
    active: "bg-red-400 text-white",
    label: "- Remove Patch",
  },
};

const INACTIVE_STYLE = "bg-kawaii-rose text-kawaii-pink-dark";

export default function PlaygroundSimulator({
  initialPatches,
  targetMin,
  targetMax,
}: PlaygroundSimulatorProps) {
  const [patches, setPatches] = useState<PlaygroundPatch[]>(initialPatches);
  const [mode, setMode] = useState<PlaygroundMode>("view");
  const [removalDialog, setRemovalDialog] = useState<RemovalDialogState | null>(
    null
  );

  // Reset patches when initialPatches changes (e.g., user switches tabs)
  useEffect(() => {
    setPatches(initialPatches);
  }, [initialPatches]);

  const simulation = usePlaygroundSimulation(patches, targetMin, targetMax);

  // --- Handlers ---

  const handleTimeClick = useCallback(
    (hour: number) => {
      if (!simulation) return;

      if (mode === "add") {
        const clickedTimeMs =
          new Date(simulation.startTime).getTime() + hour * 3600000;
        const clickedTimeISO = new Date(clickedTimeMs).toISOString();

        const newPatch: PlaygroundPatch = {
          id: `pg-${Date.now()}`,
          applied_at: clickedTimeISO,
          removed_at: null,
          dose_mg_per_day: 0.1,
          isOriginal: false,
        };

        setPatches((prev) => [...prev, newPatch]);
      } else if (mode === "remove") {
        const clickedTimeMs =
          new Date(simulation.startTime).getTime() + hour * 3600000;
        const clickedTimeISO = new Date(clickedTimeMs).toISOString();

        // Find all patches active at that hour
        const activeAtTime = patches.filter((p) => {
          const appliedMs = new Date(p.applied_at).getTime();
          const removedMs = p.removed_at
            ? new Date(p.removed_at).getTime()
            : Infinity;
          return appliedMs <= clickedTimeMs && removedMs > clickedTimeMs;
        });

        if (activeAtTime.length === 0) return;

        if (activeAtTime.length === 1) {
          // Directly confirm removal for single active patch
          handleRemoveConfirm(activeAtTime[0].id, clickedTimeISO);
        } else {
          // Multiple active patches: open dialog
          const dialogPatches = activeAtTime.map((p) => ({
            id: p.id,
            applied_at: p.applied_at,
            wearHours:
              (clickedTimeMs - new Date(p.applied_at).getTime()) / 3600000,
            isOriginal: p.isOriginal,
            dose_mg_per_day: p.dose_mg_per_day,
          }));

          setRemovalDialog({
            activePatches: dialogPatches,
            timeISO: clickedTimeISO,
          });
        }
      }
    },
    [mode, simulation, patches]
  );

  const handleRemoveConfirm = useCallback(
    (patchId: string, timeISO?: string) => {
      const removalTime = timeISO ?? removalDialog?.timeISO;
      if (!removalTime) return;

      setPatches((prev) =>
        prev.map((p) =>
          p.id === patchId ? { ...p, removed_at: removalTime } : p
        )
      );
      setRemovalDialog(null);
    },
    [removalDialog]
  );

  const handleDialogConfirm = useCallback(
    (patchId: string) => {
      handleRemoveConfirm(patchId);
    },
    [handleRemoveConfirm]
  );

  const handleDeletePatch = useCallback(
    (id: string) => {
      const patch = patches.find((p) => p.id === id);
      if (!patch) return;

      if (!patch.isOriginal) {
        // Playground-added: remove from array entirely
        setPatches((prev) => prev.filter((p) => p.id !== id));
      } else {
        // Original: restore its removed_at from initialPatches
        const initial = initialPatches.find((p) => p.id === id);
        if (initial) {
          setPatches((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, removed_at: initial.removed_at } : p
            )
          );
        }
      }
    },
    [patches, initialPatches]
  );

  const handleUndoPatch = useCallback(
    (id: string) => {
      const initial = initialPatches.find((p) => p.id === id);
      if (!initial) return;

      setPatches((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, removed_at: initial.removed_at } : p
        )
      );
    },
    [initialPatches]
  );

  const handleResetAll = useCallback(() => {
    setPatches(initialPatches);
  }, [initialPatches]);

  // --- Projection data for ScheduleTimeline ---
  const projectionForTimeline = simulation
    ? simulation.series
        .filter((s) => s.time >= simulation.nowHour)
        .map((s) => ({ time: s.time - simulation.nowHour, value: s.value }))
    : [];

  // --- Empty state ---
  if (!simulation) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-400 text-sm">
          No patch data available. Add patches to start simulating.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle bar */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-2">
            {(Object.keys(MODE_BUTTON_STYLES) as PlaygroundMode[]).map((m) => {
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-kawaii font-semibold text-sm transition-all active:scale-95 ${
                    isActive
                      ? MODE_BUTTON_STYLES[m].active
                      : INACTIVE_STYLE
                  }`}
                >
                  {MODE_BUTTON_STYLES[m].label}
                </button>
              );
            })}
          </div>

          {/* Current E2 level display */}
          <div className="sm:ml-auto text-right">
            <span className="text-xs text-gray-400 block">
              Playground E2 Level
            </span>
            <span className="text-lg font-bold text-kawaii-pink-dark">
              {simulation.currentLevel.toFixed(1)}{" "}
              <span className="text-sm font-normal text-gray-500">pg/mL</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Chart + Patch list: two-column on desktop, stacked on mobile */}
      <div className="md:grid md:grid-cols-3 md:gap-4">
        {/* Chart: 2 columns */}
        <Card className="md:col-span-2">
          <PlaygroundChart
            data={simulation.series}
            nowHour={simulation.nowHour}
            startTime={simulation.startTime}
            patchEvents={simulation.patchEvents}
            targetMin={targetMin}
            targetMax={targetMax}
            mode={mode}
            onTimeClick={handleTimeClick}
          />
        </Card>

        {/* Patch list: 1 column */}
        <Card className="mt-4 md:mt-0" title="Patch Schedule">
          <PlaygroundPatchList
            patches={patches}
            initialPatches={initialPatches}
            onDeletePatch={handleDeletePatch}
            onUndoPatch={handleUndoPatch}
            onResetAll={handleResetAll}
          />
        </Card>
      </div>

      {/* Health bar / Schedule Timeline: full width */}
      <Card title="7-Day Projection">
        <ScheduleTimeline
          projection={projectionForTimeline}
          targetMin={targetMin}
          targetMax={targetMax}
          scheduleNotes={simulation.scheduleNotes}
        />
      </Card>

      {/* Patch Removal Dialog (modal overlay) */}
      {removalDialog && (
        <PatchRemovalDialog
          activePatches={removalDialog.activePatches}
          removalTime={removalDialog.timeISO}
          onConfirm={handleDialogConfirm}
          onCancel={() => setRemovalDialog(null)}
        />
      )}
    </div>
  );
}
