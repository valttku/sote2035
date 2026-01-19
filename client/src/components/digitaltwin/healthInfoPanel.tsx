"use client";
import React from "react";
import type { BodyPartId } from "./twinView";

type Props = {
  selected: BodyPartId;
  onClose: () => void;
};

const TITLE: Record<BodyPartId, string> = {
  brain: "Brain",
  heart: "Heart",
  lungs: "Lungs",
  legs: "Legs",
};

/*Get health data from database */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
type HealthMetrics = Record<string, string | number>;

export default function HealthClient({ selected, onClose }: Props) {
  const [metrics, setMetrics] = React.useState<HealthMetrics>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchHealthMetrics() {
      setLoading(true);
      setError(null);

      try {
        const date = "2026-01-18"; // example date, replace with actual date as needed

        const url = `${API_BASE}/api/v1/digitalTwin?date=${date}&part=${selected}`;
        console.log("Fetching:", url);

        const response = await fetch(url);
        const text = await response.text();
        console.log("Status:", response.status, "Body:", text);

        if (!response.ok)
          throw new Error(`Request failed (${response.status})`);

        const data = JSON.parse(text);
        if (!cancelled) setMetrics(data.metrics ?? {});
      } catch (e: unknown) {
        console.error(e);
        const message =
          e instanceof Error ? e.message : "Failed to load metrics";
        if (!cancelled) setError(message);
        if (!cancelled) setMetrics({});
      } finally {
        if (!cancelled) setLoading(false);
        {
          loading && <p className="opacity-80">Loading…</p>;
        }
        {
          error && <p className="text-red-400">{error}</p>;
        }
      }
    }

    fetchHealthMetrics();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  return (
    <div className="panel-animation ui-component-styles p-4 pt-2 rounded-2xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl mb-2">{TITLE[selected]}</h1>
        <button className="mb-5" onClick={onClose}>
          ✕
        </button>
      </div>

      <ul>
        {Object.entries(metrics).map(([k, v]) => (
          <li key={k}>
            <span className="font-semibold">{k}: </span>
            {v}
          </li>
        ))}
      </ul>

      {/* animation for panel */}
      <style jsx>{`
        .panel-animation {
          animation: fade 0.3s ease-in-out forwards;
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
