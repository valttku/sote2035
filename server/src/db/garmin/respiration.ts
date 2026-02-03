import { db } from "../db.js";

export type GarminRespirationRow = {
  user_id: number;
  day_date: string;
  summary_id?: string | null;
  start_time_in_seconds?: number | null;
  duration_in_seconds?: number | null;
  start_time_offset_in_seconds?: number | null;
  time_offset_epoch_to_breaths?: Record<string, number> | null;
};

export function mapGarminRespirationToRow(user_id: number, r: any): GarminRespirationRow {
  return {
    user_id,
    day_date: r.calendarDate,
    summary_id: r.summaryId ?? null,
    start_time_in_seconds: r.startTimeInSeconds ?? null,
    duration_in_seconds: r.durationInSeconds ?? null,
    start_time_offset_in_seconds: r.startTimeOffsetInSeconds ?? null,
    time_offset_epoch_to_breaths: r.timeOffsetEpochToBreaths ?? null,
  };
}

export async function upsertGarminRespiration(row: GarminRespirationRow) {
  if (!row) return;

  await db.query(
    `INSERT INTO app.user_respiration_garmin
       (user_id, day_date, summary_id, start_time_in_seconds, duration_in_seconds,
        start_time_offset_in_seconds, time_offset_epoch_to_breaths)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, day_date, summary_id)
     DO UPDATE SET
       start_time_in_seconds = EXCLUDED.start_time_in_seconds,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       start_time_offset_in_seconds = EXCLUDED.start_time_offset_in_seconds,
       time_offset_epoch_to_breaths = EXCLUDED.time_offset_epoch_to_breaths,
       updated_at = now()`,
    [
      row.user_id,
      row.day_date,
      row.summary_id,
      row.start_time_in_seconds,
      row.duration_in_seconds,
      row.start_time_offset_in_seconds,
      row.time_offset_epoch_to_breaths ? JSON.stringify(row.time_offset_epoch_to_breaths) : null,
    ],
  );
}