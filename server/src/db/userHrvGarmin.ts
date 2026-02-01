import { db } from "./db.js";

export type GarminHrvRow = {
  user_id: number;
  day_date: string;
  summary_id?: string | null;
  last_night_avg?: number | null;
  last_night_5min_high?: number | null;
  start_time_offset_in_seconds?: number | null;
  duration_in_seconds?: number | null;
  start_time_in_seconds?: number | null;
  hrv_values?: Record<string, number> | null;
};

export function mapGarminHrvToRow(user_id: number, h: any): GarminHrvRow {
  return {
    user_id,
    day_date: h.calendarDate,
    summary_id: h.summaryId ?? null,
    last_night_avg: h.lastNightAvg ?? null,
    last_night_5min_high: h.lastNight5MinHigh ?? null,
    start_time_offset_in_seconds: h.startTimeOffsetInSeconds ?? null,
    duration_in_seconds: h.durationInSeconds ?? null,
    start_time_in_seconds: h.startTimeInSeconds ?? null,
    hrv_values: h.hrvValues ?? null,
  };
}

export async function upsertGarminHrv(row: GarminHrvRow) {
  if (!row) return;

  await db.query(
    `INSERT INTO app.user_hrv_garmin
       (user_id, day_date, summary_id, last_night_avg, last_night_5min_high,
        start_time_offset_in_seconds, duration_in_seconds, start_time_in_seconds, hrv_values)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, day_date)
     DO UPDATE SET
       summary_id = EXCLUDED.summary_id,
       last_night_avg = EXCLUDED.last_night_avg,
       last_night_5min_high = EXCLUDED.last_night_5min_high,
       start_time_offset_in_seconds = EXCLUDED.start_time_offset_in_seconds,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       start_time_in_seconds = EXCLUDED.start_time_in_seconds,
       hrv_values = EXCLUDED.hrv_values,
       updated_at = now()`,
    [
      row.user_id,
      row.day_date,
      row.summary_id,
      row.last_night_avg,
      row.last_night_5min_high,
      row.start_time_offset_in_seconds,
      row.duration_in_seconds,
      row.start_time_in_seconds,
      row.hrv_values ? JSON.stringify(row.hrv_values) : null,
    ],
  );
}