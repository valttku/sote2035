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
import { useTranslation } from "@/i18n/LanguageProvider";

export type Dailies = {
  id: string;
  steps: number | null;
  floors_climbed: number | null;
  floors_climbed_goal: number | null;
  active_kilocalories: number | null;
  bmr_kilocalories: number | null;
  moderate_intensity_duration_in_seconds: number | null;
  vigorous_intensity_duration_in_seconds: number | null;
  weekly_intensity_total_seconds: number | null;
  intensity_duration_goal_in_seconds: number | null;
  distance_in_meters: number | null;
  avg_heart_rate: number | null;
  resting_heart_rate: number | null;
  max_heart_rate: number | null;
  avg_stress_level: number | null;
  steps_goal: number | null;
  body_battery_charged: number | null;
  body_battery_drained: number | null;
  heart_rate_samples: Record<string, number> | null;
  updated_at: string;
};

export function DailiesSection({ dailies }: { dailies?: Dailies }) {
  const displayData: Dailies = dailies || {
    id: "empty",
    steps: null,
    floors_climbed: null,
    floors_climbed_goal: null,
    active_kilocalories: null,
    bmr_kilocalories: null,
    moderate_intensity_duration_in_seconds: null,
    vigorous_intensity_duration_in_seconds: null,
    weekly_intensity_total_seconds: null,
    intensity_duration_goal_in_seconds: null,
    distance_in_meters: null,
    avg_heart_rate: null,
    resting_heart_rate: null,
    max_heart_rate: null,
    avg_stress_level: null,
    steps_goal: null,
    body_battery_charged: null,
    body_battery_drained: null,
    heart_rate_samples: null,
    updated_at: new Date().toISOString(),
  };

  // Check if value is null/undefined/empty string/NaN, show "No data".
  // Otherwise, format it if formatter is provided, else just convert to string
  const checkData = (
    value: number | string | null | undefined,
    formatter?: (v: number) => string,
  ) =>
    value !== null &&
    value !== undefined &&
    !(typeof value === "number" && isNaN(value))
      ? typeof value === "number" && formatter
        ? formatter(value)
        : String(value)
      : "No data";

  const formatMinutes = (seconds: number) => `${Math.round(seconds / 60)} min`;
  const formatDistance = (meters: number) => `${(meters / 1000).toFixed(2)} km`;
  const formatCalories = (kcal: number) => `${kcal} kcal`;
  const formatHeartRate = (hr: number) => `${hr} bpm`;
  const { t } = useTranslation()

  // Returns formatted string or null — used to conditionally render stat cards
  function fmt(value: number | null | undefined, formatter: (v: number) => string): string | null {
    if (value == null || isNaN(value)) return null;
    return formatter(value);
  }

  // Total calories — guard against null addends
  const totalCalories =
    displayData.active_kilocalories != null && displayData.bmr_kilocalories != null
      ? displayData.active_kilocalories + displayData.bmr_kilocalories
      : null;

  // ---- HEART RATE PARSING ----
  let hourlyData: { time: string; value: number | null }[] = [];
  let showLine = false;

  if (
    displayData.heart_rate_samples &&
    Object.keys(displayData.heart_rate_samples).length > 0
  ) {
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

  // Min/max for YAxis
  const numericValues = hourlyData
    .map((d) => (typeof d.value === "number" ? d.value : null))
    .filter((v): v is number => v !== null && !isNaN(v));
  const minHeartRate =
    numericValues.length > 0 ? Math.max(30, Math.min(...numericValues)) : 50;
  const maxHeartRate =
    numericValues.length > 0 ? Math.max(...numericValues, 210) : 120;

  return (
    <div
      className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!dailies ? "opacity-50" : ""}`}
    >
      <h1>
        {t.healthInsights.updatedAt}:{" "}
        {new Date(displayData.updated_at).toLocaleString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour12: false,
        })}
      </h1>

      {/* Heart rate chart — only shown when HR sample data exists (Garmin only) */}
      {showLine && (
      <div className="rounded-xl shadow p-4 text-white border border-white/20 bg-[white]/5">
        <h3 className="mb-2 text-lg font-semibold">
          {t.healthInsights.dailies.heartRateTimeline}
        </h3>
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
              domain={[minHeartRate, maxHeartRate]}
              tick={{ fill: "#ffffff", fontSize: 12 }}
              stroke="#ffffff"
            />
            <Tooltip
              formatter={(value) =>
                value !== null && value !== undefined ? `${value} bpm` : "-"
              }
              labelFormatter={(label) => `Time: ${label}`}
              contentStyle={{
                borderRadius: "8px",
                backgroundColor: "#090828",
                border: "none",
                color: "#ffffff",
              }}
              labelStyle={{ color: "#ffffff" }}
              itemStyle={{ color: "#ffffff" }}
              wrapperStyle={{ minWidth: 120 }}
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
      )}

      {/* Stat cards — only rendered when value is not null */}
      <div className="grid grid-cols-4 lg:grid-cols-6 gap-2">
        {displayData.steps != null && (
          <StatCard
            label={`👟${t.healthInsights.dailies.stats.steps}`}
            value={displayData.steps_goal != null ? `${displayData.steps} / ${displayData.steps_goal}` : String(displayData.steps)}
          />
        )}
        {fmt(displayData.distance_in_meters, formatDistance) && (
          <StatCard
            label={`🛣 ${t.healthInsights.dailies.stats.distance}`}
            value={fmt(displayData.distance_in_meters, formatDistance)!}
          />
        )}
        {displayData.floors_climbed != null && (
          <StatCard
            label={`🪜 ${t.healthInsights.dailies.stats.floorsClimbed}`}
            value={displayData.floors_climbed_goal != null ? `${displayData.floors_climbed} / ${displayData.floors_climbed_goal}` : String(displayData.floors_climbed)}
          />
        )}
        {fmt(displayData.active_kilocalories, formatCalories) && (
          <StatCard
            label={`🔥 ${t.healthInsights.dailies.stats.activeCalories}`}
            value={fmt(displayData.active_kilocalories, formatCalories)!}
          />
        )}
        {fmt(displayData.bmr_kilocalories, formatCalories) && (
          <StatCard
            label={`🔥 ${t.healthInsights.dailies.stats.bmrCalories}`}
            value={fmt(displayData.bmr_kilocalories, formatCalories)!}
          />
        )}
        {totalCalories != null && (
          <StatCard
            label={`🔥 ${t.healthInsights.dailies.stats.totalCalories}`}
            value={formatCalories(totalCalories)}
          />
        )}
        {fmt(displayData.moderate_intensity_duration_in_seconds, formatMinutes) && (
          <StatCard
            label={`⚡ ${t.healthInsights.dailies.stats.moderateExercise}`}
            value={fmt(displayData.moderate_intensity_duration_in_seconds, formatMinutes)!}
          />
        )}
        {fmt(displayData.vigorous_intensity_duration_in_seconds, formatMinutes) && (
          <StatCard
            label={`⚡ ${t.healthInsights.dailies.stats.vigorousExercise}`}
            value={fmt(displayData.vigorous_intensity_duration_in_seconds, formatMinutes)!}
          />
        )}
        {displayData.weekly_intensity_total_seconds != null && (
          <StatCard
            label={`⚡ ${t.healthInsights.dailies.stats.weeklyIntensity}`}
            value={displayData.intensity_duration_goal_in_seconds != null
              ? `${Math.round(displayData.weekly_intensity_total_seconds / 60)} / ${Math.round(displayData.intensity_duration_goal_in_seconds / 60)} min`
              : `${Math.round(displayData.weekly_intensity_total_seconds / 60)} min`}
          />
        )}
        {fmt(displayData.resting_heart_rate, formatHeartRate) && (
          <StatCard
            label={`❤️ ${t.healthInsights.dailies.stats.restingHeartRate}`}
            value={fmt(displayData.resting_heart_rate, formatHeartRate)!}
          />
        )}
        {fmt(displayData.avg_heart_rate, formatHeartRate) && (
          <StatCard
            label={`❤️ ${t.healthInsights.dailies.stats.avgHeartRate}`}
            value={fmt(displayData.avg_heart_rate, formatHeartRate)!}
          />
        )}
        {fmt(displayData.max_heart_rate, formatHeartRate) && (
          <StatCard
            label={`❤️ ${t.healthInsights.dailies.stats.maxHeartRate}`}
            value={fmt(displayData.max_heart_rate, formatHeartRate)!}
          />
        )}
      </div>
    </div>
  );
}
