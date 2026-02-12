import { db } from "../db.js";

export type GarminStressRow = {
  user_id: number;
  day_date: string;        // from calendarDate
  summary_id: string;

  start_time_in_seconds?: number;
  start_time_offset_in_seconds?: number;
  duration_in_seconds?: number;

  max_stress_level?: number;
  average_stress_level?: number;

  //time_offset_stress_level_values?: any;
  //time_offset_body_battery_values?: any;
  //body_battery_dynamic_feedback_event?: any;
  //body_battery_activity_events?: any;

  source?: string;
};

// Map Garmin payload to DB row
export function mapGarminStressToRow(user_id: number, s: any): GarminStressRow {
  return {
    user_id,
    day_date: s.calendarDate,
    summary_id: s.summaryId,
    start_time_in_seconds: s.startTimeInSeconds ?? null,
    start_time_offset_in_seconds: s.startTimeOffsetInSeconds ?? null,
    duration_in_seconds: s.durationInSeconds ?? null,
    max_stress_level: s.maxStressLevel ?? null,
    average_stress_level: s.averageStressLevel ?? null,
    //time_offset_stress_level_values: s.timeOffsetStressLevelValues ?? null,
    //time_offset_body_battery_values: s.timeOffsetBodyBatteryValues ?? null,
    //body_battery_dynamic_feedback_event: s.bodyBatteryDynamicFeedbackEvent ?? null,
    //body_battery_activity_events: s.bodyBatteryActivityEvents ?? null,
    source: s.source ?? "garmin",
  };
}

// Upsert function
export async function upsertGarminStress(row: GarminStressRow) {
  if (!row) return;

  const columns = [
    "user_id",
    "day_date",
    "summary_id",
    "start_time_in_seconds",
    "start_time_offset_in_seconds",
    "duration_in_seconds",
    "max_stress_level",
    "average_stress_level",
    //"time_offset_stress_level_values",
    //"time_offset_body_battery_values",
    //"body_battery_dynamic_feedback_event",
    //"body_battery_activity_events",
    "source",
  ];

  const values = [
    row.user_id,
    row.day_date,
    row.summary_id,
    row.start_time_in_seconds,
    row.start_time_offset_in_seconds,
    row.duration_in_seconds,
    row.max_stress_level,
    row.average_stress_level,
    //row.time_offset_stress_level_values ? JSON.stringify(row.time_offset_stress_level_values) : null,
    //row.time_offset_body_battery_values ? JSON.stringify(row.time_offset_body_battery_values) : null,
    //row.body_battery_dynamic_feedback_event ? JSON.stringify(row.body_battery_dynamic_feedback_event) : null,
    //row.body_battery_activity_events ? JSON.stringify(row.body_battery_activity_events) : null,
    row.source,
  ];

  await db.query(
    `
    INSERT INTO app.user_stress_garmin (${columns.join(",")})
    VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")})
    ON CONFLICT (user_id, day_date, summary_id)
    DO UPDATE SET
      start_time_in_seconds = EXCLUDED.start_time_in_seconds,
      start_time_offset_in_seconds = EXCLUDED.start_time_offset_in_seconds,
      duration_in_seconds = EXCLUDED.duration_in_seconds,
      max_stress_level = EXCLUDED.max_stress_level,
      average_stress_level = EXCLUDED.average_stress_level,
      source = EXCLUDED.source,
      updated_at = now()
  `,
    values
  );
}
