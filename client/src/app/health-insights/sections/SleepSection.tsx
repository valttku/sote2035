"use client";
import { StatCard } from "../../../components/health-insights/StatCard";

export type Sleep = {
  id: string;
  duration_in_seconds: number;
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
  const hasData = !!sleep;

  // If no data, provide default values
  const displaySleep: Sleep = hasData
    ? sleep!
    : {
        id: "empty",
        duration_in_seconds: 0,
        start_time_in_seconds: 0,
        unmeasurable_sleep_in_seconds: 0,
        deep_sleep_in_seconds: 0,
        light_sleep_in_seconds: 0,
        rem_sleep_in_seconds: 0,
        awake_duration_in_seconds: 0,
        updated_at: new Date().toISOString(),
      };

  return (
    <div className="space-y-4 p-0 md:p-4 w-full">
      <h1>
        <span>
          Updated at:{" "}
          {new Date(displaySleep.updated_at).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour12: false,
          })}
        </span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Sleep"
          value={`${formatSecondsToHoursMinutes(displaySleep.duration_in_seconds)}`}
          icon="💤"
        />
        <StatCard
          label="Start / End"
          value={`${new Date(
            displaySleep.start_time_in_seconds * 1000,
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })} - ${calculateSleepEndtime(
            displaySleep.start_time_in_seconds,
            displaySleep.duration_in_seconds,
          )}`}
          icon="⏰"
        />
        <StatCard
          label="Awake"
          value={formatSecondsToHoursMinutes(
            displaySleep.awake_duration_in_seconds,
          )}
          icon="😒"
        />
        <StatCard
          label="Deep Sleep"
          value={formatSecondsToHoursMinutes(
            displaySleep.deep_sleep_in_seconds,
          )}
          icon="💤"
        />
        <StatCard
          label="Light Sleep"
          value={formatSecondsToHoursMinutes(
            displaySleep.light_sleep_in_seconds,
          )}
          icon="💤"
        />
        <StatCard
          label="REM Sleep"
          value={formatSecondsToHoursMinutes(displaySleep.rem_sleep_in_seconds)}
          icon="💤"
        />
      </div>
    </div>
  );
}
