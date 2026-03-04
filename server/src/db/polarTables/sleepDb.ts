import { db } from "../db.js";

export type PolarSleepRow = {
  user_id: number;
  day_date: string;                                     // YYYY-MM-DD (Polar "date" field)
  sleep_start_time: string | null;                      // ISO datetime
  sleep_end_time: string | null;                        // ISO datetime
  light_sleep_seconds: number | null;
  deep_sleep_seconds: number | null;
  rem_sleep_seconds: number | null;
  unrecognized_sleep_seconds: number | null;
  total_interruption_duration_seconds: number | null;
  sleep_score: number | null;                           // 0–100
  sleep_charge: number | null;                          // Polar's sleep charge
  continuity: number | null;                            // Polar's continuity score
  continuity_class: number | null;
  device_id: string | null;
  source: string;
};

// Maps Polar's sleep API response to a DB row.
// Polar sleep response fields: date, sleep_start_time, sleep_end_time,
// light_sleep, deep_sleep, rem_sleep, unrecognized_sleep_stage,
// total_interruption_duration, sleep_score, sleep_charge, continuity,
// continuity_class, device_id
export function mapPolarSleepToRow(user_id: number, s: any): PolarSleepRow {
  return {
    user_id,
    day_date: s.date,
    sleep_start_time: s.sleep_start_time ?? null,
    sleep_end_time: s.sleep_end_time ?? null,
    light_sleep_seconds: s.light_sleep ?? null,
    deep_sleep_seconds: s.deep_sleep ?? null,
    rem_sleep_seconds: s.rem_sleep ?? null,
    unrecognized_sleep_seconds: s.unrecognized_sleep_stage ?? null,
    total_interruption_duration_seconds: s.total_interruption_duration ?? null,
    sleep_score: s.sleep_score ?? null,
    sleep_charge: s.sleep_charge ?? null,
    continuity: s.continuity ?? null,
    continuity_class: s.continuity_class ?? null,
    device_id: s.device_id ?? null,
    source: "polar",
  };
}

export async function upsertPolarSleep(row: PolarSleepRow) {
  if (!row || !row.day_date) return;

  await db.query(
    `INSERT INTO app.user_sleeps_polar
       (user_id, day_date, sleep_start_time, sleep_end_time,
        light_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds,
        unrecognized_sleep_seconds, total_interruption_duration_seconds,
        sleep_score, sleep_charge, continuity, continuity_class, device_id, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (user_id, day_date)
     DO UPDATE SET
       sleep_start_time = EXCLUDED.sleep_start_time,
       sleep_end_time = EXCLUDED.sleep_end_time,
       light_sleep_seconds = EXCLUDED.light_sleep_seconds,
       deep_sleep_seconds = EXCLUDED.deep_sleep_seconds,
       rem_sleep_seconds = EXCLUDED.rem_sleep_seconds,
       unrecognized_sleep_seconds = EXCLUDED.unrecognized_sleep_seconds,
       total_interruption_duration_seconds = EXCLUDED.total_interruption_duration_seconds,
       sleep_score = EXCLUDED.sleep_score,
       sleep_charge = EXCLUDED.sleep_charge,
       continuity = EXCLUDED.continuity,
       continuity_class = EXCLUDED.continuity_class,
       device_id = EXCLUDED.device_id,
       updated_at = now()`,
    [
      row.user_id,
      row.day_date,
      row.sleep_start_time,
      row.sleep_end_time,
      row.light_sleep_seconds,
      row.deep_sleep_seconds,
      row.rem_sleep_seconds,
      row.unrecognized_sleep_seconds,
      row.total_interruption_duration_seconds,
      row.sleep_score,
      row.sleep_charge,
      row.continuity,
      row.continuity_class,
      row.device_id,
      row.source,
    ]
  );
}
