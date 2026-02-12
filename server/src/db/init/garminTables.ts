import { db } from "../db.js";

// This file contains DB schema initialization related to Garmin watch data tables
export async function createGarminTables() {
  // ----------------------------
  // Generic ensure_health_day_exists function
  // ----------------------------
  await db.query(`
    create or replace function app.ensure_health_day_exists()
    returns trigger as $$
    begin
      insert into app.health_days (user_id, day_date)
      values (new.user_id, new.day_date)
      on conflict (user_id, day_date) do nothing;
      return new;
    end;
    $$ language plpgsql;
  `);

  // ----------------------------
  // Generic updated_at trigger function
  // ----------------------------
  await db.query(`
    create or replace function app.update_updated_at_column()
    returns trigger as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$ language plpgsql;
  `);

  // ----------------------------
  // user_metrics_garmin table
  // ----------------------------
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
      source varchar(50) not null default 'garmin',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (user_id, day_date, summary_id)
    );

    create index if not exists idx_user_metrics_garmin_user_day
      on app.user_metrics_garmin (user_id, day_date);
  `);

  await db.query(`
    drop trigger if exists trg_ensure_health_day_for_metrics on app.user_metrics_garmin;
    create trigger trg_ensure_health_day_for_metrics
    after insert or update on app.user_metrics_garmin
    for each row execute function app.ensure_health_day_exists();

    drop trigger if exists update_user_metrics_garmin_updated_at on app.user_metrics_garmin;
    create trigger update_user_metrics_garmin_updated_at
    before update on app.user_metrics_garmin
    for each row execute function app.update_updated_at_column();
  `);

  // ----------------------------
  // user_dailies_garmin table
  // ----------------------------
  await db.query(`
    create table if not exists app.user_dailies_garmin (
      id uuid primary key default gen_random_uuid(),
      user_id integer not null references app.users(id) on delete cascade,
      day_date date not null,
      summary_id varchar(100),
      activity_type varchar(50),
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
      min_heart_rate integer,
      max_heart_rate integer,
      avg_heart_rate integer,
      resting_heart_rate integer,
      heart_rate_samples jsonb,
      avg_stress_level integer,
      max_stress_level integer,
      stress_duration_in_seconds integer,
      rest_stress_duration_in_seconds integer,
      activity_stress_duration_in_seconds integer,
      low_stress_duration_in_seconds integer,
      medium_stress_duration_in_seconds integer,
      high_stress_duration_in_seconds integer,
      stress_qualifier varchar(50),
      body_battery_charged integer,
      body_battery_drained integer,
      steps_goal integer,
      pushes_goal integer,
      intensity_duration_goal_in_seconds integer,
      floors_climbed_goal integer,
      source varchar(50) not null default 'garmin',
      start_time_in_seconds bigint,
      start_time_offset_in_seconds integer,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (user_id, day_date)
    );

    create index if not exists idx_user_dailies_garmin_user_day
      on app.user_dailies_garmin (user_id, day_date);
  `);

  await db.query(`
    drop trigger if exists trg_ensure_health_day_for_dailies on app.user_dailies_garmin;
    create trigger trg_ensure_health_day_for_dailies
    after insert or update on app.user_dailies_garmin
    for each row execute function app.ensure_health_day_exists();

    drop trigger if exists update_user_dailies_garmin_updated_at on app.user_dailies_garmin;
    create trigger update_user_dailies_garmin_updated_at
    before update on app.user_dailies_garmin
    for each row execute function app.update_updated_at_column();
  `);

  // ----------------------------
  // user_respiration_garmin table
  // ----------------------------
  await db.query(`
    create table if not exists app.user_respiration_garmin (
      id uuid primary key default gen_random_uuid(),
      user_id integer not null references app.users(id) on delete cascade,
      day_date date not null,
      summary_id varchar(100),
      start_time_in_seconds bigint,
      duration_in_seconds integer,
      start_time_offset_in_seconds integer,
      time_offset_epoch_to_breaths jsonb,
      source varchar(50) not null default 'garmin',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (user_id, day_date, summary_id)
    );

    create index if not exists idx_user_respiration_garmin_user_day
      on app.user_respiration_garmin (user_id, day_date);
  `);

  await db.query(`
    drop trigger if exists trg_ensure_health_day_for_respiration on app.user_respiration_garmin;
    create trigger trg_ensure_health_day_for_respiration
    after insert or update on app.user_respiration_garmin
    for each row execute function app.ensure_health_day_exists();

    drop trigger if exists update_user_respiration_garmin_updated_at on app.user_respiration_garmin;
    create trigger update_user_respiration_garmin_updated_at
    before update on app.user_respiration_garmin
    for each row execute function app.update_updated_at_column();
  `);

  // ----------------------------
  // user_body_comp_garmin table
  // ----------------------------
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
      source varchar(50) not null default 'garmin',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (user_id, summary_id)
    );

    create index if not exists idx_user_body_comp_garmin_user_id
      on app.user_body_comp_garmin (user_id);
  `);

  await db.query(`
    drop trigger if exists trg_ensure_health_day_for_body_comp on app.user_body_comp_garmin;
    create trigger trg_ensure_health_day_for_body_comp
    after insert or update on app.user_body_comp_garmin
    for each row execute function app.ensure_health_day_exists();

    drop trigger if exists update_user_body_comp_garmin_updated_at on app.user_body_comp_garmin;
    create trigger update_user_body_comp_garmin_updated_at
    before update on app.user_body_comp_garmin
    for each row execute function app.update_updated_at_column();
  `);

  // ----------------------------
  // user_activities_garmin table
  // ----------------------------
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
      average_heart_rate integer,
      max_heart_rate integer,
      average_run_cadence double precision,
      max_run_cadence double precision,
      average_bike_cadence double precision,
      max_bike_cadence double precision,
      average_swim_cadence double precision,
      average_push_cadence double precision,
      max_push_cadence double precision,
      average_speed double precision,
      max_speed double precision,
      average_pace double precision,
      max_pace double precision,
      active_kilocalories integer,
      distance_in_meters double precision,
      starting_latitude double precision,
      starting_longitude double precision,
      steps integer,
      pushes integer,
      total_elevation_gain double precision,
      total_elevation_loss double precision,
      number_of_active_lengths integer,
      device_name varchar(100),
      manual boolean,
      is_web_upload boolean,
      source varchar(50) not null default 'garmin',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (user_id, activity_id)
    );

    create index if not exists idx_user_activities_garmin_user_id
      on app.user_activities_garmin (user_id);

    create index if not exists idx_user_activities_garmin_start_time
      on app.user_activities_garmin (user_id, start_time_in_seconds);
  `);

  await db.query(`
    drop trigger if exists trg_ensure_health_day_for_activities on app.user_activities_garmin;
    create trigger trg_ensure_health_day_for_activities
    after insert or update on app.user_activities_garmin
    for each row execute function app.ensure_health_day_exists();

    drop trigger if exists update_user_activities_garmin_updated_at on app.user_activities_garmin;
    create trigger update_user_activities_garmin_updated_at
    before update on app.user_activities_garmin
    for each row execute function app.update_updated_at_column();
  `);

  await db.query(`
  create table if not exists app.user_sleeps_garmin (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    summary_id varchar(100),
    
    duration_in_seconds integer,
    total_nap_duration_in_seconds integer,
    start_time_in_seconds bigint,
    start_time_offset_in_seconds integer,
    unmeasurable_sleep_in_seconds integer,
    deep_sleep_in_seconds integer,
    light_sleep_in_seconds integer,
    rem_sleep_in_seconds integer,
    awake_duration_in_seconds integer,

    sleep_levels_map jsonb,
    time_offset_sleep_spo2 jsonb,
    time_offset_sleep_respiration jsonb,
    overall_sleep_score jsonb,
    sleep_scores jsonb,
    naps jsonb,
    validation varchar(50),

    source varchar(50) not null default 'garmin',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (user_id, day_date, summary_id)
  );

  create index if not exists idx_user_sleeps_garmin_user_day
    on app.user_sleeps_garmin(user_id, day_date);
`);

  await db.query(`
  drop trigger if exists trg_ensure_health_day_for_sleeps on app.user_sleeps_garmin;
  create trigger trg_ensure_health_day_for_sleeps
  after insert or update on app.user_sleeps_garmin
  for each row execute function app.ensure_health_day_exists();

  drop trigger if exists update_user_sleeps_garmin_updated_at on app.user_sleeps_garmin;
  create trigger update_user_sleeps_garmin_updated_at
  before update on app.user_sleeps_garmin
  for each row execute function app.update_updated_at_column();
`);

  // ----------------------------
  // Health stat triggers
  // ----------------------------
  // dailies -> heart_daily, activity_daily, stress_daily
  await db.query(`
    create or replace function app.update_health_stats_on_dailies()
    returns trigger as $$
    begin
      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      select new.user_id, new.day_date, 'garmin', 'heart_daily',
        jsonb_build_object(
          'hr_avg', new.avg_heart_rate,
          'hr_min', new.min_heart_rate,
          'hr_max', new.max_heart_rate,
          'rhr', new.resting_heart_rate
        )
      on conflict (user_id, day_date, kind)
      do update set data = EXCLUDED.data, updated_at = now();

      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      select new.user_id, new.day_date, 'garmin', 'activity_daily',
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
      select new.user_id, new.day_date, 'garmin', 'stress_daily',
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

  // respiration -> resp_daily
  await db.query(`
    create or replace function app.update_health_stats_on_respiration()
    returns trigger as $$
    declare
      avg_resp_rate double precision;
    begin
      select avg(value::double precision) into avg_resp_rate
      from jsonb_each_text(new.time_offset_epoch_to_breaths);

      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      values (
        new.user_id,
        new.day_date,
        'garmin',
        'resp_daily',
        jsonb_build_object('resp_rate', round(avg_resp_rate::numeric, 2))
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

  // sleeps -> sleep_daily
  await db.query(`
    create or replace function app.update_health_stats_on_sleeps()
    returns trigger as $$
    begin
      insert into app.health_stat_entries (user_id, day_date, source, kind, data)
      values (
        new.user_id,
        new.day_date,
        'garmin',
        'sleep_daily',
        jsonb_build_object(
          'duration_seconds', new.duration_in_seconds,
          'deep_seconds', new.deep_sleep_in_seconds,
          'light_seconds', new.light_sleep_in_seconds,
          'rem_seconds', new.rem_sleep_in_seconds,
          'awake_seconds', new.awake_duration_in_seconds
        )
      )
      on conflict (user_id, day_date, kind)
      do update set data = EXCLUDED.data, updated_at = now();

      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_update_health_stats_on_sleeps on app.user_sleeps_garmin;
    create trigger trg_update_health_stats_on_sleeps
    after insert or update on app.user_sleeps_garmin
    for each row execute function app.update_health_stats_on_sleeps();
  `);
}
