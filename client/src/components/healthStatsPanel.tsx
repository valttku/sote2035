"use client";
import { useEffect, useState } from "react";

export type BodyPartId = "brain" | "heart" | "lungs" | "legs";

type Props = {
  selected: BodyPartId;
  onClose: () => void;
  selectedDate?: string;
};

type HealthMetrics = Record<string, string | number>;

export default function HealthStatsPanel({
  selected,
  onClose,
  selectedDate,
}: Props) {
  const [metrics, setMetrics] = useState<HealthMetrics>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        <h1 className="text-2xl pb-2 pl-1 mb-2 border-b w-full">
          {selected.charAt(0).toUpperCase() + selected.slice(1)}
        </h1>
        <button className="mb-5" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Status messages */}
      {loading && <p className="opacity-80">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && Object.keys(metrics).length === 0 && (
        <p className="opacity-80 text-sm">No metrics for this day.</p>
      )}

      {/* Metrics list */}
      <ul className="min-h-[170px] space-y-2 pr-5">
        {Object.entries(metrics).map(([key, value]) => {
          const isMetricObject =
            typeof value === "object" && value !== null && "value" in value;

          const displayKey = key;
          let displayValue = "";
          let status: "low" | "good" | "high" | undefined;

          if (isMetricObject) {
            const metric = value as {
              value: number;
              status?: string;
            };

            displayValue = String(metric.value);
            status = metric.status as "low" | "good" | "high" | undefined;
          } else {
            displayValue = String(value ?? "");
          }

          return (
            <li key={key} className="flex justify-between items-center pb-1">
              <span className="font-medium">{displayKey}</span>
              <div className="flex items-center gap-2">
                <span>{displayValue}</span>

                {status && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      status === "good"
                        ? "bg-green-500/20 text-green-400"
                        : status === "low"
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