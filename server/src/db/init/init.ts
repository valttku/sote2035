import { db } from "../db.js";
import { createGarminTables } from "./initGarminTables.js";
import { createPolarTables } from "./initPolarTables.js";

export async function ensureSchema() {
  // make sure the "app" schema exists
  await db.query(`
    create schema if not exists app;
  `);

  // enable pgcrypto (needed for gen_random_uuid() UUID defaults)
  await db.query(`
    create extension if not exists pgcrypto;
  `);

  await createGarminTables();
  await createPolarTables();

  // create users table (accounts)
  await db.query(`
  do $$
  begin
    if not exists (
      select 1 from pg_type where typname = 'gender_enum'
    ) then
      create type app.gender_enum as enum ('male', 'female', 'other', 'unknown');
    end if;
  end$$;

   -- create users table
  create table if not exists app.users (
    id integer primary key generated always as identity,
    email varchar(255) unique not null,
    password varchar(255) not null,
    display_name varchar(100),
    active_provider varchar(50),

    birthday date,
    gender app.gender_enum,
    height double precision,
    weight double precision,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_login timestamptz
  );
`);

  // automatically update users.updated_at on every update
  await db.query(`
  -- automatically update users.updated_at on every update
  create or replace function app.update_updated_at_column()
  returns trigger as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$ language plpgsql;

  drop trigger if exists update_users_updated_at on app.users;

  create trigger update_users_updated_at
  before update on app.users
  for each row
  execute function app.update_updated_at_column();
`);

  // create sessions table (cookie-based login sessions)
  await db.query(`
    create table if not exists app.sessions (
      id uuid primary key default gen_random_uuid(),
      user_id integer not null references app.users(id) on delete cascade,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null
    );
  `);

  // clean up duplicate sessions (keep newest), then enforce one session per user
  await db.query(`
    with ranked as (
      select id, user_id,
            row_number() over (
              partition by user_id
              order by expires_at desc, created_at desc, id desc
            ) as rn
      from app.sessions
    )
    delete from app.sessions s
    using ranked r
    where s.id = r.id
      and r.rn > 1;
  `);

  await db.query(`
    create unique index if not exists ux_sessions_user_id
    on app.sessions(user_id);
  `);

  // create password reset tokens table (forgot/reset password flow)
  await db.query(`
    create table if not exists app.password_reset_tokens (
      token uuid primary key,
      user_id integer not null references app.users(id) on delete cascade,
      expires_at timestamptz not null
    );
  `);

  // store external provider connections (Polar, Garmin, etc.)
  await db.query(`
    create table if not exists app.user_integrations (
      id uuid primary key default gen_random_uuid(),
      user_id integer not null references app.users(id) on delete cascade,

      provider varchar(50) not null,        -- 'polar', 'garmin'
      provider_user_id varchar(100),        -- Polar user-id (from Polar), etc.
      access_token text not null,
      refresh_token text,
      token_expires_at timestamptz,

      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),

      unique (user_id, provider)
    );

    -- automatically update user_integrations.updated_at on every update
    drop trigger if exists update_user_integrations_updated_at on app.user_integrations;

    create trigger update_user_integrations_updated_at
    before update on app.user_integrations
    for each row
    execute function app.update_updated_at_column();
  `);

  // OAuth state storage for integrations (CSRF protection)
  // verifier is required for PKCE (e.g. Garmin); Polar does not use it
  // return_to is optional redirect URL after callback (e.g. localhost/settings)
  await db.query(`
    create table if not exists app.oauth_states (
      state uuid primary key,
      user_id integer not null references app.users(id) on delete cascade,
      expires_at timestamptz not null,
      verifier text,
      return_to text
    );

    create index if not exists idx_oauth_states_expires_at
      on app.oauth_states (expires_at);
  `);

  // --- drop legacy triggers and functions (safe to run on existing deployments) ---
  // These triggers wrote to health_stat_entries / health_days which no longer exist.
  // Must drop them BEFORE dropping those tables, or any INSERT to raw tables will crash.
  await db.query(`
    -- ensure_health_day triggers (Garmin)
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_metrics     ON app.user_metrics_garmin;
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_dailies     ON app.user_dailies_garmin;
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_respiration ON app.user_respiration_garmin;
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_activities  ON app.user_activities_garmin;
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_sleeps      ON app.user_sleeps_garmin;
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_hrv         ON app.user_hrv_garmin;

    -- ensure_health_day triggers (Polar)
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_polar_exercises ON app.user_exercises_polar;
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_polar_activity  ON app.user_activity_summaries_polar;
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_polar_sleep     ON app.user_sleeps_polar;
    DROP TRIGGER IF EXISTS trg_ensure_health_day_for_polar_recharge  ON app.user_nightly_recharge_polar;

    -- health_stat write triggers (Garmin)
    DROP TRIGGER IF EXISTS trg_update_health_stats_on_dailies      ON app.user_dailies_garmin;
    DROP TRIGGER IF EXISTS trg_update_health_stats_on_respiration   ON app.user_respiration_garmin;
    DROP TRIGGER IF EXISTS trg_update_health_stats_on_sleeps        ON app.user_sleeps_garmin;

    -- health_stat write triggers (Polar)
    DROP TRIGGER IF EXISTS trg_update_health_stats_on_polar_exercise          ON app.user_exercises_polar;
    DROP TRIGGER IF EXISTS trg_update_health_stats_on_polar_activity_summary  ON app.user_activity_summaries_polar;
    DROP TRIGGER IF EXISTS trg_update_health_stats_on_polar_sleep              ON app.user_sleeps_polar;
    DROP TRIGGER IF EXISTS trg_update_health_stats_on_polar_nightly_recharge  ON app.user_nightly_recharge_polar;
  `);

  await db.query(`
    DROP FUNCTION IF EXISTS app.ensure_health_day_exists() CASCADE;
    DROP FUNCTION IF EXISTS app.update_health_days_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS app.update_health_stats_on_dailies() CASCADE;
    DROP FUNCTION IF EXISTS app.update_health_stats_on_respiration() CASCADE;
    DROP FUNCTION IF EXISTS app.update_health_stats_on_sleeps() CASCADE;
    DROP FUNCTION IF EXISTS app.update_health_stats_on_polar_exercise() CASCADE;
    DROP FUNCTION IF EXISTS app.update_health_stats_on_polar_activity_summary() CASCADE;
    DROP FUNCTION IF EXISTS app.update_health_stats_on_polar_sleep() CASCADE;
    DROP FUNCTION IF EXISTS app.update_health_stats_on_polar_nightly_recharge() CASCADE;
  `);

  // --- drop legacy derived tables ---
  await db.query(`
    DROP TABLE IF EXISTS app.health_stat_entries CASCADE;
    DROP TABLE IF EXISTS app.health_days CASCADE;
  `);

  // --- manual activities ---
  // Simple table for user-entered activities. No triggers, no derived cache.
  await db.query(`
    create table if not exists app.user_manual_activities (
      id         uuid primary key default gen_random_uuid(),
      user_id    integer not null references app.users(id) on delete cascade,
      day_date   date not null,
      title      text not null,
      type       text,
      duration   integer,
      calories   integer,
      steps      integer,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists idx_user_manual_activities_user_day
      on app.user_manual_activities (user_id, day_date);
  `);

  await db.query(`
    drop trigger if exists update_user_manual_activities_updated_at on app.user_manual_activities;
    create trigger update_user_manual_activities_updated_at
    before update on app.user_manual_activities
    for each row execute function app.update_updated_at_column();
  `);

  // Add verifier column if table already existed without it (e.g. before Garmin PKCE)
  await db.query(`
    alter table app.oauth_states
    add column if not exists verifier text;
  `);

  // Optional return URL after OAuth callback (e.g. localhost/settings when testing from localhost)
  await db.query(`
    alter table app.oauth_states
    add column if not exists return_to text;
  `);

  // ans_charge was originally INTEGER but Polar returns fractional values (e.g. -4.7)
  await db.query(`
    alter table app.user_nightly_recharge_polar
    alter column ans_charge type numeric(6,2) using ans_charge::numeric;
  `);
}
