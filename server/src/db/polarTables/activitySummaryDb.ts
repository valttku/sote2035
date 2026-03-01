import { db } from "../db.js";
import { parsePolarDuration } from "./exercisesDb.js";

export type PolarActivitySummaryRow = {
  user_id: number;
  polar_activity_id: string;
  day_date: string;                      // YYYY-MM-DD
  calories: number | null;              // total calories
  active_calories: number | null;       // active calories only
  duration_in_seconds: number | null;   // active duration
  steps: number | null;
  active_steps: number | null;
  distance_in_meters: number | null;
  source: string;
};

// Maps Polar's activity-summary API response to a DB row.
// Polar activity summary response has: id, date, calories, active_calories,
// duration (ISO 8601), active_steps, steps, distance (meters)
export function mapPolarActivitySummaryToRow(
  user_id: number,
  a: any
): PolarActivitySummaryRow {
  return {
    user_id,
    polar_activity_id: String(a.id ?? a.date),
    day_date: a.date,
    calories: a.calories ?? null,
    active_calories: a.active_calories ?? null,
    duration_in_seconds: parsePolarDuration(a.duration),
    steps: a.steps ?? null,
    active_steps: a.active_steps ?? null,
    distance_in_meters: a.distance ?? null,
    source: "polar",
  };
}

export async function upsertPolarActivitySummary(row: PolarActivitySummaryRow) {
  if (!row || !row.day_date) return;

  await db.query(
    `INSERT INTO app.user_activity_summaries_polar
       (user_id, polar_activity_id, day_date, calories, active_calories,
        duration_in_seconds, steps, active_steps, distance_in_meters, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id, day_date)
     DO UPDATE SET
       polar_activity_id = EXCLUDED.polar_activity_id,
       calories = EXCLUDED.calories,
       active_calories = EXCLUDED.active_calories,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       steps = EXCLUDED.steps,
       active_steps = EXCLUDED.active_steps,
       distance_in_meters = EXCLUDED.distance_in_meters,
       updated_at = now()`,
    [
      row.user_id,
      row.polar_activity_id,
      row.day_date,
      row.calories,
      row.active_calories,
      row.duration_in_seconds,
      row.steps,
      row.active_steps,
      row.distance_in_meters,
      row.source,
    ]
  );
}
