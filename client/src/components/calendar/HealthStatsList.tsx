"use client";

import type { HealthStatsEntry } from "./types";

function labelForKind(kind: string) {
  switch (kind) {
    case "heart_daily":
      return "Heart";
    case "sleep_daily":
      return "Brain";
    case "stress_daily":
      return "Brain";
    case "activity_daily":
      return "Legs";
    case "resp_daily":
      return "Lungs";
    case "skin_temp_daily":
      return "Lungs";
    case "manual_activity":
      return "Manual Activity";
    default:
      return kind;
  }
}

function prettyValue(v: unknown) {
  if (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  ) {
    return String(v);
  }
  return JSON.stringify(v);
}

export default function HealthStatsList({
  entries,
  onDelete,
}: {
  entries: HealthStatsEntry[];
  onDelete?: (id: string) => Promise<void>;
}) {
  if (entries.length === 0) {
    return <p className="text-sm opacity-80">No health stats for this day.</p>;
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-96">
      {entries.map((e) => (
        <div key={e.id} className="border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-[#31c2d5]">{labelForKind(e.kind)}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">{e.source ?? "unknown"}</span>
              {e.kind === "manual_activity" && onDelete && (
                <button
                  onClick={() => onDelete(e.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="text-sm space-y-1">
            {typeof e.data === "object" && e.data !== null ? (
              Object.entries(e.data as Record<string, unknown>).map(
                ([k, v]) => (
                  <div key={k}>
                    <span className="font-semibold">{k}: </span>
                    {prettyValue(v)}
                  </div>
                ),
              )
            ) : (
              <div>{prettyValue(e.data)}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
