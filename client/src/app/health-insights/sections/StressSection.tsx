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
  // Always render the wheel, even if no data
  const empty =
    !stress ||
    (stress.rest_stress_duration_in_seconds === 0 &&
      stress.low_stress_duration_in_seconds === 0 &&
      stress.medium_stress_duration_in_seconds === 0 &&
      stress.high_stress_duration_in_seconds === 0);

  // Use zeros for all segments if empty
  const rest = empty
    ? 25
    : (stress.rest_stress_duration_in_seconds /
        (stress.rest_stress_duration_in_seconds +
          stress.low_stress_duration_in_seconds +
          stress.medium_stress_duration_in_seconds +
          stress.high_stress_duration_in_seconds || 1)) *
      100;
  const low = empty
    ? 25
    : (stress.low_stress_duration_in_seconds /
        (stress.rest_stress_duration_in_seconds +
          stress.low_stress_duration_in_seconds +
          stress.medium_stress_duration_in_seconds +
          stress.high_stress_duration_in_seconds || 1)) *
      100;
  const med = empty
    ? 25
    : (stress.medium_stress_duration_in_seconds /
        (stress.rest_stress_duration_in_seconds +
          stress.low_stress_duration_in_seconds +
          stress.medium_stress_duration_in_seconds +
          stress.high_stress_duration_in_seconds || 1)) *
      100;
  const high = empty
    ? 25
    : (stress.high_stress_duration_in_seconds /
        (stress.rest_stress_duration_in_seconds +
          stress.low_stress_duration_in_seconds +
          stress.medium_stress_duration_in_seconds +
          stress.high_stress_duration_in_seconds || 1)) *
      100;

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const center = 150;
  const svgSize = 300;

  const toDash = (pct: number) => (pct / 100) * circumference;

  const restDash = toDash(rest);
  const lowDash = toDash(low);
  const medDash = toDash(med);
  const highDash = toDash(high);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      style={{
        maxWidth: "100%",
        maxHeight: 340,
        minWidth: 180,
        minHeight: 180,
        display: "block",
        margin: "0 auto",
      }}
      className="mx-auto"
    >
      {/* Background ring */}
      <circle
        r={radius}
        cx={center}
        cy={center}
        fill="transparent"
        stroke="#22223b"
        strokeWidth="22"
      />

      {/* Rest */}
      <circle
        r={radius}
        cx={center}
        cy={center}
        fill="transparent"
        stroke="#3b82f6"
        strokeWidth="22"
        strokeDasharray={`${restDash} ${circumference}`}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ filter: "drop-shadow(0 0 8px #3b82f6aa)" }}
      />

      {/* Low */}
      <circle
        r={radius}
        cx={center}
        cy={center}
        fill="transparent"
        stroke="#10b981"
        strokeWidth="22"
        strokeDasharray={`${lowDash} ${circumference}`}
        transform={`rotate(${-90 + (rest / 100) * 360} ${center} ${center})`}
        style={{ filter: "drop-shadow(0 0 8px #10b981aa)" }}
      />

      {/* Medium */}
      <circle
        r={radius}
        cx={center}
        cy={center}
        fill="transparent"
        stroke="#f59e0b"
        strokeWidth="22"
        strokeDasharray={`${medDash} ${circumference}`}
        transform={`rotate(${-90 + ((rest + low) / 100) * 360} ${center} ${center})`}
        style={{ filter: "drop-shadow(0 0 8px #f59e0baa)" }}
      />

      {/* High */}
      <circle
        r={radius}
        cx={center}
        cy={center}
        fill="transparent"
        stroke="#ef4444"
        strokeWidth="22"
        strokeDasharray={`${highDash} ${circumference}`}
        transform={`rotate(${-90 + ((rest + low + med) / 100) * 360} ${center} ${center})`}
        style={{ filter: "drop-shadow(0 0 8px #ef4444aa)" }}
      />

      {/* Center value */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontWeight="bold"
        fontSize="44"
        style={{ textShadow: "0 2px 12px #000a" }}
      >
        {stress?.avg_stress_level ?? 0}
        <tspan x={center} dy="38" fontSize="22" fontWeight="normal">
          Overall
        </tspan>
      </text>
    </svg>
  );
}

export function StressSection({ stress }: { stress?: Stress }) {
  const hasData = !!stress;

  const displayStress: Stress = hasData
    ? stress!
    : {
        id: "empty",
        avg_stress_level: 0,
        stress_qualifier: "unknown",
        stress_duration_in_seconds: 0,
        rest_stress_duration_in_seconds: 0,
        low_stress_duration_in_seconds: 0,
        medium_stress_duration_in_seconds: 0,
        high_stress_duration_in_seconds: 0,
        updated_at: new Date().toISOString(),
      };

  // Show "No data" if value is null/undefined/empty string/NaN
  const checkData = (value: string | number | null | undefined): string =>
    value !== null && value !== undefined && value !== "" && !(typeof value === "number" && isNaN(value))
      ? String(value)
      : "No data";
  
  return (
    <div className={`flex flex-col p-0 md:p-4 w-full h-full space-y-4 ${!stress ? "opacity-50" : ""}`}>
      <h1>
        <span>
          Updated at:{" "}
          {new Date(displayStress.updated_at).toLocaleString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour12: false,
          })}
        </span>
      </h1>

      <div className="flex flex-row items-center gap-4 h-full rounded-xl border border-white/20 p-4">
        <div className="flex-shrink-0 w-1/2 my-auto">
        <StressWheelSVG stress={displayStress} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-1/2">
          <StatCard
            label="Stress duration"
            value={checkData(formatSecondsToHoursMinutes(
              displayStress.stress_duration_in_seconds,
            ))}
          />

          <StatCard
            label="Stress qualifier"
            value={checkData(displayStress.stress_qualifier)}
          />

          <StatCard
            label="Rest stress duration"
            value={checkData(formatSecondsToHoursMinutes(
              displayStress.rest_stress_duration_in_seconds,
            ))}
            icon={<FaCircle color="#3b82f6" size={16} />}
          />

          <StatCard
            label="Low stress duration"
            value={checkData(formatSecondsToHoursMinutes(
              displayStress.low_stress_duration_in_seconds,
            ))}
            icon={<FaCircle color="#10b981" size={16} />}
          />

          <StatCard
            label="Medium stress duration"
            value={checkData(formatSecondsToHoursMinutes(
              displayStress.medium_stress_duration_in_seconds,
            ))}
            icon={<FaCircle color="#f59e0b" size={16} />}
          />

          <StatCard
            label="High stress duration"
            value={checkData(formatSecondsToHoursMinutes(
              displayStress.high_stress_duration_in_seconds,
            ))}
            icon={<FaCircle color="#ef4444" size={16} />}
          />
        </div>
      </div>
    </div>
  );
}
