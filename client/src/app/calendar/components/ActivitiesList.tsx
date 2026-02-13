"use client";

<<<<<<< HEAD
import type { ActivitiesEntry } from "../types";
import { useTranslation } from "@/i18n/LanguageProvider";

// Helper function to format duration in minutes/seconds
function formatDuration(seconds?: number | null, t?: any): string {
  if (!seconds) return `0 ${t?.calendar.minutesShort ?? "min"}`;
=======
// One activity entry from backend
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

// Convert seconds to "Xm Ys" format for display
function formatDuration(seconds?: number | null): string {
  if (!seconds) return "0 min";
>>>>>>> dc764b6c70d141879343c1e7c48bc3b0e64ce559
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  if (secs === 0) return `${minutes}${t?.calendar.minutesShort ?? "m"}`;
  return `${minutes}${t?.calendar.minutesShort ?? "m"} ${secs}s`;
}

<<<<<<< HEAD
// Helper function to format Unix timestamp to 24-hour time
=======
// Convert unix timestamp to readable "HH:MM" format
>>>>>>> dc764b6c70d141879343c1e7c48bc3b0e64ce559
function formatTime(
  unixSeconds?: number | null,
  offset?: number | null,
  locale?: string
): string {
  if (unixSeconds == null) return "N/A";
<<<<<<< HEAD
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleTimeString(locale || "en-US", {
=======
  const date = new Date(unixSeconds * 1000); // convert to ms
  return date.toLocaleTimeString("en-US", {
>>>>>>> dc764b6c70d141879343c1e7c48bc3b0e64ce559
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Show a list of activities
export default function ActivitiesList({
  entries,
}: {
  entries: ActivitiesEntry[];
}) {
  const { t } = useTranslation(); // Get translation object

  // Show message when no activities exist for this day
  if (entries.length === 0) {
    return (
      <p className="text-sm opacity-80">
        {t.calendar.noActivities ?? "No activities for this day."}
      </p>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-96">
      {/* Header: activity name + source */}
      {entries.map((e) => (
        <div key={e.id} className="border rounded-xl p-3">
          {/* Activity header: name + source */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#31c2d5]">{e.activity_name}</h3>
            <span className="text-xs opacity-70">
              {e.source_type === "manual"
                ? t.calendar.manuallyAdded ?? "Manually added activity"
                : e.device_name}
            </span>
          </div>

          {/* Activity details */}
          <div className="text-sm space-y-1">
            <div>
              <span className="font-semibold">
                {t.calendar.duration ?? "Duration"}:{" "}
              </span>
              {formatDuration(e.duration_in_seconds, t)}
            </div>
            <div>
              <span className="font-semibold">
                {t.calendar.startTime ?? "Start Time"}:{" "}
              </span>
              {formatTime(
                e.start_time_in_seconds,
                e.start_time_offset_in_seconds,
                t.locale // use locale from translation
              )}
            </div>
            {e.average_heart_rate != null && (
              <div>
                <span className="font-semibold">
                  {t.calendar.avgHeartRate ?? "Avg Heart Rate"}:{" "}
                </span>
                {e.average_heart_rate} bpm
              </div>
            )}
            {e.active_kilocalories != null && (
              <div>
                <span className="font-semibold">
                  {t.calendar.activeCalories ?? "Active Kilocalories"}:{" "}
                </span>
                {e.active_kilocalories} kcal
              </div>
            )}
            {e.steps != null && (
              <div>
                <span className="font-semibold">
                  {t.calendar.stepsLabel ?? "Steps"}:{" "}
                </span>
                {e.steps}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
