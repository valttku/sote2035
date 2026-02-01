import { db } from "../db.js";

// This file contains DB queries related to activities tables in the database

export async function createActivitiesTables() {
  // create activities table in the database
  await db.query(`
create table if not exists app.activities (
    id uuid primary key default gen_random_uuid(),

    user_id integer not null references app.users(id) on delete cascade,
    day_date date not null,
    source varchar(32) not null,            -- 'garmin' | 'polar'

    type varchar(32) not null,              -- 'running', 'cycling', etc.
    start_time timestamptz not null,
    end_time timestamptz,
    duration_seconds integer,
    distance_meters double precision,
    calories double precision,
    steps integer,
    heart_rate_zones jsonb,
    inactive_seconds integer,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_activities_user_day
    on app.activities(user_id, day_date);

create index if not exists idx_activities_user_type
    on app.activities(user_id, type);
`);

  // automatically update activities.updated_at on every update
  await db.query(`
drop trigger if exists update_activities_updated_at on app.activities;

create trigger update_activities_updated_at
before update on app.activities
for each row
execute function app.update_updated_at_column();
`);

  // ensure health_days entry exists when inserting into activities
  await db.query(`
create or replace function app.ensure_health_day_exists_for_activity()
returns trigger as $$
begin
    insert into app.health_days(user_id, day_date)
    values (new.user_id, new.day_date)
    on conflict (user_id, day_date) do nothing;
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_ensure_health_day_exists_on_activities on app.activities;

create trigger trg_ensure_health_day_exists_on_activities
after insert or update on app.activities
for each row
execute function app.ensure_health_day_exists_for_activity();
`);
}
