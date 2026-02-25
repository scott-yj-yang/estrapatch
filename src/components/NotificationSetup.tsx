"use client";

import { useEffect } from "react";
import { requestNotificationPermission } from "@/lib/notifications";

export default function NotificationSetup() {
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return null;
}
