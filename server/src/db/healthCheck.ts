import { db } from "./db.js";

// checks if the database connection works
export async function dbOk() {
  const result = await db.query("select 1 as ok");
  return result.rows[0]?.ok === 1;
}
