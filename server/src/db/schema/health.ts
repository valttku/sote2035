import { db } from "../db.js";

// This file contains DB schema initialization related to health data tables

export async function createHealthTables() {
  // --- create health_days table ---
  await db.query(`
  create table if not exists app.health_days (
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, day_date)
  );

  create or replace function app.update_health_days_updated_at()
  returns trigger as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$ language plpgsql;

  drop trigger if exists update_health_days_updated_at on app.health_days;

  create trigger update_health_days_updated_at
  before update on app.health_days
  for each row
  execute function app.update_health_days_updated_at();
`);

  // create user_metrics table.
  await db.query(`
  create table if not exists app.user_metrics (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    source varchar(32) not null,   -- 'garmin', 'polar'
    metric varchar(64) not null,   -- 'resting_hr', 'steps', etc
    value_number double precision,
    value_json jsonb,
    unit varchar(32),
    created_at timestamptz not null default now(),
    unique (user_id, day_date, source, metric)
  );

  create index if not exists idx_user_metrics_user_day
    on app.user_metrics (user_id, day_date);

  create index if not exists idx_user_metrics__user_metric
    on app.user_metrics (user_id, metric);
`);

  // ensure health_days entry exists when inserting/updating user_metrics
  await db.query(`
  create or replace function app.ensure_health_day_exists_for_metrics()
  returns trigger as $$
  begin
    insert into app.health_days (user_id, day_date)
    values (new.user_id, new.day_date)
    on conflict (user_id, day_date) do nothing;
    return new;
  end;
  $$ language plpgsql;

  drop trigger if exists trg_ensure_health_day_exists_on_metrics on app.user_metrics;

  create trigger trg_ensure_health_day_exists_on_metrics
  after insert or update on app.user_metrics
  for each row
  execute function app.ensure_health_day_exists_for_metrics();
`);

  // ...existing code...

  // create user_dailies table (daily summary from Garmin/Polar)
  await db.query(`
  create table if not exists app.user_dailies (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    source varchar(32) not null,   -- 'garmin', 'polar'
    summary_id varchar(100),       -- provider's summary ID

    activity_type varchar(50),
    
    -- activity metrics
    active_kilocalories integer,
    bmr_kilocalories integer,
    steps integer,
    pushes integer,
    distance_in_meters double precision,
    push_distance_in_meters double precision,
    duration_in_seconds integer,
    active_time_in_seconds integer,
    floors_climbed integer,
    
    -- heart rate
    min_heart_rate integer,
    max_heart_rate integer,
    avg_heart_rate integer,
    resting_heart_rate integer,
    heart_rate_samples jsonb,      -- {15: 75, 30: 75, ...}
    
    -- stress
    avg_stress_level integer,
    max_stress_level integer,
    stress_duration_in_seconds integer,
    rest_stress_duration_in_seconds integer,
    activity_stress_duration_in_seconds integer,
    low_stress_duration_in_seconds integer,
    medium_stress_duration_in_seconds integer,
    high_stress_duration_in_seconds integer,
    stress_qualifier varchar(50),
    
    -- body battery
    body_battery_charged integer,
    body_battery_drained integer,
    
    -- goals
    steps_goal integer,
    pushes_goal integer,
    intensity_duration_goal_in_seconds integer,
    floors_climbed_goal integer,
    
    -- timestamps
    start_time_in_seconds bigint,
    start_time_offset_in_seconds integer,
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, day_date, source)
  );

  create index if not exists idx_user_dailies_user_day
    on app.user_dailies (user_id, day_date);

  create index if not exists idx_user_dailies_source
    on app.user_dailies (source);
`);

  // ensure health_days entry exists when inserting into user_dailies
  await db.query(`
  create or replace function app.ensure_health_day_exists_for_dailies()
  returns trigger as $$
  begin
    insert into app.health_days (user_id, day_date)
    values (new.user_id, new.day_date)
    on conflict (user_id, day_date) do nothing;
    return new;
  end;
  $$ language plpgsql;

  drop trigger if exists trg_ensure_health_day_exists_on_dailies on app.user_dailies;

  create trigger trg_ensure_health_day_exists_on_dailies
  after insert or update on app.user_dailies
  for each row
  execute function app.ensure_health_day_exists_for_dailies();
`);

  // automatically update user_dailies.updated_at on every update
  await db.query(`
  drop trigger if exists update_user_dailies_updated_at on app.user_dailies;

  create trigger update_user_dailies_updated_at
  before update on app.user_dailies
  for each row
  execute function app.update_updated_at_column();
`);

  // create health_stat_entries table (will be deleted later)
  await db.query(`
  create table if not exists app.health_stat_entries (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,

    source varchar(50),         -- optional for now: 'garmin', 'polar'
    kind varchar(80) not null,  -- free text for now
    data jsonb not null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create index if not exists idx_health_stat_entries_user_day
    on app.health_stat_entries (user_id, day_date);

  create unique index if not exists ux_health_stat_entries_user_day_kind
  on app.health_stat_entries (user_id, day_date, kind);
`);

  // ensure health_days entry exists when inserting into health_stat_entries (to be removed later)
  await db.query(`
  create or replace function app.ensure_health_day_exists_for_stats()
  returns trigger as $$
  begin
    insert into app.health_days (user_id, day_date)
    values (new.user_id, new.day_date)
    on conflict (user_id, day_date) do nothing;
    return new;
  end;
  $$ language plpgsql;

  drop trigger if exists trg_ensure_health_day_exists_on_stats on app.health_stat_entries;

  create trigger trg_ensure_health_day_exists_on_stats
  after insert or update on app.health_stat_entries
  for each row
  execute function app.ensure_health_day_exists_for_stats();
`);
}
