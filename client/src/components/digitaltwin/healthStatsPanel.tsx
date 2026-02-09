"use client";
import React from "react";
import type { BodyPartId } from "./DigitalTwinClient";

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
type HealthMetrics = Record<string, string | number>;

export default function HealthClient({ selected, onClose, selectedDate }: Props) {
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

        const res = await fetch(
          `/api/v1/digitalTwin?date=${date}&part=${selected}`,
          { credentials: "include" },
        );

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
        <h1 className="text-2xl pb-2 pl-1 mb-2 border-b w-full">{TITLE[selected]}</h1>
        <button className="mb-5" onClick={onClose}>
          ✕
        </button>
      </div>

      {loading && <p className="opacity-80">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && Object.keys(metrics).length === 0 && (
        <p className="opacity-80 text-sm">No metrics for this day.</p>
      )}

      <ul className="min-h-[170px] pl-5">
        {Object.entries(metrics).map(([k, v]) => (
          <li className="list-disc" key={k}>
            <span>{k}: </span>
            {v}
          </li>
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
