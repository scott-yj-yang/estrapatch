"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import Button from "@/components/Button";
import BodyMap, { PatchMarker } from "@/components/BodyMap";
import { BodySide, Patch } from "@/lib/types";
import { getAllPatches, createPatch } from "@/lib/db";

export default function ApplyPatchPage() {
  const router = useRouter();
  const [recentMarkers, setRecentMarkers] = useState<PatchMarker[]>([]);
  const [placement, setPlacement] = useState<{
    x: number;
    y: number;
    side: BodySide;
  } | null>(null);
  const [wearDays, setWearDays] = useState(3.5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const patches: Patch[] = await getAllPatches();

        // Filter patches from the last 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recent = patches.filter(
          (p) => new Date(p.applied_at).getTime() > thirtyDaysAgo
        );

        const markers: PatchMarker[] = recent.map((p) => ({
          x: p.body_x,
          y: p.body_y,
          side: p.body_side,
          active: p.removed_at === null,
          label: p.removed_at ? "prev" : "active",
        }));

        setRecentMarkers(markers);
      } catch (error) {
        console.error("Failed to fetch recent patches:", error);
      }
    }

    fetchRecent();
  }, []);

  const handlePlacePatch = (x: number, y: number, side: BodySide) => {
    setPlacement({ x, y, side });
  };

  const handleSave = async () => {
    if (!placement) return;

    setSaving(true);
    try {
      await createPatch({
        body_x: placement.x,
        body_y: placement.y,
        body_side: placement.side,
        wear_hours: wearDays * 24,
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to save patch:", error);
    } finally {
      setSaving(false);
    }
  };

  // Combine recent markers with the new placement marker
  const allMarkers: PatchMarker[] = [
    ...recentMarkers,
    ...(placement
      ? [
          {
            x: placement.x,
            y: placement.y,
            side: placement.side,
            active: true,
            label: "NEW",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-kawaii-cream">
      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-kawaii-pink-dark text-center">
          Apply New Patch
        </h1>

        <Card title="Choose Placement">
          <p className="text-sm text-gray-500 mb-3">
            Tap on the body map to place your patch. Faded markers show recent
            placements from the last 30 days.
          </p>
          <BodyMap
            onPlacePatch={handlePlacePatch}
            existingMarkers={allMarkers}
            interactive={true}
          />
        </Card>

        {placement && (
          <Card>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Placement:{" "}
                <span className="font-semibold text-kawaii-pink-dark capitalize">
                  {placement.side}
                </span>{" "}
                side at ({(placement.x * 100).toFixed(0)}%,{" "}
                {(placement.y * 100).toFixed(0)}%)
              </p>

              {/* Wear time setting */}
              <div className="bg-kawaii-rose/30 rounded-kawaii p-3">
                <label className="block text-sm font-semibold text-kawaii-pink-dark mb-2">
                  Desired wear time
                </label>
                <div className="flex items-center gap-3">
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
                <p className="text-xs text-gray-400 mt-1">
                  Removal reminder will be sent based on this time.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Save Patch Application"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
