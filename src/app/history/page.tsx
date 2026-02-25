"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import BodyMap from "@/components/BodyMap";
import { Patch, BodySide } from "@/lib/types";
import {
  getAllPatches,
  updatePatch,
  deletePatch as dbDeletePatch,
} from "@/lib/db";

// ---------- EditForm sub-component ----------

interface EditFormProps {
  patch: Patch;
  onSave: (id: number, data: {
    applied_at: string;
    removed_at: string | null;
    scheduled_removal?: string;
    wear_hours?: number | null;
  }) => void;
  onCancel: () => void;
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function EditForm({ patch, onSave, onCancel }: EditFormProps) {
  const [appliedAt, setAppliedAt] = useState(toLocalDatetime(patch.applied_at));
  const [removedAt, setRemovedAt] = useState(
    patch.removed_at ? toLocalDatetime(patch.removed_at) : ""
  );

  // Compute current wear hours from applied_at and scheduled_removal
  const currentWearHours =
    patch.wear_hours ??
    (new Date(patch.scheduled_removal).getTime() -
      new Date(patch.applied_at).getTime()) /
      (1000 * 60 * 60);
  const [wearDays, setWearDays] = useState(
    Math.round((currentWearHours / 24) * 2) / 2 // round to nearest 0.5
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appliedIso = new Date(appliedAt).toISOString();
    const wearHours = wearDays * 24;
    const scheduledRemoval = new Date(
      new Date(appliedAt).getTime() + wearHours * 60 * 60 * 1000
    ).toISOString();

    onSave(patch.id, {
      applied_at: appliedIso,
      removed_at: removedAt ? new Date(removedAt).toISOString() : null,
      scheduled_removal: scheduledRemoval,
      wear_hours: wearHours,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3 p-3 bg-kawaii-cream rounded-kawaii">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Applied At
        </label>
        <input
          type="datetime-local"
          value={appliedAt}
          onChange={(e) => setAppliedAt(e.target.value)}
          className="w-full px-3 py-2 rounded-kawaii border border-kawaii-pink/30 text-sm focus:outline-none focus:ring-2 focus:ring-kawaii-pink-dark/30"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Removed At
        </label>
        <input
          type="datetime-local"
          value={removedAt}
          onChange={(e) => setRemovedAt(e.target.value)}
          className="w-full px-3 py-2 rounded-kawaii border border-kawaii-pink/30 text-sm focus:outline-none focus:ring-2 focus:ring-kawaii-pink-dark/30"
        />
        <p className="text-xs text-gray-400 mt-0.5">
          Leave empty if patch is still active.
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Planned wear time
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
        <p className="text-xs text-gray-400 mt-0.5">
          Changes the scheduled removal time and notification.
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm">
          Save
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------- Main History Page ----------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function computeWornHours(patch: Patch): string {
  const applied = new Date(patch.applied_at).getTime();
  const removed = patch.removed_at
    ? new Date(patch.removed_at).getTime()
    : Date.now();
  const hours = (removed - applied) / (1000 * 60 * 60);
  return hours.toFixed(1);
}

export default function HistoryPage() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);

  const fetchPatches = useCallback(async () => {
    try {
      const data: Patch[] = await getAllPatches();
      // Sort by applied_at descending (newest first)
      data.sort(
        (a, b) =>
          new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
      );
      setPatches(data);
    } catch (error) {
      console.error("Failed to fetch patches:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatches();
  }, [fetchPatches]);

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = async (
    id: number,
    data: {
      applied_at: string;
      removed_at: string | null;
      scheduled_removal?: string;
      wear_hours?: number | null;
    }
  ) => {
    try {
      await updatePatch(id, data);
      setEditingId(null);
      await fetchPatches();
    } catch (error) {
      console.error("Failed to update patch:", error);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this patch record? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await dbDeletePatch(id);
      await fetchPatches();
    } catch (error) {
      console.error("Failed to delete patch:", error);
    }
  };

  const handleEditLocation = async (id: number, x: number, y: number, side: BodySide) => {
    try {
      await updatePatch(id, { body_x: x, body_y: y, body_side: side });
      setEditingLocationId(null);
      await fetchPatches();
    } catch (error) {
      console.error("Failed to update patch location:", error);
    }
  };

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
          Patch History
        </h1>

        {patches.length === 0 ? (
          <Card>
            <p className="text-gray-400 text-center py-6">
              No patch history yet.
            </p>
          </Card>
        ) : (
          <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
          {patches.map((patch) => (
            <Card key={patch.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-kawaii-pink-dark capitalize">
                      {patch.body_side}
                    </span>
                    <span className="text-sm text-gray-500">
                      {patch.dose_mg_per_day} mg/day
                    </span>
                    {!patch.removed_at && (
                      <span className="text-xs bg-kawaii-mint px-2 py-0.5 rounded-full font-semibold text-sky-700">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    <p>Applied: {formatDate(patch.applied_at)}</p>
                    <p>
                      Removed:{" "}
                      {patch.removed_at
                        ? formatDate(patch.removed_at)
                        : "Still wearing"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Worn: {computeWornHours(patch)} hours
                      {" · "}Planned: {patch.wear_hours
                        ? `${(patch.wear_hours / 24).toFixed(1)}d`
                        : `${((new Date(patch.scheduled_removal).getTime() - new Date(patch.applied_at).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)}d`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(patch.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingLocationId(editingLocationId === patch.id ? null : patch.id)}
                  >
                    Location
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(patch.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {editingId === patch.id && (
                <EditForm
                  patch={patch}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              )}

              {editingLocationId === patch.id && (
                <div className="mt-3 pt-3 border-t border-kawaii-pink/20">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Click to set new patch location
                  </label>
                  <BodyMap
                    interactive={true}
                    onPlacePatch={(x, y, side) => {
                      handleEditLocation(patch.id, x, y, side);
                    }}
                    existingMarkers={[
                      { x: patch.body_x, y: patch.body_y, side: patch.body_side, active: !patch.removed_at, label: "Current" },
                    ]}
                  />
                </div>
              )}
            </Card>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
