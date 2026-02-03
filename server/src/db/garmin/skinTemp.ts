import { db } from "../db.js";

export type GarminSkinTempRow = {
  user_id: number;
  day_date: string;
  summary_id?: string | null;
  avg_deviation_celsius?: number | null;
  duration_in_seconds?: number | null;
  start_time_in_seconds?: number | null;
  start_time_offset_in_seconds?: number | null;
};

export function mapGarminSkinTempToRow(user_id: number, s: any): GarminSkinTempRow {
  return {
    user_id,
    day_date: s.calendarDate,
    summary_id: s.summaryId ?? null,
    avg_deviation_celsius: s.avgDeviationCelsius ?? null,
    duration_in_seconds: s.durationInSeconds ?? null,
    start_time_in_seconds: s.startTimeInSeconds ?? null,
    start_time_offset_in_seconds: s.startTimeOffsetInSeconds ?? null,
  };
}

export async function upsertGarminSkinTemp(row: GarminSkinTempRow) {
  if (!row) return;

  await db.query(
    `INSERT INTO app.user_skin_temp_garmin
       (user_id, day_date, summary_id, avg_deviation_celsius, duration_in_seconds, start_time_in_seconds, start_time_offset_in_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, day_date)
     DO UPDATE SET
       summary_id = EXCLUDED.summary_id,
       avg_deviation_celsius = EXCLUDED.avg_deviation_celsius,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       start_time_in_seconds = EXCLUDED.start_time_in_seconds,
       start_time_offset_in_seconds = EXCLUDED.start_time_offset_in_seconds,
       updated_at = now()`,
    [
      row.user_id,
      row.day_date,
      row.summary_id,
      row.avg_deviation_celsius,
      row.duration_in_seconds,
      row.start_time_in_seconds,
      row.start_time_offset_in_seconds,
    ],
  );
}