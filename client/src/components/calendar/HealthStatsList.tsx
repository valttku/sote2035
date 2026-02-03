"use client";

type DayStatsEntry = {
  id: string;
  kind: string;
  source: string | null;
  data: unknown;
  created_at: string;
};

function labelForKind(kind: string) {
  switch (kind) {
    case "heart_daily":
      return "Heart";
    case "sleep_daily":
      return "Brain (Sleep)";
    case "stress_daily":
      return "Brain (Stress)";
    case "activity_daily":
      return "Legs (Activity)";
    case "resp_daily":
      return "Lungs (Respiration)";
    case "skin_temp_daily":
      return "Lungs (Skin Temp)";
    case "spo2_daily":
      return "Lungs (SpO₂)";
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
}: {
  entries: DayStatsEntry[];
}) {
  if (entries.length === 0) {
    return <p className="text-sm opacity-80">No health stats for this day.</p>;
  }

  return (
    <div className="space-y-3 h-96 overflow-y-auto">
      {entries.map((e) => (
        <div key={e.id} className="border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{labelForKind(e.kind)}</h3>
            <span className="text-xs opacity-70">{e.source ?? "unknown"}</span>
          </div>

          <div className="text-xs opacity-70 mb-2">
            {new Date(e.created_at).toLocaleString()}
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
