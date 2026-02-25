"use client";

import { useState, useEffect, useCallback } from "react";

interface CountdownTimerProps {
  targetDate: string; // ISO datetime
  label: string;
  onExpired?: () => void;
}

function formatTimeRemaining(targetMs: number, nowMs: number): string {
  const diffMs = targetMs - nowMs;

  if (diffMs <= 0) return "";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export default function CountdownTimer({
  targetDate,
  label,
  onExpired,
}: CountdownTimerProps) {
  const targetMs = new Date(targetDate).getTime();
  const [now, setNow] = useState(Date.now());
  const [hasExpired, setHasExpired] = useState(false);

  const checkExpired = useCallback(() => {
    if (Date.now() >= targetMs && !hasExpired) {
      setHasExpired(true);
      onExpired?.();
    }
  }, [targetMs, hasExpired, onExpired]);

  useEffect(() => {
    // Check immediately
    checkExpired();

    const interval = setInterval(() => {
      setNow(Date.now());
      checkExpired();
    }, 60_000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [checkExpired]);

  const isExpired = now >= targetMs;
  const timeString = formatTimeRemaining(targetMs, now);

  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      {isExpired ? (
        <span className="text-red-500 font-bold animate-pulse">Overdue!</span>
      ) : (
        <span className="text-kawaii-pink-dark font-semibold">{timeString}</span>
      )}
    </div>
  );
}
