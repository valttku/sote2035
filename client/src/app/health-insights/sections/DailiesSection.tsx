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

export type Dailies = {
  id: string;
  steps: number;
  floors_climbed: number;
  floors_climbed_goal: number;
  active_kilocalories: number;
  bmr_kilocalories: number;
  moderate_intensity_duration_in_seconds: number;
  vigorous_intensity_duration_in_seconds: number;
  weekly_intensity_total_seconds: number;
  intensity_duration_goal_in_seconds: number;
  distance_in_meters: number;
  avg_heart_rate: number;
  resting_heart_rate: number;
  max_heart_rate: number;
  avg_stress_level: number;
  steps_goal: number;
  body_battery_charged: number;
  body_battery_drained: number;
  heart_rate_samples: Record<string, number>;
  updated_at: string;
};

export function DailiesSection({ dailies }: { dailies?: Dailies }) {
  const emptyData = {
    id: "empty",
    steps: 0,
    floors_climbed: 0,
    floors_climbed_goal: 10,
    active_kilocalories: 0,
    bmr_kilocalories: 0,
    moderate_intensity_duration_in_seconds: 0,
    vigorous_intensity_duration_in_seconds: 0,
    weekly_intensity_total_seconds: 0,
    intensity_duration_goal_in_seconds: 1500,
    distance_in_meters: 0,
    avg_heart_rate: 0,
    resting_heart_rate: 0,
    max_heart_rate: 0,
    avg_stress_level: 0,
    steps_goal: 10000,
    body_battery_charged: 0,
    body_battery_drained: 0,
    heart_rate_samples: {},
    updated_at: new Date().toISOString(),
  };

  const displayData = dailies || emptyData;

  // ---- HEART RATE PARSING ----
  let hourlyData: { time: string; value: number | null }[] = [];
  let showLine = false;

  if (displayData.heart_rate_samples && Object.keys(displayData.heart_rate_samples).length > 0) {
    try {
      const samples =
        typeof displayData.heart_rate_samples === "string"
          ? JSON.parse(displayData.heart_rate_samples)
          : displayData.heart_rate_samples;

      const parsed = Object.entries(samples)
        .map(([sec, value]) => ({ second: Number(sec), value: Number(value) }))
        .filter((d) => d.second >= 0 && d.second <= 86400)
        .sort((a, b) => a.second - b.second);

      showLine = parsed.length > 0;

      for (let hour = 0; hour < 24; hour++) {
        const hourStart = hour * 3600;
        const hourEnd = hourStart + 3600;

        const samplesInHour = parsed.filter(
          (d) => d.second >= hourStart && d.second < hourEnd
        );

        const lastSample =
          samplesInHour.length > 0
            ? samplesInHour[samplesInHour.length - 1].value
            : null;

        hourlyData.push({ time: `${hour.toString().padStart(2, "0")}:00`, value: lastSample });
      }
    } catch {
      hourlyData = [];
    }
  } else {
    // If no samples, create empty hourly data
    for (let hour = 0; hour < 24; hour++) {
      hourlyData.push({ time: `${hour.toString().padStart(2, "0")}:00`, value: null });
    }
  }

  // Min/max for YAxis
  const numericValues = hourlyData
    .map((d) => (typeof d.value === "number" ? d.value : null))
    .filter((v): v is number => v !== null && !isNaN(v));
  const minHeartRate = numericValues.length > 0 ? Math.max(30, Math.min(...numericValues)) : 50;
  const maxHeartRate = numericValues.length > 0 ? Math.max(...numericValues, 210) : 120;

  return (
    <div className={`space-y-4 p-0 md:p-4 w-full ${!dailies ? "opacity-50" : ""}`}>
      
      <h1>
        Updated at:{" "}
        {new Date(displayData.updated_at).toLocaleString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour12: false,
        })}
      </h1>

      {/* Heart rate chart */}
      <div className="rounded-xl shadow p-4 mt-6 text-white border border-white/20 bg-[white]/5">
        <h3 className="mb-2 text-lg font-semibold">Daily Heart Rate Timeline</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={hourlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="time" tick={{ fill: "#ffffff", fontSize: 12 }} stroke="#ffffff" />
            <YAxis domain={[minHeartRate, maxHeartRate]} tick={{ fill: "#ffffff", fontSize: 12 }} stroke="#ffffff" />
            <Tooltip
              formatter={(value) => (value !== null && value !== undefined ? `${value} bpm` : "-")}
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{ backgroundColor: "#1e1c4f", border: "none", color: "#ffffff" }}
              labelStyle={{ color: "#ffffff" }}
              itemStyle={{ color: "#ffffff" }}
              wrapperStyle={{ minWidth: 120 }}
            />
            {showLine && <Line type="monotone" dataKey="value" stroke="#e63946" dot={false} connectNulls={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <StatCard label="Steps" value={`${displayData.steps} / ${displayData.steps_goal}`} icon="👟" />
        <StatCard label="Distance" value={`${(displayData.distance_in_meters / 1000).toFixed(2)} km`} icon="🛣" />
        <StatCard label="Floors Climbed" value={`${displayData.floors_climbed} / ${displayData.floors_climbed_goal}`} icon="🪜" />
        <StatCard label="Active Calories" value={`${displayData.active_kilocalories} kcal`} icon="🔥" />
        <StatCard label="BMR Calories" value={`${displayData.bmr_kilocalories} kcal`} icon="🔥" />
        <StatCard label="Total Calories" value={`${displayData.active_kilocalories + displayData.bmr_kilocalories} kcal`} icon="🔥" />
        <StatCard label="Mod. Exercise" value={`${(displayData.moderate_intensity_duration_in_seconds / 60).toFixed(0)} min`} icon="⚡" />
        <StatCard label="Vigorous Exercise" value={`${(displayData.vigorous_intensity_duration_in_seconds / 60).toFixed(0)} min`} icon="⚡" />
        <StatCard
          label="Weekly Intensity"
          value={`${(displayData.weekly_intensity_total_seconds / 60).toFixed(0)} / ${(displayData.intensity_duration_goal_in_seconds / 60).toFixed(0)} min`}
          icon="⚡"
        />
        <StatCard label="Rest Heart Rate" value={`${displayData.resting_heart_rate} bpm`} icon="❤️" />
        <StatCard label="Avg Heart Rate" value={`${displayData.avg_heart_rate} bpm`} icon="❤️" />
        <StatCard label="Max Heart Rate" value={`${displayData.max_heart_rate} bpm`} icon="❤️" />
      </div>
    </div>
  );
}