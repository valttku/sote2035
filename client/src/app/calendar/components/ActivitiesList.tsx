"use client";

import { useTranslation } from "@/i18n/LanguageProvider";

// One activity entry
export type ActivitiesEntry = {
  id: string;
  device_name?: string | null;
  activity_name: string;
  duration_in_seconds?: number | null;
  start_time_in_seconds?: number | null;
  start_time_offset_in_seconds?: number | null;
  average_heart_rate?: number | null;
  active_kilocalories?: number | null;
  steps?: number | null;
  created_at: string;
  source_type?: "garmin" | "manual" | "polar";
};

// API response for a day
export type ActivitiesResponse = {
  date: string;
  entries: ActivitiesEntry[];
};

// Convert seconds to "Xm Ys" format
function formatDuration(seconds?: number | null, t?: any): string {
  if (!seconds) return `0 ${t?.calendar.minutesShort ?? "min"}`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  if (secs === 0) return `${minutes}${t?.calendar.minutesShort ?? "m"}`;
  return `${minutes}${t?.calendar.minutesShort ?? "m"} ${secs}s`;
}

// Convert unix timestamp to "HH:MM"
function formatTime(unixSeconds?: number | null, offset?: number | null): string {
  if (unixSeconds == null) return "N/A";
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Show list of activities
export default function ActivitiesList({ entries }: { entries: ActivitiesEntry[] }) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <p className="text-sm opacity-80">{t.calendar.noActivities ?? "No activities for this day."}</p>;
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-96">
      {entries.map((e) => (
        <div key={e.id} className="border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#31c2d5]">{e.activity_name}</h3>
            <span className="text-xs opacity-70">
              {e.source_type === "manual"
                ? t.calendar.manuallyAdded ?? "Manually added activity"
                : e.device_name}
            </span>
          </div>

          <div className="text-sm space-y-1">
            <div>
              <span className="font-semibold">{t.calendar.duration ?? "Duration"}: </span>
              {formatDuration(e.duration_in_seconds, t)}
            </div>
            <div>
              <span className="font-semibold">{t.calendar.startTime ?? "Start Time"}: </span>
              {formatTime(e.start_time_in_seconds, e.start_time_offset_in_seconds)}
            </div>
            {e.average_heart_rate != null && (
              <div>
                <span className="font-semibold">{t.calendar.avgHeartRate ?? "Avg Heart Rate"}: </span>
                {e.average_heart_rate} bpm
              </div>
            )}
            {e.active_kilocalories != null && (
              <div>
                <span className="font-semibold">{t.calendar.activeCalories ?? "Active Kilocalories"}: </span>
                {e.active_kilocalories} kcal
              </div>
            )}
            {e.steps != null && (
              <div>
                <span className="font-semibold">{t.calendar.stepsLabel ?? "Steps"}: </span>
                {e.steps}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
