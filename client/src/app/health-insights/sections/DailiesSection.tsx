"use client";
import { StatCard } from "../../../components/StatCard";

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
  updated_at: string;
};

export function DailiesSection({ dailies }: { dailies?: Dailies }) {
  if (!dailies) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl">
        Daily Summary{" "}
        <span className="text-sm font-normal">
          (updated at{" "}
          {new Date(dailies.updated_at).toLocaleString(undefined, {
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
          value={`${(dailies.moderate_intensity_duration_in_seconds / 60).toFixed(0)} min`}
          icon="⚡"
        />
        <StatCard
          label="Vigorous Exercise"
          value={`${(dailies.vigorous_intensity_duration_in_seconds / 60).toFixed(0)} min`}
          icon="⚡"
        />

        <StatCard
          label="Weekly Exercise"
          value={`${(dailies.weekly_intensity_total_seconds / 60).toFixed(0)} 
          / ${(dailies.intensity_duration_goal_in_seconds / 60).toFixed(0)} min`}
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
