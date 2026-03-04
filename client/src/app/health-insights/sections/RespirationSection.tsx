"use client";
import { StatCard } from "../../../components/health-insights/StatCard";
import { useTranslation } from "@/i18n/LanguageProvider";

export type Respiration = {
  id: string;
  min_respiration: number;
  max_respiration: number;
  avg_respiration: number;
  updated_at: string;
};

export function RespirationSection({
  respiration,
}: {
  respiration?: Respiration;
}) {
  const hasData = !!respiration;
  const  { t } = useTranslation();

  const displayRespiration: Respiration = hasData
    ? respiration!
    : {
        id: "empty",
        min_respiration: 0,
        avg_respiration: 0,
        max_respiration: 0,
        updated_at: new Date().toISOString(),
      };

  // Show "No data" if value is 0 or NaN, otherwise show the value with units
  const checkData = (value: string | number | null | undefined) =>
    value === null || value === undefined || isNaN(Number(value))
      ? "No data"
      : `${Number(value).toFixed(0)} brpm`;

  return (
    <div className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!respiration ? "opacity-50" : ""}`}>
      <h1>
        <span>
          {t.healthInsights.respiration.title}:{" "}
          {new Date(displayRespiration.updated_at).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour12: false,
          })}
        </span>
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label={`🌬️${t.healthInsights.respiration.minRespirationRate}`}
          value={checkData(displayRespiration.min_respiration)}
        />
        <StatCard
          label={`🌬️${t.healthInsights.respiration.avgRespirationRate}`}
          value={checkData(displayRespiration.avg_respiration)}
        />
        <StatCard
          label={`🌬️${t.healthInsights.respiration.maxRespirationRate}`}
          value={checkData(displayRespiration.max_respiration)}
        />
      </div>
    </div>
  );
}
