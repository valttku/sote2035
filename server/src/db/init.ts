import { db } from "./db.js";

export async function ensureSchema() {
  // make sure the "app" schema exists
  await db.query(`
    create schema if not exists app;
  `);

  // enable pgcrypto (needed for gen_random_uuid() UUID defaults)
  await db.query(`
    create extension if not exists pgcrypto;
  `);

  // create users table (accounts)
  await db.query(`
    create table if not exists app.users (
      id integer primary key generated always as identity,
      email varchar(255) unique not null,
      password varchar(255) not null,
      display_name varchar(100),
      active_provider varchar(50), -- 'polar' | 'garmin' | null,

      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      last_login timestamptz
    );
  `);

  // automatically update users.updated_at on every update
  await db.query(`
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

  // create password reset tokens table (forgot/reset password flow)
  await db.query(`
    create table if not exists app.password_reset_tokens (
      token uuid primary key,
      user_id integer not null references app.users(id) on delete cascade,
      expires_at timestamptz not null
    );
  `);

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

  // create daily_health_metrics table. THIS IS WILL REPLACE health_stat_entries table LATER
  await db.query(`
  create table if not exists app.health_metrics_daily (
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

  create index if not exists idx_health_metrics_daily_user_day
    on app.health_metrics_daily (user_id, day_date);

  create index if not exists idx_health_metrics_daily_user_metric
    on app.health_metrics_daily (user_id, metric);
`);

  // ensure health_days entry exists when inserting/updating health_metrics_daily
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

  drop trigger if exists trg_ensure_health_day_exists_on_metrics on app.health_metrics_daily;

  create trigger trg_ensure_health_day_exists_on_metrics
  after insert or update on app.health_metrics_daily
  for each row
  execute function app.ensure_health_day_exists_for_metrics();
`);

  // create health_stat_entries table (will be replaced by health_metrics_daily later)
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
  await db.query(`
    create table if not exists app.oauth_states (
      state uuid primary key,
      user_id integer not null references app.users(id) on delete cascade,
      expires_at timestamptz not null
    );

    create index if not exists idx_oauth_states_expires_at
      on app.oauth_states (expires_at);
  `);
}
