import { db } from "../db/db.js";

// ─── Garmin ───────────────────────────────────────────────────────────────────

export async function fetchGarminInsights(userId: number, date: string) {
  // Fetch profile and metrics in parallel
  const [profileResult, metricsResult] = await Promise.all([
    db.query(
      `SELECT id, gender, height, weight, birthday, updated_at FROM app.users WHERE id = $1`,
      [userId],
    ),
    db.query(
      `SELECT
         (SELECT vo2_max FROM app.user_metrics_garmin WHERE user_id = $1 AND vo2_max IS NOT NULL AND day_date <= $2::date ORDER BY day_date DESC LIMIT 1) AS vo2_max,
         (SELECT vo2_max_cycling FROM app.user_metrics_garmin WHERE user_id = $1 AND vo2_max_cycling IS NOT NULL AND day_date <= $2::date ORDER BY day_date DESC LIMIT 1) AS vo2_max_cycling,
         (SELECT fitness_age FROM app.user_metrics_garmin WHERE user_id = $1 AND fitness_age IS NOT NULL AND day_date <= $2::date ORDER BY day_date DESC LIMIT 1) AS fitness_age`,
      [userId, date],
    ),
  ]);

  // Merge metrics into profile
  const profile = { ...profileResult.rows[0], ...metricsResult.rows[0] };

  const [dailiesResult, stressResult, activitiesResult, sleepResult, respResult, hrvResult] =
    await Promise.all([
      db.query(
        `SELECT id, user_id, day_date, active_kilocalories, bmr_kilocalories, steps,
                distance_in_meters, floors_climbed, avg_heart_rate, resting_heart_rate,
                max_heart_rate, avg_stress_level, steps_goal, body_battery_charged,
                body_battery_drained, moderate_intensity_duration_in_seconds,
                vigorous_intensity_duration_in_seconds, intensity_duration_goal_in_seconds,
                heart_rate_samples,
                -- weekly total (seconds), weighting vigorous = 2x
                (
                  SELECT COALESCE(SUM(moderate_intensity_duration_in_seconds + (vigorous_intensity_duration_in_seconds * 2)), 0)::int
                  FROM app.user_dailies_garmin
                  WHERE user_id = $1 AND day_date >= date_trunc('week', $2::date)::date AND day_date <= $2::date
                ) AS weekly_intensity_total_seconds,
                floors_climbed_goal, source, created_at, updated_at
         FROM app.user_dailies_garmin WHERE user_id = $1 AND day_date = $2::date`,
        [userId, date],
      ),
      db.query(
        `SELECT id, avg_stress_level, rest_stress_duration_in_seconds,
                low_stress_duration_in_seconds, medium_stress_duration_in_seconds,
                high_stress_duration_in_seconds, stress_duration_in_seconds,
                stress_qualifier, updated_at
         FROM app.user_dailies_garmin WHERE user_id = $1 AND day_date = $2::date`,
        [userId, date],
      ),
      db.query(
        `SELECT * FROM app.user_activities_garmin
         WHERE user_id = $1 AND DATE(to_timestamp(start_time_in_seconds)) = $2::date
         ORDER BY start_time_in_seconds DESC`,
        [userId, date],
      ),
      db.query(
        `SELECT id, user_id, day_date, updated_at, duration_in_seconds,
                start_time_in_seconds, unmeasurable_sleep_in_seconds,
                deep_sleep_in_seconds, light_sleep_in_seconds, rem_sleep_in_seconds,
                awake_duration_in_seconds, sleep_levels_map, overall_sleep_score
         FROM app.user_sleeps_garmin WHERE user_id = $1 AND day_date = $2::date`,
        [userId, date],
      ),
      db.query(
        `SELECT id, user_id, day_date, updated_at,
                (SELECT MIN((value)::float) FROM jsonb_each_text(time_offset_epoch_to_breaths)) AS min_respiration,
                (SELECT MAX((value)::float) FROM jsonb_each_text(time_offset_epoch_to_breaths)) AS max_respiration,
                (SELECT AVG((value)::float) FROM jsonb_each_text(time_offset_epoch_to_breaths)) AS avg_respiration
         FROM app.user_respiration_garmin WHERE user_id = $1 AND day_date = $2::date`,
        [userId, date],
      ),
      db.query(
        `SELECT u.id, u.user_id, u.day_date, u.updated_at, u.last_night_avg,
                u.last_night_5min_high, u.hrv_values, u.duration_in_seconds,
                (SELECT AVG(last_night_avg::float) FROM app.user_hrv_garmin WHERE user_id = $1 AND day_date >= ($2::date - INTERVAL '6 days') AND day_date <= $2::date) AS avg_7d_night_hrv,
                (SELECT AVG((value)::float) FROM app.user_hrv_garmin g, jsonb_each_text(g.hrv_values) WHERE g.user_id = $1 AND g.day_date >= ($2::date - INTERVAL '6 days') AND g.day_date <= $2::date) AS avg_7d_hrv,
                (SELECT AVG((value)::float) FROM jsonb_each_text(u.hrv_values)) AS avg_day_hrv,
                (SELECT COUNT(*) FROM app.user_hrv_garmin WHERE user_id = $1 AND day_date >= ($2::date - INTERVAL '6 days') AND day_date <= $2::date) AS days_in_7d_window
         FROM app.user_hrv_garmin u WHERE u.user_id = $1 AND u.day_date = $2::date`,
        [userId, date],
      ),
    ]);

  return {
    date,
    profile,
    activities: activitiesResult.rows,
    dailies: dailiesResult.rows,
    sleep: sleepResult.rows,
    stress: stressResult.rows,
    respiration: respResult.rows,
    hrv: hrvResult.rows,
  };
}

// ─── Polar ────────────────────────────────────────────────────────────────────
// Polar data is shaped to match the Garmin response contract so the client
// section components work without modification. Garmin-only fields are null —
// section components already handle null by hiding those cards/charts.

export async function fetchPolarInsights(userId: number, date: string) {
  const [profileResult, exercisesResult, activityResult, sleepResult, rechargeResult, recharge7dResult] =
    await Promise.all([
      db.query(
        `SELECT id, gender, height, weight, birthday, updated_at FROM app.users WHERE id = $1`,
        [userId],
      ),
      // Exercises → activities shape
      db.query(
        `SELECT
           polar_exercise_id AS id,
           COALESCE(detailed_sport_info, sport) AS activity_name,
           duration_in_seconds,
           distance_in_meters,
           calories AS active_kilocalories,
           avg_heart_rate AS average_heart_rate,
           max_heart_rate,
           updated_at
         FROM app.user_exercises_polar
         WHERE user_id = $1 AND day_date = $2::date
         ORDER BY start_time`,
        [userId, date],
      ),
      // Activity summary → dailies shape
      db.query(
        `SELECT
           polar_activity_id AS id,
           steps,
           distance_in_meters,
           active_calories AS active_kilocalories,
           calories AS bmr_kilocalories,
           updated_at
         FROM app.user_activity_summaries_polar
         WHERE user_id = $1 AND day_date = $2::date`,
        [userId, date],
      ),
      // Sleep
      db.query(
        `SELECT id, sleep_start_time, sleep_end_time,
                light_sleep_seconds, deep_sleep_seconds, rem_sleep_seconds,
                unrecognized_sleep_seconds, total_interruption_duration_seconds,
                sleep_score, sleep_charge, updated_at
         FROM app.user_sleeps_polar WHERE user_id = $1 AND day_date = $2::date`,
        [userId, date],
      ),
      // Nightly recharge → HRV + respiration + resting HR
      db.query(
        `SELECT id, heart_rate_avg, heart_rate_variability_avg,
                breathing_rate_avg, ans_charge, ans_rate, updated_at
         FROM app.user_nightly_recharge_polar WHERE user_id = $1 AND day_date = $2::date`,
        [userId, date],
      ),
      // Last 7 days of nightly recharge for HRV 7-day trend chart
      db.query(
        `SELECT to_char(day_date, 'YYYY-MM-DD') AS day_date, heart_rate_variability_avg
         FROM app.user_nightly_recharge_polar
         WHERE user_id = $1
           AND day_date >= ($2::date - INTERVAL '6 days')
           AND day_date <= $2::date
           AND heart_rate_variability_avg IS NOT NULL
         ORDER BY day_date ASC`,
        [userId, date],
      ),
    ]);

  const r = rechargeResult.rows[0] ?? null;
  const ps = sleepResult.rows[0] ?? null;
  const pa = activityResult.rows[0] ?? null;

  // Shape sleep to match Garmin Sleep type
  // Polar uses ISO datetime strings — convert to Unix seconds
  const sleep = ps
    ? [
        {
          id: String(ps.id),
          start_time_in_seconds: ps.sleep_start_time
            ? Math.floor(new Date(ps.sleep_start_time).getTime() / 1000)
            : 0,
          // Sum all sleep stages + interruptions — matches Polar Flow's "Sleep time" headline
          // (light + deep + REM + unrecognized + interruptions = total time asleep)
          duration_in_seconds:
            ((ps.light_sleep_seconds ?? 0) +
            (ps.deep_sleep_seconds ?? 0) +
            (ps.rem_sleep_seconds ?? 0) +
            (ps.unrecognized_sleep_seconds ?? 0) +
            (ps.total_interruption_duration_seconds ?? 0)) || null,
          deep_sleep_in_seconds: ps.deep_sleep_seconds ?? null,
          light_sleep_in_seconds: ps.light_sleep_seconds ?? null,
          rem_sleep_in_seconds: ps.rem_sleep_seconds ?? null,
          awake_duration_in_seconds: ps.total_interruption_duration_seconds ?? null,
          unmeasurable_sleep_in_seconds: ps.unrecognized_sleep_seconds ?? null,
          overall_sleep_score: ps.sleep_score != null
            ? { value: ps.sleep_score, qualifierKey: "polar" }
            : null,
          // Polar has no segment-level timeline data
          sleep_levels_map: null,
          updated_at: ps.updated_at,
        },
      ]
    : [];

  // Shape dailies to match Garmin Dailies type
  // Null for Garmin-only fields — section components hide cards when null
  const dailies = pa
    ? [
        {
          id: String(pa.id),
          steps: pa.steps ?? null,
          floors_climbed: null,
          floors_climbed_goal: null,
          active_kilocalories: pa.active_kilocalories ?? null,
          bmr_kilocalories: pa.bmr_kilocalories ?? null,
          moderate_intensity_duration_in_seconds: null,
          vigorous_intensity_duration_in_seconds: null,
          weekly_intensity_total_seconds: null,
          intensity_duration_goal_in_seconds: null,
          distance_in_meters: pa.distance_in_meters ?? null,
          avg_heart_rate: null,
          resting_heart_rate: r?.heart_rate_avg ?? null,
          max_heart_rate: null,
          avg_stress_level: null,
          steps_goal: null,
          body_battery_charged: null,
          body_battery_drained: null,
          heart_rate_samples: null,
          updated_at: pa.updated_at,
        },
      ]
    : [];

  // Shape HRV — nightly recharge provides overnight avg and 7-day avg
  const hrv7dRows = recharge7dResult.rows;
  const hrv7dAvg =
    hrv7dRows.length > 0
      ? hrv7dRows.reduce((sum: number, row: any) => sum + Number(row.heart_rate_variability_avg), 0) /
        hrv7dRows.length
      : null;

  const hrv =
    r?.heart_rate_variability_avg != null
      ? [
          {
            id: String(r.id),
            last_night_avg: r.heart_rate_variability_avg,
            last_night_5min_high: null,
            avg_7d_night_hrv: hrv7dAvg,
            avg_7d_hrv: null,
            avg_day_hrv: null,
            days_in_7d_window: hrv7dRows.length,
            hrv_values: null,
            // Per-day values for the 7-day trend chart (Polar only)
            hrv_7d_values: hrv7dRows.map((row: any) => ({
              date: row.day_date,
              value: Number(row.heart_rate_variability_avg),
            })),
            updated_at: r.updated_at,
          },
        ]
      : [];

  // Shape respiration — Polar only has avg overnight breathing rate
  const respiration =
    r?.breathing_rate_avg != null
      ? [
          {
            id: String(r.id),
            min_respiration: null,
            max_respiration: null,
            avg_respiration: r.breathing_rate_avg,
            updated_at: r.updated_at,
          },
        ]
      : [];

  return {
    date,
    profile: profileResult.rows[0] ?? null,
    dailies,
    activities: exercisesResult.rows,
    sleep,
    // Stress is not available from Polar
    stress: [],
    respiration,
    hrv,
  };
}