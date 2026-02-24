"use client";
import { StatCard } from "../../../components/health-insights/StatCard";

export type HRV = {
  id: string;
  last_night_avg: number;
  last_night_5min_high: number;
  avg_7d_night_hrv: number | null;
  avg_7d_hrv: number | null;
  avg_day_hrv: number | null;
  days_in_7d_window: number;
  updated_at: string;
};

export function HRVSection({ HRV }: { HRV?: HRV }) {
  const hasData = !!HRV;

  const displayHRV: HRV = hasData
    ? HRV!
    : {
        id: "empty",
        last_night_avg: 0,
        last_night_5min_high: 0,
        avg_7d_night_hrv: null,
        avg_7d_hrv: null,
        avg_day_hrv: null,
        days_in_7d_window: 0,
        updated_at: new Date().toISOString(),
      };

  const formatHRV = (value: number | null) =>
    value != null ? `${value.toFixed(0)} ms` : "No data";

  return (
    <div className={`space-y-4 p-0 md:p-4 w-full ${!HRV ? "opacity-50" : ""}`}>
      <h1>
        <span>
          Updated at:{" "}
          {new Date(displayHRV.updated_at).toLocaleString(undefined, {
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
          label="Last Night's Average HRV"
          value={formatHRV(displayHRV.last_night_avg)}
          icon="💓"
        />
        <StatCard
          label="Last Night's 5-min High HRV"
          value={formatHRV(displayHRV.last_night_5min_high)}
          icon="💓"
        />
        <StatCard
          label="Average Day HRV"
          value={formatHRV(displayHRV.avg_day_hrv)}
          icon="💓"
        />
        <StatCard
          label="7-Day Average Night HRV"
          value={
            displayHRV.days_in_7d_window < 7
              ? "Not enough data"
              : formatHRV(displayHRV.avg_7d_night_hrv)
          }
          icon="💓"
        />
        <StatCard
          label="7-Day Average HRV"
          value={
            displayHRV.days_in_7d_window < 7
              ? "Not enough data"
              : formatHRV(displayHRV.avg_7d_hrv)
          }
          icon="💓"
        />
      </div>
    </div>
  );
}
