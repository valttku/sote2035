"use client";
import { StatCard } from "../../../components/health-insights/StatCard";

export type Sleep = {
  id: string;
  duration_in_seconds: number;
  total_nap_duration_in_seconds: number;
  start_time_in_seconds: number;
  unmeasurable_sleep_in_seconds: number;
  deep_sleep_in_seconds: number;
  light_sleep_in_seconds: number;
  rem_sleep_in_seconds: number;
  awake_duration_in_seconds: number;
  updated_at: string;
};

function calculateSleepEndtime(
  startTimeInSeconds: string | number,
  durationInSeconds: number,
): string {
  const startTimeNum =
    typeof startTimeInSeconds === "string"
      ? parseInt(startTimeInSeconds, 10)
      : startTimeInSeconds;

  const endTime = new Date((startTimeNum + durationInSeconds) * 1000);
  return endTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Helper to format seconds as hours and minutes"
function formatSecondsToHoursMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  let result = "";
  if (h > 0) result += `${h}h `;
  result += `${m}m`;
  return result.trim();
}

export function SleepSection({ sleep }: { sleep?: Sleep }) {
  if (!sleep) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl">
        Sleep Summary{" "}
        <span className="text-sm font-normal">
          (updated at{" "}
          {new Date(sleep.updated_at).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour12: false,
          })}
          )
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Sleep"
          value={formatSecondsToHoursMinutes(sleep.duration_in_seconds)}
        />
        <StatCard
          label="Start time / End time"
          value={`${new Date(
            sleep.start_time_in_seconds * 1000,
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })} - ${calculateSleepEndtime(
            sleep.start_time_in_seconds,
            sleep.duration_in_seconds,
          )}`}
        />

        <StatCard
          label="Deep Sleep"
          value={formatSecondsToHoursMinutes(sleep.deep_sleep_in_seconds)}
        />
        <StatCard
          label="Light Sleep"
          value={formatSecondsToHoursMinutes(sleep.light_sleep_in_seconds)}
        />
        <StatCard
          label="REM Sleep"
          value={formatSecondsToHoursMinutes(sleep.rem_sleep_in_seconds)}
        />
        <StatCard
          label="Awake"
          value={formatSecondsToHoursMinutes(sleep.awake_duration_in_seconds)}
        />
        <StatCard
          label="Naps"
          value={formatSecondsToHoursMinutes(
            sleep.total_nap_duration_in_seconds,
          )}
        />
      </div>
    </div>
  );
}
