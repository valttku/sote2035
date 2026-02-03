import { db } from "./db.js";
import { createGarminTables } from "./schema/garminTables.js";

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

  // Cleanup users garmin data when a user integration is deleted
  await db.query(`
  create or replace function app.cleanup_integration_data()
  returns trigger as $$
  begin
    -- Delete health data for this provider
    delete from app.user_dailies_garmin
    where user_id = old.user_id;
    
    delete from app.user_metrics_garmin
    where user_id = old.user_id;

    delete from app.user_hrv_garmin
    where user_id = old.user_id;

    delete from app.user_skin_temp_garmin
    where user_id = old.user_id;

    delete from app.user_sleep_garmin
    where user_id = old.user_id;

    delete from app.user_stress_garmin
    where user_id = old.user_id;

    delete from app.user_respiration_garmin
    where user_id = old.user_id;

    delete from app.user_body_comp_garmin
    where user_id = old.user_id;

    delete from app.user_activities_garmin
    where user_id = old.user_id;

    delete from app.user_move_iq_garmin
    where user_id = old.user_id;
    
    return old;
  end;
  $$ language plpgsql;

  drop trigger if exists trg_cleanup_integration_data on app.user_integrations;

  create trigger trg_cleanup_integration_data
  after delete on app.user_integrations
  for each row
  execute function app.cleanup_integration_data();
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
}
