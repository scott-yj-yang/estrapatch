# EstaPatch PWA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port the private e2-patch-tracker (SQLite + local server) into a public-facing PWA that runs entirely in the browser with IndexedDB storage, deployed to Vercel.

**Architecture:** All data storage and computation runs client-side. Dexie.js wraps IndexedDB for the data layer, replacing SQLite + API routes. Pages call Dexie functions directly instead of fetching from `/api/*`. Next.js builds as a static export (`output: "export"`) served by Vercel.

**Tech Stack:** Next.js 15 (static export), React 19, TypeScript 5, Tailwind CSS 4, Dexie.js 4 (IndexedDB), Recharts 2, @ducanh2912/next-pwa (service worker)

**Source repo:** `/Users/scottyang/Developer/e2-patch-tracker` (reference only, do not modify)
**Target repo:** `/Users/scottyang/Developer/estrapatch` (all work goes here)

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`

**Step 1: Initialize the Next.js project**

Run from `/Users/scottyang/Developer/estrapatch`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

Answer prompts: Use src/ directory = Yes, App Router = Yes, customize import alias = No (use default `@/*`).

If the directory already has files (like `docs/`), the tool may refuse. In that case, init in a temp directory and move files over, or use `--yes` flag.

**Step 2: Install additional dependencies**

```bash
npm install dexie recharts
npm install -D @ducanh2912/next-pwa
```

**Step 3: Configure next.config.ts for static export**

Replace `next.config.ts` with:

```typescript
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
```

**Step 4: Configure postcss.config.mjs**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

**Step 5: Verify build compiles**

```bash
npm run dev
```

Expected: Next.js dev server starts without errors on port 3000.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with static export config"
```

---

## Task 2: Theme, Styles, and Layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Copy from e2-patch-tracker: `public/body-front.png`, `public/body-back.png`, `public/body-side.png`

**Step 1: Copy body map images from source repo**

```bash
cp /Users/scottyang/Developer/e2-patch-tracker/public/body-front.png public/
cp /Users/scottyang/Developer/e2-patch-tracker/public/body-back.png public/
cp /Users/scottyang/Developer/e2-patch-tracker/public/body-side.png public/
```

**Step 2: Replace globals.css with kawaii theme**

Replace the contents of `src/app/globals.css` with the exact content from the source:

```css
@import "tailwindcss";

@theme {
  --color-kawaii-pink: #F5A9B8;
  --color-kawaii-pink-dark: #D4628B;
  --color-kawaii-lavender: #5BCEFA;
  --color-kawaii-mint: #A8E6F0;
  --color-kawaii-peach: #F5D6E0;
  --color-kawaii-cream: #F0F8FF;
  --color-kawaii-rose: #FDE8EF;

  --radius-kawaii: 1rem;

  --shadow-kawaii: 0 4px 14px 0 rgba(91, 206, 250, 0.3);

  --font-sans: "Nunito", ui-sans-serif, system-ui, sans-serif;
}

@keyframes bounce-in {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.animate-bounce-in {
  animation: bounce-in 0.3s ease-out;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #F0F8FF;
}
::-webkit-scrollbar-thumb {
  background: #5BCEFA;
  border-radius: 3px;
}

/* Range slider styling */
input[type="range"] {
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #FDE8EF;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #D4628B;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(212, 98, 139, 0.4);
}
```

**Step 3: Update layout.tsx**

Replace `src/app/layout.tsx` — note that the layout does NOT include `<NotificationSetup>` or `<ReminderPoller>` yet; those get added in later tasks once the data layer exists.

```tsx
import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "EstaPatch",
  description: "Track your estradiol patch applications with love",
};

export const viewport: Viewport = {
  themeColor: "#5BCEFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans antialiased`}>
        <main className="pb-20">{children}</main>
      </body>
    </html>
  );
}
```

**Step 4: Verify dev server loads with kawaii theme**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: page loads with Nunito font and kawaii-cream background visible in devtools.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add kawaii theme, body map assets, and layout"
```

---

## Task 3: Type Definitions

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Create types.ts**

Copy directly from source — this is a direct port, no changes needed:

```typescript
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
  isOriginal: boolean;
}

export type PlaygroundMode = "view" | "add" | "remove";
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add type definitions"
```

---

## Task 4: Dexie.js Data Layer

This is the core new code — replacing SQLite + API routes with IndexedDB via Dexie.js. The exported function signatures match the source `patches.ts` so pages can call them directly.

**Files:**
- Create: `src/lib/db.ts`

**Step 1: Create the Dexie database and all CRUD functions**

Create `src/lib/db.ts`:

```typescript
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
};

export async function ensureDefaults(): Promise<void> {
  const count = await db.settings.count();
  if (count === 0) {
    await db.settings.bulkPut(
      Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value }))
    );
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
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors related to `src/lib/db.ts`.

**Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add Dexie.js data layer replacing SQLite"
```

---

## Task 5: Pharmacokinetic Model

**Files:**
- Create: `src/lib/pk-model.ts`

**Step 1: Copy pk-model.ts from source**

This is a direct copy — the PK model is 424 lines of pure math with zero server dependencies. Copy it exactly:

```bash
cp /Users/scottyang/Developer/e2-patch-tracker/src/lib/pk-model.ts src/lib/pk-model.ts
```

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors. The model only imports from standard JS (no server deps).

**Step 3: Commit**

```bash
git add src/lib/pk-model.ts
git commit -m "feat: port pharmacokinetic model (pure math, no changes)"
```

---

## Task 6: Notifications Module

**Files:**
- Create: `src/lib/notifications.ts`

**Step 1: Copy notifications.ts from source**

Direct copy — already uses browser Notifications API:

```typescript
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function sendBrowserNotification(title: string, body: string) {
  if (Notification.permission !== "granted") return;
  new Notification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "estrapatch-reminder",
  });
}
```

Note: changed icon paths to `/icons/icon-192.png` (PWA icons created in Task 12) and tag to `estrapatch-reminder`.

**Step 2: Commit**

```bash
git add src/lib/notifications.ts
git commit -m "feat: add browser notifications module"
```

---

## Task 7: Base UI Components

Copy these components directly from source — they have zero server dependencies.

**Files:**
- Create: `src/components/Card.tsx` (copy from source)
- Create: `src/components/Button.tsx` (copy from source)
- Create: `src/components/SimulatorSlider.tsx` (copy from source)
- Create: `src/components/CountdownTimer.tsx` (copy from source)
- Create: `src/components/NotificationSetup.tsx` (copy from source)

**Step 1: Copy all base components**

```bash
mkdir -p src/components
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/Card.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/Button.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/SimulatorSlider.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/CountdownTimer.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/NotificationSetup.tsx src/components/
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/Card.tsx src/components/Button.tsx src/components/SimulatorSlider.tsx src/components/CountdownTimer.tsx src/components/NotificationSetup.tsx
git commit -m "feat: port base UI components (Card, Button, Slider, Countdown, Notifications)"
```

---

## Task 8: NavBar Component

The NavBar needs a small modification to add a Settings link.

**Files:**
- Create: `src/components/NavBar.tsx`

**Step 1: Copy NavBar from source and add Settings link**

Copy from source first:

```bash
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/NavBar.tsx src/components/
```

Then modify: add a Settings nav item. The source NavBar has 4 items (Home, Apply, E2 Sim, History). Add a 5th: Settings (/settings) with a gear emoji.

The modified NavBar should include this additional link in the nav items array:

```tsx
{ href: "/settings", label: "Settings", icon: "⚙️" }
```

**Step 2: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: port NavBar with settings link"
```

---

## Task 9: Body Map Components

**Files:**
- Create: `src/components/BodyMap.tsx` (copy from source)
- Create: `src/components/MiniBodyMap.tsx` (copy from source)

**Step 1: Copy body map components**

```bash
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/BodyMap.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/MiniBodyMap.tsx src/components/
```

These use `<img>` tags referencing `/body-front.png`, `/body-back.png`, `/body-side.png` which were copied in Task 2.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/BodyMap.tsx src/components/MiniBodyMap.tsx
git commit -m "feat: port BodyMap and MiniBodyMap components"
```

---

## Task 10: Chart Components

**Files:**
- Create: `src/components/E2Chart.tsx` (copy from source)
- Create: `src/components/MiniE2Chart.tsx` (copy from source)
- Create: `src/components/RecommendationTimeline.tsx` (copy from source)
- Create: `src/components/ActivePatchCard.tsx` (copy from source)

**Step 1: Copy all chart and display components**

```bash
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/E2Chart.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/MiniE2Chart.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/RecommendationTimeline.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/ActivePatchCard.tsx src/components/
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/E2Chart.tsx src/components/MiniE2Chart.tsx src/components/RecommendationTimeline.tsx src/components/ActivePatchCard.tsx
git commit -m "feat: port chart and display components"
```

---

## Task 11: Playground Components and Hook

**Files:**
- Create: `src/components/PlaygroundChart.tsx` (copy from source)
- Create: `src/components/PlaygroundPatchList.tsx` (copy from source)
- Create: `src/components/PatchRemovalDialog.tsx` (copy from source)
- Create: `src/components/PlaygroundSimulator.tsx` (copy from source)
- Create: `src/hooks/usePlaygroundSimulation.ts` (copy from source)

**Step 1: Copy playground components and hook**

```bash
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/PlaygroundChart.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/PlaygroundPatchList.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/PatchRemovalDialog.tsx src/components/
cp /Users/scottyang/Developer/e2-patch-tracker/src/components/PlaygroundSimulator.tsx src/components/
mkdir -p src/hooks
cp /Users/scottyang/Developer/e2-patch-tracker/src/hooks/usePlaygroundSimulation.ts src/hooks/
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/PlaygroundChart.tsx src/components/PlaygroundPatchList.tsx src/components/PatchRemovalDialog.tsx src/components/PlaygroundSimulator.tsx src/hooks/usePlaygroundSimulation.ts
git commit -m "feat: port playground simulator components and hook"
```

---

## Task 12: ReminderPoller (Rewritten for Dexie)

The source ReminderPoller fetches from `/api/patches/active`. We replace that with a direct Dexie call.

**Files:**
- Create: `src/components/ReminderPoller.tsx`

**Step 1: Create the Dexie-based ReminderPoller**

```tsx
"use client";

import { useEffect } from "react";
import { sendBrowserNotification } from "@/lib/notifications";
import { getActivePatches } from "@/lib/db";
import type { Patch } from "@/lib/types";

const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes

function checkPatches(patches: Patch[]) {
  const now = Date.now();

  for (const patch of patches) {
    const removalTime = new Date(patch.scheduled_removal).getTime();
    const msUntil = removalTime - now;
    const minutesUntil = Math.round(msUntil / (1000 * 60));

    if (msUntil <= 0) {
      sendBrowserNotification(
        "Time to Remove Patch!",
        `Your ${patch.body_side} patch is overdue for removal!`
      );
    } else if (msUntil <= 2 * 60 * 60 * 1000) {
      sendBrowserNotification(
        "Patch Change Coming Up",
        `Your ${patch.body_side} patch should be removed in ~${minutesUntil} minutes.`
      );
    }
  }
}

export default function ReminderPoller() {
  useEffect(() => {
    async function poll() {
      try {
        const patches = await getActivePatches();
        checkPatches(patches);
      } catch (err) {
        console.error("[ReminderPoller] Error polling patches:", err);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return null;
}
```

Key change: `fetch("/api/patches/active")` → `getActivePatches()` (direct Dexie call).

**Step 2: Update layout.tsx to include NavBar, NotificationSetup, and ReminderPoller**

Now that all dependencies exist, update `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import NavBar from "@/components/NavBar";
import NotificationSetup from "@/components/NotificationSetup";
import ReminderPoller from "@/components/ReminderPoller";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "EstaPatch",
  description: "Track your estradiol patch applications with love",
};

export const viewport: Viewport = {
  themeColor: "#5BCEFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans antialiased`}>
        <main className="pb-20">{children}</main>
        <NavBar />
        <NotificationSetup />
        <ReminderPoller />
      </body>
    </html>
  );
}
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/components/ReminderPoller.tsx src/app/layout.tsx
git commit -m "feat: add ReminderPoller using Dexie and wire up layout"
```

---

## Task 13: Dashboard Page (Refactored)

The dashboard replaces all `fetch("/api/...")` calls with direct Dexie + PK model calls.

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Create the dashboard page**

Replace `src/app/page.tsx` with:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ActivePatchCard from "@/components/ActivePatchCard";
import MiniE2Chart from "@/components/MiniE2Chart";
import RecommendationTimeline from "@/components/RecommendationTimeline";
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
  getRecommendations,
} from "@/lib/pk-model";

interface SimulatorData {
  series: { time: number; value: number }[];
  currentLevel: number;
  projection: { time: number; value: number }[];
  targetMin: number;
  targetMax: number;
  recommendations: {
    type: "apply" | "remove";
    urgency: "now" | "soon" | "upcoming";
    message: string;
    hoursUntil: number;
  }[];
}

export default function Dashboard() {
  const [activePatches, setActivePatches] = useState<Patch[]>([]);
  const [simulatorData, setSimulatorData] = useState<SimulatorData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      await ensureDefaults();

      const patches = await getActivePatches();
      setActivePatches(patches);

      // Run PK simulation client-side
      const allPatches = await getAllPatches();
      const patchRecords = allPatches.map((p) => ({
        applied_at: p.applied_at,
        removed_at: p.removed_at,
        dose_mg_per_day: p.dose_mg_per_day,
      }));

      const series = calculatePersonalizedE2(patchRecords, 672);
      const currentLevel = getCurrentE2Estimate(patchRecords);
      const projection = projectE2Forward(patchRecords, 48);
      const targetMin = Number((await getSetting("target_e2_min")) ?? "100");
      const targetMax = Number((await getSetting("target_e2_max")) ?? "200");
      const recommendations = getRecommendations(
        patchRecords,
        targetMin,
        targetMax,
        72
      );

      setSimulatorData({
        series,
        currentLevel,
        projection,
        targetMin,
        targetMax,
        recommendations,
      });
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

  const handleEditLocation = async (
    id: number,
    x: number,
    y: number,
    side: BodySide
  ) => {
    try {
      await updatePatch(id, { body_x: x, body_y: y, body_side: side });
      await fetchData();
    } catch (error) {
      console.error("Failed to update patch location:", error);
    }
  };

  const handleAdjust = async (id: number, wearHours: number) => {
    try {
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
          EstaPatch
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
                {simulatorData.recommendations &&
                  simulatorData.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-kawaii-pink/20">
                      <RecommendationTimeline
                        projection={simulatorData.projection}
                        targetMin={simulatorData.targetMin}
                        targetMax={simulatorData.targetMax}
                        recommendations={simulatorData.recommendations}
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
```

Key changes from source:
- All `fetch("/api/...")` replaced with direct Dexie + PK model calls
- `ensureDefaults()` called on first load to seed default settings
- Title changed to "EstaPatch"

**Step 2: Verify dev server renders the dashboard**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: Dashboard loads with "No active patches" and "No data yet" messages (empty IndexedDB).

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: port dashboard with direct Dexie data access"
```

---

## Task 14: Apply Patch Page (Refactored)

**Files:**
- Create: `src/app/apply/page.tsx`

**Step 1: Create the apply page**

```tsx
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
```

Key change: `fetch("/api/patches")` → `getAllPatches()`, `fetch("/api/patches", { method: "POST" })` → `createPatch()`.

**Step 2: Verify the page loads**

```bash
npm run dev
```

Navigate to `http://localhost:3000/apply`. Expected: Body map loads with placement interaction.

**Step 3: Commit**

```bash
git add src/app/apply/page.tsx
git commit -m "feat: port apply page with direct Dexie data access"
```

---

## Task 15: History Page (Refactored)

**Files:**
- Create: `src/app/history/page.tsx`

**Step 1: Create the history page**

This is a refactored copy of the source. All `fetch` calls become Dexie calls. The full file is large (~350 lines) — copy from source and make these replacements:

1. Remove the `fetch` import (not needed)
2. Add imports: `import { getAllPatches, updatePatch, deletePatch as dbDeletePatch } from "@/lib/db";`
3. Replace `fetchPatches` function body:
   ```typescript
   const fetchPatches = useCallback(async () => {
     try {
       const data: Patch[] = await getAllPatches();
       // Already sorted DESC by getAllPatches()
       setPatches(data);
     } catch (error) {
       console.error("Failed to fetch patches:", error);
     } finally {
       setLoading(false);
     }
   }, []);
   ```
4. Replace `handleSave`:
   ```typescript
   const handleSave = async (id: number, data: { ... }) => {
     try {
       await updatePatch(id, data);
       setEditingId(null);
       await fetchPatches();
     } catch (error) {
       console.error("Failed to update patch:", error);
     }
   };
   ```
5. Replace `handleDelete`:
   ```typescript
   const handleDelete = async (id: number) => {
     const confirmed = window.confirm("Are you sure you want to delete this patch record? This cannot be undone.");
     if (!confirmed) return;
     try {
       await dbDeletePatch(id);
       await fetchPatches();
     } catch (error) {
       console.error("Failed to delete patch:", error);
     }
   };
   ```
6. Replace `handleEditLocation`:
   ```typescript
   const handleEditLocation = async (id: number, x: number, y: number, side: BodySide) => {
     try {
       await updatePatch(id, { body_x: x, body_y: y, body_side: side });
       setEditingLocationId(null);
       await fetchPatches();
     } catch (error) {
       console.error("Failed to update patch location:", error);
     }
   };
   ```

The entire JSX render section stays identical to the source.

**Step 2: Verify the page loads**

Navigate to `http://localhost:3000/history`. Expected: Shows "No patch history yet" (empty DB).

**Step 3: Commit**

```bash
git add src/app/history/page.tsx
git commit -m "feat: port history page with direct Dexie data access"
```

---

## Task 16: Simulator Page (Refactored)

**Files:**
- Create: `src/app/simulator/page.tsx`

**Step 1: Create the simulator page**

This is the most significant refactoring — the personal and what-if tabs computed data server-side via `/api/simulator`. Now all computation happens client-side.

Copy from source and make these changes:

1. Add imports:
   ```typescript
   import {
     getAllPatches,
     getActivePatches,
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
   } from "@/lib/pk-model";
   ```

2. Replace `fetchPersonal`:
   ```typescript
   const fetchPersonal = useCallback(async () => {
     setPersonalLoading(true);
     try {
       await ensureDefaults();
       const patches = await getAllPatches();
       const patchRecords = patches.map((p) => ({
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

       if (patches.length > 0) {
         const earliestMs = patches.reduce((earliest, p) => {
           const t = new Date(p.applied_at).getTime();
           return t < earliest ? t : earliest;
         }, Infinity);
         startTimeVal = new Date(earliestMs).toISOString();

         for (const p of patches) {
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
   ```

3. Replace `fetchWhatIf`:
   ```typescript
   const fetchWhatIf = useCallback(async () => {
     setWhatIfLoading(true);
     try {
       const series = calculateE2Concentration({
         patches,
         spread,
         worn,
         period: 168,
       });
       setWhatIfData(series);
     } catch (error) {
       console.error("Failed to compute what-if data:", error);
     } finally {
       setWhatIfLoading(false);
     }
   }, [patches, spread, worn]);
   ```

4. Replace `fetchPlaygroundData`:
   ```typescript
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
   ```

5. Replace the "Save Target Range" button handler:
   ```typescript
   onClick={async () => {
     await setSetting("target_e2_min", String(targetMin));
     await setSetting("target_e2_max", String(targetMax));
     fetchPersonal();
   }}
   ```

The rest of the JSX stays identical to the source.

**Step 2: Verify all three tabs work**

```bash
npm run dev
```

Navigate to `http://localhost:3000/simulator`. Expected:
- Personal tab: Shows 0 pg/mL (no patches yet), chart renders
- What-If tab: Sliders work, chart updates
- Playground tab: Shows "Loading playground..." briefly, then empty state

**Step 3: Commit**

```bash
git add src/app/simulator/page.tsx
git commit -m "feat: port simulator page with client-side PK computation"
```

---

## Task 17: Settings Page (New)

**Files:**
- Create: `src/app/settings/page.tsx`

**Step 1: Create the settings page**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import {
  getAllSettings,
  setSetting,
  exportAllData,
  importData,
  clearAllData,
  ensureDefaults,
} from "@/lib/db";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      await ensureDefaults();
      const s = await getAllSettings();
      setSettings(s);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (key: string, value: string) => {
    await setSetting(key, value);
    const s = await getAllSettings();
    setSettings(s);
  };

  const handleExport = async () => {
    const data = await exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estrapatch-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.patches || !data.settings) {
        alert("Invalid backup file format.");
        return;
      }

      const confirmed = window.confirm(
        importMode === "replace"
          ? "This will replace ALL existing data. Continue?"
          : "This will merge imported data with existing data. Continue?"
      );
      if (!confirmed) return;

      await importData(data, importMode);
      const s = await getAllSettings();
      setSettings(s);
      alert("Import successful!");
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import data. Check the file format.");
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(
      "This will permanently delete ALL your data (patches and settings). This cannot be undone. Are you sure?"
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "Really delete everything? Last chance."
    );
    if (!doubleConfirm) return;

    await clearAllData();
    await ensureDefaults();
    const s = await getAllSettings();
    setSettings(s);
    alert("All data cleared.");
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
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold text-kawaii-pink-dark text-center">
          Settings
        </h1>

        {/* Target E2 Range */}
        <Card title="Target E2 Range">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Minimum (pg/mL)
              </label>
              <input
                type="number"
                value={settings.target_e2_min ?? "100"}
                onChange={(e) => handleSave("target_e2_min", e.target.value)}
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
                value={settings.target_e2_max ?? "200"}
                onChange={(e) => handleSave("target_e2_max", e.target.value)}
                min={0}
                max={500}
                className="w-full px-3 py-2 rounded-kawaii border border-kawaii-pink/30 text-sm focus:outline-none focus:ring-2 focus:ring-kawaii-pink-dark/30"
              />
            </div>
            <p className="text-xs text-gray-400">
              Common feminizing HRT targets: 100-200 pg/mL
            </p>
          </div>
        </Card>

        {/* Default Wear Time */}
        <Card title="Default Wear Time">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={12}
                max={168}
                step={12}
                value={Number(settings.default_wear_hours ?? "84")}
                onChange={(e) =>
                  handleSave("default_wear_hours", e.target.value)
                }
                className="flex-1 accent-kawaii-pink-dark"
              />
              <span className="text-sm font-bold text-kawaii-pink-dark w-24 text-right">
                {(Number(settings.default_wear_hours ?? "84") / 24).toFixed(1)}{" "}
                days
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Default wear time for new patch applications.
            </p>
          </div>
        </Card>

        {/* Export/Import */}
        <Card title="Data Backup">
          <div className="space-y-3">
            <Button variant="primary" size="md" onClick={handleExport} className="w-full">
              Export Data (JSON)
            </Button>

            <div className="border-t border-kawaii-pink/20 pt-3">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Import Data
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setImportMode("replace")}
                  className={`text-xs px-3 py-1 rounded-kawaii font-semibold ${
                    importMode === "replace"
                      ? "bg-kawaii-pink-dark text-white"
                      : "bg-kawaii-rose text-kawaii-pink-dark"
                  }`}
                >
                  Replace All
                </button>
                <button
                  onClick={() => setImportMode("merge")}
                  className={`text-xs px-3 py-1 rounded-kawaii font-semibold ${
                    importMode === "merge"
                      ? "bg-kawaii-pink-dark text-white"
                      : "bg-kawaii-rose text-kawaii-pink-dark"
                  }`}
                >
                  Merge
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-kawaii file:border-0 file:text-sm file:font-semibold file:bg-kawaii-rose file:text-kawaii-pink-dark hover:file:bg-kawaii-pink/30"
              />
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card title="Danger Zone">
          <Button variant="danger" size="md" onClick={handleClearData} className="w-full">
            Clear All Data
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Permanently deletes all patches and resets settings to defaults.
            Export your data first!
          </p>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: Verify settings page**

Navigate to `http://localhost:3000/settings`. Expected: Settings page loads with default values, export button downloads JSON file.

**Step 3: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: add settings page with export/import and data management"
```

---

## Task 18: Welcome Screen

**Files:**
- Create: `src/components/WelcomeScreen.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create the welcome screen component**

```tsx
"use client";

import Button from "@/components/Button";
import { ensureDefaults, setSetting } from "@/lib/db";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const handleGetStarted = async () => {
    await ensureDefaults();
    await setSetting("onboarding_complete", "true");
    onComplete();
  };

  return (
    <div className="min-h-screen bg-kawaii-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 animate-bounce-in">
        <div className="text-6xl">💊</div>
        <h1 className="text-3xl font-bold text-kawaii-pink-dark">
          Welcome to EstaPatch
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Track your estradiol patch applications, simulate serum E2 levels
          using a pharmacokinetic model, and plan your patch schedule.
        </p>
        <p className="text-sm text-gray-400">
          All data stays on your device. Nothing is sent to any server.
        </p>
        <Button variant="primary" size="lg" onClick={handleGetStarted}>
          Get Started
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Modify dashboard to show welcome screen on first visit**

In `src/app/page.tsx`, add:

1. Import `WelcomeScreen` and `getSetting` (already imported from db):
   ```typescript
   import WelcomeScreen from "@/components/WelcomeScreen";
   ```

2. Add state for onboarding:
   ```typescript
   const [showWelcome, setShowWelcome] = useState<boolean | null>(null);
   ```

3. Check onboarding status in `fetchData` (at the beginning, before other logic):
   ```typescript
   const onboarded = await getSetting("onboarding_complete");
   if (onboarded !== "true") {
     setShowWelcome(true);
     setLoading(false);
     return;
   }
   setShowWelcome(false);
   ```

4. Add early return before the loading check:
   ```typescript
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
   ```

**Step 3: Verify welcome screen**

Clear IndexedDB (DevTools > Application > IndexedDB > delete "estrapatch"), then reload `http://localhost:3000`. Expected: Welcome screen appears. Click "Get Started" → dashboard loads.

**Step 4: Commit**

```bash
git add src/components/WelcomeScreen.tsx src/app/page.tsx
git commit -m "feat: add welcome screen for first-time users"
```

---

## Task 19: PWA Manifest and Icons

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Modify: `src/app/layout.tsx` (add manifest link)

**Step 1: Create manifest.json**

Create `public/manifest.json`:

```json
{
  "name": "EstaPatch",
  "short_name": "EstaPatch",
  "description": "Track your estradiol patch applications",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFF5F7",
  "theme_color": "#5BCEFA",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Step 2: Generate PWA icons**

Create placeholder icons (simple colored squares with text). Use any method:

```bash
mkdir -p public/icons
# Generate simple placeholder icons using ImageMagick if available:
# convert -size 192x192 xc:"#5BCEFA" -gravity center -fill white -pointsize 48 -annotate 0 "EP" public/icons/icon-192.png
# convert -size 512x512 xc:"#5BCEFA" -gravity center -fill white -pointsize 128 -annotate 0 "EP" public/icons/icon-512.png
```

If ImageMagick is not available, create simple PNG icons using any available tool, or use placeholder SVGs converted to PNG. The icons should be the kawaii lavender color (#5BCEFA) with "EP" text or a patch emoji.

**Step 3: Add manifest link to layout.tsx**

In `src/app/layout.tsx`, add to the `metadata` export:

```typescript
export const metadata: Metadata = {
  title: "EstaPatch",
  description: "Track your estradiol patch applications with love",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EstaPatch",
  },
};
```

**Step 4: Verify PWA manifest**

```bash
npm run dev
```

Open DevTools > Application > Manifest. Expected: manifest loads with correct name, colors, and icon paths.

**Step 5: Commit**

```bash
git add public/manifest.json public/icons/ src/app/layout.tsx
git commit -m "feat: add PWA manifest and icons"
```

---

## Task 20: Build and Verify Static Export

**Files:**
- None (verification only)

**Step 1: Run production build**

```bash
npm run build
```

Expected: Build succeeds with `output: "export"`. All pages should be generated as static HTML files in the `out/` directory.

**Common issues to check:**
- If any page uses `useSearchParams()` without a `<Suspense>` boundary, wrap it
- If any component imports a server-only module, fix the import
- If `next/image` complains about optimization, `images: { unoptimized: true }` in config should handle it

**Step 2: Test the static export locally**

```bash
npx serve out
```

Open `http://localhost:3000` (or whatever port `serve` uses). Expected:
- Welcome screen appears on first visit
- After "Get Started", dashboard loads
- All pages navigate correctly
- Apply a test patch → appears on dashboard
- Simulator shows data
- Settings page works
- Export downloads JSON

**Step 3: Commit any build fixes**

```bash
git add -A
git commit -m "fix: resolve static export build issues"
```

(Only commit if there were fixes needed.)

---

## Task 21: Deploy to Vercel

**Step 1: Install Vercel CLI (if not already)**

```bash
npm i -g vercel
```

**Step 2: Deploy**

```bash
vercel --prod
```

Follow the prompts:
- Link to existing project or create new
- Framework: Next.js
- Build command: `next build`
- Output directory: `out`

Alternatively, connect the GitHub repo to Vercel via the web dashboard for auto-deploy on push to `main`.

**Step 3: Verify deployment**

Open the Vercel URL (e.g., `estrapatch.vercel.app`). Expected:
- Welcome screen on first visit
- All features work
- PWA installable (Chrome shows install prompt)
- Works offline after first visit (service worker caches assets)

**Step 4: Commit any deployment config**

```bash
git add -A
git commit -m "chore: add Vercel deployment config"
```

---

## Summary of Changes from Source

| Source (e2-patch-tracker) | EstaPatch PWA | Change Type |
|---|---|---|
| `better-sqlite3` + `db.ts` | Dexie.js `db.ts` | **Replaced** |
| `src/app/api/*` (7 routes) | Direct function calls | **Removed** |
| `scheduler.ts` + `instrumentation.ts` | N/A | **Removed** |
| `node-notifier` | N/A (already used browser API) | **Removed** |
| `schema.sql` | Dexie schema in `db.ts` | **Replaced** |
| `pk-model.ts` | Same file | **Copied** |
| `notifications.ts` | Same file (minor path change) | **Copied** |
| `types.ts` | Same file | **Copied** |
| All 18 components | Same files | **Copied** |
| `ReminderPoller.tsx` | Rewritten for Dexie | **Rewritten** |
| `usePlaygroundSimulation.ts` | Same file | **Copied** |
| 4 pages (dashboard, apply, history, simulator) | Refactored for Dexie | **Refactored** |
| `globals.css` | Same file | **Copied** |
| `layout.tsx` | Minor updates (title, manifest) | **Modified** |
| N/A | `WelcomeScreen.tsx` | **New** |
| N/A | Settings page | **New** |
| N/A | Export/Import (in `db.ts`) | **New** |
| N/A | PWA manifest + service worker | **New** |
| `BodyMap3D.tsx`, `BodyMapSvg.tsx` | N/A | **Not ported** |
| `model-viewer.d.ts` | N/A | **Not ported** |
| `scripts/` (launchd) | N/A | **Not ported** |
| `data/` (SQLite DB) | N/A | **Not ported** |
