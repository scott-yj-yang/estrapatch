import Dexie, { type Table } from "dexie";
import { BodySide, Patch, PatchInput } from "./types";

// -- Database Schema --

interface PatchRecord {
  id?: number;
  applied_at: string;
  removed_at: string | null;
  scheduled_removal: string;
  body_x: number;
  body_y: number;
  body_side: BodySide;
  dose_mg_per_day: number;
  wear_hours: number | null;
  notified_removal: boolean;
  notes: string | null;
}

interface SettingRecord {
  key: string;
  value: string;
}

class EstraPatchDB extends Dexie {
  patches!: Table<PatchRecord, number>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super("estrapatch");
    this.version(1).stores({
      patches: "++id, applied_at, removed_at",
      settings: "key",
    });
  }
}

export const db = new EstraPatchDB();

// -- Default Settings --

const DEFAULT_SETTINGS: Record<string, string> = {
  default_wear_hours: "84",
  reminder_hours_before: "2",
  target_e2_min: "100",
  target_e2_max: "200",
  patches_per_change: "2",
  default_dose_mg_per_day: "0.1",
};

export async function ensureDefaults(): Promise<void> {
  const count = await db.settings.count();
  if (count === 0) {
    await db.settings.bulkPut(
      Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value }))
    );
  } else {
    // Seed any missing keys for existing users (e.g. newly added settings)
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await db.settings.get(key);
      if (existing === undefined) {
        await db.settings.put({ key, value });
      }
    }
  }
}

// -- Patch CRUD --

export async function getAllPatches(): Promise<Patch[]> {
  const rows = await db.patches.orderBy("applied_at").reverse().toArray();
  return rows as Patch[];
}

export async function getActivePatches(): Promise<Patch[]> {
  const rows = await db.patches
    .filter((p) => p.removed_at === null)
    .toArray();
  return rows as Patch[];
}

export async function getPatchById(id: number): Promise<Patch | null> {
  const row = await db.patches.get(id);
  return (row as Patch) ?? null;
}

export async function createPatch(input: PatchInput): Promise<Patch> {
  const appliedAt = input.applied_at || new Date().toISOString();
  const defaultWearHours = Number(
    (await getSetting("default_wear_hours")) ?? "84"
  );
  const wearHours = input.wear_hours ?? defaultWearHours;
  const doseMgPerDay = input.dose_mg_per_day ?? 0.1;

  const scheduledRemoval = new Date(
    new Date(appliedAt).getTime() + wearHours * 60 * 60 * 1000
  ).toISOString();

  const record: PatchRecord = {
    applied_at: appliedAt,
    removed_at: null,
    scheduled_removal: scheduledRemoval,
    body_x: input.body_x,
    body_y: input.body_y,
    body_side: input.body_side,
    dose_mg_per_day: doseMgPerDay,
    wear_hours: input.wear_hours ?? null,
    notified_removal: false,
    notes: input.notes ?? null,
  };

  const id = await db.patches.add(record);
  return (await db.patches.get(id)) as Patch;
}

export async function removePatch(id: number): Promise<Patch | null> {
  const existing = await db.patches.get(id);
  if (!existing || existing.removed_at !== null) return null;

  const removedAt = new Date().toISOString();
  await db.patches.update(id, { removed_at: removedAt });
  return (await db.patches.get(id)) as Patch;
}

export async function updatePatch(
  id: number,
  updates: Partial<{
    applied_at: string;
    scheduled_removal: string;
    body_x: number;
    body_y: number;
    body_side: BodySide;
    dose_mg_per_day: number;
    wear_hours: number | null;
    notified_removal: boolean;
    notes: string | null;
    removed_at: string | null;
  }>
): Promise<Patch | null> {
  const existing = await db.patches.get(id);
  if (!existing) return null;

  await db.patches.update(id, updates);
  return (await db.patches.get(id)) as Patch;
}

export async function deletePatch(id: number): Promise<boolean> {
  const existing = await db.patches.get(id);
  if (!existing) return false;
  await db.patches.delete(id);
  return true;
}

// -- Settings --

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.settings.get(key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.settings.toArray();
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

// -- Export/Import --

export async function exportAllData(): Promise<{
  version: number;
  exported_at: string;
  patches: Patch[];
  settings: Record<string, string>;
}> {
  const patches = await getAllPatches();
  const settings = await getAllSettings();
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    patches,
    settings,
  };
}

export async function importData(data: {
  version: number;
  patches: PatchRecord[];
  settings: Record<string, string>;
}, mode: "replace" | "merge"): Promise<void> {
  if (mode === "replace") {
    await db.patches.clear();
    await db.settings.clear();
  }

  // Import patches (strip ids so Dexie auto-increments)
  for (const patch of data.patches) {
    const { id: _id, ...rest } = patch;
    await db.patches.add(rest as PatchRecord);
  }

  // Import settings
  for (const [key, value] of Object.entries(data.settings)) {
    await db.settings.put({ key, value });
  }
}

export async function clearAllData(): Promise<void> {
  await db.patches.clear();
  await db.settings.clear();
}
