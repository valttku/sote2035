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
  
}
