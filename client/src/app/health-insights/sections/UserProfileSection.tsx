"use client";
import { StatCard } from "../../../components/health-insights/StatCard";

export type UserProfile = {
  id: string;
  gender?: string;
  height?: number;
  weight?: number;
  vo2_max?: number;
  vo2_max_cycling?: number;
  fitness_age?: number;
  updated_at: string;
};

export function UserProfileSection({ profile }: { profile?: UserProfile }) {
  if (!profile) return null;
  return (
    <div className="space-y-4 p-0 md:p-4 w-full">
      <h1>
        <span>
          Updated at: {" "}
          {new Date(profile.updated_at).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour12: false,
          })}
        </span>
      </h1>

      {/* Body Composition Section */}
      <div className="mb-6">
        <h2 className="text-xl mb-2">Body Composition</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Gender"
            value={`${profile.gender ?? "-"}`}
            icon="👤"
          />
          <StatCard
            label="Height"
            value={`${profile.height ?? "-"} cm`}
            icon="📏"
          />
          <StatCard
            label="Weight"
            value={`${profile.weight ?? "-"} kg`}
            icon="⚖️"
          />
        </div>
      </div>

      {/* Metrics Section */}
      <div>
        <h2 className="text-xl mb-2">Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.vo2_max != null && (
            <StatCard
              label="VO2 Max (Run)"
              value={`${profile.vo2_max} ml/kg/min`}
              icon="🏃‍♂️"
            />
          )}

          {profile.vo2_max_cycling != null && (
            <StatCard
              label="VO2 Max (Cycling)"
              value={`${profile.vo2_max_cycling} ml/kg/min`}
              icon="🚴‍♂️"
            />
          )}

          {profile.fitness_age != null && (
            <StatCard
              label="Fitness Age"
              value={`${profile.fitness_age} years`}
              icon="🎂"
            />
          )}
        </div>
      </div>
    </div>
  );
}
