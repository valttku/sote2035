import { db } from "../db.js";

// Parses ISO 8601 duration strings like "PT2H44M" or "PT42M14.993S" into seconds
export function parsePolarDuration(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?$/);
  if (!match) return null;
  const hours = parseFloat(match[1] || "0");
  const minutes = parseFloat(match[2] || "0");
  const seconds = parseFloat(match[3] || "0");
  return Math.round(hours * 3600 + minutes * 60 + seconds);
}

export type PolarExerciseRow = {
  user_id: number;
  polar_exercise_id: string;       // e.g. "2AC312F"
  day_date: string;                // YYYY-MM-DD derived from start_time
  start_time: string | null;       // ISO datetime from Polar
  start_time_utc_offset: number | null;
  duration_in_seconds: number | null;
  calories: number | null;
  distance_in_meters: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  sport: string | null;
  detailed_sport_info: string | null;
  training_load: number | null;
  device: string | null;
  device_id: string | null;
  has_route: boolean | null;
  upload_time: string | null;
  source: string;
};

// Maps the raw Polar exercise API response to a DB row
export function mapPolarExerciseToRow(user_id: number, e: any): PolarExerciseRow {
  // Polar start_time is like "2008-10-13T10:40:02" (local time without timezone)
  // We extract the date portion for day_date
  const dayDate = e.start_time ? e.start_time.slice(0, 10) : null;

  return {
    user_id,
    polar_exercise_id: String(e.id),
    day_date: dayDate,
    start_time: e.start_time ?? null,
    start_time_utc_offset: e.start_time_utc_offset ?? null,
    duration_in_seconds: parsePolarDuration(e.duration),
    calories: e.calories ?? null,
    distance_in_meters: e.distance ?? null,           // Polar returns meters
    avg_heart_rate: e.heart_rate?.average ?? null,
    max_heart_rate: e.heart_rate?.maximum ?? null,
    sport: e.sport ?? null,
    detailed_sport_info: e.detailed_sport_info ?? null,
    training_load: e.training_load ?? null,
    device: e.device ?? null,
    device_id: e.device_id ?? null,
    has_route: e.has_route ?? null,
    upload_time: e.upload_time ?? null,
    source: "polar",
  };
}

export async function upsertPolarExercise(row: PolarExerciseRow) {
  if (!row || !row.polar_exercise_id) return;

  await db.query(
    `INSERT INTO app.user_exercises_polar
       (user_id, polar_exercise_id, day_date, start_time, start_time_utc_offset,
        duration_in_seconds, calories, distance_in_meters,
        avg_heart_rate, max_heart_rate, sport, detailed_sport_info,
        training_load, device, device_id, has_route, upload_time, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     ON CONFLICT (user_id, polar_exercise_id)
     DO UPDATE SET
       day_date = EXCLUDED.day_date,
       start_time = EXCLUDED.start_time,
       start_time_utc_offset = EXCLUDED.start_time_utc_offset,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       calories = EXCLUDED.calories,
       distance_in_meters = EXCLUDED.distance_in_meters,
       avg_heart_rate = EXCLUDED.avg_heart_rate,
       max_heart_rate = EXCLUDED.max_heart_rate,
       sport = EXCLUDED.sport,
       detailed_sport_info = EXCLUDED.detailed_sport_info,
       training_load = EXCLUDED.training_load,
       device = EXCLUDED.device,
       device_id = EXCLUDED.device_id,
       has_route = EXCLUDED.has_route,
       upload_time = EXCLUDED.upload_time,
       updated_at = now()`,
    [
      row.user_id,
      row.polar_exercise_id,
      row.day_date,
      row.start_time,
      row.start_time_utc_offset,
      row.duration_in_seconds,
      row.calories,
      row.distance_in_meters,
      row.avg_heart_rate,
      row.max_heart_rate,
      row.sport,
      row.detailed_sport_info,
      row.training_load,
      row.device,
      row.device_id,
      row.has_route,
      row.upload_time,
      row.source,
    ]
  );
}
