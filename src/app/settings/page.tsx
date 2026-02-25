"use client";

import { useState, useEffect, useRef } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import DoseSelector from "@/components/DoseSelector";
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

      if (data.version !== 1 || !Array.isArray(data.patches) || typeof data.settings !== "object") {
        alert("Invalid or unsupported backup file format.");
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

        {/* Default Dose */}
        <Card title="Default Dose">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Dose per patch
            </label>
            <DoseSelector
              value={Number(settings.default_dose_mg_per_day ?? "0.1")}
              onChange={(dose) => handleSave("default_dose_mg_per_day", String(dose))}
            />
            <p className="text-xs text-gray-400">
              Default dose when applying new patches.
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
