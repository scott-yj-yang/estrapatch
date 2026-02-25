# EstaPatch PWA Design

**Goal:** Port the private e2-patch-tracker (SQLite + local server) into a public-facing PWA that runs entirely in the browser with IndexedDB storage. Deploy to Vercel for free hosting.

**Source repo:** `e2-patch-tracker` (private, SQLite backend, macOS launchd)
**Target repo:** `estrapatch` (public, IndexedDB/Dexie.js, Vercel deployment)

---

## Architecture

All data storage and computation runs client-side. No server, no API routes, no database server. Vercel serves static files only.

```
User's Browser
├── Next.js static export (HTML/JS/CSS)
├── IndexedDB via Dexie.js (patches, settings)
├── PK model (pure math, client-side)
├── Service worker (offline cache)
└── Browser Notifications API
```

### What ports directly (no changes)
- `pk-model.ts` — Pure math, 420 lines, no server deps
- All 19 UI components (BodyMap, E2Chart, PlaygroundSimulator, etc.)
- `usePlaygroundSimulation.ts` hook
- `notifications.ts` (browser Notifications API)
- `types.ts` type definitions
- Tailwind CSS kawaii theme
- Recharts chart components

### What gets replaced
| Current (e2-patch-tracker) | EstaPatch PWA |
|---|---|
| `better-sqlite3` + `db.ts` | Dexie.js IndexedDB |
| `src/app/api/*` (7 API routes) | Direct function calls from pages |
| `scheduler.ts` + `instrumentation.ts` | ReminderPoller using IndexedDB |
| `node-notifier` (OS notifications) | Browser Notifications API (already exists) |
| `next.config.ts` (server external) | `output: "export"` (static) |

### What's new
- PWA manifest + service worker (offline support + installability)
- Welcome screen (first-visit onboarding)
- Settings page with export/import (JSON backup)
- Body image-based body map (current picture approach, no 3D or SVG)

---

## Data Layer: Dexie.js

Single `src/lib/db.ts` module replacing SQLite + all API routes.

### Schema

```typescript
class EstraPatchDB extends Dexie {
  patches!: Table<PatchRecord, number>;
  settings!: Table<{ key: string; value: string }, string>;

  constructor() {
    super("estrapatch");
    this.version(1).stores({
      patches: "++id, applied_at, removed_at",
      settings: "key",
    });
  }
}
```

### Functions (same signatures as current patches.ts)

| Function | Implementation |
|---|---|
| `getAllPatches()` | `db.patches.orderBy('applied_at').reverse().toArray()` |
| `getActivePatches()` | `db.patches.filter(p => !p.removed_at).toArray()` |
| `getPatchById(id)` | `db.patches.get(id)` |
| `createPatch(input)` | `db.patches.add({...computed fields})` |
| `updatePatch(id, updates)` | `db.patches.update(id, updates)` |
| `removePatch(id)` | `db.patches.update(id, { removed_at: now })` |
| `deletePatch(id)` | `db.patches.delete(id)` |
| `getSetting(key)` | `db.settings.get(key)` |
| `setSetting(key, value)` | `db.settings.put({ key, value })` |
| `getAllSettings()` | `db.settings.toArray()` → convert to object |

### Default Settings (seeded on first creation)

```
default_wear_hours: "84"
reminder_hours_before: "2"
target_e2_min: "100"
target_e2_max: "200"
patches_per_change: "2"
```

---

## Page Refactoring

Each page replaces `fetch("/api/...")` with direct Dexie calls:

```typescript
// Before: const res = await fetch("/api/patches/active"); const patches = await res.json();
// After:  const patches = await getActivePatches();
```

### Dashboard (page.tsx)
- Call `getActivePatches()` directly
- Run PK model client-side (same as playground already does)
- Call `calculatePersonalizedE2()`, `getCurrentE2Estimate()`, `projectE2Forward()`, `getRecommendations()` directly

### Apply (/apply)
- Call `getAllPatches()` for recent locations
- Call `createPatch()` to save

### History (/history)
- Call `getAllPatches()`, `updatePatch()`, `deletePatch()` directly

### Simulator (/simulator)
- Personal mode: call PK model directly with patches from `getAllPatches()`
- What-if mode: call `calculateE2Concentration()` directly (already pure math)
- Playground: unchanged (already client-side)

### Settings (/settings) — NEW
- Target E2 range inputs
- Default wear hours setting
- Export/Import buttons
- Clear data button

---

## PWA Features

### manifest.json
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
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker
- Cache static assets (HTML, JS, CSS, images) on install
- Serve from cache when offline
- Use `next-pwa` or `@ducanh2912/next-pwa` for Next.js integration

### Offline Support
- Full offline functionality (all data in IndexedDB, all computation client-side)
- App works immediately after first visit, even without internet

---

## Export/Import

### Export
- Serialize all patches + settings to JSON
- Download as `estrapatch-backup-YYYY-MM-DD.json`
- Schema:
  ```json
  {
    "version": 1,
    "exported_at": "ISO date",
    "patches": [...],
    "settings": {...}
  }
  ```

### Import
- File upload (JSON)
- Validate schema version and data integrity
- Option: "Replace all data" or "Merge with existing"
- Confirmation dialog before proceeding

---

## Welcome Screen

Shown on first visit (detected by empty IndexedDB):

- App name and brief description
- "Get Started" button
- Seeds default settings on click
- Navigates to dashboard
- Never shown again (setting stored in IndexedDB)

---

## Deployment

- **Platform:** Vercel (free Hobby tier)
- **Build:** `next build` with `output: "export"` produces static files
- **URL:** `estrapatch.vercel.app`
- **CI/CD:** Auto-deploy on push to `main`
- **HTTPS:** Automatic (required for service worker)

---

## Removed from e2-patch-tracker

- `better-sqlite3` dependency
- `node-notifier` dependency
- `src/app/api/` directory (all API routes)
- `src/lib/db.ts` (SQLite connection) — replaced with Dexie version
- `src/lib/scheduler.ts` (server-side scheduler)
- `src/lib/schema.sql` (SQL schema)
- `src/instrumentation.ts` (server startup)
- `BodyMap3D.tsx` (3D model viewer)
- `model-viewer.d.ts` (3D types)
- `scripts/` directory (launchd deployment)
- `data/` directory (SQLite database)
