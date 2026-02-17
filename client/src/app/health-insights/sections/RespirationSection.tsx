"use client";
import { StatCard } from "../components/StatCard";
import { FaWind } from "react-icons/fa";

export type Respiration = {
  id: string;
  min_respiration: number;
  max_respiration: number;
  avg_respiration: number;
};

export function RespirationSection({
  respiration,
}: {
  respiration?: Respiration;
}) {
  if (!respiration) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl">Respiration Summary</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Min Respiration Rate"
          value={`${respiration.min_respiration.toFixed(1)} brpm`}
          icon={<FaWind color="#60a5fa" size={16} />}
        />
        <StatCard
          label="Avg Respiration Rate"
          value={`${respiration.avg_respiration.toFixed(1)} brpm`}
          icon={<FaWind color="#60a5fa" size={16} />}
        />
        <StatCard
          label="Max Respiration Rate"
          value={`${respiration.max_respiration.toFixed(1)} brpm`}
          icon={<FaWind color="#60a5fa" size={16} />}
        />
      </div>
    </div>
  );
}
