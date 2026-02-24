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
  const hasData = !!profile;

  // Default values if no profile
  const data = {
    gender: profile?.gender ?? "-",
    height: profile?.height ?? null,
    weight: profile?.weight ?? null,
    vo2_max: profile?.vo2_max ?? null,
    vo2_max_cycling: profile?.vo2_max_cycling ?? null,
    fitness_age: profile?.fitness_age ?? null,
    updated_at: profile?.updated_at ?? new Date().toISOString(),
  };

  return (
    <div className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!profile ? "opacity-50" : ""}`}>
      <h1>
        <span>
          Updated at:{" "}
          {new Date(data.updated_at).toLocaleString(undefined, {
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
        <h1 className="text-md mb-2">Body Composition</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Gender" value={data.gender} icon="👤" />
          <StatCard
            label="Height"
            value={data.height ? `${data.height} cm` : "-"}
            icon="📏"
          />
          <StatCard
            label="Weight"
            value={data.weight ? `${data.weight} kg` : "-"}
            icon="⚖️"
          />
        </div>
      </div>

      {/* Metrics Section */}
      <div>
        <h1 className="text-md mb-2">Fitness</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="VO2 Max (Run)"
            value={data.vo2_max ? `${data.vo2_max} ml/kg/min` : "-"}
            icon="🏃‍♂️"
          />
          <StatCard
            label="VO2 Max (Cycling)"
            value={data.vo2_max_cycling ? `${data.vo2_max_cycling} ml/kg/min` : "-"}
            icon="🚴‍♂️"
          />
          <StatCard
            label="Fitness Age"
            value={data.fitness_age ? `${data.fitness_age} years` : "-"}
            icon="🎂"
          />
        </div>
      </div>
    </div>
  );
}