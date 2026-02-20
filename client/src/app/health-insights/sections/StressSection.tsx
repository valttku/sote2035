"use client";
import { StatCard } from "../../../components/health-insights/StatCard";
import { FaCircle } from "react-icons/fa";

export type Stress = {
  id: string;
  avg_stress_level: number;
  stress_qualifier: string;
  stress_duration_in_seconds: number;
  rest_stress_duration_in_seconds: number;
  low_stress_duration_in_seconds: number;
  medium_stress_duration_in_seconds: number;
  high_stress_duration_in_seconds: number;
  updated_at: string;
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

export function StressWheelSVG({ stress }: { stress?: Stress }) {
  if (!stress) return null;

  const total =
    stress.rest_stress_duration_in_seconds +
    stress.low_stress_duration_in_seconds +
    stress.medium_stress_duration_in_seconds +
    stress.high_stress_duration_in_seconds;

  if (total === 0) return null;

  const rest = (stress.rest_stress_duration_in_seconds / total) * 100;
  const low = (stress.low_stress_duration_in_seconds / total) * 100;
  const med = (stress.medium_stress_duration_in_seconds / total) * 100;
  const high = (stress.high_stress_duration_in_seconds / total) * 100;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  const toDash = (pct: number) => (pct / 100) * circumference;

  const restDash = toDash(rest);
  const lowDash = toDash(low);
  const medDash = toDash(med);
  const highDash = toDash(high);

  return (
    <svg width="180" height="180" viewBox="0 0 160 160" className="mx-auto p-2">
      {/* Background ring */}
      <circle
        r={radius}
        cx="80"
        cy="80"
        fill="transparent"
        stroke="#e5e7eb"
        strokeWidth="0"
      />

      {/* Rest */}
      <circle
        r={radius}
        cx="80"
        cy="80"
        fill="transparent"
        stroke="#3b82f6"
        strokeWidth="15"
        strokeDasharray={`${restDash} ${circumference}`}
        transform="rotate(-90 80 80)"
      />

      {/* Low */}
      <circle
        r={radius}
        cx="80"
        cy="80"
        fill="transparent"
        stroke="#10b981"
        strokeWidth="15"
        strokeDasharray={`${lowDash} ${circumference}`}
        transform={`rotate(${-90 + (rest / 100) * 360} 80 80)`}
      />

      {/* Medium */}
      <circle
        r={radius}
        cx="80"
        cy="80"
        fill="transparent"
        stroke="#f59e0b"
        strokeWidth="15"
        strokeDasharray={`${medDash} ${circumference}`}
        transform={`rotate(${-90 + ((rest + low) / 100) * 360} 80 80)`}
      />

      {/* High */}
      <circle
        r={radius}
        cx="80"
        cy="80"
        fill="transparent"
        stroke="#ef4444"
        strokeWidth="15"
        strokeDasharray={`${highDash} ${circumference}`}
        transform={`rotate(${-90 + ((rest + low + med) / 100) * 360} 80 80)`}
      />

      {/* Center value */}
      <text
        x="80"
        y="80"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
      >
        <tspan x="80" dy="-5" fontSize="24" fontWeight="bold">
          {stress.avg_stress_level}
        </tspan>
        <tspan x="80" dy="18" fontSize="16">
          Overall
        </tspan>
      </text>
    </svg>
  );
}

export function StressSection({ stress }: { stress?: Stress }) {
  if (!stress) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl">
        Stress Summary{" "}
        <span className="text-sm font-normal">
          (updated at{" "}
          {new Date(stress.updated_at).toLocaleString(undefined, {
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

      <div className="flex flex-row items-start gap-2">
        <div className="flex flex-col gap-2 w-full">
          <StressWheelSVG stress={stress} />

          <StatCard
            label="Stress duration"
            value={formatSecondsToHoursMinutes(
              stress.stress_duration_in_seconds,
            )}
          />

          <StatCard label="Stress qualifier" value={stress.stress_qualifier} />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <StatCard
            label="Rest stress duration"
            value={formatSecondsToHoursMinutes(
              stress.rest_stress_duration_in_seconds,
            )}
            icon={<FaCircle color="#3b82f6" size={16} />}
          />
          <StatCard
            label="Low stress duration"
            value={formatSecondsToHoursMinutes(
              stress.low_stress_duration_in_seconds,
            )}
            icon={<FaCircle color="#10b981" size={16} />}
          />
          <StatCard
            label="Medium stress duration"
            value={formatSecondsToHoursMinutes(
              stress.medium_stress_duration_in_seconds,
            )}
            icon={<FaCircle color="#f59e0b" size={16} />}
          />
          <StatCard
            label="High stress duration"
            value={formatSecondsToHoursMinutes(
              stress.high_stress_duration_in_seconds,
            )}
            icon={<FaCircle color="#ef4444" size={16} />}
          />
        </div>
      </div>
    </div>
  );
}
