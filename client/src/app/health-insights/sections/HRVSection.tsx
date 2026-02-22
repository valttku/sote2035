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
  if (!HRV) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl">
        Heart Rate Variability Summary{" "}
        <span className="text-sm font-normal">
          (updated at{" "}
          {new Date(HRV.updated_at).toLocaleString(undefined, {
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
          label="Last Night's Average HRV"
          value={`${HRV.last_night_avg} ms`}
        />
        <StatCard
          label="Last Night's 5-min High HRV"
          value={`${HRV.last_night_5min_high} ms`}
        />
        <StatCard
          label="Average Day HRV"
          value={HRV.avg_day_hrv ? `${HRV.avg_day_hrv.toFixed(0)} ms` : "No data"}
        />
        <StatCard
          label="7-Day Average Night HRV"
          value={
            HRV.days_in_7d_window < 7
              ? "Not enough data"
              : HRV.avg_7d_night_hrv
                ? `${HRV.avg_7d_night_hrv.toFixed(0)} ms`
                : "No data"
          }
        />
        <StatCard
          label="7-Day Average HRV"
          value={
            HRV.days_in_7d_window < 7
              ? "Not enough data"
              : HRV.avg_7d_hrv
                ? `${HRV.avg_7d_hrv.toFixed(0)} ms`
                : "No data"
          }
        />
      </div>
    </div>
  );
}
