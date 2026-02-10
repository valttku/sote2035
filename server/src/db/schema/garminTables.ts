import { db } from "../db.js";

// This file contains DB schema initialization related to garmin watch data tables

export async function createGarminTables() {
  // create user_metrics_garmin table
  await db.query(`
  create table if not exists app.user_metrics_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    summary_id varchar(100),

    vo2_max double precision,
    vo2_max_cycling double precision,
    fitness_age integer,
    enhanced boolean,
    source varchar(50) NOT NULL DEFAULT 'garmin',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (user_id, day_date, summary_id)
  );

  create index if not exists idx_user_metrics_garmin_user_day
    on app.user_metrics_garmin (user_id, day_date);
`);

  // Add source column if it doesn't exist (migration for existing tables)
  await db.query(`
    alter table app.user_metrics_garmin
    add column if not exists source varchar(50) not null default 'garmin';
  `);

  // automatically update user_metrics.updated_at on every update
  await db.query(`
  drop trigger if exists update_user_metrics_garmin_updated_at on app.user_metrics_garmin;

  create trigger update_user_metrics_garmin_updated_at
  before update on app.user_metrics_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // Trigger for user_metrics_garmin (ensure health_days entry exists)
  await db.query(`
    create or replace function app.ensure_health_day_exists_for_garmin_metrics()
    returns trigger as $$
    begin
      insert into app.health_days (user_id, day_date)
      values (new.user_id, new.day_date)
      on conflict (user_id, day_date) do nothing;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_ensure_health_day_for_garmin_metrics on app.user_metrics_garmin;

    create trigger trg_ensure_health_day_for_garmin_metrics
    after insert or update on app.user_metrics_garmin
    for each row
    execute function app.ensure_health_day_exists_for_garmin_metrics();
  `);

  // create user_dailies_garmin table
  await db.query(`
  create table if not exists app.user_dailies_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
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
    moderate_intensity_duration_in_seconds integer,
    vigorous_intensity_duration_in_seconds integer,
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

    source varchar(50) NOT NULL DEFAULT 'garmin',
    
    -- timestamps
    start_time_in_seconds bigint,
    start_time_offset_in_seconds integer,
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, day_date)
  );

  create index if not exists idx_user_dailies_garmin_user_day
    on app.user_dailies_garmin (user_id, day_date);
`);

  // Add source column if it doesn't exist (migration for existing tables)
  await db.query(`
    alter table app.user_dailies_garmin
    add column if not exists source varchar(50) not null default 'garmin';
  `);

  // Trigger for user_dailies_garmin (ensure health_days entry exists)
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

    drop trigger if exists trg_ensure_health_day_for_dailies on app.user_dailies_garmin;

    create trigger trg_ensure_health_day_for_dailies
    after insert or update on app.user_dailies_garmin
    for each row
    execute function app.ensure_health_day_exists_for_dailies();
  `);

  // automatically update user_dailies.updated_at on every update

  await db.query(`
  drop trigger if exists update_user_dailies_updated_at on app.user_dailies_garmin;
  drop trigger if exists update_user_dailies_garmin_updated_at on app.user_dailies_garmin;

  create trigger update_user_dailies_garmin_updated_at
  before update on app.user_dailies_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // create user_hrv_garmin table
  await db.query(`
  create table if not exists app.user_hrv_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    summary_id varchar(100),
    
    last_night_avg integer,
    last_night_5min_high integer,
    start_time_offset_in_seconds integer,
    duration_in_seconds integer,
    start_time_in_seconds bigint,
    hrv_values jsonb,  -- {300: 32, 600: 24, ...}
    
    source varchar(50) NOT NULL DEFAULT 'garmin',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, day_date)
  );

  create index if not exists idx_user_hrv_garmin_user_day
    on app.user_hrv_garmin (user_id, day_date);
`);

  // Add source column if it doesn't exist (migration for existing tables)
  await db.query(`
    alter table app.user_hrv_garmin
    add column if not exists source varchar(50) not null default 'garmin';
  `);

  // Trigger for user_hrv_garmin
  await db.query(`
    create or replace function app.ensure_health_day_exists_for_hrv()
    returns trigger as $$
    begin
      insert into app.health_days (user_id, day_date)
      values (new.user_id, new.day_date)
      on conflict (user_id, day_date) do nothing;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_ensure_health_day_for_hrv on app.user_hrv_garmin;

    create trigger trg_ensure_health_day_for_hrv
    after insert or update on app.user_hrv_garmin
    for each row
    execute function app.ensure_health_day_exists_for_hrv();
  `);

  // Update trigger for updated_at
  await db.query(`
  drop trigger if exists update_user_hrv_garmin_updated_at on app.user_hrv_garmin;

  create trigger update_user_hrv_garmin_updated_at
  before update on app.user_hrv_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // create user_skin_temp_garmin table
  await db.query(`
  create table if not exists app.user_skin_temp_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    summary_id varchar(100),
    
    avg_deviation_celsius double precision,
    duration_in_seconds integer,
    start_time_in_seconds bigint,
    start_time_offset_in_seconds integer,

    source varchar(50) NOT NULL DEFAULT 'garmin',
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, day_date)
  );

  create index if not exists idx_user_skin_temp_garmin_user_day
    on app.user_skin_temp_garmin (user_id, day_date);
`);

  // Add source column if it doesn't exist (migration for existing tables)
  await db.query(`
    alter table app.user_skin_temp_garmin
    add column if not exists source varchar(50) not null default 'garmin';
  `);

  // automatically update user_skin_temp_garmin.updated_at on every update
  await db.query(`
  drop trigger if exists update_user_skin_temp_garmin_updated_at on app.user_skin_temp_garmin;

  create trigger update_user_skin_temp_garmin_updated_at
  before update on app.user_skin_temp_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // Update trigger for updated_at
  await db.query(`
  drop trigger if exists update_user_skin_temp_garmin_updated_at on app.user_skin_temp_garmin;

  create trigger update_user_skin_temp_garmin_updated_at
  before update on app.user_skin_temp_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // Trigger for user_skin_temp_garmin (ensure health_days entry exists)
  await db.query(`
    create or replace function app.ensure_health_day_exists_for_skin_temp()
    returns trigger as $$
    begin
      insert into app.health_days (user_id, day_date)
      values (new.user_id, new.day_date)
      on conflict (user_id, day_date) do nothing;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_ensure_health_day_for_skin_temp on app.user_skin_temp_garmin;

    create trigger trg_ensure_health_day_for_skin_temp
    after insert or update on app.user_skin_temp_garmin
    for each row
    execute function app.ensure_health_day_exists_for_skin_temp();
  `);

  // create user_sleep_garmin table
  await db.query(`
  create table if not exists app.user_sleep_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    summary_id varchar(100),
    
    duration_in_seconds integer,
    total_nap_duration_in_seconds integer,
    start_time_in_seconds bigint,
    start_time_offset_in_seconds integer,
    unmeasurable_sleep_in_seconds integer,
    deep_sleep_duration_in_seconds integer,
    light_sleep_duration_in_seconds integer,
    rem_sleep_in_seconds integer,
    awake_duration_in_seconds integer,
    
    sleep_levels_map jsonb,  -- {deep: [{startTimeInSeconds, endTimeInSeconds}], light: [...], rem: [...]}
    validation varchar(50),
    time_offset_sleep_spo2 jsonb,  -- {0: 95, 60: 96, ...}
    time_offset_sleep_respiration jsonb,  -- {60: 15.31, 120: 14.58, ...}
    overall_sleep_score jsonb,  -- {value: 87, qualifierKey: "GOOD"}
    sleep_scores jsonb,
    naps jsonb,  -- array of nap objects

    source varchar(50) NOT NULL DEFAULT 'garmin',

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, day_date)
  );

  create index if not exists idx_user_sleep_garmin_user_day
    on app.user_sleep_garmin (user_id, day_date);
`);

  // automatically update user_sleep_garmin.updated_at on every update
  await db.query(`
  drop trigger if exists update_user_sleep_garmin_updated_at on app.user_sleep_garmin;

  create trigger update_user_sleep_garmin_updated_at
  before update on app.user_sleep_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // Trigger for user_sleep_garmin (ensure health_days entry exists)
  await db.query(`
    create or replace function app.ensure_health_day_exists_for_sleep()
    returns trigger as $$
    begin
      insert into app.health_days (user_id, day_date)
      values (new.user_id, new.day_date)
      on conflict (user_id, day_date) do nothing;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_ensure_health_day_for_sleep on app.user_sleep_garmin;

    create trigger trg_ensure_health_day_for_sleep
    after insert or update on app.user_sleep_garmin
    for each row
    execute function app.ensure_health_day_exists_for_sleep();
  `);

  // create user_stress_garmin table
  await db.query(`
  create table if not exists app.user_stress_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    summary_id varchar(100),
    
    start_time_in_seconds bigint,
    start_time_offset_in_seconds integer,
    duration_in_seconds integer,
    max_stress_level integer,
    average_stress_level integer,
    
    time_offset_stress_level_values jsonb,  -- {0: 18, 180: 51, ...}
    time_offset_body_battery_values jsonb,  -- {0: 55, 180: 56, ...}
    body_battery_dynamic_feedback_event jsonb,  -- {eventStartTimeInSeconds, bodyBatteryLevel}
    body_battery_activity_events jsonb,  -- array of event objects

    source varchar(50) NOT NULL DEFAULT 'garmin',
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, day_date)
  );

  create index if not exists idx_user_stress_garmin_user_day
    on app.user_stress_garmin (user_id, day_date);
`);

  // Add source column if it doesn't exist (migration for existing tables)
  await db.query(`
    alter table app.user_stress_garmin
    add column if not exists source varchar(50) not null default 'garmin';
  `);

  // automatically update user_stress_garmin.updated_at on every update
  await db.query(`
  drop trigger if exists update_user_stress_garmin_updated_at on app.user_stress_garmin;

  create trigger update_user_stress_garmin_updated_at
  before update on app.user_stress_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // Trigger for user_stress_garmin (ensure health_days entry exists)
  await db.query(`
    create or replace function app.ensure_health_day_exists_for_stress()
    returns trigger as $$
    begin
      insert into app.health_days (user_id, day_date)
      values (new.user_id, new.day_date)
      on conflict (user_id, day_date) do nothing;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_ensure_health_day_for_stress on app.user_stress_garmin;

    create trigger trg_ensure_health_day_for_stress
    after insert or update on app.user_stress_garmin
    for each row
    execute function app.ensure_health_day_exists_for_stress();
  `);

  // create user_respiration_garmin table
  await db.query(`
  create table if not exists app.user_respiration_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    summary_id varchar(100),
    
    start_time_in_seconds bigint,
    duration_in_seconds integer,
    start_time_offset_in_seconds integer,
    time_offset_epoch_to_breaths jsonb,  -- {0: 14.63, 60: 14.4, ...}

    source varchar(50) NOT NULL DEFAULT 'garmin',
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, day_date, summary_id)
  );

  create index if not exists idx_user_respiration_garmin_user_day
    on app.user_respiration_garmin (user_id, day_date);
`);

  // Add source column if it doesn't exist (migration for existing tables)
  await db.query(`
    alter table app.user_respiration_garmin
    add column if not exists source varchar(50) not null default 'garmin';
  `);

  // automatically update user_respiration_garmin.updated_at on every update
  await db.query(`
  drop trigger if exists update_user_respiration_garmin_updated_at on app.user_respiration_garmin;

  create trigger update_user_respiration_garmin_updated_at
  before update on app.user_respiration_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // Trigger for user_respiration_garmin (ensure health_days entry exists)
  await db.query(`
    create or replace function app.ensure_health_day_exists_for_respiration()
    returns trigger as $$
    begin
      insert into app.health_days (user_id, day_date)
      values (new.user_id, new.day_date)
      on conflict (user_id, day_date) do nothing;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_ensure_health_day_for_respiration on app.user_respiration_garmin;

    create trigger trg_ensure_health_day_for_respiration
    after insert or update on app.user_respiration_garmin
    for each row
    execute function app.ensure_health_day_exists_for_respiration();
  `);

  // create user_body_comp_garmin table
  await db.query(`
  create table if not exists app.user_body_comp_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    summary_id varchar(100),
    
    muscle_mass_in_grams integer,
    bone_mass_in_grams integer,
    body_water_in_percent double precision,
    body_fat_in_percent double precision,
    body_mass_index double precision,
    weight_in_grams integer,
    measurement_time_in_seconds bigint,
    measurement_time_offset_in_seconds integer,

    source varchar(50) NOT NULL DEFAULT 'garmin',
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, summary_id)
  );

  create index if not exists idx_user_body_comp_garmin_user_id
    on app.user_body_comp_garmin (user_id);
`);
  // Add source column if it doesn't exist (migration for existing tables)
  await db.query(`
    alter table app.user_body_comp_garmin
    add column if not exists source varchar(50) not null default 'garmin';
  `);
  // automatically update user_body_comp_garmin.updated_at on every update
  await db.query(`
  drop trigger if exists update_user_body_comp_garmin_updated_at on app.user_body_comp_garmin;

  create trigger update_user_body_comp_garmin_updated_at
  before update on app.user_body_comp_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // create user_activities_garmin table
  await db.query(`
  create table if not exists app.user_activities_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    activity_id bigint not null,
    summary_id varchar(100),
    
    activity_name varchar(255),
    activity_description text,
    is_parent boolean,
    parent_summary_id varchar(100),
    
    duration_in_seconds integer,
    start_time_in_seconds bigint,
    start_time_offset_in_seconds integer,
    activity_type varchar(50),
    
    -- heart rate
    average_heart_rate integer,
    max_heart_rate integer,
    
    -- cadence (activity-specific)
    average_run_cadence double precision,
    max_run_cadence double precision,
    average_bike_cadence double precision,
    max_bike_cadence double precision,
    average_swim_cadence double precision,
    average_push_cadence double precision,
    max_push_cadence double precision,
    
    -- speed/pace
    average_speed double precision,
    max_speed double precision,
    average_pace double precision,
    max_pace double precision,
    
    -- energy
    active_kilocalories integer,
    
    -- location/distance
    distance_in_meters double precision,
    starting_latitude double precision,
    starting_longitude double precision,
    
    -- other metrics
    steps integer,
    pushes integer,
    total_elevation_gain double precision,
    total_elevation_loss double precision,
    number_of_active_lengths integer,
    
    -- metadata
    device_name varchar(100),
    manual boolean,
    is_web_upload boolean,

    source varchar(50) NOT NULL DEFAULT 'garmin',
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, activity_id)
  );

  create index if not exists idx_user_activities_garmin_user_id
    on app.user_activities_garmin (user_id);
  
  create index if not exists idx_user_activities_garmin_start_time
    on app.user_activities_garmin (user_id, start_time_in_seconds);
`);

  // Add source column if it doesn't exist (migration for existing tables)
  await db.query(`
    alter table app.user_activities_garmin
    add column if not exists source varchar(50) not null default 'garmin';
  `);

  // automatically update user_activities_garmin.updated_at on every update
  await db.query(`
  drop trigger if exists update_user_activities_garmin_updated_at on app.user_activities_garmin;

  create trigger update_user_activities_garmin_updated_at
  before update on app.user_activities_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // create user_move_iq_garmin table (auto-detected activities)
  await db.query(`
  create table if not exists app.user_move_iq_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    summary_id varchar(100),
    
    device_name varchar(100),
    start_time_in_seconds bigint,
    duration_in_seconds integer,
    activity_type varchar(50),
    activity_sub_type varchar(100),
    offset_in_seconds integer,

    source varchar(50) NOT NULL DEFAULT 'garmin',
    
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    unique (user_id, summary_id)
  );

  create index if not exists idx_user_move_iq_garmin_user_day
    on app.user_move_iq_garmin (user_id, day_date);
`);

  // Add source column if it doesn't exist (migration for existing tables)
  await db.query(`
    alter table app.user_move_iq_garmin
    add column if not exists source varchar(50) not null default 'garmin';
  `);

  // automatically update user_move_iq_garmin.updated_at on every update
  await db.query(`
  drop trigger if exists update_user_move_iq_garmin_updated_at on app.user_move_iq_garmin;

  create trigger update_user_move_iq_garmin_updated_at
  before update on app.user_move_iq_garmin
  for each row
  execute function app.update_updated_at_column();
`);

  // Create triggers to auto-generate health_stat_entries when Garmin data is inserted/updated
  // These triggers ensure health stats are always in sync with the raw Garmin data

  // Trigger for dailies: generates heart_daily, activity_daily, stress_daily
  await db.query(`
    create or replace function app.update_health_stats_on_dailies()
    returns trigger as $$
    begin
      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      select
        new.user_id,
        new.day_date,
        'garmin',
        'heart_daily',
        jsonb_build_object(
          'hr_avg', new.avg_heart_rate,
          'hr_min', new.min_heart_rate,
          'hr_max', new.max_heart_rate,
          'rhr', new.resting_heart_rate
        )
      on conflict (user_id, day_date, kind)
      do update set data = EXCLUDED.data, updated_at = now();

      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      select
        new.user_id,
        new.day_date,
        'garmin',
        'activity_daily',
        jsonb_build_object(
          'steps', new.steps,
          'distance_meters', new.distance_in_meters,
          'active_kcal', new.active_kilocalories,
          'total_kcal', new.active_kilocalories + new.bmr_kilocalories,
          'intensity_duration_seconds', new.moderate_intensity_duration_in_seconds + new.vigorous_intensity_duration_in_seconds,
          'floors_climbed', new.floors_climbed
        )
      on conflict (user_id, day_date, kind)
      do update set data = EXCLUDED.data, updated_at = now();

      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      select
        new.user_id,
        new.day_date,
        'garmin',
        'stress_daily',
        jsonb_build_object(
          'stress_avg', new.avg_stress_level,
          'stress_max', new.max_stress_level
        )
      on conflict (user_id, day_date, kind)
      do update set data = EXCLUDED.data, updated_at = now();

      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_update_health_stats_on_dailies on app.user_dailies_garmin;
    create trigger trg_update_health_stats_on_dailies
    after insert or update on app.user_dailies_garmin
    for each row execute function app.update_health_stats_on_dailies();
  `);

  // Trigger for respiration: generates resp_daily
  await db.query(`
    create or replace function app.update_health_stats_on_respiration()
    returns trigger as $$
    declare
      avg_resp_rate double precision;
    begin
      -- Calculate average from the JSONB breath values
      select avg(value::double precision) into avg_resp_rate
      from jsonb_each_text(new.time_offset_epoch_to_breaths);

      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      values (
        new.user_id,
        new.day_date,
        'garmin',
        'resp_daily',
        jsonb_build_object(
          'resp_rate', round(avg_resp_rate::numeric, 2)
        )
      )
      on conflict (user_id, day_date, kind)
      do update set data = EXCLUDED.data, updated_at = now();

      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_update_health_stats_on_respiration on app.user_respiration_garmin;
    create trigger trg_update_health_stats_on_respiration
    after insert or update on app.user_respiration_garmin
    for each row execute function app.update_health_stats_on_respiration();
  `);

  // Trigger for skin_temp: generates skin_temp_daily
  await db.query(`
    create or replace function app.update_health_stats_on_skin_temp()
    returns trigger as $$
    begin
      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      select
        new.user_id,
        new.day_date,
        'garmin',
        'skin_temp_daily',
        jsonb_build_object(
          'skin_temp', new.avg_deviation_celsius
        )
      on conflict (user_id, day_date, kind)
      do update set data = EXCLUDED.data, updated_at = now();

      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_update_health_stats_on_skin_temp on app.user_skin_temp_garmin;
    create trigger trg_update_health_stats_on_skin_temp
    after insert or update on app.user_skin_temp_garmin
    for each row execute function app.update_health_stats_on_skin_temp();
  `);

  // Trigger for sleep: generates sleep_daily
  await db.query(`
    create or replace function app.update_health_stats_on_sleep()
    returns trigger as $$
    begin
      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      select
        new.user_id,
        new.day_date,
        'garmin',
        'sleep_daily',
        jsonb_build_object(
          'duration_min', (new.duration_in_seconds / 60)::int,
          'score', (new.overall_sleep_score->>'value')::int,
          'deep_sleep_min', (new.deep_sleep_duration_in_seconds / 60)::int,
          'light_sleep_min', (new.light_sleep_duration_in_seconds / 60)::int,
          'rem_sleep_min', (new.rem_sleep_in_seconds / 60)::int
        )
      on conflict (user_id, day_date, kind)
      do update set data = EXCLUDED.data, updated_at = now();

      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_update_health_stats_on_sleep on app.user_sleep_garmin;
    create trigger trg_update_health_stats_on_sleep
    after insert or update on app.user_sleep_garmin
    for each row execute function app.update_health_stats_on_sleep();
  `);
}
