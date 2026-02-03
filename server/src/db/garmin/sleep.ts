import { db } from "../db.js";

export type GarminSleepRow = {
  user_id: number;
  day_date: string;
  summary_id?: string | null;
  duration_in_seconds?: number | null;
  total_nap_duration_in_seconds?: number | null;
  start_time_in_seconds?: number | null;
  start_time_offset_in_seconds?: number | null;
  unmeasurable_sleep_in_seconds?: number | null;
  deep_sleep_duration_in_seconds?: number | null;
  light_sleep_duration_in_seconds?: number | null;
  rem_sleep_in_seconds?: number | null;
  awake_duration_in_seconds?: number | null;
  sleep_levels_map?: Record<string, any> | null;
  validation?: string | null;
  time_offset_sleep_spo2?: Record<string, number> | null;
  time_offset_sleep_respiration?: Record<string, number> | null;
  overall_sleep_score?: Record<string, any> | null;
  sleep_scores?: Record<string, any> | null;
  naps?: any[] | null;
};

export function mapGarminSleepToRow(user_id: number, s: any): GarminSleepRow {
  return {
    user_id,
    day_date: s.calendarDate,
    summary_id: s.summaryId ?? null,
    duration_in_seconds: s.durationInSeconds ?? null,
    total_nap_duration_in_seconds: s.totalNapDurationInSeconds ?? null,
    start_time_in_seconds: s.startTimeInSeconds ?? null,
    start_time_offset_in_seconds: s.startTimeOffsetInSeconds ?? null,
    unmeasurable_sleep_in_seconds: s.unmeasurableSleepInSeconds ?? null,
    deep_sleep_duration_in_seconds: s.deepSleepDurationInSeconds ?? null,
    light_sleep_duration_in_seconds: s.lightSleepDurationInSeconds ?? null,
    rem_sleep_in_seconds: s.remSleepInSeconds ?? null,
    awake_duration_in_seconds: s.awakeDurationInSeconds ?? null,
    sleep_levels_map: s.sleepLevelsMap ?? null,
    validation: s.validation ?? null,
    time_offset_sleep_spo2: s.timeOffsetSleepSpo2 ?? null,
    time_offset_sleep_respiration: s.timeOffsetSleepRespiration ?? null,
    overall_sleep_score: s.overallSleepScore ?? null,
    sleep_scores: s.sleepScores ?? null,
    naps: s.naps ?? null,
  };
}

export async function upsertGarminSleep(row: GarminSleepRow) {
  if (!row) return;

  await db.query(
    `INSERT INTO app.user_sleep_garmin
       (user_id, day_date, summary_id, duration_in_seconds, total_nap_duration_in_seconds,
        start_time_in_seconds, start_time_offset_in_seconds, unmeasurable_sleep_in_seconds,
        deep_sleep_duration_in_seconds, light_sleep_duration_in_seconds, rem_sleep_in_seconds,
        awake_duration_in_seconds, sleep_levels_map, validation, time_offset_sleep_spo2,
        time_offset_sleep_respiration, overall_sleep_score, sleep_scores, naps)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
     ON CONFLICT (user_id, day_date)
     DO UPDATE SET
       summary_id = EXCLUDED.summary_id,
       duration_in_seconds = EXCLUDED.duration_in_seconds,
       total_nap_duration_in_seconds = EXCLUDED.total_nap_duration_in_seconds,
       start_time_in_seconds = EXCLUDED.start_time_in_seconds,
       start_time_offset_in_seconds = EXCLUDED.start_time_offset_in_seconds,
       unmeasurable_sleep_in_seconds = EXCLUDED.unmeasurable_sleep_in_seconds,
       deep_sleep_duration_in_seconds = EXCLUDED.deep_sleep_duration_in_seconds,
       light_sleep_duration_in_seconds = EXCLUDED.light_sleep_duration_in_seconds,
       rem_sleep_in_seconds = EXCLUDED.rem_sleep_in_seconds,
       awake_duration_in_seconds = EXCLUDED.awake_duration_in_seconds,
       sleep_levels_map = EXCLUDED.sleep_levels_map,
       validation = EXCLUDED.validation,
       time_offset_sleep_spo2 = EXCLUDED.time_offset_sleep_spo2,
       time_offset_sleep_respiration = EXCLUDED.time_offset_sleep_respiration,
       overall_sleep_score = EXCLUDED.overall_sleep_score,
       sleep_scores = EXCLUDED.sleep_scores,
       naps = EXCLUDED.naps,
       updated_at = now()`,
    [
      row.user_id,
      row.day_date,
      row.summary_id,
      row.duration_in_seconds,
      row.total_nap_duration_in_seconds,
      row.start_time_in_seconds,
      row.start_time_offset_in_seconds,
      row.unmeasurable_sleep_in_seconds,
      row.deep_sleep_duration_in_seconds,
      row.light_sleep_duration_in_seconds,
      row.rem_sleep_in_seconds,
      row.awake_duration_in_seconds,
      row.sleep_levels_map ? JSON.stringify(row.sleep_levels_map) : null,
      row.validation,
      row.time_offset_sleep_spo2 ? JSON.stringify(row.time_offset_sleep_spo2) : null,
      row.time_offset_sleep_respiration ? JSON.stringify(row.time_offset_sleep_respiration) : null,
      row.overall_sleep_score ? JSON.stringify(row.overall_sleep_score) : null,
      row.sleep_scores ? JSON.stringify(row.sleep_scores) : null,
      row.naps ? JSON.stringify(row.naps) : null,
    ],
  );
}

