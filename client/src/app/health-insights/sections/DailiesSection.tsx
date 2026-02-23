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
  heart_rate_samples: any;
  updated_at: string;
};

export function DailiesSection({ dailies }: { dailies?: Dailies }) {
  if (!dailies) return null;

  // ---- HEART RATE PARSING (CORRECTED) ----
  let hourlyData: { time: string; value: number | null }[] = [];
  let showLine = false;

  if (dailies.heart_rate_samples) {
    try {
      const samples =
        typeof dailies.heart_rate_samples === "string"
          ? JSON.parse(dailies.heart_rate_samples)
          : dailies.heart_rate_samples;

      // Convert to numeric + sort properly
      const parsed = Object.entries(samples)
        .map(([sec, value]) => ({
          second: Number(sec),
          value: Number(value),
        }))
        .filter((d) => d.second >= 0 && d.second <= 86400)
        .sort((a, b) => a.second - b.second);

      showLine = parsed.length > 0;

      // Build 24-hour timeline
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = hour * 3600;
        const hourEnd = hourStart + 3600;

        const samplesInHour = parsed.filter(
          (d) => d.second >= hourStart && d.second < hourEnd,
        );

        const lastSample =
          samplesInHour.length > 0
            ? samplesInHour[samplesInHour.length - 1].value
            : null;

        hourlyData.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          value: lastSample,
        });
      }
    } catch {
      hourlyData = [];
    }
  }

  return (
    <div className="space-y-4 p-0 md:p-4 w-full">
      <h1>
        Updated at:{" "}
        {new Date(dailies.updated_at).toLocaleString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour12: false,
        })}
      </h1>

      {/* ---- HEART RATE CHART ---- */}
      <div className="rounded-xl shadow p-4 mt-6 text-white border border-white/20 bg-[white]/5">
        <h3 className="mb-2 text-lg font-semibold">Daily Timeline</h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={hourlyData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="time"
              tick={{ fill: "#ffffff", fontSize: 12 }}
              stroke="#ffffff"
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#ffffff", fontSize: 12 }}
              stroke="#ffffff"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e1c4f",
                border: "none",
                color: "#ffffff",
              }}
              labelStyle={{ color: "#ffffff" }}
              itemStyle={{ color: "#ffffff" }}
            />
            {showLine && (
              <Line
                type="monotone"
                dataKey="value"
                stroke="#e63946"
                dot={false}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ---- STAT CARDS ---- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        <StatCard
          label="Steps"
          value={`${dailies.steps} / ${dailies.steps_goal}`}
          icon="👟"
        />
        <StatCard
          label="Distance"
          value={`${(dailies.distance_in_meters / 1000).toFixed(2)} km`}
          icon="🛣"
        />
        <StatCard
          label="Floors Climbed"
          value={`${dailies.floors_climbed} / ${dailies.floors_climbed_goal}`}
          icon="🪜"
        />
        <StatCard
          label="Active Calories"
          value={`${dailies.active_kilocalories} kcal`}
          icon="🔥"
        />
        <StatCard
          label="BMR Calories"
          value={`${dailies.bmr_kilocalories} kcal`}
          icon="🔥"
        />
        <StatCard
          label="Total Calories"
          value={`${dailies.active_kilocalories + dailies.bmr_kilocalories} kcal`}
          icon="🔥"
        />
        <StatCard
          label="Mod. Exercise"
          value={`${(
            dailies.moderate_intensity_duration_in_seconds / 60
          ).toFixed(0)} min`}
          icon="⚡"
        />
        <StatCard
          label="Vigorous Exercise"
          value={`${(
            dailies.vigorous_intensity_duration_in_seconds / 60
          ).toFixed(0)} min`}
          icon="⚡"
        />
        <StatCard
          label="Weekly Intensity"
          value={`${(dailies.weekly_intensity_total_seconds / 60).toFixed(
            0,
          )} / ${(dailies.intensity_duration_goal_in_seconds / 60).toFixed(
            0,
          )} min`}
          icon="⚡"
        />
        <StatCard
          label="Rest Heart Rate"
          value={`${dailies.resting_heart_rate} bpm`}
          icon="❤️"
        />
        <StatCard
          label="Avg Heart Rate"
          value={`${dailies.avg_heart_rate} bpm`}
          icon="❤️"
        />
        <StatCard
          label="Max Heart Rate"
          value={`${dailies.max_heart_rate} bpm`}
          icon="❤️"
        />
      </div>
    </div>
  );
}
