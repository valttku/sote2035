import { db } from "../../../db/db.js";

export async function saveOAuthState(
  state: string,
  verifier: string,
  userId: number,
) {
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await db.query(
    `INSERT INTO app.oauth_states (state, user_id, verifier, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [state, userId, verifier, expires],
  );
}

export async function consumeOAuthState(state: string): Promise<string | null> {
  const result = await db.query(
    `DELETE FROM app.oauth_states
     WHERE state = $1
     RETURNING verifier, expires_at`,
    [state],
  );

  if (result.rowCount === 0) return null;

  const { verifier, expires_at } = result.rows[0];
  if (new Date() > expires_at) return null;

  return verifier;
}
