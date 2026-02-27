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
  // Default values if no profile
  const data = {
    gender: profile?.gender ?? "No data",
    height: profile?.height ?? null,
    weight: profile?.weight ?? null,
    vo2_max: profile?.vo2_max ?? null,
    vo2_max_cycling: profile?.vo2_max_cycling ?? null,
    fitness_age: profile?.fitness_age ?? null,
    updated_at: profile?.updated_at ?? new Date().toISOString(),
  };

  // Check for missing/null/NaN values and optionally format them
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

  // Formatters
  const formatHeight = (v: number) => `${v} cm`;
  const formatWeight = (v: number) => `${v} kg`;
  const formatVO2 = (v: number) => `${v} ml/kg/min`;
  const formatFitnessAge = (v: number) => `${v} years`;

  return (
    <div
      className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!profile ? "opacity-50" : ""}`}
    >
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
          <StatCard label="👤Gender" value={data.gender} />
          <StatCard
            label="📏Height"
            value={checkData(data.height, formatHeight)}
          />
          <StatCard
            label="⚖️Weight"
            value={checkData(data.weight, formatWeight)}
          />
        </div>
      </div>

      {/* Metrics Section */}
      <div>
        <h1 className="text-md mb-2">Fitness</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="🏃‍♂️VO2 Max (Run)"
            value={checkData(data.vo2_max, formatVO2)}
          />
          <StatCard
            label="🚴‍♂️VO2 Max (Cycling)"
            value={checkData(data.vo2_max_cycling, formatVO2)}
          />
          <StatCard
            label="🎂Fitness Age"
            value={checkData(data.fitness_age, formatFitnessAge)}
          />
        </div>
      </div>
    </div>
  );
}
