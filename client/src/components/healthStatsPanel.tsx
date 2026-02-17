"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";

export type BodyPartId = "brain" | "heart" | "lungs" | "legs";

type Props = {
  selected: BodyPartId;
  onClose: () => void;
  selectedDate?: string;
};

type HealthMetrics = Record<string, string | number>;

export default function HealthStatsPanel({selected, onClose, selectedDate}: Props) {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<HealthMetrics>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch metrics
  useEffect(() => {
    const controller = new AbortController();
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
    return () => controller.abort();
  }, [selected, selectedDate]);

  return (
    <div className="panel-animation ui-component-styles p-4 pt-2">
      <div className="flex justify-between items-center">
        {/* Use translation for body part name */}
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
        <p className="opacity-80 text-sm">{t.home.noMetrics}</p>
      )}

      {/* Metrics list */}
      <ul className="min-h-[170px] space-y-2 pr-5">
        {Object.entries(metrics).map(([key, value]) => {
          const isMetricObject =
            typeof value === "object" && value !== null && "value" in value;

          let displayValue = "";
          let status: "low" | "good" | "high" | undefined;
          let goalText = ""; // for tooltip

          if (isMetricObject) {
            const metric = value as {
              value: number;
              status?: string;
              goal?: { min: number; max: number };
            };
            displayValue = String(metric.value);
            status = metric.status as "low" | "good" | "high" | undefined;
            if (metric.goal?.min !== undefined && metric.goal?.max !== undefined) {
              goalText = `Range: ${metric.goal.min} - ${metric.goal.max}`;
            } else if (metric.goal?.min !== undefined) {
              goalText = `Min: ${metric.goal.min}`;
            } else if (metric.goal?.max !== undefined) {
              goalText = `Max: ${metric.goal.max}`;
            }
          } else {
            displayValue = String(value ?? "");
          }

          return (
            <li
              key={key}
              className="flex justify-between items-center pb-1 relative group"
            >
              <span className="font-medium">{key}</span>
              <div className="flex items-center gap-2">
                <span className="relative">
                  {displayValue}
                  {goalText && (
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max max-w-xs rounded bg-gray-700 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-pre-line z-10">
                      {goalText}
                    </span>
                  )}
                </span>

                {status && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      status === "good"
                        ? "bg-green-500/20 text-green-400"
                        : status === "low" || status === "high"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {status}
                  </span>
                )}
              </div>
            </li>
          );
        })}
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
