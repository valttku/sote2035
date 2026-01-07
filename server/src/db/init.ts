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

  // create health-days index (used to show calendar dots for days with data)
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

  // store provider-agnostic health stats as raw JSON (for future Garmin/Polar integration)
  await db.query(`
  create table if not exists app.health_stat_entries (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,

    source varchar(50),         -- optional for now: 'garmin', 'polar'
    kind varchar(80) not null,  -- free text for now
    data jsonb not null,

    created_at timestamptz not null default now()
  );

  create index if not exists idx_health_stat_entries_user_day
    on app.health_stat_entries (user_id, day_date);
`);

  // keep health_days in sync: inserting health data auto-creates the day row
  await db.query(`
    create or replace function app.ensure_health_day_exists()
    returns trigger as $$
    begin
      insert into app.health_days (user_id, day_date)
      values (new.user_id, new.day_date)
      on conflict do nothing;
      return new;
    end;
    $$ language plpgsql;

    drop trigger if exists trg_ensure_health_day_exists on app.health_stat_entries;

    create trigger trg_ensure_health_day_exists
    after insert on app.health_stat_entries
    for each row
    execute function app.ensure_health_day_exists();
  `);

}
