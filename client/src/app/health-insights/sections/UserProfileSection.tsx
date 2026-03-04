"use client";
import { StatCard } from "../../../components/health-insights/StatCard";
import { useTranslation } from "@/i18n/LanguageProvider";

export type UserProfile = {
  id: string;
  gender?: string;
  height?: number;
  weight?: number;
  birthday?: string;
  vo2_max?: number;
  vo2_max_cycling?: number;
  fitness_age?: number;
  updated_at: string;
};

export function UserProfileSection({ profile }: { profile?: UserProfile }) {

  const  { t } = useTranslation();
  // Default values if no profile
  const data = {
    gender: profile?.gender ?? t.healthInsights.noData,
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
      : t.healthInsights.noData;

  // Formatters
  const formatHeight = (v: number) => `${v} cm`;
  const formatWeight = (v: number) => `${v} kg`;
  const formatVO2 = (v: number) => `${v} ml/kg/min`;
  const formatFitnessAge = (v: number) => `${v} years`;

  // Utility to calculate age from birthday
  const calculateAge = (birthday: string | undefined) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--; // hasn't had birthday yet this year
    }
    return age;
  };

  // Utility to calculate body mass index (BMI)
  function calculateBMI(
    weightKg: number | null,
    heightCm: number | null,
  ): number | null {
    if (!weightKg || !heightCm) return null; // missing data
    const heightM = heightCm / 100; // convert cm to meters
    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10; // round to 1 decimal
  }

  return (
    <div
      className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!profile ? "opacity-50" : ""}`}
    >
      <h1>
        <span>
          {t.healthInsights.updatedAt}:{" "}
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

      {/* Basic Info Section */}
      <h1 className="text-md mb-2">{t.healthInsights.profile.basicInfo}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label={`🎂${t.healthInsights.profile.age}`}
          value={checkData(
            calculateAge(profile?.birthday),
            (v) => `${v} years`,
          )}
        />
        <StatCard label={`👤${t.healthInsights.profile.gender}`}
        value={checkData(data.gender)} />
      </div>

      {/* Body Composition Section */}
      <h1 className="text-md mb-2">{t.healthInsights.profile.bodyComposition}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label={`📏${t.healthInsights.profile.height}`}
          value={checkData(data.height, formatHeight)}
        />
        <StatCard
          label={`⚖️${t.healthInsights.profile.weight}`}
          value={checkData(data.weight, formatWeight)}
        />

        <StatCard label={t.healthInsights.profile.bmi} value={checkData(calculateBMI(data.weight, data.height))} />
      </div>

      {/* Metrics Section */}

      <h1 className="text-md mb-2">{t.healthInsights.profile.fitness}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label={`🎂${t.healthInsights.profile.fitnessAge}`}
          value={checkData(data.fitness_age, formatFitnessAge)}
        />
        <StatCard
          label={`🏃‍♂️${t.healthInsights.profile.vo2Run}`}
          value={checkData(data.vo2_max, formatVO2)}
        />
        <StatCard
          label={`🚴‍♂️${t.healthInsights.profile.vo2Cycling}`}
          value={checkData(data.vo2_max_cycling, formatVO2)}
        />
      </div>
    </div>
  );
}
