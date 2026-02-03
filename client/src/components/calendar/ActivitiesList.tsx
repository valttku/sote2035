"use client";

import type { ActivitiesEntry } from "./types";

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "0 min";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  if (secs === 0) return `${minutes}m`;
  return `${minutes}m ${secs}s`;
}

function formatTime(
  unixSeconds?: number | null,
  offset?: number | null,
): string {
  if (unixSeconds == null) return "N/A";
  // Convert Unix timestamp (in seconds) to milliseconds and create Date
  const date = new Date(unixSeconds * 1000);
  // Return time in 24-hour format
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ActivitiesList({
  entries,
}: {
  entries: ActivitiesEntry[];
}) {
  if (entries.length === 0) {
    return <p className="text-sm opacity-80">No activities for this day.</p>;
  }
  return (
    <div className="space-y-3 overflow-y-auto max-h-96">
      {entries.map((e) => (
        <div key={e.id} className="border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#1d9dad]">{e.activity_name}</h3>
            <span className="text-xs opacity-70">
              {e.source_type === "manual" ? "Manually added activity" : (e.device_name)}
            </span>
          </div>

          <div className="text-sm space-y-1">
            <div>
              <span className="font-semibold">Duration: </span>
              {formatDuration(e.duration_in_seconds)}
            </div>
            <div>
              <span className="font-semibold">Start Time: </span>
              {formatTime(
                e.start_time_in_seconds,
                e.start_time_offset_in_seconds,
              )}
            </div>
            {e.average_heart_rate != null && (
              <div>
                <span className="font-semibold">Avg Heart Rate: </span>
                {e.average_heart_rate} bpm
              </div>
            )}
            {e.active_kilocalories != null && (
              <div>
                <span className="font-semibold">Active Kilocalories: </span>
                {e.active_kilocalories} kcal
              </div>
            )}
            {e.steps != null && (
              <div>
                <span className="font-semibold">Steps: </span>
                {e.steps}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
