import { db } from "../../../db/db.js";

export async function saveOAuthState(
  state: string,
  verifier: string,
  userId: number,
) {
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  try {
    await db.query(
      `INSERT INTO app.oauth_states (state, user_id, verifier, expires_at, "user")
       VALUES ($1, $2, $3, $4, $5)`,
      [state, userId, verifier, expires, null], // or userId if you want
    );
    console.log("OAuth state saved:", { state, userId, expires });
  } catch (err) {
    console.error("Failed to save OAuth state:", err);
    throw err;
  }
}

export async function consumeOAuthState(state: string): Promise<{
  verifier: string;
  userId: number;
} | null> {
  try {
    const result = await db.query(
      `
      DELETE FROM app.oauth_states
      WHERE state = $1
      RETURNING verifier, user_id, expires_at
      `,
      [state],
    );

    console.log("consumeOAuthState result:", result.rows);

    if (result.rowCount === 0) return null;

    const { verifier, user_id, expires_at } = result.rows[0];

    if (new Date() > expires_at) return null;

    return { verifier, userId: user_id };
  } catch (err) {
    console.error("consumeOAuthState error:", err);
    throw err;
  }
}
