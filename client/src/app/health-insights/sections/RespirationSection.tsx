"use client";
import { StatCard } from "../../../components/health-insights/StatCard";
import { FaWind } from "react-icons/fa";

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

  const displayRespiration: Respiration = hasData
    ? respiration!
    : {
        id: "empty",
        min_respiration: 0,
        avg_respiration: 0,
        max_respiration: 0,
        updated_at: new Date().toISOString(),
      };

  return (
    <div className={`space-y-4 p-0 md:p-4 w-full ${!respiration ? "opacity-50" : ""}`}>
      <h1>
        <span>
          Updated at:{" "}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Min Respiration Rate"
          value={`${displayRespiration.min_respiration.toFixed(1)} brpm`}
          icon={<FaWind color="#60a5fa" size={16} />}
        />
        <StatCard
          label="Avg Respiration Rate"
          value={`${displayRespiration.avg_respiration.toFixed(1)} brpm`}
          icon={<FaWind color="#60a5fa" size={16} />}
        />
        <StatCard
          label="Max Respiration Rate"
          value={`${displayRespiration.max_respiration.toFixed(1)} brpm`}
          icon={<FaWind color="#60a5fa" size={16} />}
        />
      </div>
    </div>
  );
}
