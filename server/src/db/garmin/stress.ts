import { db } from "../db.js";

export type GarminStressRow = {
  user_id: number;
  day_date: string;
  summary_id?: string | null;
  start_time_in_seconds?: number | null;
  start_time_offset_in_seconds?: number | null;
  duration_in_seconds?: number | null;
  max_stress_level?: number | null;
  average_stress_level?: number | null;
  time_offset_stress_level_values?: Record<string, number> | null;
  time_offset_body_battery_values?: Record<string, number> | null;
  body_battery_dynamic_feedback_event?: Record<string, any> | null;
  body_battery_activity_events?: any[] | null;
};

export function mapGarminStressToRow(user_id: number, s: any): GarminStressRow {
  // Derive day_date from startTimeInSeconds if calendarDate is not provided
  let day_date = s.calendarDate;
  if (!day_date && s.startTimeInSeconds) {
    const date = new Date(s.startTimeInSeconds * 1000);
    day_date = date.toISOString().split('T')[0];
  }

  return {
    user_id,
    day_date,
    summary_id: s.summaryId ?? null,
    start_time_in_seconds: s.startTimeInSeconds ?? null,
    start_time_offset_in_seconds: s.startTimeOffsetInSeconds ?? null,
    duration_in_seconds: s.durationInSeconds ?? null,
    max_stress_level: s.maxStressLevel ?? null,
    average_stress_level: s.averageStressLevel ?? null,
    time_offset_stress_level_values: s.timeOffsetStressLevelValues ?? null,
    time_offset_body_battery_values: s.timeOffsetBodyBatteryValues ?? null,
    body_battery_dynamic_feedback_event: s.bodyBatteryDynamicFeedbackEvent ?? null,
    body_battery_activity_events: s.bodyBatteryActivityEvents ?? null,
  };
}

export async function upsertGarminStress(row: GarminStressRow) {
  if (!row) return;

  await db.query(
    `INSERT INTO app.user_stress_garmin
       (user_id, day_date, summary_id, start_time_in_seconds, start_time_offset_in_seconds,
        duration_in_seconds, max_stress_level, average_stress_level, time_offset_stress_level_values,
        time_offset_body_battery_values, body_battery_dynamic_feedback_event, body_battery_activity_events)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (user_id, day_date)
     DO UPDATE SET
       summary_id = EXCLUDED.summary_id,
       start_time_in_seconds = EXCLUDED.start_time_in_seconds,
       start_time_offset_in_seconds = EXCLUDED.start_time_offset_in_seconds,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       max_stress_level = EXCLUDED.max_stress_level,
       average_stress_level = EXCLUDED.average_stress_level,
       time_offset_stress_level_values = EXCLUDED.time_offset_stress_level_values,
       time_offset_body_battery_values = EXCLUDED.time_offset_body_battery_values,
       body_battery_dynamic_feedback_event = EXCLUDED.body_battery_dynamic_feedback_event,
       body_battery_activity_events = EXCLUDED.body_battery_activity_events,
       updated_at = now()`,
    [
      row.user_id,
      row.day_date,
      row.summary_id,
      row.start_time_in_seconds,
      row.start_time_offset_in_seconds,
      row.duration_in_seconds,
      row.max_stress_level,
      row.average_stress_level,
      row.time_offset_stress_level_values ? JSON.stringify(row.time_offset_stress_level_values) : null,
      row.time_offset_body_battery_values ? JSON.stringify(row.time_offset_body_battery_values) : null,
      row.body_battery_dynamic_feedback_event ? JSON.stringify(row.body_battery_dynamic_feedback_event) : null,
      row.body_battery_activity_events ? JSON.stringify(row.body_battery_activity_events) : null,
    ],
  );
}