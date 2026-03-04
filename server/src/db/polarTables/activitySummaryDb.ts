import { db } from "../db.js";
import { parsePolarDuration } from "./exercisesDb.js";

export type PolarActivitySummaryRow = {
  user_id: number;
  polar_activity_id: string;
  day_date: string;
  calories: number | null;
  active_calories: number | null;
  duration_in_seconds: number | null;
  steps: number | null;
  active_steps: number | null;
  distance_in_meters: number | null;
  source: string;
};

/**
 * Maps a Polar activity object to a DB row.
 *
 * The NON-TRANSACTIONAL endpoint (GET /v3/users/activities) — the one we use — returns:
 *   start_time     "2025-08-13T08:15:30"   (NOT a "date" field)
 *   end_time       "2025-08-13T23:59:59"
 *   active_duration "PT3H11M"              (ISO 8601, NOT "duration")
 *   calories        2500
 *   active_calories 1500
 *   steps           8823
 *   distance_from_steps  4590.53           (NOT "distance")
 *
 * The deprecated transactional endpoint used:
 *   date, duration, distance, active_steps
 *
 * We handle both so the webhook handler (which uses the newer endpoint) also works.
 */
export function mapPolarActivitySummaryToRow(
  user_id: number,
  a: any
): PolarActivitySummaryRow {
  // Date: new API has start_time; old transactional API has date
  const day_date: string =
    a.date ?? (a.start_time ? String(a.start_time).slice(0, 10) : null);

  // Duration: new API has active_duration (ISO 8601); old has duration
  const duration_in_seconds = parsePolarDuration(a.active_duration ?? a.duration);

  // Distance: new API has distance_from_steps; old has distance
  const distance_in_meters = a.distance_from_steps ?? a.distance ?? null;

  // ID: old API provides an id; new API has none — fall back to date string
  const polar_activity_id = String(a.id ?? day_date);

  return {
    user_id,
    polar_activity_id,
    day_date,
    calories: a.calories ?? null,
    active_calories: a.active_calories ?? null,
    duration_in_seconds,
    steps: a.steps ?? null,
    active_steps: a.active_steps ?? null,
    distance_in_meters,
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
