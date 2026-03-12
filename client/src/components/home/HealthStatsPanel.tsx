"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";

export type BodyPartId = "brain" | "heart" | "lungs" | "legs";

type Props = {
  selected: BodyPartId;
  onClose: () => void;
  selectedDate?: string;
};

type MetricValue = string | number | {
  value: string;
  rawValue: number;
  status?: "low" | "good" | "high";
  goal?: { min?: number; max?: number };
  avg7?: { raw: number; formatted: string };
};

type HealthMetrics = Record<string, MetricValue>;

function normalizeMetricKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toLowerCase());
}

function StatusBadge({status}: {status: "low" | "good" | "high" | "undefined";}) {
  const { t } = useTranslation();
  const styles = {
    good: "bg-green-400/40 text-green-200",
    low: "bg-blue-500/50 text-blue-200",
    high: "bg-red-500/20 text-red-200",
    undefined: "bg-gray-200/20 text-gray-200",
  };

  // Show "No status" for undefined
  const displayText = status === "undefined" ? "no_status" : status;

  return (
    <span
      className={`inline-flex whitespace-nowrap px-2 py-0.5 text-xs rounded-full cursor-pointer ${styles[status]}`}
    >
      {t.home.status[displayText]}
    </span>
  );
}

function MetricRow({ label, value }: { label: string; value: MetricValue }) {
  const { t } = useTranslation();

  const isObject =
    typeof value === "object" && value !== null && "value" in value;

  let displayValue = "";
  let status: "low" | "good" | "high" | "undefined" = "undefined";
  let tooltip = t.home.tooltip.noGoal;

  if (isObject) {
    displayValue = String(value.value);
    status = value.status ?? "undefined";

    if (value.goal) {
      if (value.goal.min != null && value.goal.max != null) {
        tooltip = `${t.home.tooltip.range}: ${value.goal.min} - ${value.goal.max}`;
      } else if (value.goal.min != null) {
        tooltip = `${t.home.tooltip.min}: ${value.goal.min}`;
      } else if (value.goal.max != null) {
        tooltip = `${t.home.tooltip.max}: ${value.goal.max}`;
      }
    }

    tooltip += `\n${t.home.tooltip.sevenDayAvg}: ${
      value.avg7?.formatted ?? t.home.tooltip.insufficientData
    }`;
  } else {
    displayValue = String(value);
  }

  return (
    <li className="grid grid-cols-[50%_30%_1fr] items-start pb-2 gap-2">
      <span className="min-w-0 break-words">{label}</span>
      <span className="min-w-0 break-words">{displayValue}</span>
      <span className="relative group/badge pr-0">
        <StatusBadge status={status} />
        {tooltip && (
          <span
            className="
              absolute
              top-1/2
              -translate-y-1/2
              right-full
              mr-2
              min-w-[max-content]
              rounded
              bg-white/95
              border
              border-gray-300
              p-2
              text-black
              text-sm
              px-2 py-1
              opacity-0
              group-hover/badge:opacity-100
              transition-opacity
              whitespace-pre-line
              z-[1000]"
          >
            {tooltip}
          </span>
        )}
      </span>
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
          if (res.status === 401) {
            setError(t.home.noMetrics);
            return;
          }

          setError(t.home.noMetrics);
          return;
        }

        //  Correct place to parse response
        const data = await res.json();

        type ApiResponse = {
          metrics?: HealthMetrics;
        };

        const metricsObj =
          data && typeof data === "object" && "metrics" in data
            ? ((data as ApiResponse).metrics ?? {})
            : {};

        setMetrics(metricsObj);
      } catch (e) {
        console.error(e);
        setMetrics({});
        setError(t.home.noMetrics);
      } finally {
        setLoading(false);
      }
    }

    fetchHealthMetrics();
  }, [selected, selectedDate, t.home.noMetrics]);

  return (
    <div className="panel-animation ui-component-styles backdrop-blur-3xl p-4 pt-2 overflow-x-hidden">
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
          <MetricRow
            key={key}
            label={
              (t.home.metrics as Record<string, string>)?.[
                normalizeMetricKey(key)
              ] || key
            } // ⭐ Translation happens here
            value={value}
          />
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
