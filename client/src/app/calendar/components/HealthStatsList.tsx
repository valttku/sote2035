"use client";

// One health entry from the backend
export type HealthStatsEntry = {
  id: string;
  kind: string;
  source: string | null;
  data: unknown;
  created_at: string;
};

// API response for a day
export type HealthStatsResponse = {
  date: string;
  entries: HealthStatsEntry[];
};

// Convert backend kind to a readable label
function labelForKind(kind: string) {
  switch (kind) {
    case "heart_daily":
      return "Heart Data";
    case "sleep_daily":
      return "Sleep Data";
    case "stress_daily":
      return "Stress Data";
    case "activity_daily":
      return "Activity Data";
    case "resp_daily":
      return "Respiration Data";
    case "manual_activity":
      return "Manual Activity Entry";
    default:
      return kind;
  }
}

// Convert value to string for display
function prettyValue(v: unknown) {
  if (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  ) {
    return String(v);
  }
  return JSON.stringify(v); // fallback for objects
}

// Show a list of health entries
export default function HealthStatsList({
  entries,
  onDelete,
}: {
  entries: HealthStatsEntry[];
  onDelete?: (id: string) => Promise<void>; // optional delete function
}) {
  if (entries.length === 0) {
    return <p className="text-sm opacity-80">No health stats for this day.</p>;
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-96">
      {/* Header: kind label + source + optional delete for manual activities */}
      {entries.map((e) => (
        <div key={e.id} className="border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-[#31c2d5]">
              {labelForKind(e.kind)}
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">
                {e.source ?? "unknown"}
              </span>
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

          {/* Data rows */}
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
