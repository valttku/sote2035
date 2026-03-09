"use client";

import { useTranslation } from "@/i18n/LanguageProvider";
import { Translations } from "@/i18n/types";

// Health entry from the backend
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

// Convert backend kind to a readable label with translation
function labelForKind(kind: string, t?: Translations) {
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
    case "nightly_recharge":
      return "Nightly Recharge";
    case "manual_activity":
      return t?.calendar.manualActivity ?? "Manual Activity";
    default:
      return kind;
  }
}

// Format value for a specific health stat key
function formatHealthStatValue(key: string, value: unknown) {
  // Intense exercise values (seconds to minutes)
  if (
    (key === "Intense exercise this week" ||
      key === "Intense exercise today") &&
    typeof value === "number"
  ) {
    return Math.round(value / 60) + " min";
  }
  // Total sleep (seconds to hours/minutes)
  if (key === "Total sleep" && typeof value === "number") {
    const mins = Math.round(value / 60);
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
  // Distance (meters to km)
  if (key === "Distance" && typeof value === "number") {
    return (value / 1000).toFixed(2) + " km";
  }
  // Heart rate (bpm)
  if (
    (key === "Resting heart rate" || key === "Average heart rate") &&
    typeof value === "number"
  ) {
    return Math.round(value) + " bpm";
  }
  // HRV (ms)
  if (key === "Overnight average HRV" && typeof value === "number") {
    return Math.round(value) + " ms";
  }
  // Energy (kcal)
  if (key === "Total energy expenditure" && typeof value === "number") {
    return Math.round(value) + " kcal";
  }
  // Respiratory rate (brpm)
  if (key === "Average respiratory rate" && typeof value === "number") {
    return value.toFixed() + " brpm";
  }
  // Default: pretty print
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

// Show a list of health entries
export default function HealthStatsList({entries, onDelete}: {
  entries: HealthStatsEntry[];
  onDelete?: (id: string) => Promise<void>;
}) {
  const { t } = useTranslation();

  // Define expected kinds to ensure consistent display, even if some are missing from API response
  const expectedKinds = [
    "heart_daily",
    "sleep_daily",
    "stress_daily",
    "activity_daily",
    "resp_daily",
  ];

  // Ensure all expected kinds are shown, even if missing from API response
  const mergedEntries = expectedKinds.map((kind) => {
    const existing = entries.find((e) => e.kind === kind);
    if (existing) return existing;

    return {
      id: `placeholder-${kind}`,
      kind,
      source: null,
      data: null,
      created_at: "",
    };
  });

  // Also include any entries whose kind is not in expectedKinds (e.g. manual_activity, nightly_recharge)
  const extraEntries = entries.filter((e) => !expectedKinds.includes(e.kind));
  const allEntries = [...mergedEntries, ...extraEntries];

  return (
    <div className="space-y-3 overflow-y-auto max-h-96">
      {/* Map each health stat entry to a card with details */ }
      {allEntries.map((e) => (
        <div key={e.id} className="border rounded-xl p-3">
          
          {/* Header: Health stat label + source + delete */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-[#31c2d5]">
              {labelForKind(e.kind, t)}
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">
                {e.source ?? t.calendar.unknown ?? "unknown"}
              </span>

              {/* Show delete button for manual activities */ }
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
          <div className="text-sm space-y-1 mt-1">
            {e.data === null ? (
              <div className="text-sm opacity-60">
                {t.calendar.noData ?? "No data"}
              </div>
            ) : typeof e.data === "object" ? (
              Object.entries(e.data as Record<string, unknown>).map(
                ([k, v]) => (
                  <div key={k}>
                    <span className="font-semibold">
                      {t.calendar.fields[k as keyof typeof t.calendar.fields] ??
                        k}
                      :
                    </span>{" "}
                    {formatHealthStatValue(k, v)}
                  </div>
                ),
              )
            ) : (
              <div>{formatHealthStatValue("", e.data)}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
