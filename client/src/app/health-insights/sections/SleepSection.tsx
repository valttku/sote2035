"use client";
import { FaCircle } from "react-icons/fa6";
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

function SleepWheel({ sleep }: { sleep: Sleep }) {
  const total =
    sleep.deep_sleep_in_seconds +
    sleep.light_sleep_in_seconds +
    sleep.rem_sleep_in_seconds +
    sleep.awake_duration_in_seconds;

  // If total is 0, use equal placeholder slices
  const deepPct = total ? (sleep.deep_sleep_in_seconds / total) * 100 : 25;
  const lightPct = total ? (sleep.light_sleep_in_seconds / total) * 100 : 25;
  const remPct = total ? (sleep.rem_sleep_in_seconds / total) * 100 : 25;
  const awakePct = total ? (sleep.awake_duration_in_seconds / total) * 100 : 25;

  const gradient = `conic-gradient(
    #3510b9 0% ${deepPct}%,
    #3bd7f6 ${deepPct}% ${deepPct + lightPct}%,
    #f50be9 ${deepPct + lightPct}% ${deepPct + lightPct + remPct}%,
    #fdb0fc ${deepPct + lightPct + remPct}% 100%
  )`;

  return (
    <div
      className="w-full h-full rounded-full flex items-center justify-center"
      style={{
        background: gradient,
      }}
    >
      <div className="text-3xl font-bold text-center text-shadow-lg">
        {formatSecondsToHoursMinutes(sleep.duration_in_seconds)}
        <div className="text-2xl font-bold text-shadow-lg">Total</div>
      </div>
    </div>
  );
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
    <div
      className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!sleep ? "opacity-50" : ""}`}
    >
      <h1 className="">
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

      <div className="flex flex-row items-center gap-4 h-full rounded-xl border border-white/20 p-4">
        <div className="w-full max-w-[20rem] aspect-square mx-auto flex items-center justify-center ">
          <SleepWheel sleep={displaySleep} />
        </div>

        {/* Sleep stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-1/2">
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
            label="Deep Sleep"
            value={formatSecondsToHoursMinutes(
              displaySleep.deep_sleep_in_seconds,
            )}
            icon={<FaCircle color="#3510b9" size={16} />}
          />
          <StatCard
            label="Light Sleep"
            value={formatSecondsToHoursMinutes(
              displaySleep.light_sleep_in_seconds,
            )}
            icon={<FaCircle color="#3bd7f6" size={16} />}
          />
          <StatCard
            label="REM Sleep"
            value={formatSecondsToHoursMinutes(
              displaySleep.rem_sleep_in_seconds,
            )}
            icon={<FaCircle color="#f50be9" size={16} />}
          />

          <StatCard
            label="Awake"
            value={formatSecondsToHoursMinutes(
              displaySleep.awake_duration_in_seconds,
            )}
            icon={<FaCircle color="#fdb0fc" size={16} />}
          />
        </div>
      </div>
    </div>
  );
}
