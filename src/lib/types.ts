export type BodySide = "front" | "back" | "left" | "right";

export interface Patch {
  id: number;
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

export interface PatchInput {
  applied_at?: string;
  body_x: number;
  body_y: number;
  body_side: BodySide;
  dose_mg_per_day?: number;
  wear_hours?: number;
  notes?: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface PlaygroundPatch {
  id: string;
  applied_at: string;
  removed_at: string | null;
  dose_mg_per_day: number;
  isOriginal: boolean; // true = from DB, false = user-added in playground
}

export type PlaygroundMode = "view" | "add" | "remove";
