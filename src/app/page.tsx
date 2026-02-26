"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ActivePatchCard from "@/components/ActivePatchCard";
import MiniE2Chart from "@/components/MiniE2Chart";
import ScheduleTimeline from "@/components/ScheduleTimeline";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Patch, BodySide } from "@/lib/types";
import {
  getActivePatches,
  getAllPatches,
  updatePatch,
  removePatch as dbRemovePatch,
  getSetting,
  ensureDefaults,
} from "@/lib/db";
import {
  calculatePersonalizedE2,
  getCurrentE2Estimate,
  projectE2Forward,
  getScheduleNotes,
} from "@/lib/pk-model";

interface SimulatorData {
  series: { time: number; value: number }[];
  currentLevel: number;
  projection: { time: number; value: number }[];
  targetMin: number;
  targetMax: number;
  scheduleNotes: { type: "apply" | "remove"; urgency: "now" | "soon" | "upcoming"; message: string; hoursUntil: number }[];
}

export default function Dashboard() {
  const [activePatches, setActivePatches] = useState<Patch[]>([]);
  const [simulatorData, setSimulatorData] = useState<SimulatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const onboarded = await getSetting("onboarding_complete");
      if (onboarded !== "true") {
        setShowWelcome(true);
        setLoading(false);
        return;
      }
      setShowWelcome(false);

      await ensureDefaults();

      const active = await getActivePatches();
      setActivePatches(active);

      // Run PK simulation client-side
      const allPatches = await getAllPatches();
      const patchRecords = allPatches.map((p) => ({
        applied_at: p.applied_at,
        removed_at: p.removed_at,
        dose_mg_per_day: p.dose_mg_per_day,
      }));

      if (patchRecords.length > 0) {
        const series = calculatePersonalizedE2(patchRecords, 672);
        const currentLevel = getCurrentE2Estimate(patchRecords);
        const projection = projectE2Forward(patchRecords, 48);
        const tMin = Number((await getSetting("target_e2_min")) ?? "100");
        const tMax = Number((await getSetting("target_e2_max")) ?? "200");
        const scheduleNotes = getScheduleNotes(patchRecords, tMin, tMax, 72);

        setSimulatorData({
          series,
          currentLevel,
          projection,
          targetMin: tMin,
          targetMax: tMax,
          scheduleNotes,
        });
      } else {
        setSimulatorData(null);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemove = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to mark this patch as removed?"
    );
    if (!confirmed) return;

    try {
      await dbRemovePatch(id);
      await fetchData();
    } catch (error) {
      console.error("Failed to remove patch:", error);
    }
  };

  const handleEditLocation = async (id: number, x: number, y: number, side: BodySide) => {
    try {
      await updatePatch(id, { body_x: x, body_y: y, body_side: side });
      await fetchData();
    } catch (error) {
      console.error("Failed to update patch location:", error);
    }
  };

  const handleAdjust = async (id: number, wearHours: number) => {
    try {
      // Find the patch to compute new scheduled_removal from its applied_at
      const patch = activePatches.find((p) => p.id === id);
      if (!patch) return;

      const scheduledRemoval = new Date(
        new Date(patch.applied_at).getTime() + wearHours * 60 * 60 * 1000
      ).toISOString();

      await updatePatch(id, {
        wear_hours: wearHours,
        scheduled_removal: scheduledRemoval,
        notified_removal: false,
      });
      await fetchData();
    } catch (error) {
      console.error("Failed to adjust patch:", error);
    }
  };

  if (showWelcome === true) {
    return (
      <WelcomeScreen
        onComplete={() => {
          setShowWelcome(false);
          fetchData();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kawaii-cream flex items-center justify-center">
        <div className="text-kawaii-pink-dark font-semibold text-lg animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kawaii-cream">
      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-kawaii-pink-dark text-center">
          estrapatch
        </h1>

        <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
          {/* Active Patches */}
          <Card title={`Active Patches (${activePatches.length})`}>
            {activePatches.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No active patches. Time to apply one?
              </p>
            ) : (
              <div className="space-y-3">
                {activePatches.map((patch) => (
                  <ActivePatchCard
                    key={patch.id}
                    patch={patch}
                    onRemove={handleRemove}
                    onAdjust={handleAdjust}
                    onEditLocation={handleEditLocation}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Estimated E2 Level */}
          <Card title="Estimated E2 Level">
            {simulatorData && simulatorData.series.length > 0 ? (
              <div className="space-y-2">
                <MiniE2Chart
                  data={simulatorData.series}
                  currentLevel={simulatorData.currentLevel}
                  projection={simulatorData.projection}
                  targetMin={simulatorData.targetMin}
                  targetMax={simulatorData.targetMax}
                />
                <div className="text-center">
                  <Link
                    href="/simulator"
                    className="text-sm text-kawaii-pink-dark font-semibold hover:underline"
                  >
                    View Full Simulator →
                  </Link>
                </div>
                {simulatorData.scheduleNotes && simulatorData.scheduleNotes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-kawaii-pink/20">
                    <ScheduleTimeline
                      projection={simulatorData.projection}
                      targetMin={simulatorData.targetMin}
                      targetMax={simulatorData.targetMax}
                      scheduleNotes={simulatorData.scheduleNotes}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No data yet. Apply a patch to see your estimated levels.
              </p>
            )}
          </Card>
        </div>

        {/* Quick Action */}
        <div className="flex justify-center">
          <Link href="/apply">
            <Button variant="primary" size="lg">
              Apply New Patch
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
