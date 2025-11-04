import { Pool } from "pg";

const ssl =
  process.env.PGSSLMODE === "require" || process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

export const db = {
  query<T = any>(text: string, params?: any[]) {
    return pool.query<T>(text, params);
  },
};

export async function closeDb() {
  await pool.end();
}
