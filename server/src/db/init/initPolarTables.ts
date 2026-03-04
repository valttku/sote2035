import { db } from "../db.js";

// Creates all Polar-specific tables and the DB triggers that populate
// app.health_stat_entries from Polar data (mirroring the Garmin trigger pattern).
// Uses JSONB merge (||) so each Polar source can independently update its own
// fields without overwriting data from other sources.
export async function createPolarTables() {
  // ----------------------------
  // user_exercises_polar
  // Individual workout/exercise sessions from Polar
  // ----------------------------
  await db.query(`
    CREATE TABLE IF NOT EXISTS app.user_exercises_polar (
      id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id                INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
      polar_exercise_id      VARCHAR(100) NOT NULL,

      day_date               DATE NOT NULL,
      start_time             TEXT,
      start_time_utc_offset  INTEGER,
      duration_in_seconds    INTEGER,
      calories               INTEGER,
      distance_in_meters     DOUBLE PRECISION,
      avg_heart_rate         INTEGER,
      max_heart_rate         INTEGER,
      sport                  VARCHAR(100),
      detailed_sport_info    VARCHAR(200),
      training_load          DOUBLE PRECISION,
      device                 VARCHAR(100),
      device_id              VARCHAR(100),
      has_route              BOOLEAN,
      upload_time            TEXT,

      source VARCHAR(50) NOT NULL DEFAULT 'polar',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      UNIQUE (user_id, polar_exercise_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_exercises_polar_user_day
      ON app.user_exercises_polar (user_id, day_date);
  `);

  await db.query(`
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_polar_exercises
      ON app.user_exercises_polar;
    CREATE TRIGGER trg_ensure_health_day_for_polar_exercises
    AFTER INSERT OR UPDATE ON app.user_exercises_polar
    FOR EACH ROW EXECUTE FUNCTION app.ensure_health_day_exists();

    DROP TRIGGER IF EXISTS update_user_exercises_polar_updated_at
      ON app.user_exercises_polar;
    CREATE TRIGGER update_user_exercises_polar_updated_at
    BEFORE UPDATE ON app.user_exercises_polar
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();
  `);

  // ----------------------------
  // user_activity_summaries_polar
  // Daily activity summaries from Polar (steps, distance, calories)
  // ----------------------------
  await db.query(`
    CREATE TABLE IF NOT EXISTS app.user_activity_summaries_polar (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id              INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
      polar_activity_id    VARCHAR(100),

      day_date             DATE NOT NULL,
      calories             INTEGER,
      active_calories      INTEGER,
      duration_in_seconds  INTEGER,
      steps                INTEGER,
      active_steps         INTEGER,
      distance_in_meters   DOUBLE PRECISION,

      source VARCHAR(50) NOT NULL DEFAULT 'polar',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      UNIQUE (user_id, day_date)
    );

    CREATE INDEX IF NOT EXISTS idx_user_activity_summaries_polar_user_day
      ON app.user_activity_summaries_polar (user_id, day_date);
  `);

  await db.query(`
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_polar_activity
      ON app.user_activity_summaries_polar;
    CREATE TRIGGER trg_ensure_health_day_for_polar_activity
    AFTER INSERT OR UPDATE ON app.user_activity_summaries_polar
    FOR EACH ROW EXECUTE FUNCTION app.ensure_health_day_exists();

    DROP TRIGGER IF EXISTS update_user_activity_summaries_polar_updated_at
      ON app.user_activity_summaries_polar;
    CREATE TRIGGER update_user_activity_summaries_polar_updated_at
    BEFORE UPDATE ON app.user_activity_summaries_polar
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();
  `);

  // ----------------------------
  // user_sleeps_polar
  // Sleep data from Polar Sleep Plus Stages
  // ----------------------------
  await db.query(`
    CREATE TABLE IF NOT EXISTS app.user_sleeps_polar (
      id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id                             INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,

      day_date                            DATE NOT NULL,
      sleep_start_time                    TEXT,
      sleep_end_time                      TEXT,
      light_sleep_seconds                 INTEGER,
      deep_sleep_seconds                  INTEGER,
      rem_sleep_seconds                   INTEGER,
      unrecognized_sleep_seconds          INTEGER,
      total_interruption_duration_seconds INTEGER,
      sleep_score                         INTEGER,
      sleep_charge                        INTEGER,
      continuity                          DOUBLE PRECISION,
      continuity_class                    INTEGER,
      device_id                           VARCHAR(100),

      source VARCHAR(50) NOT NULL DEFAULT 'polar',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      UNIQUE (user_id, day_date)
    );

    CREATE INDEX IF NOT EXISTS idx_user_sleeps_polar_user_day
      ON app.user_sleeps_polar (user_id, day_date);
  `);

  await db.query(`
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_polar_sleep
      ON app.user_sleeps_polar;
    CREATE TRIGGER trg_ensure_health_day_for_polar_sleep
    AFTER INSERT OR UPDATE ON app.user_sleeps_polar
    FOR EACH ROW EXECUTE FUNCTION app.ensure_health_day_exists();

    DROP TRIGGER IF EXISTS update_user_sleeps_polar_updated_at
      ON app.user_sleeps_polar;
    CREATE TRIGGER update_user_sleeps_polar_updated_at
    BEFORE UPDATE ON app.user_sleeps_polar
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();
  `);

  // ----------------------------
  // user_nightly_recharge_polar
  // Nightly Recharge / ANS recovery data from Polar
  // ----------------------------
  await db.query(`
    CREATE TABLE IF NOT EXISTS app.user_nightly_recharge_polar (
      id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id                      INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,

      day_date                     DATE NOT NULL,
      heart_rate_avg               DOUBLE PRECISION,   -- overnight avg HR (≈ resting HR)
      beat_to_beat_avg             DOUBLE PRECISION,   -- avg RR interval in ms
      heart_rate_variability_avg   DOUBLE PRECISION,   -- avg HRV in ms
      breathing_rate_avg           DOUBLE PRECISION,   -- avg overnight breathing rate
      ans_charge                   INTEGER,            -- 1–100 ANS charge score
      ans_rate                     VARCHAR(50),        -- RECOVERING / STEADY / ACTIVATED

      source VARCHAR(50) NOT NULL DEFAULT 'polar',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      UNIQUE (user_id, day_date)
    );

    CREATE INDEX IF NOT EXISTS idx_user_nightly_recharge_polar_user_day
      ON app.user_nightly_recharge_polar (user_id, day_date);
  `);

  await db.query(`
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_polar_recharge
      ON app.user_nightly_recharge_polar;
    CREATE TRIGGER trg_ensure_health_day_for_polar_recharge
    AFTER INSERT OR UPDATE ON app.user_nightly_recharge_polar
    FOR EACH ROW EXECUTE FUNCTION app.ensure_health_day_exists();

    DROP TRIGGER IF EXISTS update_user_nightly_recharge_polar_updated_at
      ON app.user_nightly_recharge_polar;
    CREATE TRIGGER update_user_nightly_recharge_polar_updated_at
    BEFORE UPDATE ON app.user_nightly_recharge_polar
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();
  `);

  // ============================================================
  // HEALTH STAT ENTRY TRIGGERS — Polar
  //
  // These populate app.health_stat_entries from Polar tables so
  // that the existing home/health-insights routes work unchanged.
  //
  // We use JSONB merge (||) instead of EXCLUDED.data so that each
  // Polar source can update only its own fields without wiping data
  // written by another source for the same (user_id, day_date, kind).
  // ============================================================

  // --- Exercises → activity_daily ---
  // Updates distance, total_kcal, and intensity_duration for the day.
  // Because one user can have multiple exercises per day, we SUM across
  // all exercises for that date.
  await db.query(`
    CREATE OR REPLACE FUNCTION app.update_health_stats_on_polar_exercise()
    RETURNS TRIGGER AS $$
    DECLARE
      v_total_distance DOUBLE PRECISION;
      v_total_calories INTEGER;
      v_total_duration INTEGER;
      v_weekly_duration INTEGER;
      v_avg_hr INTEGER;
      v_max_hr INTEGER;
    BEGIN
      -- Aggregate all exercises for this user on this day
      SELECT
        COALESCE(SUM(distance_in_meters), 0),
        COALESCE(SUM(calories), 0),
        COALESCE(SUM(duration_in_seconds), 0),
        ROUND(AVG(avg_heart_rate)),
        MAX(max_heart_rate)
      INTO v_total_distance, v_total_calories, v_total_duration, v_avg_hr, v_max_hr
      FROM app.user_exercises_polar
      WHERE user_id = NEW.user_id AND day_date = NEW.day_date;

      -- Weekly total exercise duration (current ISO week)
      SELECT COALESCE(SUM(duration_in_seconds), 0)
      INTO v_weekly_duration
      FROM app.user_exercises_polar
      WHERE user_id = NEW.user_id
        AND day_date >= date_trunc('week', NEW.day_date)::date
        AND day_date <= NEW.day_date;

      -- Merge into activity_daily (only overwrite exercise-specific fields)
      INSERT INTO app.health_stat_entries (user_id, day_date, source, kind, data)
      VALUES (
        NEW.user_id, NEW.day_date, 'polar', 'activity_daily',
        jsonb_strip_nulls(jsonb_build_object(
          'distance_meters',              v_total_distance,
          'total_kcal',                   v_total_calories,
          'intensity_duration_seconds',   v_total_duration,
          'weekly_intensity_total_seconds', v_weekly_duration
        ))
      )
      ON CONFLICT (user_id, day_date, kind)
      DO UPDATE SET
        data = app.health_stat_entries.data || EXCLUDED.data,
        updated_at = now();

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_update_health_stats_on_polar_exercise
      ON app.user_exercises_polar;
    CREATE TRIGGER trg_update_health_stats_on_polar_exercise
    AFTER INSERT OR UPDATE ON app.user_exercises_polar
    FOR EACH ROW EXECUTE FUNCTION app.update_health_stats_on_polar_exercise();
  `);

  // --- Activity Summaries → activity_daily ---
  // Updates steps and distance for the day.
  await db.query(`
    CREATE OR REPLACE FUNCTION app.update_health_stats_on_polar_activity_summary()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO app.health_stat_entries (user_id, day_date, source, kind, data)
      VALUES (
        NEW.user_id, NEW.day_date, 'polar', 'activity_daily',
        jsonb_strip_nulls(jsonb_build_object(
          'steps',          NEW.steps,
          'distance_meters', NEW.distance_in_meters,
          'total_kcal',     NEW.calories
        ))
      )
      ON CONFLICT (user_id, day_date, kind)
      DO UPDATE SET
        data = app.health_stat_entries.data || EXCLUDED.data,
        updated_at = now();

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_update_health_stats_on_polar_activity_summary
      ON app.user_activity_summaries_polar;
    CREATE TRIGGER trg_update_health_stats_on_polar_activity_summary
    AFTER INSERT OR UPDATE ON app.user_activity_summaries_polar
    FOR EACH ROW EXECUTE FUNCTION app.update_health_stats_on_polar_activity_summary();
  `);

  // --- Sleep → sleep_daily ---
  // Total sleep = light + deep + rem (Polar does not give a single field for this)
  await db.query(`
    CREATE OR REPLACE FUNCTION app.update_health_stats_on_polar_sleep()
    RETURNS TRIGGER AS $$
    DECLARE
      v_total_sleep INTEGER;
    BEGIN
      v_total_sleep := COALESCE(NEW.light_sleep_seconds, 0)
                     + COALESCE(NEW.deep_sleep_seconds, 0)
                     + COALESCE(NEW.rem_sleep_seconds, 0);

      INSERT INTO app.health_stat_entries (user_id, day_date, source, kind, data)
      VALUES (
        NEW.user_id, NEW.day_date, 'polar', 'sleep_daily',
        jsonb_build_object('duration_seconds', v_total_sleep)
      )
      ON CONFLICT (user_id, day_date, kind)
      DO UPDATE SET
        data = app.health_stat_entries.data || EXCLUDED.data,
        updated_at = now();

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_update_health_stats_on_polar_sleep
      ON app.user_sleeps_polar;
    CREATE TRIGGER trg_update_health_stats_on_polar_sleep
    AFTER INSERT OR UPDATE ON app.user_sleeps_polar
    FOR EACH ROW EXECUTE FUNCTION app.update_health_stats_on_polar_sleep();
  `);

  // --- Nightly Recharge → heart_daily + resp_daily ---
  // Overnight HR avg → resting heart rate proxy
  // HRV avg → overnight HRV
  // Breathing rate → resp_daily
  await db.query(`
    CREATE OR REPLACE FUNCTION app.update_health_stats_on_polar_nightly_recharge()
    RETURNS TRIGGER AS $$
    BEGIN
      -- heart_daily: resting HR and overnight HRV
      INSERT INTO app.health_stat_entries (user_id, day_date, source, kind, data)
      VALUES (
        NEW.user_id, NEW.day_date, 'polar', 'heart_daily',
        jsonb_strip_nulls(jsonb_build_object(
          'rhr',               NEW.heart_rate_avg,
          'overnight_avg_hrv', NEW.heart_rate_variability_avg
        ))
      )
      ON CONFLICT (user_id, day_date, kind)
      DO UPDATE SET
        data = app.health_stat_entries.data || EXCLUDED.data,
        updated_at = now();

      -- resp_daily: overnight breathing rate
      IF NEW.breathing_rate_avg IS NOT NULL THEN
        INSERT INTO app.health_stat_entries (user_id, day_date, source, kind, data)
        VALUES (
          NEW.user_id, NEW.day_date, 'polar', 'resp_daily',
          jsonb_build_object('resp_rate', ROUND(NEW.breathing_rate_avg::NUMERIC, 2))
        )
        ON CONFLICT (user_id, day_date, kind)
        DO UPDATE SET
          data = app.health_stat_entries.data || EXCLUDED.data,
          updated_at = now();
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_update_health_stats_on_polar_nightly_recharge
      ON app.user_nightly_recharge_polar;
    CREATE TRIGGER trg_update_health_stats_on_polar_nightly_recharge
    AFTER INSERT OR UPDATE ON app.user_nightly_recharge_polar
    FOR EACH ROW EXECUTE FUNCTION app.update_health_stats_on_polar_nightly_recharge();
  `);
}
