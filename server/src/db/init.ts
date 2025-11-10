import { db } from "./db.js";

export async function ensureSchema() {
  // using own schema "app"
  await db.query(`
    create table if not exists app.users (
      id integer primary key generated always as identity,
      email varchar(255) unique not null,
      password varchar(255) not null
    );
  `);
}
