"use client";

import type { HealthStatsEntry } from "../types";
import { useTranslation } from "@/i18n/LanguageProvider";

// Function to return a translated label for each health stat kind
function labelForKind(kind: string, t?: any) {
  switch (kind) {
    case "heart_daily":
      return t?.calendar.heart ?? "Heart";
    case "sleep_daily":
      return t?.calendar.sleep ?? "Sleep";
    case "stress_daily":
      return t?.calendar.stress ?? "Stress";
    case "activity_daily":
      return t?.calendar.activity ?? "Activity";
    case "resp_daily":
      return t?.calendar.respiratory ?? "Respiratory";
    case "skin_temp_daily":
      return t?.calendar.skinTemp ?? "Skin Temp";
    case "manual_activity":
      return t?.calendar.manualActivity ?? "Manual Activity";
    default:
      return kind;
  }
}

// Pretty-print unknown values
function prettyValue(v: unknown) {
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
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
  const { t } = useTranslation(); // Get translation object

  // Show message when there are no health stats for this day
  if (entries.length === 0) {
    return (
      <p className="text-sm opacity-80">
        {t.calendar.noHealthStats ?? "No health stats for this day."}
      </p>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-96">
      {entries.map((e) => (
        <div key={e.id} className="border rounded-xl p-3">
          {/* Header: Health stat label + source */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-[#31c2d5]">
              {labelForKind(e.kind, t)}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">
                {e.source ?? t.calendar.unknown ?? "unknown"}
              </span>
              {e.kind === "manual_activity" && onDelete && (
                <button
                  onClick={() => onDelete(e.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  {t.calendar.deleteButton ?? "Delete"}
                </button>
              )}
            </div>
          </div>

          {/* Health stat data */}
          <div className="text-sm space-y-1">
            {typeof e.data === "object" && e.data !== null ? (
              Object.entries(e.data as Record<string, unknown>).map(([k, v]) => (
                <div key={k}>
                  <span className="font-semibold">
                    {t.calendar.fields[k as keyof typeof t.calendar.fields] ?? k}:
                    </span>
                  {prettyValue(v)}
                </div>
              ))
            ) : (
              <div>{prettyValue(e.data)}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
