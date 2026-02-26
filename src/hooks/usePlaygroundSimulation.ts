"use client";

import { useMemo } from "react";
import type { PlaygroundPatch } from "@/lib/types";
import type { SeriesData, PatchRecord, ScheduleNote } from "@/lib/pk-model";
import {
  calculatePersonalizedE2,
  getScheduleNotes,
} from "@/lib/pk-model";

export interface PatchEvent {
  hour: number;
  type: "applied" | "removed";
  label: string;
  isOriginal: boolean;
}

export interface PlaygroundSimulationResult {
  series: SeriesData[];
  nowHour: number;
  startTime: string;
  currentLevel: number;
  patchEvents: PatchEvent[];
  scheduleNotes: ScheduleNote[];
}

const PROJECTION_HOURS = 168; // 7 days

export function usePlaygroundSimulation(
  patches: PlaygroundPatch[],
  targetMin: number,
  targetMax: number
): PlaygroundSimulationResult | null {
  return useMemo(() => {
    if (patches.length === 0) return null;

    const now = Date.now();
    const endDate = new Date(now + PROJECTION_HOURS * 60 * 60 * 1000);

    // Convert PlaygroundPatch[] to PatchRecord[] for the PK model
    const patchRecords: PatchRecord[] = patches.map((p) => ({
      applied_at: p.applied_at,
      removed_at: p.removed_at,
      dose_mg_per_day: p.dose_mg_per_day,
    }));

    // Calculate the full E2 curve from earliest patch to now + 7 days.
    // Note: calculatePersonalizedE2's startTime param is actually the END time.
    const series = calculatePersonalizedE2(patchRecords, 0, endDate);

    if (series.length === 0) return null;

    // Determine the earliest patch application time
    const earliestMs = patches.reduce((earliest, p) => {
      const t = new Date(p.applied_at).getTime();
      return t < earliest ? t : earliest;
    }, Infinity);

    const startTime = new Date(earliestMs).toISOString();

    // nowHour: how many hours from the earliest patch application to "now"
    const nowHour = (now - earliestMs) / (1000 * 60 * 60);

    // Find the current E2 level by looking up the series value at nowHour.
    // Use linear interpolation between the two nearest integer hour points.
    let currentLevel = 0;
    if (nowHour <= 0) {
      currentLevel = series[0]?.value ?? 0;
    } else if (nowHour >= series[series.length - 1].time) {
      currentLevel = series[series.length - 1].value;
    } else {
      const lowerIdx = Math.floor(nowHour);
      const upperIdx = Math.ceil(nowHour);
      if (lowerIdx === upperIdx || upperIdx >= series.length) {
        currentLevel = series[Math.min(lowerIdx, series.length - 1)]?.value ?? 0;
      } else {
        const fraction = nowHour - lowerIdx;
        const lowerVal = series[lowerIdx]?.value ?? 0;
        const upperVal = series[upperIdx]?.value ?? 0;
        currentLevel = Math.round((lowerVal * (1 - fraction) + upperVal * fraction) * 10) / 10;
      }
    }

    // Build patch events for chart markers
    const patchEvents: PatchEvent[] = [];
    for (const p of patches) {
      const appliedMs = new Date(p.applied_at).getTime();
      const appliedHour = (appliedMs - earliestMs) / (1000 * 60 * 60);

      patchEvents.push({
        hour: appliedHour,
        type: "applied",
        label: `${p.dose_mg_per_day}mg/day applied`,
        isOriginal: p.isOriginal,
      });

      if (p.removed_at) {
        const removedMs = new Date(p.removed_at).getTime();
        const removedHour = (removedMs - earliestMs) / (1000 * 60 * 60);

        patchEvents.push({
          hour: removedHour,
          type: "removed",
          label: `${p.dose_mg_per_day}mg/day removed`,
          isOriginal: p.isOriginal,
        });
      }
    }

    // Sort events chronologically
    patchEvents.sort((a, b) => a.hour - b.hour);

    // Get scheduleNotes with 168h projection
    const scheduleNotes = getScheduleNotes(
      patchRecords,
      targetMin,
      targetMax,
      PROJECTION_HOURS
    );

    return {
      series,
      nowHour,
      startTime,
      currentLevel,
      patchEvents,
      scheduleNotes,
    };
  }, [patches, targetMin, targetMax]);
}
