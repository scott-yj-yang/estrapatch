"use client";

import { useEffect } from "react";
import { sendBrowserNotification } from "@/lib/notifications";
import { getActivePatches, updatePatch } from "@/lib/db";
import type { Patch } from "@/lib/types";

const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes

async function checkPatches(patches: Patch[]) {
  const now = Date.now();

  for (const patch of patches) {
    if (patch.notified_removal) continue;

    const removalTime = new Date(patch.scheduled_removal).getTime();
    const msUntil = removalTime - now;
    const minutesUntil = Math.round(msUntil / (1000 * 60));

    if (msUntil <= 0) {
      sendBrowserNotification(
        "Time to Remove Patch!",
        `Your ${patch.body_side} patch is overdue for removal!`
      );
      await updatePatch(patch.id, { notified_removal: true });
    } else if (msUntil <= 2 * 60 * 60 * 1000) {
      sendBrowserNotification(
        "Patch Change Coming Up",
        `Your ${patch.body_side} patch should be removed in ~${minutesUntil} minutes.`
      );
      await updatePatch(patch.id, { notified_removal: true });
    }
  }
}

export default function ReminderPoller() {
  useEffect(() => {
    async function poll() {
      try {
        const patches = await getActivePatches();
        await checkPatches(patches);
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
