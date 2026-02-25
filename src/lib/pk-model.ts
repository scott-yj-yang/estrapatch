export interface SeriesData {
  time: number;
  value: number;
}

export interface SimulationParams {
  patches: number; // Number of patches applied per application event
  spread: number; // Hours between application events (rolling schedule)
  worn: number; // How long each patch is worn (hours)
  period: number; // Total simulation window in hours (e.g. 672 for 28 days)
  doseMgPerDay?: number; // Dose per patch in mg/day (default: 0.1)
}

export interface PatchWindow {
  index: number;
  appliedAt: number; // hour offset from simulation start
  removedAt: number; // hour offset from simulation start
}

/**
 * Generates the list of individual patch windows for the simulation.
 * Patches are applied in a rolling schedule: every `spread` hours,
 * `patches` count of new patches go on simultaneously. Each is worn for `worn` hours.
 */
export function generatePatchWindows(params: SimulationParams): PatchWindow[] {
  const { patches, spread, worn, period } = params;
  const windows: PatchWindow[] = [];
  let idx = 0;

  for (let t = 0; t < period; t += spread) {
    for (let p = 0; p < patches; p++) {
      windows.push({
        index: idx++,
        appliedAt: t,
        removedAt: t + worn,
      });
    }
  }

  return windows;
}

export interface PatchRecord {
  applied_at: string;
  removed_at: string | null;
  dose_mg_per_day: number;
}

/**
 * Pharmacokinetic model for a single 0.1mg/day transdermal E2 patch.
 *
 * Based on published clinical PK data from FDA DailyMed for Mylan/Climara
 * 0.1mg/day transdermal estradiol patches applied to the abdomen:
 *
 * - Mylan label: Cmax = 117 ± 39.3 pg/mL, Tmax = 24h (median)
 *   Source: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=f4efb0bf-b96f-4e20-a0f2-0806ab92b2d4
 *
 * - Climara label: Cmax = 147 pg/mL, Cavg = 87 pg/mL, Cmin = 60 pg/mL
 *   Source: https://fda.report/DailyMed/e7e6da3b-8485-1382-61c9-e9b369018b98
 *
 * - Elimination half-life after removal: 6.2-7.9 hours (Mylan label)
 * - Serum returns to baseline within 24 hours after removal
 *
 * Empirical hourly concentration data (0-168h) is a weighted average of both
 * FDA sources for abdominal application, from the e2-patch-simulator project.
 * Post-removal uses exponential decay with clinically-reported half-life.
 */

// Empirical serum E2 concentration (pg/mL) for a single 0.1mg/day patch
// over 168 hours of wear. Derived from FDA DailyMed clinical PK studies.
// Source: https://github.com/hypothete/e2-patch-simulator
const E2_CONCENTRATION_TABLE: number[] = [
  0, 8.5, 17, 25.5, 34, 47.7, 59.6, 71.4, 83.3, 88.6, 93.8, 99, 102.7,
  103.2, 103.8, 104.3, 104.8, 105.3, 105.9, 106.4, 106.9, 107.4, 108, 108.5,
  108.1, 108.1, 108.1, 108.1, 108.1, 108.1, 109.2, 110.3, 111.4, 112.5,
  113.6, 114.7, 114.4, 111.9, 109.4, 106.9, 104.4, 101.9, 99.4, 96.9, 94.4,
  91.9, 89.4, 86.9, 84.9, 84.4, 84, 83.6, 83.2, 82.8, 82.4, 81.9, 81.5,
  81.1, 80.7, 80.3, 79.9, 78.3, 76.8, 75.3, 73.7, 72.2, 70.7, 69.2, 67.6,
  66.1, 64.6, 63.1, 61.5, 61.4, 61.3, 61.1, 61, 60.8, 60.7, 60.6, 60.4,
  60.3, 60.1, 60, 59.9, 59.4, 59, 58.6, 58.2, 57.8, 57.4, 56.9, 56.5, 56.1,
  55.7, 55.3, 54.9, 54.4, 54, 53.6, 53.2, 52.8, 52.4, 51.9, 51.5, 51.1,
  50.7, 50.3, 49.9, 49.4, 49, 48.6, 48.2, 47.8, 47.4, 46.9, 46.5, 46.1,
  45.7, 45.3, 44.9, 44.4, 44, 43.6, 43.2, 42.8, 42.4, 41.9, 41.5, 41.1,
  40.7, 40.3, 39.9, 39.4, 39, 38.6, 38.2, 37.8, 37.4, 36.9, 36.5, 36.1,
  35.7, 35.3, 34.9, 34.4, 34, 33.6, 33.2, 32.8, 32.4, 31.9, 31.5, 31.1,
  30.7, 30.3, 29.9, 29.4, 29, 28.6, 28.2, 27.8, 27.4, 26.9, 26.5, 26.1,
  25.7, 25.3, 24.9,
];

// Post-removal elimination half-life (hours)
// From Mylan FDA label: "ranged from 6.2 to 7.9 hours"
const T_ELIMINATION_HALF_LIFE = 7;

// For patches worn beyond 168h, extrapolate using exponential decay from
// the reservoir depletion trend observed in the last portion of the table
const EXTENDED_WEAR_HALF_LIFE = 180; // slow reservoir depletion while wearing

/**
 * Interpolates concentration from the empirical table.
 * Uses linear interpolation between hourly data points.
 */
function getTableConcentration(hour: number): number {
  if (hour <= 0) return 0;
  const maxIdx = E2_CONCENTRATION_TABLE.length - 1;
  if (hour >= maxIdx) {
    // Beyond 168h: extrapolate using slow exponential decay from last value
    const extraHours = hour - maxIdx;
    return (
      E2_CONCENTRATION_TABLE[maxIdx] *
      Math.pow(0.5, extraHours / EXTENDED_WEAR_HALF_LIFE)
    );
  }
  // Linear interpolation between integer hours
  const lower = Math.floor(hour);
  const upper = Math.ceil(hour);
  if (lower === upper) return E2_CONCENTRATION_TABLE[lower];
  const fraction = hour - lower;
  return (
    E2_CONCENTRATION_TABLE[lower] * (1 - fraction) +
    E2_CONCENTRATION_TABLE[upper] * fraction
  );
}

/**
 * Returns E2 concentration (pg/mL) from a single 0.1mg/day patch at a given time.
 *
 * While wearing: uses empirical concentration data from FDA clinical studies.
 * After removal: exponential decay from concentration at removal time,
 * using the clinically-reported elimination half-life of ~7 hours.
 */
function getConcentrationAtTime(
  timeSinceApplication: number,
  wornHours: number
): number {
  if (timeSinceApplication < 0) return 0;

  if (timeSinceApplication <= wornHours) {
    return getTableConcentration(timeSinceApplication);
  }

  // Patch has been removed - exponential decay from skin depot
  const hoursSinceRemoval = timeSinceApplication - wornHours;
  const concentrationAtRemoval = getTableConcentration(wornHours);

  // Exponential decay: C(t) = C0 * (1/2)^(t / t_half)
  return concentrationAtRemoval * Math.pow(0.5, hoursSinceRemoval / T_ELIMINATION_HALF_LIFE);
}

/**
 * Calculates E2 concentration over time for a regular schedule simulation.
 * Used for "what-if" mode. Implements the rolling-schedule algorithm matching
 * the reference simulator (hypothete/e2-patch-simulator): every `spread` hours,
 * `patches` new patches go on simultaneously; each is worn for `worn` hours.
 */
export function calculateE2Concentration(
  params: SimulationParams
): SeriesData[] {
  const { period, doseMgPerDay } = params;
  const doseFactor = (doseMgPerDay ?? 0.1) / 0.1;
  const windows = generatePatchWindows(params);
  const results: SeriesData[] = [];

  for (let hour = 0; hour <= period; hour++) {
    let totalConcentration = 0;

    for (const win of windows) {
      const timeSinceApplication = hour - win.appliedAt;
      if (timeSinceApplication < 0) continue;

      const wornHours = win.removedAt - win.appliedAt;
      totalConcentration +=
        getConcentrationAtTime(timeSinceApplication, wornHours) * doseFactor;
    }

    results.push({
      time: hour,
      value: Math.round(totalConcentration * 10) / 10,
    });
  }

  return results;
}

/**
 * Calculates personalized E2 concentration over time from actual patch records.
 * Each patch's contribution is computed based on its actual application/removal
 * times and dose (relative to 0.1mg/day baseline). Uses superposition of
 * individual patch curves.
 */
export function calculatePersonalizedE2(
  patchRecords: PatchRecord[],
  _periodHours: number,
  startTime?: Date
): SeriesData[] {
  if (patchRecords.length === 0) return [];

  const now = startTime || new Date();

  // Find the earliest patch application
  const earliestApplication = patchRecords.reduce((earliest, record) => {
    const t = new Date(record.applied_at).getTime();
    return t < earliest ? t : earliest;
  }, Infinity);

  const startMs = earliestApplication;
  const endMs = now.getTime();

  if (startMs >= endMs) return [];

  const totalHours = Math.ceil((endMs - startMs) / (1000 * 60 * 60));
  const results: SeriesData[] = [];

  for (let hour = 0; hour <= totalHours; hour++) {
    const currentTimeMs = startMs + hour * 60 * 60 * 1000;
    let totalConcentration = 0;

    for (const record of patchRecords) {
      const appliedMs = new Date(record.applied_at).getTime();
      const removedMs = record.removed_at
        ? new Date(record.removed_at).getTime()
        : null;

      const timeSinceApplicationHours =
        (currentTimeMs - appliedMs) / (1000 * 60 * 60);

      if (timeSinceApplicationHours < 0) continue;

      // Dose factor relative to 0.1mg/day baseline
      const doseFactor = record.dose_mg_per_day / 0.1;

      // Determine effective wear duration
      let effectiveWornHours: number;
      if (removedMs !== null) {
        effectiveWornHours = (removedMs - appliedMs) / (1000 * 60 * 60);
      } else {
        // Still wearing - set worn time beyond current time so patch
        // is treated as still active at this simulation point
        effectiveWornHours = timeSinceApplicationHours + 1;
      }

      const contribution =
        getConcentrationAtTime(timeSinceApplicationHours, effectiveWornHours) *
        doseFactor;

      totalConcentration += contribution;
    }

    results.push({
      time: hour,
      value: Math.round(totalConcentration * 10) / 10,
    });
  }

  return results;
}

/**
 * Returns the current estimated E2 concentration based on actual patch records.
 * Calculates the summed contribution of all patches at the current moment.
 */
export function getCurrentE2Estimate(patchRecords: PatchRecord[]): number {
  if (patchRecords.length === 0) return 0;

  const now = new Date();
  const currentTimeMs = now.getTime();
  let totalConcentration = 0;

  for (const record of patchRecords) {
    const appliedMs = new Date(record.applied_at).getTime();
    const removedMs = record.removed_at
      ? new Date(record.removed_at).getTime()
      : null;

    const timeSinceApplicationHours =
      (currentTimeMs - appliedMs) / (1000 * 60 * 60);

    if (timeSinceApplicationHours < 0) continue;

    // Skip patches whose contribution is negligible (removed > 5 half-lives ago)
    if (removedMs !== null) {
      const hoursSinceRemoval =
        (currentTimeMs - removedMs) / (1000 * 60 * 60);
      if (hoursSinceRemoval > T_ELIMINATION_HALF_LIFE * 5) continue;
    }

    const doseFactor = record.dose_mg_per_day / 0.1;

    let effectiveWornHours: number;
    if (removedMs !== null) {
      effectiveWornHours = (removedMs - appliedMs) / (1000 * 60 * 60);
    } else {
      effectiveWornHours = timeSinceApplicationHours + 1;
    }

    const contribution =
      getConcentrationAtTime(timeSinceApplicationHours, effectiveWornHours) *
      doseFactor;

    totalConcentration += contribution;
  }

  return Math.round(totalConcentration * 10) / 10;
}

/**
 * Projects E2 concentration forward from the current moment.
 * Assumes active patches remain in place, no new patches applied.
 * Returns hourly data points for the projection period.
 */
export function projectE2Forward(
  patchRecords: PatchRecord[],
  projectionHours: number = 48
): SeriesData[] {
  if (patchRecords.length === 0) return [];

  const now = new Date();
  const results: SeriesData[] = [];

  for (let hour = 0; hour <= projectionHours; hour++) {
    const futureMs = now.getTime() + hour * 60 * 60 * 1000;
    let totalConcentration = 0;

    for (const record of patchRecords) {
      const appliedMs = new Date(record.applied_at).getTime();
      const removedMs = record.removed_at
        ? new Date(record.removed_at).getTime()
        : null;

      const timeSinceApplicationHours =
        (futureMs - appliedMs) / (1000 * 60 * 60);

      if (timeSinceApplicationHours < 0) continue;

      // Skip patches whose contribution is negligible
      if (removedMs !== null) {
        const hoursSinceRemoval = (futureMs - removedMs) / (1000 * 60 * 60);
        if (hoursSinceRemoval > T_ELIMINATION_HALF_LIFE * 5) continue;
      }

      const doseFactor = record.dose_mg_per_day / 0.1;

      let effectiveWornHours: number;
      if (removedMs !== null) {
        effectiveWornHours = (removedMs - appliedMs) / (1000 * 60 * 60);
      } else {
        // Still wearing — project as if patch stays on
        effectiveWornHours = timeSinceApplicationHours + 1;
      }

      const contribution =
        getConcentrationAtTime(timeSinceApplicationHours, effectiveWornHours) *
        doseFactor;

      totalConcentration += contribution;
    }

    results.push({
      time: hour,
      value: Math.round(totalConcentration * 10) / 10,
    });
  }

  return results;
}

export interface Recommendation {
  type: "apply" | "remove";
  urgency: "now" | "soon" | "upcoming";
  message: string;
  hoursUntil: number;
}

/**
 * Generates recommendations based on projected E2 levels vs. target range.
 * Analyzes the forward projection and suggests when to apply/remove patches.
 */
export function getRecommendations(
  patchRecords: PatchRecord[],
  targetMin: number,
  targetMax: number,
  projectionHours: number = 72
): Recommendation[] {
  const projection = projectE2Forward(patchRecords, projectionHours);
  if (projection.length === 0) return [];

  const recommendations: Recommendation[] = [];
  const currentLevel = projection[0]?.value ?? 0;

  // Detect whether E2 is currently rising (compare now vs. 4h from now)
  const levelIn4h = projection.find(p => p.time >= 4)?.value ?? currentLevel;
  // Minimum net rise over 4h to confirm a patch is actively ramping up.
  // Far below the typical 4h ramp rate (~8-34 pg/mL) but above rounding noise.
  const RISING_THRESHOLD_PG_ML = 2;
  const isRising = levelIn4h > currentLevel + RISING_THRESHOLD_PG_ML; // rising by more than 2 pg/mL in 4h

  // Check if currently out of range
  if (currentLevel < targetMin) {
    // Find when (if ever) E2 will reach targetMin within the projection window
    let enterRangeHour: number | null = null;
    for (const point of projection) {
      if (point.value >= targetMin) {
        enterRangeHour = point.time;
        break;
      }
    }

    if (isRising && enterRangeHour !== null) {
      // Currently rising toward target — don't recommend applying
      recommendations.push({
        type: "apply",
        urgency: enterRangeHour <= 6 ? "soon" : "upcoming",
        message: `E2 is rising (${currentLevel.toFixed(0)} pg/mL) — no action needed. Expected to reach target in ~${Math.round(enterRangeHour)}h.`,
        hoursUntil: enterRangeHour,
      });
    } else if (isRising) {
      // Rising but won't hit target in projection window
      recommendations.push({
        type: "apply",
        urgency: "upcoming",
        message: `E2 is rising (${currentLevel.toFixed(0)} pg/mL) but may not reach target range. Consider an additional patch.`,
        hoursUntil: 0,
      });
    } else {
      // Not rising — genuinely needs a new patch
      recommendations.push({
        type: "apply",
        urgency: "now",
        message: `E2 is below target (${currentLevel.toFixed(0)} pg/mL). Apply a new patch now.`,
        hoursUntil: 0,
      });
    }
  } else if (currentLevel > targetMax) {
    recommendations.push({
      type: "remove",
      urgency: "now",
      message: `E2 is above target (${currentLevel.toFixed(0)} pg/mL). Consider removing a patch.`,
      hoursUntil: 0,
    });
  }

  // Find when level will drop below min
  let dropBelowHour: number | null = null;
  for (let i = 1; i < projection.length; i++) {
    if (projection[i].value < targetMin && projection[i - 1].value >= targetMin) {
      dropBelowHour = projection[i].time;
      break;
    }
  }

  if (dropBelowHour !== null && currentLevel >= targetMin) {
    const urgency = dropBelowHour <= 6 ? "soon" : "upcoming";
    recommendations.push({
      type: "apply",
      urgency,
      message: `Apply a new patch in ~${Math.round(dropBelowHour)}h to stay in range.`,
      hoursUntil: dropBelowHour,
    });
  }

  // Find when level will exceed max
  let exceedMaxHour: number | null = null;
  for (let i = 1; i < projection.length; i++) {
    if (projection[i].value > targetMax && projection[i - 1].value <= targetMax) {
      exceedMaxHour = projection[i].time;
      break;
    }
  }

  if (exceedMaxHour !== null && currentLevel <= targetMax) {
    const urgency = exceedMaxHour <= 6 ? "soon" : "upcoming";
    recommendations.push({
      type: "remove",
      urgency,
      message: `Consider removing a patch in ~${Math.round(exceedMaxHour)}h to stay in range.`,
      hoursUntil: exceedMaxHour,
    });
  }

  return recommendations;
}
