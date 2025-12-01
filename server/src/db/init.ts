import { db } from "./db.js";

export async function ensureSchema() {

  // create users table
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

  // update updated_at on every row update
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

  // sessions table
  await db.query(`
    create table if not exists app.sessions (
      id uuid primary key default gen_random_uuid(),
      user_id integer not null references app.users(id) on delete cascade,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null
    );
  `);

  // password reset tokens
  await db.query(`
    create table if not exists app.password_reset_tokens (
      token uuid primary key,
      user_id integer not null references app.users(id) on delete cascade,
      expires_at timestamptz not null
    );
  `);
}
