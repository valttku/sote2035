import { db } from "../db.js";

export type GarminHRVRow = {
  user_id: number;
  day_date: string;
  summary_id?: string | null;
  lastNightAvg?: number | null;
  lastNight5MinHigh?: number | null;
  startTimeOffsetInSeconds?: number | null;
  durationInSeconds?: number | null;
  hrvValues?: Record<string, number> | null;
  source?: string | null;
};

export function mapGarminHRVToRows(user_id: number, h: any): GarminHRVRow {
  return {
    user_id,
    day_date: h.calendarDate,
    summary_id: h.summaryId ?? null,
    lastNightAvg: h.lastNightAvg ?? null,
    lastNight5MinHigh: h.lastNight5MinHigh ?? null,
    startTimeOffsetInSeconds: h.startTimeOffsetInSeconds ?? null,
    durationInSeconds: h.durationInSeconds ?? null,
    hrvValues: h.hrvValues ?? null,
    source: h.source ?? "garmin",
  };
}

export async function upsertGarminHRV(row: GarminHRVRow) {
  if (!row) return;

  // Insert or update user metrics
  await db.query(
    `INSERT INTO app.user_hrv_garmin
       (user_id, day_date, summary_id, last_night_avg, last_night_5min_high, start_time_offset_in_seconds, duration_in_seconds, hrv_values, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, day_date)
     DO UPDATE SET
        summary_id = EXCLUDED.summary_id,
       last_night_avg = EXCLUDED.last_night_avg,
       last_night_5min_high = EXCLUDED.last_night_5min_high,
       start_time_offset_in_seconds = EXCLUDED.start_time_offset_in_seconds,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       hrv_values = EXCLUDED.hrv_values,
       source = EXCLUDED.source,
       updated_at = now()`,
    [
      row.user_id,
      row.day_date,
      row.summary_id,
      row.lastNightAvg,
      row.lastNight5MinHigh,
      row.startTimeOffsetInSeconds,
      row.durationInSeconds,
      row.hrvValues ? JSON.stringify(row.hrvValues) : null,
      row.source,
    ],
  );
}
