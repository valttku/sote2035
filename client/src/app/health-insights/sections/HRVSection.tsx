"use client";
import { StatCard } from "../../../components/health-insights/StatCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type HRV = {
  id: string;
  last_night_avg: number;
  last_night_5min_high: number;
  avg_7d_night_hrv: number | null;
  avg_7d_hrv: number | null;
  avg_day_hrv: number | null;
  days_in_7d_window: number;
  hrv_values?: Record<string, number>;
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
        avg_7d_night_hrv: 0,
        avg_7d_hrv: 0,
        avg_day_hrv: 0,
        days_in_7d_window: 0,
        updated_at: new Date().toISOString(),
      };

  // Format HRV values, showing "No data" if the value is null or not a number
  const checkData = (value: number | null) =>
    typeof value === "number" && !isNaN(value)
      ? `${value.toFixed(0)} ms`
      : "No data";

  // Prepare chart data from hrv_values
  // Convert hrv_values keys (seconds) to hours and minutes for X axis
  const hrvChartData = Object.entries(displayHRV.hrv_values || {}).map(
    ([sec, value]) => {
      const seconds = Number(sec);
      const minutes = Math.floor(seconds / 60); // minutes since midnight
      return {
        minutes,
        value: Number(value),
      };
    },
  );

  // Calculate min/max for Y-axis
  const numericValues = hrvChartData
    .map((d) => (typeof d.value === "number" ? d.value : null))
    .filter((v): v is number => v !== null && !isNaN(v));
  const minHRV = numericValues.length > 0 ? Math.min(...numericValues) : 0;
  const maxHRV = numericValues.length > 0 ? Math.max(...numericValues) : 100;

  return (
    <div
      className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!HRV ? "opacity-50" : ""}`}
    >
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

      {/* HRV chart */}
      <div className="rounded-xl shadow p-4 text-white border border-white/20 bg-[white]/5">
        <h3 className="mb-2 text-lg font-semibold">
          Last Night Heart Rate Variability Timeline
          {!displayHRV.hrv_values ? " (No data)" : ""}
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={hrvChartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="minutes"
              tickFormatter={(min) => {
                const h = Math.floor(min / 60);
                const m = min % 60;
                return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
              }}
              tick={{ fill: "#fff", fontSize: 12 }}
              stroke="#fff"
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minHRV, maxHRV]}
              tick={{ fill: "#ffffff", fontSize: 12 }}
              stroke="#ffffff"
            />
            <Tooltip
              formatter={(value) =>
                typeof value === "number"
                  ? `${value.toFixed(0)} ms`
                  : value != null
                    ? `${value} ms`
                    : "-"
              }
              labelFormatter={(label) => {
                const totalMinutes = Number(label);
                const h = Math.floor(totalMinutes / 60);
                const m = totalMinutes % 60;
                return `Time: ${h.toString().padStart(2, "0")}:${m
                  .toString()
                  .padStart(2, "0")}`;
              }}
              contentStyle={{
                borderRadius: "8px",
                backgroundColor: "#090828",
                border: "none",
                color: "#fff",
              }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
              wrapperStyle={{ minWidth: 120 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#e63946"
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="💓Last Night Average HRV"
          value={checkData(displayHRV.last_night_avg)}
        />
        <StatCard
          label="💓Last Night 5-min High HRV"
          value={checkData(displayHRV.last_night_5min_high)}
        />
        <StatCard
          label="💓Average Day HRV"
          value={checkData(displayHRV.avg_day_hrv)}
        />
        <StatCard
          label="💓7-Day Average Night HRV"
          value={
            displayHRV.days_in_7d_window < 7
              ? "Not enough data"
              : checkData(displayHRV.avg_7d_night_hrv)
          }
        />
        <StatCard
          label="💓7-Day Average HRV"
          value={
            displayHRV.days_in_7d_window < 7
              ? "Not enough data"
              : checkData(displayHRV.avg_7d_hrv)
          }
        />
      </div>
    </div>
  );
}
