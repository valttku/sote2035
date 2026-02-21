"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";

export type BodyPartId = "brain" | "heart" | "lungs" | "legs";

type Props = {
  selected: BodyPartId;
  onClose: () => void;
  selectedDate?: string;
};

type MetricValue =
  | string
  | number
  | {
      value: string; // formatted
      rawValue: number;
      status?: "low" | "good" | "high";
      goal?: { min?: number; max?: number };
      avg7?: { raw: number; formatted: string };
    };

type HealthMetrics = Record<string, MetricValue>;

function StatusBadge({
  status,
}: {
  status: "low" | "good" | "high" | "undefined";
}) {
  const styles = {
    good: "bg-green-400/40 text-green-200",
    low: "bg-blue-500/50 text-blue-200",
    high: "bg-red-500/20 text-red-200",
    undefined: "bg-gray-200/20 text-gray-200",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full ${
        styles[status ?? "undefined"]
      }`}
    >
      {status}
    </span>
  );
}

function MetricRow({ label, value }: { label: string; value: MetricValue }) {
  const isObject =
    typeof value === "object" && value !== null && "value" in value;

  let displayValue = "";
  let status: "low" | "good" | "high" | "undefined" = "undefined";
  let tooltip = "";

  if (isObject) {
    displayValue = String(value.value);
    status = value.status ?? "undefined";

    if (value.goal) {
      if (value.goal.min != null && value.goal.max != null) {
        tooltip = `Range: ${value.goal.min} - ${value.goal.max}`;
      } else if (value.goal.min != null) {
        tooltip = `Min: ${value.goal.min}`;
      } else if (value.goal.max != null) {
        tooltip = `Max: ${value.goal.max}`;
      } else {
        tooltip = "No defined goal";
      }
    }
    if (tooltip) {
      tooltip += `\n7-day avg: ${value.avg7?.formatted ?? "N/A"}`;
    } else {
      tooltip = `7-day avg: ${value.avg7?.formatted ?? "N/A"}`;
    }
  } else {
    displayValue = String(value);
  }

  return (
    <li className="grid grid-cols-[50%_30%_1fr] items-start pb-2 gap-2">
      <span>{label}</span>
      <span>{displayValue}</span>
      {status ? (
        <span className="relative group/badge pr-0">
          <StatusBadge status={status} />
          {tooltip && (
            <span
              className="
                absolute 
                bottom-full 
                left-1/2 
                -translate-x-1/2 
                mb-0 
                min-w-[max-content] 
                rounded 
                bg-gray-700 
                text-white 
                text-xs 
                px-2 py-1 
                opacity-0 
                group-hover/badge:opacity-100 
                transition-opacity 
                whitespace-pre-line 
                cursor-pointer
                z-[1000]"
            >
              {tooltip}
            </span>
          )}
        </span>
      ) : (
        <span />
      )}
    </li>
  );
}

// Main component
export default function HealthStatsPanel({
  selected,
  onClose,
  selectedDate,
}: Props) {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<HealthMetrics>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch metrics
  useEffect(() => {
    async function fetchHealthMetrics() {
      setMetrics({});
      setError(null);
      setLoading(true);

      try {
        const date = selectedDate || new Date().toISOString().split("T")[0];
        const res = await fetch(`/api/v1/home?date=${date}&part=${selected}`, {
          credentials: "include",
        });

        if (!res.ok) {
          const bodyText = await res.text().catch(() => "");
          console.log("Status:", res.status, "Body:", bodyText);

          if (res.status === 401) {
            throw new Error("Unauthorized (401): please log in again.");
          }
          throw new Error(`Request failed (${res.status})`);
        }

        const data: unknown = await res.json();
        const metricsObj =
          typeof data === "object" && data !== null && "metrics" in data
            ? ((data as { metrics?: HealthMetrics }).metrics ?? {})
            : {};

        setMetrics(metricsObj);
      } catch (e: unknown) {
        console.error(e);
        setMetrics({});
        setError(e instanceof Error ? e.message : "Failed to load metrics");
      } finally {
        setLoading(false);
      }
    }

    fetchHealthMetrics();
  }, [selected, selectedDate]);

  return (
    <div className="panel-animation ui-component-styles p-4 pt-2">
      {/* Header with close button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl pb-2 pl-1 mb-2 border-b w-full">
          {t.home.bodyParts[selected]}
        </h1>
        <button className="mb-5" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Status messages */}
      {loading && <p className="opacity-80">{t.home.loading}</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && Object.keys(metrics).length === 0 && (
        <p className="opacity-80">{t.home.noMetrics}</p>
      )}

      {/* Metrics list */}
      <ul className="min-h-[170px] space-y-2">
        {Object.entries(metrics).map(([key, value]) => (
          <MetricRow key={key} label={key} value={value} />
        ))}
      </ul>

      {/* animation for panel */}
      <style jsx>{`
        .panel-animation {
          animation: fade 1s ease-in-out forwards;
        }
        @keyframes fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
