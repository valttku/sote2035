"use client";
import { StatCard } from "../components/StatCard";
import { FaBed, FaLeaf, FaExclamationTriangle, FaFire } from "react-icons/fa";

export type Stress = {
  id: string;
  avg_stress_level: number;
  max_stress_level: number;
  stress_duration_in_seconds: number;
  rest_stress_duration_in_seconds: number;
  activity_stress_duration_in_seconds: number;
  low_stress_duration_in_seconds: number;
  medium_stress_duration_in_seconds: number;
  high_stress_duration_in_seconds: number;
  stress_qualifier: string;
};

// Helper to format seconds as hours and minutes"
function formatSecondsToHoursMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  let result = "";
  if (h > 0) result += `${h}h `;
  result += `${m}m`;
  return result;
}

export function StressSection({ stress }: { stress?: Stress }) {
  if (!stress) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl">Stress Summary </h2>
      <div className="flex-row items-start gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
          <StatCard
            label="Average stress level"
            value={`${stress.avg_stress_level} / 100`}
          />
          <StatCard
            label="Max stress level"
            value={`${stress.max_stress_level} / 100`}
          />
          <StatCard
            label="Total stress duration"
            value={formatSecondsToHoursMinutes(
              stress.stress_duration_in_seconds,
            )}
          />
          <StatCard
            label="Rest stress duration"
            value={formatSecondsToHoursMinutes(
              stress.rest_stress_duration_in_seconds,
            )}
            icon={<FaBed color="#3b82f6" size={16} />}
          />
          <StatCard
            label="Activity stress duration"
            value={formatSecondsToHoursMinutes(
              stress.activity_stress_duration_in_seconds,
            )}
          />
          <StatCard
            label="Low stress duration"
            value={formatSecondsToHoursMinutes(
              stress.low_stress_duration_in_seconds,
            )}
            icon={<FaLeaf color="#10b981" size={16} />}
          />
          <StatCard
            label="Medium stress duration"
            value={formatSecondsToHoursMinutes(
              stress.medium_stress_duration_in_seconds,
            )}
            icon={<FaExclamationTriangle color="#f59e0b" size={16} />}
          />
          <StatCard
            label="High stress duration"
            value={formatSecondsToHoursMinutes(
              stress.high_stress_duration_in_seconds,
            )}
            icon={<FaFire color="#ef4444" size={16} />}
          />
          <StatCard
            label="Stress qualifier"
            value={`${stress.stress_qualifier}`}
          />
        </div>
      </div>
    </div>
  );
}
