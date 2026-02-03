import { db } from "../db.js";

export type GarminMoveIQRow = {
  user_id: number;
  day_date: string;
  summary_id?: string | null;
  device_name?: string | null;
  start_time_in_seconds?: number | null;
  duration_in_seconds?: number | null;
  activity_type?: string | null;
  activity_sub_type?: string | null;
  offset_in_seconds?: number | null;
};

export function mapGarminMoveIQToRow(user_id: number, m: any): GarminMoveIQRow {
  return {
    user_id,
    day_date: m.calendarDate,
    summary_id: m.summaryId ?? null,
    device_name: m.deviceName ?? null,
    start_time_in_seconds: m.startTimeInSeconds ?? null,
    duration_in_seconds: m.durationInSeconds ?? null,
    activity_type: m.activityType ?? null,
    activity_sub_type: m.activitySubType ?? null,
    offset_in_seconds: m.offsetInSeconds ?? null,
  };
}

export async function upsertGarminMoveIQ(row: GarminMoveIQRow) {
  if (!row) return;

  await db.query(
    `INSERT INTO app.user_move_iq_garmin
       (user_id, day_date, summary_id, device_name, start_time_in_seconds,
        duration_in_seconds, activity_type, activity_sub_type, offset_in_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id, summary_id)
     DO UPDATE SET
       day_date = EXCLUDED.day_date,
       device_name = EXCLUDED.device_name,
       start_time_in_seconds = EXCLUDED.start_time_in_seconds,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       activity_type = EXCLUDED.activity_type,
       activity_sub_type = EXCLUDED.activity_sub_type,
       offset_in_seconds = EXCLUDED.offset_in_seconds,
       updated_at = now()`,
    [
      row.user_id,
      row.day_date,
      row.summary_id,
      row.device_name,
      row.start_time_in_seconds,
      row.duration_in_seconds,
      row.activity_type,
      row.activity_sub_type,
      row.offset_in_seconds,
    ],
  );
}