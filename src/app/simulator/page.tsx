"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/Card";
import E2Chart, { PatchEvent } from "@/components/E2Chart";
import SimulatorSlider from "@/components/SimulatorSlider";
import RecommendationTimeline from "@/components/RecommendationTimeline";
import PlaygroundSimulator from "@/components/PlaygroundSimulator";
import Button from "@/components/Button";
import DoseSelector from "@/components/DoseSelector";
import FDAReference from "@/components/FDAReference";
import { PlaygroundPatch } from "@/lib/types";
import {
  getAllPatches,
  getSetting,
  setSetting,
  ensureDefaults,
} from "@/lib/db";
import {
  calculatePersonalizedE2,
  calculateE2Concentration,
  getCurrentE2Estimate,
  projectE2Forward,
  getRecommendations,
  generatePatchWindows,
  PatchWindow,
} from "@/lib/pk-model";
import PatchTimeline from "@/components/PatchTimeline";

type Tab = "personal" | "whatif" | "playground";

interface SeriesPoint {
  time: number;
  value: number;
}

export default function SimulatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("personal");

  // Personal tab state
  const [personalData, setPersonalData] = useState<SeriesPoint[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [personalStartTime, setPersonalStartTime] = useState<string | null>(null);
  const [personalPatchEvents, setPersonalPatchEvents] = useState<PatchEvent[]>([]);
  const [projection, setProjection] = useState<SeriesPoint[]>([]);
  const [targetMin, setTargetMin] = useState<number>(100);
  const [targetMax, setTargetMax] = useState<number>(200);
  const [recommendations, setRecommendations] = useState<{ type: "apply" | "remove"; urgency: "now" | "soon" | "upcoming"; message: string; hoursUntil: number }[]>([]);
  const [personalLoading, setPersonalLoading] = useState(false);

  // Playground tab state
  const [playgroundPatches, setPlaygroundPatches] = useState<PlaygroundPatch[]>([]);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  // What-if tab state
  const [patches, setPatches] = useState(2);
  const [spread, setSpread] = useState(84);
  const [worn, setWorn] = useState(84);
  const [whatIfDose, setWhatIfDose] = useState(0.1);
  const [whatIfData, setWhatIfData] = useState<SeriesPoint[]>([]);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [showPatches, setShowPatches] = useState(false);
  const [patchWindows, setPatchWindows] = useState<PatchWindow[]>([]);
  const [whatIfPeriod] = useState(672); // 28 days, matching reference simulator

  const fetchPersonal = useCallback(async () => {
    setPersonalLoading(true);
    try {
      await ensureDefaults();
      const allPatches = await getAllPatches();
      const patchRecords = allPatches.map((p) => ({
        applied_at: p.applied_at,
        removed_at: p.removed_at,
        dose_mg_per_day: p.dose_mg_per_day,
      }));

      const series = calculatePersonalizedE2(patchRecords, 672);
      const level = getCurrentE2Estimate(patchRecords);
      const proj = projectE2Forward(patchRecords, 48);
      const tMin = Number((await getSetting("target_e2_min")) ?? "100");
      const tMax = Number((await getSetting("target_e2_max")) ?? "200");
      const recs = getRecommendations(patchRecords, tMin, tMax, 72);

      // Compute startTime and patchEvents
      let startTimeVal: string | null = null;
      const events: PatchEvent[] = [];

      if (allPatches.length > 0) {
        const earliestMs = allPatches.reduce((earliest, p) => {
          const t = new Date(p.applied_at).getTime();
          return t < earliest ? t : earliest;
        }, Infinity);
        startTimeVal = new Date(earliestMs).toISOString();

        for (const p of allPatches) {
          const appliedMs = new Date(p.applied_at).getTime();
          const appliedHour = (appliedMs - earliestMs) / (1000 * 60 * 60);
          if (appliedHour >= 0 && appliedHour <= (series.at(-1)?.time ?? 0)) {
            events.push({
              hour: Math.round(appliedHour * 10) / 10,
              type: "applied",
              label: `Applied (${p.body_side})`,
            });
          }
          if (p.removed_at) {
            const removedMs = new Date(p.removed_at).getTime();
            const removedHour = (removedMs - earliestMs) / (1000 * 60 * 60);
            if (removedHour >= 0 && removedHour <= (series.at(-1)?.time ?? 0)) {
              events.push({
                hour: Math.round(removedHour * 10) / 10,
                type: "removed",
                label: `Removed (${p.body_side})`,
              });
            }
          }
        }
      }

      setPersonalData(series);
      setCurrentLevel(level);
      setPersonalStartTime(startTimeVal);
      setPersonalPatchEvents(events);
      setProjection(proj);
      setTargetMin(tMin);
      setTargetMax(tMax);
      setRecommendations(recs);
    } catch (error) {
      console.error("Failed to compute personal data:", error);
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  const fetchWhatIf = useCallback(async () => {
    setWhatIfLoading(true);
    try {
      const params = { patches, spread, worn, period: whatIfPeriod, doseMgPerDay: whatIfDose };
      const newWindows = generatePatchWindows(params);
      setPatchWindows(newWindows);
      const series = calculateE2Concentration(params);
      setWhatIfData(series);
    } catch (error) {
      console.error("Failed to compute what-if data:", error);
    } finally {
      setWhatIfLoading(false);
    }
  }, [patches, spread, worn, whatIfDose, whatIfPeriod]);

  const fetchPlaygroundData = useCallback(async () => {
    setPlaygroundLoading(true);
    try {
      const allPatches = await getAllPatches();
      const pgPatches: PlaygroundPatch[] = allPatches.map((p) => ({
        id: String(p.id),
        applied_at: p.applied_at,
        removed_at: p.removed_at,
        dose_mg_per_day: p.dose_mg_per_day,
        isOriginal: true,
      }));
      setPlaygroundPatches(pgPatches);
    } catch (error) {
      console.error("Failed to fetch patches for playground:", error);
    } finally {
      setPlaygroundLoading(false);
    }
  }, []);

  // Fetch personal data when tab becomes active
  useEffect(() => {
    if (activeTab === "personal") {
      fetchPersonal();
    }
  }, [activeTab, fetchPersonal]);

  // Fetch what-if data when tab is active and params change
  useEffect(() => {
    if (activeTab === "whatif") {
      fetchWhatIf();
    }
  }, [activeTab, fetchWhatIf]);

  // Fetch playground data when tab becomes active
  useEffect(() => {
    if (activeTab === "playground") {
      fetchPlaygroundData();
    }
  }, [activeTab, fetchPlaygroundData]);

  // Compute nowHour for personal chart (last data point = "now")
  const nowHour =
    personalData.length > 0
      ? personalData[personalData.length - 1].time
      : undefined;

  return (
    <div className="min-h-screen bg-kawaii-cream">
      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-kawaii-pink-dark text-center">
          E2 Simulator
        </h1>

        {/* Tab toggle */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-5 py-2 rounded-kawaii font-semibold text-sm transition-all ${
              activeTab === "personal"
                ? "bg-kawaii-pink-dark text-white shadow-kawaii"
                : "bg-kawaii-rose text-kawaii-pink-dark hover:bg-kawaii-rose/70"
            }`}
          >
            My Levels
          </button>
          <button
            onClick={() => setActiveTab("whatif")}
            className={`px-5 py-2 rounded-kawaii font-semibold text-sm transition-all ${
              activeTab === "whatif"
                ? "bg-kawaii-pink-dark text-white shadow-kawaii"
                : "bg-kawaii-rose text-kawaii-pink-dark hover:bg-kawaii-rose/70"
            }`}
          >
            What-If
          </button>
          <button
            onClick={() => setActiveTab("playground")}
            className={`px-5 py-2 rounded-kawaii font-semibold text-sm transition-all ${
              activeTab === "playground"
                ? "bg-kawaii-pink-dark text-white shadow-kawaii"
                : "bg-kawaii-rose text-kawaii-pink-dark hover:bg-kawaii-rose/70"
            }`}
          >
            Playground
          </button>
        </div>

        {/* Personal Tab */}
        {activeTab === "personal" && (
          <>
            <Card>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">
                  Current Estimated E2 Level
                </p>
                <p className="text-4xl font-bold text-kawaii-pink-dark">
                  {currentLevel.toFixed(1)}
                  <span className="text-base font-normal text-gray-400 ml-1">
                    pg/mL
                  </span>
                </p>
              </div>

              {personalLoading ? (
                <div className="h-64 flex items-center justify-center text-kawaii-pink-dark animate-pulse">
                  Loading...
                </div>
              ) : (
                <E2Chart
                  data={personalData}
                  period={672}
                  nowHour={nowHour}
                  startTime={personalStartTime ?? undefined}
                  patchEvents={personalPatchEvents}
                  projection={projection}
                  targetMin={targetMin}
                  targetMax={targetMax}
                />
              )}
              {recommendations.length > 0 && (
                <div className="mt-4">
                  <RecommendationTimeline
                    projection={projection}
                    targetMin={targetMin}
                    targetMax={targetMax}
                    recommendations={recommendations}
                  />
                </div>
              )}
            </Card>

            <Card title="Target E2 Range">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Minimum (pg/mL)
                  </label>
                  <input
                    type="number"
                    value={targetMin}
                    onChange={(e) => setTargetMin(Number(e.target.value))}
                    min={0}
                    max={500}
                    className="w-full px-3 py-2 rounded-kawaii border border-kawaii-pink/30 text-sm focus:outline-none focus:ring-2 focus:ring-kawaii-pink-dark/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Maximum (pg/mL)
                  </label>
                  <input
                    type="number"
                    value={targetMax}
                    onChange={(e) => setTargetMax(Number(e.target.value))}
                    min={0}
                    max={500}
                    className="w-full px-3 py-2 rounded-kawaii border border-kawaii-pink/30 text-sm focus:outline-none focus:ring-2 focus:ring-kawaii-pink-dark/30"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    await setSetting("target_e2_min", String(targetMin));
                    await setSetting("target_e2_max", String(targetMax));
                    fetchPersonal();
                  }}
                >
                  Save Target Range
                </Button>
                <p className="text-xs text-gray-400">
                  Common feminizing HRT targets: 100-200 pg/mL
                </p>
              </div>
            </Card>

            <Card>
              <p className="text-xs text-gray-400 text-center">
                This is an estimate based on a pharmacokinetic model and your
                recorded patch history. It is not a substitute for blood work or
                medical advice.
              </p>
            </Card>
          </>
        )}

        {/* What-If Tab */}
        {activeTab === "whatif" && (
          <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
            <Card title="Simulation Parameters">
              <div className="space-y-4">
                <SimulatorSlider
                  label="Patches per application"
                  value={patches}
                  min={1}
                  max={4}
                  step={1}
                  onChange={setPatches}
                />
                <SimulatorSlider
                  label="Hours between patches"
                  value={spread}
                  min={6}
                  max={168}
                  step={6}
                  onChange={setSpread}
                  formatValue={(v) => `${v}h (${(v / 24).toFixed(1)}d)`}
                />
                <SimulatorSlider
                  label="Hours worn per patch"
                  value={worn}
                  min={6}
                  max={168}
                  step={6}
                  onChange={setWorn}
                  formatValue={(v) => `${v}h (${(v / 24).toFixed(1)}d)`}
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Patch Dose
                  </label>
                  <DoseSelector value={whatIfDose} onChange={setWhatIfDose} />
                </div>
              </div>
            </Card>

            <Card title="Simulated E2 Levels">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowPatches((v) => !v)}
                  className="text-xs px-3 py-1 rounded-kawaii font-semibold bg-kawaii-rose text-kawaii-pink-dark hover:bg-kawaii-pink/30 transition-all"
                >
                  {showPatches ? "Show E2 Levels" : "Show Patches"}
                </button>
              </div>
              {whatIfLoading ? (
                <div className="h-64 flex items-center justify-center text-kawaii-pink-dark animate-pulse">
                  Loading...
                </div>
              ) : showPatches ? (
                <PatchTimeline windows={patchWindows} period={whatIfPeriod} />
              ) : (
                <E2Chart data={whatIfData} period={whatIfPeriod} />
              )}
              <div className="mt-4 pt-4 border-t border-kawaii-pink/20">
                <FDAReference />
              </div>
            </Card>
          </div>
        )}

        {/* Playground Tab */}
        {activeTab === "playground" && (
          <>
            {playgroundLoading ? (
              <Card>
                <div className="h-64 flex items-center justify-center text-kawaii-pink-dark animate-pulse">
                  Loading playground...
                </div>
              </Card>
            ) : (
              <PlaygroundSimulator
                initialPatches={playgroundPatches}
                targetMin={targetMin}
                targetMax={targetMax}
              />
            )}
          </>
        )}

        {/* Disclaimer */}
        <Card>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            This simulation is based on pharmacokinetic data from FDA clinical
            studies of post-menopausal cisgender women using Mylan/Vivelle-Dot
            transdermal patches. Actual E2 levels vary significantly by
            individual physiology, placement site, and other factors. This is
            not medical advice — consult your healthcare provider.
          </p>
        </Card>
      </div>
    </div>
  );
}
