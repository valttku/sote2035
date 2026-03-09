import { db } from "../db.js";

// Creates all Polar-specific raw data tables.
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
      ans_charge                   NUMERIC(6,2),       -- ANS charge score (can be fractional)
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
    DROP TRIGGER IF EXISTS update_user_nightly_recharge_polar_updated_at
      ON app.user_nightly_recharge_polar;
    CREATE TRIGGER update_user_nightly_recharge_polar_updated_at
    BEFORE UPDATE ON app.user_nightly_recharge_polar
    FOR EACH ROW EXECUTE FUNCTION app.update_updated_at_column();
  `);
}
