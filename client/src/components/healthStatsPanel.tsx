"use client";
import React from "react";

export type BodyPartId = "brain" | "heart" | "lungs" | "legs";

type Props = {
  selected: BodyPartId;
  onClose: () => void;
  selectedDate?: string;
};

const TITLE: Record<BodyPartId, string> = {
  brain: "Brain",
  heart: "Heart",
  lungs: "Lungs",
  legs: "Legs",
};

/*Get health data from database */
type MetricValue =
  | string
  | number
  | {
      value?: number;
      goal?: number;
      status?: "low" | "normal" | "high" | string;
      avg?: number;
      min?: number;
      max?: number;
      deviationPercent?: number;
      [key: string]: any;
    };

type HealthMetrics = Record<string, MetricValue>;

export default function HealthStatsPanel({
  selected,
  onClose,
  selectedDate,
}: Props) {
  const [metrics, setMetrics] = React.useState<HealthMetrics>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    async function fetchHealthMetrics() {
      setLoading(true);
      setError(null);
      setMetrics({});

      try {
        const date = selectedDate || new Date().toISOString().split("T")[0];

        const res = await fetch(`/api/v1/home?date=${date}&part=${selected}`, {
          credentials: "include",
        });

        if (!res.ok) {
          // Read body ONCE only in the error case
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
        if (e instanceof DOMException && e.name === "AbortError") return;

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
          {TITLE[selected]}
        </h1>
        <button className="mb-5" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Loading / error / no data states */}
      {loading && <p className="opacity-80">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && Object.keys(metrics).length === 0 && (
        <p className="opacity-80 text-sm">No metrics for this day.</p>
      )}

      {/* Metrics list */}
      <ul className="min-h-[170px]">
        {Object.entries(metrics).map(([k, v]) => {
          const isObj = typeof v === "object" && v !== null;

          function statusBadge(status?: string) {
            if (status === "low")
              return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800";
            if (status === "high")
              return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800";
            return "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800";
          }

          const vAny = v as any;

          const valueDisplay = (() => {
            if (
              isObj &&
              typeof vAny.value === "number" &&
              typeof vAny.goal === "number"
            ) {
              return `${vAny.value} / ${vAny.goal}`;
            }
            if (isObj && typeof vAny.value === "number") return vAny.value;
            if (!isObj) return v;
            return vAny.value ?? "—";
          })();

          return (
            <li className="mb-3" key={k}>
              <div className="flex items-start justify-between">
                <div className="w-40 font-medium">
                  {k}
                  {typeof vAny.weeklyTotal === "number" &&
                    vAny.weeklyTotal > 0 && (
                      <div className="mt-1">
                        Intensity minutes (weekly total):{" "}
                        {Math.round(vAny.weeklyTotal)} min
                      </div>
                    )}
                  {typeof vAny.weeklyGoal === "number" &&
                    vAny.weeklyGoal > 0 && (
                      <div className="mt-1">
                        Intensity minutes (weekly goal):{" "}
                        {Math.round(vAny.weeklyGoal)} min
                      </div>
                    )}
                </div>

                <div className="flex-1">
                  {/* Value + status badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <div className="text-lg font-semibold">
                        {typeof valueDisplay === "number"
                          ? valueDisplay
                          : String(valueDisplay)}
                      </div>
                    </div>

                    {isObj && typeof vAny.status === "string" && (
                      <div className="ml-2">
                        <span className={statusBadge(vAny.status)}>
                          {vAny.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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
